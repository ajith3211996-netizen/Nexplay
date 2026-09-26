import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import VLCPlayerView from '@lunarr/vlc-player';
import * as ScreenOrientation from 'expo-screen-orientation';
import { scale, verticalScale, moderateScale } from '../utils/responsive';
import {
  SERVERS,
  CHANNELS,
  getCachedSerialsForServer,
  findSerial
} from '../utils/TvSerialsMetadataCache';

const { width: windowWidth } = Dimensions.get('window');

// Channel Logo component with latest official branding + reliable fallback
function ChannelLogo({ channelCode, size = scale(16), style }) {
  const channel = CHANNELS.find(c => c.code === channelCode || c.id === channelCode);
  const [hasError, setHasError] = useState(false);

  if (channel && channel.logoUrl && !hasError) {
    return (
      <Image
        source={{ uri: channel.logoUrl }}
        style={[{ width: size, height: size, resizeMode: 'contain' }, style]}
        onError={() => setHasError(true)}
      />
    );
  }

  switch (channelCode) {
    case 'sun':
      return <Ionicons name="sunny" size={size} color="#f59e0b" style={style} />;
    case 'vijay':
      return <FontAwesome5 name="star" size={size * 0.85} color="#ef4444" style={style} />;
    case 'zee':
      return <MaterialCommunityIcons name="weather-sunset-up" size={size} color="#a855f7" style={style} />;
    case 'ktv':
      return <Ionicons name="film" size={size} color="#0ea5e9" style={style} />;
    default:
      return <Ionicons name="tv" size={size} color="#3b82f6" style={style} />;
  }
}

