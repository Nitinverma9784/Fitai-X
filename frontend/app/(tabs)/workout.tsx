import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  RefreshControl,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { workoutService, WorkoutRecord, StreakDay, TodayState } from '@/services/workoutService';

// ─────────────────────────────────────────────────────────────
// STREAK CALENDAR
// ─────────────────────────────────────────────────────────────
function StreakCalendar({ streak }: { streak: StreakDay[] }) {
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().toISOString().split('T')[0];

  return (
    <View style={cal.container}>
      <View style={cal.header}>
        <Text style={cal.title}>WEEKLY STREAK</Text>
        <Text style={cal.sub}>{streak.filter(d => d.status === 'completed').length}/7 days</Text>
      </View>
      <View style={cal.row}>
        {streak.map((day) => {
          const isToday = day.date === today;
          const d = new Date(day.date);
          const dayLabel = dayLabels[d.getDay()];
          const dateNum = d.getDate();

          let dotBg = '#2A2A2A';
          let textColor = Colors.text2;
          let icon: React.ReactNode = null;

          if (day.status === 'completed') {
            dotBg = Colors.green;
            textColor = Colors.green;
            icon = <Feather name="check" size={12} color="#0A0A0A" />;
          } else if (day.status === 'missed') {
            dotBg = '#FF444422';
            textColor = '#FF4444';
            icon = <Feather name="x" size={12} color="#FF4444" />;
          } else if (day.status === 'pending') {
            dotBg = 'rgba(245,196,0,0.2)';
            textColor = Colors.gold;
            icon = <Feather name="clock" size={10} color={Colors.gold} />;
          } else if (isToday) {
            dotBg = 'rgba(245,196,0,0.12)';
            textColor = Colors.gold;
          }

          return (
            <View key={day.date} style={[cal.dayCol, isToday && cal.dayColToday]}>
              <Text style={[cal.dayLabel, { color: textColor }]}>{dayLabel}</Text>
              <View style={[cal.dot, { backgroundColor: dotBg }]}>
                {icon}
              </View>
              <Text style={[cal.dateNum, { color: textColor }]}>{dateNum}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const cal = StyleSheet.create({
  container: { backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 11, fontWeight: '800', color: Colors.text2, letterSpacing: 1 },
  sub: { fontSize: 12, fontWeight: '700', color: Colors.gold },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 5, paddingHorizontal: 4 },
  dayColToday: { backgroundColor: 'rgba(245,196,0,0.07)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  dayLabel: { fontSize: 10, fontWeight: '700', color: Colors.text2 },
  dot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dateNum: { fontSize: 10, fontWeight: '700', color: Colors.text2 },
});

// ─────────────────────────────────────────────────────────────
// FEEDBACK MODAL
// ─────────────────────────────────────────────────────────────
interface FeedbackModalProps {
  visible: boolean;
  onSubmit: (f: { energy: number; soreness: number; mood: number; notes: string }) => void;
  onSkip: () => void;
}

function FeedbackModal({ visible, onSubmit, onSkip }: FeedbackModalProps) {
  const [energy, setEnergy] = useState(3);
  const [soreness, setSoreness] = useState(2);
  const [mood, setMood] = useState(4);
  const [notes, setNotes] = useState('');

  const RatingRow = ({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void; color: string }) => (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.text }}>{label}</Text>
        <Text style={{ fontSize: 13, fontWeight: '800', color }}>{value}/5</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <TouchableOpacity
            key={n}
            onPress={() => onChange(n)}
            style={{
              flex: 1, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
              backgroundColor: value >= n ? color : 'rgba(255,255,255,0.06)',
              borderWidth: 1, borderColor: value >= n ? color : Colors.border,
            }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: value >= n ? '#0A0A0A' : Colors.text2 }}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
          <View style={{ width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
          <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 4 }}>How was the session?</Text>
          <Text style={{ fontSize: 13, color: Colors.text2, marginBottom: 22 }}>Your feedback shapes tomorrow's workout.</Text>
          <RatingRow label="Energy Level" value={energy} onChange={setEnergy} color={Colors.gold} />
          <RatingRow label="Muscle Soreness" value={soreness} onChange={setSoreness} color="#FF6B6B" />
          <RatingRow label="Mood" value={mood} onChange={setMood} color={Colors.green} />
          <TextInput
            style={{ backgroundColor: Colors.card, borderRadius: 10, padding: 12, color: Colors.text, fontSize: 13, borderWidth: 1, borderColor: Colors.border, marginBottom: 20, minHeight: 60, textAlignVertical: 'top' }}
            placeholder="Any notes? (optional)"
            placeholderTextColor={Colors.text2}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
          <TouchableOpacity
            style={{ backgroundColor: Colors.gold, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 10 }}
            onPress={() => onSubmit({ energy, soreness, mood, notes })}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#0A0A0A' }}>Save Feedback</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSkip} style={{ alignItems: 'center', paddingVertical: 10 }}>
            <Text style={{ fontSize: 13, color: Colors.text2 }}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// EXERCISE CARD
// ─────────────────────────────────────────────────────────────
function ExerciseCard({
  exercise, index, onToggle,
}: {
  exercise: WorkoutRecord['exercises'][0];
  index: number;
  onToggle: (id: number, isDone: boolean) => void;
}) {
  const done = !!exercise.is_completed;

  return (
    <View style={[exS.card, done && exS.cardDone]}>
      <View style={exS.numWrap}>
        <Text style={exS.numText}>{index + 1}</Text>
      </View>
      <View style={exS.info}>
        <Text style={[exS.name, done && { opacity: 0.5 }]}>{exercise.name}</Text>
        <Text style={exS.meta}>{exercise.sets} Sets × {exercise.reps} Reps · {exercise.rest_sec}s Rest</Text>
        {exercise.tip ? <Text style={exS.tip}>💡 {exercise.tip}</Text> : null}
      </View>
      <TouchableOpacity
        style={[exS.checkBtn, done && exS.checkBtnDone]}
        onPress={() => onToggle(Number(exercise.id), !done)}
        activeOpacity={0.7}>
        {done
          ? <Feather name="check" size={18} color="#0A0A0A" />
          : <Text style={exS.checkText}>{exercise.completed_sets || 0}/{exercise.sets}</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

const exS = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardDone: { borderColor: Colors.green, opacity: 0.75 },
  numWrap: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.card2, alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 12, fontWeight: '800', color: Colors.gold },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  meta: { fontSize: 11, color: Colors.text2 },
  tip: { fontSize: 11, color: Colors.gold, marginTop: 4, fontStyle: 'italic' },
  checkBtn: { width: 48, height: 40, borderRadius: 12, backgroundColor: Colors.card2, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkBtnDone: { backgroundColor: Colors.green, borderColor: Colors.green },
  checkText: { fontSize: 11, fontWeight: '800', color: Colors.gold },
});

// ─────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────
export default function WorkoutScreen() {
  const router = useRouter();
  const [state, setState] = useState<TodayState | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [completing, setCompleting] = useState(false);

  const load = useCallback(async () => {
    const data = await workoutService.getToday();
    setState(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    await workoutService.generate();
    await load();
    setGenerating(false);
  };

  const handleToggleExercise = async (exId: number, isDone: boolean) => {
    await workoutService.toggleExercise(exId, isDone);
    setState(prev => {
      if (!prev?.workout) return prev;
      return {
        ...prev,
        workout: {
          ...prev.workout,
          exercises: prev.workout.exercises.map(e =>
            Number(e.id) === exId ? { ...e, is_completed: isDone, completed_sets: isDone ? e.sets : 0 } : e
          ),
        },
      };
    });
  };

  const handleFeedbackSubmit = async (feedback: { energy: number; soreness: number; mood: number; notes: string }) => {
    if (!state?.workout?.id) return;
    setShowFeedback(false);
    setCompleting(true);
    await workoutService.completeWorkout(state.workout.id, feedback);
    await load();
    setCompleting(false);
  };

  const handleFeedbackSkip = async () => {
    if (!state?.workout?.id) return;
    setShowFeedback(false);
    setCompleting(true);
    await workoutService.completeWorkout(state.workout.id, { energy: 3, soreness: 3, mood: 3, notes: '' });
    await load();
    setCompleting(false);
  };

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={{ color: Colors.text2, marginTop: 14, fontSize: 13 }}>Loading your plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const scenario = state?.scenario;
  const workout = state?.workout as WorkoutRecord | null;
  const streak = state?.streak || [];
  const completedExercises = workout?.exercises.filter(e => e.is_completed).length || 0;
  const totalExercises = workout?.exercises.length || 0;

  return (
    <SafeAreaView style={s.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <FeedbackModal visible={showFeedback} onSubmit={handleFeedbackSubmit} onSkip={handleFeedbackSkip} />

      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />}>

        {/* Header */}
        <View style={s.topbar}>
          <View>
            <Text style={s.kicker}>WORKOUT PLANNER</Text>
            <Text style={s.title}>
              {scenario === 'FIRST_DAY' ? "Let's Begin" :
                scenario === 'COMPLETED_TODAY' ? 'Session Done' :
                  scenario === 'READY_TO_GENERATE' ? 'Ready to Train' : "Today's Plan"}
            </Text>
          </View>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/version-control')} activeOpacity={0.8}>
            <Feather name="git-branch" size={18} color={Colors.gold} />
          </TouchableOpacity>
        </View>

        {/* Streak Calendar */}
        {streak.length > 0 && <StreakCalendar streak={streak} />}

        {/* ── FIRST DAY ───────────────────────────────────────── */}
        {scenario === 'FIRST_DAY' && (
          <View style={s.heroCard}>
            <View style={s.pill}>
              <Feather name="zap" size={11} color={Colors.gold} />
              <Text style={s.pillText}>DAY ONE</Text>
            </View>
            <Text style={s.heroTitle}>Welcome to Your Journey</Text>
            <Text style={s.heroSub}>
              Your first workout will be designed specifically for you — full body, perfect intensity, built around your goal.
            </Text>
            <View style={s.statRow}>
              <View style={s.statItem}><Feather name="target" size={14} color={Colors.paleGold} /><Text style={s.statText}>Personalized</Text></View>
              <View style={s.statItem}><Feather name="clock" size={14} color={Colors.paleGold} /><Text style={s.statText}>35–45 mins</Text></View>
              <View style={s.statItem}><Feather name="activity" size={14} color={Colors.paleGold} /><Text style={s.statText}>~320 kcal</Text></View>
            </View>
            <TouchableOpacity style={s.primaryBtn} onPress={handleGenerate} disabled={generating} activeOpacity={0.85}>
              {generating
                ? <ActivityIndicator size="small" color="#0A0A0A" />
                : <Text style={s.primaryBtnText}>Generate My First Workout</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* ── READY TO GENERATE ───────────────────────────────── */}
        {scenario === 'READY_TO_GENERATE' && (
          <>
            {state?.lastWorkout && (
              <View style={s.lastCard}>
                <Text style={s.sectionLabel}>LAST SESSION</Text>
                <Text style={s.lastTitle}>{state.lastWorkout.title}</Text>
                <Text style={s.lastMeta}>{(state.lastWorkout.target_muscles || []).join(' · ')}</Text>
                {state.lastWorkout.status === 'missed' && (
                  <View style={s.missedBadge}><Text style={s.missedText}>MISSED</Text></View>
                )}
              </View>
            )}
            <View style={s.heroCard}>
              <View style={s.pill}>
                <Feather name="cpu" size={11} color={Colors.gold} />
                <Text style={s.pillText}>ADAPTIVE PLAN</Text>
              </View>
              <Text style={s.heroTitle}>Ready for Today's Workout?</Text>
              <Text style={s.heroSub}>
                {state?.missedCount && state.missedCount > 0
                  ? `You missed ${state.missedCount} day(s) — plan adjusted for re-engagement.`
                  : 'Generated based on your last session, feedback, and recovery.'}
              </Text>
              <TouchableOpacity style={s.primaryBtn} onPress={handleGenerate} disabled={generating} activeOpacity={0.85}>
                {generating
                  ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ActivityIndicator size="small" color="#0A0A0A" />
                    <Text style={s.primaryBtnText}>Generating…</Text>
                  </View>
                  : <Text style={s.primaryBtnText}>Generate Today's Workout</Text>}
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── HAS WORKOUT / COMPLETED ─────────────────────────── */}
        {(scenario === 'HAS_WORKOUT_TODAY' || scenario === 'COMPLETED_TODAY') && workout && (
          <>
            {/* Hero */}
            <View style={s.workoutHero}>
              {workout.readiness_score !== undefined && (
                <View style={s.pill}>
                  <Feather name="bar-chart-2" size={11} color={Colors.gold} />
                  <Text style={s.pillText}>READINESS {workout.readiness_score}%</Text>
                </View>
              )}
              <Text style={s.heroTitle}>{workout.title}</Text>
              <Text style={s.heroSub}>{(workout.target_muscles || []).join(' · ')}</Text>

              <View style={s.statRow}>
                <View style={s.statItem}><Feather name="clock" size={14} color={Colors.paleGold} /><Text style={s.statText}>{workout.duration_minutes} mins</Text></View>
                <View style={s.statItem}><Feather name="zap" size={14} color={Colors.amberGold} /><Text style={s.statText}>{workout.estimated_calories} kcal</Text></View>
                <View style={s.statItem}><Feather name="layers" size={14} color={Colors.brightYellow} /><Text style={s.statText}>{totalExercises} exercises</Text></View>
              </View>

              {/* Reasoning */}
              {workout.ai_reasoning && (
                <View style={s.reasonBox}>
                  <Text style={s.reasonText}>{workout.ai_reasoning}</Text>
                </View>
              )}

              {/* Adaptation tags */}
              {workout.adaptations && workout.adaptations.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {workout.adaptations.map((a, i) => (
                    <View key={i} style={s.adaptTag}><Text style={s.adaptTagText}>{a}</Text></View>
                  ))}
                </View>
              )}

              {/* Progress bar */}
              {scenario === 'HAS_WORKOUT_TODAY' && totalExercises > 0 && (
                <View style={{ marginTop: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 11, color: Colors.text2, fontWeight: '700' }}>PROGRESS</Text>
                    <Text style={{ fontSize: 11, color: Colors.gold, fontWeight: '800' }}>{completedExercises}/{totalExercises}</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: Colors.card2, borderRadius: 3 }}>
                    <View style={{ height: 6, backgroundColor: Colors.gold, borderRadius: 3, width: `${Math.round((completedExercises / totalExercises) * 100)}%` as any }} />
                  </View>
                </View>
              )}
            </View>

            {/* Why card */}
            {workout.why_recommendation && (
              <View style={s.whyCard}>
                <Text style={s.whyText}>{workout.why_recommendation}</Text>
              </View>
            )}

            {/* Exercise list */}
            <View style={s.sectionHead}>
              <Text style={s.sectionTitle}>Exercises</Text>
              <Text style={s.sectionMeta}>{totalExercises} moves</Text>
            </View>

            {workout.exercises.map((ex, i) => (
              <ExerciseCard
                key={String(ex.id)}
                exercise={ex}
                index={i}
                onToggle={scenario === 'COMPLETED_TODAY' ? () => {} : handleToggleExercise}
              />
            ))}

            {/* Finish button */}
            {scenario === 'HAS_WORKOUT_TODAY' && (
              <TouchableOpacity
                style={[s.primaryBtn, { marginTop: 8, opacity: completing ? 0.6 : 1 }]}
                onPress={() => setShowFeedback(true)}
                disabled={completing}
                activeOpacity={0.85}>
                {completing
                  ? <ActivityIndicator size="small" color="#0A0A0A" />
                  : <Text style={s.primaryBtnText}>
                    {completedExercises === totalExercises && totalExercises > 0
                      ? '✓ Finish Workout'
                      : `Finish Session (${completedExercises}/${totalExercises} done)`}
                  </Text>}
              </TouchableOpacity>
            )}

            {/* Completed summary */}
            {scenario === 'COMPLETED_TODAY' && (
              <View style={s.completedBanner}>
                <Feather name="award" size={28} color={Colors.green} style={{ marginBottom: 8 }} />
                <Text style={s.completedTitle}>Session Complete!</Text>
                <Text style={s.completedSub}>Great work. Tomorrow's workout adapts to today's performance.</Text>
                {workout.feedback_energy !== undefined && workout.feedback_energy > 0 && (
                  <View style={s.feedbackRow}>
                    <Text style={s.feedbackChip}>Energy {workout.feedback_energy}/5</Text>
                    <Text style={s.feedbackChip}>Soreness {workout.feedback_soreness}/5</Text>
                    <Text style={s.feedbackChip}>Mood {workout.feedback_mood}/5</Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* Version Control Link */}
        <TouchableOpacity style={s.vcCard} onPress={() => router.push('/version-control')} activeOpacity={0.8}>
          <Feather name="git-commit" size={18} color={Colors.gold} />
          <View style={{ flex: 1 }}>
            <Text style={s.vcTitle}>WORKOUT HISTORY</Text>
            <Text style={s.vcSub}>View all sessions, rollback plans, see diffs</Text>
          </View>
          <Feather name="chevron-right" size={16} color={Colors.text2} />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  container: { flex: 1, paddingHorizontal: Spacing.lg },
  content: { paddingBottom: 110 },

  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 16 },
  kicker: { fontSize: 10, fontWeight: '800', color: Colors.gold, letterSpacing: 1, marginBottom: 2 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },

  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245,196,0,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(245,196,0,0.25)', alignSelf: 'flex-start' },
  pillText: { fontSize: 10, fontWeight: '800', color: Colors.gold, letterSpacing: 0.5 },

  heroCard: { backgroundColor: Colors.card, borderRadius: Radii.xxl, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: Colors.borderLight },
  workoutHero: { backgroundColor: Colors.card, borderRadius: Radii.xxl, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: Colors.borderLight },
  heroTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  heroSub: { fontSize: 13, color: Colors.text2, marginBottom: 16, lineHeight: 18 },
  statRow: { flexDirection: 'row', gap: 18, marginBottom: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { fontSize: 12, fontWeight: '700', color: Colors.text },

  reasonBox: { backgroundColor: 'rgba(245,196,0,0.07)', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: 'rgba(245,196,0,0.15)', marginBottom: 8 },
  reasonText: { fontSize: 12, color: Colors.gold, lineHeight: 17 },

  adaptTag: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.border },
  adaptTagText: { fontSize: 10, color: Colors.text2, fontWeight: '600' },

  whyCard: { backgroundColor: Colors.card2, borderRadius: Radii.md, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  whyText: { fontSize: 12.5, color: Colors.text2, lineHeight: 18 },

  lastCard: { backgroundColor: Colors.card2, borderRadius: Radii.lg, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  lastTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 4 },
  lastMeta: { fontSize: 12, color: Colors.text2 },
  missedBadge: { backgroundColor: 'rgba(255,68,68,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginTop: 6 },
  missedText: { fontSize: 10, fontWeight: '800', color: '#FF4444' },

  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  sectionMeta: { fontSize: 12, fontWeight: '600', color: Colors.text2 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: Colors.text2, letterSpacing: 1 },

  primaryBtn: { backgroundColor: Colors.gold, borderRadius: 12, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  primaryBtnText: { fontSize: 15, fontWeight: '800', color: '#0A0A0A' },

  completedBanner: { backgroundColor: 'rgba(74,222,128,0.08)', borderRadius: Radii.lg, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: Colors.green, alignItems: 'center' },
  completedTitle: { fontSize: 18, fontWeight: '800', color: Colors.green, marginBottom: 6 },
  completedSub: { fontSize: 13, color: Colors.text2, textAlign: 'center', lineHeight: 18, marginBottom: 12 },
  feedbackRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  feedbackChip: { fontSize: 11, fontWeight: '700', color: Colors.text2, backgroundColor: Colors.card, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

  vcCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 14, marginTop: 4, borderWidth: 1, borderColor: Colors.border },
  vcTitle: { fontSize: 11, fontWeight: '800', color: Colors.gold, letterSpacing: 1, marginBottom: 2 },
  vcSub: { fontSize: 12, color: Colors.text2 },
});
