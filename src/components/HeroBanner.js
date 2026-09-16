import React from 'react';
import { StyleSheet, Text, View, ImageBackground, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale, SCREEN_HEIGHT, SCREEN_WIDTH } from '../utils/responsive';
import { getBackdropUrl, getPosterUrl } from '../utils/api';

const DEFAULT_BANNER = {
  id: 693134,
  title: 'Dune: Part Two',
  tag: 'New Episode',
  backdrop_path: '/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
  poster_path: '/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
  overview: 'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family.',
  media_type: 'movie'
};

export default function HeroBanner({ movie, onPlayPress, onInfoPress }) {
  const currentMovie = movie || DEFAULT_BANNER;
  
  // Resolve backdrop image URI
  let imageUri = 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg';
  if (currentMovie.backdrop_path) {
    imageUri = getBackdropUrl(currentMovie.backdrop_path);
  } else if (currentMovie.poster_path) {
    imageUri = getPosterUrl(currentMovie.poster_path);
  } else if (currentMovie.image) {
    imageUri = currentMovie.image;
  } else if (currentMovie.bannerImage) {
    imageUri = currentMovie.bannerImage;
  }

  const isTV = currentMovie.media_type === 'tv' ? true :
               currentMovie.media_type === 'movie' ? false :
               (Boolean(currentMovie.first_air_date) && !currentMovie.release_date && !currentMovie.title);
  const tagText = currentMovie.tag || (isTV ? 'New Episode' : 'New Release');
  const titleText = currentMovie.title || currentMovie.name || 'Dune: Part Two';

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: imageUri }}
        style={styles.bannerImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            'rgba(9, 9, 11, 0.15)',
            'transparent',
            'rgba(9, 9, 11, 0.4)',
            'rgba(9, 9, 11, 0.85)',
            '#09090b'
          ]}
          locations={[0, 0.25, 0.55, 0.85, 1]}
          style={styles.gradient}
        >
          <View style={styles.contentContainer}>
            {/* Pill Badge */}
            <View style={styles.badgeContainer}>
              <View style={styles.badgeCheck}>
                <Ionicons name="checkmark-circle" size={scale(15)} color="#3fa9f5" />
              </View>
              <Text style={styles.badgeText}>{tagText}</Text>
            </View>

            {/* Title */}
            <Text style={styles.titleText} numberOfLines={2}>
              {titleText}
            </Text>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              {/* Play Button */}
              <TouchableOpacity 
                style={styles.playButton} 
                activeOpacity={0.85}
                onPress={() => onPlayPress && onPlayPress(currentMovie)}
              >
                <Ionicons name="play" size={scale(18)} color="#000" />
                <Text style={styles.playButtonText}>Play</Text>
              </TouchableOpacity>

              {/* More Info Button */}
              <TouchableOpacity 
                style={styles.infoButton} 
                activeOpacity={0.85}
                onPress={() => onInfoPress && onInfoPress(currentMovie)}
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
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.52,
    backgroundColor: '#09090b',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(14),
  },
  contentContainer: {
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
    marginBottom: verticalScale(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  badgeCheck: {
    marginRight: scale(5),
  },
  badgeText: {
    color: '#ffffff',
    fontSize: moderateScale(12),
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  titleText: {
    color: '#ffffff',
    fontSize: moderateScale(32),
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: verticalScale(14),
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
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
  }
});
