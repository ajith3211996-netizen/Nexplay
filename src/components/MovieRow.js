import React from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPosterUrl } from '../utils/api';
import { scale, verticalScale, moderateScale } from '../utils/responsive';

export default function MovieRow({ 
  title, 
  data, 
  categoryKey, 
  onMoviePress, 
  onSeeMore 
}) {
  if (!data || data.length === 0) return null;

  // Max 10 items displayed in the home row
  const displayData = data.slice(0, 10);

  const handleSeeMore = () => {
    if (onSeeMore) {
      onSeeMore({
        title,
        key: categoryKey || 'trending',
        data,
      });
    }
  };

  const renderItem = ({ item }) => {
    const posterUri = getPosterUrl(item.poster_path || item.image);
    const itemTitle = item.title || item.name || '';
    const rating = item.vote_average ? Number(item.vote_average).toFixed(1) : null;

    return (
      <TouchableOpacity 
        style={styles.cardContainer}
        activeOpacity={0.8}
        onPress={() => onMoviePress && onMoviePress(item)}
      >
        <View style={styles.imageWrapper}>
          <Image 
            source={{ uri: posterUri }} 
            style={styles.posterImage}
            resizeMode="cover"
          />
          {rating && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={scale(9)} color="#f59e0b" />
              <Text style={styles.ratingText}>{rating}</Text>
            </View>
          )}
        </View>
        <Text numberOfLines={2} style={styles.titleText}>
          {itemTitle}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSeeMoreCard = () => {
    if (!onSeeMore) return null;
    return (
      <TouchableOpacity
        style={styles.seeMoreCard}
        activeOpacity={0.75}
        onPress={handleSeeMore}
      >
        <View style={styles.seeMoreIconWrapper}>
          <Ionicons name="arrow-forward-circle" size={scale(32)} color="#38bdf8" />
          <Text style={styles.seeMoreCardTitle}>Explore All</Text>
          <Text style={styles.seeMoreCardSub}>New to Old</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.sectionContainer}>
      {/* Section Header with Title & See More button */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onSeeMore && (
          <TouchableOpacity 
            style={styles.seeMoreButton} 
            activeOpacity={0.7} 
            onPress={handleSeeMore}
          >
            <Text style={styles.seeMoreText}>See More</Text>
            <Ionicons name="chevron-forward" size={scale(14)} color="#38bdf8" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={displayData}
        horizontal
        showsHorizontalScrollIndicator={false}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={3}
        keyExtractor={(item, index) => (item.id ? `movie-${categoryKey || 'cat'}-${item.id}` : `movie-idx-${index}`)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={renderSeeMoreCard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginVertical: verticalScale(14),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(10),
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: moderateScale(19),
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(2),
    paddingVertical: verticalScale(4),
    paddingHorizontal: scale(6),
  },
  seeMoreText: {
    color: '#38bdf8',
    fontSize: moderateScale(12),
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: scale(16),
  },
  cardContainer: {
    width: scale(115),
    marginRight: scale(12),
  },
  imageWrapper: {
    width: scale(115),
    height: verticalScale(168),
    borderRadius: scale(10),
    overflow: 'hidden',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: scale(6),
    right: scale(6),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 9, 11, 0.78)',
    paddingHorizontal: scale(5),
    paddingVertical: verticalScale(2),
    borderRadius: scale(5),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: scale(2.5),
  },
  ratingText: {
    color: '#f9fafb',
    fontSize: moderateScale(9),
    fontWeight: '700',
  },
  titleText: {
    color: '#a1a1aa',
    fontSize: moderateScale(13),
    fontWeight: '500',
    marginTop: verticalScale(6),
    lineHeight: moderateScale(16),
  },
  seeMoreCard: {
    width: scale(100),
    height: verticalScale(168),
    borderRadius: scale(10),
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(16),
  },
  seeMoreIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeMoreCardTitle: {
    color: '#f3f4f6',
    fontSize: moderateScale(12),
    fontWeight: '700',
    marginTop: verticalScale(6),
  },
  seeMoreCardSub: {
    color: '#38bdf8',
    fontSize: moderateScale(9.5),
    fontWeight: '600',
    marginTop: verticalScale(2),
  }
});
