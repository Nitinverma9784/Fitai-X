import React, { useEffect, useState, useCallback } from 'react';
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
  Image,
} from 'react-native';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useRouter, useFocusEffect } from 'expo-router';

import { groqService, UserProfile, WorkoutPlan, UserStatsResponse, NutritionPlan, RecoveryLog } from '@/services/groqService';
import { workoutService, TodayState } from '@/services/workoutService';
import {
  BellIcon, SparklesIcon, ArrowForwardCircleIcon,
  TimeIcon, FlameIcon, DumbbellIcon,
  ScaleIcon, BodyIcon, StopwatchIcon, BarbellIcon,
} from '@/components/icons/SvgIcons';
import { QuickAccessCards } from '@/components/QuickAccessCards';
import { MorningCheckinModal } from '@/components/MorningCheckinModal';
import { CalendarComponent } from '@/components/CalendarComponent';
import { DailySummaryModal, DailySummaryData } from '@/components/DailySummaryModal';
import { WelcomeBackModal } from '@/components/WelcomeBackModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const [tourVisible, setTourVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [latestWorkout, setLatestWorkout] = useState<WorkoutPlan | null>(null);
  const [statsData, setStatsData] = useState<UserStatsResponse | null>(null);
  const [todayState, setTodayState] = useState<TodayState | null>(null);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  const [latestRecovery, setLatestRecovery] = useState<RecoveryLog | null>(null);
  const [recoveryHistory, setRecoveryHistory] = useState<RecoveryLog[]>([]);

  const [checkinVisible, setCheckinVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [summaryData, setSummaryData] = useState<DailySummaryData | null>(null);
  const [welcomeModalVisible, setWelcomeModalVisible] = useState(false);
  const welcomeShownRef = React.useRef(false);

  // Build loggedDates set from workout streak + recovery history (all days, not just today)
  const loggedDatesSet = new Set<string>();
  (todayState?.streak || []).forEach(s => {
    if (s.status === 'completed') loggedDatesSet.add(s.date);
  });
  // Mark ALL days that have a recovery log
  recoveryHistory.forEach(r => {
    const rDate = typeof r.log_date === 'string' ? r.log_date.split('T')[0] : '';
    if (rDate) loggedDatesSet.add(rDate);
  });
  const todayStr = new Date().toISOString().split('T')[0];
  const hasWorkoutToday = todayState?.workout?.status === 'completed';
  const mealsToday = nutritionPlan?.todayLogs || [];
  const hasMealsToday = mealsToday.length > 0;
  const rawRecDate = latestRecovery?.log_date || latestRecovery?.created_at;
  const recoveryLogDate = typeof rawRecDate === 'string'
    ? rawRecDate.split('T')[0]
    : (rawRecDate ? new Date(rawRecDate).toISOString().split('T')[0] : '');
  const hasRecoveryToday = !!latestRecovery && recoveryLogDate === todayStr;

  if (hasWorkoutToday || hasMealsToday || hasRecoveryToday) {
    loggedDatesSet.add(todayStr);
  }

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    const isLogged = loggedDatesSet.has(dateStr);

    if (isLogged) {
      const isToday = dateStr === todayStr;
      const todayMeals = isToday ? mealsToday : [];
      const hasMeals = todayMeals.length > 0;
      const hasWorkout = isToday ? hasWorkoutToday : true;
      // Find recovery log for this specific date
      const dayRecovery = recoveryHistory.find(r => {
        const rDate = typeof r.log_date === 'string' ? r.log_date.split('T')[0] : '';
        return rDate === dateStr;
      }) || (isToday && hasRecoveryToday ? latestRecovery : null);
      const hasRecovery = !!dayRecovery;

      let totalProtein = 0;
      let totalCals = 0;
      todayMeals.forEach((m: any) => {
        totalProtein += parseFloat(m.protein_g) || 0;
        totalCals += parseFloat(m.calories) || 0;
      });

      const recPct = dayRecovery?.readiness_percentage;
      const recHrv = dayRecovery?.hrv_ms;
      const recSleep = dayRecovery ? parseFloat(String(dayRecovery.sleep_hours)) : undefined;
      const recHydration = dayRecovery ? parseFloat(String(dayRecovery.hydration_l)) : undefined;
      const recSoreness = dayRecovery?.muscle_soreness;
      const recEff = dayRecovery?.sleep_efficiency;
      const recLabel = dayRecovery?.status_label || '';
      const recDesc = dayRecovery?.description || '';

      setSummaryData({
        dateStr,
        hasData: true,
        hasWorkout,
        hasMeals,
        hasRecoveryMetrics: hasRecovery,
        workoutTitle: latestWorkout ? latestWorkout.title : 'Workout Session Completed',
        durationMinutes: latestWorkout ? latestWorkout.durationMinutes : 45,
        calories: latestWorkout ? latestWorkout.estimatedCalories : 380,
        exercises: (latestWorkout?.exercises || []).map(e => ({ name: e.name, sets: e.sets, reps: e.reps })),
        mealsLoggedCount: todayMeals.length,
        totalProteinLogged: Math.round(totalProtein),
        totalCaloriesLogged: Math.round(totalCals),
        sleepHours: recSleep,
        sleepEfficiency: recEff,
        hrvMs: recHrv,
        hydrationL: recHydration,
        soreness: recSoreness,
        readinessPercentage: recPct,
        aiSummary: hasRecovery
          ? `${recLabel ? recLabel + '. ' : ''}${recDesc || `Readiness: ${recPct}%. HRV ${recHrv}ms · Sleep ${recSleep?.toFixed(1)}h @ ${recEff}% efficiency · Hydration ${recHydration}L · Soreness: ${recSoreness}.`}`
          : `On ${dateStr}, your logged activities (${hasWorkout ? 'workout' : ''}${hasWorkout && hasMeals ? ' & ' : ''}${hasMeals ? `${todayMeals.length} meal(s)` : ''}) were recorded successfully.`,
      });
    } else {
      setSummaryData({
        dateStr,
        hasData: false,
      });
    }
    setSummaryModalVisible(true);
  };

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [u, w, stats, today, nut, rec, recHistory] = await Promise.all([
        groqService.getUserProfile(),
        groqService.getLatestWorkout(),
        groqService.getUserStats(),
        workoutService.getToday(),
        groqService.getNutritionPlan(),
        groqService.getLatestRecovery(),
        groqService.getRecoveryHistory(30),
      ]);
      setUser(u);
      setLatestWorkout(w);
      setStatsData(stats);
      setTodayState(today);
      setNutritionPlan(nut);
      setLatestRecovery(rec);
      setRecoveryHistory(recHistory || []);
    } catch {
      // Clean error handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    async function checkDailyWelcome() {
      if (!loading && user && !welcomeShownRef.current) {
        welcomeShownRef.current = true;
        const todayStr = new Date().toISOString().split('T')[0];
        let lastShown: string | null = null;
        try {
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            lastShown = window.localStorage.getItem('fitai_last_welcome_date');
          } else {
            lastShown = await AsyncStorage.getItem('fitai_last_welcome_date');
          }
        } catch {}

        if (lastShown !== todayStr) {
          setWelcomeModalVisible(true);
          try {
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
              window.localStorage.setItem('fitai_last_welcome_date', todayStr);
            } else {
              await AsyncStorage.setItem('fitai_last_welcome_date', todayStr);
            }
          } catch {}
        }
      }
    }
    checkDailyWelcome();
  }, [loading, user]);

  // Re-fetch dashboard data whenever screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  const bmi = calcBMI(user?.weight_kg, user?.height_cm);
  const caloriesFromWorkout = latestWorkout?.estimatedCalories ?? 420;

  const currentStreak = statsData?.stats?.currentStreak ?? 0;

  const rawStreak = todayState?.streak || [];
  const streakDays = rawStreak.length > 0
    ? rawStreak.slice(-7).map(s => {
        const d = new Date(s.date + 'T00:00:00');
        const daysMap = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        const dayLetter = isNaN(d.getTime()) ? 'D' : daysMap[d.getDay()];
        return { day: dayLetter, done: s.status === 'completed' };
      })
    : [
        { day: 'M', done: false },
        { day: 'T', done: false },
        { day: 'W', done: false },
        { day: 'T', done: false },
        { day: 'F', done: false },
        { day: 'S', done: false },
        { day: 'S', done: false },
      ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <MorningCheckinModal
        visible={checkinVisible}
        userName={user?.name}
        initialMetrics={latestRecovery ? {
          sleepHours: parseFloat(String(latestRecovery.sleep_hours)) || 7.5,
          hrvMs: latestRecovery.hrv_ms || 65,
          muscleSoreness: latestRecovery.muscle_soreness || 'Low',
          hydrationL: parseFloat(String(latestRecovery.hydration_l)) || 2.5,
        } : undefined}
        onClose={() => setCheckinVisible(false)}
        onSuccess={() => loadDashboardData()}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>

        {/* Top Header Bar */}
        <View style={styles.topbar}>
          <View>
            <Text style={styles.greetingSub}>WELCOME BACK 👋</Text>
            <Text style={styles.userName} testID="dashboard-username">
              {user?.name || (user?.email ? user.email.split('@')[0] : 'FitAI Member')}
            </Text>
          </View>
          <View style={styles.topActions}>
            <TouchableOpacity
              style={styles.avatar}
              onPress={() => router.push('/(tabs)/profile')}
              testID="avatar-btn">
              {user?.avatar && (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) ? (
                <Image source={{ uri: user.avatar }} style={{ width: 36, height: 36, borderRadius: 18 }} />
              ) : (
                <Text style={styles.avatarText}>
                  {user?.avatar && user.avatar.length <= 3 ? user.avatar : (user?.name || 'FA').slice(0, 2).toUpperCase()}
                </Text>
              )}
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
            <Text style={styles.emptyTitle}>No Active Workout Plan</Text>
            <Text style={styles.emptySub}>Generate your first AI-customized hypertrophy session.</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/(tabs)/workout')}>
              <Text style={styles.emptyBtnText}>Generate Plan Now ➔</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Dynamic Key Performance Metrics Row */}
        <View style={styles.statsRow}>
          {/* Active Calories Burned */}
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
            <Text style={styles.statVal}>{bmi}</Text>
            <Text style={styles.statSub}>{bmiLabel(bmi) || 'Needs profile info'}</Text>
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
              <Text style={styles.streakBadgeText}>{currentStreak} DAY STREAK</Text>
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

        {/* Quick Access — Analytics & Nutrition shortcuts */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
        </View>
        <QuickAccessCards />

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

      <WelcomeBackModal
        visible={welcomeModalVisible}
        userName={user?.name || 'Athlete'}
        level={user?.level || 1}
        streakCount={statsData?.stats?.currentStreak ?? (statsData as any)?.streakDays ?? 0}
        readinessScore={hasRecoveryToday ? latestRecovery?.readiness_percentage : undefined}
        onClose={() => setWelcomeModalVisible(false)}
        onStartWorkout={() => router.push('/(tabs)/workout')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg, paddingTop: (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0) },
  container: { flex: 1, paddingHorizontal: Spacing.lg },
  contentContainer: { paddingBottom: 100 },

  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: Spacing.md },
  greetingSub: { fontSize: 10.5, fontWeight: '800', color: Colors.gold, letterSpacing: 1 },
  userName: { fontSize: 22, fontWeight: '800', color: Colors.text, marginTop: 2 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.card2, borderWidth: 1, borderColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '800', color: Colors.gold },

  loadingBox: { padding: 40, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 12, color: Colors.text2 },

  heroCard: { backgroundColor: Colors.card, borderRadius: Radii.xxl, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: Colors.borderLight },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  heroTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.gold, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radii.full },
  heroTagText: { fontSize: 10, fontWeight: '900', color: '#0A0A0A', letterSpacing: 0.8 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  heroSub: { fontSize: 12, color: Colors.text2, fontWeight: '600', marginBottom: 14 },
  heroMetaRow: { flexDirection: 'row', gap: 16 },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroMetaText: { fontSize: 11.5, fontWeight: '700', color: Colors.text2 },

  emptyCard: { backgroundColor: Colors.card, borderRadius: Radii.xxl, padding: 24, marginBottom: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.card2, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  emptySub: { fontSize: 12, color: Colors.text2, textAlign: 'center', marginBottom: 16 },
  emptyBtn: { backgroundColor: Colors.gold, paddingHorizontal: 18, paddingVertical: 10, borderRadius: Radii.md },
  emptyBtnText: { fontSize: 12, fontWeight: '800', color: '#0A0A0A' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 12, borderWidth: 1, borderColor: Colors.border },
  statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  statLabel: { fontSize: 10.5, color: Colors.text2, fontWeight: '700' },
  statVal: { fontSize: 17, fontWeight: '800', color: Colors.text },
  statSmall: { fontSize: 11, color: Colors.text2, fontWeight: '600' },
  statSub: { fontSize: 9.5, color: Colors.text2, marginTop: 2, fontWeight: '600' },

  card: { backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,196,0,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full, borderWidth: 1, borderColor: 'rgba(245,196,0,0.25)' },
  streakBadgeText: { fontSize: 9.5, fontWeight: '800', color: Colors.amberGold },

  goalItem: { marginBottom: 12 },
  goalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  goalName: { fontSize: 12.5, fontWeight: '700', color: Colors.text },
  goalPercent: { fontSize: 11, fontWeight: '700', color: Colors.gold },
  track: { height: 6, backgroundColor: Colors.card2, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },

  streakDaysRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  streakDayItem: { alignItems: 'center', gap: 4 },
  streakDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.card2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  streakDotDone: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  streakDotText: { fontSize: 11, color: Colors.text2 },
  streakDotTextDone: { color: '#0A0A0A', fontWeight: '800' },
  streakDayLabel: { fontSize: 10, color: Colors.text2, fontWeight: '700' },

  sectionHead: { marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },

  versionShortcutCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 14, marginTop: 4, borderWidth: 1, borderColor: Colors.border },
  versionShortcutLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  versionIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
  versionShortcutTitle: { fontSize: 13, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  versionShortcutSub: { fontSize: 10.5, color: Colors.text2 },
  versionShortcutArrow: { fontSize: 16, fontWeight: '800', color: Colors.gold },
});
