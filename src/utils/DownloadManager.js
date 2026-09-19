/**
 * Nexplay Download Manager Engine
 * 
 * Powered by expo-file-system/legacy with full resumable background downloading,
 * progress tracking, pause/resume, persistent metadata, and offline playback support.
 */

import * as FileSystem from 'expo-file-system/legacy';

const DOWNLOADS_DIR = `${FileSystem.documentDirectory}downloads/`;
const METADATA_FILE = `${FileSystem.documentDirectory}downloads_metadata.json`;

class DownloadManagerService {
  constructor() {
    this.downloads = [];
    this.activeTasks = new Map(); // id -> DownloadResumable
    this.globalListeners = new Set();
    this.progressListeners = new Map(); // id -> Set<callback>
    this.isInitialized = false;
    this.lastSaveTime = 0;
  }

  async init() {
    if (this.isInitialized) return;
    try {
      // 1. Ensure download directory exists
      const dirInfo = await FileSystem.getInfoAsync(DOWNLOADS_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(DOWNLOADS_DIR, { intermediates: true });
      }

      // 2. Load persisted downloads metadata
      const metaInfo = await FileSystem.getInfoAsync(METADATA_FILE);
      if (metaInfo.exists) {
        const jsonStr = await FileSystem.readAsStringAsync(METADATA_FILE);
        if (jsonStr && jsonStr.trim()) {
          const loaded = JSON.parse(jsonStr);
          if (Array.isArray(loaded)) {
            // Any download that was in 'downloading' state when app quit is marked as 'paused'
            this.downloads = loaded.map(item => {
              if (item.status === 'downloading') {
                return { ...item, status: 'paused' };
              }
              return item;
            });
          }
        }
      }
      this.isInitialized = true;
      this.notifyGlobal();
    } catch (err) {
      console.warn('[DownloadManager] Init error:', err);
      this.downloads = [];
      this.isInitialized = true;
    }
  }

  // Subscribe to all downloads list changes
  subscribe(callback) {
    this.globalListeners.add(callback);
    callback(this.downloads);
    return () => {
      this.globalListeners.delete(callback);
    };
  }

  // Subscribe to real-time progress of a specific download
  subscribeProgress(id, callback) {
    if (!this.progressListeners.has(id)) {
      this.progressListeners.set(id, new Set());
    }
    this.progressListeners.get(id).add(callback);
    const item = this.getDownload(id);
    if (item) {
      callback({
        progress: item.progress || 0,
        percentage: item.percentage || 0,
        downloadedBytes: item.downloadedBytes || 0,
        totalBytes: item.totalBytes || 0,
        status: item.status
      });
    }
    return () => {
      const set = this.progressListeners.get(id);
      if (set) {
        set.delete(callback);
        if (set.size === 0) this.progressListeners.delete(id);
      }
    };
  }

  notifyGlobal() {
    const listCopy = [...this.downloads];
    this.globalListeners.forEach(cb => {
      try { cb(listCopy); } catch (_) {}
    });
  }

  notifyProgress(id, data) {
    const set = this.progressListeners.get(id);
    if (set) {
      set.forEach(cb => {
        try { cb(data); } catch (_) {}
      });
    }
  }

  async saveMetadata(force = false) {
    const now = Date.now();
    if (!force && now - this.lastSaveTime < 1500) return;
    this.lastSaveTime = now;
    try {
      await FileSystem.writeAsStringAsync(METADATA_FILE, JSON.stringify(this.downloads));
    } catch (err) {
      console.warn('[DownloadManager] Error saving metadata:', err);
    }
  }

  getDownloads() {
    return [...this.downloads];
  }

  getDownload(id) {
    return this.downloads.find(d => d.id === id);
  }

