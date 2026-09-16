import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Keyboard,
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { searchMulti, fetchTopSearchesToday, getPosterUrl, formatYear } from '../utils/api';
import { scale, verticalScale, moderateScale } from '../utils/responsive';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - scale(44)) / 3;

export default function SearchScreen({ onMoviePress }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'movie' | 'tv'
  const [searchResults, setSearchResults] = useState([]);
  const [topSearches, setTopSearches] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingTopSearches, setLoadingTopSearches] = useState(true);

  const searchDebounceTimer = useRef(null);
  const inputRef = useRef(null);

  // Fetch Top Searches Today on mount
  useEffect(() => {
    let isMounted = true;
    async function loadTopSearches() {
      setLoadingTopSearches(true);
      try {
        const results = await fetchTopSearchesToday();
        if (isMounted) {
          setTopSearches(results.slice(0, 20));
        }
      } catch (err) {
        console.warn('[SearchScreen] Error loading top searches:', err);
      } finally {
        if (isMounted) setLoadingTopSearches(false);
      }
    }
    loadTopSearches();
    return () => { isMounted = false; };
  }, []);

  // Real-time debounced TMDB search
  const performSearch = useCallback(async (query) => {
    if (!query || !query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchMulti(query);
      setSearchResults(results);
    } catch (err) {
      console.warn('[SearchScreen] Search error:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleQueryChange = (text) => {
    setSearchQuery(text);
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }
    if (!text.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    searchDebounceTimer.current = setTimeout(() => {
      performSearch(text);
    }, 350);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleChipPress = (title) => {
    setSearchQuery(title);
    Keyboard.dismiss();
    performSearch(title);
  };

  // Filter items according to active pill
  const filteredResults = searchResults.filter((item) => {
    if (selectedFilter === 'all') return true;
    return item.media_type === selectedFilter;
  });

  const filteredTopSearches = topSearches.filter((item) => {
    if (selectedFilter === 'all') return true;
    return item.media_type === selectedFilter;
  });

  const renderMediaCard = ({ item, index }) => {
    const isTv = item.media_type === 'tv' || !item.title;
    const title = item.title || item.name || 'Untitled';
    const year = formatYear(item.release_date || item.first_air_date);
    const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
    const posterUri = getPosterUrl(item.poster_path || item.backdrop_path);

    return (
      <TouchableOpacity
        style={styles.cardContainer}
        activeOpacity={0.82}
        onPress={() => onMoviePress && onMoviePress(item)}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: posterUri }}
            style={styles.posterImage}
            resizeMode="cover"
          />
          <View style={styles.badgeContainer}>
            <View style={[styles.typeBadge, isTv ? styles.tvBadge : styles.movieBadge]}>
              <Text style={styles.typeBadgeText}>{isTv ? 'SERIES' : 'MOVIE'}</Text>
            </View>
          </View>
          {rating && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={scale(9)} color="#f59e0b" />
              <Text style={styles.ratingText}>{rating}</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {title}
        </Text>
        {year ? <Text style={styles.cardYear}>{year}</Text> : null}
      </TouchableOpacity>
    );
  };

  const renderTrendingChip = (item) => {
    const title = item.title || item.name;
    if (!title) return null;
    return (
      <TouchableOpacity
        key={`chip-${item.id}`}
        style={styles.chip}
        activeOpacity={0.7}
        onPress={() => handleChipPress(title)}
      >
        <Ionicons name="trending-up-outline" size={scale(13)} color="#38bdf8" />
        <Text style={styles.chipText} numberOfLines={1}>{title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header & Search Bar */}
        <View style={styles.searchHeader}>
          <Text style={styles.screenHeading}>Search</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="search" size={scale(18)} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="Search movies, series, anime..."
              placeholderTextColor="#6b7280"
              value={searchQuery}
              onChangeText={handleQueryChange}
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => performSearch(searchQuery)}
            />
            {isSearching ? (
              <ActivityIndicator size="small" color="#38bdf8" style={styles.rightIcon} />
            ) : searchQuery.length > 0 ? (
              <TouchableOpacity onPress={clearSearch} style={styles.rightIcon} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={scale(18)} color="#9ca3af" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filter Pills (All / Movies / TV Series) */}
          <View style={styles.filterRow}>
            {[
              { id: 'all', label: 'All' },
              { id: 'movie', label: 'Movies' },
              { id: 'tv', label: 'TV Series' }
            ].map((f) => {
              const active = selectedFilter === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                  onPress={() => setSelectedFilter(f.id)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Content Body */}
        {searchQuery.trim().length > 0 ? (
          /* Search Results Grid */
          filteredResults.length > 0 ? (
            <FlatList
              data={filteredResults}
              keyExtractor={(item, index) => `search-${item.id}-${index}`}
              renderItem={renderMediaCard}
              numColumns={3}
              initialNumToRender={12}
              maxToRenderPerBatch={12}
              windowSize={5}
              removeClippedSubviews={Platform.OS === 'android'}
              contentContainerStyle={styles.gridContent}
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="on-drag"
            />
          ) : !isSearching ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="film-outline" size={scale(48)} color="#4b5563" />
              <Text style={styles.emptyStateTitle}>No results found</Text>
              <Text style={styles.emptyStateSub}>
                We couldn't find anything for "{searchQuery}". Try searching for another movie or series title.
              </Text>
            </View>
          ) : null
        ) : (
          /* Top Searches Today (Daily TMDB trending) */
          <FlatList
            data={filteredTopSearches}
            keyExtractor={(item, index) => `top-${item.id}-${index}`}
            renderItem={renderMediaCard}
            numColumns={3}
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={5}
            removeClippedSubviews={Platform.OS === 'android'}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            ListHeaderComponent={
              <View style={styles.topSearchesHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="flame" size={scale(18)} color="#f97316" />
                  <Text style={styles.sectionTitle}>Top Searches Today</Text>
                </View>
                {/* Horizontal Trending Quick Chips */}
                <View style={styles.chipsContainer}>
                  {topSearches.slice(0, 6).map(renderTrendingChip)}
                </View>
              </View>
            }
            ListEmptyComponent={
              loadingTopSearches ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color="#38bdf8" />
                  <Text style={styles.loaderText}>Fetching daily trending titles...</Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  searchHeader: {
    paddingHorizontal: scale(16),
    paddingTop: Platform.OS === 'android' ? verticalScale(18) : verticalScale(8),
    paddingBottom: verticalScale(10),
    backgroundColor: '#09090b',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  screenHeading: {
    fontSize: moderateScale(24),
    fontWeight: '800',
    color: '#f3f4f6',
    letterSpacing: -0.5,
    marginBottom: verticalScale(12),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: scale(14),
    paddingHorizontal: scale(12),
    height: verticalScale(44),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  searchIcon: {
    marginRight: scale(8),
  },
  textInput: {
    flex: 1,
    color: '#f9fafb',
    fontSize: moderateScale(14),
    paddingVertical: 0,
    fontWeight: '500',
  },
  rightIcon: {
    marginLeft: scale(6),
  },
  filterRow: {
    flexDirection: 'row',
    marginTop: verticalScale(12),
    gap: scale(8),
  },
  filterPill: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(5),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  filterPillActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  filterPillText: {
    color: '#9ca3af',
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#09090b',
    fontWeight: '700',
  },
  topSearchesHeader: {
    marginBottom: verticalScale(12),
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(10),
    gap: scale(6),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#f3f4f6',
    letterSpacing: -0.2,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(6),
    marginBottom: verticalScale(8),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: scale(16),
    gap: scale(5),
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  chipText: {
    color: '#e5e7eb',
    fontSize: moderateScale(11),
    fontWeight: '500',
    maxWidth: scale(110),
  },
  gridContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(14),
    paddingBottom: verticalScale(110),
  },
  cardContainer: {
    width: COLUMN_WIDTH,
    marginBottom: verticalScale(16),
    marginRight: scale(6),
  },
  imageWrapper: {
    width: '100%',
    height: COLUMN_WIDTH * 1.5,
    borderRadius: scale(10),
    overflow: 'hidden',
    backgroundColor: '#18181b',
    position: 'relative',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  badgeContainer: {
    position: 'absolute',
    top: scale(5),
    left: scale(5),
  },
  typeBadge: {
    paddingHorizontal: scale(5),
    paddingVertical: verticalScale(2),
    borderRadius: scale(4),
  },
  movieBadge: {
    backgroundColor: 'rgba(14, 165, 233, 0.90)',
  },
  tvBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.90)',
  },
  typeBadgeText: {
    color: '#ffffff',
    fontSize: moderateScale(8),
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: scale(5),
    right: scale(5),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: scale(5),
    paddingVertical: verticalScale(2),
    borderRadius: scale(4),
    gap: scale(2),
  },
  ratingText: {
    color: '#f9fafb',
    fontSize: moderateScale(9),
    fontWeight: '700',
  },
  cardTitle: {
    color: '#f3f4f6',
    fontSize: moderateScale(11),
    fontWeight: '600',
    marginTop: verticalScale(5),
  },
  cardYear: {
    color: '#9ca3af',
    fontSize: moderateScale(10),
    marginTop: verticalScale(1),
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(32),
    paddingTop: verticalScale(60),
  },
  emptyStateTitle: {
    color: '#f3f4f6',
    fontSize: moderateScale(16),
    fontWeight: '700',
    marginTop: verticalScale(12),
  },
  emptyStateSub: {
    color: '#9ca3af',
    fontSize: moderateScale(12),
    textAlign: 'center',
    marginTop: verticalScale(6),
    lineHeight: verticalScale(18),
  },
  loaderContainer: {
    paddingVertical: verticalScale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    color: '#9ca3af',
    fontSize: moderateScale(12),
    marginTop: verticalScale(10),
  }
});