export default function TvSerialsScreen() {
  // Step 1: Active Server (Server 1: Tamildhool vs Server 2: Tamilgun)
  const [activeServerId, setActiveServerId] = useState('tamildhool');
  const activeServer = SERVERS.find(s => s.id === activeServerId) || SERVERS[0];

  // Serials for selected server
  const allServerSerials = useMemo(() => {
    return getCachedSerialsForServer(activeServerId);
  }, [activeServerId]);

  // Step 2: Selected Serial
  const [selectedSerial, setSelectedSerial] = useState(allServerSerials[0]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Keep selected serial in sync when server changes
  useEffect(() => {
    const list = getCachedSerialsForServer(activeServerId);
    if (list && list.length > 0) {
      setSelectedSerial(list[0]);
    }
  }, [activeServerId]);

  // Step 3: Calendar Date Picker State
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date(2026, 8, 25)); // Sep 25, 2026
  const [selectedDay, setSelectedDay] = useState(25);

  // In-Screen VLC Player State (DO NOT jump to movie details screen)
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerActive, setIsPlayerActive] = useState(false);
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const vlcPlayerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Pulse animation for Client Decryptor Engine node
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Calendar Helpers for Step 3
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const monthName = currentCalendarDate.toLocaleString('default', { month: 'short' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday

  const prevMonth = () => {
    setCurrentCalendarDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentCalendarDate(new Date(year, month + 1, 1));
  };

  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push({ day: null, key: `empty-${i}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({ day: d, key: `day-${d}` });
  }

  // Filter serials in dropdown by search query
  const filteredDropdownSerials = useMemo(() => {
    if (!searchQuery.trim()) return allServerSerials;
    const q = searchQuery.toLowerCase().trim();
    return allServerSerials.filter(
      s => s.title.toLowerCase().includes(q) ||
           (s.tamilTitle && s.tamilTitle.includes(q)) ||
           s.channel.toLowerCase().includes(q)
    );
  }, [allServerSerials, searchQuery]);

  // Handle Play Episode directly inside TV Serials (No jump to Movie Details)
  const handlePlayEpisode = (dayNum = selectedDay) => {
    setSelectedDay(dayNum);
    setIsLoadingStream(true);
    setIsPlayerActive(true);
    setIsPlaying(true);

    // Auto-hide stream loader after brief decryptor sync
    setTimeout(() => {
      setIsLoadingStream(false);
    }, 600);
  };

  // Fullscreen toggle handler
  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      setIsFullscreen(true);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      setIsFullscreen(false);
    }
  };

  const handleSeek = (delta) => {
    if (!vlcPlayerRef.current || playbackDuration <= 0) return;
    const newTime = Math.max(0, Math.min(playbackDuration, playbackTime + delta));
    const targetPos = newTime / playbackDuration;
    vlcPlayerRef.current.seek(targetPos);
    setPlaybackTime(newTime);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Active Stream Source
  const activeStreamSource = useMemo(() => {
    if (!selectedSerial) return null;
    return {
      uri: selectedSerial.streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      initOptions: [
        '--network-caching=1500',
        '--live-caching=1500',
        '--drop-late-frames',
        '--skip-frames'
      ]
    };
  }, [selectedSerial, activeServerId, selectedDay]);

  return (
    <View style={styles.screenWrapper}>
      <StatusBar barStyle="light-content" backgroundColor="#080c14" />

      {/* FULLSCREEN VIDEO PLAYER MODAL */}
      {isFullscreen && isPlayerActive && (
        <Modal visible={isFullscreen} transparent={false} animationType="none">
          <View style={styles.fullscreenContainer}>
            <VLCPlayerView
              ref={vlcPlayerRef}
              source={activeStreamSource}
              autoplay={true}
              paused={!isPlaying}
              style={StyleSheet.absoluteFill}
              onProgress={(event) => {
                setPlaybackTime(event.currentTime / 1000);
                if (event.duration > 0) setPlaybackDuration(event.duration / 1000);
              }}
            />

            {/* Fullscreen Overlay Controls */}
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setShowControls(prev => !prev)}
            >
              {showControls && (
                <View style={styles.fullscreenControls}>
                  <View style={styles.fullscreenTopBar}>
                    <TouchableOpacity onPress={toggleFullscreen} style={styles.playerTopBtn}>
                      <Ionicons name="arrow-back" size={scale(22)} color="#ffffff" />
                    </TouchableOpacity>
                    <Text style={styles.fullscreenTitle} numberOfLines={1}>
                      {selectedSerial?.title} • {selectedDay} {monthName} ({activeServer.shortName})
                    </Text>
                  </View>

                  <View style={styles.fullscreenCenterControls}>
                    <TouchableOpacity onPress={() => handleSeek(-10)} style={styles.seekBtn}>
                      <Ionicons name="play-back" size={scale(28)} color="#ffffff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setIsPlaying(prev => !prev)}
                      style={styles.mainPlayBtn}
                    >
                      <Ionicons name={isPlaying ? 'pause' : 'play'} size={scale(36)} color="#ffffff" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleSeek(10)} style={styles.seekBtn}>
                      <Ionicons name="play-forward" size={scale(28)} color="#ffffff" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.fullscreenBottomBar}>
                    <Text style={styles.timeText}>{formatTime(playbackTime)}</Text>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${playbackDuration > 0 ? (playbackTime / playbackDuration) * 100 : 0}%` }
                        ]}
                      />
                    </View>
                    <Text style={styles.timeText}>{formatTime(playbackDuration)}</Text>
                    <TouchableOpacity onPress={toggleFullscreen} style={{ marginLeft: scale(10) }}>
                      <Ionicons name="contract" size={scale(20)} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Modal>
      )}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================== */}
        {/* TOP HERO CONTAINER: IN-SCREEN VLC PLAYER OR DECRYPTOR STATUS NODES */}
        {/* ============================================================== */}
        <View style={styles.heroSection}>
          {isPlayerActive ? (
            /* Live In-Screen VLC Player (No jump to Movie Details!) */
            <View style={styles.playerBox}>
              <VLCPlayerView
                ref={vlcPlayerRef}
                source={activeStreamSource}
                autoplay={true}
                paused={!isPlaying}
                style={StyleSheet.absoluteFill}
                onProgress={(event) => {
                  setPlaybackTime(event.currentTime / 1000);
                  if (event.duration > 0) setPlaybackDuration(event.duration / 1000);
                }}
              />

              {isLoadingStream && (
                <View style={styles.loaderOverlay}>
                  <ActivityIndicator size="large" color="#38bdf8" />
                  <Text style={styles.loaderText}>Decrypting {activeServer.shortName} Stream...</Text>
                </View>
              )}

              {/* Player Top Overlay Info Bar */}
              <View style={styles.playerOverlayTop}>
                <View style={styles.playerServerBadge}>
                  <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
                  <Text style={styles.playerServerBadgeText}>
                    {activeServer.shortName} • {selectedDay} {monthName}
                  </Text>
                </View>

                <View style={styles.playerTopActions}>
                  <TouchableOpacity
                    style={styles.playerIconButton}
                    onPress={toggleFullscreen}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="expand" size={scale(16)} color="#ffffff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.playerIconButton, { marginLeft: scale(6) }]}
                    onPress={() => {
                      setIsPlaying(false);
                      setIsPlayerActive(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={scale(16)} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Player Bottom Control Bar */}
              <View style={styles.playerOverlayBottom}>
                <TouchableOpacity
                  onPress={() => setIsPlaying(prev => !prev)}
                  style={styles.miniPlayBtn}
                >
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={scale(16)} color="#ffffff" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleSeek(-10)} style={{ marginHorizontal: scale(8) }}>
                  <Ionicons name="play-back" size={scale(16)} color="#cbd5e1" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleSeek(10)} style={{ marginRight: scale(10) }}>
                  <Ionicons name="play-forward" size={scale(16)} color="#cbd5e1" />
                </TouchableOpacity>

                <View style={styles.miniProgressBarBg}>
                  <View
                    style={[
                      styles.miniProgressBarFill,
                      { width: `${playbackDuration > 0 ? (playbackTime / playbackDuration) * 100 : 0}%` }
                    ]}
                  />
                </View>

                <Text style={styles.miniTimeText}>
                  {formatTime(playbackTime)} / {formatTime(playbackDuration)}
                </Text>
              </View>
            </View>
          ) : (
            /* Screenshot-matched 3 Status Circles Hero */
            <LinearGradient
              colors={['#080b14', '#0d1322', '#090d18']}
              style={styles.nodesHeroGradient}
            >
              <View style={styles.nodesRow}>
                {/* Node 1: Tamil Server Source */}
                <View style={styles.nodeItem}>
                  <View style={styles.nodeCircle}>
                    <Ionicons name="server-outline" size={scale(22)} color="#94a3b8" />
                  </View>
                  <Text style={styles.nodeLabel}>Tamil Server Source</Text>
                  <Text style={styles.nodeSubLabel}>{activeServer.displayName}</Text>
                </View>

                {/* Node 2: Client Decryptor Engine (Center prominent) */}
                <View style={[styles.nodeItem, { marginTop: verticalScale(14) }]}>
                  <View style={[styles.nodeCircle, styles.nodeCircleActive]}>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                      <Ionicons name="layers-outline" size={scale(26)} color="#38bdf8" />
                    </Animated.View>
                  </View>
                  <Text style={[styles.nodeLabel, { color: '#ffffff' }]}>Client Decryptor Engine</Text>
                  <Text style={[styles.nodeSubLabel, { color: '#38bdf8' }]}>AES-CBC Ready</Text>
                </View>

                {/* Node 3: Stream Output Sandbox */}
                <View style={styles.nodeItem}>
                  <View style={styles.nodeCircle}>
                    <Ionicons name="videocam-outline" size={scale(22)} color="#94a3b8" />
                  </View>
                  <Text style={styles.nodeLabel}>Stream Output Sandbox</Text>
                  <Text style={styles.nodeSubLabel}>HLS 1080p</Text>
                </View>
              </View>
            </LinearGradient>
          )}
        </View>

        {/* ============================================================== */}
        {/* METRICS BAR: Target Channel, Index Latency, Payload Protocol */}
        {/* ============================================================== */}
        <View style={styles.metricsBar}>
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Target Channel</Text>
            <Text style={styles.metricValue}>{selectedSerial?.channel || 'Sun TV'}</Text>
          </View>

          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Index Latency</Text>
            <Text style={styles.metricValue}>{activeServer.latency}</Text>
          </View>

          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Payload Protocol</Text>
            <Text style={[styles.metricValue, { color: '#16a34a' }]}>
              {activeServer.protocol}
            </Text>
          </View>
        </View>

        {/* ============================================================== */}
        {/* STEPS CONTAINER (1, 2, 3) */}
        {/* ============================================================== */}
        <View style={styles.stepsContainer}>
          {/* ------------------------------------------------------------ */}
          {/* STEP 1: BUTTON SERVER 1 (TAMILDHOOL) & SERVER 2 (TAMILGUN)   */}
          {/* CHANNELS REMOVED AS REQUESTED                                */}
          {/* ------------------------------------------------------------ */}
          <View style={styles.stepSection}>
            <Text style={styles.stepHeaderTitle}>Step 1: Select Server Source</Text>

            <View style={styles.serversRow}>
              {SERVERS.map((srv) => {
                const isSelected = activeServerId === srv.id;
                return (
                  <TouchableOpacity
                    key={srv.id}
                    style={[
                      styles.serverSelectButton,
                      isSelected ? styles.serverSelectButtonActive : styles.serverSelectButtonInactive
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setActiveServerId(srv.id)}
                  >
                    <Ionicons
                      name={isSelected ? 'shield-checkmark' : 'server-outline'}
                      size={scale(16)}
                      color={isSelected ? '#ffffff' : '#374151'}
                      style={{ marginRight: scale(6) }}
                    />
                    <Text
                      style={[
                        styles.serverSelectButtonText,
                        isSelected ? styles.serverSelectButtonTextActive : styles.serverSelectButtonTextInactive
                      ]}
                      numberOfLines={1}
                    >
                      {srv.displayName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ------------------------------------------------------------ */}
          {/* STEP 2: ALL SERIAL NAMES - EASY TO SELECT DROPDOWN LIST      */}
          {/* ------------------------------------------------------------ */}
          <View style={[styles.stepSection, { marginTop: verticalScale(16) }]}>
            <Text style={styles.stepHeaderTitle}>Step 2: Select Tamil Serial</Text>

            <TouchableOpacity
              style={styles.dropdownBox}
              activeOpacity={0.8}
              onPress={() => setDropdownVisible(true)}
            >
              <View style={styles.dropdownLeft}>
                <ChannelLogo channelCode={selectedSerial?.channelCode} size={scale(16)} style={{ marginRight: scale(8) }} />
                <Text style={styles.dropdownSelectedText} numberOfLines={1}>
                  {selectedSerial?.title} ({selectedSerial?.timeSlot})
                </Text>
              </View>
              <Ionicons name="chevron-down" size={scale(18)} color="#4b5563" />
            </TouchableOpacity>

            <Text style={styles.archiveSubtitle}>
              Available archive tracks: {selectedSerial?.episodesCount || '1240 episodes logged'}.
            </Text>
          </View>

          {/* ------------------------------------------------------------ */}
          {/* STEP 3: SELECT BROADCAST PRODUCTION DATE (CALENDAR)          */}
          {/* ------------------------------------------------------------ */}
          <View style={[styles.stepSection, { marginTop: verticalScale(18) }]}>
            <View style={styles.calendarHeaderRow}>
              <Text style={styles.stepHeaderTitle}>Step 3: Select Broadcast Production Date</Text>

              <View style={styles.monthNav}>
                <TouchableOpacity onPress={prevMonth} style={styles.monthNavBtn} activeOpacity={0.7}>
                  <Ionicons name="chevron-back" size={scale(14)} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.monthNavLabel}>{monthName} {year}</Text>
                <TouchableOpacity onPress={nextMonth} style={styles.monthNavBtn} activeOpacity={0.7}>
                  <Ionicons name="chevron-forward" size={scale(14)} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Calendar Grid matching screenshot */}
            <View style={styles.calendarCard}>
              {/* Day Names Header */}
              <View style={styles.calendarWeekRow}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((w, idx) => (
                  <View key={`wk-${idx}`} style={styles.calendarWeekCell}>
                    <Text style={styles.calendarWeekText}>{w}</Text>
                  </View>
                ))}
              </View>

              {/* Days Grid (7 columns) */}
              <View style={styles.calendarDaysGrid}>
                {calendarDays.map((item) => {
                  if (item.day === null) {
                    return <View key={item.key} style={styles.emptyGridCell} />;
                  }

                  const isSelected = selectedDay === item.day;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.gridDayCell,
                        isSelected && styles.gridDayCellActive
                      ]}
                      activeOpacity={0.75}
                      onPress={() => handlePlayEpisode(item.day)}
                    >
                      <Text
                        style={[
                          styles.gridDayText,
                          isSelected && styles.gridDayTextActive
                        ]}
                      >
                        {item.day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* ACTION BUTTON: WATCH EPISODE DIRECTLY IN-SCREEN */}
          <View style={styles.actionBtnWrapper}>
            <TouchableOpacity
              style={styles.watchStreamButton}
              activeOpacity={0.85}
              onPress={() => handlePlayEpisode(selectedDay)}
            >
              <Ionicons name="play-circle" size={scale(20)} color="#ffffff" style={{ marginRight: scale(8) }} />
              <Text style={styles.watchStreamButtonText}>
                {isPlayerActive ? 'Reload Stream' : 'Watch Episode Stream'} ({selectedDay} {monthName})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ============================================================== */}
      {/* MODAL DROPDOWN: ALL SERIAL NAMES (EASY TO SELECT)              */}
      {/* ============================================================== */}
      <Modal
        visible={dropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalSheetTitle}>Select Tamil Serial</Text>
                <Text style={styles.modalSheetSubtitle}>
                  {activeServer.displayName} • {allServerSerials.length} Serials Logged
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setDropdownVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={scale(20)} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Search Input for fast selection */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={scale(16)} color="#6b7280" style={{ marginRight: scale(6) }} />
              <TextInput
                placeholder="Search serial name or time..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={scale(16)} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>

            {/* List of All Serials */}
            <ScrollView style={{ maxHeight: verticalScale(340) }} showsVerticalScrollIndicator={false}>
              {filteredDropdownSerials.map((s) => {
                const isSelected = selectedSerial?.id === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.serialOptionItem,
                      isSelected && styles.serialOptionItemActive
                    ]}
                    activeOpacity={0.75}
                    onPress={() => {
                      setSelectedSerial(s);
                      setDropdownVisible(false);
                      setSearchQuery('');
                      if (isPlayerActive) {
                        handlePlayEpisode(selectedDay);
                      }
                    }}
                  >
                    <View style={styles.serialOptionLeft}>
                      <ChannelLogo channelCode={s.channelCode} size={scale(20)} style={{ marginRight: scale(10) }} />
                      <View>
                        <Text style={[styles.serialOptionTitle, isSelected && styles.serialOptionTitleActive]}>
                          {s.title}
                        </Text>
                        <Text style={styles.serialOptionMeta}>
                          {s.tamilTitle} • {s.channel} • {s.timeSlot}
                        </Text>
                      </View>
                    </View>

                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={scale(20)} color="#2563eb" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingBottom: verticalScale(90),
  },

  // Top Section: Player Box or Status Nodes Hero
  heroSection: {
    backgroundColor: '#080c14',
  },
  playerBox: {
    width: '100%',
    height: verticalScale(220),
    backgroundColor: '#000000',
    position: 'relative',
    justifyContent: 'space-between',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loaderText: {
    color: '#38bdf8',
    fontSize: moderateScale(12),
    fontWeight: '700',
    marginTop: verticalScale(8),
  },
  playerOverlayTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(10),
    paddingTop: verticalScale(8),
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  playerServerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: verticalScale(3),
    paddingHorizontal: scale(8),
    borderRadius: scale(10),
  },
  statusDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    marginRight: scale(5),
  },
  playerServerBadgeText: {
    color: '#ffffff',
    fontSize: moderateScale(10.5),
    fontWeight: '700',
  },
  playerTopActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerIconButton: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerOverlayBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  miniPlayBtn: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniProgressBarBg: {
    flex: 1,
    height: verticalScale(4),
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: scale(2),
    overflow: 'hidden',
    marginRight: scale(8),
  },
  miniProgressBarFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
  },
  miniTimeText: {
    color: '#e2e8f0',
    fontSize: moderateScale(9.5),
    fontWeight: '600',
  },

  // Fullscreen Styles
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  fullscreenControls: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'space-between',
    padding: scale(16),
  },
  fullscreenTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerTopBtn: {
    padding: scale(6),
    marginRight: scale(8),
  },
  fullscreenTitle: {
    color: '#ffffff',
    fontSize: moderateScale(14),
    fontWeight: '800',
    flex: 1,
  },
  fullscreenCenterControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scale(36),
  },
  mainPlayBtn: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    backgroundColor: 'rgba(37, 99, 235, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seekBtn: {
    padding: scale(8),
  },
  fullscreenBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    color: '#ffffff',
    fontSize: moderateScale(11),
    fontWeight: '700',
  },
  progressBarBg: {
    flex: 1,
    height: verticalScale(5),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: scale(2.5),
    marginHorizontal: scale(10),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
  },

  // 3 Status Circles Hero Gradient
  nodesHeroGradient: {
    paddingVertical: verticalScale(22),
    paddingHorizontal: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  nodesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  nodeItem: {
    alignItems: 'center',
    flex: 1,
  },
  nodeCircle: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(26),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  nodeCircleActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#38bdf8',
    shadowColor: '#38bdf8',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  nodeLabel: {
    color: '#cbd5e1',
    fontSize: moderateScale(10),
    fontWeight: '700',
    textAlign: 'center',
  },
  nodeSubLabel: {
    color: '#64748b',
    fontSize: moderateScale(8.5),
    fontWeight: '600',
    marginTop: verticalScale(2),
  },

  // Metrics Bar
  metricsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: verticalScale(14),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    elevation: 1,
  },
  metricCol: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    color: '#6b7280',
    fontSize: moderateScale(11),
    fontWeight: '500',
    marginBottom: verticalScale(2),
  },
  metricValue: {
    color: '#111827',
    fontSize: moderateScale(13.5),
    fontWeight: '800',
  },

  // Steps Container
  stepsContainer: {
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(16),
  },
  stepSection: {
    marginBottom: verticalScale(6),
  },
  stepHeaderTitle: {
    color: '#1f2937',
    fontSize: moderateScale(13.5),
    fontWeight: '800',
    marginBottom: verticalScale(10),
  },

  // Step 1: Server Buttons (Channels removed!)
  serversRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(10),
  },
  serverSelectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(13),
    paddingHorizontal: scale(10),
    borderRadius: scale(10),
    borderWidth: 1.2,
  },
  serverSelectButtonActive: {
    backgroundColor: '#2563eb', // Royal blue active button matching screenshot
    borderColor: '#2563eb',
    elevation: 3,
  },
  serverSelectButtonInactive: {
    backgroundColor: '#f1f5f9', // Light gray inactive button
    borderColor: '#f1f5f9',
  },
  serverSelectButtonText: {
    fontSize: moderateScale(12.5),
    fontWeight: '800',
  },
  serverSelectButtonTextActive: {
    color: '#ffffff',
  },
  serverSelectButtonTextInactive: {
    color: '#1f2937',
  },

  // Step 2: Dropdown Selector
  dropdownBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: scale(10),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(14),
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownSelectedText: {
    color: '#111827',
    fontSize: moderateScale(13),
    fontWeight: '700',
    flex: 1,
  },
  archiveSubtitle: {
    color: '#6b7280',
    fontSize: moderateScale(11),
    fontWeight: '500',
    marginTop: verticalScale(6),
  },

  // Step 3: Calendar
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: scale(8),
    paddingVertical: verticalScale(4),
    paddingHorizontal: scale(8),
  },
  monthNavBtn: {
    padding: scale(4),
  },
  monthNavLabel: {
    color: '#111827',
    fontSize: moderateScale(12),
    fontWeight: '800',
    marginHorizontal: scale(6),
  },
  calendarCard: {
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: scale(12),
    padding: scale(8),
    backgroundColor: '#ffffff',
  },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: verticalScale(6),
  },
  calendarWeekCell: {
    flex: 1,
    alignItems: 'center',
  },
  calendarWeekText: {
    color: '#6b7280',
    fontSize: moderateScale(11.5),
    fontWeight: '700',
  },
  calendarDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyGridCell: {
    width: `${100 / 7}%`,
    height: verticalScale(36),
  },
  gridDayCell: {
    width: `${100 / 7}%`,
    height: verticalScale(36),
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: verticalScale(2),
    borderRadius: scale(6),
    backgroundColor: '#f1f5f9',
  },
  gridDayCellActive: {
    backgroundColor: '#2563eb', // Royal blue active date cell matching screenshot 25
  },
  gridDayText: {
    color: '#1f2937',
    fontSize: moderateScale(12),
    fontWeight: '700',
  },
  gridDayTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },

  // Action Button
  actionBtnWrapper: {
    marginTop: verticalScale(22),
    alignItems: 'center',
  },
  watchStreamButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: verticalScale(14),
    borderRadius: scale(14),
    elevation: 4,
    shadowColor: '#2563eb',
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  watchStreamButtonText: {
    color: '#ffffff',
    fontSize: moderateScale(14),
    fontWeight: '900',
  },

  // Modal Dropdown Sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: scale(16),
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderRadius: scale(16),
    padding: scale(16),
    maxHeight: '82%',
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(12),
  },
  modalSheetTitle: {
    color: '#111827',
    fontSize: moderateScale(15),
    fontWeight: '900',
  },
  modalSheetSubtitle: {
    color: '#6b7280',
    fontSize: moderateScale(11),
    fontWeight: '600',
    marginTop: verticalScale(2),
  },
  modalCloseBtn: {
    padding: scale(4),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    marginBottom: verticalScale(10),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(12),
    color: '#111827',
    paddingVertical: 0,
  },
  serialOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    borderRadius: scale(8),
  },
  serialOptionItemActive: {
    backgroundColor: '#eff6ff',
  },
  serialOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serialOptionTitle: {
    color: '#111827',
    fontSize: moderateScale(13),
    fontWeight: '800',
  },
  serialOptionTitleActive: {
    color: '#2563eb',
  },
  serialOptionMeta: {
    color: '#6b7280',
    fontSize: moderateScale(10.5),
    fontWeight: '600',
    marginTop: verticalScale(2),
  },
});