  formatBytes(bytes, decimals = 1) {
    if (!bytes || bytes <= 0) return '0 MB';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  /**
   * Start or queue a new download
   */
  async startDownload({
    id,
    mediaId,
    title,
    subtitle,
    poster,
    quality,
    size,
    streamUrl,
    headers = {},
    mimeType = 'video/mp4',
    server = 'Server'
  }) {
    await this.init();
    if (!streamUrl) throw new Error('Valid stream URL is required for download.');

    // 1. Check if download already exists
    let existing = this.getDownload(id);
    if (existing) {
      if (existing.status === 'completed') {
        const fileCheck = await FileSystem.getInfoAsync(existing.fileUri);
        if (fileCheck.exists) {
          return existing;
        }
      } else if (existing.status === 'paused') {
        return this.resumeDownload(id);
      } else if (existing.status === 'downloading') {
        return existing;
      }
    }

    // 2. Generate safe local file name
    const sanitizedTitle = (title || 'video')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 35);
    const ext = streamUrl.toLowerCase().includes('.mkv') ? 'mkv' : 'mp4';
    const localFileName = `${sanitizedTitle}_${quality || '1080p'}_${Date.now()}.${ext}`;
    const localFileUri = `${DOWNLOADS_DIR}${localFileName}`;

    const downloadItem = {
      id,
      mediaId,
      title,
      subtitle: subtitle || '',
      poster: poster || '',
      quality: quality || '1080p',
      qualityLabel: quality === '4k' ? '4K Ultra HD' : (quality === '1080p' ? '1080p Full HD' : (quality === '720p' ? '720p HD' : '480p SD')),
      size: size || '1.5 GB',
      totalBytes: 0,
      downloadedBytes: 0,
      progress: 0,
      percentage: 0,
      status: 'downloading',
      streamUrl,
      fileUri: localFileUri,
      fileName: localFileName,
      mimeType,
      server,
      resumeData: null,
      createdAt: Date.now(),
      completedAt: null,
      error: null
    };

    if (existing) {
      Object.assign(existing, downloadItem);
    } else {
      this.downloads.unshift(downloadItem);
    }
    this.notifyGlobal();
    await this.saveMetadata(true);

    // 3. Setup createDownloadResumable
    const downloadHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      ...headers
    };

    const progressCallback = (data) => {
      const { totalBytesWritten, totalBytesExpectedToWrite } = data;
      const progress = totalBytesExpectedToWrite > 0 ? totalBytesWritten / totalBytesExpectedToWrite : 0;
      const percentage = Math.min(100, Math.max(0, Math.round(progress * 100)));

      downloadItem.downloadedBytes = totalBytesWritten;
      if (totalBytesExpectedToWrite > 0) {
        downloadItem.totalBytes = totalBytesExpectedToWrite;
        downloadItem.size = this.formatBytes(totalBytesExpectedToWrite);
      }
      downloadItem.progress = progress;
      downloadItem.percentage = percentage;

      this.notifyProgress(id, {
        progress,
        percentage,
        downloadedBytes: totalBytesWritten,
        totalBytes: totalBytesExpectedToWrite,
        status: downloadItem.status
      });

      this.saveMetadata(false);
    };

