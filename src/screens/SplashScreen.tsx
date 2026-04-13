import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const SplashScreen: React.FC = () => {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(12)).current;
  const loaderWidth = useRef(new Animated.Value(0)).current;
  const shimmerX = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    // Logo fades + scales in smoothly
    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Tagline fades + slides up
    Animated.sequence([
      Animated.delay(900),
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Loader bar fills over 2.6s
    Animated.sequence([
      Animated.delay(500),
      Animated.timing(loaderWidth, {
        toValue: 1,
        duration: 2600,
        useNativeDriver: false,
      }),
    ]).start();

    // Shimmer loop on loader
    Animated.loop(
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(shimmerX, {
          toValue: 2,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerX, {
          toValue: -1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const loaderInterpolated = loaderWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <LinearGradient
      colors={['#0C0520', '#130830', '#0A0220']}
      locations={[0, 0.55, 1]}
      style={styles.container}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Subtle radial glow behind logo — no border, just soft color */}
      <View style={styles.glowCenter} pointerEvents="none" />

      {/* Top-left ambient blob */}
      <View style={styles.blobTopLeft} pointerEvents="none" />

      {/* Bottom-right ambient blob */}
      <View style={styles.blobBottomRight} pointerEvents="none" />

      {/* Very faint grid lines */}
      <View style={styles.gridOverlay} pointerEvents="none">
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`h-${i}`} style={[styles.gridLineH, { top: 100 + i * 110 }]} />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={`v-${i}`} style={[styles.gridLineV, { left: 60 + i * 80 }]} />
        ))}
      </View>

      {/* ── Center content ── */}
      <View style={styles.centerBlock}>

        {/* Logo */}
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require('../../assets/images/verifiit_logo_new.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Tagline */}
        <Animated.Text
          style={[
            styles.tagline,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineTranslateY }],
            },
          ]}
        >
          Secure. Verify. Trust.
        </Animated.Text>

        {/* Sub-caption */}
        <Animated.Text
          style={[
            styles.subCaption,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineTranslateY }],
            },
          ]}
        >
          Employee Background Verification
        </Animated.Text>
      </View>

      {/* ── Loader bar at bottom ── */}
      <View style={styles.loaderTrack}>
        <Animated.View style={[styles.loaderFill, { width: loaderInterpolated }]}>
          {/* Shimmer streak */}
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [
                  {
                    translateX: shimmerX.interpolate({
                      inputRange: [-1, 2],
                      outputRange: [-40, 140],
                    }),
                  },
                ],
              },
            ]}
          />
        </Animated.View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Ambient background elements — no borders, pure opacity fills
  glowCenter: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#6B1FCC',
    opacity: 0.12,
    top: height * 0.5 - 160,
    left: width * 0.5 - 160,
  },
  blobTopLeft: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#8B1FD4',
    opacity: 0.09,
    top: -80,
    left: -80,
  },
  blobBottomRight: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#6BBF20',
    opacity: 0.07,
    bottom: -60,
    right: -60,
  },

  // Grid
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#9B50FF',
    opacity: 0.06,
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#9B50FF',
    opacity: 0.06,
  },

  // Center
  centerBlock: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoImage: {
    width: width * 0.62,
    height: 80,
  },

  // Text
  tagline: {
    color: '#D4A0FF',
    fontSize: 15,
    fontFamily: 'Rubik-Regular',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  subCaption: {
    color: '#6A4490',
    fontSize: 12,
    fontFamily: 'Rubik-Regular',
    letterSpacing: 0.8,
    textAlign: 'center',
  },

  // Loader
  loaderTrack: {
    position: 'absolute',
    bottom: 52,
    width: width * 0.38,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(155, 80, 255, 0.15)',
    overflow: 'hidden',
  },
  loaderFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#9B30FF',
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 30,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 2,
    transform: [{ skewX: '-20deg' }],
  },
});

export default SplashScreen;