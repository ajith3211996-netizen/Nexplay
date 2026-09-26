import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from '../utils/responsive';

const { width: windowWidth } = Dimensions.get('window');

// Curated Tamil Serials & Reality Slate matching the exact UI/UX specification
const FEATURED_HERO_SERIALS = [
  {
    id: 'baakiyalakshmi',
    network: 'VIJAY TV',
    networkTag: 'VIJAY TV • FEATURED',
    networkColor: '#2563eb',
    title: 'Baakiyalakshmi',
    tamilTitle: 'பாக்கியலட்சுமி',
    description: 'A moving tale of a dedicated homemaker who seeks out her independent identity against challenging odds.',
    rating: '9.5',
    timeSlot: '8:30 PM',
    episodesCount: '1240+ Eps',
    channel: 'Vijay TV',
    channelCode: 'vijay',
    media_type: 'tv',
    original_language: 'ta',
    tag: 'Prime Slot'
  },
  {
    id: 'kayal',
    network: 'SUN TV',
    networkTag: 'SUN TV • POPULAR',
    networkColor: '#f97316',
    title: 'Kayal',
    tamilTitle: 'கயல்',
    description: 'A resilient elder sister shoulders her entire family responsibilities, overcoming personal and financial hurdles.',
    rating: '9.7',
    timeSlot: '7:30 PM',
    episodesCount: '620+ Eps',
    channel: 'Sun TV',
    channelCode: 'sun',
    media_type: 'tv',
    original_language: 'ta',
    tag: 'Top Rated'
  },
  {
    id: 'siragadikka_aasai',
    network: 'VIJAY TV',
    networkTag: 'VIJAY TV • TRENDING',
    networkColor: '#ef4444',
    title: 'Siragadikka Aasai',
    tamilTitle: 'சிறகடிக்க ஆசை',
    description: 'An emotional roller coaster between Muthu and Meena striving for love, acceptance and dignity amidst family conflicts.',
    rating: '9.6',
    timeSlot: '9:00 PM',
    episodesCount: '410+ Eps',
    channel: 'Vijay TV',
    channelCode: 'vijay',
    media_type: 'tv',
    original_language: 'ta',
    tag: 'Trending'
  }
];

const BROADCASTERS = [
  { id: 'sun', name: 'Sun TV', tamilName: 'சன் டிவி', dotColor: '#f97316' },
  { id: 'vijay', name: 'Vijay TV', tamilName: 'விஜய் டிவி', dotColor: '#ef4444' },
  { id: 'zee', name: 'Zee Tamil', tamilName: 'ஜீ தமிழ்', dotColor: '#a855f7' },
  { id: 'ktv', name: 'KTV', tamilName: 'கே டிவி', dotColor: '#0ea5e9' },
];

const TRENDING_SERIALS = [
  {
    id: 'kayal',
    title: 'Kayal',
    tamilTitle: 'கயல்',
    channel: 'Sun TV',
    channelCode: 'sun',
    rating: '9.7',
    episodes: '620 Eps',
    timeSlot: '7:30 PM',
    bgColor: '#161329',
    tamilColor: '#38bdf8',
    borderColor: 'rgba(168, 85, 247, 0.25)',
    media_type: 'tv',
    original_language: 'ta'
  },
  {
    id: 'siragadikka_aasai',
    title: 'Siragadikka Aasai',
    tamilTitle: 'சிறகடிக்க ஆசை',
    channel: 'Vijay TV',
    channelCode: 'vijay',
    rating: '9.6',
    episodes: '410 Eps',
    timeSlot: '9:00 PM',
    bgColor: '#281119',
    tamilColor: '#fda4af',
    borderColor: 'rgba(244, 63, 94, 0.25)',
    media_type: 'tv',
    original_language: 'ta'
  },
  {
    id: 'karthigai_deepam',
    title: 'Karthigai Deepam',
    tamilTitle: 'கார்த்திகை தீபம்',
    channel: 'Zee Tamil',
    channelCode: 'zee',
    rating: '9.4',
    episodes: '380 Eps',
    timeSlot: '8:00 PM',
    bgColor: '#111a22',
    tamilColor: '#38bdf8',
    borderColor: 'rgba(56, 189, 248, 0.25)',
    media_type: 'tv',
    original_language: 'ta'
  },
  {
    id: 'vanathai_pola',
    title: 'Vanathai Pola',
    tamilTitle: 'வானத்தைப்போல',
    channel: 'Sun TV',
    channelCode: 'sun',
    rating: '9.3',
    episodes: '710 Eps',
    timeSlot: '6:30 PM',
    bgColor: '#0c211a',
    tamilColor: '#6ee7b7',
    borderColor: 'rgba(110, 231, 183, 0.25)',
    media_type: 'tv',
    original_language: 'ta'
  },
  {
    id: 'baakiyalakshmi',
    title: 'Baakiyalakshmi',
    tamilTitle: 'பாக்கியலட்சுமி',
    channel: 'Vijay TV',
    channelCode: 'vijay',
    rating: '9.5',
    episodes: '1240 Eps',
    timeSlot: '8:30 PM',
    bgColor: '#1c182d',
    tamilColor: '#fbbf24',
    borderColor: 'rgba(251, 191, 36, 0.25)',
    media_type: 'tv',
    original_language: 'ta'
  },
  {
    id: 'singapennae',
    title: 'Singapennae',
    tamilTitle: 'சிங்கப்பெண்ணே',
    channel: 'Sun TV',
    channelCode: 'sun',
    rating: '9.6',
    episodes: '310 Eps',
    timeSlot: '8:00 PM',
    bgColor: '#201614',
    tamilColor: '#fdba74',
    borderColor: 'rgba(253, 186, 116, 0.25)',
    media_type: 'tv',
    original_language: 'ta'
  }
];