    try {
      const task = FileSystem.createDownloadResumable(
        streamUrl,
        localFileUri,
        { headers: downloadHeaders },
        progressCallback
      );

      this.activeTasks.set(id, task);

      task.downloadAsync()
        .then(async (result) => {
          this.activeTasks.delete(id);
          if (result && result.uri) {
            downloadItem.status = 'completed';
            downloadItem.progress = 1;
            downloadItem.percentage = 100;
            downloadItem.completedAt = Date.now();
            downloadItem.fileUri = result.uri;
            const finalCheck = await FileSystem.getInfoAsync(result.uri);
            if (finalCheck.exists && finalCheck.size) {
              downloadItem.totalBytes = finalCheck.size;
              downloadItem.downloadedBytes = finalCheck.size;
              downloadItem.size = this.formatBytes(finalCheck.size);
            }
          } else {
            downloadItem.status = 'completed';
          }
          this.notifyGlobal();
          this.notifyProgress(id, {
            progress: 1,
            percentage: 100,
            status: 'completed'
          });
          await this.saveMetadata(true);
        })
        .catch(async (err) => {
          this.activeTasks.delete(id);
          // If task was paused or canceled deliberately, ignore error
          if (downloadItem.status === 'paused' || downloadItem.status === 'completed') return;
          console.warn(`[DownloadManager] Download failed for ${id}:`, err?.message || err);
          downloadItem.status = 'failed';
          downloadItem.error = err?.message || 'Download failed';
          this.notifyGlobal();
          this.notifyProgress(id, { status: 'failed', error: downloadItem.error });
          await this.saveMetadata(true);
        });

      return downloadItem;
    } catch (err) {
      console.warn(`[DownloadManager] Setup task error for ${id}:`, err);
      downloadItem.status = 'failed';
      downloadItem.error = err?.message || 'Setup task error';
      this.notifyGlobal();
      await this.saveMetadata(true);
      throw err;
    }
  }

  /**
   * Pause an active download
   */
  async pauseDownload(id) {
    const item = this.getDownload(id);
    if (!item || item.status !== 'downloading') return;

    const task = this.activeTasks.get(id);
    if (task) {
      try {
        const pauseResult = await task.pauseAsync();
        item.resumeData = pauseResult?.resumeData || null;
      } catch (err) {
        console.warn(`[DownloadManager] Pause error for ${id}:`, err);
      } finally {
        this.activeTasks.delete(id);
      }
    }

    item.status = 'paused';
    this.notifyGlobal();
    this.notifyProgress(id, {
      progress: item.progress,
      percentage: item.percentage,
      status: 'paused'
    });
    await this.saveMetadata(true);
  }

  /**
   * Resume a paused download
   */
  async resumeDownload(id) {
    const item = this.getDownload(id);
    if (!item || item.status === 'downloading' || item.status === 'completed') return;

    item.status = 'downloading';
    item.error = null;
    this.notifyGlobal();
    this.notifyProgress(id, {
      progress: item.progress,
      percentage: item.percentage,
      status: 'downloading'
    });

    const progressCallback = (data) => {
      const { totalBytesWritten, totalBytesExpectedToWrite } = data;
      const progress = totalBytesExpectedToWrite > 0 ? totalBytesWritten / totalBytesExpectedToWrite : 0;
      const percentage = Math.min(100, Math.max(0, Math.round(progress * 100)));

      item.downloadedBytes = totalBytesWritten;
      if (totalBytesExpectedToWrite > 0) {
        item.totalBytes = totalBytesExpectedToWrite;
        item.size = this.formatBytes(totalBytesExpectedToWrite);
      }
      item.progress = progress;
      item.percentage = percentage;

      this.notifyProgress(id, {
        progress,
        percentage,
        downloadedBytes: totalBytesWritten,
        totalBytes: totalBytesExpectedToWrite,
        status: 'downloading'
      });

      this.saveMetadata(false);
    };

    try {
      const task = FileSystem.createDownloadResumable(
        item.streamUrl,
        item.fileUri,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
          }
        },
        progressCallback,
        item.resumeData
      );

      this.activeTasks.set(id, task);

      task.resumeAsync()
        .then(async (result) => {
          this.activeTasks.delete(id);
          if (result && result.uri) {
            item.status = 'completed';
            item.progress = 1;
            item.percentage = 100;
            item.completedAt = Date.now();
            item.fileUri = result.uri;
            const finalCheck = await FileSystem.getInfoAsync(result.uri);
            if (finalCheck.exists && finalCheck.size) {
              item.totalBytes = finalCheck.size;
              item.downloadedBytes = finalCheck.size;
              item.size = this.formatBytes(finalCheck.size);
            }
          }
          this.notifyGlobal();
          this.notifyProgress(id, {
            progress: 1,
            percentage: 100,
            status: 'completed'
          });
          await this.saveMetadata(true);
        })
        .catch(async (err) => {
          this.activeTasks.delete(id);
          if (item.status === 'paused' || item.status === 'completed') return;
          console.warn(`[DownloadManager] Resume failed for ${id}:`, err);
          item.status = 'failed';
          item.error = err?.message || 'Resume failed';
          this.notifyGlobal();
          this.notifyProgress(id, { status: 'failed', error: item.error });
          await this.saveMetadata(true);
        });
    } catch (err) {
      console.warn(`[DownloadManager] Resume creation error for ${id}:`, err);
      item.status = 'failed';
      item.error = err?.message || 'Resume failed';
      this.notifyGlobal();
      await this.saveMetadata(true);
    }
  }

  /**
   * Cancel and delete an in-progress or paused download
   */
  async cancelDownload(id) {
    const item = this.getDownload(id);
    const task = this.activeTasks.get(id);
    if (task) {
      try { await task.cancelAsync(); } catch (_) {}
      this.activeTasks.delete(id);
    }

    if (item && item.fileUri) {
      try {
        await FileSystem.deleteAsync(item.fileUri, { idempotent: true });
      } catch (_) {}
    }

    this.downloads = this.downloads.filter(d => d.id !== id);
    this.notifyGlobal();
    this.notifyProgress(id, { status: 'canceled' });
    await this.saveMetadata(true);
  }

  /**
   * Delete a completed download from disk and library
   */
  async deleteDownload(id) {
    const item = this.getDownload(id);
    if (item && item.fileUri) {
      try {
        await FileSystem.deleteAsync(item.fileUri, { idempotent: true });
      } catch (err) {
        console.warn(`[DownloadManager] File delete error for ${id}:`, err);
      }
    }
    this.downloads = this.downloads.filter(d => d.id !== id);
    this.notifyGlobal();
    await this.saveMetadata(true);
  }

  /**
   * Get storage usage summary
   */
  getTotalStorageBytes() {
    return this.downloads
      .filter(d => d.status === 'completed')
      .reduce((acc, curr) => acc + (curr.totalBytes || curr.downloadedBytes || 0), 0);
  }

  getFormattedStorage() {
    return this.formatBytes(this.getTotalStorageBytes());
  }
}

export const DownloadManager = new DownloadManagerService();
