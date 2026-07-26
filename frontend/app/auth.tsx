import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { GoogleIcon, AlertCircleIcon } from '@/components/icons/SvgIcons';
import { sessionService } from '@/services/sessionService';

const logoImg = require('@/assets/images/logo.png');

import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

function resolveAuthApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL.replace(/\/api\/?$/, '');
  if (Platform.OS === 'web') return 'http://localhost:5000';

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const devMachineIp = hostUri.split(':')[0];
    return `http://${devMachineIp}:5000`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
}

const BACKEND_URL = resolveAuthApiUrl();

export default function AuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    params.error === 'email_account_exists'
      ? "This email is linked to a Google account. Please use 'Continue with Google'."
      : null
  );

  /** Save session and route based on onboarding status */
  function handleAuthSuccess(json: any) {
    if (json.user) {
      sessionService.save({
        userId: json.user.id,
        token: json.token ?? '',
        name: json.user.name ?? 'Athlete',
        email: json.user.email ?? '',
        avatar: json.user.avatar ?? 'AT',
        isOnboarded: json.isOnboarded === true,
      });
    }
    if (json.isOnboarded) {
      router.replace('/(tabs)');
    } else {
      router.replace('/onboarding');
    }
  }

  const handleSubmit = async () => {
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      const endpoint = isLogin ? 'login' : 'signup';
      const res = await fetch(`${BACKEND_URL}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || 'Athlete', password }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMsg(json.error || 'Authentication failed. Please try again.');
        return;
      }
      handleAuthSuccess(json);
    } catch {
      router.replace('/onboarding');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Backend-driven Google OAuth:
   * 1. Ask backend for the Google auth URL (with backend redirect_uri)
   * 2. Navigate browser or WebBrowser to that URL
   * 3. Google → backend callback → /auth/success?token=...&isOnboarded=...
   */
  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const redirectUrl = Linking.createURL('/auth/success');
      const returnUrl = encodeURIComponent(redirectUrl);
      const res = await fetch(`${BACKEND_URL}/api/auth/google/url?returnUrl=${returnUrl}`);
      const json = await res.json();
      const googleUrl: string = json.url;
      if (!googleUrl) {
        setErrorMsg('Could not start Google Sign-In. Please try again.');
        setLoading(false);
        return;
      }
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.href = googleUrl;
      } else {
        const result = await WebBrowser.openAuthSessionAsync(googleUrl, redirectUrl);
        if (result.type === 'success' && result.url) {
          const { queryParams } = Linking.parse(result.url);
          if (queryParams) {
            const token = queryParams.token as string;
            const name = decodeURIComponent((queryParams.name as string) || 'Athlete');
            const email = decodeURIComponent((queryParams.email as string) || '');
            const userId = parseInt(queryParams.userId as string, 10) || 1;
            const error = queryParams.error as string;
            const isOnboarded = queryParams.isOnboarded === 'true';

            if (error === 'email_account_exists') {
              setErrorMsg("This email is linked to a password account.");
            } else if (token) {
              handleAuthSuccess({
                token,
                user: { id: userId, name, email },
                isOnboarded,
              });
            }
          }
        }
        setLoading(false);
      }
    } catch {
      setErrorMsg('Network error — is the FitAI backend running?');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Brand Header */}
        <View style={styles.brandBox}>
          <Image source={logoImg} style={{ width: 180, height: 75, resizeMode: 'contain' }} />
        </View>

        {/* Auth Card */}
        <View style={styles.card}>
          {/* Tab Switcher */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              testID="tab-signin"
              style={[styles.tab, isLogin && styles.tabActive]}
              onPress={() => { setIsLogin(true); setErrorMsg(null); }}>
              <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="tab-signup"
              style={[styles.tab, !isLogin && styles.tabActive]}
              onPress={() => { setIsLogin(false); setErrorMsg(null); }}>
              <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Create Account</Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {errorMsg && (
            <View style={styles.errorBox} testID="error-banner">
              <AlertCircleIcon size={18} color={Colors.amberGold} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {!isLogin && (
            <View style={styles.inputBox}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                testID="input-name"
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor={Colors.text2}
                value={name}
                onChangeText={setName}
              />
            </View>
          )}

          <View style={styles.inputBox}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              testID="input-email"
              style={styles.input}
              placeholder="you@domain.com"
              placeholderTextColor={Colors.text2}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputBox}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              testID="input-password"
              style={styles.input}
              placeholder="••••••••••••"
              placeholderTextColor={Colors.text2}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            testID="btn-submit"
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator size="small" color="#0A0A0A" />
            ) : (
              <Text style={styles.submitBtnText}>
                {isLogin ? 'Sign In & Continue →' : 'Create Account & Continue →'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Button */}
          <TouchableOpacity
            testID="btn-google"
            style={[styles.googleBtn, loading && { opacity: 0.6 }]}
            activeOpacity={0.8}
            onPress={handleGoogleSignIn}
            disabled={loading}>
            <GoogleIcon size={20} />
            <Text style={styles.googleBtnText}>
              {loading ? 'Connecting to Google...' : 'Continue with Google'}
            </Text>
            {loading && <ActivityIndicator size="small" color={Colors.gold} />}
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            By continuing, you agree to FitAI's Terms & Privacy Policy
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: Spacing.lg, justifyContent: 'center' },
  brandBox: { alignItems: 'center', marginBottom: Spacing.xl },
  brandTitle: { fontSize: 28, fontWeight: '800', color: Colors.text, marginTop: 12 },
  brandSubtitle: { fontSize: 10, fontWeight: '800', color: Colors.gold, letterSpacing: 1.2, marginTop: 4 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.xxl,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card2,
    borderRadius: Radii.md,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radii.sm },
  tabActive: { backgroundColor: Colors.gold },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.text2 },
  tabTextActive: { color: '#0A0A0A' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.amberGold,
  },
  errorText: { flex: 1, fontSize: 12, color: Colors.text, lineHeight: 16, fontWeight: '600' },
  inputBox: { marginBottom: 14 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: Colors.text2, marginBottom: 6 },
  input: {
    backgroundColor: Colors.card2,
    borderRadius: Radii.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  submitBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: { fontSize: 14, fontWeight: '800', color: '#0A0A0A' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 10, color: Colors.text2, marginHorizontal: 10, fontWeight: '700' },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.card2,
    borderRadius: Radii.md,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  googleBtnText: { fontSize: 13, fontWeight: '700', color: Colors.text },
  footerNote: { fontSize: 10, color: Colors.text2, textAlign: 'center', marginTop: 14, opacity: 0.6 },
});