const REALITY_SHOWS = [
  {
    id: 'super_singer_10',
    title: 'Super Singer S10',
    tamilTitle: 'சூப்பர் சிங்கர்',
    channel: 'Vijay TV',
    channelCode: 'vijay',
    rating: '9.8',
    genre: 'Variety',
    timeSlot: 'Sat-Sun 8 PM',
    bgColor: '#13192e',
    tamilColor: '#93c5fd',
    borderColor: 'rgba(59, 130, 246, 0.25)',
    media_type: 'tv',
    original_language: 'ta'
  },
  {
    id: 'sa_re_ga_ma_pa',
    title: 'Sa Re Ga Ma Pa',
    tamilTitle: 'ஸ ரி க ம ப',
    channel: 'Zee Tamil',
    channelCode: 'zee',
    rating: '9.6',
    genre: 'Variety',
    timeSlot: 'Sat-Sun 7 PM',
    bgColor: '#291118',
    tamilColor: '#fde047',
    borderColor: 'rgba(244, 63, 94, 0.25)',
    media_type: 'tv',
    original_language: 'ta'
  },
  {
    id: 'mr_mrs_chinnathirai',
    title: 'Mr & Mrs Chinnathirai',
    tamilTitle: 'மிஸ்டர் & மிஸஸ் சின்னத்...',
    channel: 'Vijay TV',
    channelCode: 'vijay',
    rating: '9.2',
    genre: 'Variety',
    timeSlot: 'Sunday 9 PM',
    bgColor: '#281b11',
    tamilColor: '#fcd34d',
    borderColor: 'rgba(245, 158, 11, 0.25)',
    media_type: 'tv',
    original_language: 'ta'
  },
  {
    id: 'top_cooku_dupe_cooku',
    title: 'Top Cooku Dupe Cooku',
    tamilTitle: 'டாப் குக்கு டூப் குக்கு',
    channel: 'Sun TV',
    channelCode: 'sun',
    rating: '9.4',
    genre: 'Variety',
    timeSlot: 'Sunday 8:30 PM',
    bgColor: '#101e2b',
    tamilColor: '#67e8f9',
    borderColor: 'rgba(6, 182, 212, 0.25)',
    media_type: 'tv',
    original_language: 'ta'
  },
  {
    id: 'cooku_with_comali_5',
    title: 'Cooku With Comali S5',
    tamilTitle: 'குக் வித் கோமாளி',
    channel: 'Vijay TV',
    channelCode: 'vijay',
    rating: '9.7',
    genre: 'Variety',
    timeSlot: 'Sat-Sun 9:30 PM',
    bgColor: '#19152b',
    tamilColor: '#c084fc',
    borderColor: 'rgba(192, 132, 252, 0.25)',
    media_type: 'tv',
    original_language: 'ta'
  }
];

