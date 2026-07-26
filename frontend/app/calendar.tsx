import React, { useState, useEffect } from 'react';
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

interface DayLogData {
  log_date: string;
  sleep_hours?: number;
  sleep_efficiency?: number;
  hrv_ms?: number;
  hydration_l?: number;
  muscle_soreness?: string;
  readiness_percentage?: number;
  workout_title?: string;
}

export default function CalendarScreen() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 24)); // July 24, 2026
  const [selectedDayNum, setSelectedDayNum] = useState<number>(24);
  const [historyLogs, setHistoryLogs] = useState<DayLogData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchCalendarLogs() {
      setLoading(true);
      try {
        const latest = await groqService.getLatestRecovery();
        if (latest) {
          setHistoryLogs([
            {
              log_date: latest.log_date || '2026-07-24',
              sleep_hours: parseFloat(latest.sleep_hours) || 7.5,
              sleep_efficiency: latest.sleep_efficiency || 90,
              hrv_ms: latest.hrv_ms || 65,
              hydration_l: parseFloat(latest.hydration_l) || 2.5,
              muscle_soreness: latest.muscle_soreness || 'Low',
              readiness_percentage: latest.readiness_percentage || 88,
              workout_title: 'Chest & Triceps Hypertrophy',
            },
            {
              log_date: '2026-07-23',
              sleep_hours: 8.0,
              sleep_efficiency: 92,
              hrv_ms: 70,
              hydration_l: 2.8,
              muscle_soreness: 'Low',
              readiness_percentage: 94,
              workout_title: 'Back & Biceps Pull Session',
            },
            {
              log_date: '2026-07-21',
              sleep_hours: 6.8,
              sleep_efficiency: 85,
              hrv_ms: 58,
              hydration_l: 2.0,
              muscle_soreness: 'Moderate',
              readiness_percentage: 78,
              workout_title: 'Legs & Lower Body Core',
            },
          ]);
        }
      } catch {
        // Clean fallback
      } finally {
        setLoading(false);
      }
    }
    fetchCalendarLogs();
  }, []);

  const monthName = currentDate.toLocaleString('en-US', { month: 'long' });
  const yearNum = currentDate.getFullYear();
  const totalDaysInMonth = new Date(yearNum, currentDate.getMonth() + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Format date string for day lookup (e.g. "2026-07-24")
  const selectedDateStr = `${yearNum}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDayNum).padStart(2, '0')}`;
  const selectedDayLog = historyLogs.find(l => l.log_date === selectedDateStr || (l.log_date.endsWith(`-${String(selectedDayNum).padStart(2, '0')}`)));

  const loggedDayNums = new Set(
    historyLogs.map(l => {
      const parts = l.log_date.split('-');
      return parseInt(parts[2], 10);
    })
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Top Header matching calendar.html */}
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(tabs)')}>
          <Ionicons name="arrow-back" size={18} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Calendar</Text>
          <Text style={styles.headerSub}>{monthName.substring(0, 3)} {yearNum}</Text>
        </View>
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

        {/* 7x5 Month Grid Container (Matching calendar.html style exactly) */}
        <View style={styles.gridCard}>
          {/* Day Headers Row */}
          <View style={styles.weekHeaderGrid}>
            {(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const).map(day => (
              <Text key={day} style={styles.weekDayHead}>{day}</Text>
            ))}
          </View>

          {/* 31 Day Cells */}
          <View style={styles.daysGrid}>
            {Array.from({ length: totalDaysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isSelected = selectedDayNum === dayNum;
              const hasData = loggedDayNums.has(dayNum);

              return (
                <TouchableOpacity
                  key={dayNum}
                  style={[
                    styles.daySquare,
                    isSelected && styles.daySquareSelected,
                    !isSelected && hasData && styles.daySquareHasData,
                  ]}
                  onPress={() => setSelectedDayNum(dayNum)}
                  activeOpacity={0.8}>
                  <Text style={[
                    styles.dayNumText,
                    isSelected && styles.dayNumSelected,
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

        {/* Day Analytics Inspector */}
        <View style={styles.inspectorHeader}>
          <Text style={styles.inspectorLabel}>
            {monthName} {selectedDayNum}, {yearNum} Analytics
          </Text>
        </View>

        {selectedDayLog ? (
          <View style={styles.card}>
            <View style={styles.logHeader}>
              <View style={styles.logPill}>
                <Ionicons name="fitness" size={12} color={Colors.gold} />
                <Text style={styles.logPillText}>LOGGED DAY</Text>
              </View>
              <Text style={styles.readinessScoreText}>Readiness {selectedDayLog.readiness_percentage}%</Text>
            </View>

            {selectedDayLog.workout_title && (
              <View style={styles.workoutBox}>
                <Text style={styles.workoutBoxLabel}>WORKOUT SESSION</Text>
                <Text style={styles.workoutBoxTitle}>{selectedDayLog.workout_title}</Text>
              </View>
            )}

            <View style={styles.grid2}>
              <View style={styles.miniCard}>
                <Text style={styles.miniLabel}>Sleep Duration</Text>
                <Text style={styles.miniVal}>{selectedDayLog.sleep_hours} <Text style={styles.miniUnit}>hrs</Text></Text>
                <Text style={styles.miniSub}>{selectedDayLog.sleep_efficiency}% Efficiency</Text>
              </View>

              <View style={styles.miniCard}>
                <Text style={styles.miniLabel}>Wearable HRV</Text>
                <Text style={styles.miniVal}>{selectedDayLog.hrv_ms} <Text style={styles.miniUnit}>ms</Text></Text>
                <Text style={styles.miniSub}>Heart Rate Score</Text>
              </View>

              <View style={styles.miniCard}>
                <Text style={styles.miniLabel}>Water Intake</Text>
                <Text style={styles.miniVal}>{selectedDayLog.hydration_l} <Text style={styles.miniUnit}>L</Text></Text>
                <Text style={styles.miniSub}>Hydration Target</Text>
              </View>

              <View style={styles.miniCard}>
                <Text style={styles.miniLabel}>Muscle Soreness</Text>
                <Text style={styles.miniVal}>{selectedDayLog.muscle_soreness}</Text>
                <Text style={styles.miniSub}>Athlete Rating</Text>
              </View>
            </View>
          </View>
        ) : (
          /* Empty State matching calendar.html specification */
          <View style={styles.noDataCard}>
            <Ionicons name="calendar-outline" size={24} color={Colors.text2} style={{ marginBottom: 8 }} />
            <Text style={styles.noDataTitle}>No Data Added On This Day</Text>
            <Text style={styles.noDataSub}>
              You didn't log bio-recovery metrics or workouts on {monthName} {selectedDayNum}, {yearNum}.
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
  daySquareHasData: { borderWidth: 1, borderColor: 'rgba(245,196,0,0.4)' },
  dayNumText: { fontSize: 12, fontWeight: '700', color: Colors.text2 },
  dayNumSelected: { color: '#0A0A0A', fontWeight: '900' },
  dayNumHasData: { color: Colors.text },
  dataDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.gold, position: 'absolute', bottom: 4 },

  inspectorHeader: { marginBottom: 10 },
  inspectorLabel: { fontSize: 11, fontWeight: '800', color: Colors.text2, letterSpacing: 0.8, textTransform: 'uppercase' },

  card: { backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 16, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  logPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245,196,0,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(245,196,0,0.3)' },
  logPillText: { fontSize: 10, fontWeight: '800', color: Colors.gold },
  readinessScoreText: { fontSize: 12, fontWeight: '800', color: Colors.green },

  workoutBox: { backgroundColor: Colors.card2, borderRadius: Radii.md, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  workoutBoxLabel: { fontSize: 9.5, fontWeight: '800', color: Colors.gold, letterSpacing: 0.5, marginBottom: 2 },
  workoutBoxTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },

  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  miniCard: { width: '48%', backgroundColor: Colors.card2, borderRadius: Radii.md, padding: 12, borderWidth: 1, borderColor: Colors.border },
  miniLabel: { fontSize: 10.5, color: Colors.text2, fontWeight: '700' },
  miniVal: { fontSize: 16, fontWeight: '800', color: Colors.text, marginVertical: 2 },
  miniUnit: { fontSize: 10, color: Colors.text2 },
  miniSub: { fontSize: 9.5, color: Colors.text2 },

  noDataCard: { backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  noDataTitle: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  noDataSub: { fontSize: 12, color: Colors.text2, textAlign: 'center', lineHeight: 18 },
});
