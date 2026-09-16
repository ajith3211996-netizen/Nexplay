import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Pressable,
  StatusBar 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import CinematicLogo from './CinematicLogo';
import { scale, verticalScale, moderateScale, SCREEN_WIDTH, SCREEN_HEIGHT } from '../utils/responsive';

/**
 * CinematicSplashScreen
 * Disney / Netflix Level Studio Opening Animation for NexPlay
 * - Powered by Hardware-Accelerated 60fps Lottie Animation
 * - Anamorphic lens flare beam sweep & expanding cosmic shockwaves
 * - Embossed 3D Neon & Titanium NexPlay Master Typography
 * - Studio Audio-Visual Badges (4K Ultra HD • Dolby Atmos)
 * - Synchronized Home Screen Loading (Zero spinners, direct seamless reveal)
 */
export default function CinematicSplashScreen({ onFinish, isDataReady = true }) {
  // Master Transitions
  const masterFade = useRef(new Animated.Value(1)).current;
  const masterScale = useRef(new Animated.Value(1)).current;
  
  // Ambient Aura & Flare Sweep
  const ambientGlowOpacity = useRef(new Animated.Value(0)).current;
  const flareX = useRef(new Animated.Value(-SCREEN_WIDTH * 0.8)).current;
  const flareOpacity = useRef(new Animated.Value(0)).current;
  
  // Logo & Typography
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  
  // Badges & Tagline
  const bottomTranslateY = useRef(new Animated.Value(20)).current;
  const bottomOpacity = useRef(new Animated.Value(0)).current;

  // Synchronization State
  const [animationCompleted, setAnimationCompleted] = useState(false);
  const isTransitioningRef = useRef(false);
  const lottieRef = useRef(null);

  // Trigger master 60fps seamless dissolve once animation finishes AND data is ready
  const triggerReveal = () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    Animated.parallel([
      Animated.timing(masterFade, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(masterScale, {
        toValue: 1.08,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onFinish) onFinish();
    });
  };

  useEffect(() => {
    // Stage 1: Ambient light & Anamorphic flare beam sweep (0.0s - 0.8s)
    Animated.parallel([
      Animated.timing(ambientGlowOpacity, {
        toValue: 0.95,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(flareOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(flareOpacity, {
          toValue: 0,
          duration: 550,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(flareX, {
        toValue: SCREEN_WIDTH * 1.2,
        duration: 1100,
        useNativeDriver: true,
      }),
    ]).start();

    // Stage 2: Logo spring materialization & studio badge reveal (0.4s - 1.4s)
    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(bottomOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(bottomTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Stage 3: Minimum cinematic studio duration (~2.6s)
    const timer = setTimeout(() => {
      setAnimationCompleted(true);
    }, 2600);

    return () => clearTimeout(timer);
  }, []);

  // When animation finishes and data is ready, transition to Home screen
  useEffect(() => {
    if (animationCompleted && isDataReady) {
      triggerReveal();
    }
  }, [animationCompleted, isDataReady]);

  // Instant Tap-to-Skip
  const handleSkip = () => {
    triggerReveal();
  };

  return (
    <Animated.View 
      style={[
        styles.overlay,
        { 
          opacity: masterFade,
          transform: [{ scale: masterScale }]
        }
      ]}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <Pressable style={StyleSheet.absoluteFill} onPress={handleSkip}>
        {/* Background Deep Cosmic Gradient */}
        <LinearGradient
          colors={['#030712', '#090d16', '#020617', '#000000']}
          locations={[0, 0.4, 0.75, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Ambient Pulsing Glow Orb */}
        <Animated.View
          style={[
            styles.ambientGlow,
            {
              opacity: ambientGlowOpacity
            }
          ]}
        >
          <LinearGradient
            colors={['rgba(56, 189, 248, 0.35)', 'rgba(99, 102, 241, 0.2)', 'transparent']}
            style={styles.ambientGradient}
          />
        </Animated.View>

        {/* Lottie 60fps Hardware-Accelerated Cinema Intro Layer */}
        <View style={styles.lottieContainer} pointerEvents="none">
          <LottieView
            ref={lottieRef}
            source={require('../../assets/nexplay_cinema_intro.json')}
            autoPlay
            loop={!animationCompleted}
            speed={1.0}
            style={styles.lottieAnimation}
          />
        </View>

        {/* Anamorphic Blue Light Flare Streak */}
        <Animated.View
          style={[
            styles.flareStreak,
            {
              opacity: flareOpacity,
              transform: [{ translateX: flareX }]
            }
          ]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(56, 189, 248, 0.95)', '#ffffff', 'rgba(56, 189, 248, 0.95)', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.flareGradient}
          />
        </Animated.View>

        {/* Center NexPlay Studio Typography */}
        <View style={styles.centerContainer}>
          <Animated.View
            style={[
              styles.logoWrapper,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }]
              }
            ]}
          >
            <CinematicLogo size="lg" showTagline={true} showBadge={true} glow={true} />
          </Animated.View>
        </View>

        {/* Bottom Studio Badges & Certification */}
        <Animated.View
          style={[
            styles.bottomContainer,
            {
              opacity: bottomOpacity,
              transform: [{ translateY: bottomTranslateY }]
            }
          ]}
        >
          {/* Dolby Atmos & 4K HDR Feature Pill */}
          <View style={styles.badgePill}>
            <View style={styles.badgeItem}>
              <MaterialCommunityIcons name="video-4k-box" size={scale(16)} color="#38bdf8" />
              <Text style={styles.badgeText}>4K ULTRA HD</Text>
            </View>
            <View style={styles.badgeDot} />
            <View style={styles.badgeItem}>
              <MaterialCommunityIcons name="dolby" size={scale(16)} color="#e2e8f0" />
              <Text style={styles.badgeText}>DOLBY ATMOS</Text>
            </View>
            <View style={styles.badgeDot} />
            <View style={styles.badgeItem}>
              <Ionicons name="volume-high" size={scale(14)} color="#38bdf8" />
              <Text style={styles.badgeText}>MULTI-AUDIO</Text>
            </View>
          </View>

          {/* Skip Hint */}
          <Text style={styles.skipHint}>Tap anywhere to enter</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    elevation: 99999,
    backgroundColor: '#030712',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    width: scale(380),
    height: scale(380),
    borderRadius: scale(190),
    alignSelf: 'center',
    top: '30%',
    overflow: 'hidden',
  },
  ambientGradient: {
    width: '100%',
    height: '100%',
    borderRadius: scale(190),
  },
  lottieContainer: {
    position: 'absolute',
    top: '18%',
    alignSelf: 'center',
    width: scale(360),
    height: scale(360),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  lottieAnimation: {
    width: scale(360),
    height: scale(360),
  },
  flareStreak: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.9,
    height: scale(6),
    top: '48%',
    zIndex: 2,
  },
  flareGradient: {
    width: '100%',
    height: '100%',
    borderRadius: scale(3),
  },
  centerContainer: {
    position: 'absolute',
    top: '38%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: verticalScale(40),
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: scale(20),
    zIndex: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    borderRadius: scale(24),
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    marginBottom: verticalScale(12),
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
  },
  badgeText: {
    color: '#e2e8f0',
    fontSize: moderateScale(10.5),
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  badgeDot: {
    width: scale(4),
    height: scale(4),
    borderRadius: scale(2),
    backgroundColor: 'rgba(56, 189, 248, 0.5)',
    marginHorizontal: scale(10),
  },
  skipHint: {
    color: 'rgba(148, 163, 184, 0.65)',
    fontSize: moderateScale(11),
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