export default function TvSerialsScreen({ onMoviePress }) {
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [heroIndex, setHeroIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Pulse animation for the Live Broadcast indicator
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

  // Auto-rotate featured carousel every 5s unless paused
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % FEATURED_HERO_SERIALS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const currentHero = FEATURED_HERO_SERIALS[heroIndex] || FEATURED_HERO_SERIALS[0];

  const handleCardPress = (item) => {
    if (!onMoviePress) return;
    onMoviePress({
      id: item.id,
      title: item.title,
      name: item.title,
      original_name: item.title,
      tamilTitle: item.tamilTitle,
      overview: item.description || `${item.title} (${item.tamilTitle}) airing on ${item.channel}.`,
      vote_average: parseFloat(item.rating) || 9.5,
      media_type: 'tv',
      original_language: 'ta',
      first_air_date: '2023-01-01',
      poster_path: null,
      backdrop_path: null
    });
  };

  const handleChannelSelect = (channelId) => {
    if (selectedChannel === channelId) {
      setSelectedChannel('all');
    } else {
      setSelectedChannel(channelId);
    }
  };

  const filteredSerials = selectedChannel === 'all'
    ? TRENDING_SERIALS
    : TRENDING_SERIALS.filter((s) => s.channelCode === selectedChannel);

  const filteredReality = selectedChannel === 'all'
    ? REALITY_SHOWS
    : REALITY_SHOWS.filter((r) => r.channelCode === selectedChannel);

  const activeChannelName = selectedChannel === 'all'
    ? 'All Networks'
    : (BROADCASTERS.find(b => b.id === selectedChannel)?.name || 'All Networks');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. TOP HERO BANNER (Pixel-matched from attached tablet reference to mobile) */}
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

          {/* Hero Main Content Row: Info Left + Glass Live Broadcast Right */}
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

              {/* Action Buttons: Quick Play + Rating */}
              <View style={styles.heroActionsRow}>
                <TouchableOpacity
                  style={styles.quickPlayButton}
                  activeOpacity={0.8}
                  onPress={() => handleCardPress(currentHero)}
                >
                  <Ionicons name="play" size={scale(14)} color="#ffffff" style={{ marginRight: scale(5) }} />
                  <Text style={styles.quickPlayText}>Quick Play</Text>
                </TouchableOpacity>

                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>
                    Rating: {currentHero.rating} <Text style={{ color: '#fbbf24' }}>★</Text>
                  </Text>
                </View>
              </View>
            </View>

            {/* Glass Live Broadcast Box with Green Pulsing Dot */}
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
            {FEATURED_HERO_SERIALS.map((_, index) => {
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

      {/* 2. METRICS BAR (Crisp light metrics section) */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Active Channel</Text>
          <Text style={styles.metricValue} numberOfLines={1}>{activeChannelName}</Text>
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

      {/* 3. PRIMARY BROADCASTERS / சேனல்கள் */}
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
        {BROADCASTERS.map((broadcaster) => {
          const isSelected = selectedChannel === broadcaster.id;
          return (
            <TouchableOpacity
              key={broadcaster.id}
              style={[
                styles.broadcasterPill,
                isSelected && styles.broadcasterPillSelected
              ]}
              activeOpacity={0.75}
              onPress={() => handleChannelSelect(broadcaster.id)}
            >
              <View style={[styles.channelColorDot, { backgroundColor: broadcaster.dotColor }]} />
              <View style={styles.broadcasterNamesWrapper}>
                <Text style={styles.broadcasterName}>
                  {broadcaster.name}
                </Text>
                <Text style={styles.broadcasterTamilName}>
                  {broadcaster.tamilName}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 4. TRENDING DAILY SERIALS / தொடர்கள் */}
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
            onPress={() => handleCardPress(serial)}
          >
            {/* Top row: Channel Badge + Rating */}
            <View style={styles.cardTopRow}>
              <View style={styles.channelBadgePill}>
                <Text style={styles.channelBadgeText}>{serial.channel}</Text>
              </View>
              <View style={styles.cardRatingPill}>
                <Text style={styles.cardRatingText}>{serial.rating} ★</Text>
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

            {/* Bottom: Episodes count + Air time */}
            <View style={styles.cardBottomRow}>
              <Text style={styles.cardMetaLeft}>{serial.episodes}</Text>
              <Text style={styles.cardMetaRight}>{serial.timeSlot}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* 5. POPULAR REALITY SHOWS / நிகழ்ச்சிகள் */}
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
            onPress={() => handleCardPress(show)}
          >
            {/* Top row: Channel Badge + Rating */}
            <View style={styles.cardTopRow}>
              <View style={styles.channelBadgePill}>
                <Text style={styles.channelBadgeText}>{show.channel}</Text>
              </View>
              <View style={styles.cardRatingPill}>
                <Text style={styles.cardRatingText}>{show.rating} ★</Text>
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

            {/* Bottom: Genre + Air time */}
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
    backgroundColor: '#f3f4f6', // Clean light backdrop matching reference design
  },
  scrollContent: {
    paddingBottom: verticalScale(90), // Room for bottom navigation bar
  },

  // 1. HERO BANNER
  heroOuterWrapper: {
    paddingHorizontal: scale(10),
    paddingTop: verticalScale(10),
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
    backgroundColor: '#2563eb', // Solid vibrant blue
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
    color: '#f59e0b', // Amber/orange tamil title
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
    backgroundColor: '#2563eb', // Matches blue Quick Play button
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
  ratingBadge: {
    justifyContent: 'center',
  },
  ratingText: {
    color: '#cbd5e1',
    fontSize: moderateScale(12),
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
    backgroundColor: '#22c55e', // Glowing green indicator
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
    backgroundColor: '#e5e7eb',
    paddingVertical: verticalScale(7),
    paddingHorizontal: scale(14),
    borderRadius: scale(12),
    borderWidth: 1.2,
    borderColor: '#e5e7eb',
  },
  broadcasterPillSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  channelColorDot: {
    width: scale(11),
    height: scale(11),
    borderRadius: scale(5.5),
    marginRight: scale(8),
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

  // 4 & 5. CARDS GRID (Responsive 2-column mobile layout)
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
  cardRatingPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: verticalScale(2),
    paddingHorizontal: scale(6),
    borderRadius: scale(6),
  },
  cardRatingText: {
    color: '#fbbf24',
    fontSize: moderateScale(9.5),
    fontWeight: '800',
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

  // 5. REALITY SHOWS HEADER
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
});
