import React from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPosterUrl } from '../utils/api';
import { scale, verticalScale, moderateScale } from '../utils/responsive';

export default function TopTenRow({ title, data, onMoviePress }) {
  if (!data || data.length === 0) return null;

  const renderItem = ({ item, index }) => {
    const rankNumber = index + 1;
    const posterUri = getPosterUrl(item.poster_path || item.image);
    const itemTitle = item.title || item.name || '';
    const rating = item.vote_average ? Number(item.vote_average).toFixed(1) : null;

    return (
      <TouchableOpacity 
        style={styles.itemContainer}
        activeOpacity={0.8}
        onPress={() => onMoviePress && onMoviePress(item)}
      >
        <View style={styles.cardAndRankWrapper}>
          {/* Glowing Ice-Blue Outlined Rank Number */}
          <View style={styles.rankContainer}>
            {/* Outline Glow Shadow Layer */}
            <Text 
              style={[
                styles.rankNumberGlow,
                rankNumber >= 10 && styles.doubleDigitGlow
              ]}
            >
              {rankNumber}
            </Text>
            {/* Foreground Main Rank Text */}
            <Text 
              style={[
                styles.rankNumberForeground,
                rankNumber >= 10 && styles.doubleDigitForeground
              ]}
            >
              {rankNumber}
            </Text>
          </View>
          
          {/* Movie Poster Card */}
          <View style={styles.posterWrapper}>
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
        </View>
        
        {/* Movie Title */}
        <Text 
          numberOfLines={2} 
          style={styles.titleText}
        >
          {itemTitle}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        data={data.slice(0, 10)}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => (item.id ? `top10-${item.id}` : `top10-idx-${index}`)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginVertical: verticalScale(14),
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: moderateScale(20),
    fontWeight: '800',
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(12),
    letterSpacing: -0.3,
  },
  listContent: {
    paddingLeft: scale(20),
    paddingRight: scale(16),
  },
  itemContainer: {
    width: scale(135),
    marginRight: scale(10),
  },
  cardAndRankWrapper: {
    height: verticalScale(168),
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  rankContainer: {
    position: 'absolute',
    left: scale(-14),
    bottom: verticalScale(-6),
    zIndex: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumberGlow: {
    fontSize: moderateScale(88),
    fontWeight: '900',
    fontFamily: 'System',
    color: '#38bdf8',
    textShadowColor: '#38bdf8',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    position: 'absolute',
  },
  rankNumberForeground: {
    fontSize: moderateScale(88),
    fontWeight: '900',
    fontFamily: 'System',
    color: '#09090b',
    textShadowColor: '#38bdf8',
    textShadowOffset: { width: 1.5, height: 1.5 },
    textShadowRadius: 3,
  },
  doubleDigitGlow: {
    fontSize: moderateScale(72),
    left: scale(-8),
  },
  doubleDigitForeground: {
    fontSize: moderateScale(72),
    left: scale(-8),
  },
  posterWrapper: {
    width: scale(110),
    height: verticalScale(160),
    borderRadius: scale(10),
    overflow: 'hidden',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 10,
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  titleText: {
    color: '#a1a1aa',
    fontSize: moderateScale(13),
    fontWeight: '500',
    marginTop: verticalScale(6),
    lineHeight: moderateScale(16),
    paddingLeft: scale(4),
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
  }
});
