import React from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getPosterUrl } from '../utils/api';
import { scale, verticalScale, moderateScale } from '../utils/responsive';

export default function ContinueWatchingRow({ title, data, onMoviePress }) {
  if (!data || data.length === 0) return null;

  const renderItem = ({ item }) => {
    const posterUri = getPosterUrl(item.poster_path || item.image);
    const itemTitle = item.title || item.name || '';
    const progress = item.progress || 50;
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

          {/* Bottom Dark Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.92)']}
            locations={[0, 0.5, 1]}
            style={styles.gradientOverlay}
          >
            {/* Percentage Text on the bottom right */}
            <Text style={styles.percentageText}>{progress}%</Text>

            {/* Glowing Blue Progress Bar at the bottom */}
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
          </LinearGradient>
        </View>

        {/* Title Below */}
        <Text numberOfLines={2} style={styles.titleText}>
          {itemTitle}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => (item.id ? `cw-${item.id}` : `cw-idx-${index}`)}
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
    justifyContent: 'flex-end',
  },
  posterImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradientOverlay: {
    width: '100%',
    height: verticalScale(50),
    justifyContent: 'flex-end',
    paddingHorizontal: scale(8),
    paddingBottom: verticalScale(6),
  },
  percentageText: {
    color: '#ffffff',
    fontSize: moderateScale(10),
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: verticalScale(3),
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  progressBarBackground: {
    width: '100%',
    height: verticalScale(3),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: scale(2),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: scale(2),
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  titleText: {
    color: '#a1a1aa',
    fontSize: moderateScale(13),
    fontWeight: '500',
    marginTop: verticalScale(6),
    lineHeight: moderateScale(16),
  },
  ratingBadge: {
    position: 'absolute',
    top: scale(6),
    right: scale(6),
    zIndex: 10,
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
