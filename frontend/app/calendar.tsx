import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { groqService } from '@/services/groqService';
import { formatWeightBreakdown } from '@/utils/exerciseUtils';

interface DaySummary {
  log_date: string;
  workout?: {
    id: number;
    title: string;
    status: 'pending' | 'completed' | 'missed';
    duration_minutes: number;
    estimated_calories: number;
    target_muscles?: string[];
    completed_at?: string;
  };
  exerciseLogs?: Array<{
    exerciseName: string;
    weightKg: number;
    barWeightKg?: number;
    plateWeightKg?: number;
    repsAchieved: number;
    isBodyweight?: boolean;
    rpe: number;
  }>;
  recovery?: {
    id: number;
    readiness_percentage: number;
    status_label: string;
    description?: string;
    sleep_hours: number;
    sleep_efficiency: number;
    hrv_ms: number;
    hydration_l: number;
    muscle_soreness: string;
  };
  nutrition?: {
    totalProteinG: number;
    totalCarbsG: number;
    totalFatsG: number;
    totalCalories: number;
    mealCount: number;
    meals?: Array<{ mealType: string; foodItem: string; proteinG: number; calories: number }>;
  };
}

export default function CalendarScreen() {
  const router = useRouter();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayNum, setSelectedDayNum] = useState<number>(today.getDate());
  const [calendarSummary, setCalendarSummary] = useState<Record<string, DaySummary>>({});
  const [loading, setLoading] = useState(false);

  const fetchCalendarLogs = useCallback(async () => {
    setLoading(true);
    try {
      const summary = await groqService.getCalendarSummary();
      if (summary) {
        setCalendarSummary(summary);
      }
    } catch {
      // Clean fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendarLogs();
  }, [fetchCalendarLogs]);

  const monthName = currentDate.toLocaleString('en-US', { month: 'long' });
  const yearNum = currentDate.getFullYear();
  const totalDaysInMonth = new Date(yearNum, currentDate.getMonth() + 1, 0).getDate();

  const handlePrevMonth = () => {
    const prev = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(prev);
    setSelectedDayNum(1);
  };

  const handleNextMonth = () => {
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(next);
    setSelectedDayNum(1);
  };

  // Format YYYY-MM-DD for selected day lookup
  const selectedDateStr = `${yearNum}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDayNum).padStart(2, '0')}`;
  const selectedDayLog = calendarSummary[selectedDateStr];

  // Map logged days for dot indicator
  const loggedDayNums = new Set<number>();
  Object.keys(calendarSummary).forEach(dateStr => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      if (y === yearNum && m === (currentDate.getMonth() + 1)) {
        loggedDayNums.add(d);
      }
    }
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Top Header */}
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(tabs)')}>
          <Ionicons name="arrow-back" size={18} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Calendar</Text>
          <Text style={styles.headerSub}>{monthName.substring(0, 3)} {yearNum}</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchCalendarLogs} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.gold} />
          ) : (
            <Ionicons name="refresh" size={16} color={Colors.text2} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>

        {/* Month Navigation Header */}
        <View style={styles.monthNavRow}>
          <TouchableOpacity style={styles.navBtn} onPress={handlePrevMonth}>
            <Ionicons name="chevron-back" size={16} color={Colors.text2} />
          </TouchableOpacity>
          <Text style={styles.monthNavTitle}>{monthName} {yearNum}</Text>
          <TouchableOpacity style={styles.navBtn} onPress={handleNextMonth}>
            <Ionicons name="chevron-forward" size={16} color={Colors.text2} />
          </TouchableOpacity>
        </View>

        {/* 7x5 Month Grid Card */}
        <View style={styles.gridCard}>
          {/* Day Headers Row */}
          <View style={styles.weekHeaderGrid}>
            {(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const).map(day => (
              <Text key={day} style={styles.weekDayHead}>{day}</Text>
            ))}
          </View>

          {/* Day Cells Grid */}
          <View style={styles.daysGrid}>
            {Array.from({ length: totalDaysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isSelected = selectedDayNum === dayNum;
              const isToday = today.getFullYear() === yearNum && (today.getMonth() + 1) === (currentDate.getMonth() + 1) && today.getDate() === dayNum;
              const hasData = loggedDayNums.has(dayNum);

              return (
                <TouchableOpacity
                  key={dayNum}
                  style={[
                    styles.daySquare,
                    isSelected && styles.daySquareSelected,
                    !isSelected && isToday && styles.daySquareToday,
                    !isSelected && hasData && styles.daySquareHasData,
                  ]}
                  onPress={() => setSelectedDayNum(dayNum)}
                  activeOpacity={0.8}>
                  <Text style={[
                    styles.dayNumText,
                    isSelected && styles.dayNumSelected,
                    !isSelected && isToday && styles.dayNumToday,
                    !isSelected && hasData && styles.dayNumHasData,
                  ]}>
                    {dayNum}
                  </Text>
                  {hasData && (
                    <View style={[styles.dataDot, isSelected && { backgroundColor: '#0A0A0A' }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Day Analytics Inspector Header */}
        <View style={styles.inspectorHeader}>
          <Text style={styles.inspectorLabel}>
            {monthName} {selectedDayNum}, {yearNum} Performance Logs
          </Text>
        </View>

        {selectedDayLog && (selectedDayLog.workout || selectedDayLog.recovery || selectedDayLog.nutrition || (selectedDayLog.exerciseLogs && selectedDayLog.exerciseLogs.length > 0)) ? (
          <View style={styles.card}>
            
            {/* 1. WORKOUT & EXERCISE LOGS SECTION */}
            {selectedDayLog.workout || (selectedDayLog.exerciseLogs && selectedDayLog.exerciseLogs.length > 0) ? (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  {selectedDayLog.workout?.status === 'completed' ? (
                    <View style={[styles.statusBadge, styles.badgeCompleted]}>
                      <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                      <Text style={[styles.statusBadgeText, { color: '#10B981' }]}>WORKOUT COMPLETED</Text>
                    </View>
                  ) : selectedDayLog.workout?.status === 'missed' ? (
                    <View style={[styles.statusBadge, styles.badgeMissed]}>
                      <Ionicons name="close-circle" size={12} color="#EF4444" />
                      <Text style={[styles.statusBadgeText, { color: '#EF4444' }]}>WORKOUT MISSED</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, styles.badgePending]}>
                      <Ionicons name="time" size={12} color={Colors.gold} />
                      <Text style={[styles.statusBadgeText, { color: Colors.gold }]}>PLANNED WORKOUT</Text>
                    </View>
                  )}
                  {selectedDayLog.workout?.estimated_calories ? (
                    <Text style={styles.workoutCalsText}>🔥 {selectedDayLog.workout.estimated_calories} kcal</Text>
                  ) : null}
                </View>

                {selectedDayLog.workout && (
                  <View style={styles.workoutBox}>
                    <Text style={styles.workoutBoxTitle}>{selectedDayLog.workout.title}</Text>
                    <Text style={styles.workoutMetaSub}>
                      ⏱️ {selectedDayLog.workout.duration_minutes} mins • {selectedDayLog.workout.target_muscles?.join(', ') || 'Targeted Muscle Focus'}
                    </Text>
                  </View>
                )}

                {/* Logged Weights & Reps List */}
                {selectedDayLog.exerciseLogs && selectedDayLog.exerciseLogs.length > 0 && (
                  <View style={styles.exerciseLogList}>
                    <Text style={styles.exerciseLogListTag}>RECORDED WEIGHTS &amp; REPS (FOR OVERLOAD)</Text>
                    {selectedDayLog.exerciseLogs.map((exLog, idx) => (
                      <View key={idx} style={styles.exLogRow}>
                        <Ionicons name="barbell-outline" size={14} color={Colors.gold} />
                        <Text style={styles.exLogName}>{exLog.exerciseName}:</Text>
                        <Text style={styles.exLogVal}>
                          {formatWeightBreakdown(exLog)} × {exLog.repsAchieved} reps (RPE {exLog.rpe})
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.emptySectionRow}>
                <Ionicons name="barbell-outline" size={16} color={Colors.text2} />
                <Text style={styles.emptySectionText}>No workout session logged for this day</Text>
              </View>
            )}

            {/* 2. RECOVERY & SLEEP SECTION */}
            {selectedDayLog.recovery ? (
              <View style={[styles.sectionBlock, { marginTop: 12 }]}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.logPill}>
                    <Ionicons name="moon" size={12} color={Colors.gold} />
                    <Text style={styles.logPillText}>BIO-RECOVERY &amp; SLEEP</Text>
                  </View>
                  <Text style={styles.readinessScoreText}>
                    Readiness {selectedDayLog.recovery.readiness_percentage}%
                  </Text>
                </View>

                <View style={styles.grid2}>
                  <View style={styles.miniCard}>
                    <Text style={styles.miniLabel}>Sleep Duration</Text>
                    <Text style={styles.miniVal}>
                      {selectedDayLog.recovery.sleep_hours} <Text style={styles.miniUnit}>hrs</Text>
                    </Text>
                    <Text style={styles.miniSub}>{selectedDayLog.recovery.sleep_efficiency}% Efficiency</Text>
                  </View>

                  <View style={styles.miniCard}>
                    <Text style={styles.miniLabel}>Wearable HRV</Text>
                    <Text style={styles.miniVal}>
                      {selectedDayLog.recovery.hrv_ms} <Text style={styles.miniUnit}>ms</Text>
                    </Text>
                    <Text style={styles.miniSub}>Heart Rate Score</Text>
                  </View>

                  <View style={styles.miniCard}>
                    <Text style={styles.miniLabel}>Water Intake</Text>
                    <Text style={styles.miniVal}>
                      {selectedDayLog.recovery.hydration_l} <Text style={styles.miniUnit}>L</Text>
                    </Text>
                    <Text style={styles.miniSub}>Hydration Logged</Text>
                  </View>

                  <View style={styles.miniCard}>
                    <Text style={styles.miniLabel}>Muscle Soreness</Text>
                    <Text style={styles.miniVal}>{selectedDayLog.recovery.muscle_soreness}</Text>
                    <Text style={styles.miniSub}>Athlete Status</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.emptySectionRow}>
                <Ionicons name="moon-outline" size={16} color={Colors.text2} />
                <Text style={styles.emptySectionText}>No sleep/bio-recovery logged for this day</Text>
              </View>
            )}

            {/* 3. NUTRITION & MACROS SECTION */}
            {selectedDayLog.nutrition && selectedDayLog.nutrition.mealCount > 0 ? (
              <View style={[styles.sectionBlock, { marginTop: 12 }]}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.macroPill}>
                    <Ionicons name="restaurant" size={12} color="#3B82F6" />
                    <Text style={styles.macroPillText}>NUTRITION &amp; MACROS</Text>
                  </View>
                  <Text style={styles.macroTotalCals}>
                    {selectedDayLog.nutrition.totalCalories} kcal Total
                  </Text>
                </View>

                <View style={styles.grid2}>
                  <View style={styles.miniCard}>
                    <Text style={styles.miniLabel}>Protein Consumed</Text>
                    <Text style={[styles.miniVal, { color: Colors.gold }]}>
                      {selectedDayLog.nutrition.totalProteinG} <Text style={styles.miniUnit}>g</Text>
                    </Text>
                    <Text style={styles.miniSub}>Muscle Repair</Text>
                  </View>

                  <View style={styles.miniCard}>
                    <Text style={styles.miniLabel}>Carbohydrates</Text>
                    <Text style={styles.miniVal}>
                      {selectedDayLog.nutrition.totalCarbsG} <Text style={styles.miniUnit}>g</Text>
                    </Text>
                    <Text style={styles.miniSub}>Glycogen Fuel</Text>
                  </View>

                  <View style={styles.miniCard}>
                    <Text style={styles.miniLabel}>Healthy Fats</Text>
                    <Text style={styles.miniVal}>
                      {selectedDayLog.nutrition.totalFatsG} <Text style={styles.miniUnit}>g</Text>
                    </Text>
                    <Text style={styles.miniSub}>Hormone Health</Text>
                  </View>

                  <View style={styles.miniCard}>
                    <Text style={styles.miniLabel}>Meals Logged</Text>
                    <Text style={styles.miniVal}>
                      {selectedDayLog.nutrition.mealCount} <Text style={styles.miniUnit}>meals</Text>
                    </Text>
                    <Text style={styles.miniSub}>Daily Schedule</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.emptySectionRow}>
                <Ionicons name="nutrition-outline" size={16} color={Colors.text2} />
                <Text style={styles.emptySectionText}>No meal or macro logs recorded for this day</Text>
              </View>
            )}

          </View>
        ) : (
          /* Empty State for Day */
          <View style={styles.noDataCard}>
            <Ionicons name="calendar-outline" size={26} color={Colors.text2} style={{ marginBottom: 8 }} />
            <Text style={styles.noDataTitle}>No Activity Logged On This Day</Text>
            <Text style={styles.noDataSub}>
              You didn't log workouts, sleep/recovery, or nutrition metrics on {monthName} {selectedDayNum}, {yearNum}.
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg, paddingTop: (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0) + 12 },
  container: { flex: 1, paddingHorizontal: Spacing.lg },
  contentContainer: { paddingBottom: 100 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: Spacing.md },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  refreshBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTextCol: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 11, color: Colors.text2, marginTop: 1 },

  monthNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  navBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  monthNavTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },

  gridCard: { backgroundColor: Colors.card, borderRadius: Radii.xl, padding: 16, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  weekHeaderGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  weekDayHead: { width: '13%', textAlign: 'center', fontSize: 11, fontWeight: '700', color: Colors.text2 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  daySquare: { width: '13%', aspectRatio: 1, borderRadius: Radii.md, backgroundColor: Colors.card2, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  daySquareSelected: { backgroundColor: Colors.gold },
  daySquareToday: { borderWidth: 1.5, borderColor: Colors.gold },
  daySquareHasData: { borderWidth: 1, borderColor: 'rgba(245,196,0,0.4)' },
  dayNumText: { fontSize: 12, fontWeight: '700', color: Colors.text2 },
  dayNumSelected: { color: '#0A0A0A', fontWeight: '900' },
  dayNumToday: { color: Colors.gold, fontWeight: '900' },
  dayNumHasData: { color: Colors.text },
  dataDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.gold, position: 'absolute', bottom: 4 },

  inspectorHeader: { marginBottom: 10 },
  inspectorLabel: { fontSize: 11, fontWeight: '800', color: Colors.text2, letterSpacing: 0.8, textTransform: 'uppercase' },

  card: { backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 16, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  sectionBlock: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', paddingBottom: 14 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },

  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  badgeCompleted: { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)' },
  badgePending: { backgroundColor: 'rgba(245,196,0,0.12)', borderColor: 'rgba(245,196,0,0.3)' },
  badgeMissed: { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  workoutCalsText: { fontSize: 11, fontWeight: '800', color: Colors.text2 },

  logPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245,196,0,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(245,196,0,0.3)' },
  logPillText: { fontSize: 10, fontWeight: '800', color: Colors.gold },
  readinessScoreText: { fontSize: 12, fontWeight: '800', color: Colors.green },

  macroPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(59,130,246,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)' },
  macroPillText: { fontSize: 10, fontWeight: '800', color: '#3B82F6' },
  macroTotalCals: { fontSize: 12, fontWeight: '800', color: Colors.text },

  workoutBox: { backgroundColor: Colors.card2, borderRadius: Radii.md, padding: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  workoutBoxTitle: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 3 },
  workoutMetaSub: { fontSize: 11, color: Colors.text2, fontWeight: '600' },

  exerciseLogList: { backgroundColor: Colors.card2, borderRadius: Radii.md, padding: 10, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  exerciseLogListTag: { fontSize: 8.5, fontWeight: '800', color: Colors.gold, letterSpacing: 0.8, marginBottom: 2 },
  exLogRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  exLogName: { fontSize: 11.5, fontWeight: '700', color: Colors.text },
  exLogVal: { fontSize: 11, color: Colors.text2, flex: 1 },

  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  miniCard: { width: '48%', backgroundColor: Colors.card2, borderRadius: Radii.md, padding: 12, borderWidth: 1, borderColor: Colors.border },
  miniLabel: { fontSize: 10.5, color: Colors.text2, fontWeight: '700' },
  miniVal: { fontSize: 16, fontWeight: '800', color: Colors.text, marginVertical: 2 },
  miniUnit: { fontSize: 10, color: Colors.text2 },
  miniSub: { fontSize: 9.5, color: Colors.text2 },

  emptySectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  emptySectionText: { fontSize: 11.5, color: Colors.text2, fontWeight: '600' },

  noDataCard: { backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  noDataTitle: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  noDataSub: { fontSize: 12, color: Colors.text2, textAlign: 'center', lineHeight: 18 },
});
