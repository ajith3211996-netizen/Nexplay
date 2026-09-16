import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  ImageBackground, 
  TouchableOpacity, 
  Animated as RNAnimated 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getBackdropUrl, getPosterUrl, formatRuntime } from '../utils/api';
import CinematicLogo from './CinematicLogo';
import { scale, verticalScale, moderateScale, SCREEN_WIDTH, SCREEN_HEIGHT } from '../utils/responsive';

// Genre ID to name mapping
const GENRE_MAP = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Doc", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 53: "Thriller",
  10752: "War", 37: "Western", 10759: "Action & Adv", 10765: "Sci-Fi & Fantasy"
};

const DEFAULT_BANNER = {
  id: 693134,
  title: 'Dune: Part Two',
  tag: 'Top 10 Weekly',
  backdrop_path: '/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
  poster_path: '/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
  overview: 'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family.',
  vote_average: 8.2,
  release_date: '2024-02-27',
  runtime: 166,
  genre_ids: [878, 12],
  media_type: 'movie'
};

export default function HeroCarousel({ movies = [], onMoviePress }) {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, 14);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new RNAnimated.Value(0)).current;
  const isInteracting = useRef(false);

  // Take top 10 weekly items
  const data = movies.length > 0 ? movies.slice(0, 10) : [DEFAULT_BANNER];

  // Auto-play interval (every 5 seconds)
  useEffect(() => {
    if (data.length <= 1) return;

    const interval = setInterval(() => {
      if (isInteracting.current) return;
      setActiveIndex((prev) => {
        const next = (prev + 1) % data.length;
        try {
          flatListRef.current?.scrollToIndex({
            index: next,
            animated: true,
          });
        } catch (e) {
          flatListRef.current?.scrollToOffset({
            offset: next * SCREEN_WIDTH,
            animated: true
          });
        }
        return next;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [data.length]);

  const onMomentumScrollEnd = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
    isInteracting.current = false;
  };

  const renderSlide = ({ item, index }) => {
    const isTV = item.media_type === 'tv' ? true :
                 item.media_type === 'movie' ? false :
                 (Boolean(item.first_air_date) && !item.release_date && !item.title);
    const titleText = item.title || item.name || 'Featured Title';
    
    // Resolve backdrop/poster URI
    let imageUri = 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg';
    if (item.backdrop_path) {
      imageUri = getBackdropUrl(item.backdrop_path);
    } else if (item.poster_path) {
      imageUri = getPosterUrl(item.poster_path);
    } else if (item.image) {
      imageUri = item.image;
    }

    // 1. Rating
    const rawRating = item.vote_average || 8.0;
    const ratingText = rawRating > 0 ? rawRating.toFixed(1) : '8.0';

    // 2. Year
    const dateStr = item.release_date || item.first_air_date || '';
    const year = dateStr ? dateStr.split('-')[0] : '2024';

    // 3. Duration / Seasons
    let durationText = '2h 15m';
    if (isTV) {
      const seasons = item.number_of_seasons || 1;
      durationText = seasons === 1 ? '1 Season' : `${seasons} Seasons`;
    } else if (item.runtime) {
      durationText = formatRuntime(item.runtime);
    }

    // 4. Genres (up to 2)
    let genreText = 'Action • Sci-Fi';
    if (item.genres && Array.isArray(item.genres) && item.genres.length > 0) {
      genreText = item.genres.slice(0, 2).map((g) => g.name).join(' • ');
    } else if (item.genre_ids && Array.isArray(item.genre_ids) && item.genre_ids.length > 0) {
      genreText = item.genre_ids
        .slice(0, 2)
        .map((id) => GENRE_MAP[id] || 'Drama')
        .join(' • ');
    }

    // 5. Dynamic Badge Text: "New Episode" for TV Series, "New Release" for Movies
    const badgeText = item.tag || (isTV ? 'New Episode' : 'New Release');

    return (
      <View style={styles.slideContainer}>
        <ImageBackground
          source={{ uri: imageUri }}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={[
              'rgba(9, 9, 11, 0.2)',
              'transparent',
              'rgba(9, 9, 11, 0.45)',
              'rgba(9, 9, 11, 0.88)',
              '#09090b'
            ]}
            locations={[0, 0.25, 0.55, 0.85, 1]}
            style={styles.gradient}
          >
            <View style={styles.slideContent}>
              {/* Badge */}
              <View style={styles.badgeContainer}>
                <Ionicons name="checkmark-circle" size={scale(14)} color="#3fa9f5" style={styles.badgeIcon} />
                <Text style={styles.badgeText}>{badgeText}</Text>
              </View>

              {/* Title */}
              <Text style={styles.titleText} numberOfLines={2}>
                {titleText}
              </Text>

              {/* Rich Metadata Line: Rating • Type • Year • Duration • Genres */}
              <View style={styles.metadataRow}>
                {/* Rating Badge */}
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={scale(12)} color="#eab308" />
                  <Text style={styles.ratingText}>{ratingText}</Text>
                </View>

                {/* Media Type Badge (Movie / TV Series) */}
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>{isTV ? 'TV Series' : 'Movie'}</Text>
                </View>

                {/* Release Year */}
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaText}>{year}</Text>

                {/* Duration / Seasons */}
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaText}>{durationText}</Text>

                {/* Genre */}
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaText} numberOfLines={1}>{genreText}</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonRow}>
                {/* Play Button */}
                <TouchableOpacity 
                  style={styles.playButton} 
                  activeOpacity={0.85}
                  onPress={() => onMoviePress && onMoviePress(item)}
                >
                  <Ionicons name="play" size={scale(18)} color="#000" />
                  <Text style={styles.playButtonText}>Play</Text>
                </TouchableOpacity>

                {/* More Info Button */}
                <TouchableOpacity 
                  style={styles.infoButton} 
                  activeOpacity={0.85}
                  onPress={() => onMoviePress && onMoviePress(item)}
                >
                  <Ionicons name="information-circle-outline" size={scale(20)} color="#fff" style={styles.infoIcon} />
                  <Text style={styles.infoButtonText}>More Info</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top NexPlay App Branding Header */}
      <LinearGradient
        colors={['rgba(9, 9, 11, 0.95)', 'rgba(9, 9, 11, 0.7)', 'transparent']}
        locations={[0, 0.6, 1]}
        style={[styles.brandingHeader, { paddingTop: topPadding }]}
        pointerEvents="box-none"
      >
        <View style={styles.brandRow}>
          {/* Master Cinematic Logo */}
          <CinematicLogo size="sm" showTagline={false} showBadge={true} glow={true} />
        </View>
      </LinearGradient>

      <FlatList
        ref={flatListRef}
        data={data}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, idx) => (item.id ? item.id.toString() : idx.toString())}
        renderItem={renderSlide}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollBeginDrag={() => { isInteracting.current = true; }}
        getItemLayout={(data, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index
        })}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({
              offset: info.index * SCREEN_WIDTH,
              animated: true
            });
          }, 100);
        }}
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />

      {/* Pagination Indicator Dots at the bottom */}
      <View style={styles.paginationContainer} pointerEvents="none">
        {data.map((_, i) => {
          const isActive = i === activeIndex;
          return (
            <View 
              key={i} 
              style={[
                styles.paginationDot,
                isActive ? styles.paginationDotActive : styles.paginationDotInactive
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.54,
    backgroundColor: '#09090b',
    position: 'relative',
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(22),
  },
  slideContent: {
    alignItems: 'flex-start',
    width: '100%',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: verticalScale(4),
    paddingHorizontal: scale(10),
    borderRadius: scale(20),
    marginBottom: verticalScale(6),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  badgeIcon: {
    marginRight: scale(5),
  },
  badgeText: {
    color: '#ffffff',
    fontSize: moderateScale(11),
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  titleText: {
    color: '#ffffff',
    fontSize: moderateScale(30),
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: verticalScale(8),
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: verticalScale(14),
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.18)',
    paddingVertical: verticalScale(2),
    paddingHorizontal: scale(6),
    borderRadius: scale(4),
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.4)',
    marginRight: scale(6),
  },
  ratingText: {
    color: '#fde047',
    fontSize: moderateScale(11),
    fontWeight: '800',
    marginLeft: scale(3),
  },
  typeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: verticalScale(2),
    paddingHorizontal: scale(6),
    borderRadius: scale(4),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginRight: scale(6),
  },
  typeText: {
    color: '#e4e4e7',
    fontSize: moderateScale(11),
    fontWeight: '700',
  },
  metaDot: {
    color: '#71717a',
    fontSize: moderateScale(12),
    marginHorizontal: scale(4),
  },
  metaText: {
    color: '#d4d4d8',
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: scale(12),
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: verticalScale(10),
    borderRadius: scale(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  playButtonText: {
    color: '#000000',
    fontSize: moderateScale(15),
    fontWeight: '700',
    marginLeft: scale(6),
  },
  infoButton: {
    flex: 1.15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(120, 120, 128, 0.4)',
    paddingVertical: verticalScale(10),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  infoButtonText: {
    color: '#ffffff',
    fontSize: moderateScale(15),
    fontWeight: '600',
    marginLeft: scale(6),
  },
  infoIcon: {
    marginRight: scale(1),
  },
  paginationContainer: {
    position: 'absolute',
    bottom: verticalScale(6),
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(5),
  },
  paginationDot: {
    height: verticalScale(4),
    borderRadius: scale(2),
  },
  paginationDotActive: {
    width: scale(18),
    backgroundColor: '#38bdf8',
  },
  paginationDotInactive: {
    width: scale(5),
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  brandingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 25,
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(14),
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  brandLogoIcon: {
    width: scale(26),
    height: scale(26),
    borderRadius: scale(7),
    backgroundColor: '#38bdf8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#38bdf8',
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  brandTitleText: {
    fontSize: moderateScale(21),
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  brandHighlightText: {
    color: '#38bdf8',
  },
  vipBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.45)',
    borderWidth: 1,
    borderRadius: scale(10),
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
  },
  vipBadgeText: {
    color: '#38bdf8',
    fontSize: moderateScale(8.5),
    fontWeight: '800',
    letterSpacing: 0.5,
  }
});
