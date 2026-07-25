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
import { Colors, Radii, Spacing } from '@/constants/theme';
import {
  TrendingUpIcon, BarbellIcon, FlameIcon,
  CheckIcon, HeartIcon, ZapIcon,
} from '@/components/icons/SvgIcons';

export default function AnalyticsScreen() {
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '1Y' | 'ALL'>('7D');

  const weeklyVolume = [
    { day: 'Mon', vol: 3200, height: '60%' },
    { day: 'Tue', vol: 4500, height: '85%' },
    { day: 'Wed', vol: 1800, height: '40%' },
    { day: 'Thu', vol: 5200, height: '100%' },
    { day: 'Fri', vol: 4100, height: '75%' },
    { day: 'Sat', vol: 0, height: '0%' },
    { day: 'Sun', vol: 2400, height: '45%' },
  ];

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
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>LIVE METRICS</Text>
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

        {/* Overall Fitness Score Card - Matching 2_analytics.html */}
        <View style={styles.card}>
          <View style={styles.scoreRow}>
            <View>
              <Text style={styles.scoreLabel}>OVERALL FITNESS SCORE</Text>
              <Text style={styles.scoreBig}>
                88<Text style={styles.scoreSmall}>/100</Text>
              </Text>
              <Text style={styles.scoreMsg}>↑ +3.4% vs last week</Text>
            </View>

            <View style={styles.ringGraphic}>
              <Text style={styles.ringNum}>88</Text>
              <Text style={styles.ringLabel}>EXCELLENT</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Sub Metrics Breakdown */}
          <View style={styles.subGrid}>
            <View style={styles.subItem}>
              <ZapIcon size={16} color={Colors.gold} />
              <Text style={styles.subVal}>92%</Text>
              <Text style={styles.subLabel}>Power Output</Text>
            </View>
            <View style={styles.subItem}>
              <FlameIcon size={16} color={Colors.amberGold} />
              <Text style={styles.subVal}>84%</Text>
              <Text style={styles.subLabel}>Cardio Strain</Text>
            </View>
            <View style={styles.subItem}>
              <CheckIcon size={16} color={Colors.green} />
              <Text style={styles.subVal}>96%</Text>
              <Text style={styles.subLabel}>Consistency</Text>
            </View>
          </View>
        </View>

        {/* 1RM Strength Progression */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>1RM Estimated PR Progression</Text>
          <View style={styles.prGrid}>
            <View style={styles.prItem}>
              <Text style={styles.prName}>Bench Press</Text>
              <Text style={styles.prVal}>105 <Text style={styles.prUnit}>kg</Text></Text>
              <Text style={styles.prTrend}>+5kg this month</Text>
            </View>
            <View style={styles.prItem}>
              <Text style={styles.prName}>Barbell Squat</Text>
              <Text style={styles.prVal}>140 <Text style={styles.prUnit}>kg</Text></Text>
              <Text style={styles.prTrend}>+7.5kg this month</Text>
            </View>
            <View style={styles.prItem}>
              <Text style={styles.prName}>Deadlift</Text>
              <Text style={styles.prVal}>165 <Text style={styles.prUnit}>kg</Text></Text>
              <Text style={styles.prTrend}>+10kg this month</Text>
            </View>
          </View>
        </View>

        {/* Training Volume Chart */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Weekly Volume Load (kg)</Text>
            <Text style={styles.cardSub}>Total: 21,200 kg</Text>
          </View>

          <View style={styles.chartArea}>
            {weeklyVolume.map((item, idx) => (
              <View key={idx} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: item.height as any },
                      item.vol === 5200 && { backgroundColor: Colors.brightYellow },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Muscle Group Fatigue Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Muscle Group Fatigue & Recovery</Text>

          <View style={styles.fatigueRow}>
            <Text style={styles.muscleName}>Chest & Triceps</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: '85%', backgroundColor: Colors.amberGold }]} />
            </View>
            <Text style={styles.fatigueText}>85% High Load</Text>
          </View>

          <View style={styles.fatigueRow}>
            <Text style={styles.muscleName}>Legs & Quads</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: '25%', backgroundColor: Colors.green }]} />
            </View>
            <Text style={styles.fatigueText}>25% Fully Rested</Text>
          </View>

          <View style={styles.fatigueRow}>
            <Text style={styles.muscleName}>Back & Biceps</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: '45%', backgroundColor: Colors.gold }]} />
            </View>
            <Text style={styles.fatigueText}>45% Moderate Rest</Text>
          </View>
        </View>

        {/* Achievements Carousel */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Unlocked Achievements</Text>
          <Text style={styles.seeAll}>View All (14)</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeRow}>
          {[
            { title: "100 Workouts", icon: BarbellIcon, color: Colors.gold },
            { title: "5 Day Streak", icon: FlameIcon, color: Colors.amberGold },
            { title: "1,000kg Volume", icon: TrendingUpIcon, color: Colors.brightYellow },
            { title: "HRV Master", icon: HeartIcon, color: Colors.green },
          ].map((b, i) => {
            const IconComp = b.icon;
            return (
              <View key={i} style={styles.badgeCard}>
                <View style={[styles.badgeHex, { borderColor: b.color }]}>
                  <IconComp size={24} color={b.color} />
                </View>
                <Text style={styles.badgeTitle}>{b.title}</Text>
              </View>
            );
          })}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  container: { flex: 1, paddingHorizontal: Spacing.lg },
  contentContainer: { paddingBottom: 100 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: Spacing.md },
  kicker: { fontSize: 10.5, fontWeight: '800', color: Colors.gold, letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginTop: 2 },
  timeBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radii.full, backgroundColor: Colors.card2, borderWidth: 1, borderColor: Colors.border },
  timeBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.gold },
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
  prName: { fontSize: 10, fontWeight: '700', color: Colors.text2 },
  prVal: { fontSize: 16, fontWeight: '800', color: Colors.gold, marginVertical: 2 },
  prUnit: { fontSize: 11, color: Colors.text2 },
  prTrend: { fontSize: 9, color: Colors.green, fontWeight: '700' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  cardSub: { fontSize: 11, color: Colors.gold, fontWeight: '700' },
  chartArea: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 130, paddingTop: 10 },
  barCol: { alignItems: 'center', height: '100%', justifyContent: 'flex-end', width: 28 },
  barTrack: { width: 14, height: 95, backgroundColor: Colors.card2, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', backgroundColor: Colors.gold, borderRadius: 6 },
  barLabel: { fontSize: 10, color: Colors.text2, marginTop: 6, fontWeight: '600' },
  fatigueRow: { marginBottom: 12 },
  muscleName: { fontSize: 12, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  track: { height: 8, backgroundColor: Colors.card2, borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  fill: { height: '100%', borderRadius: 4 },
  fatigueText: { fontSize: 10, color: Colors.text2, textAlign: 'right' },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  seeAll: { fontSize: 12, color: Colors.gold, fontWeight: '700' },
  badgeRow: { marginBottom: 16 },
  badgeCard: { alignItems: 'center', marginRight: 14, width: 90 },
  badgeHex: { width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.card, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  badgeTitle: { fontSize: 11, fontWeight: '700', color: Colors.text, textAlign: 'center' },
});
