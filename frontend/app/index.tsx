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
/** Minimum splash screen display time for smooth animation */
const MIN_SPLASH_MS = 2500;

export default function SplashScreen() {
  const router = useRouter();

  const animDone = useRef(false);
  const dataDone = useRef(false);
  const destination = useRef<string>('/auth');

  // Animated values
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const barWidth = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  const BAR_MAX = 128; // 32 * 4 matching w-32 in splashscreen.html

  function tryNavigate() {
    if (!animDone.current || !dataDone.current) return;
    Animated.timing(screenOpacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      router.replace(destination.current as any);
    });
  }

  useEffect(() => {
    // 1. Entrance animation sequence matching splashscreen.html
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        damping: 15,
        stiffness: 100,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(tagOpacity, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Progress bar fills over MIN_SPLASH_MS
    Animated.timing(barWidth, {
      toValue: BAR_MAX,
      duration: MIN_SPLASH_MS,
      useNativeDriver: false,
    }).start(() => {
      animDone.current = true;
      tryNavigate();
    });

    // 3. Session initialization & backend connection
    async function initSession() {
      try {
        await sessionService.init();
        if (!sessionService.isLoggedIn()) {
          destination.current = '/auth';
        } else {
          const u = await groqService.getUserProfile();
          const localSession = sessionService.get();
          const onboardVal = u ? (u.onboarding_completed as any) : undefined;
          const isDbOnboarded = u
            ? (onboardVal === true || onboardVal === 't' || onboardVal === 'true' || onboardVal === 1 || onboardVal === '1')
            : false;
          const isLocalOnboarded = Boolean(localSession?.isOnboarded);

          const isUserOnboarded = isDbOnboarded || isLocalOnboarded;

          // Keep local storage & DB in sync so user isn't re-prompted
          if (isUserOnboarded) {
            if (localSession && !localSession.isOnboarded) {
              sessionService.markOnboarded();
            }
            if (u && !isDbOnboarded) {
              groqService.updateProfile({ onboarding_completed: true }).catch(() => {});
            }
          }

          destination.current = isUserOnboarded ? '/(tabs)' : '/onboarding';
        }
      } catch {
        // If network request failed but session exists, stay logged in
        if (sessionService.isLoggedIn()) {
          destination.current = sessionService.get()?.isOnboarded ? '/(tabs)' : '/onboarding';
        } else {
          destination.current = '/auth';
        }
      } finally {
        dataDone.current = true;
        tryNavigate();
      }
    }
    initSession();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Main Logo & Tagline Content */}
      <Animated.View
        style={[
          styles.contentWrap,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}>
        <Image
          source={logoImg}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
          TRAIN. RECOVER. CONQUER.
        </Animated.Text>
      </Animated.View>

      {/* Bottom Loading Progress Bar */}
      <View style={styles.bottomWrap}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: barWidth }]} />
        </View>
        <Text style={styles.loadingLabel}>LOADING...</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  contentWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoImage: {
    width: 256,
    height: 120,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text2,
    letterSpacing: 2.5,
    marginTop: 12,
    textAlign: 'center',
  },
  bottomWrap: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
    gap: 16,
  },
  progressTrack: {
    width: 128,
    height: 3,
    backgroundColor: '#101010',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },
  loadingLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.text2,
    letterSpacing: 2,
  },
});
