import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Switch,
  Platform,
} from 'react-native';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { FitGuruBot } from '@/components/FitGuruBot';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { groqService, UserProfile } from '@/services/groqService';
import { sessionService } from '@/services/sessionService';
import {
  EditIcon, StarIcon, RadioOnIcon, RadioOffIcon,
  VolumeIcon, HandIcon, WatchIcon, LogoutIcon,
} from '@/components/icons/SvgIcons';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedModel, setSelectedModel] = useState('llama-3.3-70b-versatile');
  const [voiceGuidance, setVoiceGuidance] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [syncWearable, setSyncWearable] = useState(false);

  // Reload profile every time this screen comes into focus
  // (so edits from edit-profile screen are reflected immediately)
  useFocusEffect(
    useCallback(() => {
      async function loadProfile() {
        const u = await groqService.getUserProfile();
        if (u) setUser(u);
      }
      loadProfile();
    }, [])
  );

  const handleLogout = () => {
    sessionService.clear();
    router.replace('/auth');
  };

  const bmi = user?.weight_kg && user?.height_cm
    ? (user.weight_kg / ((user.height_cm / 100) ** 2)).toFixed(1)
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.topbar}>
          <Text style={styles.title}>Profile & Settings</Text>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push('/edit-profile')}>
            <EditIcon size={18} color={Colors.text2} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.avatar || '??'}</Text>
            <View style={styles.proBadge} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name} testID="profile-name">{user?.name || '—'}</Text>
            <Text style={styles.email} testID="profile-email">{user?.email || '—'}</Text>
            <View style={styles.tierPill}>
              <StarIcon size={12} color={Colors.gold} />
              <Text style={styles.tierText}>{user?.tier || 'FITAI ATHLETE'}</Text>
            </View>
          </View>
        </View>

        {/* FitGuru AI Engine */}
        <Text style={styles.sectionLabel}>FITGURU AI ENGINE & MODEL SELECTION</Text>
        <View style={styles.card}>
          <View style={styles.clusterRow}>
            <View style={styles.clusterLeft}>
              <FitGuruBot size={36} />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.clusterTitle}>FitGuru Intelligence Cluster</Text>
                <Text style={styles.clusterSub}>Multi-Engine Load Balancing Active</Text>
              </View>
            </View>
            <View style={styles.activeBadge}>
              <Text style={styles.activeText}>ONLINE</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <Text style={styles.modelLabel}>Active Intelligence Mode:</Text>
          {[
            { id: 'llama-3.3-70b-versatile', name: 'FitGuru Hypertrophy 70B (Recommended)' },
            { id: 'mixtral-8x7b-32768', name: 'FitGuru Precision 32K Context' },
            { id: 'gemma2-9b-it', name: 'FitGuru Lightning 9B High Speed' },
          ].map(m => {
            const active = selectedModel === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.modelOption, active && styles.modelOptionActive]}
                onPress={() => setSelectedModel(m.id)}>
                {active
                  ? <RadioOnIcon size={18} color={Colors.gold} />
                  : <RadioOffIcon size={18} color={Colors.text2} />}
                <Text style={[styles.modelText, active && styles.modelTextActive]}>{m.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Body Metrics */}
        <Text style={styles.sectionLabel}>BODY METRICS & GOALS</Text>
        <View style={styles.card}>
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal} testID="metric-weight">
                {user?.weight_kg ?? '--'}<Text style={styles.smallUnit}> kg</Text>
              </Text>
              <Text style={styles.metricSub}>Weight</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal} testID="metric-height">
                {user?.height_cm ?? '--'}<Text style={styles.smallUnit}> cm</Text>
              </Text>
              <Text style={styles.metricSub}>Height</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal} testID="metric-age">{user?.age ?? '--'}</Text>
              <Text style={styles.metricSub}>Age</Text>
            </View>
            {bmi && (
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{bmi}</Text>
                <Text style={styles.metricSub}>BMI</Text>
              </View>
            )}
          </View>
          {user?.goal && (
            <View style={styles.goalPill}>
              <Text style={styles.goalPillText}>🎯 {user.goal}</Text>
            </View>
          )}
          {user?.equipment && (
            <View style={[styles.goalPill, { marginTop: 6 }]}>
              <Text style={styles.goalPillText}>🏋️ {user.equipment}</Text>
            </View>
          )}
          {user?.diet_pref && (
            <View style={[styles.goalPill, { marginTop: 6 }]}>
              <Text style={styles.goalPillText}>🥗 {user.diet_pref}</Text>
            </View>
          )}
          {user?.time_commitment && (
            <View style={[styles.goalPill, { marginTop: 6 }]}>
              <Text style={styles.goalPillText}>⏱ {user.time_commitment} sessions</Text>
            </View>
          )}
          {user?.injuries && user.injuries.length > 0 && !user.injuries.includes('None') && (
            <View style={[styles.goalPill, { marginTop: 6 }]}>
              <Text style={styles.goalPillText}>⚠️ Injuries: {user.injuries.join(', ')}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.editProfileRow}
            onPress={() => router.push('/edit-profile')}
            activeOpacity={0.75}>
            <EditIcon size={16} color={Colors.gold} />
            <Text style={styles.editProfileText}>Edit Fitness Profile & Goals</Text>
            <Text style={styles.editProfileArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <Text style={styles.sectionLabel}>PREFERENCES & HARDWARE</Text>
        <View style={styles.cardList}>
          <View style={styles.listRow}>
            <VolumeIcon size={20} color={Colors.text2} />
            <Text style={styles.rowLabel}>FitGuru Voice Guidance</Text>
            <Switch
              value={voiceGuidance}
              onValueChange={setVoiceGuidance}
              trackColor={{ false: Colors.card2, true: Colors.gold }}
              thumbColor="#FFF"
            />
          </View>
          <View style={styles.listRow}>
            <HandIcon size={20} color={Colors.text2} />
            <Text style={styles.rowLabel}>Haptic Set Reminders</Text>
            <Switch
              value={haptics}
              onValueChange={setHaptics}
              trackColor={{ false: Colors.card2, true: Colors.gold }}
              thumbColor="#FFF"
            />
          </View>
          <View style={styles.listRow}>
            <WatchIcon size={20} color={Colors.text2} />
            <Text style={styles.rowLabel}>Sync Apple Health / Garmin</Text>
            <Switch
              value={syncWearable}
              onValueChange={setSyncWearable}
              trackColor={{ false: Colors.card2, true: Colors.gold }}
              thumbColor="#FFF"
            />
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.8}
          testID="btn-logout"
          onPress={handleLogout}>
          <LogoutIcon size={18} color={Colors.red} />
          <Text style={styles.logoutText}>Log Out Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  container: { flex: 1, paddingHorizontal: Spacing.lg },
  contentContainer: { paddingBottom: 100 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: Spacing.md },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: Colors.card, borderRadius: Radii.xxl, padding: 18, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#0A0A0A' },
  proBadge: { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.green, borderWidth: 2, borderColor: Colors.card },
  profileInfo: { flex: 1 },
  name: { fontSize: 18, fontWeight: '800', color: Colors.text },
  email: { fontSize: 12, color: Colors.text2, marginTop: 2 },
  tierPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245, 196, 0, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full, marginTop: 6 },
  tierText: { fontSize: 9.5, fontWeight: '800', color: Colors.gold },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: Colors.text2, letterSpacing: 0.8, marginBottom: 8, marginTop: 8 },
  card: { backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 16, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  clusterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clusterLeft: { flexDirection: 'row', alignItems: 'center' },
  clusterTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  clusterSub: { fontSize: 11, color: Colors.text2, marginTop: 2 },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radii.full, backgroundColor: 'rgba(163, 230, 53, 0.15)' },
  activeText: { fontSize: 10, fontWeight: '800', color: Colors.green },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 14 },
  modelLabel: { fontSize: 12, fontWeight: '700', color: Colors.text2, marginBottom: 10 },
  modelOption: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 10, borderRadius: Radii.sm, marginBottom: 4 },
  modelOptionActive: { backgroundColor: Colors.card2 },
  modelText: { fontSize: 12.5, color: Colors.text2 },
  modelTextActive: { color: Colors.text, fontWeight: '700' },
  metricRow: { flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', gap: 8 },
  metricItem: { alignItems: 'center', minWidth: 60 },
  metricVal: { fontSize: 18, fontWeight: '800', color: Colors.text },
  smallUnit: { fontSize: 12, color: Colors.text2 },
  metricSub: { fontSize: 11, color: Colors.text2, marginTop: 2 },
  goalPill: { marginTop: 12, backgroundColor: Colors.card2, borderRadius: Radii.md, paddingHorizontal: 12, paddingVertical: 8 },
  goalPillText: { fontSize: 12, fontWeight: '600', color: Colors.text },
  editProfileRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, backgroundColor: 'rgba(245,196,0,0.07)', borderRadius: Radii.md, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: Colors.borderLight },
  editProfileText: { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.gold },
  editProfileArrow: { fontSize: 20, color: Colors.gold, fontWeight: '300' },
  cardList: { backgroundColor: Colors.card, borderRadius: Radii.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  listRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.text, marginLeft: 12 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', borderRadius: Radii.md, paddingVertical: 14, marginTop: 8 },
  logoutText: { fontSize: 14, fontWeight: '700', color: Colors.red },
});
