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
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from '../utils/responsive';
import {
  SERVERS,
  CHANNELS,
  REALITY_SHOWS_CACHE,
  getCachedSerialsForServer,
  findSerial
} from '../utils/TvSerialsMetadataCache';

const { width: windowWidth } = Dimensions.get('window');

// Channel Logo component with latest official branding + reliable fallback
function ChannelLogo({ channelCode, size = scale(18), style }) {
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

  // Fallback to high-fidelity vector emblems with official channel brand colors
  switch (channelCode) {
    case 'sun':
      return <Ionicons name="sunny" size={size} color="#f59e0b" style={style} />;
    case 'vijay':
      return <FontAwesome5 name="star" size={size * 0.9} color="#ef4444" style={style} />;
    case 'zee':
      return <MaterialCommunityIcons name="weather-sunset-up" size={size} color="#a855f7" style={style} />;
    case 'ktv':
      return <Ionicons name="film" size={size} color="#0ea5e9" style={style} />;
    default:
      return <Ionicons name="tv" size={size} color="#3b82f6" style={style} />;
  }
}

export default function TvSerialsScreen({ onMoviePress }) {
  // Top Navbar Server State: Server 1 (Tamildhool) vs Server 2 (Tamilgun)
  const [activeServerId, setActiveServerId] = useState('tamildhool');
  const activeServer = SERVERS.find(s => s.id === activeServerId) || SERVERS[0];

  // Active Catalog Filter & Hero Carousel State
  const [selectedChannelId, setSelectedChannelId] = useState('all');
  const [heroIndex, setHeroIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Detail / Decryptor Sandbox State (when user clicks any serial)
  const [sandboxVisible, setSandboxVisible] = useState(false);
  const [sandboxChannel, setSandboxChannel] = useState(CHANNELS[0]);
  const [sandboxSerial, setSandboxSerial] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Calendar State for Step 3
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date(2026, 8, 25)); // Sep 25, 2026
  const [selectedDay, setSelectedDay] = useState(25);

  // Pulse animation for Live Broadcast dot & Decryptor Engine ring
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

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

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();
  }, [pulseAnim, rotateAnim]);

  // Serials list from active server cache
  const serverSerials = useMemo(() => {
    return getCachedSerialsForServer(activeServerId);
  }, [activeServerId]);

  // Auto-rotate hero carousel
  useEffect(() => {
    if (isPaused || sandboxVisible) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % serverSerials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, sandboxVisible, serverSerials.length]);

  const currentHero = serverSerials[heroIndex] || serverSerials[0];

  // Open Sandbox for clicked serial
  const handleOpenSandbox = (item) => {
    const channelObj = CHANNELS.find(c => c.code === item.channelCode) || CHANNELS[0];
    setSandboxChannel(channelObj);
    setSandboxSerial(item);
    setSandboxVisible(true);
  };

  // Launch Playback from Sandbox or Quick Play
  const handlePlayStream = (item, chosenDate) => {
    const targetDateStr = chosenDate 
      ? `${chosenDate} ${currentCalendarDate.toLocaleString('default', { month: 'short' })} ${currentCalendarDate.getFullYear()}`
      : 'Latest Broadcast';

    if (onMoviePress) {
      onMoviePress({
        id: `${activeServer.id}_${item.serialCode || item.id}_${chosenDate || 25}`,
        title: `${item.title} - ${targetDateStr}`,
        name: `${item.title} - ${targetDateStr}`,
        original_name: item.title,
        tamilTitle: item.tamilTitle,
        overview: `${item.title} (${item.tamilTitle}) airing on ${item.channel}. Decrypted stream via ${activeServer.name}.`,
        channel: item.channel,
        channelCode: item.channelCode,
        server: activeServer.id,
        broadcastDate: targetDateStr,
        media_type: 'tv',
        original_language: 'ta',
        first_air_date: '2026-09-25',
        poster_path: item.posterUrl || null,
        backdrop_path: item.backdropUrl || null
      });
    }
  };

  // Channel filter for catalog
  const filteredSerials = selectedChannelId === 'all'
    ? serverSerials
    : serverSerials.filter(s => s.channelCode === selectedChannelId);

  const filteredReality = selectedChannelId === 'all'
    ? REALITY_SHOWS_CACHE
    : REALITY_SHOWS_CACHE.filter(r => r.channelCode === selectedChannelId);

  // Available serials for Sandbox Step 2 based on sandboxChannel
  const sandboxAvailableSerials = useMemo(() => {
    const list = serverSerials.filter(s => s.channelCode === sandboxChannel.code);
    return list.length > 0 ? list : serverSerials;
  }, [serverSerials, sandboxChannel]);

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
  // Empty slots before 1st day of month
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push({ day: null, key: `empty-${i}` });
  }
  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({ day: d, key: `day-${d}` });
  }

  // -------------------------------------------------------------
  // RENDER: INSIDE TV SERIALS SANDBOX VIEW (Matched to attached screenshot)
  // -------------------------------------------------------------
  if (sandboxVisible && sandboxSerial) {
    return (
      <ScrollView
        style={styles.sandboxContainer}
        contentContainerStyle={styles.sandboxScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Back & Server Indicator Bar */}
        <View style={styles.sandboxTopNav}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSandboxVisible(false)}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={scale(20)} color="#ffffff" />
            <Text style={styles.backButtonText}>Serials Catalog</Text>
          </TouchableOpacity>

          <View style={styles.serverPillBadge}>
            <View style={[styles.serverStatusDot, { backgroundColor: '#22c55e' }]} />
            <Text style={styles.serverPillText}>{activeServer.displayName}</Text>
          </View>
        </View>

        {/* 1. TOP HERO CONTAINER (Dark grid theme with 3 circular status nodes) */}
        <View style={styles.sandboxHero}>
          <LinearGradient
            colors={['#080b14', '#0d1322', '#090d18']}
            style={styles.sandboxHeroGradient}
          >
            <View style={styles.nodesRow}>
              {/* Node 1: Tamil Server Source */}
              <View style={styles.nodeItem}>
                <View style={styles.nodeCircle}>
                  <Ionicons name="server-outline" size={scale(22)} color="#94a3b8" />
                </View>
                <Text style={styles.nodeLabel}>Tamil Server Source</Text>
                <Text style={styles.nodeSubLabel}>{activeServer.name}</Text>
              </View>

              {/* Node 2: Client Decryptor Engine (Prominent center) */}
              <View style={[styles.nodeItem, { marginTop: verticalScale(14) }]}>
                <View style={[styles.nodeCircle, styles.nodeCircleActive]}>
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <Ionicons name="layers-outline" size={scale(26)} color="#38bdf8" />
                  </Animated.View>
                </View>
                <Text style={[styles.nodeLabel, { color: '#ffffff' }]}>Client Decryptor Engine</Text>
                <Text style={[styles.nodeSubLabel, { color: '#38bdf8' }]}>Active Decryptor</Text>
              </View>

              {/* Node 3: Stream Output Sandbox */}
              <View style={styles.nodeItem}>
                <View style={styles.nodeCircle}>
                  <Ionicons name="videocam-outline" size={scale(22)} color="#94a3b8" />
                </View>
                <Text style={styles.nodeLabel}>Stream Output Sandbox</Text>
                <Text style={styles.nodeSubLabel}>HLS Output</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Metrics Status Bar (Target Channel, Index Latency, Payload Protocol) */}
        <View style={styles.sandboxMetricsBar}>
          <View style={styles.sandboxMetricCol}>
            <Text style={styles.sandboxMetricLabel}>Target Channel</Text>
            <Text style={styles.sandboxMetricValue}>{sandboxChannel.name}</Text>
          </View>

          <View style={styles.sandboxMetricCol}>
            <Text style={styles.sandboxMetricLabel}>Index Latency</Text>
            <Text style={styles.sandboxMetricValue}>0ms</Text>
          </View>

          <View style={styles.sandboxMetricCol}>
            <Text style={styles.sandboxMetricLabel}>Payload Protocol</Text>
            <Text style={[styles.sandboxMetricValue, { color: '#16a34a' }]}>
              {activeServer.protocol}
            </Text>
          </View>
        </View>

        {/* Step 1 & Step 2 Row */}
        <View style={styles.stepsWrapper}>
          {/* Step 1: Select Broadcast Channel */}
          <View style={styles.stepSection}>
            <Text style={styles.stepTitle}>Step 1: Select Broadcast Channel</Text>
            <View style={styles.channelsGrid}>
              {CHANNELS.map((ch) => {
                const isSelected = sandboxChannel.code === ch.code;
                return (
                  <TouchableOpacity
                    key={ch.code}
                    style={[
                      styles.channelButton,
                      isSelected ? styles.channelButtonActive : styles.channelButtonInactive
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSandboxChannel(ch);
                      const matching = serverSerials.filter(s => s.channelCode === ch.code);
                      if (matching.length > 0) {
                        setSandboxSerial(matching[0]);
                      }
                    }}
                  >
                    <ChannelLogo channelCode={ch.code} size={scale(16)} style={{ marginRight: scale(6) }} />
                    <Text
                      style={[
                        styles.channelButtonText,
                        isSelected ? styles.channelButtonTextActive : styles.channelButtonTextInactive
                      ]}
                    >
                      {ch.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Step 2: Select Tamil Serial */}
          <View style={[styles.stepSection, { marginTop: verticalScale(16) }]}>
            <Text style={styles.stepTitle}>Step 2: Select Tamil Serial</Text>

            <TouchableOpacity
              style={styles.dropdownSelector}
              activeOpacity={0.8}
              onPress={() => setDropdownOpen(true)}
            >
              <Text style={styles.dropdownSelectedText} numberOfLines={1}>
                {sandboxSerial.title} ({sandboxSerial.timeSlot})
              </Text>
              <Ionicons name="chevron-down" size={scale(18)} color="#4b5563" />
            </TouchableOpacity>

            <Text style={styles.archiveTracksText}>
              Available archive tracks: {sandboxSerial.episodesCount || '1240 episodes logged'}.
            </Text>
          </View>

          {/* Step 3: Select Broadcast Production Date */}
          <View style={[styles.stepSection, { marginTop: verticalScale(20) }]}>
            <View style={styles.calendarHeaderRow}>
              <Text style={styles.stepTitle}>Step 3: Select Broadcast Production Date</Text>

              <View style={styles.monthNavWrapper}>
                <TouchableOpacity onPress={prevMonth} style={styles.monthNavBtn} activeOpacity={0.7}>
                  <Ionicons name="chevron-back" size={scale(14)} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.monthNavText}>{monthName} {year}</Text>
                <TouchableOpacity onPress={nextMonth} style={styles.monthNavBtn} activeOpacity={0.7}>
                  <Ionicons name="chevron-forward" size={scale(14)} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Calendar Grid matching attached design */}
            <View style={styles.calendarContainer}>
              {/* Day of Week Row */}
              <View style={styles.weekDaysRow}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((dayName, idx) => (
                  <View key={`weekday-${idx}`} style={styles.weekDayCell}>
                    <Text style={styles.weekDayText}>{dayName}</Text>
                  </View>
                ))}
              </View>

              {/* Day Cells Grid (7 columns) */}
              <View style={styles.daysGrid}>
                {calendarDays.map((item) => {
                  if (item.day === null) {
                    return <View key={item.key} style={styles.emptyDayCell} />;
                  }

                  const isSelected = selectedDay === item.day;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.dayCell,
                        isSelected && styles.dayCellActive
                      ]}
                      activeOpacity={0.75}
                      onPress={() => setSelectedDay(item.day)}
                    >
                      <Text
                        style={[
                          styles.dayCellText,
                          isSelected && styles.dayCellTextActive
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

          {/* Action Button: Watch Episode Stream */}
          <View style={styles.sandboxActionWrapper}>
            <TouchableOpacity
              style={styles.watchStreamBtn}
              activeOpacity={0.85}
              onPress={() => handlePlayStream(sandboxSerial, selectedDay)}
            >
              <Ionicons name="play-circle" size={scale(20)} color="#ffffff" style={{ marginRight: scale(8) }} />
              <Text style={styles.watchStreamBtnText}>
                Watch {sandboxSerial.title} ({selectedDay} {monthName})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal for Selecting Serial (Dropdown Picker) */}
        <Modal
          visible={dropdownOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setDropdownOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setDropdownOpen(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choose {sandboxChannel.name} Serial</Text>
              <ScrollView style={{ maxHeight: verticalScale(320) }}>
                {sandboxAvailableSerials.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.modalItem,
                      sandboxSerial.id === s.id && styles.modalItemActive
                    ]}
                    onPress={() => {
                      setSandboxSerial(s);
                      setDropdownOpen(false);
                    }}
                  >
                    <View>
                      <Text style={styles.modalItemTitle}>{s.title}</Text>
                      <Text style={styles.modalItemTamil}>{s.tamilTitle} • {s.timeSlot}</Text>
                    </View>
                    {sandboxSerial.id === s.id && (
                      <Ionicons name="checkmark-circle" size={scale(18)} color="#2563eb" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    );
  }

  // -------------------------------------------------------------
  // RENDER: MAIN TV SERIALS CATALOG VIEW
  // -------------------------------------------------------------
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 0. TOP NAVBAR WITH TWO SERVERS: Server 1 (Tamildhool) & Server 2 (Tamilgun) */}
      <View style={styles.serverNavContainer}>
        <View style={styles.serverTabsRow}>
          {SERVERS.map((srv) => {
            const isActive = activeServerId === srv.id;
            return (
              <TouchableOpacity
                key={srv.id}
                style={[
                  styles.serverTabPill,
                  isActive && styles.serverTabPillActive
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  setActiveServerId(srv.id);
                  setHeroIndex(0);
                }}
              >
                <View
                  style={[
                    styles.serverIndicatorDot,
                    { backgroundColor: isActive ? '#22c55e' : '#64748b' }
                  ]}
                />
                <Text
                  style={[
                    styles.serverTabLabel,
                    isActive && styles.serverTabLabelActive
                  ]}
                >
                  {srv.displayName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.serverMetaTag}>
          <Text style={styles.serverMetaText}>
            SOURCE: <Text style={{ color: activeServer.color, fontWeight: '800' }}>{activeServer.domain}</Text> • 0ms
          </Text>
        </View>
      </View>

      {/* 1. TOP HERO BANNER (Cached rich metadata & hero backdrops, NO star ratings) */}
      <View style={styles.heroOuterWrapper}>
        <LinearGradient
          colors={['#070a13', '#0b1222', '#0f172a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.heroCard}
        >
          {/* Top Row: Pill Tag + Pause/Play Button */}
          <View style={styles.heroHeaderRow}>
            <View style={styles.networkBadgePill}>
              <ChannelLogo channelCode={currentHero.channelCode} size={scale(13)} style={{ marginRight: scale(5) }} />
              <Text style={styles.networkBadgeText}>{currentHero.networkTag}</Text>
            </View>

            <TouchableOpacity
              style={styles.pauseCircleBtn}
              activeOpacity={0.7}
              onPress={() => setIsPaused((prev) => !prev)}
            >
              <Ionicons
                name={isPaused ? 'play' : 'pause'}
                size={scale(15)}
                color="#ffffff"
              />
            </TouchableOpacity>
          </View>

          {/* Hero Main Content Row */}
          <View style={styles.heroMainRow}>
            <View style={styles.heroInfoColumn}>
              <Text style={styles.heroTitle} numberOfLines={1}>
                {currentHero.title}
              </Text>
              <Text style={styles.heroTamilTitle}>
                {currentHero.tamilTitle}
              </Text>
              <Text style={styles.heroDescription} numberOfLines={3}>
                {currentHero.description}
              </Text>

              {/* Action Buttons: Quick Play + Time Slot Tag (Star rating removed!) */}
              <View style={styles.heroActionsRow}>
                <TouchableOpacity
                  style={styles.quickPlayButton}
                  activeOpacity={0.8}
                  onPress={() => handleOpenSandbox(currentHero)}
                >
                  <Ionicons name="play" size={scale(14)} color="#ffffff" style={{ marginRight: scale(5) }} />
                  <Text style={styles.quickPlayText}>Quick Play</Text>
                </TouchableOpacity>

                <View style={styles.heroTimeSlotBadge}>
                  <Ionicons name="time-outline" size={scale(13)} color="#cbd5e1" style={{ marginRight: scale(4) }} />
                  <Text style={styles.heroTimeSlotText}>{currentHero.timeSlot}</Text>
                </View>
              </View>
            </View>

            {/* Glass Live Broadcast Box */}
            <View style={styles.liveBroadcastContainer}>
              <View style={styles.liveBroadcastGlassCard}>
                <Ionicons name="tv-outline" size={scale(24)} color="#eab308" />
                <Text style={styles.liveBroadcastTitle}>LIVE</Text>
                <Text style={styles.liveBroadcastSubtitle}>BROADCAST</Text>
                <Animated.View style={[styles.liveStatusDot, { opacity: pulseAnim }]} />
              </View>
            </View>
          </View>

          {/* Carousel Pagination Dots */}
          <View style={styles.paginationRow}>
            {serverSerials.map((_, index) => {
              const isActive = index === heroIndex;
              return (
                <TouchableOpacity
                  key={`dot-${index}`}
                  onPress={() => setHeroIndex(index)}
                  activeOpacity={0.7}
                  style={[
                    styles.paginationDot,
                    isActive ? styles.paginationDotActive : styles.paginationDotInactive
                  ]}
                />
              );
            })}
          </View>
        </LinearGradient>
      </View>

      {/* 2. METRICS BAR (Active Channel, Total Serials, Reality Slate) */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Active Channel</Text>
          <Text style={styles.metricValue} numberOfLines={1}>
            {selectedChannelId === 'all' ? 'All Networks' : (CHANNELS.find(c => c.id === selectedChannelId)?.name || 'All Networks')}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Total Serials</Text>
          <Text style={styles.metricValue}>{filteredSerials.length} Tamil Soap</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Reality Slate</Text>
          <Text style={styles.metricValue}>{filteredReality.length} Prime Slots</Text>
        </View>
      </View>

      {/* 3. PRIMARY BROADCASTERS / சேனல்கள் (With Latest Channel Logos) */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleWithIcon}>
          <Ionicons name="tv" size={scale(18)} color="#2563eb" style={{ marginRight: scale(8) }} />
          <Text style={styles.sectionHeaderTitle}>Primary Broadcasters / சேனல்கள்</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.broadcastersScrollContent}
      >
        {CHANNELS.map((broadcaster) => {
          const isSelected = selectedChannelId === broadcaster.id;
          return (
            <TouchableOpacity
              key={broadcaster.id}
              style={[
                styles.broadcasterPill,
                isSelected && styles.broadcasterPillSelected
              ]}
              activeOpacity={0.75}
              onPress={() => {
                if (selectedChannelId === broadcaster.id) {
                  setSelectedChannelId('all');
                } else {
                  setSelectedChannelId(broadcaster.id);
                }
              }}
            >
              <ChannelLogo channelCode={broadcaster.code} size={scale(20)} style={{ marginRight: scale(8) }} />
              <View style={styles.broadcasterNamesWrapper}>
                <Text style={styles.broadcasterName}>{broadcaster.name}</Text>
                <Text style={styles.broadcasterTamilName}>{broadcaster.tamilName}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 4. TRENDING DAILY SERIALS / தொடர்கள் (NO star ratings, opens Sandbox on tap) */}
      <View style={[styles.sectionHeaderRow, { marginTop: verticalScale(18) }]}>
        <View style={styles.sectionTitleWithIcon}>
          <Ionicons name="trending-up" size={scale(18)} color="#ef4444" style={{ marginRight: scale(8) }} />
          <Text style={styles.sectionHeaderTitle}>Trending Daily Serials / தொடர்கள்</Text>
        </View>
      </View>

      <View style={styles.cardsGridContainer}>
        {filteredSerials.map((serial) => (
          <TouchableOpacity
            key={serial.id}
            style={[
              styles.serialCard,
              { backgroundColor: serial.bgColor, borderColor: serial.borderColor }
            ]}
            activeOpacity={0.82}
            onPress={() => handleOpenSandbox(serial)}
          >
            {/* Top row: Channel Badge + Time Slot (NO star rating!) */}
            <View style={styles.cardTopRow}>
              <View style={styles.channelBadgePill}>
                <ChannelLogo channelCode={serial.channelCode} size={scale(11)} style={{ marginRight: scale(4) }} />
                <Text style={styles.channelBadgeText}>{serial.channel}</Text>
              </View>
              <View style={styles.cardSlotBadge}>
                <Text style={styles.cardSlotBadgeText}>{serial.timeSlot}</Text>
              </View>
            </View>

            {/* Center: Title + Tamil Subtitle */}
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitleText} numberOfLines={1}>
                {serial.title}
              </Text>
              <Text style={[styles.cardTamilTitleText, { color: serial.tamilColor }]} numberOfLines={1}>
                {serial.tamilTitle}
              </Text>
            </View>

            {/* Bottom: Episodes count + Tag */}
            <View style={styles.cardBottomRow}>
              <Text style={styles.cardMetaLeft}>{serial.episodes}</Text>
              <Text style={styles.cardMetaRight}>{serial.tag || 'Daily Soap'}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* 5. POPULAR REALITY SHOWS / நிகழ்ச்சிகள் (NO star ratings) */}
      <View style={styles.realityHeaderWrapper}>
        <Text style={styles.sectionHeaderTitleCentered}>Popular Reality Shows / நிகழ்ச்சிகள்</Text>
      </View>

      <View style={styles.cardsGridContainer}>
        {filteredReality.map((show) => (
          <TouchableOpacity
            key={show.id}
            style={[
              styles.serialCard,
              { backgroundColor: show.bgColor, borderColor: show.borderColor }
            ]}
            activeOpacity={0.82}
            onPress={() => handleOpenSandbox(show)}
          >
            {/* Top row: Channel Badge + Air Slot */}
            <View style={styles.cardTopRow}>
              <View style={styles.channelBadgePill}>
                <ChannelLogo channelCode={show.channelCode} size={scale(11)} style={{ marginRight: scale(4) }} />
                <Text style={styles.channelBadgeText}>{show.channel}</Text>
              </View>
              <View style={styles.cardSlotBadge}>
                <Text style={styles.cardSlotBadgeText}>Weekend</Text>
              </View>
            </View>

            {/* Center: Title + Tamil Subtitle */}
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitleText} numberOfLines={1}>
                {show.title}
              </Text>
              <Text style={[styles.cardTamilTitleText, { color: show.tamilColor }]} numberOfLines={1}>
                {show.tamilTitle}
              </Text>
            </View>

            {/* Bottom: Genre + Time Slot */}
            <View style={styles.cardBottomRow}>
              <Text style={styles.cardMetaLeft}>{show.genre}</Text>
              <Text style={styles.cardMetaRight}>{show.timeSlot}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollContent: {
    paddingBottom: verticalScale(90),
  },

  // 0. TOP NAVBAR SERVER SWITCHER
  serverNavContainer: {
    backgroundColor: '#070b14',
    paddingHorizontal: scale(12),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(6),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  serverTabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(8),
  },
  serverTabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(8),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  serverTabPillActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderColor: '#3b82f6',
  },
  serverIndicatorDot: {
    width: scale(7),
    height: scale(7),
    borderRadius: scale(3.5),
    marginRight: scale(6),
  },
  serverTabLabel: {
    color: '#94a3b8',
    fontSize: moderateScale(11),
    fontWeight: '700',
  },
  serverTabLabelActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  serverMetaTag: {
    alignItems: 'center',
    marginTop: verticalScale(4),
  },
  serverMetaText: {
    color: '#64748b',
    fontSize: moderateScale(9.5),
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // 1. HERO BANNER
  heroOuterWrapper: {
    paddingHorizontal: scale(10),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(6),
    backgroundColor: '#060912',
  },
  heroCard: {
    borderRadius: scale(18),
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(14),
    paddingBottom: verticalScale(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  networkBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: verticalScale(4),
    paddingHorizontal: scale(12),
    borderRadius: scale(20),
  },
  networkBadgeText: {
    color: '#ffffff',
    fontSize: moderateScale(10.5),
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  pauseCircleBtn: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroInfoColumn: {
    flex: 1,
    paddingRight: scale(10),
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: moderateScale(22),
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  heroTamilTitle: {
    color: '#f59e0b',
    fontSize: moderateScale(15),
    fontWeight: '800',
    marginTop: verticalScale(2),
    marginBottom: verticalScale(6),
  },
  heroDescription: {
    color: '#94a3b8',
    fontSize: moderateScale(11.5),
    lineHeight: moderateScale(16),
    fontWeight: '500',
    marginBottom: verticalScale(14),
  },
  heroActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: verticalScale(7),
    paddingHorizontal: scale(16),
    borderRadius: scale(22),
    marginRight: scale(12),
    elevation: 3,
  },
  quickPlayText: {
    color: '#ffffff',
    fontSize: moderateScale(12),
    fontWeight: '800',
  },
  heroTimeSlotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: verticalScale(5),
    paddingHorizontal: scale(10),
    borderRadius: scale(14),
  },
  heroTimeSlotText: {
    color: '#cbd5e1',
    fontSize: moderateScale(11.5),
    fontWeight: '700',
  },
  liveBroadcastContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: scale(4),
  },
  liveBroadcastGlassCard: {
    width: scale(88),
    height: scale(88),
    borderRadius: scale(14),
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '8deg' }],
    position: 'relative',
  },
  liveBroadcastTitle: {
    color: '#94a3b8',
    fontSize: moderateScale(8.5),
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: verticalScale(3),
  },
  liveBroadcastSubtitle: {
    color: '#64748b',
    fontSize: moderateScale(7),
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  liveStatusDot: {
    position: 'absolute',
    bottom: scale(6),
    right: scale(6),
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: '#22c55e',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(14),
    gap: scale(6),
  },
  paginationDot: {
    height: verticalScale(5),
    borderRadius: scale(2.5),
  },
  paginationDotActive: {
    width: scale(22),
    backgroundColor: '#3b82f6',
  },
  paginationDotInactive: {
    width: scale(6),
    backgroundColor: '#475569',
  },

  // 2. METRICS BAR
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 1,
  },
  metricItem: {
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
    fontSize: moderateScale(13),
    fontWeight: '800',
  },

  // 3. BROADCASTERS ROW
  sectionHeaderRow: {
    paddingHorizontal: scale(14),
    marginTop: verticalScale(14),
    marginBottom: verticalScale(10),
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderTitle: {
    color: '#1f2937',
    fontSize: moderateScale(14),
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  broadcastersScrollContent: {
    paddingHorizontal: scale(14),
    gap: scale(10),
  },
  broadcasterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: verticalScale(7),
    paddingHorizontal: scale(14),
    borderRadius: scale(12),
    borderWidth: 1.2,
    borderColor: '#e5e7eb',
    elevation: 1,
  },
  broadcasterPillSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  broadcasterNamesWrapper: {
    justifyContent: 'center',
  },
  broadcasterName: {
    color: '#111827',
    fontSize: moderateScale(12),
    fontWeight: '800',
  },
  broadcasterTamilName: {
    color: '#6b7280',
    fontSize: moderateScale(9.5),
    fontWeight: '600',
    marginTop: verticalScale(1),
  },

  // 4 & 5. CARDS GRID
  cardsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: scale(12),
    rowGap: verticalScale(10),
  },
  serialCard: {
    width: (windowWidth - scale(32)) / 2,
    borderRadius: scale(14),
    padding: scale(12),
    borderWidth: 1.2,
    justifyContent: 'space-between',
    minHeight: verticalScale(116),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  channelBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: verticalScale(2),
    paddingHorizontal: scale(7),
    borderRadius: scale(6),
  },
  channelBadgeText: {
    color: '#f3f4f6',
    fontSize: moderateScale(9.5),
    fontWeight: '700',
  },
  cardSlotBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: verticalScale(2),
    paddingHorizontal: scale(6),
    borderRadius: scale(6),
  },
  cardSlotBadgeText: {
    color: '#93c5fd',
    fontSize: moderateScale(9),
    fontWeight: '700',
  },
  cardTitleContainer: {
    marginVertical: verticalScale(8),
  },
  cardTitleText: {
    color: '#ffffff',
    fontSize: moderateScale(13.5),
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  cardTamilTitleText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    marginTop: verticalScale(2),
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: verticalScale(6),
  },
  cardMetaLeft: {
    color: '#94a3b8',
    fontSize: moderateScale(9.5),
    fontWeight: '600',
  },
  cardMetaRight: {
    color: '#94a3b8',
    fontSize: moderateScale(9.5),
    fontWeight: '600',
  },

  realityHeaderWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(20),
    marginBottom: verticalScale(10),
  },
  sectionHeaderTitleCentered: {
    color: '#1f2937',
    fontSize: moderateScale(14),
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  // -------------------------------------------------------------
  // SANDBOX VIEW STYLES (MATCHED TO SCREENSHOT)
  // -------------------------------------------------------------
  sandboxContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  sandboxScrollContent: {
    paddingBottom: verticalScale(90),
  },
  sandboxTopNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#080c14',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: moderateScale(13),
    fontWeight: '700',
    marginLeft: scale(6),
  },
  serverPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: verticalScale(4),
    paddingHorizontal: scale(10),
    borderRadius: scale(12),
  },
  serverStatusDot: {
    width: scale(7),
    height: scale(7),
    borderRadius: scale(3.5),
    marginRight: scale(6),
  },
  serverPillText: {
    color: '#ffffff',
    fontSize: moderateScale(10.5),
    fontWeight: '700',
  },

  // Sandbox Hero Header
  sandboxHero: {
    backgroundColor: '#080c14',
  },
  sandboxHeroGradient: {
    paddingVertical: verticalScale(24),
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

  // Sandbox Metrics Bar
  sandboxMetricsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: verticalScale(14),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    elevation: 1,
  },
  sandboxMetricCol: {
    alignItems: 'center',
    flex: 1,
  },
  sandboxMetricLabel: {
    color: '#6b7280',
    fontSize: moderateScale(11),
    fontWeight: '500',
    marginBottom: verticalScale(2),
  },
  sandboxMetricValue: {
    color: '#111827',
    fontSize: moderateScale(13.5),
    fontWeight: '800',
  },

  // Steps Container
  stepsWrapper: {
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(16),
  },
  stepSection: {
    marginBottom: verticalScale(8),
  },
  stepTitle: {
    color: '#1f2937',
    fontSize: moderateScale(13.5),
    fontWeight: '800',
    marginBottom: verticalScale(10),
  },

  // Step 1: Channels Grid
  channelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: scale(8),
  },
  channelButton: {
    width: (windowWidth - scale(36)) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(14),
    borderRadius: scale(10),
  },
  channelButtonActive: {
    backgroundColor: '#2563eb',
  },
  channelButtonInactive: {
    backgroundColor: '#f1f5f9',
  },
  channelButtonText: {
    fontSize: moderateScale(12.5),
    fontWeight: '800',
  },
  channelButtonTextActive: {
    color: '#ffffff',
  },
  channelButtonTextInactive: {
    color: '#1f2937',
  },

  // Step 2: Dropdown Selector
  dropdownSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: scale(10),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(14),
  },
  dropdownSelectedText: {
    color: '#111827',
    fontSize: moderateScale(13),
    fontWeight: '700',
    flex: 1,
  },
  archiveTracksText: {
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
  monthNavWrapper: {
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
  monthNavText: {
    color: '#111827',
    fontSize: moderateScale(12),
    fontWeight: '800',
    marginHorizontal: scale(6),
  },
  calendarContainer: {
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: scale(12),
    padding: scale(8),
    backgroundColor: '#ffffff',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: verticalScale(6),
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    color: '#6b7280',
    fontSize: moderateScale(11.5),
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDayCell: {
    width: `${100 / 7}%`,
    height: verticalScale(36),
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: verticalScale(36),
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: verticalScale(2),
    borderRadius: scale(6),
    backgroundColor: '#f1f5f9',
  },
  dayCellActive: {
    backgroundColor: '#2563eb',
  },
  dayCellText: {
    color: '#1f2937',
    fontSize: moderateScale(12),
    fontWeight: '700',
  },
  dayCellTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },

  // Sandbox Action
  sandboxActionWrapper: {
    marginTop: verticalScale(22),
    alignItems: 'center',
  },
  watchStreamBtn: {
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
  watchStreamBtnText: {
    color: '#ffffff',
    fontSize: moderateScale(14),
    fontWeight: '900',
  },

  // Dropdown Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: scale(16),
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: scale(16),
    padding: scale(16),
    maxHeight: '80%',
  },
  modalTitle: {
    color: '#111827',
    fontSize: moderateScale(15),
    fontWeight: '900',
    marginBottom: verticalScale(12),
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalItemActive: {
    backgroundColor: '#eff6ff',
    borderRadius: scale(8),
    paddingHorizontal: scale(8),
  },
  modalItemTitle: {
    color: '#111827',
    fontSize: moderateScale(13),
    fontWeight: '800',
  },
  modalItemTamil: {
    color: '#6b7280',
    fontSize: moderateScale(10.5),
    fontWeight: '600',
    marginTop: verticalScale(2),
  },
});
