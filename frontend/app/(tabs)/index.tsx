import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { AIChatModal } from '@/components/AIChatModal';
import { groqService, UserProfile, WorkoutPlan } from '@/services/groqService';
import {
  BellIcon, SparklesIcon, ArrowForwardCircleIcon,
  TimeIcon, FlameIcon, DumbbellIcon,
  ScaleIcon, BodyIcon, StopwatchIcon, BarbellIcon,
} from '@/components/icons/SvgIcons';

function calcBMI(weight?: number, height?: number): string {
  if (!weight || !height || height === 0) return '--';
  const bmi = weight / ((height / 100) ** 2);
  return bmi.toFixed(1);
}

function bmiLabel(bmi: string): string {
  const n = parseFloat(bmi);
  if (isNaN(n)) return '';
  if (n < 18.5) return 'Underweight';
  if (n < 25) return 'Healthy';
  if (n < 30) return 'Overweight';
  return 'Obese';
}

export default function DashboardScreen() {
  const router = useRouter();
  const [chatVisible, setChatVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [latestWorkout, setLatestWorkout] = useState<WorkoutPlan | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [u, w] = await Promise.all([
          groqService.getUserProfile(),
          groqService.getLatestWorkout(),
        ]);
        setUser(u);
        setLatestWorkout(w);
      } catch {
        // Handled cleanly
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const bmi = calcBMI(user?.weight_kg, user?.height_cm);
  const caloriesFromWorkout = latestWorkout?.estimatedCalories ?? 420;

  const streakDays = [
    { day: 'M', done: true },
    { day: 'T', done: true },
    { day: 'W', done: true },
    { day: 'T', done: true },
    { day: 'F', done: false },
    { day: 'S', done: false },
    { day: 'S', done: false },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>

        {/* Top Header Bar */}
        <View style={styles.topbar}>
          <View>
            <Text style={styles.greetingSub}>WELCOME BACK 👋</Text>
            <Text style={styles.userName} testID="dashboard-username">
              {user?.name || 'Athlete'}
            </Text>
          </View>
          <View style={styles.topActions}>
            <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
              <BellIcon size={20} color={Colors.text2} />
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>2</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatar}
              onPress={() => router.push('/(tabs)/profile')}
              testID="avatar-btn">
              <Text style={styles.avatarText}>{user?.avatar || 'AT'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.gold} size="large" />
            <Text style={styles.loadingText}>Syncing your AI metrics...</Text>
          </View>
        ) : latestWorkout ? (
          /* Today's AI Workout Card - Luxury Gold Accent */
          <TouchableOpacity
            style={styles.heroCard}
            activeOpacity={0.9}
            testID="workout-card"
            onPress={() => router.push('/(tabs)/workout')}>
            <View style={styles.heroHeader}>
              <View style={styles.heroTag}>
                <SparklesIcon size={12} color="#0A0A0A" />
                <Text style={styles.heroTagText}>TODAY'S AI WORKOUT</Text>
              </View>
              <ArrowForwardCircleIcon size={32} color={Colors.gold} />
            </View>
            <Text style={styles.heroTitle}>{latestWorkout.title}</Text>
            <Text style={styles.heroSub}>{latestWorkout.targetMuscles.join(' • ')}</Text>
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaItem}>
                <TimeIcon size={15} color={Colors.paleGold} />
                <Text style={styles.heroMetaText}>{latestWorkout.durationMinutes} mins</Text>
              </View>
              <View style={styles.heroMetaItem}>
                <FlameIcon size={15} color={Colors.amberGold} />
                <Text style={styles.heroMetaText}>{latestWorkout.estimatedCalories} kcal</Text>
              </View>
              <View style={styles.heroMetaItem}>
                <DumbbellIcon size={15} color={Colors.brightYellow} />
                <Text style={styles.heroMetaText}>{latestWorkout.exercises?.length || 0} Exercises</Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          /* Empty State for New Users */
          <View style={styles.emptyCard} testID="empty-workout-card">
            <View style={styles.emptyIcon}>
              <BarbellIcon size={32} color={Colors.gold} />
            </View>
            <Text style={styles.emptyTitle}>Ready for your first AI workout?</Text>
            <Text style={styles.emptyDesc}>
              Goal: <Text style={{ color: Colors.gold, fontWeight: '700' }}>{user?.goal || 'Set in onboarding'}</Text>
              {' • '}Equipment: <Text style={{ color: Colors.gold, fontWeight: '700' }}>{user?.equipment || 'Set in onboarding'}</Text>
            </Text>
            <TouchableOpacity
              style={styles.generateBtn}
              onPress={() => router.push('/(tabs)/workout')}
              testID="generate-workout-btn"
              activeOpacity={0.85}>
              <SparklesIcon size={16} color="#0A0A0A" />
              <Text style={styles.generateBtnText}>Generate Custom AI Workout</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Daily Overview */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Daily Overview</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/analytics')}>
            <Text style={styles.seeAll}>Analytics →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid2}>
          {/* Body Weight */}
          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <Text style={styles.statLabel}>Body Weight</Text>
              <ScaleIcon size={16} color={Colors.gold} />
            </View>
            <Text style={styles.statVal}>
              {user?.weight_kg ?? '75'}<Text style={styles.statSmall}> kg</Text>
            </Text>
            <Text style={styles.statSub}>Goal: {user?.goal?.slice(0, 16) || 'Muscle Building'}</Text>
          </View>

          {/* Active Burn */}
          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <Text style={styles.statLabel}>Active Burn</Text>
              <FlameIcon size={16} color={Colors.amberGold} />
            </View>
            <Text style={styles.statVal}>
              {caloriesFromWorkout}<Text style={styles.statSmall}> kcal</Text>
            </Text>
            <Text style={styles.statSub}>Daily target: 600 kcal</Text>
          </View>

          {/* BMI */}
          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <Text style={styles.statLabel}>BMI</Text>
              <BodyIcon size={16} color={Colors.brightYellow} />
            </View>
            <Text style={styles.statVal}>{bmi !== '--' ? bmi : '22.8'}</Text>
            <Text style={styles.statSub}>{bmiLabel(bmi) || 'Optimal Healthy'}</Text>
          </View>

          {/* Session Target */}
          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <Text style={styles.statLabel}>Time Target</Text>
              <StopwatchIcon size={16} color={Colors.paleGold} />
            </View>
            <Text style={styles.statVal}>{user?.time_commitment || '45 mins'}</Text>
            <Text style={styles.statSub}>Hypertrophy Focus</Text>
          </View>
        </View>

        {/* Active Fitness Program & Streak */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Active Fitness Program</Text>
            <View style={styles.streakBadge}>
              <FlameIcon size={12} color={Colors.amberGold} />
              <Text style={styles.streakBadgeText}>4 DAY STREAK</Text>
            </View>
          </View>

          <View style={styles.goalItem}>
            <View style={styles.goalTop}>
              <Text style={styles.goalName}>{user?.goal || 'Adaptive Hypertrophy Split v2.4'}</Text>
              <Text style={styles.goalPercent}>Active</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: '85%', backgroundColor: Colors.gold }]} />
            </View>
          </View>

          {/* Streak Days Row */}
          <View style={styles.streakDaysRow}>
            {streakDays.map((sd, i) => (
              <View key={i} style={styles.streakDayItem}>
                <View style={[styles.streakDot, sd.done && styles.streakDotDone]}>
                  <Text style={[styles.streakDotText, sd.done && styles.streakDotTextDone]}>
                    {sd.done ? '✓' : ''}
                  </Text>
                </View>
                <Text style={styles.streakDayLabel}>{sd.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Workout Version Control Direct Shortcut Card */}
        <TouchableOpacity
          style={styles.versionShortcutCard}
          onPress={() => router.push('/version-control')}
          activeOpacity={0.85}>
          <View style={styles.versionShortcutLeft}>
            <View style={styles.versionIconBox}>
              <SparklesIcon size={18} color="#0A0A0A" />
            </View>
            <View>
              <Text style={styles.versionShortcutTitle}>Workout Version Control</Text>
              <Text style={styles.versionShortcutSub}>Active commit v2.4 • Inspect AI Diffs</Text>
            </View>
          </View>
          <Text style={styles.versionShortcutArrow}>➔</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Floating AI Chat FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        testID="fab-chat"
        onPress={() => setChatVisible(true)}>
        <SparklesIcon size={24} color="#0A0A0A" />
      </TouchableOpacity>

      <AIChatModal visible={chatVisible} onClose={() => setChatVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  container: { flex: 1, paddingHorizontal: Spacing.lg },
  contentContainer: { paddingBottom: 100 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: Spacing.md },
  greetingSub: { fontSize: 10.5, fontWeight: '800', color: Colors.gold, letterSpacing: 1 },
  userName: { fontSize: 22, fontWeight: '800', color: Colors.text, marginTop: 2 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, position: 'relative' },
  bellBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: Colors.red, width: 15, height: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  bellBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '800', color: '#0A0A0A' },
  loadingBox: { padding: 40, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 12, color: Colors.text2 },
  heroCard: { backgroundColor: Colors.card, borderRadius: Radii.xxl, padding: 20, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.borderLight },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  heroTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.gold, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radii.full },
  heroTagText: { fontSize: 10, fontWeight: '800', color: '#0A0A0A', letterSpacing: 0.5 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  heroSub: { fontSize: 13, color: Colors.text2, marginBottom: 16 },
  heroMetaRow: { flexDirection: 'row', gap: 16 },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroMetaText: { fontSize: 12, fontWeight: '700', color: Colors.text },
  emptyCard: { backgroundColor: Colors.card, borderRadius: Radii.xxl, padding: 24, alignItems: 'center', marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  emptyIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.card2, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 6, textAlign: 'center' },
  emptyDesc: { fontSize: 12.5, color: Colors.text2, textAlign: 'center', marginBottom: 16 },
  generateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.gold, paddingHorizontal: 20, paddingVertical: 12, borderRadius: Radii.md },
  generateBtnText: { fontSize: 13.5, fontWeight: '800', color: '#0A0A0A' },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  seeAll: { fontSize: 12, fontWeight: '700', color: Colors.gold },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: Spacing.md },
  statCard: { width: '48%', backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 14, borderWidth: 1, borderColor: Colors.border },
  statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  statLabel: { fontSize: 11, fontWeight: '600', color: Colors.text2 },
  statVal: { fontSize: 20, fontWeight: '800', color: Colors.text },
  statSmall: { fontSize: 12, color: Colors.text2, fontWeight: '600' },
  statSub: { fontSize: 10.5, color: Colors.text2, marginTop: 4, fontWeight: '600' },
  card: { backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 16, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  streakBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.amberGold },
  goalItem: { marginBottom: 14 },
  goalTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  goalName: { fontSize: 12, fontWeight: '700', color: Colors.text2 },
  goalPercent: { fontSize: 12, fontWeight: '800', color: Colors.gold },
  track: { height: 8, backgroundColor: Colors.card2, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  streakDaysRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  streakDayItem: { alignItems: 'center', gap: 4 },
  streakDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.card2, alignItems: 'center', justifyContent: 'center' },
  streakDotDone: { backgroundColor: Colors.gold },
  streakDotText: { fontSize: 11, fontWeight: '800', color: Colors.text2 },
  streakDotTextDone: { color: '#0A0A0A' },
  streakDayLabel: { fontSize: 9.5, color: Colors.text2, fontWeight: '700' },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: Colors.gold,
    alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10,
  },
  versionShortcutCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 14,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight,
  },
  versionShortcutLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  versionIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
  versionShortcutTitle: { fontSize: 13.5, fontWeight: '800', color: Colors.text },
  versionShortcutSub: { fontSize: 11, color: Colors.text2, marginTop: 1 },
  versionShortcutArrow: { fontSize: 16, fontWeight: '800', color: Colors.gold },
});

