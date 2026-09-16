import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from '../utils/responsive';

/**
 * CinematicLogo
 * Master Vector & Gradient Branding Component for NexPlay
 * Sizes: 'sm' (Header), 'md' (Card/Modal), 'lg' (Splash/Cinema Intro)
 */
export default function CinematicLogo({ size = 'md', showTagline = true, showBadge = true, glow = true }) {
  const isLarge = size === 'lg';
  const isSmall = size === 'sm';

  const iconSize = isLarge ? scale(48) : isSmall ? scale(24) : scale(34);
  const playIconSize = isLarge ? scale(24) : isSmall ? scale(12) : scale(17);
  const nexFontSize = isLarge ? moderateScale(34) : isSmall ? moderateScale(19) : moderateScale(25);
  const playFontSize = isLarge ? moderateScale(34) : isSmall ? moderateScale(19) : moderateScale(25);
  const taglineFontSize = isLarge ? moderateScale(10) : moderateScale(8);

  return (
    <View style={styles.wrapper}>
      {/* Glow aura behind logo */}
      {glow && (
        <View 
          style={[
            styles.glowAura, 
            { 
              width: isLarge ? scale(220) : scale(140), 
              height: isLarge ? scale(100) : scale(60),
              borderRadius: isLarge ? scale(50) : scale(30),
            }
          ]} 
          pointerEvents="none" 
        />
      )}

      {/* Main Horizontal Logo Unit */}
      <View style={styles.logoRow}>
        {/* 3D Embossed Shield with Radiant Gradient */}
        <LinearGradient
          colors={['#38bdf8', '#2563eb', '#0284c7', '#0f172a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.shieldContainer,
            {
              width: iconSize,
              height: iconSize,
              borderRadius: isLarge ? scale(15) : isSmall ? scale(7) : scale(10),
            }
          ]}
        >
          {/* Gloss highlight edge */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.65)', 'rgba(255, 255, 255, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.8, y: 0.8 }}
            style={[
              styles.shieldGloss,
              { borderRadius: isLarge ? scale(13) : isSmall ? scale(6) : scale(9) }
            ]}
          >
            {/* Center Play Glyph with Neon Glow */}
            <View style={styles.glyphWrapper}>
              <Ionicons 
                name="play" 
                size={playIconSize} 
                color="#ffffff" 
                style={{ marginLeft: isLarge ? scale(3) : scale(1.5) }} 
              />
            </View>
          </LinearGradient>
        </LinearGradient>

        {/* Brand Name Typography */}
        <View style={styles.textColumn}>
          <View style={styles.titleRow}>
            <Text style={[styles.nexText, { fontSize: nexFontSize }]}>
              NEX
            </Text>
            <Text style={[styles.playText, { fontSize: playFontSize }]}>
              PLAY
            </Text>
            
            {showBadge && !isSmall && (
              <LinearGradient
                colors={['rgba(56, 189, 248, 0.25)', 'rgba(129, 140, 248, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.proBadge}
              >
                <Text style={styles.proBadgeText}>4K HDR</Text>
              </LinearGradient>
            )}
          </View>
        </View>
      </View>

      {/* Cinematic Tagline Subtitle */}
      {showTagline && isLarge && (
        <View style={styles.taglineWrapper}>
          <View style={styles.taglineDivider} />
          <Text style={[styles.taglineText, { fontSize: taglineFontSize }]}>
            THE ULTIMATE CINEMA STREAMING
          </Text>
          <View style={styles.taglineDivider} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowAura: {
    position: 'absolute',
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    transform: [{ scale: 1.2 }],
    zIndex: 0,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    gap: scale(10),
  },
  shieldContainer: {
    padding: 1.5,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldGloss: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  glyphWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(1),
  },
  nexText: {
    color: '#ffffff',
    fontWeight: '900',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  playText: {
    color: '#38bdf8',
    fontWeight: '900',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(56, 189, 248, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  proBadge: {
    marginLeft: scale(8),
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    borderRadius: scale(6),
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
  },
  proBadgeText: {
    color: '#38bdf8',
    fontSize: moderateScale(8.5),
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  taglineWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(10),
    gap: scale(8),
    zIndex: 2,
  },
  taglineDivider: {
    width: scale(22),
    height: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.4)',
  },
  taglineText: {
    color: '#94a3b8',
    fontWeight: '700',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  }
});
