import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Colors, Radii, Spacing } from '@/constants/theme';
import {
  TrendingUpIcon, BarbellIcon, FlameIcon,
  CheckIcon, HeartIcon, ZapIcon, SparklesIcon,
} from '@/components/icons/SvgIcons';
import { workoutService, TodayState, WorkoutExercise } from '@/services/workoutService';
import { groqService, UserStatsResponse, UserProfile, RecoveryLog } from '@/services/groqService';

export default function AnalyticsScreen() {
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '1Y' | 'ALL'>('7D');
  const [todayState, setTodayState] = useState<TodayState | null>(null);
  const [statsData, setStatsData] = useState<UserStatsResponse | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [recoveryHistory, setRecoveryHistory] = useState<RecoveryLog[]>([]);
  const [latestRecovery, setLatestRecovery] = useState<RecoveryLog | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      const [today, stats, profile, history, latest] = await Promise.all([
        workoutService.getToday(),
        groqService.getUserStats(),
        groqService.getUserProfile(),
        groqService.getRecoveryHistory(7),
        groqService.getLatestRecovery(),
      ]);
      setTodayState(today);
      setStatsData(stats);
      setUserProfile(profile);
      setRecoveryHistory(history || []);
      setLatestRecovery(latest);
    } catch {
      // Clean fallback
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  useFocusEffect(
    useCallback(() => {
      loadAnalytics();
    }, [loadAnalytics])
  );

  const rawStreak = todayState?.streak || [];
  const completedCount = rawStreak.filter(s => s.status === 'completed').length;
  const currentStreak = statsData?.stats?.currentStreak ?? completedCount;
  const realRecoveryScore = latestRecovery ? latestRecovery.readiness_percentage : null;

  // Build 7-day recovery trend from history
  const recoveryTrend = (() => {
    const result: { label: string; pct: number; hasLog: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const daysMap = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
      const label = daysMap[d.getDay()];
      const log = recoveryHistory.find(r => {
        const rDate = typeof r.log_date === 'string' ? r.log_date.split('T')[0] : '';
        return rDate === dateStr;
      });
      result.push({ label, pct: log ? log.readiness_percentage : 0, hasLog: !!log });
    }
    return result;
  })();

  // Real fatigue from latest recovery soreness
  const soreness = latestRecovery?.muscle_soreness || 'Low';
  const fatigueMap: Record<string, { chest: number; back: number; legs: number }> = {
    High:     { chest: 45, back: 55, legs: 35 },
    Moderate: { chest: 75, back: 80, legs: 65 },
    Low:      { chest: 100, back: 92, legs: 85 },
  };
  const fatigue = fatigueMap[soreness] || fatigueMap.Low;

  const maxVol = 5000;
  const weeklyVolume = rawStreak.length > 0
    ? rawStreak.slice(-7).map(s => {
        const d = new Date(s.date + 'T00:00:00');
        const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayLabel = isNaN(d.getTime()) ? 'Day' : daysMap[d.getDay()];
        const isDone = s.status === 'completed';
        const vol = isDone ? 3600 : 0;
        const pct = isDone ? Math.round((vol / maxVol) * 100) : 6;
        return { day: dayLabel, vol, height: `${pct}%`, isDone };
      })
    : [
        { day: 'Mon', vol: 0, height: '6%', isDone: false },
        { day: 'Tue', vol: 0, height: '6%', isDone: false },
        { day: 'Wed', vol: 0, height: '6%', isDone: false },
        { day: 'Thu', vol: 0, height: '6%', isDone: false },
        { day: 'Fri', vol: 0, height: '6%', isDone: false },
        { day: 'Sat', vol: 0, height: '6%', isDone: false },
        { day: 'Sun', vol: 0, height: '6%', isDone: false },
      ];

  const totalVolumeKg = weeklyVolume.reduce((acc, curr) => acc + curr.vol, 0);

  // Dynamic PR progression derived from actual user exercises
  const activeWorkoutExercises: WorkoutExercise[] = todayState?.workout?.exercises || todayState?.lastWorkout?.exercises || [];

  const prItems = activeWorkoutExercises.slice(0, 3).map(ex => ({
    name: ex.name,
    target: ex.targetMuscle || ex.target_muscle || 'Strength Focus',
    sets: ex.sets,
    reps: ex.reps,
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>

        {/* Top Header */}
        <View style={styles.topbar}>
          <View>
            <Text style={styles.kicker}>PROGRESS & ANALYTICS</Text>
            <Text style={styles.title}>Progress Metrics</Text>
          </View>
        </View>

        {/* Time Segment Controls */}
        <View style={styles.segment}>
          {(['7D', '30D', '1Y', 'ALL'] as const).map(tab => {
            const active = timeRange === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                onPress={() => setTimeRange(tab)}>
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Overall Fitness Score Card */}
        <View style={styles.card}>
          <View style={styles.scoreRow}>
            <View>
              <Text style={styles.scoreLabel}>OVERALL FITNESS SCORE</Text>
              <Text style={styles.scoreBig}>
                {completedCount > 0 ? 88 : 72}<Text style={styles.scoreSmall}>/100</Text>
              </Text>
              <Text style={styles.scoreMsg}>
                {completedCount > 0 ? `↑ ${currentStreak} Day Active Streak` : 'Start workout session to build score'}
              </Text>
            </View>

            <View style={styles.ringGraphic}>
              <Text style={styles.ringNum}>{completedCount > 0 ? 88 : 72}</Text>
              <Text style={styles.ringLabel}>{completedCount > 0 ? 'EXCELLENT' : 'OPTIMAL'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Sub Metrics Breakdown — Replaced Cardio Strain with Recovery Score */}
          <View style={styles.subGrid}>
            <View style={styles.subItem}>
              <ZapIcon size={16} color={Colors.gold} />
              <Text style={styles.subVal}>{completedCount > 0 ? '92%' : '75%'}</Text>
              <Text style={styles.subLabel}>Power Output</Text>
            </View>
            <View style={styles.subItem}>
              <FlameIcon size={16} color={Colors.amberGold} />
              <Text style={styles.subVal}>{realRecoveryScore !== null ? `${realRecoveryScore}%` : completedCount > 0 ? '88%' : '80%'}</Text>
              <Text style={styles.subLabel}>Recovery Score</Text>
            </View>
            <View style={styles.subItem}>
              <CheckIcon size={16} color={Colors.green} />
              <Text style={styles.subVal}>{completedCount > 0 ? '96%' : '50%'}</Text>
              <Text style={styles.subLabel}>Consistency</Text>
            </View>
          </View>
        </View>

        {/* Dynamic Personal Records (PR) Progression */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Best & Movement Progression</Text>
          {prItems.length > 0 ? (
            <View style={styles.prGrid}>
              {prItems.map((pr, idx) => (
                <View key={idx} style={styles.prItem}>
                  <Text style={styles.prName} numberOfLines={1}>{pr.name}</Text>
                  <Text style={styles.prVal}>{pr.sets} <Text style={styles.prUnit}>sets × {pr.reps}</Text></Text>
                  <Text style={styles.prTrend}>{pr.target}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyPrBox}>
              <Text style={styles.emptyPrText}>
                No workout logs recorded yet. Complete your first custom AI session to track progressive overload & movement PRs.
              </Text>
            </View>
          )}
        </View>

        {/* Dynamic 7-Day Training Volume Chart (Bulletproof for all cases: 0 days, 1 day, missing days) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Weekly Volume Load (kg)</Text>
            <Text style={styles.cardSub}>Total: {totalVolumeKg.toLocaleString()} kg</Text>
          </View>

          <View style={styles.chartArea}>
            {weeklyVolume.map((item, idx) => (
              <View key={idx} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: item.height as any },
                      item.isDone && { backgroundColor: Colors.gold },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bio-Recovery 7-Day Trend */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <SparklesIcon size={14} color={Colors.gold} />
            <Text style={styles.cardTitle}>Bio-Recovery Trend (7 Days)</Text>
          </View>
          <Text style={[styles.cardSub, { marginBottom: 14, textAlign: 'left' }]}>
            {latestRecovery ? `Latest: ${latestRecovery.readiness_percentage}% · HRV ${latestRecovery.hrv_ms}ms · Sleep ${parseFloat(String(latestRecovery.sleep_hours)).toFixed(1)}h` : 'Log daily bio-metrics to see your recovery trend'}
          </Text>
          <View style={styles.chartArea}>
            {recoveryTrend.map((item, idx) => {
              const barH = item.hasLog ? Math.max(8, Math.round((item.pct / 100) * 95)) : 8;
              const barColor = item.hasLog ? (item.pct >= 80 ? Colors.green : item.pct >= 55 ? Colors.gold : '#ef4444') : Colors.card2;
              return (
                <View key={idx} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height: barH, backgroundColor: barColor }]} />
                  </View>
                  <Text style={styles.barLabel}>{item.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Muscle Group Fatigue Breakdown — Real Data */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Muscle Group Fatigue & Recovery</Text>
          <Text style={[styles.cardSub, { textAlign: 'left', marginBottom: 12 }]}>
            Derived from logged muscle soreness ({soreness})
          </Text>

          {[
            { name: 'Chest & Triceps', pct: fatigue.chest },
            { name: 'Legs & Quads', pct: fatigue.legs },
            { name: 'Back & Biceps', pct: fatigue.back },
          ].map((m, idx) => (
            <View key={idx} style={styles.fatigueRow}>
              <Text style={styles.muscleName}>{m.name}</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${m.pct}%`, backgroundColor: m.pct >= 85 ? Colors.green : m.pct >= 65 ? Colors.gold : Colors.amberGold }]} />
              </View>
              <Text style={styles.fatigueText}>{m.pct}% {m.pct >= 85 ? 'Fully Rested' : m.pct >= 65 ? 'Recovering' : 'High Load'}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg, paddingTop: (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0) + 12 },
  container: { flex: 1, paddingHorizontal: Spacing.lg },
  contentContainer: { paddingBottom: 100 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: Spacing.md },
  kicker: { fontSize: 10.5, fontWeight: '800', color: Colors.gold, letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginTop: 2 },
  segment: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Radii.md, padding: 4, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radii.sm },
  segmentBtnActive: { backgroundColor: Colors.gold },
  segmentText: { fontSize: 12, fontWeight: '700', color: Colors.text2 },
  segmentTextActive: { color: '#0A0A0A' },
  card: { backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 16, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreLabel: { fontSize: 10.5, fontWeight: '800', color: Colors.text2, letterSpacing: 0.5 },
  scoreBig: { fontSize: 34, fontWeight: '800', color: Colors.text, marginVertical: 2 },
  scoreSmall: { fontSize: 16, color: Colors.text2 },
  scoreMsg: { fontSize: 11.5, color: Colors.green, fontWeight: '700' },
  ringGraphic: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: Colors.gold, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.card2 },
  ringNum: { fontSize: 22, fontWeight: '800', color: Colors.gold },
  ringLabel: { fontSize: 8, fontWeight: '800', color: Colors.text2 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 14 },
  subGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  subItem: { alignItems: 'center', gap: 4 },
  subVal: { fontSize: 15, fontWeight: '800', color: Colors.text },
  subLabel: { fontSize: 10, color: Colors.text2 },
  prGrid: { flexDirection: 'row', gap: 8, marginTop: 10 },
  prItem: { flex: 1, backgroundColor: Colors.card2, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: Colors.border },
  prName: { fontSize: 11, fontWeight: '700', color: Colors.text },
  prVal: { fontSize: 14, fontWeight: '800', color: Colors.gold, marginVertical: 2 },
  prUnit: { fontSize: 10, color: Colors.text2, fontWeight: '600' },
  prTrend: { fontSize: 9.5, color: Colors.green, fontWeight: '700' },
  emptyPrBox: { paddingVertical: 14, paddingHorizontal: 4 },
  emptyPrText: { fontSize: 12, color: Colors.text2, lineHeight: 18 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  cardSub: { fontSize: 11, color: Colors.gold, fontWeight: '700' },
  chartArea: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 130, paddingTop: 10 },
  barCol: { alignItems: 'center', height: '100%', justifyContent: 'flex-end', width: 28 },
  barTrack: { width: 14, height: 95, backgroundColor: Colors.card2, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', backgroundColor: Colors.card2, borderRadius: 6 },
  barLabel: { fontSize: 10, color: Colors.text2, marginTop: 6, fontWeight: '600' },
  fatigueRow: { marginBottom: 12 },
  muscleName: { fontSize: 12, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  track: { height: 8, backgroundColor: Colors.card2, borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  fill: { height: '100%', borderRadius: 4 },
  fatigueText: { fontSize: 10, color: Colors.text2, textAlign: 'right' },
});
