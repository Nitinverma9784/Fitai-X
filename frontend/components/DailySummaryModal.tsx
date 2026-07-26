import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export interface DailySummaryData {
  dateStr: string;
  hasData: boolean;
  hasWorkout?: boolean;
  hasRecoveryMetrics?: boolean;
  hasMeals?: boolean;
  workoutTitle?: string;
  durationMinutes?: number;
  calories?: number;
  exercises?: Array<{ name: string; sets: number; reps: string }>;
  sleepHours?: number;
  sleepEfficiency?: number;
  hrvMs?: number;
  hydrationL?: number;
  soreness?: string;
  readinessPercentage?: number;
  aiSummary?: string;
  mealsLoggedCount?: number;
  totalProteinLogged?: number;
  totalCaloriesLogged?: number;
}

interface DailySummaryModalProps {
  visible: boolean;
  data: DailySummaryData | null;
  onClose: () => void;
}

export function DailySummaryModal({ visible, data, onClose }: DailySummaryModalProps) {
  if (!visible || !data) return null;

  const dateObj = new Date(data.dateStr + 'T00:00:00');
  const dateFormatted = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : data.dateStr;

  const showWorkout = !!data.hasWorkout || !!data.workoutTitle;
  const showRecovery = !!data.hasRecoveryMetrics && data.sleepHours !== undefined;
  const showMeals = !!data.hasMeals && (data.mealsLoggedCount || 0) > 0;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.overlay}>
        <View style={s.card}>
          <View style={s.topRow}>
            <View style={s.badge}>
              <Ionicons name="analytics" size={14} color={Colors.gold} />
              <Text style={s.badgeText}>DAILY PERFORMANCE SUMMARY</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Ionicons name="close" size={16} color={Colors.text2} />
            </TouchableOpacity>
          </View>

          <Text style={s.title}>{dateFormatted}</Text>

          <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
            {data.hasData && (showWorkout || showRecovery || showMeals) ? (
              <>
                {/* AI Daily Performance Synthesis */}
                <View style={s.aiBox}>
                  <Text style={s.aiBoxTitle}>🤖 AI DAILY PERFORMANCE SYNTHESIS</Text>
                  <Text style={s.aiBoxDesc}>
                    {data.aiSummary || `On ${dateFormatted}, your logged performance metrics were saved successfully.`}
                  </Text>
                </View>

                {/* Workout Section — Only if workout logged */}
                {showWorkout && (
                  <View style={s.sectionBox}>
                    <Text style={s.sectionLabel}>COMPLETED WORKOUT SESSION</Text>
                    <Text style={s.workoutTitle}>{data.workoutTitle || 'Custom Hypertrophy Workout'}</Text>
                    <View style={s.metaRow}>
                      <Text style={s.metaText}>⏱️ {data.durationMinutes || 45} mins</Text>
                      <Text style={s.metaText}>🔥 {data.calories || 380} kcal</Text>
                    </View>

                    {data.exercises && data.exercises.length > 0 && (
                      <View style={s.exerciseList}>
                        {data.exercises.map((ex, i) => (
                          <View key={i} style={s.exerciseRow}>
                            <Text style={s.exerciseNum}>{i + 1}</Text>
                            <Text style={s.exerciseName}>{ex.name}</Text>
                            <Text style={s.exerciseMeta}>{ex.sets} × {ex.reps}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* Logged Bio-Metrics — Only if bio recovery metrics logged */}
                {showRecovery && (
                  <>
                    <Text style={s.sectionLabel}>RECORDED BIO-RECOVERY METRICS</Text>

                    {/* Readiness Score Gauge */}
                    {data.readinessPercentage !== undefined && (
                      <View style={s.readinessRow}>
                        <View style={[s.readinessBadge, {
                          borderColor: data.readinessPercentage >= 80 ? '#4ade80' : data.readinessPercentage >= 55 ? '#f5c400' : '#ef4444',
                          backgroundColor: data.readinessPercentage >= 80 ? 'rgba(74,222,128,0.1)' : data.readinessPercentage >= 55 ? 'rgba(245,196,0,0.1)' : 'rgba(239,68,68,0.1)',
                        }]}>
                          <Text style={[s.readinessPct, {
                            color: data.readinessPercentage >= 80 ? '#4ade80' : data.readinessPercentage >= 55 ? '#f5c400' : '#ef4444',
                          }]}>{data.readinessPercentage}%</Text>
                          <Text style={s.readinessLbl}>AI READINESS</Text>
                        </View>
                        <View style={s.readinessBarContainer}>
                          <View style={[s.readinessBar, {
                            width: `${data.readinessPercentage}%`,
                            backgroundColor: data.readinessPercentage >= 80 ? '#4ade80' : data.readinessPercentage >= 55 ? '#f5c400' : '#ef4444',
                          }]} />
                        </View>
                      </View>
                    )}

                    <View style={s.grid2}>
                      <View style={s.miniCard}>
                        <Text style={s.miniLabel}>Sleep Duration</Text>
                        <Text style={s.miniVal}>{data.sleepHours} <Text style={s.miniUnit}>hrs</Text></Text>
                        <Text style={s.miniSub}>{data.sleepEfficiency || 90}% Efficiency</Text>
                      </View>

                      <View style={s.miniCard}>
                        <Text style={s.miniLabel}>Wearable HRV</Text>
                        <Text style={s.miniVal}>{data.hrvMs || 65} <Text style={s.miniUnit}>ms</Text></Text>
                        <Text style={s.miniSub}>Heart Rate Score</Text>
                      </View>

                      <View style={s.miniCard}>
                        <Text style={s.miniLabel}>Hydration Intake</Text>
                        <Text style={s.miniVal}>{data.hydrationL || 2.5} <Text style={s.miniUnit}>L</Text></Text>
                        <Text style={s.miniSub}>Water Logged</Text>
                      </View>

                      <View style={s.miniCard}>
                        <Text style={s.miniLabel}>Muscle Soreness</Text>
                        <Text style={s.miniVal}>{data.soreness || 'Low'}</Text>
                        <Text style={s.miniSub}>Athlete Rating</Text>
                      </View>
                    </View>
                  </>
                )}

                {/* Logged Meals Summary — Only if meals logged */}
                {showMeals && (
                  <View style={s.sectionBox}>
                    <Text style={s.sectionLabel}>DAILY MEALS LOGGED ({data.mealsLoggedCount})</Text>
                    <View style={s.metaRow}>
                      <Text style={s.metaText}>💪 {data.totalProteinLogged || 0}g Protein</Text>
                      <Text style={s.metaText}>🔥 {data.totalCaloriesLogged || 0} kcal</Text>
                    </View>
                  </View>
                )}
              </>
            ) : (

              <View style={s.emptyBox}>
                <Ionicons name="calendar-outline" size={28} color={Colors.text2} style={{ marginBottom: 8 }} />
                <Text style={s.emptyTitle}>No Data Logged On This Date</Text>
                <Text style={s.emptySub}>
                  You didn't log any workouts, meals, or bio-recovery metrics on {dateFormatted}.
                </Text>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={s.closeActionBtn} onPress={onClose}>
            <Text style={s.closeActionText}>Close Summary</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#121212', borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl, padding: Spacing.lg, maxHeight: '85%', borderWidth: 1, borderColor: Colors.border },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245,196,0,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radii.full, borderWidth: 1, borderColor: 'rgba(245,196,0,0.3)' },
  badgeText: { fontSize: 10, fontWeight: '800', color: Colors.gold, letterSpacing: 0.8 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 14 },

  aiBox: { backgroundColor: 'rgba(245,196,0,0.08)', borderRadius: Radii.md, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(245,196,0,0.2)' },
  aiBoxTitle: { fontSize: 10.5, fontWeight: '800', color: Colors.gold, marginBottom: 4, letterSpacing: 0.5 },
  aiBoxDesc: { fontSize: 12, color: Colors.text, lineHeight: 17 },

  sectionLabel: { fontSize: 10.5, fontWeight: '800', color: Colors.gold, letterSpacing: 0.8, marginBottom: 8, marginTop: 4 },
  sectionBox: { backgroundColor: Colors.card, borderRadius: Radii.md, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  workoutTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  metaRow: { flexDirection: 'row', gap: 14, marginBottom: 10 },
  metaText: { fontSize: 12, fontWeight: '700', color: Colors.text2 },

  exerciseList: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  exerciseNum: { width: 18, fontSize: 11, fontWeight: '800', color: Colors.gold },
  exerciseName: { flex: 1, fontSize: 12, color: Colors.text, fontWeight: '600' },
  exerciseMeta: { fontSize: 11, color: Colors.text2, fontWeight: '600' },

  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  miniCard: { width: '48%', backgroundColor: Colors.card, borderRadius: Radii.md, padding: 12, borderWidth: 1, borderColor: Colors.border },
  miniLabel: { fontSize: 10.5, color: Colors.text2, fontWeight: '600', marginBottom: 2 },
  miniVal: { fontSize: 16, fontWeight: '800', color: Colors.text },
  miniUnit: { fontSize: 11, color: Colors.gold, fontWeight: '700' },
  miniSub: { fontSize: 9.5, color: Colors.text2, marginTop: 2 },

  // Readiness gauge
  readinessRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  readinessBadge: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  readinessPct: { fontSize: 17, fontWeight: '900' },
  readinessLbl: { fontSize: 7, fontWeight: '800', color: Colors.text2, letterSpacing: 0.5 },
  readinessBarContainer: { flex: 1, height: 8, backgroundColor: Colors.card2, borderRadius: 4, overflow: 'hidden' },
  readinessBar: { height: '100%', borderRadius: 4 },

  emptyBox: { padding: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  emptySub: { fontSize: 12, color: Colors.text2, textAlign: 'center', lineHeight: 17 },

  closeActionBtn: { backgroundColor: Colors.gold, borderRadius: Radii.md, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  closeActionText: { fontSize: 13, fontWeight: '900', color: '#0A0A0A' },
});

