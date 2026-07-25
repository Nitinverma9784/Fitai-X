import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';

export default function CalendarScreen() {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState('Thu');
  const [travelScenario, setTravelScenario] = useState(false);

  const days = [
    { day: 'Mon', date: '21', status: 'done', title: 'Chest & Triceps' },
    { day: 'Tue', date: '22', status: 'done', title: 'Legs & Core' },
    { day: 'Wed', date: '23', status: 'rest', title: 'Active Recovery' },
    { day: 'Thu', date: '24', status: 'today', title: 'Back & Biceps' },
    { day: 'Fri', date: '25', status: 'planned', title: 'Shoulders & Abs' },
    { day: 'Sat', date: '26', status: 'planned', title: 'Full Body Power' },
    { day: 'Sun', date: '27', status: 'rest', title: 'Rest & Sauna' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Top Header */}
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(tabs)')}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.kicker}>SMART CALENDAR & SCENARIO PLANNER</Text>
          <Text style={styles.headerTitle}>Training Schedule</Text>
        </View>
        <TouchableOpacity
          style={styles.scenarioBtn}
          onPress={() => setTravelScenario(!travelScenario)}>
          <Ionicons name="airplane" size={16} color="#0A0A0A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        {/* Calendar Day Selector Bar */}
        <View style={styles.calendarRow}>
          {days.map((item, idx) => {
            const active = selectedDay === item.day;
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.dayCard,
                  active && styles.dayCardActive,
                  item.status === 'today' && styles.dayCardToday,
                ]}
                onPress={() => setSelectedDay(item.day)}>
                <Text style={[styles.dayName, active && styles.dayNameActive]}>{item.day}</Text>
                <Text style={[styles.dayDate, active && styles.dayDateActive]}>{item.date}</Text>
                <View
                  style={[
                    styles.statusDot,
                    item.status === 'done' && { backgroundColor: Colors.green },
                    item.status === 'today' && { backgroundColor: Colors.gold },
                    item.status === 'rest' && { backgroundColor: Colors.text2 },
                    item.status === 'planned' && { backgroundColor: Colors.brightYellow },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Travel Scenario Planner Alert Banner */}
        {travelScenario && (
          <View style={styles.scenarioBox}>
            <View style={styles.scenarioHead}>
              <Ionicons name="briefcase" size={18} color={Colors.gold} />
              <Text style={styles.scenarioTitle}>Travel Scenario Active</Text>
            </View>
            <Text style={styles.scenarioDesc}>
              Hotel Room Bodyweight & Resistance Band workouts auto-generated for your trip dates (July 28 – Aug 2).
            </Text>
          </View>
        )}

        {/* Selected Day Schedule */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Thursday, July 24 Workouts</Text>
            <Text style={styles.cardTag}>Cascading Recalculated</Text>
          </View>

          <View style={styles.scheduleItem}>
            <View style={styles.timeCol}>
              <Text style={styles.timeText}>07:30 AM</Text>
            </View>
            <View style={styles.itemBox}>
              <Text style={styles.itemTitle}>Back & Biceps Power Hypertrophy</Text>
              <Text style={styles.itemSub}>45 mins • 420 kcal • 4 Exercises</Text>
            </View>
          </View>

          <View style={styles.scheduleItem}>
            <View style={styles.timeCol}>
              <Text style={styles.timeText}>01:00 PM</Text>
            </View>
            <View style={styles.itemBox}>
              <Text style={styles.itemTitle}>Post-Workout Glycogen Replenishment</Text>
              <Text style={styles.itemSub}>High Protein Rice & Chicken Bowl</Text>
            </View>
          </View>

          <View style={styles.scheduleItem}>
            <View style={styles.timeCol}>
              <Text style={styles.timeText}>09:00 PM</Text>
            </View>
            <View style={styles.itemBox}>
              <Text style={styles.itemTitle}>Box Breathing & Sleep Readiness Protocol</Text>
              <Text style={styles.itemSub}>12 mins Thoracic opener + 5 cycles Box Breathing</Text>
            </View>
          </View>
        </View>

        {/* Streak Protection Emergency Fallback */}
        <View style={styles.streakBox}>
          <View style={styles.streakHead}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.green} />
            <Text style={styles.streakTitle}>Streak Protection Ready</Text>
          </View>
          <Text style={styles.streakDesc}>
            Busy day? Launch a 5-minute Micro Workout to keep your 5-day streak intact without heavy exertion.
          </Text>
          <TouchableOpacity style={styles.microBtn}>
            <Ionicons name="flash" size={14} color="#0A0A0A" />
            <Text style={styles.microBtnText}>Start 5-Min Micro Workout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  kicker: {
    fontSize: 9.5,
    fontWeight: '800',
    color: Colors.gold,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  scenarioBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  contentContainer: {
    paddingVertical: Spacing.md,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  dayCard: {
    width: 44,
    paddingVertical: 10,
    borderRadius: Radii.md,
    backgroundColor: Colors.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayCardActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  dayCardToday: {
    borderColor: Colors.gold,
  },
  dayName: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text2,
  },
  dayNameActive: {
    color: '#0A0A0A',
  },
  dayDate: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    marginVertical: 2,
  },
  dayDateActive: {
    color: '#0A0A0A',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  scenarioBox: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: 16,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  scenarioHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  scenarioTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  scenarioDesc: {
    fontSize: 12,
    color: Colors.text2,
    lineHeight: 18,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: 16,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  cardTag: {
    fontSize: 10,
    color: Colors.gold,
    fontWeight: '700',
  },
  scheduleItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  timeCol: {
    width: 64,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.text2,
  },
  itemBox: {
    flex: 1,
    backgroundColor: Colors.card2,
    borderRadius: Radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  itemSub: {
    fontSize: 11,
    color: Colors.text2,
    marginTop: 2,
  },
  streakBox: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.green,
    marginBottom: 20,
  },
  streakHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  streakTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  streakDesc: {
    fontSize: 12,
    color: Colors.text2,
    marginBottom: 12,
  },
  microBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.green,
    borderRadius: Radii.md,
    paddingVertical: 10,
  },
  microBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0A0A0A',
  },
});
