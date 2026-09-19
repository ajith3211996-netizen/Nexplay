import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  FlatList, 
  ActivityIndicator, 
  Pressable, 
  Dimensions, 
  StatusBar,
  Modal,
  Animated,
  Platform,
  BackHandler,
  StyleSheet,
  useWindowDimensions,
  PanResponder
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from 'expo';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as NavigationBar from 'expo-navigation-bar';
import * as Brightness from 'expo-brightness';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from '../utils/responsive';
import { 
  getPosterUrl, 
  getBackdropUrl, 
  getStillUrl, 
  getProfileUrl, 
  fetchMediaDetails, 
  fetchTvSeasonEpisodes,
  formatRuntime,
  formatYear,
  formatCurrency,
  getDirector,
  getWriters
} from '../utils/api';
import { ExtensionManager } from '../utils/ExtensionManager';

// Curated High-Definition Fallback Cast & Recommendations matching the reference design
const DEFAULT_CAST = [
  { id: 'c1', name: 'Timothée Chalamet', character: 'Paul Atreides', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=300&auto=format&fit=crop' },
  { id: 'c2', name: 'Zendaya', character: 'Chani', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop' },
  { id: 'c3', name: 'Rebecca Ferguson', character: 'Lady Jessica', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop' },
  { id: 'c4', name: 'Josh Brolin', character: 'Gurney Halleck', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop' },
  { id: 'c5', name: 'Austin Butler', character: 'Feyd-Rautha', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop' },
  { id: 'c6', name: 'Florence Pugh', character: 'Princess Irulan', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop' }
];

const DEFAULT_RECOMMENDATIONS = [
  { id: 'r1', title: 'Blade Runner 2049', image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop' },
  { id: 'r2', title: 'Arrival', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop' },
  { id: 'r3', title: 'The Creator', image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop' },
  { id: 'r4', title: 'Interstellar', image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600&auto=format&fit=crop' },
  { id: 'r5', title: 'Dune: Part Two', image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop' }
];

const DEFAULT_EPISODES = [
  { id: 'ep-1', title: '1. The Prophecy', duration: '58m', image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop' },
  { id: 'ep-2', title: '2. The Spice', duration: '54m', image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop' },
  { id: 'ep-3', title: '3. The Jihad', duration: '1h 02m', image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600&auto=format&fit=crop' },
  { id: 'ep-4', title: '4. The Maker', duration: '56m', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop' },
  { id: 'ep-5', title: '5. The Water of Life', duration: '1h 10m', image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop' }
];

// Comprehensive language dictionary for Media3 / ExoPlayer stream tracks
const LANGUAGE_NAMES = {
  'en': 'English', 'eng': 'English',
  'hi': 'Hindi', 'hin': 'Hindi',
  'ta': 'Tamil', 'tam': 'Tamil',
  'te': 'Telugu', 'tel': 'Telugu',
  'ml': 'Malayalam', 'mal': 'Malayalam',
  'kn': 'Kannada', 'kan': 'Kannada',
  'bn': 'Bengali', 'ben': 'Bengali',
  'mr': 'Marathi', 'mar': 'Marathi',
  'pa': 'Punjabi', 'pan': 'Punjabi',
  'gu': 'Gujarati', 'guj': 'Gujarati',
  'es': 'Spanish', 'spa': 'Spanish',
  'fr': 'French', 'fra': 'French', 'fre': 'French',
  'de': 'German', 'deu': 'German', 'ger': 'German',
  'it': 'Italian', 'ita': 'Italian',
  'ja': 'Japanese', 'jpn': 'Japanese',
  'ko': 'Korean', 'kor': 'Korean',
  'zh': 'Chinese', 'zho': 'Chinese', 'chi': 'Chinese',
  'ru': 'Russian', 'rus': 'Russian',
  'pt': 'Portuguese', 'por': 'Portuguese',
  'ar': 'Arabic', 'ara': 'Arabic',
  'tr': 'Turkish', 'tur': 'Turkish',
};

const getTrackDisplayLabel = (track, defaultPrefix = 'Track', index = 0) => {
  if (!track) return `${defaultPrefix} ${index + 1}`;
  if (track.label && track.label.trim().length > 0 && !track.label.toLowerCase().includes('und')) {
    return track.label.trim();
  }
  const langKey = (track.language || '').toLowerCase().trim();
  if (langKey && LANGUAGE_NAMES[langKey]) {
    return LANGUAGE_NAMES[langKey];
  }
  if (track.name && track.name.trim().length > 0) {
    return track.name.trim();
  }
  return langKey ? langKey.toUpperCase() : `${defaultPrefix} ${index + 1}`;
};

const getDeduplicatedAudioTracks = (tracks = []) => {
  if (!Array.isArray(tracks) || tracks.length === 0) {
    return [{ id: 'default', originalIndex: 0, language: 'en', label: 'Default Audio (Original)', displayLabel: 'Default Audio (Original)', isDefault: true }];
  }
  return tracks.map((track, idx) => ({
    ...track,
    originalIndex: idx,
    displayLabel: getTrackDisplayLabel(track, 'Audio Track', idx),
  }));
};

const getDeduplicatedSubtitleTracks = (tracks = []) => {
  if (!Array.isArray(tracks) || tracks.length === 0) return [];
  return tracks.map((track, idx) => ({
    ...track,
    originalIndex: idx,
    displayLabel: getTrackDisplayLabel(track, 'Subtitle Track', idx),
  }));
};

export default function MovieDetailScreen({ movie, onBack, onNavigateMovie }) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const topNotchPadding = Math.max(insets.top, StatusBar.currentHeight || 0, 10);

  // Dynamic Layout Measurement State
  const [playerLayout, setPlayerLayout] = useState({ width: windowWidth, height: (windowWidth * 9) / 16 });
  const [scrubberWidth, setScrubberWidth] = useState(0);

  // Determine if TV Show (Strictly check media_type and prevent movie titles from false-positive series detection)
  const isTVShow = movie.media_type === 'tv' ? true :
                   movie.media_type === 'movie' ? false :
                   (Boolean(movie.number_of_seasons) && !movie.title) ||
                   (Boolean(movie.first_air_date) && !movie.release_date && !movie.title);

  // TMDB Dynamic Details State
  const [details, setDetails] = useState(movie);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [cast, setCast] = useState([]);
  const [crew, setCrew] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  // Seasons & Episodes State (for TV Series)
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [isSeasonModalVisible, setIsSeasonModalVisible] = useState(false);
  const [episodesList, setEpisodesList] = useState([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  // Player & Scraper State
  const [activeServer, setActiveServer] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false);
  const [hasFirstFrameRendered, setHasFirstFrameRendered] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const currentTimeRef = useRef(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsVisibleRef = useRef(true);
  const controlsTimeoutRef = useRef(null);
  const controlsOpacity = useRef(new Animated.Value(1)).current;

  // VideoView ref & Fullscreen state
  const videoViewRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenScaleAnim = useRef(new Animated.Value(1)).current;

  // Feature Options: Playback Speed, Fit Mode, Lock Screen
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [contentFitMode, setContentFitMode] = useState('contain');
  const [isControlsLocked, setIsControlsLocked] = useState(false);
  const isControlsLockedRef = useRef(false);

  // Brightness and Volume Swipe State (MX Player / YouTube style)
  const [brightness, setBrightness] = useState(1.0); // 0.1 to 1.0
  const brightnessRef = useRef(1.0);
  const [volumeLevel, setVolumeLevel] = useState(1.0); // 0.0 to 1.0
  const volumeLevelRef = useRef(1.0);
  const playerLayoutRef = useRef({ width: windowWidth, height: (windowWidth * 9) / 16 });
  const [gestureIndicator, setGestureIndicator] = useState(null); // 'brightness' | 'volume' | null
  const gestureIndicatorAnim = useRef(new Animated.Value(0)).current;
  const gestureTimeoutRef = useRef(null);

  // TIDB - The Intro Database state (Skip Intro, Recap, Credits, Outro)
  const [tidbSegments, setTidbSegments] = useState(null);
  const [tidbLoading, setTidbLoading] = useState(false);

  const startTouchX = useRef(0);
  const startTouchY = useRef(0);
  const initialGestureVal = useRef(0);
  const isDragging = useRef(false);
  const lastTapRef = useRef({ time: 0, x: 0 });

  const showGesturePill = (type) => {
    if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
    setGestureIndicator(type);
    Animated.timing(gestureIndicatorAnim, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  const hideGesturePill = () => {
    if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
    gestureTimeoutRef.current = setTimeout(() => {
      Animated.timing(gestureIndicatorAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setGestureIndicator(null));
    }, 1200);
  };

  // Double-tap seeking gesture state
  const [doubleTapFeedback, setDoubleTapFeedback] = useState(null); // 'left' | 'right' | null
  const doubleTapOpacity = useRef(new Animated.Value(0)).current;
  const lastTapLeftRef = useRef(0);
  const lastTapRightRef = useRef(0);
  const singleTapTimeoutRef = useRef(null);

  // In-Player Feature Menu state ('none' | 'quality' | 'audio' | 'subtitles' | 'speed')
  const [activePlayerMenu, setActivePlayerMenu] = useState('none');
  const menuAnim = useRef(new Animated.Value(0)).current;

  // Audio Tracks state
  const [availableAudioTracks, setAvailableAudioTracks] = useState([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState(null);

  // Subtitle Tracks state
  const [availableSubtitleTracks, setAvailableSubtitleTracks] = useState([]);
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState(null);


  // Open & Close In-Player Feature Menu with smooth animations
  const openPlayerMenu = (menuType) => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setActivePlayerMenu(menuType);
    setControlsVisible(true);
    Animated.spring(menuAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start();
  };

  const closePlayerMenu = () => {
    Animated.timing(menuAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setActivePlayerMenu('none');
      if (isPlaying) {
        resetControlsTimeout();
      }
    });
  };

  // Smooth appearance and disappearance animation for player controls (250ms fade)
  useEffect(() => {
    controlsVisibleRef.current = controlsVisible;
    if (controlsVisible) {
      const cur = (player && typeof player.currentTime === 'number' ? player.currentTime : currentTimeRef.current) || 0;
      setCurrentTime(cur);
    }
    Animated.timing(controlsOpacity, {
      toValue: controlsVisible ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [controlsVisible]);

  // Strict 3-Second Auto-Disappear Timer whenever video is playing
  useEffect(() => {
    if (hasStartedPlayback && isPlaying && activePlayerMenu === 'none') {
      resetControlsTimeout();
    } else if (!isPlaying && hasStartedPlayback) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      setControlsVisible(true);
    }
  }, [hasStartedPlayback, isPlaying, activePlayerMenu]);

  // Playback Error & Dialog Animation State
  const [playbackError, setPlaybackError] = useState(null); // null | { title: string, message: string, server?: number }
  const errorPulseAnim = useRef(new Animated.Value(1)).current;
  const errorRingOpacityAnim = useRef(new Animated.Value(0.4)).current;
  const errorFadeAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation loop for stream error dialog
  useEffect(() => {
    if (playbackError) {
      Animated.timing(errorFadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      }).start();

      const pulseLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(errorPulseAnim, { toValue: 1.35, duration: 1000, useNativeDriver: true }),
            Animated.timing(errorPulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(errorRingOpacityAnim, { toValue: 0.8, duration: 1000, useNativeDriver: true }),
            Animated.timing(errorRingOpacityAnim, { toValue: 0.2, duration: 1000, useNativeDriver: true }),
          ]),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    } else {
      errorFadeAnim.setValue(0);
    }
  }, [playbackError]);

  // Lifecycle safety ref to prevent async crashes on unmounted player
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (player) {
        try {
          player.pause();
          player.replace(null);
        } catch (e) {}
      }
    };
  }, [player]);

  // Initialize and track system brightness
  useEffect(() => {
    let isCancelled = false;
    async function initBrightness() {
      try {
        const cur = await Brightness.getBrightnessAsync();
        if (!isCancelled && typeof cur === 'number' && cur >= 0) {
          const initVal = Math.max(0.1, cur);
          setBrightness(initVal);
          brightnessRef.current = initVal;
        }
      } catch (e) {}
    }
    initBrightness();
    return () => {
      isCancelled = true;
      try {
        Brightness.restoreSystemBrightnessAsync();
      } catch (e) {}
    };
  }, []);

  // Fetch Intro / Outro / Recap / Credits timestamps from TIDB (The Intro Database)
  useEffect(() => {
    let isCancelled = false;
    async function loadTidbSegments() {
      const tmdbId = details?.id || movie?.id;
      if (!tmdbId) return;
      setTidbLoading(true);
      try {
        const sNum = isTVShow ? (currentEpisode?.seasonNumber || selectedSeason || 1) : null;
        const eNum = isTVShow ? (currentEpisode?.episodeNumber || 1) : null;
        const url = isTVShow
          ? `https://api.theintrodb.org/v3/media?tmdb_id=${tmdbId}&season=${sNum}&episode=${eNum}`
          : `https://api.theintrodb.org/v3/media?tmdb_id=${tmdbId}`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) {
            console.log(`[TIDB] Successfully loaded timestamps for ${isTVShow ? `S${sNum}E${eNum}` : 'Movie'}:`, {
              intro: data?.intro?.length || 0,
              credits: data?.credits?.length || 0,
              recap: data?.recap?.length || 0
            });
            setTidbSegments(data);
          }
        } else {
          if (!isCancelled) setTidbSegments(null);
        }
      } catch (e) {
        if (!isCancelled) setTidbSegments(null);
      } finally {
        if (!isCancelled) setTidbLoading(false);
      }
    }
    loadTidbSegments();
    return () => { isCancelled = true; };
  }, [details?.id, movie?.id, selectedSeason, currentEpisode?.episodeNumber, currentEpisode?.seasonNumber, isTVShow]);

  // WebView Client-Side Scraper state
  const [isResolving, setIsResolving] = useState(false);
  const isResolvingRef = useRef(false);
  const [resolvingStatus, setResolvingStatus] = useState('');

  const CATCHY_CINEMA_QUOTES = [
    "🍿 Popcorn ready! Setting up your cinema experience...",
    "🎬 Dimming the theater lights... Almost showtime!",
    "⚡ Calibrating ultra-crisp audio & visual channels...",
    "🚀 Grabbing the master reel from high-speed servers...",
    "✨ Fasten your seatbelt, incredible entertainment awaits...",
    "🎟️ Your front-row VIP ticket is confirmed... Enjoy the show!",
    "🎧 Tuning Dolby Atmos sound stage...",
    "🔥 Unlocking master 4K UHD stream...",
    "🎞️ Rolling the 35mm film reel at 60 frames per second...",
    "🌌 Connecting to hyper-speed cloud cinema CDN...",
    "🎯 Locking on target bitrate for zero-buffering playback...",
    "🏆 Cinema VIP Pass activated... Preparing your stream...",
    "✨ Aligning the projector lens for crystal-clear 4K...",
    "🍿 Grab your drinks, silence your phones... It's Showtime!",
    "⚡ Bypassing network throttling for maximum speed...",
    "🎬 The director has called 'Action!'... Streaming now!"
  ];

  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(() => Math.floor(Math.random() * CATCHY_CINEMA_QUOTES.length));

  useEffect(() => {
    if (!isResolving) return;
    setCurrentQuoteIndex(Math.floor(Math.random() * CATCHY_CINEMA_QUOTES.length));
    const quoteInterval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % CATCHY_CINEMA_QUOTES.length);
    }, 2000);
    return () => clearInterval(quoteInterval);
  }, [isResolving]);

  // Quality & ABR (Adaptive Bitrate) selector states
  const [resolvedQualities, setResolvedQualities] = useState(null); // format: { '1080p': 'url', '4k': 'url', '720p': 'url' }
  const [qualityMode, setQualityMode] = useState('auto'); // 'auto' (ABR) | '1080p' | '4k' | '720p'
  const [currentQuality, setCurrentQuality] = useState('1080p');
  const [abrNotice, setAbrNotice] = useState(null);
  const abrNoticeAnim = useRef(new Animated.Value(0)).current;
  const abrTimeoutRef = useRef(null);

  // ABR Adaptation Tracker Refs
  const stallsHistoryRef = useRef([]);
  const lastAbrSwitchTimeRef = useRef(0);
  const lastPlaybackPositionRef = useRef(0);
  const lastProgressTimestampRef = useRef(Date.now());
  const lastSeekTimestampRef = useRef(0);
  const isSeekingRef = useRef(false);
  const isScrubbingRef = useRef(false);
  const pendingSeekTimeRef = useRef(null);
  const scrubberPageXRef = useRef(0);
  const scrubberRef = useRef(null);

  const showAbrToast = (msg) => {
    if (abrTimeoutRef.current) clearTimeout(abrTimeoutRef.current);
    setAbrNotice(msg);
    Animated.timing(abrNoticeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true
    }).start();

    abrTimeoutRef.current = setTimeout(() => {
      Animated.timing(abrNoticeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start(() => setAbrNotice(null));
    }, 3500);
  };

  // Strict Individual Servers: Server 1 (HDHub4u), Server 2 (4KHDHub), Server 3 (Movies4u)
  const servers = [
    { id: 1, label: 'Server 1', short: 'Server 1', desc: 'HDHub4u Direct Stream' },
    { id: 2, label: 'Server 2', short: 'Server 2', desc: '4KHDHub Ultra & HD Stream' },
    { id: 3, label: 'Server 3', short: 'Server 3', desc: 'Movies4u Direct Stream' },
  ];

  // Current selected episode / media item
  const [currentEpisode, setCurrentEpisode] = useState({
    id: 'initial',
    title: movie.title || movie.name || 'Title',
    episodeNumber: 1,
    videoUrl: null
  });

  // Image resolver helpers
  const getCastImageUri = (item) => {
    if (item.image) return item.image;
    if (item.profile_path) return getProfileUrl(item.profile_path);
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop';
  };

  const getRecImageUri = (item) => {
    if (item.image) return item.image;
    if (item.poster_path) return getPosterUrl(item.poster_path);
    return 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600&auto=format&fit=crop';
  };

  // Audio Track selection tracking (Default English for Hollywood / English titles)
  const hasUserManuallySelectedAudioTrack = useRef(false);
  const hasAutoSelectedEnglish = useRef(false);

  const applyDefaultEnglishIfHollywood = (tracks) => {
    if (!tracks || !Array.isArray(tracks) || tracks.length <= 1) return;
    if (hasUserManuallySelectedAudioTrack.current) return;
    if (hasAutoSelectedEnglish.current) return;

    const origLang = (movie?.original_language || details?.original_language || '').toLowerCase();
    // Default to English for English/Hollywood/International movies and series
    const isEnglishMedia = !origLang || origLang === 'en' || !['hi', 'ta', 'te', 'ml', 'kn', 'bn', 'mr', 'pa'].includes(origLang);

    if (isEnglishMedia) {
      const englishTrack = tracks.find((t) => {
        const lang = (t.language || '').toLowerCase().trim();
        const label = (t.label || '').toLowerCase().trim();
        const name = (t.name || '').toLowerCase().trim();
        return lang === 'en' || lang === 'eng' || label.includes('english') || name.includes('english') || label.includes('eng') || name.includes('eng');
      });

      if (englishTrack && player) {
        try {
          console.log('[MovieDetailScreen] 🇺🇸 Auto-selecting English default audio track for Hollywood title:', englishTrack);
          hasAutoSelectedEnglish.current = true;
          player.audioTrack = englishTrack;
          setSelectedAudioTrack(englishTrack);
          player.play();
        } catch (err) {
          console.warn('[MovieDetailScreen] Auto-select English error:', err);
        }
      }
    }
  };

  // 1. Fetch Dynamic Media Details from TMDB on mount or movie change
  useEffect(() => {
    let isMounted = true;

    async function loadMediaData() {
      setLoadingDetails(true);
      try {
        const fullDetails = await fetchMediaDetails(movie.id, isTVShow ? 'tv' : 'movie');
        if (!isMounted) return;

        if (fullDetails) {
          setDetails(fullDetails);

          // Set Cast, Crew & Recommendations
          if (fullDetails.credits?.cast && fullDetails.credits.cast.length > 0) {
            setCast(fullDetails.credits.cast.slice(0, 16));
          }
          if (fullDetails.credits?.crew) {
            setCrew(fullDetails.credits.crew);
          }
          if (fullDetails.recommendations?.results && fullDetails.recommendations.results.length > 0) {
            setRecommendations(fullDetails.recommendations.results.slice(0, 12));
          } else if (fullDetails.similar?.results && fullDetails.similar.results.length > 0) {
            setRecommendations(fullDetails.similar.results.slice(0, 12));
          }

          // If TV series, setup seasons and load Season 1 episodes
          if (isTVShow && fullDetails.seasons && fullDetails.seasons.length > 0) {
            const validSeasons = fullDetails.seasons.filter(s => s.season_number > 0);
            const activeSeasons = validSeasons.length > 0 ? validSeasons : fullDetails.seasons;
            setSeasons(activeSeasons);

            const initialSeasonNum = activeSeasons[0]?.season_number || 1;
            setSelectedSeason(initialSeasonNum);
            loadSeasonEpisodes(movie.id, initialSeasonNum, fullDetails);
          } else {
            // Movie setup
            const initialEp = {
              id: `movie-${movie.id}`,
              title: fullDetails.title || movie.title || 'Feature Film',
              episodeNumber: 1,
              duration: formatRuntime(fullDetails.runtime) || '2h 15m',
              image: getBackdropUrl(fullDetails.backdrop_path || movie.backdrop_path),
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
            };
            setCurrentEpisode(initialEp);
          }
        }
      } catch (err) {
        console.warn("[MovieDetailScreen] Failed loading TMDB details:", err);
      } finally {
        if (isMounted) setLoadingDetails(false);
      }
    }

    loadMediaData();
    return () => { isMounted = false; };
  }, [movie?.id, movie?.title, movie?.name]);

  // Active scrape request ID ref to cancel obsolete responses when user switches episodes quickly
  const activeScrapeRequestId = useRef(0);

  // 2. Fetch Episodes for selected Season from TMDB
  const loadSeasonEpisodes = async (tvId, seasonNum, mediaInfo = details) => {
    setLoadingEpisodes(true);
    try {
      const episodes = await fetchTvSeasonEpisodes(tvId, seasonNum);
      if (episodes && episodes.length > 0) {
        const today = new Date();
        const formatted = episodes.map((ep) => {
          let airDateFormatted = null;
          let isFutureAir = false;
          if (ep.air_date) {
            const airDate = new Date(ep.air_date);
            isFutureAir = airDate > today;
            airDateFormatted = airDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
          }

          const rawName = (ep.name || '').trim();
          const hasCustomTitle = rawName && !rawName.match(/^Episode\s+\d+$/i);
          const epTitle = hasCustomTitle ? rawName : `Episode ${ep.episode_number}`;

          return {
            id: `ep-s${seasonNum}-e${ep.id || ep.episode_number}`,
            seasonNumber: seasonNum,
            episodeNumber: ep.episode_number,
            title: `${ep.episode_number}. ${epTitle}`,
            name: epTitle,
            airDate: ep.air_date,
            airDateFormatted,
            isFutureAir,
            overview: ep.overview,
            duration: ep.runtime ? formatRuntime(ep.runtime) : (ep.overview ? '45m' : ''),
            image: getStillUrl(ep.still_path) || getBackdropUrl(mediaInfo?.backdrop_path || movie?.backdrop_path),
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
          };
        });
        setEpisodesList(formatted);
        if (formatted.length > 0) {
          setCurrentEpisode(formatted[0]);
        }
      } else {
        setEpisodesList([]);
      }
    } catch (e) {
      console.warn("[MovieDetailScreen] Error fetching season episodes:", e);
      setEpisodesList([]);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  // Change Season handler
  const handleSeasonSelect = (seasonNum) => {
    setSelectedSeason(seasonNum);
    setIsSeasonModalVisible(false);
    loadSeasonEpisodes(movie.id, seasonNum);
  };

  // Handle ABR (Adaptive Bitrate) Dynamic Downscaling
  const handleAbrDowngrade = () => {
    if (qualityMode !== 'auto' || !resolvedQualities || !player || !isMounted.current) return;
    const now = Date.now();
    if (pendingSeekTimeRef.current !== null || isSeekingRef.current || (now - lastSeekTimestampRef.current < 15000)) return; // Never downgrade during active seeking or within 15s of seek
    if (now - lastAbrSwitchTimeRef.current < 20000) return; // Cooldown 20s

    const currentQ = currentQuality.toLowerCase();
    let targetLowerQ = null;

    if (currentQ === '4k' && resolvedQualities['1080p']) {
      targetLowerQ = '1080p';
    } else if ((currentQ === '4k' || currentQ === '1080p') && resolvedQualities['720p']) {
      targetLowerQ = '720p';
    }

    if (targetLowerQ && resolvedQualities[targetLowerQ]) {
      console.log(`[MovieDetailScreen] ⚡ ABR: Buffering stalls detected. Auto-adapting from ${currentQ.toUpperCase()} to ${targetLowerQ.toUpperCase()}`);
      lastAbrSwitchTimeRef.current = now;
      stallsHistoryRef.current = [];
      showAbrToast(`⚡ ABR: Auto-adapted to ${targetLowerQ.toUpperCase()} for smooth playback`);
      playResolvedLink(resolvedQualities[targetLowerQ], targetLowerQ, false);
    }
  };

  // Initialize expo-video player (AndroidX Media3 ExoPlayer)
  const player = useVideoPlayer(null, (playerInstance) => {
    playerInstance.loop = false; // Never loop video to 0 on seek/end
    playerInstance.muted = isMuted;
    playerInstance.preservesPitch = true;
    playerInstance.playbackRate = 1.0;
    playerInstance.keepScreenOnWhilePlaying = true;
    playerInstance.timeUpdateEventInterval = 0.5;
    playerInstance.bufferOptions = {
      preferredForwardBufferDuration: 120, // 120s forward buffer window (smooth continuous pre-buffering)
      waitsToMinimizeStalling: false, // Stream at full unthrottled 1 to 40+ Mbps without artificial pauses
      minBufferForPlayback: 0.5, // Start playback instantly (0.5s) while buffering continues at max speed
      maxBufferBytes: 0, // 0 = C.LENGTH_UNSET in Android Media3 ExoPlayer: unconstrained bandwidth consumption (1 to 40+ Mbps)
      prioritizeTimeOverSizeThreshold: true,
    };
  });

  // Dynamically listen to timeUpdate events from Media3 ExoPlayer
  useEventListener(player, 'timeUpdate', (event) => {
    if (event && typeof event.currentTime === 'number' && !isNaN(event.currentTime)) {
      if (isScrubbingRef.current) return;

      const now = Date.now();
      if (pendingSeekTimeRef.current !== null) {
        const pSeek = pendingSeekTimeRef.current;
        const timeSinceSeek = now - lastSeekTimestampRef.current;

        const hasReachedTarget = Math.abs(event.currentTime - pSeek) < 2.5;
        const isTimedOut = timeSinceSeek > 4000;

        // Discard stale pre-seek timeUpdates until ExoPlayer lands near target seek timestamp
        if (!hasReachedTarget && !isTimedOut) {
          return;
        }

        // Seek has successfully landed or timed out
        pendingSeekTimeRef.current = null;
        isSeekingRef.current = false;
      }

      currentTimeRef.current = event.currentTime;
      if (event.currentTime > 0.01) {
        setHasFirstFrameRendered(true);
      }

      // Always update currentTime state when controls are visible or seeking just completed
      if (controlsVisibleRef.current || !isSeekingRef.current) {
        setCurrentTime(event.currentTime);
      }

      // Track playback progression
      if (Math.abs(event.currentTime - lastPlaybackPositionRef.current) > 0.3) {
        lastPlaybackPositionRef.current = event.currentTime;
        lastProgressTimestampRef.current = now;
      }
    }
    if (player && player.duration && player.duration > 0 && player.duration !== duration) {
      setDuration(player.duration);
    }
  });

  // Dynamically listen to play/pause state changes
  useEventListener(player, 'playingChange', (event) => {
    if (event && typeof event.isPlaying === 'boolean') {
      setIsPlaying(event.isPlaying);
      if (event.isPlaying) {
        setHasFirstFrameRendered(true);
      }
    } else if (player) {
      setIsPlaying(player.playing);
      if (player.playing) {
        setHasFirstFrameRendered(true);
      }
    }
  });

  // Dynamically listen to status changes (e.g. readyToPlay, loading, error)
  useEventListener(player, 'statusChange', (event) => {
    const currentStatus = event?.status || (player ? player.status : null);

    if (currentStatus === 'readyToPlay') {
      setHasFirstFrameRendered(true);
      isSeekingRef.current = false;

      if (hasStartedPlayback) {
        try {
          player.play();
          setIsPlaying(true);
        } catch (e) {}
      } else {
        setIsPlaying(player.playing);
      }
      try {
        if (player.availableAudioTracks && player.availableAudioTracks.length > 0) {
          setAvailableAudioTracks(player.availableAudioTracks);
          applyDefaultEnglishIfHollywood(player.availableAudioTracks);
        }
        if (player.audioTrack) {
          setSelectedAudioTrack(player.audioTrack);
        }
        if (player.availableSubtitleTracks && player.availableSubtitleTracks.length > 0) {
          setAvailableSubtitleTracks(player.availableSubtitleTracks);
        }
        if (player.subtitleTrack) {
          setSelectedSubtitleTrack(player.subtitleTrack);
        }
      } catch (trackErr) {}
    }

    // Keep playback smooth without tearing down progressive streams during temporary buffering
    if (currentStatus === 'loading' && isPlaying && hasStartedPlayback && !isResolving) {
      stallsHistoryRef.current = [];
    }

    // Strictly only trigger playback error if user started playback AND scraping is finished and not resolving
    if (hasStartedPlayback && !isResolving && !isResolvingRef.current && (currentStatus === 'error')) {
      const errorMsg = event?.error?.message || 'Video stream could not be decoded or is offline.';
      console.warn('[MovieDetailScreen] Player error status detected:', errorMsg);
      try {
        if (player) {
          player.pause();
          player.replace(null);
        }
      } catch (e) {}
      setPlaybackError({
        title: 'Stream Playback Error',
        message: 'The video stream could not be played or is currently unavailable. Please try switching servers or retry.'
      });
      setIsPlaying(false);
      return;
    }
    if (player && player.duration && player.duration > 0 && player.duration !== duration) {
      setDuration(player.duration);
    }
  });

  // Dynamically listen to available audio tracks
  useEventListener(player, 'availableAudioTracksChange', (event) => {
    try {
      if (event?.availableAudioTracks && Array.isArray(event.availableAudioTracks)) {
        setAvailableAudioTracks(event.availableAudioTracks);
        applyDefaultEnglishIfHollywood(event.availableAudioTracks);
      }
    } catch (e) {}
  });

  // Dynamically listen to current audio track
  useEventListener(player, 'audioTrackChange', (event) => {
    try {
      if (event?.audioTrack) {
        setSelectedAudioTrack(event.audioTrack);
      }
    } catch (e) {}
  });

  // Dynamically listen to available subtitle tracks
  useEventListener(player, 'availableSubtitleTracksChange', (event) => {
    try {
      if (event?.availableSubtitleTracks && Array.isArray(event.availableSubtitleTracks)) {
        setAvailableSubtitleTracks(event.availableSubtitleTracks);
      }
    } catch (e) {}
  });

  // Dynamically listen to current subtitle track
  useEventListener(player, 'subtitleTrackChange', (event) => {
    try {
      setSelectedSubtitleTrack(event?.subtitleTrack || null);
    } catch (e) {}
  });



  // Dynamic Scraper & Player execution handler (Strict Server 1: HDHub4u, Server 2: 4KHDHub, Server 3: Movies4u)
  const playVideo = async (episode = currentEpisode, server = activeServer) => {
    const requestId = ++activeScrapeRequestId.current;
    isResolvingRef.current = true;
    setIsResolving(true);
    setPlaybackError(null);
    setResolvedQualities(null);

    // 1. Safely halt decoder and flush previous surface buffers
    if (player) {
      try {
        player.pause();
        player.replace(null);
      } catch (e) {}
    }
    hasAutoSelectedEnglish.current = false;
    hasUserManuallySelectedAudioTrack.current = false;
    setSelectedAudioTrack(null);
    setSelectedSubtitleTrack(null);
    setAvailableAudioTracks([]);
    setAvailableSubtitleTracks([]);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setHasFirstFrameRendered(false);
    setHasStartedPlayback(true);

    const targetSeason = episode?.seasonNumber || selectedSeason || 1;
    const targetEpisodeNum = episode?.episodeNumber || 1;
    const updatedEp = {
      ...episode,
      seasonNumber: targetSeason,
      episodeNumber: targetEpisodeNum
    };
    setCurrentEpisode(updatedEp);

    try {
      const origLang = (details.original_language || movie.original_language || '').toLowerCase();
      const originCountries = (details.origin_country || movie.origin_country || []);
      const prodCountries = (details.production_countries || []).map(c => c.iso_3166_1);
      
      const INDIAN_LANGS = ['ta', 'hi', 'te', 'ml', 'kn', 'mr', 'pa', 'bn', 'gu', 'or', 'as'];
      const isIndianContent = INDIAN_LANGS.includes(origLang) || 
                              originCountries.includes('IN') || 
                              prodCountries.includes('IN');

      // Strict Multi-Server Routing (Zero Cross-Fallback):
      // Server 1: strictly hdhub4u
      // Server 2: strictly 4khdhub
      // Server 3: strictly movies4u
      let providerValue = 'hdhub4u';
      let providerLabel = 'Server 1 (HDHub4u)';
      if (server === 3) {
        providerValue = 'movies4u';
        providerLabel = 'Server 3 (Movies4u)';
      } else if (server === 2) {
        providerValue = '4khdhub';
        providerLabel = 'Server 2 (4KHDHub)';
      } else {
        providerValue = 'hdhub4u';
        providerLabel = 'Server 1 (HDHub4u)';
      }
      const baseTitle = details.title || details.name || movie.title || movie.name || '';
      const cleanTitle = baseTitle.replace(/[:\-–—]/g, ' ').replace(/\s+/g, ' ').trim();
      const releaseYear = formatYear(details.release_date || details.first_air_date || movie.release_date);

      console.log(`[MovieDetailScreen] User clicked Play #${requestId}. Finding match for: "${cleanTitle}" (${releaseYear || 'N/A'}, Type: ${isTVShow ? `TV Series S${targetSeason}E${targetEpisodeNum}` : 'Movie'}) strictly on ${providerLabel}`);
      setResolvingStatus(
        isTVShow 
          ? `🔍 Searching Season ${targetSeason} • Episode ${targetEpisodeNum} on ${providerLabel}...`
          : `🔍 Searching "${cleanTitle}" on ${providerLabel}...`
      );

      // 2. Resolve direct high-speed streams via Vega Provider Ecosystem
      let playable = null;
      try {
        playable = await ExtensionManager.findAndResolvePlayableStream({
          provider: providerValue,
          targetTitle: cleanTitle,
          targetYear: releaseYear,
          isTVShow,
          seasonNumber: targetSeason,
          episodeNumber: targetEpisodeNum,
          originalLanguage: origLang,
          isIndianRegion: isIndianContent
        });
      } catch (e) {
        console.log(`[MovieDetailScreen] Primary Vega resolution note:`, e?.message || e);
      }

      if (requestId !== activeScrapeRequestId.current) return;

      let streamUrl = playable?.streamUrl;
      let qualities = playable?.qualities || {};

      // Fallback: If not resolved yet, attempt individual match + getPlayableStream
      if (!streamUrl) {
        const matchedData = await ExtensionManager.findBestMatchingMedia({
          provider: providerValue,
          targetTitle: cleanTitle,
          targetYear: releaseYear,
          isTVShow,
          seasonNumber: targetSeason,
          originalLanguage: origLang,
          isIndianRegion: isIndianContent
        });

        if (requestId !== activeScrapeRequestId.current) return;

        if (matchedData && matchedData.match) {
          const fallbackPlayable = await ExtensionManager.getPlayableStream(
            matchedData.provider,
            matchedData.match.link,
            isTVShow,
            isTVShow ? targetEpisodeNum : 1,
            isTVShow ? targetSeason : 1
          );

          if (requestId !== activeScrapeRequestId.current) return;

          if (fallbackPlayable?.streamUrl) {
            streamUrl = fallbackPlayable.streamUrl;
            qualities = fallbackPlayable.qualities || {};
          }
        }
      }

      if (!streamUrl) {
        throw new Error(`No working video streams found for "${cleanTitle}".`);
      }

      if (Object.keys(qualities).length === 0) {
        const detectedFromUrl = (streamUrl.toLowerCase().includes('2160') || streamUrl.toLowerCase().includes('4k') || streamUrl.toLowerCase().includes('uhd'))
          ? '4k'
          : (streamUrl.toLowerCase().includes('720') ? '720p' : '1080p');
        qualities[detectedFromUrl] = streamUrl;
      }

      setResolvedQualities(qualities);

      const initialQuality = (qualities['1080p'] ? '1080p' : (qualities['4k'] ? '4k' : (qualities['720p'] ? '720p' : Object.keys(qualities)[0])));
      const initialStreamLink = qualities[initialQuality] || streamUrl;
      setCurrentQuality(initialQuality);
      console.log(`[MovieDetailScreen] ✅ Extracted available streams:`, qualities);
      console.log(`[MovieDetailScreen] ▶️ Playing initial stream (${initialQuality}): ${initialStreamLink}`);

      setIsResolving(false);
      isResolvingRef.current = false;
      setHasStartedPlayback(true);
      setControlsVisible(true);
      resetControlsTimeout();

      // 4. Feed streaming link directly to Media3 ExoPlayer cleanly (prevents black screen with audio)
      if (player && requestId === activeScrapeRequestId.current && isMounted.current) {
        try {
          const safeInitialLink = initialStreamLink.trim();
          const isHls = safeInitialLink.toLowerCase().includes('.m3u8');
          const isDirectCdn = safeInitialLink.includes('pixeldrain') || 
                              safeInitialLink.includes('googleusercontent.com') ||
                              safeInitialLink.includes('cloudflarestorage.com') ||
                              safeInitialLink.includes('fastdl') ||
                              safeInitialLink.includes('bunker.monster');

          const isM4u = safeInitialLink.includes('dramiyos') || safeInitialLink.includes('m4uplay');
          const videoHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Connection': 'keep-alive',
            ...(playable?.headers?.Referer 
              ? { 'Referer': playable.headers.Referer } 
              : (!isDirectCdn ? { 'Referer': isM4u ? 'https://m4uplay.store/' : 'https://gamerxyt.com/' } : {}))
          };

          const videoSource = {
            uri: safeInitialLink,
            headers: videoHeaders,
            contentType: isHls ? 'hls' : 'auto'
          };

          setPlaybackError(null);
          player.pause();
          if (typeof player.replaceAsync === 'function') {
            await player.replaceAsync(videoSource);
          } else if (typeof player.replace === 'function') {
            player.replace(videoSource);
          }
          if (isMounted.current && player) {
            try {
              player.playbackRate = playbackSpeed || 1.0;
            } catch (e) {}
            player.play();
            setIsPlaying(true);
          }
        } catch (playerErr) {
          console.warn("[MovieDetailScreen] Media3 player replace error:", playerErr);
          if (isMounted.current && player) {
            try {
              const safeInitialLink = initialStreamLink.trim();
              if (typeof player.replaceAsync === 'function') {
                await player.replaceAsync(safeInitialLink);
              } else {
                player.replace(safeInitialLink);
              }
              player.play();
              setIsPlaying(true);
            } catch (e2) {}
          }
        }
      }

    } catch (e) {
      if (requestId !== activeScrapeRequestId.current || !isMounted.current) return;
      console.warn("[MovieDetailScreen] Scraper error:", e.message || e);
      isResolvingRef.current = false;
      setIsResolving(false);
      setIsPlaying(false);
      const serverObj = servers.find((s) => s.id === server);
      const serverName = serverObj ? serverObj.desc : `Server ${server}`;
      const baseTitle = details.title || details.name || movie.title || movie.name || 'this media';
      setPlaybackError({
        title: 'Playback Unavailable',
        message: `Could not connect to a working direct stream for "${baseTitle}" on ${serverName}. Please try switching to another server or retry.`,
        server: server
      });
    }
  };

  // Launch stream on a chosen quality resolution safely without freezing or re-scraping
  const playResolvedLink = async (streamUrl, targetQuality, updateMode = true) => {
    if (!streamUrl || !player || !isMounted.current) return;
    const targetQ = (targetQuality || currentQuality).toLowerCase();
    setCurrentQuality(targetQ);
    if (updateMode && targetQ !== 'auto') {
      setQualityMode(targetQ);
    }
    setPlaybackError(null);
    setHasFirstFrameRendered(false);
    const previousTime = (typeof player.currentTime === 'number' && player.currentTime > 0 ? player.currentTime : (currentTimeRef.current || currentTime)) || 0;
    
    console.log(`[MovieDetailScreen] ⚡ Seamless switch to ${targetQ.toUpperCase()} stream at position ${previousTime.toFixed(1)}s: ${streamUrl}`);
    try {
      // 1. Clear previous track overrides to prevent mismatched TrackGroup index crashes
      hasAutoSelectedEnglish.current = false;
      setSelectedAudioTrack(null);
      setSelectedSubtitleTrack(null);
      setAvailableAudioTracks([]);
      setAvailableSubtitleTracks([]);

      // 2. Safely halt decoder and flush previous surface buffers
      try {
        player.pause();
        player.replace(null);
      } catch (e) {}

      // 3. Allow native Looper 80ms to cleanly release previous hardware MediaCodec instance
      await new Promise((resolve) => setTimeout(resolve, 80));
      if (!isMounted.current || !player) return;

      const safeStreamUrl = streamUrl.trim();
      const isHls = safeStreamUrl.toLowerCase().includes('.m3u8');
      const isDirectCdn = safeStreamUrl.includes('pixeldrain') || 
                          safeStreamUrl.includes('googleusercontent.com') ||
                          safeStreamUrl.includes('cloudflarestorage.com') ||
                          safeStreamUrl.includes('fastdl') ||
                          safeStreamUrl.includes('bunker.monster');

      const isM4u = safeStreamUrl.includes('dramiyos') || safeStreamUrl.includes('m4uplay');
      const defaultReferer = isM4u ? 'https://m4uplay.store/' : 'https://gamerxyt.com/';
      const videoSource = {
        uri: safeStreamUrl,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Connection': 'keep-alive',
          ...(!isDirectCdn ? { 'Referer': defaultReferer } : {})
        },
        contentType: isHls ? 'hls' : 'auto'
      };

      if (typeof player.replaceAsync === 'function') {
        await player.replaceAsync(videoSource);
      } else if (typeof player.replace === 'function') {
        player.replace(videoSource);
      }

      if (isMounted.current && player) {
        try {
          player.bufferOptions = {
            preferredForwardBufferDuration: 120,
            waitsToMinimizeStalling: false,
            minBufferForPlayback: 0.5,
            maxBufferBytes: 0,
            prioritizeTimeOverSizeThreshold: true,
          };
        } catch (bErr) {}

        try {
          player.playbackRate = playbackSpeed || 1.0;
        } catch (e) {}
        
        // Instant timestamp restoration so playback never restarts from the beginning
        if (previousTime > 0.5) {
          try {
            player.currentTime = previousTime;
          } catch (tErr) {}
          setTimeout(() => {
            if (isMounted.current && player) {
              try {
                player.currentTime = previousTime;
              } catch (e) {}
            }
          }, 150);
        }

        player.play();
        setIsPlaying(true);
      }
    } catch (e) {
      console.warn("[MovieDetailScreen] playResolvedLink error:", e);
      if (isMounted.current && player) {
        try {
          const safeStreamUrl = streamUrl.trim();
          if (typeof player.replaceAsync === 'function') {
            await player.replaceAsync(safeStreamUrl);
          } else {
            player.replace(safeStreamUrl);
          }
          if (previousTime > 0.5) {
            try { player.currentTime = previousTime; } catch (e) {}
          }
          player.play();
          setIsPlaying(true);
        } catch (fallbackErr) {}
      }
    }
    resetControlsTimeout();
  };

  // Safe Audio Track Switcher (Strictly uses native AudioTrack reference to prevent JNI crash)
  const switchAudioTrack = (track) => {
    if (!player) return;
    hasUserManuallySelectedAudioTrack.current = true;
    try {
      const nativeTracks = player.availableAudioTracks;
      if (Array.isArray(nativeTracks) && nativeTracks.length > 0 && track) {
        let nativeTarget = null;
        if (typeof track.originalIndex === 'number' && nativeTracks[track.originalIndex]) {
          nativeTarget = nativeTracks[track.originalIndex];
        } else {
          nativeTarget = nativeTracks.find(
            (t) => (track.id && t.id === track.id) ||
                   (track.language && t.language && t.language.toLowerCase() === track.language.toLowerCase()) ||
                   (track.label && t.label && t.label.toLowerCase() === track.label.toLowerCase())
          );
        }
        if (nativeTarget) {
          console.log('[MovieDetailScreen] 🔊 Switching audio track to native track:', nativeTarget);
          player.audioTrack = nativeTarget;
          setSelectedAudioTrack(nativeTarget);
        }
      }
    } catch (e) {
      console.warn("[MovieDetailScreen] Error setting audioTrack:", e);
    }
    closePlayerMenu();
  };

  // Safe Subtitle Track Switcher (Strictly uses native SubtitleTrack reference to prevent JNI crash)
  const switchSubtitleTrack = (track) => {
    if (!player) return;
    try {
      if (!track) {
        player.subtitleTrack = null;
        setSelectedSubtitleTrack(null);
      } else {
        const nativeSubs = player.availableSubtitleTracks;
        if (Array.isArray(nativeSubs) && nativeSubs.length > 0) {
          let nativeSub = null;
          if (typeof track.originalIndex === 'number' && nativeSubs[track.originalIndex]) {
            nativeSub = nativeSubs[track.originalIndex];
          } else {
            nativeSub = nativeSubs.find(
              (s) => (track.id && s.id === track.id) ||
                     (track.language && s.language && s.language.toLowerCase() === track.language.toLowerCase()) ||
                     (track.label && s.label && s.label.toLowerCase() === track.label.toLowerCase())
            );
          }
          if (nativeSub) {
            console.log('[MovieDetailScreen] 💬 Switching subtitle track to:', nativeSub);
            player.subtitleTrack = nativeSub;
            setSelectedSubtitleTrack(nativeSub);
          }
        }
      }
    } catch (e) {
      console.warn("[MovieDetailScreen] Error setting subtitleTrack:", e);
    }
    closePlayerMenu();
  };

  // Switch between Auto (ABR), 1080p, 4K, 720p
  const toggleQuality = (quality) => {
    const qKey = quality.toLowerCase();

    if (qKey === 'auto' || qKey === 'abr') {
      setQualityMode('auto');
      showAbrToast('⚡ Auto (ABR) Activated: Dynamic stream adaptation');
      if (resolvedQualities && resolvedQualities['1080p']) {
        playResolvedLink(resolvedQualities['1080p'], '1080p', false);
      }
      return;
    }

    setQualityMode(qKey);
    let targetUrl = null;
    if (resolvedQualities && typeof resolvedQualities === 'object') {
      targetUrl = resolvedQualities[qKey] || resolvedQualities[quality];
      if (!targetUrl) {
        const keys = Object.keys(resolvedQualities);
        const match = keys.find(k => k.toLowerCase().includes(qKey) || qKey.includes(k.toLowerCase()));
        if (match) targetUrl = resolvedQualities[match];
      }
    }

    if (!targetUrl && currentEpisode?.videoUrl) {
      targetUrl = currentEpisode.videoUrl;
    }

    if (targetUrl) {
      playResolvedLink(targetUrl, qKey, true);
    } else {
      console.warn(`[MovieDetailScreen] Quality ${quality} is not in waiting list:`, resolvedQualities);
    }
  };

  // Fullscreen Landscape Toggle with System Orientation Support
  const toggleFullscreen = () => {
    Animated.sequence([
      Animated.timing(fullscreenScaleAnim, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(fullscreenScaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    setIsFullscreen((prev) => !prev);
    setControlsVisible(true);
    resetControlsTimeout();
  };

  // Synchronize Hardware Screen Orientation and Immersive System Fullscreen (App-level player fullscreen only)
  useEffect(() => {
    const handleOrientationAndSystemUI = async () => {
      try {
        if (isFullscreen) {
          // Lock to horizontal Landscape mode exclusively for the active video player
          if (ScreenOrientation && typeof ScreenOrientation.lockAsync === 'function') {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
          }
          StatusBar.setHidden(true, 'fade');
          if (Platform.OS === 'android' && NavigationBar) {
            try {
              if (typeof NavigationBar.setHidden === 'function') {
                NavigationBar.setHidden(true);
              } else if (typeof NavigationBar.setVisibilityAsync === 'function') {
                await NavigationBar.setVisibilityAsync('hidden');
              }
            } catch (e) {}
          }
        } else {
          // Unlock back to system auto-rotate when exiting player fullscreen
          if (ScreenOrientation && typeof ScreenOrientation.unlockAsync === 'function') {
            await ScreenOrientation.unlockAsync();
          }
          StatusBar.setHidden(false, 'fade');
          if (Platform.OS === 'android' && NavigationBar) {
            try {
              if (typeof NavigationBar.setHidden === 'function') {
                NavigationBar.setHidden(false);
              } else if (typeof NavigationBar.setVisibilityAsync === 'function') {
                await NavigationBar.setVisibilityAsync('visible');
              }
            } catch (e) {}
          }
        }
      } catch (err) {
        console.warn('[MovieDetailScreen] Orientation change error:', err);
      }
    };

    handleOrientationAndSystemUI();
  }, [isFullscreen]);

  // Listen to physical device orientation changes to auto-toggle player fullscreen
  useEffect(() => {
    let subscription = null;
    try {
      if (ScreenOrientation && typeof ScreenOrientation.addOrientationChangeListener === 'function') {
        subscription = ScreenOrientation.addOrientationChangeListener((event) => {
          const orientation = event?.orientationInfo?.orientation;
          const isLandscapeOrientation = 
            orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT || 
            orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT;
          
          if (isLandscapeOrientation && !isFullscreen) {
            setIsFullscreen(true);
          } else if (!isLandscapeOrientation && isFullscreen) {
            setIsFullscreen(false);
          }
        });
      }
    } catch (e) {}

    return () => {
      if (subscription && typeof ScreenOrientation.removeOrientationChangeListener === 'function') {
        ScreenOrientation.removeOrientationChangeListener(subscription);
      }
    };
  }, [isFullscreen]);

  // Clean up player, unlock orientation and restore system UI when unmounting MovieDetailScreen
  useEffect(() => {
    return () => {
      activeScrapeRequestId.current++;
      if (player) {
        try {
          player.pause();
        } catch (e) {}
      }
      if (ScreenOrientation && typeof ScreenOrientation.unlockAsync === 'function') {
        ScreenOrientation.unlockAsync().catch(() => {});
      }
      StatusBar.setHidden(false, 'fade');
      if (Platform.OS === 'android' && NavigationBar) {
        try {
          if (typeof NavigationBar.setHidden === 'function') {
            NavigationBar.setHidden(false);
          } else if (typeof NavigationBar.setVisibilityAsync === 'function') {
            NavigationBar.setVisibilityAsync('visible').catch(() => {});
          }
        } catch (e) {}
      }
    };
  }, [player]);

  // Android Hardware Back button handling while in Fullscreen
  useEffect(() => {
    const onBackPress = () => {
      if (isFullscreen) {
        toggleFullscreen();
        return true; // Exits fullscreen smoothly without navigating away from detail screen
      }
      return false; // Allows normal detail screen back handler
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [isFullscreen]);

  const toggleControls = () => {
    if (isControlsLocked) {
      setControlsVisible(true);
      resetControlsTimeout();
      return;
    }
    setControlsVisible((prev) => {
      const next = !prev;
      if (next) {
        resetControlsTimeout();
      } else {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        closePlayerMenu();
      }
      return next;
    });
  };

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
      closePlayerMenu();
    }, 3500);
  };

  // Big Player Play/Pause Button Handler
  const handlePlayerPlayPause = () => {
    if (!hasStartedPlayback || !resolvedQualities) {
      playVideo(currentEpisode, activeServer);
      return;
    }

    if (player) {
      try {
        if (isPlaying) {
          player.pause();
        } else {
          player.play();
        }
      } catch (e) {
        console.warn("[MovieDetailScreen] Error toggling play/pause:", e);
      }
    }
    setIsPlaying(!isPlaying);
    resetControlsTimeout();
  };

  const handleMuteToggle = () => {
    if (player) {
      try {
        player.muted = !isMuted;
      } catch (e) {}
    }
    setIsMuted(!isMuted);
    resetControlsTimeout();
  };

  const skipForward = () => {
    if (player) {
      try {
        const safeDuration = duration > 0 ? duration : (player?.duration > 0 ? player.duration : 100000);
        const baseTime = (pendingSeekTimeRef.current !== null && typeof pendingSeekTimeRef.current === 'number')
          ? pendingSeekTimeRef.current
          : ((typeof currentTimeRef.current === 'number' && currentTimeRef.current >= 0) 
            ? currentTimeRef.current 
            : ((typeof player.currentTime === 'number' && player.currentTime >= 0) ? player.currentTime : (currentTime || 0)));
        const target = Math.min(safeDuration, Math.max(0, baseTime + 10));

        pendingSeekTimeRef.current = target;
        isSeekingRef.current = true;
        lastSeekTimestampRef.current = Date.now();
        stallsHistoryRef.current = [];
        currentTimeRef.current = target;
        setCurrentTime(target);
        player.currentTime = target;
      } catch (e) {
        console.warn('[MovieDetailScreen] skipForward error:', e);
      }
    }
    resetControlsTimeout();
  };

  const skipBackward = () => {
    if (player) {
      try {
        const baseTime = (pendingSeekTimeRef.current !== null && typeof pendingSeekTimeRef.current === 'number')
          ? pendingSeekTimeRef.current
          : ((typeof currentTimeRef.current === 'number' && currentTimeRef.current >= 0) 
            ? currentTimeRef.current 
            : ((typeof player.currentTime === 'number' && player.currentTime >= 0) ? player.currentTime : (currentTime || 0)));
        const target = Math.max(0, baseTime - 10);

        pendingSeekTimeRef.current = target;
        isSeekingRef.current = true;
        lastSeekTimestampRef.current = Date.now();
        stallsHistoryRef.current = [];
        currentTimeRef.current = target;
        setCurrentTime(target);
        player.currentTime = target;
      } catch (e) {
        console.warn('[MovieDetailScreen] skipBackward error:', e);
      }
    }
    resetControlsTimeout();
  };

  const changePlaybackSpeed = (speed) => {
    setPlaybackSpeed(speed);
    if (player) {
      try {
        player.playbackRate = speed;
      } catch (e) {}
    }
    closePlayerMenu();
  };

  const toggleContentFitMode = () => {
    setContentFitMode(prev => prev === 'contain' ? 'cover' : 'contain');
  };

  const toggleScreenLock = () => {
    setIsControlsLocked(prev => {
      const next = !prev;
      isControlsLockedRef.current = next;
      return next;
    });
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setControlsVisible(false);
  };

  const showDoubleTapFeedback = (side) => {
    setDoubleTapFeedback(side);
    doubleTapOpacity.setValue(1);
    Animated.timing(doubleTapOpacity, {
      toValue: 0,
      duration: 650,
      useNativeDriver: true,
    }).start(() => {
      setDoubleTapFeedback(null);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 8;
      },
      onPanResponderGrant: (evt) => {
        if (isControlsLockedRef.current) return;
        const { locationX, locationY } = evt.nativeEvent;
        startTouchX.current = locationX;
        startTouchY.current = locationY;
        isDragging.current = false;

        const currentW = playerLayoutRef.current.width || windowWidth;
        const isLeft = locationX < currentW / 2;
        if (isLeft) {
          initialGestureVal.current = brightnessRef.current;
        } else {
          initialGestureVal.current = volumeLevelRef.current;
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (isControlsLockedRef.current) return;
        if (Math.abs(gestureState.dy) > 8) {
          isDragging.current = true;
          const currentW = playerLayoutRef.current.width || windowWidth;
          const currentH = playerLayoutRef.current.height || (windowWidth * 9) / 16;
          const isLeft = startTouchX.current < currentW / 2;

          // Dragging up (negative dy) increases value; dragging down (positive dy) decreases
          // Calibrated to smooth 280px range so every single movement changes value smoothly
          const delta = -gestureState.dy / Math.max(280, currentH * 0.85);

          if (isLeft) {
            // Brightness control (range 0.01 to 0.99)
            const nextBrightness = Math.max(0.01, Math.min(0.99, initialGestureVal.current + delta));
            brightnessRef.current = nextBrightness;
            setBrightness(nextBrightness);
            try {
              Brightness.setBrightnessAsync(nextBrightness);
            } catch (e) {}
            showGesturePill('brightness');
          } else {
            // Volume control (range 0.0 to 1.0)
            const nextVolume = Math.max(0.0, Math.min(1.0, initialGestureVal.current + delta));
            volumeLevelRef.current = nextVolume;
            setVolumeLevel(nextVolume);
            if (player) {
              try {
                player.volume = nextVolume;
                if (nextVolume > 0 && isMuted) {
                  setIsMuted(false);
                  player.muted = false;
                }
              } catch (e) {}
            }
            showGesturePill('volume');
          }
        }
      },
      onPanResponderRelease: (evt) => {
        if (isDragging.current) {
          hideGesturePill();
          isDragging.current = false;
          return;
        }

        if (isControlsLockedRef.current) {
          setControlsVisible(true);
          resetControlsTimeout();
          return;
        }

        if (isResolving) {
          return;
        }

        if (activePlayerMenu !== 'none') {
          closePlayerMenu();
          return;
        }

        // Handle tap / double-tap
        const now = Date.now();
        const { locationX } = evt.nativeEvent;
        const currentW = playerLayoutRef.current.width || windowWidth;
        const timeDiff = now - lastTapRef.current.time;
        const distDiff = Math.abs(locationX - lastTapRef.current.x);

        if (timeDiff < 380 && distDiff < 100) {
          // Double Tap!
          lastTapRef.current = { time: now, x: locationX };
          if (locationX < currentW * 0.42) {
            skipBackward();
            showDoubleTapFeedback('left');
          } else if (locationX > currentW * 0.58) {
            skipForward();
            showDoubleTapFeedback('right');
          } else {
            handlePlayerPlayPause();
          }
        } else {
          lastTapRef.current = { time: now, x: locationX };
          toggleControls();
        }
      }
    })
  ).current;

  const getScrubberSeekTime = (evt) => {
    const safeDuration = duration > 0 ? duration : (player?.duration > 0 ? player.duration : 0);
    if (safeDuration <= 0) return 0;

    const screenW = playerLayoutRef.current.width || windowWidth;
    const paddingX = isFullscreen ? Math.max(insets.left, scale(20)) : scale(10);
    const effectiveWidth = scrubberWidth > 0 ? scrubberWidth : Math.max(1, screenW - (paddingX * 2));
    
    let touchX = 0;
    if (evt?.nativeEvent?.locationX !== undefined) {
      touchX = evt.nativeEvent.locationX;
    } else if (evt?.nativeEvent?.pageX !== undefined && scrubberPageXRef.current > 0) {
      touchX = evt.nativeEvent.pageX - scrubberPageXRef.current;
    }
    const progressPercent = Math.max(0, Math.min(1, touchX / (effectiveWidth || 1)));
    return Math.max(0, Math.min(safeDuration, progressPercent * safeDuration));
  };

  const scrubberPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (evt) => {
        if (!player || isControlsLockedRef.current) return;
        isScrubbingRef.current = true;
        const targetSeekTime = getScrubberSeekTime(evt);
        pendingSeekTimeRef.current = targetSeekTime;
        currentTimeRef.current = targetSeekTime;
        setCurrentTime(targetSeekTime);
        resetControlsTimeout();
      },
      onPanResponderMove: (evt) => {
        if (!player || isControlsLockedRef.current) return;
        const targetSeekTime = getScrubberSeekTime(evt);
        pendingSeekTimeRef.current = targetSeekTime;
        currentTimeRef.current = targetSeekTime;
        setCurrentTime(targetSeekTime);
        resetControlsTimeout();
      },
      onPanResponderRelease: (evt) => {
        if (!player || isControlsLockedRef.current) return;
        isScrubbingRef.current = false;
        isSeekingRef.current = true;
        lastSeekTimestampRef.current = Date.now();
        stallsHistoryRef.current = [];
        const targetSeekTime = getScrubberSeekTime(evt);
        pendingSeekTimeRef.current = targetSeekTime;
        currentTimeRef.current = targetSeekTime;
        setCurrentTime(targetSeekTime);
        try {
          player.currentTime = targetSeekTime;
        } catch (e) {
          console.warn('[MovieDetailScreen] Scrubber seek error:', e);
        }
        resetControlsTimeout();
      },
      onPanResponderTerminate: () => {
        if (!player || isControlsLockedRef.current) return;
        isScrubbingRef.current = false;
        isSeekingRef.current = true;
        lastSeekTimestampRef.current = Date.now();
        stallsHistoryRef.current = [];
        const targetSeekTime = currentTimeRef.current;
        pendingSeekTimeRef.current = targetSeekTime;
        try {
          player.currentTime = targetSeekTime;
        } catch (e) {
          console.warn('[MovieDetailScreen] Scrubber seek error:', e);
        }
        resetControlsTimeout();
      }
    })
  ).current;

  const handleScrubberTouch = (event) => {
    const safeDuration = duration > 0 ? duration : (player?.duration > 0 ? player.duration : 0);
    if (safeDuration <= 0) return;
    const targetSeekTime = getScrubberSeekTime(event);

    isSeekingRef.current = true;
    lastSeekTimestampRef.current = Date.now();
    stallsHistoryRef.current = [];
    pendingSeekTimeRef.current = targetSeekTime;
    currentTimeRef.current = targetSeekTime;
    setCurrentTime(targetSeekTime);
    if (player) {
      try {
        player.currentTime = targetSeekTime;
      } catch (e) {
        console.warn('[MovieDetailScreen] Scrubber seek error:', e);
      }
    }
    resetControlsTimeout();
  };

  // Dynamic seconds counter and total duration formatter
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds == null || seconds < 0) return '0:00';
    const totalSecs = Math.floor(seconds);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`;

    if (hrs > 0) {
      const formattedMins = mins < 10 ? `0${mins}` : `${mins}`;
      return `${hrs}:${formattedMins}:${formattedSecs}`;
    }
    return `${mins}:${formattedSecs}`;
  };

  const handleServerChange = (serverId) => {
    setActiveServer(serverId);
    setPlaybackError(null);
    isResolvingRef.current = true;
    playVideo(currentEpisode, serverId);
  };

  const selectEpisode = (episode) => {
    const updatedEp = {
      ...episode,
      seasonNumber: episode.seasonNumber || selectedSeason || 1,
      episodeNumber: episode.episodeNumber || 1
    };
    setCurrentEpisode(updatedEp);
    playVideo(updatedEp, activeServer);
  };

  // TMDB Genre ID Map Fallback
  const TMDB_GENRE_MAP = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
    10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
    10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics'
  };

  // TMDB Metadata fields with instant fallbacks from movie prop
  const displayTitle = details.title || details.name || movie.title || movie.name || 'Movie Details';
  const originalTitle = details.original_title || details.original_name;
  const tagline = details.tagline;
  const releaseYear = formatYear(details.release_date || details.first_air_date || movie.release_date || movie.first_air_date) || '';
  const releaseFullDate = details.release_date || details.first_air_date || movie.release_date;
  const rawVote = details.vote_average || movie.vote_average;
  const voteRating = rawVote ? Number(rawVote).toFixed(1) : null;
  const rawVoteCount = details.vote_count || movie.vote_count;
  const voteCount = rawVoteCount ? Number(rawVoteCount).toLocaleString() : null;
  
  const runtimeDisplay = isTVShow 
    ? `${details.number_of_seasons || seasons.length || 1} Season${(details.number_of_seasons || seasons.length) > 1 ? 's' : ''} • ${details.number_of_episodes || (episodesList.length * (seasons.length || 1)) || 'All'} Eps`
    : formatRuntime(details.runtime);

  const genresList = (details.genres && details.genres.length > 0)
    ? details.genres
    : (movie.genres && movie.genres.length > 0)
      ? movie.genres
      : (movie.genre_ids && Array.isArray(movie.genre_ids))
        ? movie.genre_ids.map(id => ({ id, name: TMDB_GENRE_MAP[id] })).filter(g => g.name)
        : [];

  const statusDisplay = details.status || 'Released';
  const originalLanguage = (details.original_language || movie.original_language || 'en').toUpperCase();
  const certification = isTVShow
    ? details.content_ratings?.results?.find(r => r.iso_3166_1 === 'US' || r.iso_3166_1 === 'IN')?.rating
    : details.release_dates?.results?.find(r => r.iso_3166_1 === 'US' || r.iso_3166_1 === 'IN')?.release_dates?.find(d => d.certification)?.certification;
  
  // Crew Helpers
  const directorName = getDirector(crew);
  const writersNames = getWriters(crew);
  const budgetFormatted = formatCurrency(details.budget);
  const revenueFormatted = formatCurrency(details.revenue);
  const productionCompanies = details.production_companies || [];
  const productionCountries = details.production_countries || [];
  const networksList = details.networks || [];
  const spokenLanguages = details.spoken_languages?.map(l => l.english_name || l.name).join(', ') || null;

  // Render Video Player and its In-Player Controls / Menus (Used for both Inline 16:9 and Fullscreen Landscape)
  const renderVideoPlayerContent = (isFullscreenMode = false) => {
    const isPortrait = !isFullscreenMode;
    const playerW = playerLayout.width || windowWidth;
    const playerH = playerLayout.height || (windowWidth * 9) / 16;

    // Dynamically scale player feature icons and controls based on player size without overflow
    const topBtnSize = isPortrait 
      ? Math.max(30, Math.min(36, Math.round(playerW * 0.088))) 
      : Math.max(42, Math.min(50, Math.round(playerH * 0.12)));
    const topIconSize = isPortrait 
      ? Math.max(15, Math.min(18, Math.round(playerW * 0.045))) 
      : Math.max(20, Math.min(25, Math.round(playerH * 0.06)));

    const centerPlayBtnSize = isPortrait 
      ? Math.max(54, Math.min(66, Math.round(playerW * 0.15))) 
      : Math.max(72, Math.min(90, Math.round(playerH * 0.22)));
    const centerPlayIconSize = isPortrait 
      ? Math.max(28, Math.min(34, Math.round(playerW * 0.08))) 
      : Math.max(38, Math.min(48, Math.round(playerH * 0.11)));

    const centerSkipBtnSize = isPortrait 
      ? Math.max(38, Math.min(48, Math.round(playerW * 0.11))) 
      : Math.max(52, Math.min(64, Math.round(playerH * 0.15)));
    const centerSkipIconSize = isPortrait 
      ? Math.max(20, Math.min(25, Math.round(playerW * 0.06))) 
      : Math.max(28, Math.min(34, Math.round(playerH * 0.08)));

    const qualityBadgeTextSize = isPortrait ? 10 : 13;
    const qualityBadgePaddingH = isPortrait ? 8 : 12;
    const qualityBadgePaddingV = isPortrait ? 4 : 6;
    const bottomBtnSize = isPortrait 
      ? Math.max(26, Math.min(30, Math.round(playerW * 0.075))) 
      : Math.max(34, Math.min(42, Math.round(playerH * 0.10)));
    const bottomIconSize = isPortrait 
      ? Math.max(13, Math.min(16, Math.round(playerW * 0.040))) 
      : Math.max(18, Math.min(22, Math.round(playerH * 0.055)));
    const bottomBadgePaddingH = isPortrait ? scale(6) : scale(10);

    return (
      <View 
        onLayout={(e) => {
          setPlayerLayout(e.nativeEvent.layout);
          playerLayoutRef.current = e.nativeEvent.layout;
        }}
        style={{ width: '100%', height: '100%', backgroundColor: '#000000', position: 'relative', overflow: 'hidden' }}
      >
        {/* VideoView remains permanently mounted so Android MediaCodec Surface is never detached */}
        <VideoView
          ref={videoViewRef}
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit={contentFitMode || 'contain'}
          surfaceType="textureView"
          useExoShutter={false}
          nativeControls={false}
          onFirstFrameRender={() => {
            setHasFirstFrameRendered(true);
          }}
        />

        {/* Poster backdrop overlay ONLY while user has not initiated playback */}
        {!hasStartedPlayback && (
          <Image
            source={{ 
              uri: getBackdropUrl(details.backdrop_path || movie.backdrop_path) || 
                   getPosterUrl(details.poster_path || movie.poster_path) ||
                   'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop'
            }}
            style={[StyleSheet.absoluteFill, { zIndex: 5 }]}
            resizeMode="cover"
          />
        )}

        {/* Dynamic Screen Dimming / Brightness Overlay */}
        {brightness < 0.98 && (
          <View 
            pointerEvents="none" 
            style={[
              StyleSheet.absoluteFill, 
              { 
                backgroundColor: '#000000', 
                opacity: (1 - brightness) * 0.82,
                zIndex: 10
              }
            ]} 
          />
        )}

        {/* Double-tap visual feedback overlays */}
        {doubleTapFeedback === 'left' && (
          <Animated.View 
            pointerEvents="none" 
            style={{ 
              opacity: doubleTapOpacity,
              position: 'absolute',
              left: isPortrait ? scale(24) : scale(56),
              top: '50%',
              marginTop: isPortrait ? scale(-32) : scale(-44),
              zIndex: 60
            }}
          >
            <View style={{ width: isPortrait ? scale(64) : scale(88), height: isPortrait ? scale(64) : scale(88), alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: scale(44), borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.5)' }}>
              <MaterialIcons name="replay-10" size={isPortrait ? scale(30) : scale(42)} color="#38bdf8" />
              <Text style={{ fontSize: moderateScale(isPortrait ? 11 : 14), color: '#38bdf8', fontWeight: '800', marginTop: verticalScale(2) }}>-10s</Text>
            </View>
          </Animated.View>
        )}

        {doubleTapFeedback === 'right' && (
          <Animated.View 
            pointerEvents="none" 
            style={{ 
              opacity: doubleTapOpacity,
              position: 'absolute',
              right: isPortrait ? scale(24) : scale(56),
              top: '50%',
              marginTop: isPortrait ? scale(-32) : scale(-44),
              zIndex: 60
            }}
          >
            <View style={{ width: isPortrait ? scale(64) : scale(88), height: isPortrait ? scale(64) : scale(88), alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: scale(44), borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.5)' }}>
              <MaterialIcons name="forward-10" size={isPortrait ? scale(30) : scale(42)} color="#38bdf8" />
              <Text style={{ fontSize: moderateScale(isPortrait ? 11 : 14), color: '#38bdf8', fontWeight: '800', marginTop: verticalScale(2) }}>+10s</Text>
            </View>
          </Animated.View>
        )}

        {/* Left Side Swipe: Brightness Indicator Overlay */}
        {gestureIndicator === 'brightness' && (
          <Animated.View
            pointerEvents="none"
            style={{
              opacity: gestureIndicatorAnim,
              position: 'absolute',
              left: isPortrait ? scale(28) : scale(60),
              top: '50%',
              marginTop: verticalScale(-55),
              backgroundColor: 'rgba(10, 10, 15, 0.9)',
              paddingHorizontal: scale(14),
              paddingVertical: verticalScale(16),
              borderRadius: scale(18),
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(251, 191, 36, 0.45)',
              zIndex: 65,
              shadowColor: '#fbbf24',
              shadowOpacity: 0.35,
              shadowRadius: 10
            }}
          >
            <Ionicons name={brightness > 0.5 ? "sunny" : "sunny-outline"} size={scale(24)} color="#fbbf24" />
            <View style={{ width: scale(6), height: verticalScale(50), backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: scale(3), marginVertical: verticalScale(8), overflow: 'hidden', justifyContent: 'flex-end' }}>
              <View style={{ width: '100%', height: `${Math.round(brightness * 100)}%`, backgroundColor: '#fbbf24', borderRadius: scale(3) }} />
            </View>
            <Text style={{ color: '#fbbf24', fontSize: moderateScale(11), fontWeight: '800' }}>
              {Math.round(brightness * 100)}%
            </Text>
          </Animated.View>
        )}

        {/* Right Side Swipe: Volume Indicator Overlay */}
        {gestureIndicator === 'volume' && (
          <Animated.View
            pointerEvents="none"
            style={{
              opacity: gestureIndicatorAnim,
              position: 'absolute',
              right: isPortrait ? scale(28) : scale(60),
              top: '50%',
              marginTop: verticalScale(-55),
              backgroundColor: 'rgba(10, 10, 15, 0.9)',
              paddingHorizontal: scale(14),
              paddingVertical: verticalScale(16),
              borderRadius: scale(18),
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(56, 189, 248, 0.45)',
              zIndex: 65,
              shadowColor: '#38bdf8',
              shadowOpacity: 0.35,
              shadowRadius: 10
            }}
          >
            <Ionicons name={volumeLevel === 0 ? "volume-mute" : (volumeLevel > 0.5 ? "volume-high" : "volume-low")} size={scale(24)} color="#38bdf8" />
            <View style={{ width: scale(6), height: verticalScale(50), backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: scale(3), marginVertical: verticalScale(8), overflow: 'hidden', justifyContent: 'flex-end' }}>
              <View style={{ width: '100%', height: `${Math.round(volumeLevel * 100)}%`, backgroundColor: '#38bdf8', borderRadius: scale(3) }} />
            </View>
            <Text style={{ color: '#38bdf8', fontSize: moderateScale(11), fontWeight: '800' }}>
              {Math.round(volumeLevel * 100)}%
            </Text>
          </Animated.View>
        )}

        {/* Adaptive Bitrate (ABR) Optimization Banner */}
        {abrNotice && (
          <Animated.View
            pointerEvents="none"
            style={{
              opacity: abrNoticeAnim,
              position: 'absolute',
              top: isPortrait ? scale(48) : scale(22),
              alignSelf: 'center',
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              paddingHorizontal: scale(14),
              paddingVertical: verticalScale(6),
              borderRadius: scale(20),
              borderWidth: 1,
              borderColor: 'rgba(56, 189, 248, 0.6)',
              flexDirection: 'row',
              alignItems: 'center',
              zIndex: 70,
              shadowColor: '#38bdf8',
              shadowOpacity: 0.4,
              shadowRadius: 8
            }}
          >
            <MaterialIcons name="auto-awesome" size={scale(14)} color="#38bdf8" style={{ marginRight: scale(6) }} />
            <Text style={{ color: '#ffffff', fontSize: moderateScale(11), fontWeight: '700' }}>
              {abrNotice}
            </Text>
          </Animated.View>
        )}

        {/* Full-Screen Swipe & Double-Tap Gesture Layer */}
        <View 
          style={[StyleSheet.absoluteFill, { zIndex: 30 }]} 
          {...panResponder.panHandlers} 
        />

        {/* Scraper link resolving loader overlay with Rotating Catchy Cinema Dialogues */}
        {isResolving && (
          <View 
            pointerEvents="auto"
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              backgroundColor: 'rgba(0,0,0,0.85)', 
              justifyContent: 'center', 
              alignItems: 'center', 
              zIndex: 70, 
              paddingHorizontal: scale(24) 
            }}
          >
            <ActivityIndicator size="large" color="#38bdf8" />
            <Text style={{ color: '#ffffff', fontSize: moderateScale(13), marginTop: verticalScale(14), fontWeight: '700', letterSpacing: 0.2, textAlign: 'center', lineHeight: moderateScale(20), maxWidth: scale(280) }}>
              {CATCHY_CINEMA_QUOTES[currentQuoteIndex]}
            </Text>
          </View>
        )}

        {/* PLAYBACK ERROR ADAPTIVE DIALOGUE OVERLAY */}
        {playbackError && !isResolving && hasStartedPlayback && (
          <Animated.View 
            style={{ 
              opacity: errorFadeAnim,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.92)',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 50,
              paddingHorizontal: scale(16),
              paddingVertical: verticalScale(8)
            }}
          >
            <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: isFullscreenMode ? scale(380) : scale(280) }}>
              {/* Pulsing Glowing Error Icon Animation */}
              <View style={{ alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: verticalScale(isPortrait ? 6 : 12) }}>
                <Animated.View 
                  style={{
                    transform: [{ scale: errorPulseAnim }],
                    opacity: errorRingOpacityAnim,
                    width: isPortrait ? scale(46) : scale(72),
                    height: isPortrait ? scale(46) : scale(72),
                    position: 'absolute',
                    borderRadius: scale(36),
                    backgroundColor: 'rgba(239, 68, 68, 0.25)',
                    borderWidth: 1,
                    borderColor: 'rgba(239, 68, 68, 0.4)'
                  }}
                />
                <View 
                  style={{
                    width: isPortrait ? scale(36) : scale(54),
                    height: isPortrait ? scale(36) : scale(54),
                    borderRadius: scale(27),
                    backgroundColor: 'rgba(69, 10, 10, 0.9)',
                    borderWidth: 1,
                    borderColor: 'rgba(239, 68, 68, 0.6)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="alert-circle-outline" size={isPortrait ? scale(20) : scale(28)} color="#f87171" />
                </View>
              </View>

              {/* Badge & Title */}
              <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', borderRadius: scale(12), paddingHorizontal: scale(8), paddingVertical: verticalScale(2), marginBottom: verticalScale(4) }}>
                <Text style={{ color: '#f87171', fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', fontSize: moderateScale(isPortrait ? 8.5 : 10) }}>
                  Stream Offline
                </Text>
              </View>

              <Text style={{ color: '#ffffff', fontWeight: '900', textAlign: 'center', fontSize: moderateScale(isPortrait ? 13 : 16), marginBottom: verticalScale(3) }} numberOfLines={1}>
                {playbackError.title || 'Playback Unavailable'}
              </Text>

              <Text 
                style={{ color: '#d4d4d8', textAlign: 'center', fontWeight: '500', fontSize: moderateScale(isPortrait ? 10.5 : 12), lineHeight: moderateScale(isPortrait ? 14 : 17), marginBottom: verticalScale(isPortrait ? 8 : 14), maxWidth: isPortrait ? scale(260) : scale(360) }} 
                numberOfLines={isPortrait ? 2 : 3}
              >
                {playbackError.message || 'The stream for this title could not be loaded or is currently offline.'}
              </Text>

              {/* Server Switcher Quick Actions */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(6), marginBottom: verticalScale(isPortrait ? 8 : 14) }}>
                {servers.map((s) => (
                  <TouchableOpacity
                    key={`err-server-${s.id}`}
                    onPress={() => {
                      setPlaybackError(null);
                      handleServerChange(s.id);
                    }}
                    activeOpacity={0.8}
                    style={{
                      borderRadius: scale(8),
                      borderWidth: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: scale(4),
                      paddingVertical: verticalScale(isPortrait ? 4 : 6),
                      paddingHorizontal: scale(isPortrait ? 8 : 12),
                      backgroundColor: activeServer === s.id ? 'rgba(56, 189, 248, 0.25)' : '#18181b',
                      borderColor: activeServer === s.id ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    <Ionicons 
                      name={activeServer === s.id ? "server" : "server-outline"} 
                      size={isPortrait ? scale(9) : scale(12)} 
                      color={activeServer === s.id ? "#38bdf8" : "#9ca3af"} 
                    />
                    <Text style={{ fontWeight: '700', fontSize: moderateScale(isPortrait ? 9.5 : 11), color: activeServer === s.id ? '#38bdf8' : '#a1a1aa' }}>
                      {s.short}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Action Buttons: Retry & Dismiss */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(8) }}>
                <TouchableOpacity
                  onPress={() => {
                    setPlaybackError(null);
                    playVideo(currentEpisode, activeServer);
                  }}
                  activeOpacity={0.8}
                  style={{
                    borderRadius: scale(20),
                    backgroundColor: '#0284c7',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: verticalScale(isPortrait ? 6 : 9),
                    paddingHorizontal: scale(isPortrait ? 14 : 20),
                    gap: scale(5)
                  }}
                >
                  <Ionicons name="reload" size={isPortrait ? scale(11) : scale(14)} color="#ffffff" />
                  <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: moderateScale(isPortrait ? 10.5 : 12) }}>
                    Retry Stream
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setPlaybackError(null)}
                  activeOpacity={0.8}
                  style={{
                    borderRadius: scale(20),
                    backgroundColor: '#27272a',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: verticalScale(isPortrait ? 6 : 9),
                    paddingHorizontal: scale(isPortrait ? 12 : 16)
                  }}
                >
                  <Text style={{ color: '#d4d4d8', fontWeight: '500', fontSize: moderateScale(isPortrait ? 10.5 : 12) }}>
                    Dismiss
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}

        {/* SCREEN LOCKED FLOATING UNLOCK BUTTON */}
        {isControlsLocked && controlsVisible && !playbackError && (
          <TouchableOpacity 
            onPress={toggleScreenLock}
            activeOpacity={0.8}
            style={{ position: 'absolute', left: scale(20), top: verticalScale(20), paddingVertical: verticalScale(8), paddingHorizontal: scale(14), borderRadius: scale(20), backgroundColor: 'rgba(0,0,0,0.85)', borderWidth: 1, borderColor: '#38bdf8', flexDirection: 'row', alignItems: 'center', gap: scale(6), zIndex: 50 }}
          >
            <Ionicons name="lock-closed" size={scale(16)} color="#38bdf8" />
            <Text style={{ color: '#38bdf8', fontSize: moderateScale(11), fontWeight: '700' }}>Screen Locked (Tap to Unlock)</Text>
          </TouchableOpacity>
        )}

        {/* CONTROLS OVERLAY (Media3 / ExoPlayer layout style with smooth fade animation) */}
        {!isResolving && !isControlsLocked && !playbackError && (
          <Animated.View 
            pointerEvents={controlsVisible ? 'box-none' : 'none'}
            style={[
              StyleSheet.absoluteFill,
              { 
                opacity: controlsOpacity,
                backgroundColor: 'rgba(0,0,0,0.45)',
                justifyContent: 'space-between',
                zIndex: 40
              },
              isFullscreenMode ? {
                paddingLeft: Math.max(insets.left, scale(20)),
                paddingRight: Math.max(insets.right, scale(20)),
                paddingTop: Math.max(insets.top, verticalScale(14)),
                paddingBottom: Math.max(insets.bottom, verticalScale(14)),
              } : {
                paddingHorizontal: scale(10),
                paddingVertical: verticalScale(8),
              }
            ]}
          >
            {/* Top Row: Back/Close & Title on left; Season, Episode, and Server Switcher on right */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: scale(8) }}>
                <TouchableOpacity 
                  onPress={isFullscreenMode ? toggleFullscreen : onBack}
                  style={{ 
                    width: topBtnSize, 
                    height: topBtnSize, 
                    borderRadius: topBtnSize / 2, 
                    backgroundColor: 'rgba(0,0,0,0.65)', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    borderWidth: 1, 
                    borderColor: 'rgba(255,255,255,0.15)',
                    marginRight: !isPortrait ? scale(10) : 0
                  }}
                >
                  <Ionicons name={isFullscreenMode ? "close" : "chevron-back"} size={topIconSize} color="#ffffff" />
                </TouchableOpacity>

                {isFullscreenMode && (
                  <View style={{ flex: 1, marginLeft: scale(6) }}>
                    <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: moderateScale(13) }} numberOfLines={1}>
                      {details.title || details.name || movie.title || movie.name}
                    </Text>
                    {isTVShow && currentEpisode && (
                      <Text style={{ color: '#a1a1aa', fontSize: moderateScale(11), fontWeight: '500' }} numberOfLines={1}>
                        {currentEpisode.title || `Season ${selectedSeason} • Episode ${currentEpisode.episodeNumber || 1}`}
                      </Text>
                    )}
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0, gap: scale(6) }}>
                {/* Season Selector Button (Only for TV Series with multiple seasons) */}
                {isTVShow && seasons && seasons.length > 1 && (
                  <TouchableOpacity 
                    onPress={() => activePlayerMenu === 'episodes' ? closePlayerMenu() : openPlayerMenu('episodes')}
                    activeOpacity={0.8}
                    style={{ 
                      paddingHorizontal: scale(8), 
                      height: topBtnSize,
                      borderRadius: topBtnSize / 2,
                      borderWidth: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: activePlayerMenu === 'episodes' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(0,0,0,0.65)',
                      borderColor: activePlayerMenu === 'episodes' ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <Ionicons name="layers-outline" size={topIconSize - 2} color={activePlayerMenu === 'episodes' ? '#38bdf8' : '#ffffff'} style={{ marginRight: scale(3) }} />
                    <Text style={{ fontSize: moderateScale(qualityBadgeTextSize), color: activePlayerMenu === 'episodes' ? '#38bdf8' : '#ffffff', fontWeight: '800' }}>
                      S{selectedSeason || 1}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Episodes Selector Button (Only for TV Series) */}
                {isTVShow && (
                  <TouchableOpacity 
                    onPress={() => activePlayerMenu === 'episodes' ? closePlayerMenu() : openPlayerMenu('episodes')}
                    activeOpacity={0.8}
                    style={{ 
                      paddingHorizontal: scale(8), 
                      height: topBtnSize,
                      borderRadius: topBtnSize / 2,
                      borderWidth: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: activePlayerMenu === 'episodes' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(0,0,0,0.65)',
                      borderColor: activePlayerMenu === 'episodes' ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <Ionicons name="albums-outline" size={topIconSize - 2} color={activePlayerMenu === 'episodes' ? '#38bdf8' : '#ffffff'} style={{ marginRight: scale(3) }} />
                    <Text style={{ fontSize: moderateScale(qualityBadgeTextSize), color: activePlayerMenu === 'episodes' ? '#38bdf8' : '#ffffff', fontWeight: '800' }}>
                      {currentEpisode ? `EP ${currentEpisode.episodeNumber || 1}` : 'Eps'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Server Switcher Button */}
                <TouchableOpacity 
                  onPress={() => activePlayerMenu === 'servers' ? closePlayerMenu() : openPlayerMenu('servers')}
                  activeOpacity={0.8}
                  style={{ 
                    paddingHorizontal: scale(8), 
                    height: topBtnSize,
                    borderRadius: topBtnSize / 2,
                    borderWidth: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: activePlayerMenu === 'servers' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(0,0,0,0.65)',
                    borderColor: activePlayerMenu === 'servers' ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <MaterialCommunityIcons name="server-network" size={topIconSize - 2} color={activePlayerMenu === 'servers' ? '#38bdf8' : '#ffffff'} style={{ marginRight: scale(3) }} />
                  <Text style={{ fontSize: moderateScale(qualityBadgeTextSize), color: activePlayerMenu === 'servers' ? '#38bdf8' : '#ffffff', fontWeight: '800' }}>
                    Server {activeServer}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Center Controls: Rewind 10, Big Play/Pause, Forward 10 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(isPortrait ? 28 : 44) }}>
              {/* Skip Backward 10s */}
              {hasStartedPlayback ? (
                <TouchableOpacity 
                  onPress={skipBackward}
                  activeOpacity={0.75}
                  style={{ 
                    width: centerSkipBtnSize, 
                    height: centerSkipBtnSize,
                    borderRadius: centerSkipBtnSize / 2,
                    backgroundColor: 'rgba(0,0,0,0.65)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.2)',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <MaterialIcons name="replay-10" size={centerSkipIconSize} color="#ffffff" />
                </TouchableOpacity>
              ) : (
                <View style={{ width: centerSkipBtnSize, height: centerSkipBtnSize }} />
              )}

              {/* Center Play/Pause Button */}
              <TouchableOpacity 
                onPress={handlePlayerPlayPause}
                activeOpacity={0.85}
                style={{ 
                  width: centerPlayBtnSize, 
                  height: centerPlayBtnSize,
                  borderRadius: centerPlayBtnSize / 2,
                  backgroundColor: '#ffffff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.5)',
                  shadowColor: '#ffffff',
                  shadowOpacity: 0.35,
                  shadowRadius: 10
                }}
              >
                <Ionicons 
                  name={hasStartedPlayback && isPlaying ? "pause" : "play"} 
                  size={centerPlayIconSize} 
                  color="#000000" 
                  style={(!hasStartedPlayback || !isPlaying) ? { marginLeft: scale(3) } : null}
                />
              </TouchableOpacity>

              {/* Skip Forward 10s */}
              {hasStartedPlayback ? (
                <TouchableOpacity 
                  onPress={skipForward}
                  activeOpacity={0.75}
                  style={{ 
                    width: centerSkipBtnSize, 
                    height: centerSkipBtnSize,
                    borderRadius: centerSkipBtnSize / 2,
                    backgroundColor: 'rgba(0,0,0,0.65)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.2)',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <MaterialIcons name="forward-10" size={centerSkipIconSize} color="#ffffff" />
                </TouchableOpacity>
              ) : (
                <View style={{ width: centerSkipBtnSize, height: centerSkipBtnSize }} />
              )}
            </View>

            {/* Bottom Scrubber Progress Bar, Timestamps & Centered Player Features Bar */}
            {hasStartedPlayback ? (
              <View style={{ width: '100%' }}>
                <View 
                  ref={scrubberRef}
                  onLayout={(e) => {
                    const layoutW = e.nativeEvent.layout.width;
                    setScrubberWidth(layoutW);
                    if (scrubberRef.current && typeof scrubberRef.current.measureInWindow === 'function') {
                      scrubberRef.current.measureInWindow((x) => {
                        if (typeof x === 'number' && !isNaN(x) && x >= 0) {
                          scrubberPageXRef.current = x;
                        }
                      });
                    }
                  }}
                  {...scrubberPanResponder.panHandlers}
                  style={{ height: verticalScale(28), width: '100%', justifyContent: 'center', overflow: 'visible' }}
                >
                  {/* Timeline Track */}
                  <View pointerEvents="none" style={{ height: verticalScale(3.5), backgroundColor: 'rgba(82, 82, 91, 0.85)', width: '100%', overflow: 'visible', position: 'relative', borderRadius: scale(2) }}>
                    {/* Active Highlight Track */}
                    <View 
                      pointerEvents="none"
                      style={{ 
                        width: `${Math.min(100, Math.max(0, (currentTime / (duration || 1)) * 100))}%`,
                        height: '100%',
                        backgroundColor: '#38bdf8',
                        borderRadius: scale(2)
                      }}
                    />
                    {/* Scrubber thumb circle */}
                    <View 
                      pointerEvents="none"
                      style={{ 
                        position: 'absolute',
                        left: `${Math.min(100, Math.max(0, (currentTime / (duration || 1)) * 100))}%`, 
                        transform: [{ translateX: scale(-6) }],
                        top: verticalScale(-4.5),
                        width: scale(12),
                        height: scale(12),
                        borderRadius: scale(6),
                        backgroundColor: '#ffffff',
                        borderWidth: 1.5,
                        borderColor: '#38bdf8'
                      }}
                    />
                  </View>
                </View>

                {/* Dynamic Timestamps */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: verticalScale(1), paddingHorizontal: scale(2) }}>
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: moderateScale(10.5), fontWeight: '700' }}>
                    {formatTime(currentTime)}
                  </Text>
                  <Text style={{ color: '#a1a1aa', fontSize: moderateScale(10.5), fontWeight: '700' }}>
                    {duration > 0 ? formatTime(duration) : '--:--'}
                  </Text>
                </View>

                {/* ALL VIDEO PLAYER FEATURES ROW (Centered below the bottom progress bar) */}
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginTop: verticalScale(isPortrait ? 5 : 8),
                  gap: scale(isPortrait ? 8 : 14)
                }}>
                  {/* 1. Settings / Quality Gear Icon Button */}
                  <TouchableOpacity 
                    onPress={() => activePlayerMenu === 'quality' ? closePlayerMenu() : openPlayerMenu('quality')}
                    activeOpacity={0.8}
                    style={{ 
                      width: bottomBtnSize, 
                      height: bottomBtnSize,
                      borderRadius: bottomBtnSize / 2,
                      borderWidth: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: activePlayerMenu === 'quality' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(0,0,0,0.65)',
                      borderColor: activePlayerMenu === 'quality' ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    <Ionicons 
                      name="settings-outline" 
                      size={bottomIconSize} 
                      color={activePlayerMenu === 'quality' ? "#38bdf8" : "#ffffff"} 
                    />
                  </TouchableOpacity>

                  {/* 2. Audio Track Selector Button */}
                  <TouchableOpacity 
                    onPress={() => activePlayerMenu === 'audio' ? closePlayerMenu() : openPlayerMenu('audio')}
                    activeOpacity={0.8}
                    style={{ 
                      width: bottomBtnSize, 
                      height: bottomBtnSize,
                      borderRadius: bottomBtnSize / 2,
                      borderWidth: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: activePlayerMenu === 'audio' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(0,0,0,0.65)',
                      borderColor: activePlayerMenu === 'audio' ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    <MaterialIcons name="audiotrack" size={bottomIconSize} color={activePlayerMenu === 'audio' ? '#38bdf8' : '#ffffff'} />
                  </TouchableOpacity>

                  {/* 3. Subtitles (CC) Selector Button */}
                  <TouchableOpacity 
                    onPress={() => activePlayerMenu === 'subtitles' ? closePlayerMenu() : openPlayerMenu('subtitles')}
                    activeOpacity={0.8}
                    style={{ 
                      width: bottomBtnSize, 
                      height: bottomBtnSize,
                      borderRadius: bottomBtnSize / 2,
                      borderWidth: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: activePlayerMenu === 'subtitles' || selectedSubtitleTrack ? 'rgba(56, 189, 248, 0.3)' : 'rgba(0,0,0,0.65)',
                      borderColor: activePlayerMenu === 'subtitles' || selectedSubtitleTrack ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    <MaterialCommunityIcons 
                      name={selectedSubtitleTrack ? "subtitles" : "subtitles-outline"} 
                      size={bottomIconSize} 
                      color={selectedSubtitleTrack || activePlayerMenu === 'subtitles' ? "#38bdf8" : "#ffffff"} 
                    />
                  </TouchableOpacity>

                  {/* 4. Playback Speed Button */}
                  <TouchableOpacity 
                    onPress={() => activePlayerMenu === 'speed' ? closePlayerMenu() : openPlayerMenu('speed')}
                    activeOpacity={0.8}
                    style={{ 
                      height: bottomBtnSize, 
                      paddingHorizontal: scale(isPortrait ? 8 : 10),
                      borderRadius: bottomBtnSize / 2,
                      borderWidth: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: activePlayerMenu === 'speed' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(0,0,0,0.65)',
                      borderColor: activePlayerMenu === 'speed' ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    <Text style={{ color: activePlayerMenu === 'speed' ? '#38bdf8' : '#ffffff', fontSize: moderateScale(isPortrait ? 10 : 11.5), fontWeight: '700' }}>
                      {playbackSpeed}x
                    </Text>
                  </TouchableOpacity>

                  {/* 5. Aspect Ratio Mode Button */}
                  <TouchableOpacity 
                    onPress={toggleContentFitMode}
                    activeOpacity={0.8}
                    style={{ 
                      width: bottomBtnSize, 
                      height: bottomBtnSize,
                      borderRadius: bottomBtnSize / 2,
                      borderWidth: 1,
                      borderColor: contentFitMode === 'cover' ? '#38bdf8' : 'rgba(255,255,255,0.15)',
                      backgroundColor: contentFitMode === 'cover' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(0,0,0,0.65)',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <MaterialCommunityIcons 
                      name={contentFitMode === 'cover' ? "aspect-ratio" : "fit-to-screen"} 
                      size={bottomIconSize} 
                      color={contentFitMode === 'cover' ? "#38bdf8" : "#ffffff"} 
                    />
                  </TouchableOpacity>

                  {/* 6. Screen Lock Toggle */}
                  <TouchableOpacity 
                    onPress={toggleScreenLock}
                    activeOpacity={0.8}
                    style={{ 
                      width: bottomBtnSize, 
                      height: bottomBtnSize,
                      borderRadius: bottomBtnSize / 2,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.15)',
                      backgroundColor: 'rgba(0,0,0,0.65)',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Ionicons name="lock-open-outline" size={bottomIconSize} color="#ffffff" />
                  </TouchableOpacity>

                  {/* 7. Fullscreen Toggle Button */}
                  <Animated.View style={{ transform: [{ scale: fullscreenScaleAnim }] }}>
                    <TouchableOpacity 
                      onPress={toggleFullscreen}
                      activeOpacity={0.8}
                      style={{ 
                        width: bottomBtnSize, 
                        height: bottomBtnSize,
                        borderRadius: bottomBtnSize / 2,
                        borderWidth: 1,
                        borderColor: isFullscreenMode ? '#38bdf8' : 'rgba(255,255,255,0.15)',
                        backgroundColor: isFullscreenMode ? 'rgba(56, 189, 248, 0.25)' : 'rgba(0,0,0,0.65)',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <MaterialCommunityIcons 
                        name={isFullscreenMode ? "fullscreen-exit" : "fullscreen"} 
                        size={bottomIconSize} 
                        color={isFullscreenMode ? "#38bdf8" : "#ffffff"} 
                      />
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </View>
            ) : (
              <View style={{ height: verticalScale(6) }} />
            )}
          </Animated.View>
        )}

        {/* FLOATING TIDB SKIP BUTTONS (Skip Intro, Skip Recap, Skip Credits, Next Episode) */}
        {hasStartedPlayback && !isResolving && (() => {
          const curMs = ((currentTimeRef.current > 0 ? currentTimeRef.current : currentTime) || 0) * 1000;
          const activeIntro = tidbSegments?.intro?.find(seg => curMs >= seg.start_ms && curMs <= seg.end_ms);
          const activeRecap = tidbSegments?.recap?.find(seg => curMs >= seg.start_ms && curMs <= seg.end_ms);
          const activeCredits = tidbSegments?.credits?.find(seg => curMs >= seg.start_ms && (seg.end_ms ? curMs <= seg.end_ms : true));
          const isNearEnd = isTVShow && duration > 0 && currentTime >= Math.max(0, duration - 75);

          const currentEpIndex = isTVShow ? episodesList.findIndex(e => e.episodeNumber === (currentEpisode?.episodeNumber || 1)) : -1;
          const nextEpisode = (currentEpIndex >= 0 && currentEpIndex < episodesList.length - 1) ? episodesList[currentEpIndex + 1] : null;

          const showIntro = !!activeIntro;
          const showRecap = !!activeRecap && !showIntro;
          const showCredits = !!activeCredits;
          const showNextEp = isTVShow && !!nextEpisode && (showCredits || isNearEnd);

          if (!showIntro && !showRecap && !showCredits && !showNextEp) {
            return null;
          }

          return (
            <View
              pointerEvents="box-none"
              style={{
                position: 'absolute',
                right: isFullscreenMode ? scale(24) : scale(14),
                bottom: controlsVisible ? (isFullscreenMode ? verticalScale(84) : verticalScale(68)) : (isFullscreenMode ? verticalScale(22) : verticalScale(14)),
                flexDirection: 'row',
                alignItems: 'center',
                gap: scale(8),
                zIndex: 45
              }}
            >
              {showRecap && (
                <TouchableOpacity
                  onPress={() => {
                    if (player && activeRecap) {
                      const targetSec = (activeRecap.end_ms / 1000) + 0.5;
                      currentTimeRef.current = targetSec;
                      setCurrentTime(targetSec);
                      player.currentTime = targetSec;
                    }
                  }}
                  activeOpacity={0.85}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(15, 23, 42, 0.92)',
                    paddingHorizontal: scale(12),
                    paddingVertical: verticalScale(7),
                    borderRadius: scale(18),
                    borderWidth: 1.2,
                    borderColor: '#38bdf8',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 6,
                    elevation: 8
                  }}
                >
                  <MaterialIcons name="fast-forward" size={scale(15)} color="#38bdf8" style={{ marginRight: scale(4) }} />
                  <Text style={{ color: '#ffffff', fontSize: moderateScale(11.5), fontWeight: '800' }}>
                    Skip Recap
                  </Text>
                </TouchableOpacity>
              )}

              {showIntro && (
                <TouchableOpacity
                  onPress={() => {
                    if (player && activeIntro) {
                      const targetSec = (activeIntro.end_ms / 1000) + 0.5;
                      currentTimeRef.current = targetSec;
                      setCurrentTime(targetSec);
                      player.currentTime = targetSec;
                    }
                  }}
                  activeOpacity={0.85}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(15, 23, 42, 0.92)',
                    paddingHorizontal: scale(12),
                    paddingVertical: verticalScale(7),
                    borderRadius: scale(18),
                    borderWidth: 1.2,
                    borderColor: '#38bdf8',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 6,
                    elevation: 8
                  }}
                >
                  <MaterialIcons name="fast-forward" size={scale(15)} color="#38bdf8" style={{ marginRight: scale(4) }} />
                  <Text style={{ color: '#ffffff', fontSize: moderateScale(11.5), fontWeight: '800' }}>
                    Skip Intro
                  </Text>
                </TouchableOpacity>
              )}

              {showCredits && !showNextEp && (
                <TouchableOpacity
                  onPress={() => {
                    if (player && activeCredits) {
                      const targetSec = activeCredits.end_ms ? (activeCredits.end_ms / 1000) : (duration || (curMs / 1000) + 30);
                      currentTimeRef.current = targetSec;
                      setCurrentTime(targetSec);
                      player.currentTime = targetSec;
                    }
                  }}
                  activeOpacity={0.85}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(15, 23, 42, 0.92)',
                    paddingHorizontal: scale(12),
                    paddingVertical: verticalScale(7),
                    borderRadius: scale(18),
                    borderWidth: 1.2,
                    borderColor: 'rgba(255, 255, 255, 0.35)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 6,
                    elevation: 8
                  }}
                >
                  <MaterialIcons name="fast-forward" size={scale(15)} color="#ffffff" style={{ marginRight: scale(4) }} />
                  <Text style={{ color: '#ffffff', fontSize: moderateScale(11.5), fontWeight: '800' }}>
                    Skip Credits
                  </Text>
                </TouchableOpacity>
              )}

              {showNextEp && (
                <TouchableOpacity
                  onPress={() => {
                    selectEpisode(nextEpisode);
                  }}
                  activeOpacity={0.85}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#38bdf8',
                    paddingHorizontal: scale(13),
                    paddingVertical: verticalScale(7),
                    borderRadius: scale(18),
                    borderWidth: 1.2,
                    borderColor: '#7dd3fc',
                    shadowColor: '#38bdf8',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.45,
                    shadowRadius: 8,
                    elevation: 8
                  }}
                >
                  <Ionicons name="play-skip-forward" size={scale(14)} color="#000000" style={{ marginRight: scale(5) }} />
                  <Text style={{ color: '#000000', fontSize: moderateScale(11.5), fontWeight: '900' }}>
                    Next Episode
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })()}

          {/* IN-PLAYER FEATURE SELECTION MENU (Rendered inside player container over video) */}
          {activePlayerMenu !== 'none' && (
            <Animated.View
              style={{
                opacity: menuAnim,
                transform: [{
                  scale: menuAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.94, 1],
                  })
                }],
                position: 'absolute',
                right: isFullscreenMode ? scale(24) : scale(8),
                top: isFullscreenMode ? verticalScale(32) : verticalScale(24),
                bottom: isFullscreenMode ? verticalScale(24) : verticalScale(8),
                width: activePlayerMenu === 'episodes' 
                  ? (isFullscreenMode ? scale(330) : scale(250)) 
                  : (isFullscreenMode ? scale(270) : scale(220)),
                backgroundColor: 'rgba(10, 10, 12, 0.96)',
                borderRadius: scale(14),
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.18)',
                padding: scale(10),
                zIndex: 50,
                elevation: 10,
                justifyContent: 'space-between'
              }}
            >
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: verticalScale(6), borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)', marginBottom: verticalScale(4) }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(6) }}>
                  {activePlayerMenu === 'quality' && <MaterialIcons name="hd" size={scale(16)} color="#38bdf8" />}
                  {activePlayerMenu === 'audio' && <MaterialIcons name="audiotrack" size={scale(16)} color="#38bdf8" />}
                  {activePlayerMenu === 'subtitles' && <MaterialCommunityIcons name="subtitles" size={scale(16)} color="#38bdf8" />}
                  {activePlayerMenu === 'speed' && <MaterialIcons name="speed" size={scale(16)} color="#38bdf8" />}
                  {activePlayerMenu === 'servers' && <MaterialCommunityIcons name="server-network" size={scale(16)} color="#38bdf8" />}
                  {activePlayerMenu === 'episodes' && <Ionicons name="albums-outline" size={scale(16)} color="#38bdf8" />}
                  <Text style={{ color: '#ffffff', fontSize: moderateScale(12), fontWeight: '800' }}>
                    {activePlayerMenu === 'quality' && 'Video Quality'}
                    {activePlayerMenu === 'audio' && 'Audio Languages'}
                    {activePlayerMenu === 'subtitles' && 'Subtitles'}
                    {activePlayerMenu === 'speed' && 'Playback Speed'}
                    {activePlayerMenu === 'servers' && 'Server Sources'}
                    {activePlayerMenu === 'episodes' && `Episodes (S${selectedSeason || 1})`}
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => closePlayerMenu()} 
                  style={{ padding: scale(4), borderRadius: scale(12), backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <Ionicons name="close" size={scale(13)} color="#a1a1aa" />
                </TouchableOpacity>
              </View>

              {/* Scrollable Options List */}
              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginVertical: verticalScale(4) }}>
                {activePlayerMenu === 'servers' && (
                  servers.map((s) => {
                    const isSelected = activeServer === s.id;
                    return (
                      <TouchableOpacity
                        key={`in-player-srv-${s.id}`}
                        onPress={() => {
                          handleServerChange(s.id);
                          closePlayerMenu();
                        }}
                        activeOpacity={0.8}
                        style={{
                          paddingVertical: verticalScale(8),
                          paddingHorizontal: scale(10),
                          borderRadius: scale(8),
                          marginBottom: verticalScale(6),
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.22)' : 'rgba(24, 24, 27, 0.85)',
                          borderWidth: 1,
                          borderColor: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'
                        }}
                      >
                        <View style={{ flex: 1, marginRight: scale(8) }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(6) }}>
                            <MaterialCommunityIcons 
                              name={s.id === 1 ? 'lightning-bolt' : (s.id === 2 ? 'video-4k-box' : 'play-circle')} 
                              size={scale(14)} 
                              color={isSelected ? '#38bdf8' : '#a1a1aa'} 
                            />
                            <Text style={{ fontSize: moderateScale(11.5), color: isSelected ? '#38bdf8' : '#ffffff', fontWeight: isSelected ? '800' : '600' }}>
                              {s.label}
                            </Text>
                          </View>
                          <Text style={{ fontSize: moderateScale(9), color: isSelected ? '#7dd3fc' : '#a1a1aa', marginTop: verticalScale(1) }}>
                            {s.desc}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={scale(14)} color="#38bdf8" />
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}

                {activePlayerMenu === 'episodes' && (
                  <View style={{ flex: 1 }}>
                    {/* Seasons horizontal bar */}
                    {seasons && seasons.length > 1 && (
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        style={{ maxHeight: verticalScale(32), marginBottom: verticalScale(8) }}
                        contentContainerStyle={{ gap: scale(6), paddingHorizontal: scale(2) }}
                      >
                        {seasons.map((sn) => {
                          const sNum = sn.season_number;
                          const isSnSelected = selectedSeason === sNum;
                          return (
                            <TouchableOpacity
                              key={`player-season-${sNum}`}
                              onPress={() => {
                                setSelectedSeason(sNum);
                                loadSeasonEpisodes(movie.id, sNum);
                              }}
                              style={{
                                paddingHorizontal: scale(10),
                                paddingVertical: verticalScale(4),
                                borderRadius: scale(14),
                                backgroundColor: isSnSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)',
                                borderWidth: 1,
                                borderColor: isSnSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)'
                              }}
                            >
                              <Text style={{ fontSize: moderateScale(10.5), fontWeight: '700', color: isSnSelected ? '#000000' : '#ffffff' }}>
                                Season {sNum}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    )}

                    {/* Episodes List */}
                    {loadingEpisodes ? (
                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: verticalScale(20) }}>
                        <ActivityIndicator size="small" color="#38bdf8" />
                        <Text style={{ color: '#a1a1aa', fontSize: moderateScale(10), marginTop: verticalScale(6) }}>Loading episodes...</Text>
                      </View>
                    ) : episodesList && episodesList.length > 0 ? (
                      <View style={{ flex: 1 }}>
                        {episodesList.map((ep) => {
                          const isEpActive = currentEpisode?.episodeNumber === ep.episodeNumber && (currentEpisode?.seasonNumber || selectedSeason) === (ep.seasonNumber || selectedSeason);
                          return (
                            <TouchableOpacity
                              key={`player-ep-${ep.id || ep.episodeNumber}`}
                              onPress={() => {
                                selectEpisode(ep);
                                closePlayerMenu();
                              }}
                              activeOpacity={0.8}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: scale(6),
                                borderRadius: scale(8),
                                marginBottom: verticalScale(6),
                                backgroundColor: isEpActive ? 'rgba(56, 189, 248, 0.22)' : 'rgba(24, 24, 27, 0.85)',
                                borderWidth: 1,
                                borderColor: isEpActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'
                              }}
                            >
                              {ep.image ? (
                                <Image
                                  source={{ uri: ep.image }}
                                  style={{ width: scale(46), height: verticalScale(28), borderRadius: scale(4), marginRight: scale(8), backgroundColor: '#1c1c22' }}
                                  resizeMode="cover"
                                />
                              ) : (
                                <View style={{ width: scale(46), height: verticalScale(28), borderRadius: scale(4), marginRight: scale(8), backgroundColor: '#1c1c22', alignItems: 'center', justifyContent: 'center' }}>
                                  <Ionicons name="play" size={scale(12)} color="#71717a" />
                                </View>
                              )}
                              <View style={{ flex: 1, marginRight: scale(6) }}>
                                <Text numberOfLines={1} style={{ fontSize: moderateScale(11), color: isEpActive ? '#38bdf8' : '#ffffff', fontWeight: isEpActive ? '800' : '600' }}>
                                  {ep.title || `Episode ${ep.episodeNumber}`}
                                </Text>
                                {ep.duration ? (
                                  <Text style={{ fontSize: moderateScale(9), color: isEpActive ? '#7dd3fc' : '#a1a1aa' }}>
                                    {ep.duration}
                                  </Text>
                                ) : null}
                              </View>
                              {isEpActive && (
                                <Ionicons name="play-circle" size={scale(16)} color="#38bdf8" />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : (
                      <View style={{ paddingVertical: verticalScale(16), alignItems: 'center' }}>
                        <Text style={{ color: '#a1a1aa', fontSize: moderateScale(11) }}>No episodes available</Text>
                      </View>
                    )}
                  </View>
                )}

                {activePlayerMenu === 'quality' && (
                  (() => {
                    const options = [];
                    // Always include Auto (ABR) Adaptive Bitrate option at top
                    options.push({
                      id: 'auto',
                      label: 'Auto (Adaptive Bitrate)',
                      desc: qualityMode === 'auto'
                        ? `Active • Dynamically adapts to bandwidth (${currentQuality.toUpperCase()})`
                        : 'Automatically optimizes bitrate & resolution to prevent buffering'
                    });

                    if (resolvedQualities && typeof resolvedQualities === 'object') {
                      if (resolvedQualities['1080p']) {
                        const isNowPlaying = currentQuality.toLowerCase() === '1080p' && qualityMode !== 'auto';
                        options.push({ 
                          id: '1080p', 
                          label: 'Full HD (1080p)', 
                          desc: isNowPlaying ? 'Currently Playing (Locked)' : 'Lock 1080p Quality' 
                        });
                      }
                      if (resolvedQualities['4k']) {
                        const isNowPlaying = currentQuality.toLowerCase() === '4k' && qualityMode !== 'auto';
                        options.push({ 
                          id: '4k', 
                          label: '4K Ultra HD (2160p)', 
                          desc: isNowPlaying ? 'Currently Playing (Locked)' : 'Lock 4K UHD Quality' 
                        });
                      }
                      if (resolvedQualities['720p']) {
                        const isNowPlaying = currentQuality.toLowerCase() === '720p' && qualityMode !== 'auto';
                        options.push({ 
                          id: '720p', 
                          label: 'HD (720p)', 
                          desc: isNowPlaying ? 'Currently Playing (Locked)' : 'Lock 720p Data Saver' 
                        });
                      }
                    }
                    if (options.length === 1) {
                      options.push(
                        { id: '1080p', label: 'Full HD (1080p)', desc: 'Direct 1080p Stream' },
                        { id: '4k', label: '4K Ultra HD (2160p)', desc: 'Direct 4K Stream' }
                      );
                    }
                    return options;
                  })().map((q) => {
                    const isSelected = qualityMode === 'auto' 
                      ? q.id === 'auto' 
                      : (q.id !== 'auto' && currentQuality.toLowerCase() === q.id.toLowerCase());
                    return (
                      <TouchableOpacity
                        key={`in-player-q-${q.id}`}
                        onPress={() => {
                          toggleQuality(q.id);
                          closePlayerMenu();
                        }}
                        activeOpacity={0.8}
                        style={{
                          paddingVertical: verticalScale(8),
                          paddingHorizontal: scale(10),
                          borderRadius: scale(8),
                          marginBottom: verticalScale(6),
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.22)' : 'rgba(24, 24, 27, 0.85)',
                          borderWidth: 1,
                          borderColor: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'
                        }}
                      >
                        <View style={{ flex: 1, marginRight: scale(8) }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(4) }}>
                            {q.id === 'auto' && (
                              <MaterialIcons name="auto-awesome" size={scale(13)} color={isSelected ? '#38bdf8' : '#a1a1aa'} />
                            )}
                            <Text style={{ fontSize: moderateScale(11.5), color: isSelected ? '#38bdf8' : '#ffffff', fontWeight: isSelected ? '800' : '600' }}>
                              {q.label}
                            </Text>
                          </View>
                          <Text style={{ fontSize: moderateScale(9), color: isSelected ? '#7dd3fc' : '#a1a1aa', marginTop: verticalScale(1) }}>
                            {q.desc}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={scale(14)} color="#38bdf8" />
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}

                {activePlayerMenu === 'speed' && (
                  [0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => {
                    const isSelected = playbackSpeed === rate;
                    return (
                      <TouchableOpacity
                        key={`in-player-speed-${rate}`}
                        onPress={() => changePlaybackSpeed(rate)}
                        activeOpacity={0.8}
                        style={{
                          paddingVertical: verticalScale(8),
                          paddingHorizontal: scale(10),
                          borderRadius: scale(8),
                          marginBottom: verticalScale(6),
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.22)' : 'rgba(24, 24, 27, 0.85)',
                          borderWidth: 1,
                          borderColor: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'
                        }}
                      >
                        <Text style={{ fontSize: moderateScale(11.5), color: isSelected ? '#38bdf8' : '#ffffff', fontWeight: isSelected ? '800' : '600' }}>
                          {rate === 1.0 ? '1.0x (Normal)' : `${rate}x`}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={scale(14)} color="#38bdf8" />
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}

                {activePlayerMenu === 'audio' && (
                  getDeduplicatedAudioTracks(availableAudioTracks).map((track, idx) => {
                    const isSelected = selectedAudioTrack ? (
                      (typeof selectedAudioTrack.originalIndex === 'number' && typeof track.originalIndex === 'number' && selectedAudioTrack.originalIndex === track.originalIndex) ||
                      (selectedAudioTrack.id && track.id && selectedAudioTrack.id === track.id)
                    ) : (idx === 0);
                    return (
                      <TouchableOpacity
                        key={`in-player-audio-${track.id || track.originalIndex || idx}`}
                        onPress={() => switchAudioTrack(track)}
                        activeOpacity={0.8}
                        style={{
                          paddingVertical: verticalScale(8),
                          paddingHorizontal: scale(10),
                          borderRadius: scale(8),
                          marginBottom: verticalScale(6),
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.22)' : 'rgba(24, 24, 27, 0.85)',
                          borderWidth: 1,
                          borderColor: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'
                        }}
                      >
                        <Text style={{ fontSize: moderateScale(11.5), color: isSelected ? '#38bdf8' : '#ffffff', fontWeight: isSelected ? '800' : '600' }}>
                          {track.displayLabel || track.label || track.name || `Audio Track ${idx + 1}`}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={scale(14)} color="#38bdf8" />
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}

                {activePlayerMenu === 'subtitles' && (
                  <>
                    <TouchableOpacity
                      onPress={() => switchSubtitleTrack(null)}
                      activeOpacity={0.8}
                      style={{
                        paddingVertical: verticalScale(8),
                        paddingHorizontal: scale(10),
                        borderRadius: scale(8),
                        marginBottom: verticalScale(6),
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: !selectedSubtitleTrack ? 'rgba(56, 189, 248, 0.22)' : 'rgba(24, 24, 27, 0.85)',
                        borderWidth: 1,
                        borderColor: !selectedSubtitleTrack ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      <Text style={{ fontSize: moderateScale(11.5), color: !selectedSubtitleTrack ? '#38bdf8' : '#ffffff', fontWeight: !selectedSubtitleTrack ? '800' : '600' }}>
                        Off
                      </Text>
                      {!selectedSubtitleTrack && (
                        <Ionicons name="checkmark-circle" size={scale(14)} color="#38bdf8" />
                      )}
                    </TouchableOpacity>

                    {getDeduplicatedSubtitleTracks(availableSubtitleTracks).map((track, idx) => {
                      const isSelected = selectedSubtitleTrack && (
                        (typeof selectedSubtitleTrack.originalIndex === 'number' && typeof track.originalIndex === 'number' && selectedSubtitleTrack.originalIndex === track.originalIndex) ||
                        (selectedSubtitleTrack.id && track.id && selectedSubtitleTrack.id === track.id)
                      );
                      return (
                        <TouchableOpacity
                          key={`in-player-sub-${track.id || track.originalIndex || idx}`}
                          onPress={() => switchSubtitleTrack(track)}
                          activeOpacity={0.8}
                          style={{
                            paddingVertical: verticalScale(8),
                            paddingHorizontal: scale(10),
                            borderRadius: scale(8),
                            marginBottom: verticalScale(6),
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.22)' : 'rgba(24, 24, 27, 0.85)',
                            borderWidth: 1,
                            borderColor: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'
                          }}
                        >
                          <Text style={{ fontSize: moderateScale(11.5), color: isSelected ? '#38bdf8' : '#ffffff', fontWeight: isSelected ? '800' : '600' }}>
                            {track.displayLabel || track.label || track.name || `Subtitle ${idx + 1}`}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={scale(14)} color="#38bdf8" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </>
                )}
              </ScrollView>
            </Animated.View>
          )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000000', paddingTop: insets.top }}>
      <StatusBar hidden={false} barStyle="light-content" translucent />

      {/* TOP VIDEO PLAYER CONTAINER (Media3 ExoPlayer - Seamless Portrait & Fullscreen without unmounting surface) */}
      <View 
        style={isFullscreen ? {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          zIndex: 99999,
          backgroundColor: '#000000'
        } : {
          width: '100%',
          aspectRatio: 16 / 9,
          backgroundColor: '#000000',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {renderVideoPlayerContent(isFullscreen)}
      </View>

      {/* LOWER UI SCROLLABLE MOVIE DETAILS */}
      <ScrollView 
        bounce={true}
        showsVerticalScrollIndicator={false}
        style={detailStyles.scrollContainer}
        contentContainerStyle={detailStyles.scrollContent}
        nestedScrollEnabled={true}
      >
        {/* ========================================================================= */}
        {/* 1. PRIMARY ACTION BUTTONS: PLAY & DOWNLOAD */}
        {/* ========================================================================= */}
        <View style={detailStyles.actionButtonsRow}>
          {/* Main White Play Button */}
          <TouchableOpacity 
            onPress={() => playVideo(currentEpisode, activeServer)}
            activeOpacity={0.85}
            style={detailStyles.playButton}
          >
            <Ionicons name="play" size={scale(18)} color="#09090b" style={{ marginRight: scale(6) }} />
            <Text style={detailStyles.playButtonText}>
              Play
            </Text>
          </TouchableOpacity>

          {/* Dark Charcoal Download Button */}
          <TouchableOpacity 
            onPress={() => playVideo(currentEpisode, activeServer)}
            activeOpacity={0.85}
            style={detailStyles.downloadButton}
          >
            <Ionicons name="download-outline" size={scale(18)} color="#ffffff" style={{ marginRight: scale(6) }} />
            <Text style={detailStyles.downloadButtonText}>
              Download
            </Text>
          </TouchableOpacity>
        </View>

        {/* ========================================================================= */}
        {/* 2. SERVER SELECTOR PILLS (SERVER 1, SERVER 2, SERVER 3) */}
        {/* ========================================================================= */}
        <View style={detailStyles.serverSelectorRow}>
          {servers.map((server) => {
            const isActive = activeServer === server.id;
            return (
              <TouchableOpacity
                key={server.id}
                onPress={() => handleServerChange(server.id)}
                activeOpacity={0.8}
                style={[
                  detailStyles.serverPill,
                  isActive && detailStyles.serverPillActive
                ]}
              >
                <Text style={[
                  detailStyles.serverPillText,
                  isActive && detailStyles.serverPillTextActive
                ]}>
                  {server.short}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ========================================================================= */}
        {/* 3. MOVIE & TV SERIES TITLE & METADATA ROW */}
        {/* ========================================================================= */}
        <View style={detailStyles.titleSection}>
          <Text style={detailStyles.displayTitle}>
            {displayTitle}
          </Text>

          {tagline ? (
            <Text style={detailStyles.tagline}>
              "{tagline}"
            </Text>
          ) : null}

          {/* Metadata Badges line: Type • Year • Rating • Cert • Runtime • 4K */}
          <View style={detailStyles.metadataRow}>
            {/* Type badge */}
            <View style={[
              detailStyles.typeBadge,
              isTVShow ? detailStyles.tvBadge : detailStyles.movieBadge
            ]}>
              <Text style={[
                detailStyles.typeBadgeText,
                { color: isTVShow ? '#c084fc' : '#38bdf8' }
              ]}>
                {isTVShow ? 'TV Series' : 'Movie'}
              </Text>
            </View>

            {releaseYear ? (
              <Text style={detailStyles.metaText}>
                {releaseYear}
              </Text>
            ) : null}

            {voteRating ? (
              <View style={detailStyles.ratingBox}>
                <Ionicons name="star" size={scale(11)} color="#f59e0b" style={{ marginRight: scale(3) }} />
                <Text style={detailStyles.ratingText}>
                  {voteRating}
                </Text>
              </View>
            ) : null}

            {certification ? (
              <View style={detailStyles.certBox}>
                <Text style={detailStyles.certText}>
                  {certification}
                </Text>
              </View>
            ) : null}

            {runtimeDisplay ? (
              <Text style={detailStyles.metaText}>
                {runtimeDisplay}
              </Text>
            ) : null}

            <View style={detailStyles.uhdBadge}>
              <Text style={detailStyles.uhdBadgeText}>
                4K UHD
              </Text>
            </View>
          </View>

          {/* Genres Row */}
          {genresList.length > 0 && (
            <View style={detailStyles.genresRow}>
              {genresList.map((genre) => (
                <View 
                  key={genre.id || genre.name}
                  style={detailStyles.genrePill}
                >
                  <Text style={detailStyles.genreText}>
                    {genre.name}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Synopsis */}
          {details.overview ? (
            <View style={detailStyles.synopsisContainer}>
              <Text 
                numberOfLines={synopsisExpanded ? undefined : 3} 
                style={detailStyles.synopsisText}
              >
                {details.overview}
              </Text>
              {details.overview.length > 120 && (
                <TouchableOpacity 
                  onPress={() => setSynopsisExpanded(!synopsisExpanded)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={detailStyles.synopsisToggle}>
                    {synopsisExpanded ? 'Show Less' : 'More'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}
        </View>

        {/* ========================================================================= */}
        {/* 4. SEASONS & EPISODES (FOR TV SERIES) */}
        {/* ========================================================================= */}
        {isTVShow && (
          <View style={detailStyles.seasonsSection}>
            <Text style={detailStyles.sectionHeaderTitle}>
              Seasons & Episodes
            </Text>

            {/* Season Dropdown Selector */}
            {seasons.length > 0 && (
              <TouchableOpacity 
                onPress={() => setIsSeasonModalVisible(true)}
                style={detailStyles.seasonDropdown}
                activeOpacity={0.8}
              >
                <Text style={detailStyles.seasonDropdownText}>
                  Season {selectedSeason}
                </Text>
                <Ionicons name="chevron-down" size={scale(13)} color="#d4d4d8" />
              </TouchableOpacity>
            )}

            {/* Episodes Horizontal ScrollView */}
            {episodesList.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: scale(10) }}
                nestedScrollEnabled={true}
              >
                {episodesList.map((item, index) => {
                  const isPlayingThisEp = currentEpisode.id === item.id || currentEpisode.episodeNumber === item.episodeNumber;
                  return (
                    <TouchableOpacity 
                      key={`ep-${item.id || index}`}
                      onPress={() => selectEpisode(item)}
                      style={detailStyles.episodeCard}
                      activeOpacity={0.8}
                    >
                      <View style={detailStyles.episodeImageWrapper}>
                        <Image 
                          source={{ uri: item.image || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop' }} 
                          style={detailStyles.episodeImage}
                          resizeMode="cover"
                        />
                        {/* Play overlay button */}
                        <View style={detailStyles.episodePlayOverlay}>
                          <View style={detailStyles.episodePlayCircle}>
                            <Ionicons 
                              name={isPlayingThisEp && isPlaying ? "pause" : "play"} 
                              size={scale(13)} 
                              color="#ffffff" 
                              style={(!isPlayingThisEp || !isPlaying) ? { marginLeft: scale(1.5) } : null}
                            />
                          </View>
                        </View>
                        {item.isFutureAir && (
                          <View style={{ position: 'absolute', top: scale(4), right: scale(4), backgroundColor: 'rgba(217, 119, 6, 0.92)', borderRadius: scale(4), paddingHorizontal: scale(4), paddingVertical: scale(1.5) }}>
                            <Text style={{ color: '#ffffff', fontSize: moderateScale(7.5), fontWeight: '800' }}>UPCOMING</Text>
                          </View>
                        )}
                      </View>
                      
                      {/* Episode Title */}
                      <Text 
                        numberOfLines={1} 
                        style={[
                          detailStyles.episodeTitleText,
                          { color: isPlayingThisEp ? '#38bdf8' : '#ffffff', fontWeight: isPlayingThisEp ? '700' : '600' }
                        ]}
                      >
                        {item.episodeNumber ? `${item.episodeNumber}. ` : ''}{item.name || item.title || `Episode ${index + 1}`}
                      </Text>

                      {/* Episode Air Date / Runtime Subtitle */}
                      <Text numberOfLines={1} style={{ fontSize: moderateScale(9), color: item.isFutureAir ? '#fbbf24' : '#9ca3af', marginTop: verticalScale(2) }}>
                        {item.isFutureAir ? `Airing ${item.airDateFormatted}` : (item.airDateFormatted ? `${item.duration || '45m'} • ${item.airDateFormatted}` : (item.duration || '45m'))}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={{ padding: scale(14), backgroundColor: '#18181b', borderRadius: scale(10), borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', marginHorizontal: scale(16), alignItems: 'center' }}>
                <Ionicons name="calendar-outline" size={scale(22)} color="#9ca3af" style={{ marginBottom: verticalScale(4) }} />
                <Text style={{ color: '#ffffff', fontSize: moderateScale(12), fontWeight: '700', textAlign: 'center' }}>
                  No Episodes Released Yet
                </Text>
                <Text style={{ color: '#9ca3af', fontSize: moderateScale(10.5), marginTop: verticalScale(2), textAlign: 'center' }}>
                  Season {selectedSeason} episodes are currently unannounced or will air in upcoming dates.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ========================================================================= */}
        {/* 5. CAST SECTION */}
        {/* ========================================================================= */}
        <View style={detailStyles.castSection}>
          <Text style={detailStyles.sectionHeaderTitle}>Cast</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: scale(10) }}
            nestedScrollEnabled={true}
          >
            {(cast.length > 0 ? cast : DEFAULT_CAST).map((item, index) => (
              <View key={`cast-${item.id || index}`} style={detailStyles.castItem}>
                <View style={detailStyles.castAvatarWrapper}>
                  <Image 
                    source={{ uri: getCastImageUri(item) }} 
                    style={detailStyles.castAvatar}
                    resizeMode="cover"
                  />
                </View>
                <Text 
                  numberOfLines={2} 
                  style={detailStyles.castName}
                >
                  {item.name}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ========================================================================= */}
        {/* 6. MORE LIKE THIS / RECOMMENDATIONS */}
        {/* ========================================================================= */}
        <View style={detailStyles.recommendationsSection}>
          <Text style={detailStyles.sectionHeaderTitle}>More Like This</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: scale(10) }}
            nestedScrollEnabled={true}
          >
            {(recommendations.length > 0 ? recommendations : DEFAULT_RECOMMENDATIONS).map((item, index) => (
              <TouchableOpacity 
                key={`rec-${item.id || index}`}
                onPress={() => {
                  if (onNavigateMovie) {
                    onNavigateMovie(item);
                  } else {
                    setDetails(item);
                  }
                }}
                style={detailStyles.recCard}
                activeOpacity={0.8}
              >
                <View style={detailStyles.recImageWrapper}>
                  <Image 
                    source={{ uri: getRecImageUri(item) }} 
                    style={detailStyles.recImage}
                    resizeMode="cover"
                  />
                </View>
                <Text 
                  numberOfLines={1} 
                  style={detailStyles.recTitle}
                >
                  {item.title || item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Season Selection Modal */}
      <Modal
        visible={isSeasonModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsSeasonModalVisible(false)}
      >
        <Pressable 
          onPress={() => setIsSeasonModalVisible(false)}
          style={detailStyles.modalBackdrop}
        >
          <Pressable 
            onPress={(e) => e.stopPropagation()}
            style={detailStyles.modalCard}
          >
            <View style={detailStyles.modalHeader}>
              <Text style={detailStyles.modalTitle}>Select Season</Text>
              <TouchableOpacity onPress={() => setIsSeasonModalVisible(false)}>
                <Ionicons name="close" size={scale(20)} color="#a1a1aa" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: verticalScale(300) }}>
              {seasons.map((season) => {
                const isSelected = selectedSeason === season.season_number;
                return (
                  <TouchableOpacity
                    key={`season-opt-${season.id || season.season_number}`}
                    onPress={() => handleSeasonSelect(season.season_number)}
                    style={[
                      detailStyles.seasonOption,
                      isSelected && detailStyles.seasonOptionSelected
                    ]}
                  >
                    <Text style={[
                      detailStyles.seasonOptionText,
                      { color: isSelected ? '#38bdf8' : '#ffffff' }
                    ]}>
                      {season.name || `Season ${season.season_number}`}
                    </Text>
                    <Text style={detailStyles.seasonOptionCount}>
                      {season.episode_count ? `${season.episode_count} Episodes` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(14),
    paddingBottom: verticalScale(110),
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    marginBottom: verticalScale(14),
  },
  playButton: {
    flex: 1,
    height: verticalScale(44),
    backgroundColor: '#ffffff',
    borderRadius: scale(24),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ffffff',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  playButtonText: {
    color: '#09090b',
    fontSize: moderateScale(14),
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  downloadButton: {
    flex: 1,
    height: verticalScale(44),
    backgroundColor: '#242426',
    borderRadius: scale(24),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  downloadButtonText: {
    color: '#f3f4f6',
    fontSize: moderateScale(14),
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  serverSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginBottom: verticalScale(14),
  },
  serverPill: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(6),
    borderRadius: scale(18),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  serverPillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderColor: '#38bdf8',
  },
  serverPillText: {
    color: '#a1a1aa',
    fontSize: moderateScale(11.5),
    fontWeight: '600',
  },
  serverPillTextActive: {
    color: '#38bdf8',
    fontWeight: '800',
  },
  titleSection: {
    marginBottom: verticalScale(16),
  },
  displayTitle: {
    color: '#ffffff',
    fontSize: moderateScale(21),
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: verticalScale(3),
  },
  tagline: {
    color: '#9ca3af',
    fontSize: moderateScale(12),
    fontStyle: 'italic',
    marginBottom: verticalScale(6),
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: scale(7),
    marginTop: verticalScale(4),
  },
  typeBadge: {
    paddingHorizontal: scale(7),
    paddingVertical: verticalScale(2),
    borderRadius: scale(4),
    borderWidth: 1,
  },
  movieBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  tvBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.14)',
    borderColor: 'rgba(168, 85, 247, 0.35)',
  },
  typeBadgeText: {
    fontSize: moderateScale(9.5),
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metaText: {
    color: '#d4d4d8',
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: scale(5.5),
    paddingVertical: verticalScale(2),
    borderRadius: scale(4),
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  ratingText: {
    color: '#f59e0b',
    fontSize: moderateScale(11.5),
    fontWeight: '800',
  },
  certBox: {
    backgroundColor: '#27272a',
    paddingHorizontal: scale(5),
    paddingVertical: verticalScale(2),
    borderRadius: scale(4),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  certText: {
    color: '#d4d4d8',
    fontSize: moderateScale(9.5),
    fontWeight: '700',
  },
  uhdBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: scale(5.5),
    paddingVertical: verticalScale(2),
    borderRadius: scale(4),
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  uhdBadgeText: {
    color: '#38bdf8',
    fontSize: moderateScale(9),
    fontWeight: '800',
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(5),
    marginTop: verticalScale(9),
  },
  genrePill: {
    backgroundColor: '#18181b',
    paddingHorizontal: scale(9),
    paddingVertical: verticalScale(3.5),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  genreText: {
    color: '#d4d4d8',
    fontSize: moderateScale(11),
    fontWeight: '500',
  },
  synopsisContainer: {
    marginTop: verticalScale(10),
  },
  synopsisText: {
    color: '#a1a1aa',
    fontSize: moderateScale(12.5),
    lineHeight: moderateScale(18),
  },
  synopsisToggle: {
    color: '#38bdf8',
    fontSize: moderateScale(12),
    fontWeight: '700',
    marginTop: verticalScale(3),
  },
  seasonsSection: {
    marginBottom: verticalScale(18),
  },
  sectionHeaderTitle: {
    color: '#ffffff',
    fontSize: moderateScale(16),
    fontWeight: '800',
    marginBottom: verticalScale(9),
  },
  seasonDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignSelf: 'flex-start',
    marginBottom: verticalScale(10),
    gap: scale(5),
  },
  seasonDropdownText: {
    color: '#ffffff',
    fontSize: moderateScale(12),
    fontWeight: '700',
  },
  episodeCard: {
    width: scale(135),
    marginRight: scale(10),
  },
  episodeImageWrapper: {
    width: scale(135),
    height: verticalScale(78),
    borderRadius: scale(8),
    overflow: 'hidden',
    backgroundColor: '#18181b',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  episodeImage: {
    width: '100%',
    height: '100%',
  },
  episodePlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  episodePlayCircle: {
    width: scale(26),
    height: scale(26),
    borderRadius: scale(13),
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  episodeTitleText: {
    fontSize: moderateScale(11.5),
    marginTop: verticalScale(5),
    fontWeight: '500',
  },
  castSection: {
    marginBottom: verticalScale(18),
  },
  castItem: {
    width: scale(68),
    marginRight: scale(12),
    alignItems: 'center',
  },
  castAvatarWrapper: {
    width: scale(58),
    height: scale(58),
    borderRadius: scale(29),
    overflow: 'hidden',
    backgroundColor: '#27272a',
    marginBottom: verticalScale(5),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  castAvatar: {
    width: '100%',
    height: '100%',
  },
  castName: {
    color: '#d4d4d8',
    fontSize: moderateScale(10.5),
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: moderateScale(13.5),
  },
  recommendationsSection: {
    marginBottom: verticalScale(24),
  },
  recCard: {
    width: scale(105),
    marginRight: scale(10),
  },
  recImageWrapper: {
    width: scale(105),
    height: verticalScale(152),
    borderRadius: scale(10),
    overflow: 'hidden',
    backgroundColor: '#18181b',
    marginBottom: verticalScale(5),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  recImage: {
    width: '100%',
    height: '100%',
  },
  recTitle: {
    color: '#e4e4e7',
    fontSize: moderateScale(11.5),
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },
  modalCard: {
    width: '100%',
    maxWidth: scale(340),
    backgroundColor: '#18181b',
    borderRadius: scale(16),
    padding: scale(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
    paddingBottom: verticalScale(8),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: moderateScale(16),
    fontWeight: '800',
  },
  seasonOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(12),
    borderRadius: scale(10),
    marginBottom: verticalScale(6),
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  seasonOptionSelected: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.40)',
  },
  seasonOptionText: {
    fontWeight: '700',
    fontSize: moderateScale(13),
  },
  seasonOptionCount: {
    color: '#a1a1aa',
    fontSize: moderateScale(11),
    fontWeight: '500',
  }
});
