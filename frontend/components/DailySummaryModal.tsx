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
            {data.hasData ? (
              <>
                {/* AI Daily Performance Summary */}
                <View style={s.aiBox}>
                  <Text style={s.aiBoxTitle}>🤖 AI DAILY PERFORMANCE SYNTHESIS</Text>
                  <Text style={s.aiBoxDesc}>
                    {data.aiSummary || `On ${dateFormatted}, you achieved a ${data.readinessPercentage || 88}% bio-readiness score with ${data.sleepHours || 7.5} hours of sleep and completed your planned session.`}
                  </Text>
                </View>

                {/* Workout Section */}
                {data.workoutTitle ? (
                  <View style={s.sectionBox}>
                    <Text style={s.sectionLabel}>COMPLETED WORKOUT SESSION</Text>
                    <Text style={s.workoutTitle}>{data.workoutTitle}</Text>
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
                ) : null}

                {/* Logged Bio-Metrics */}
                <Text style={s.sectionLabel}>RECORDED BIO-RECOVERY METRICS</Text>
                <View style={s.grid2}>
                  <View style={s.miniCard}>
                    <Text style={s.miniLabel}>Sleep Duration</Text>
                    <Text style={s.miniVal}>{data.sleepHours || 7.5} <Text style={s.miniUnit}>hrs</Text></Text>
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
            ) : (
              <View style={s.emptyBox}>
                <Ionicons name="calendar-outline" size={28} color={Colors.text2} style={{ marginBottom: 8 }} />
                <Text style={s.emptyTitle}>No Data Logged On This Date</Text>
                <Text style={s.emptySub}>
                  No workout logs or bio-recovery metrics were recorded on {dateFormatted}.
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

  aiBox: { backgroundColor: 'rgba(245,196,0,0.08)', borderRadius: Radii.md, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(245,196,0,0.2)' },
  aiBoxTitle: { fontSize: 10.5, fontWeight: '800', color: Colors.gold, letterSpacing: 0.5, marginBottom: 4 },
  aiBoxDesc: { fontSize: 12, color: Colors.text, lineHeight: 18 },

  sectionLabel: { fontSize: 10.5, fontWeight: '800', color: Colors.text2, letterSpacing: 0.8, marginBottom: 8, marginTop: 4 },
  sectionBox: { backgroundColor: Colors.card, borderRadius: Radii.md, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  workoutTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  metaRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  metaText: { fontSize: 12, fontWeight: '700', color: Colors.gold },

  exerciseList: { gap: 6 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, borderTopWidth: 1, borderTopColor: Colors.border },
  exerciseNum: { fontSize: 11, fontWeight: '800', color: Colors.gold, width: 16 },
  exerciseName: { fontSize: 12, fontWeight: '700', color: Colors.text, flex: 1 },
  exerciseMeta: { fontSize: 11, color: Colors.text2, fontWeight: '600' },

  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  miniCard: { width: '48%', backgroundColor: Colors.card, borderRadius: Radii.md, padding: 12, borderWidth: 1, borderColor: Colors.border },
  miniLabel: { fontSize: 10.5, color: Colors.text2, fontWeight: '700' },
  miniVal: { fontSize: 16, fontWeight: '800', color: Colors.text, marginVertical: 2 },
  miniUnit: { fontSize: 10, color: Colors.text2 },
  miniSub: { fontSize: 9.5, color: Colors.text2 },

  emptyBox: { backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, marginVertical: 10 },
  emptyTitle: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  emptySub: { fontSize: 12, color: Colors.text2, textAlign: 'center', lineHeight: 18 },

  closeActionBtn: { backgroundColor: Colors.card2, borderRadius: Radii.md, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  closeActionText: { fontSize: 13, fontWeight: '800', color: Colors.text },
});
