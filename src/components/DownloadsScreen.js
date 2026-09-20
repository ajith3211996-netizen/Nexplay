import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from '../utils/responsive';
import { DownloadManager } from '../utils/DownloadManager';

export default function DownloadsScreen({ onBack, onPlayOffline }) {
  const [downloads, setDownloads] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'downloading' | 'completed'

  useEffect(() => {
    // Subscribe to downloads store
    const unsubscribe = DownloadManager.subscribe((items) => {
      setDownloads(items);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handlePause = async (id) => {
    await DownloadManager.pauseDownload(id);
  };

  const handleResume = async (id) => {
    await DownloadManager.resumeDownload(id);
  };

  const handleCancel = (item) => {
    Alert.alert(
      'Cancel Download',
      `Cancel download for "${item.title}"?`,
      [
        { text: 'Keep', style: 'cancel' },
        { 
          text: 'Cancel & Delete', 
          style: 'destructive',
          onPress: async () => {
            await DownloadManager.cancelDownload(item.id);
          }
        }
      ]
    );
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Delete Download',
      `Remove "${item.title}" from your device? This will free up storage.`,
      [
        { text: 'Keep', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await DownloadManager.deleteDownload(item.id);
          }
        }
      ]
    );
  };

  // Filter items
  const filteredDownloads = downloads.filter((item) => {
    if (activeFilter === 'downloading') {
      return item.status === 'downloading' || item.status === 'paused';
    }
    if (activeFilter === 'completed') {
      return item.status === 'completed';
    }
    return true;
  });

  // Calculate total offline storage used
  const totalStorageBytes = downloads
    .filter(d => d.status === 'completed')
    .reduce((acc, curr) => acc + (curr.totalBytes || 0), 0);

  const downloadingCount = downloads.filter(d => d.status === 'downloading' || d.status === 'paused').length;
  const completedCount = downloads.filter(d => d.status === 'completed').length;

  const renderDownloadItem = ({ item }) => {
    const isCompleted = item.status === 'completed';
    const isPaused = item.status === 'paused';
    const isDownloading = item.status === 'downloading';
    const progressPct = Math.round((item.progress || 0) * 100);

    const downloadedStr = DownloadManager.formatBytes(item.downloadedBytes || 0);
    const totalStr = item.size || (item.totalBytes ? DownloadManager.formatBytes(item.totalBytes) : 'Unknown');

    return (
      <View style={styles.cardContainer}>
        {/* Thumbnail with quality badge */}
        <View style={styles.thumbnailWrapper}>
          {item.poster ? (
            <Image 
              source={{ uri: item.poster }} 
              style={styles.thumbnail} 
              resizeMode="cover" 
            />
          ) : (
            <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
              <Ionicons name="film-outline" size={scale(26)} color="#71717a" />
            </View>
          )}

          {/* Quality Pill */}
          <View style={styles.qualityBadge}>
            <Text style={styles.qualityBadgeText}>{(item.quality || 'HD').toUpperCase()}</Text>
          </View>
        </View>

        {/* Content details */}
        <View style={styles.cardContent}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.title}
          </Text>

          {item.subtitle ? (
            <Text style={styles.itemSubtitle} numberOfLines={1}>
              {item.subtitle}
            </Text>
          ) : null}

          {/* Progress / Status Meta */}
          {isCompleted ? (
            <View style={styles.metaRow}>
              <View style={styles.readyBadge}>
                <Ionicons name="checkmark-circle" size={scale(13)} color="#22c55e" />
                <Text style={styles.readyBadgeText}>Offline Ready</Text>
              </View>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaSize}>{totalStr}</Text>
            </View>
          ) : (
            <View style={styles.progressContainer}>
              {/* Progress Bar */}
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${Math.min(Math.max(progressPct, 4), 100)}%`,
                      backgroundColor: isPaused ? '#eab308' : '#38bdf8' 
                    }
                  ]} 
                />
              </View>

              {/* Progress Text */}
              <View style={styles.progressMetaRow}>
                <Text style={styles.progressPctText}>
                  {isPaused ? 'Paused' : `${progressPct}%`}
                </Text>
                <Text style={styles.progressBytesText}>
                  {downloadedStr} / {totalStr}
                </Text>
              </View>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionRow}>
            {isCompleted ? (
              <>
                <TouchableOpacity
                  style={styles.playOfflineButton}
                  activeOpacity={0.8}
                  onPress={() => onPlayOffline && onPlayOffline(item)}
                >
                  <Ionicons name="play" size={scale(14)} color="#09090b" />
                  <Text style={styles.playOfflineText}>Play Offline</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteIconButton}
                  activeOpacity={0.7}
                  onPress={() => handleDelete(item)}
                >
                  <Ionicons name="trash-outline" size={scale(16)} color="#ef4444" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                {isDownloading ? (
                  <TouchableOpacity
                    style={styles.controlPillButton}
                    activeOpacity={0.8}
                    onPress={() => handlePause(item.id)}
                  >
                    <Ionicons name="pause" size={scale(13)} color="#ffffff" />
                    <Text style={styles.controlPillText}>Pause</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.controlPillButton, styles.resumePillButton]}
                    activeOpacity={0.8}
                    onPress={() => handleResume(item.id)}
                  >
                    <Ionicons name="play" size={scale(13)} color="#ffffff" />
                    <Text style={styles.controlPillText}>Resume</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.cancelIconButton}
                  activeOpacity={0.7}
                  onPress={() => handleCancel(item)}
                >
                  <Ionicons name="close" size={scale(16)} color="#94a3b8" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={scale(22)} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Offline Downloads</Text>
          <Text style={styles.headerSubtitle}>Saved directly to your device</Text>
        </View>

        {/* Storage footprint badge */}
        <View style={styles.storageBadge}>
          <Ionicons name="hardware-chip-outline" size={scale(13)} color="#38bdf8" />
          <Text style={styles.storageBadgeText}>
            {DownloadManager.formatBytes(totalStorageBytes)}
          </Text>
        </View>
      </View>

      {/* Filter Tabs (All / Downloading / Completed) */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeFilter === 'all' && styles.tabButtonActive]}
          onPress={() => setActiveFilter('all')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeFilter === 'all' && styles.tabTextActive]}>
            All ({downloads.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeFilter === 'downloading' && styles.tabButtonActive]}
          onPress={() => setActiveFilter('downloading')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeFilter === 'downloading' && styles.tabTextActive]}>
            Active ({downloadingCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeFilter === 'completed' && styles.tabButtonActive]}
          onPress={() => setActiveFilter('completed')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeFilter === 'completed' && styles.tabTextActive]}>
            Ready ({completedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Downloads List */}
      <FlatList
        data={filteredDownloads}
        keyExtractor={(item) => item.id}
        renderItem={renderDownloadItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="cloud-download-outline" size={scale(48)} color="#38bdf8" />
            </View>
            <Text style={styles.emptyTitle}>
              {activeFilter === 'downloading' 
                ? 'No Active Downloads' 
                : (activeFilter === 'completed' ? 'No Completed Downloads' : 'No Downloads Yet')}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'downloading'
                ? 'Downloads in progress or paused will appear here.'
                : 'Movies & TV episodes you download will appear here for fast offline playback with zero internet.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(44),
    paddingBottom: verticalScale(14),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: scale(12),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: moderateScale(12),
    color: '#94a3b8',
    marginTop: verticalScale(1),
  },
  storageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: scale(9),
    paddingVertical: verticalScale(5),
    borderRadius: scale(12),
    gap: scale(4),
  },
  storageBadgeText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#38bdf8',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    gap: scale(8),
  },
  tabButton: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(7),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
  },
  tabText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(30),
  },
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: '#18181b',
    borderRadius: scale(14),
    padding: scale(12),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  thumbnailWrapper: {
    position: 'relative',
    width: scale(75),
    height: scale(105),
    borderRadius: scale(8),
    overflow: 'hidden',
    backgroundColor: '#27272a',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualityBadge: {
    position: 'absolute',
    top: scale(4),
    left: scale(4),
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: scale(5),
    paddingVertical: verticalScale(2),
    borderRadius: scale(4),
  },
  qualityBadgeText: {
    fontSize: moderateScale(9),
    fontWeight: '800',
    color: '#38bdf8',
  },
  cardContent: {
    flex: 1,
    marginLeft: scale(12),
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#ffffff',
  },
  itemSubtitle: {
    fontSize: moderateScale(12),
    color: '#94a3b8',
    marginTop: verticalScale(2),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(4),
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  readyBadgeText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#22c55e',
  },
  metaDot: {
    color: '#71717a',
    marginHorizontal: scale(6),
    fontSize: moderateScale(11),
  },
  metaSize: {
    fontSize: moderateScale(11),
    color: '#a1a1aa',
  },
  progressContainer: {
    marginTop: verticalScale(6),
  },
  progressBarBackground: {
    height: verticalScale(5),
    backgroundColor: '#27272a',
    borderRadius: scale(3),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: scale(3),
  },
  progressMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: verticalScale(4),
  },
  progressPctText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#e2e8f0',
  },
  progressBytesText: {
    fontSize: moderateScale(10),
    color: '#94a3b8',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: verticalScale(8),
    gap: scale(10),
  },
  playOfflineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(16),
    gap: scale(5),
  },
  playOfflineText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#09090b',
  },
  deleteIconButton: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    paddingHorizontal: scale(11),
    paddingVertical: verticalScale(6),
    borderRadius: scale(14),
    gap: scale(5),
  },
  resumePillButton: {
    backgroundColor: '#0284c7',
  },
  controlPillText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelIconButton: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: verticalScale(80),
    paddingHorizontal: scale(32),
  },
  emptyIconCircle: {
    width: scale(86),
    height: scale(86),
    borderRadius: scale(43),
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(16),
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  emptyTitle: {
    fontSize: moderateScale(17),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: verticalScale(6),
  },
  emptySubtitle: {
    fontSize: moderateScale(13),
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: moderateScale(19),
  },
});
