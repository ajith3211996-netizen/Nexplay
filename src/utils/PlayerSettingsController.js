/**
 * PlayerSettingsController.js
 * 
 * Clean engine-aware abstraction controller for:
 * - LibVLC Player
 * - AndroidX Media3 / ExoPlayer
 * 
 * Prevents VLC from accidentally calling Media3 APIs and vice versa.
 */

export class PlayerSettingsController {
  constructor(engineType, options = {}) {
    this.engineType = engineType; // 'vlc' | 'media3'
    this.options = options;
  }

  isVlc() {
    return this.engineType === 'vlc';
  }

  isMedia3() {
    return this.engineType === 'media3';
  }

  getAudioTracks() {
    if (this.isVlc()) {
      return this.options.vlcAudioTracks || [];
    }
    return this.options.media3AudioTracks || [];
  }

  getSubtitleTracks() {
    if (this.isVlc()) {
      return this.options.vlcSubtitleTracks || [];
    }
    return this.options.media3SubtitleTracks || [];
  }

  selectAudioTrack(track) {
    if (!track) return;
    if (this.isVlc()) {
      if (typeof this.options.onSelectVlcAudio === 'function') {
        this.options.onSelectVlcAudio(track);
      }
    } else {
      if (typeof this.options.onSelectMedia3Audio === 'function') {
        this.options.onSelectMedia3Audio(track);
      }
    }
  }

  selectSubtitleTrack(track) {
    if (this.isVlc()) {
      if (typeof this.options.onSelectVlcSubtitle === 'function') {
        this.options.onSelectVlcSubtitle(track);
      }
    } else {
      if (typeof this.options.onSelectMedia3Subtitle === 'function') {
        this.options.onSelectMedia3Subtitle(track);
      }
    }
  }

  disableSubtitles() {
    if (this.isVlc()) {
      if (typeof this.options.onDisableVlcSubtitles === 'function') {
        this.options.onDisableVlcSubtitles();
      }
    } else {
      if (typeof this.options.onDisableMedia3Subtitles === 'function') {
        this.options.onDisableMedia3Subtitles();
      }
    }
  }
}
