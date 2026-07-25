import React, { useState } from 'react';
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
import { groqService, WorkoutPlan } from '@/services/groqService';
import {
  SparklesIcon, TimeIcon, FlameIcon, DumbbellIcon,
  CheckIcon, ChevronRightIcon, ArrowRightIcon, BarbellIcon,
} from '@/components/icons/SvgIcons';

import { WorkoutVersionControlModal } from '@/components/WorkoutVersionControlModal';

export default function WorkoutScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState('Chest & Triceps');
  const [showWhy, setShowWhy] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState('v2.4 (Latest)');
  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [workout, setWorkout] = useState<WorkoutPlan>({
    title: 'AI Power Hypertrophy & Core Focus',
    durationMinutes: 45,
    estimatedCalories: 420,
    targetMuscles: ['Chest', 'Triceps', 'Abs'],
    whyRecommendation: 'Based on your 92% recovery score and 48-hour upper body rest, today is optimal for high-intensity chest & core hypertrophy.',
    exercises: [
      { id: 'ex1', name: 'Incline Dumbbell Press', sets: 4, reps: '10-12', restSec: 60, icon: 'dumbbell', tip: 'Keep elbows at 45 degrees for maximum upper chest activation.' },
      { id: 'ex2', name: 'Cable Chest Flyes', sets: 3, reps: '12-15', restSec: 45, icon: 'activity', tip: 'Squeeze tightly at full contraction for peak chest tension.' },
      { id: 'ex3', name: 'Triceps Dip Machine', sets: 3, reps: '10-12', restSec: 60, icon: 'zap', tip: 'Control the eccentric motion for 3 seconds per rep.' },
      { id: 'ex4', name: 'Hanging Leg Raises', sets: 4, reps: '15', restSec: 45, icon: 'target', tip: 'Avoid swinging; lift using lower abs.' }
    ]
  });

  const [completedSets, setCompletedSets] = useState<{ [key: string]: number }>({});
  const [activeWorkout, setActiveWorkout] = useState(false);

  const handleRegenerate = async (targetGroup: string) => {
    setSelectedMuscle(targetGroup);
    setLoading(true);
    try {
      const plan = await groqService.generateWorkout({
        targetGroup,
        duration: 45,
        fitnessLevel: 'Intermediate',
      });
      if (plan) {
        setWorkout(plan);
      }
      setCompletedSets({});
    } catch {
      // Handled cleanly
    } finally {
      setLoading(false);
    }
  };

  const toggleSet = (exId: string | number, maxSets: number) => {
    const key = String(exId);
    setCompletedSets(prev => {
      const current = prev[key] || 0;
      const next = current >= maxSets ? 0 : current + 1;
      return { ...prev, [key]: next };
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>

        {/* Top Header */}
        <View style={styles.topbar}>
          <View style={styles.topbarLeft}>
            <View>
              <Text style={styles.title}>AI Workout Planner</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.refreshBtn}
            disabled={loading}
            onPress={() => handleRegenerate(selectedMuscle)}>
            {loading ? (
              <ActivityIndicator size="small" color="#0A0A0A" />
            ) : (
              <SparklesIcon size={18} color="#0A0A0A" />
            )}
          </TouchableOpacity>
        </View>

        {/* Target Group Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {['Chest & Triceps', 'Back & Biceps', 'Leg Day', 'Full Body', 'Core & Cardio'].map(group => {
            const active = selectedMuscle === group;
            return (
              <TouchableOpacity
                key={group}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedMuscle(group)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{group}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Hero Workout Banner - Luxury Dark Gold Radial */}
        <View style={styles.hero}>
          <View style={styles.heroPill}>
            <SparklesIcon size={12} color={Colors.gold} />
            <Text style={styles.heroPillText}>OPTIMAL RECOVERY MATCH</Text>
          </View>

          <Text style={styles.heroTitle}>{workout.title}</Text>
          <Text style={styles.heroSub}>{workout.targetMuscles.join(' • ')}</Text>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <TimeIcon size={15} color={Colors.paleGold} />
              <Text style={styles.heroStatVal}>{workout.durationMinutes} mins</Text>
            </View>
            <View style={styles.heroStatItem}>
              <FlameIcon size={15} color={Colors.amberGold} />
              <Text style={styles.heroStatVal}>{workout.estimatedCalories} kcal</Text>
            </View>
            <View style={styles.heroStatItem}>
              <DumbbellIcon size={15} color={Colors.brightYellow} />
              <Text style={styles.heroStatVal}>{workout.exercises.length} Exercises</Text>
            </View>
          </View>

          <View style={styles.heroBtns}>
            <TouchableOpacity
              style={[styles.hbtn, styles.hbtnPrimary, activeWorkout && styles.hbtnFinishing]}
              onPress={() => setActiveWorkout(!activeWorkout)}
              activeOpacity={0.85}>
              <Text style={styles.hbtnPrimaryText}>
                {activeWorkout ? '✓ Workout in Progress' : 'Start Workout Session'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Expandable AI Rationale */}
        <View style={styles.glassCard}>
          <TouchableOpacity
            style={styles.aiRow}
            onPress={() => setShowWhy(!showWhy)}
            activeOpacity={0.7}>
            <View style={styles.aiTitleRow}>
              <SparklesIcon size={16} color={Colors.paleGold} />
              <Text style={styles.aiTitle}>Why AI recommended this?</Text>
            </View>
            <Text style={styles.aiToggleText}>{showWhy ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>

          {showWhy && (
            <Text style={styles.aiText}>{workout.whyRecommendation}</Text>
          )}
        </View>

        {/* Workout Version Control Selector */}
        <TouchableOpacity
          style={styles.versionCard}
          onPress={() => router.push('/version-control')}
          activeOpacity={0.85}>
          <View style={styles.versionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <SparklesIcon size={14} color={Colors.gold} />
              <Text style={styles.versionTitle}>WORKOUT VERSION CONTROL</Text>
            </View>
            <Text style={styles.versionBadge}>GIT IMMUTABLE ➔</Text>
          </View>
          <View style={styles.versionRow}>
            {['v2.4 (Latest)', 'v2.3 (Yesterday)', 'v2.0 (Baseline)'].map((ver) => {
              const active = selectedVersion.startsWith(ver.split(' ')[0]);
              return (
                <TouchableOpacity
                  key={ver}
                  style={[styles.versionChip, active && styles.versionChipActive]}
                  onPress={() => {
                    setSelectedVersion(ver);
                    router.push('/version-control');
                  }}>
                  <Text style={[styles.versionChipText, active && styles.versionChipTextActive]}>
                    {ver}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>

        {/* Dedicated Version Control Inspector Modal */}
        <WorkoutVersionControlModal
          visible={versionModalVisible}
          onClose={() => setVersionModalVisible(false)}
          onSelectVersion={(v) => setSelectedVersion(`${v} (Restored)`)}
        />

        {/* Exercise List */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Today's Exercise Plan</Text>
          <Text style={styles.sectionMeta}>{workout.exercises.length} exercises</Text>
        </View>

        {workout.exercises.map((ex, index) => {
          const key = String(ex.id);
          const currentSets = completedSets[key] || 0;
          const isDone = currentSets >= ex.sets;

          return (
            <View key={key} style={[styles.exerciseCard, isDone && styles.exerciseDone]}>
              <View style={styles.exHeader}>
                <View style={styles.exNum}>
                  <Text style={styles.exNumText}>{index + 1}</Text>
                </View>
                <View style={styles.exInfo}>
                  <Text style={styles.exName}>{ex.name}</Text>
                  <Text style={styles.exMeta}>
                    {ex.sets} Sets × {ex.reps} Reps • {ex.restSec}s Rest
                  </Text>
                  {ex.tip && (
                    <Text style={styles.exTip}>💡 {ex.tip}</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.setTracker, isDone && styles.setTrackerDone]}
                  onPress={() => toggleSet(ex.id, ex.sets)}
                  activeOpacity={0.7}>
                  {isDone ? (
                    <CheckIcon size={18} color="#0A0A0A" />
                  ) : (
                    <Text style={styles.setText}>
                      {currentSets}/{ex.sets}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  container: { flex: 1, paddingHorizontal: Spacing.lg },
  contentContainer: { paddingBottom: 100 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: Spacing.md },
  topbarLeft: { flexDirection: 'row', alignItems: 'center' },
  kicker: { fontSize: 10.5, fontWeight: '800', color: Colors.gold, letterSpacing: 1 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text, marginTop: 2 },
  refreshBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
  chipScroll: { marginBottom: Spacing.md },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  chipActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  chipText: { fontSize: 12, fontWeight: '700', color: Colors.text2 },
  chipTextActive: { color: '#0A0A0A' },
  hero: {
    backgroundColor: Colors.card, borderRadius: Radii.xxl, padding: 20, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.card2, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  heroPillText: { fontSize: 10, fontWeight: '800', color: Colors.gold, letterSpacing: 0.5 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  heroSub: { fontSize: 13, color: Colors.text2, marginBottom: 16 },
  heroStatsRow: { flexDirection: 'row', gap: 16, marginBottom: 18 },
  heroStatItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroStatVal: { fontSize: 12, fontWeight: '700', color: Colors.text },
  heroBtns: { flexDirection: 'row' },
  hbtn: { flex: 1, paddingVertical: 14, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  hbtnPrimary: { backgroundColor: Colors.gold },
  hbtnFinishing: { backgroundColor: Colors.green },
  hbtnPrimaryText: { fontSize: 14, fontWeight: '800', color: '#0A0A0A' },
  glassCard: { backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 16, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  aiRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aiTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiTitle: { fontSize: 13.5, fontWeight: '700', color: Colors.text },
  aiToggleText: { fontSize: 11, fontWeight: '700', color: Colors.gold },
  aiText: { fontSize: 12.5, color: Colors.text2, marginTop: 10, lineHeight: 18 },
  versionCard: { backgroundColor: Colors.card2, borderRadius: Radii.lg, padding: 14, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  versionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  versionTitle: { fontSize: 10.5, fontWeight: '800', color: Colors.text2, letterSpacing: 1 },
  versionBadge: { fontSize: 9, fontWeight: '800', color: Colors.gold, backgroundColor: 'rgba(245,196,0,0.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  versionRow: { flexDirection: 'row', gap: 8 },
  versionChip: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.card, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  versionChipActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  versionChipText: { fontSize: 10.5, fontWeight: '700', color: Colors.text2 },
  versionChipTextActive: { color: '#0A0A0A' },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  sectionMeta: { fontSize: 12, fontWeight: '600', color: Colors.text2 },
  exerciseCard: { backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  exerciseDone: { opacity: 0.6, borderColor: Colors.green },
  exHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  exNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.card2, alignItems: 'center', justifyContent: 'center' },
  exNumText: { fontSize: 12, fontWeight: '800', color: Colors.gold },
  exInfo: { flex: 1 },
  exName: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  exMeta: { fontSize: 11, color: Colors.text2 },
  exTip: { fontSize: 11, color: Colors.gold, marginTop: 4, fontStyle: 'italic' },
  setTracker: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: Colors.card2, borderWidth: 1, borderColor: Colors.border, minWidth: 50, alignItems: 'center' },
  setTrackerDone: { backgroundColor: Colors.green, borderColor: Colors.green },
  setText: { fontSize: 12, fontWeight: '800', color: Colors.gold },
});
