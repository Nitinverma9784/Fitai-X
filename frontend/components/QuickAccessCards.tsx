import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

// ─── Mini Bar Chart (Analytics card visual) ────────────────────────────────────
function MiniBarChart() {
  const bars = [
    { h: 38, active: false },
    { h: 58, active: false },
    { h: 44, active: false },
    { h: 75, active: false },
    { h: 55, active: false },
    { h: 90, active: true  },
    { h: 68, active: false },
  ];
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <View style={bc.root}>
      {bars.map((b, i) => (
        <View key={i} style={bc.col}>
          <View style={bc.barTrack}>
            <View
              style={[
                bc.bar,
                {
                  height: Math.round((b.h / 100) * 52),
                  backgroundColor: b.active ? Colors.gold : 'rgba(245,196,0,0.22)',
                  borderRadius: b.active ? 4 : 3,
                },
              ]}
            />
          </View>
          <Text style={[bc.day, b.active && { color: Colors.gold }]}>{days[i]}</Text>
        </View>
      ))}
    </View>
  );
}
const bc = StyleSheet.create({
  root:     { flexDirection: 'row', gap: 5, alignItems: 'flex-end', marginTop: 14 },
  col:      { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: { height: 52, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar:      { width: '100%' },
  day:      { fontSize: 8.5, fontWeight: '700', color: 'rgba(176,170,154,0.6)' },
});

// ─── Calorie Ring (Nutrition card visual) ──────────────────────────────────────
function CalorieRing({ pct = 72 }: { pct?: number }) {
  const SIZE = 72;
  const THICK = 8;
  const inner = SIZE - THICK * 2;
  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      {/* BG ring */}
      <View style={[rng.ring, { width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderColor: 'rgba(74,222,128,0.15)', borderWidth: THICK }]} />
      {/* Progress ring (simplified full circle with opacity) */}
      <View style={[rng.ring, {
        position: 'absolute',
        width: SIZE, height: SIZE, borderRadius: SIZE / 2,
        borderColor: '#4ADE80',
        borderWidth: THICK,
        opacity: 0.85,
        // Clip right half to simulate partial fill
        borderRightColor: 'transparent',
        borderBottomColor: pct > 50 ? '#4ADE80' : 'transparent',
        transform: [{ rotate: '-45deg' }],
      }]} />
      {/* Inner dark circle */}
      <View style={{
        position: 'absolute',
        width: inner, height: inner, borderRadius: inner / 2,
        backgroundColor: '#091410',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={rng.pct}>{pct}%</Text>
        <Text style={rng.lbl}>daily</Text>
      </View>
    </View>
  );
}
const rng = StyleSheet.create({
  ring: { position: 'absolute' },
  pct:  { fontSize: 14, fontWeight: '900', color: '#4ADE80' },
  lbl:  { fontSize: 8,  fontWeight: '700', color: 'rgba(176,170,154,0.7)', marginTop: -1 },
});

// ─── Macro Row (Nutrition card) ────────────────────────────────────────────────
function MacroRow({ label, val, color }: { label: string; val: string; color: string }) {
  return (
    <View style={mr.row}>
      <View style={[mr.dot, { backgroundColor: color }]} />
      <Text style={mr.label}>{label}</Text>
      <Text style={[mr.val, { color }]}>{val}</Text>
    </View>
  );
}
const mr = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  dot:   { width: 6, height: 6, borderRadius: 3 },
  label: { flex: 1, fontSize: 11, fontWeight: '600', color: Colors.text2 },
  val:   { fontSize: 11, fontWeight: '800' },
});

// ─── Main Export ───────────────────────────────────────────────────────────────
export function QuickAccessCards() {
  const router = useRouter();

  return (
    <View style={s.section}>

      {/* ════════════════════════════════════════════════════
          CARD 1 — ANALYTICS
          Gold-themed · Dark gold bg · Big stat + bar chart
          ════════════════════════════════════════════════════ */}
      <TouchableOpacity
        style={s.analyticsCard}
        activeOpacity={0.88}
        testID="analytics-shortcut-card"
        onPress={() => router.push('/(tabs)/analytics')}>

        <View style={s.topRow}>
          <View style={s.goldTag}>
            <Ionicons name="stats-chart" size={11} color="#0A0A0A" />
            <Text style={s.goldTagText}>PROGRESS ANALYTICS</Text>
          </View>
          <View style={s.arrowCircleGold}>
            <Ionicons name="arrow-forward" size={13} color={Colors.gold} />
          </View>
        </View>

        {/* Big headline stat */}
        <View style={s.bigRow}>
          <Text style={s.bigNum}>+18<Text style={s.bigUnit}>%</Text></Text>
          <View style={s.trendPill}>
            <Ionicons name="trending-up" size={11} color="#0A0A0A" />
            <Text style={s.trendPillText}>vs last week</Text>
          </View>
        </View>
        <Text style={s.analyticsSub}>Volume &amp; strength trending up</Text>

        {/* 7-day bar chart */}
        <MiniBarChart />
      </TouchableOpacity>

      {/* ════════════════════════════════════════════════════
          CARD 2 — NUTRITION TRACKER
          Green-themed · Dark green bg · Ring + macro table
          ════════════════════════════════════════════════════ */}
      <TouchableOpacity
        style={s.nutritionCard}
        activeOpacity={0.88}
        testID="nutrition-shortcut-card"
        onPress={() => router.push('/(tabs)/nutrition')}>

        <View style={s.topRow}>
          <View style={s.greenTag}>
            <Ionicons name="leaf" size={11} color="#0A0A0A" />
            <Text style={s.greenTagText}>NUTRITION TRACKER</Text>
          </View>
          <View style={s.arrowCircleGreen}>
            <Ionicons name="arrow-forward" size={13} color="#4ADE80" />
          </View>
        </View>

        {/* Body: calorie ring LEFT, macro breakdown RIGHT */}
        <View style={s.nutritionBody}>
          <View style={s.ringCol}>
            <CalorieRing pct={72} />
            <Text style={s.kcalNum}>1,840</Text>
            <Text style={s.kcalSub}>of 2,500 kcal</Text>
          </View>

          <View style={s.vDivider} />

          <View style={s.macroCol}>
            <Text style={s.macroHeading}>MACROS</Text>
            <MacroRow label="Protein" val="142g" color="#4ADE80" />
            <MacroRow label="Carbs"   val="238g" color="#60A5FA" />
            <MacroRow label="Fats"    val="58g"  color={Colors.amberGold} />
            <View style={s.waterRow}>
              <Ionicons name="water-outline" size={12} color="#60A5FA" />
              <Text style={s.waterTxt}>2.1 L water</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  section: { marginBottom: Spacing.md },

  // ── Shared top row ──────────────────────────────────────────
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  arrowCircleGold: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(245,196,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  arrowCircleGreen: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Analytics card ──────────────────────────────────────────
  analyticsCard: {
    backgroundColor: '#131008',       // deep gold-tinted dark
    borderRadius: Radii.xl,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(245,196,0,0.28)',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
  },
  goldTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.gold,
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: Radii.full,
  },
  goldTagText: { fontSize: 9, fontWeight: '900', color: '#0A0A0A', letterSpacing: 0.5 },

  bigRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  bigNum:    { fontSize: 44, fontWeight: '900', color: Colors.gold, lineHeight: 48 },
  bigUnit:   { fontSize: 24, fontWeight: '900', color: Colors.gold },
  trendPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.gold,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radii.full,
  },
  trendPillText: { fontSize: 10, fontWeight: '800', color: '#0A0A0A' },
  analyticsSub:  { fontSize: 12, color: 'rgba(176,170,154,0.7)', marginTop: 2 },

  // ── Nutrition card ──────────────────────────────────────────
  nutritionCard: {
    backgroundColor: '#081210',       // deep green-tinted dark
    borderRadius: Radii.xl,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(74,222,128,0.22)',
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  greenTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#4ADE80',
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: Radii.full,
  },
  greenTagText: { fontSize: 9, fontWeight: '900', color: '#0A0A0A', letterSpacing: 0.5 },

  nutritionBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 16,
  },
  ringCol:   { alignItems: 'center', gap: 6 },
  kcalNum:   { fontSize: 13, fontWeight: '900', color: '#4ADE80', marginTop: 2 },
  kcalSub:   { fontSize: 9.5, color: Colors.text2, fontWeight: '600' },
  vDivider:  { width: 1, height: 84, backgroundColor: 'rgba(74,222,128,0.15)' },
  macroCol:  { flex: 1 },
  macroHeading: {
    fontSize: 9.5, fontWeight: '900', color: 'rgba(74,222,128,0.7)',
    letterSpacing: 1, marginBottom: 8,
  },
  waterRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  waterTxt:  { fontSize: 10.5, fontWeight: '700', color: '#60A5FA' },
});
