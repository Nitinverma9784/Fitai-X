import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { groqService } from '@/services/groqService';
import { sessionService } from '@/services/sessionService';

const logoImg = require('@/assets/images/logo.png');

const { width } = Dimensions.get('window');
/** Minimum time the splash stays visible so the animation can play fully */
const MIN_SPLASH_MS = 2800;

export default function SplashScreen() {
  const router = useRouter();

  // ── Refs so callbacks don't capture stale state ──────────────────────────
  const animDone = useRef(false);
  const dataDone = useRef(false);
  const destination = useRef<string>('/auth');

  // ── Animated values ───────────────────────────────────────────────────────
  const logoScale   = useRef(new Animated.Value(0.35)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY       = useRef(new Animated.Value(28)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const barWidth     = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  const BAR_MAX = width - 80;

  /** Called when BOTH animation and data are ready */
  function tryNavigate() {
    if (!animDone.current || !dataDone.current) return;
    Animated.timing(screenOpacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      router.replace(destination.current as any);
    });
  }

  useEffect(() => {
    // ── 1. Animation sequence ────────────────────────────────────────────────
    Animated.sequence([
      Animated.delay(150),
      // Logo springs in + glow fades in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 13,
          stiffness: 110,
        }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.55, duration: 800, useNativeDriver: true }),
      ]),
      Animated.delay(100),
      // Title slides up
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 480, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 480, useNativeDriver: true }),
      ]),
      // Subtitle fades
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
    ]).start(() => {
      // Pulsing glow loop once main animation is done
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, { toValue: 0.85, duration: 950, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.35, duration: 950, useNativeDriver: true }),
        ])
      ).start();
    });

    // ── 2. Progress bar fills over MIN_SPLASH_MS ─────────────────────────────
    Animated.timing(barWidth, {
      toValue: BAR_MAX,
      duration: MIN_SPLASH_MS,
      useNativeDriver: false,
    }).start(() => {
      animDone.current = true;
      tryNavigate();
    });

    // ── 3. Session init + profile fetch ──────────────────────────────────────
    async function initSession() {
      try {
        await sessionService.init();           // load persisted session from disk
        const u = await groqService.getUserProfile();
        destination.current = (u && u.onboarding_completed) ? '/(tabs)' : '/auth';
      } catch {
        destination.current = '/auth';
      } finally {
        dataDone.current = true;
        tryNavigate();
      }
    }
    initSession();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Radial gold glow — sits behind the logo */}
      <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

      {/* Logo mark image emblem */}
      <Animated.View
        style={[
          styles.logoWrap,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}>
        <View style={styles.logoCircle}>
          <Image
            source={logoImg}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </Animated.View>

      {/* Brand text */}
      <Animated.View
        style={[
          styles.titleWrap,
          { opacity: titleOpacity, transform: [{ translateY: titleY }] },
        ]}>
        <Text style={styles.brand}>FITAI X</Text>
        <Animated.Text style={[styles.tagline, { opacity: subtitleOpacity }]}>
          INTELLIGENT HYPERTROPHY & BIO-RECOVERY
        </Animated.Text>
      </Animated.View>

      {/* Gold separator */}
      <Animated.View style={[styles.separator, { opacity: subtitleOpacity }]} />

      {/* Version badge */}
      <Animated.Text style={[styles.version, { opacity: subtitleOpacity }]}>
        FitGuru AI Engine v3 · Powered by Groq
      </Animated.Text>

      {/* Progress bar at bottom */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: barWidth }]} />
      </View>
      <Animated.Text style={[styles.progressLabel, { opacity: subtitleOpacity }]}>
        Initializing FitGuru AI Engine...
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Radial glow
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: Colors.gold,
    opacity: 0.08,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 90,
    elevation: 20,
  },
  // Logo
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: '#121212',
    borderWidth: 2,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.65,
    shadowRadius: 28,
    elevation: 16,
  },
  logoImage: {
    width: 105,
    height: 105,
  },
  // Brand
  titleWrap: {
    alignItems: 'center',
    marginTop: 32,
  },
  brand: {
    fontSize: 42,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: 8,
  },
  tagline: {
    fontSize: 9.5,
    fontWeight: '800',
    color: Colors.gold,
    letterSpacing: 1.6,
    marginTop: 10,
    textAlign: 'center',
  },
  separator: {
    width: 48,
    height: 2,
    backgroundColor: Colors.gold,
    borderRadius: 1,
    marginTop: 24,
    opacity: 0.6,
  },
  version: {
    fontSize: 10,
    color: Colors.text2,
    fontWeight: '600',
    marginTop: 12,
    letterSpacing: 0.4,
  },
  // Bottom progress
  progressTrack: {
    position: 'absolute',
    bottom: 72,
    left: 40,
    right: 40,
    height: 3,
    backgroundColor: 'rgba(245,196,0,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },
  progressLabel: {
    position: 'absolute',
    bottom: 46,
    fontSize: 10,
    color: Colors.text2,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

