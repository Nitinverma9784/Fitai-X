import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/theme';
import { sessionService } from '@/services/sessionService';

const logoImg = require('@/assets/images/logo.png');

/**
 * Handles Google OAuth redirect from backend.
 * Backend redirects to: /auth/success?token=xxx&name=xxx&email=xxx&isOnboarded=true/false&userId=xxx
 */
export default function AuthSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [message, setMessage] = useState('Completing Google Sign-In...');

  useEffect(() => {
    const token = params.token as string;
    const name = decodeURIComponent((params.name as string) || 'Athlete');
    const email = decodeURIComponent((params.email as string) || '');
    const userId = parseInt(params.userId as string, 10) || 1;
    const error = params.error as string;
    const isOnboarded = params.isOnboarded === 'true';

    if (error === 'google_cancelled') {
      router.replace('/auth');
      return;
    }
    if (error === 'email_account_exists') {
      router.replace('/auth?error=email_account_exists');
      return;
    }
    if (error) {
      router.replace('/auth');
      return;
    }

    if (token) {
      // Persist session from Google OAuth
      sessionService.save({
        userId,
        token,
        name,
        email,
        avatar: name.slice(0, 2).toUpperCase(),
        isOnboarded,
      });

      if (isOnboarded) {
        setMessage(`Welcome back, ${name}! Loading your dashboard...`);
        setTimeout(() => router.replace('/(tabs)'), 1000);
      } else {
        setMessage(`Welcome, ${name}! Let's set up your profile...`);
        setTimeout(() => router.replace('/onboarding'), 1200);
      }
    } else {
      router.replace('/auth');
    }
  }, [params]);

  return (
    <View style={styles.container}>
      <Image source={logoImg} style={{ width: 220, height: 90, resizeMode: 'contain' }} />
      <ActivityIndicator size="large" color={Colors.gold} style={{ marginTop: 24 }} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, marginTop: 8 },
  message: { fontSize: 14, color: Colors.text2, marginTop: 12, textAlign: 'center', paddingHorizontal: 32 },
});
