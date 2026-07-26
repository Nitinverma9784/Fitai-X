import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

// ─── Mini Bar Chart (Minimal Progress visual) ─────────────────────────────────
function MiniBarChart() {
  const bars = [
    { h: 30, active: false },
    { h: 55, active: false },
    { h: 40, active: false },
    { h: 70, active: false },
    { h: 50, active: false },
    { h: 85, active: true  },
    { h: 60, active: false },
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
                  height: Math.round((b.h / 100) * 44),
                  backgroundColor: b.active ? Colors.gold : '#2A2A2A',
                  borderRadius: 2,
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
  root:     { flexDirection: 'row', gap: 6, alignItems: 'flex-end', marginTop: 12 },
  col:      { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: { height: 44, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar:      { width: '100%' },
  day:      { fontSize: 8.5, fontWeight: '700', color: '#666' },
});

// ─── Minimal Macro Row ───────────────────────────────────────────────────────
function MinimalMacroRow({ label, val }: { label: string; val: string }) {
  return (
    <View style={mr.row}>
      <Text style={mr.label}>{label}</Text>
      <Text style={mr.val}>{val}</Text>
    </View>
  );
}
const mr = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  label: { fontSize: 11, fontWeight: '600', color: '#888' },
  val:   { fontSize: 11, fontWeight: '700', color: Colors.text },
});

// ─── Main Export ───────────────────────────────────────────────────────────────
export function QuickAccessCards() {
  const router = useRouter();

  return (
    <View style={s.section}>

      {/* CARD 1 — PROGRESS ANALYTICS (Aesthetic Minimal) */}
      <TouchableOpacity
        style={s.minimalCard}
        activeOpacity={0.85}
        testID="analytics-shortcut-card"
        onPress={() => router.push('/(tabs)/analytics')}>

        <View style={s.topRow}>
          <View style={s.tagRow}>
            <Ionicons name="stats-chart-outline" size={13} color={Colors.gold} />
            <Text style={s.tagText}>PROGRESS ANALYTICS</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#666" />
        </View>

        <View style={s.bodyRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.statBig}>+18%</Text>
            <Text style={s.statDesc}>Volume &amp; intensity up vs last week</Text>
          </View>
        </View>

        <MiniBarChart />
      </TouchableOpacity>

      {/* CARD 2 — NUTRITION TRACKER (Aesthetic Minimal) */}
      <TouchableOpacity
        style={s.minimalCard}
        activeOpacity={0.85}
        testID="nutrition-shortcut-card"
        onPress={() => router.push('/(tabs)/nutrition')}>

        <View style={s.topRow}>
          <View style={s.tagRow}>
            <Ionicons name="restaurant-outline" size={13} color={Colors.gold} />
            <Text style={s.tagText}>NUTRITION TRACKER</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#666" />
        </View>

        <View style={s.nutritionGrid}>
          <View style={s.nutrMain}>
            <Text style={s.statBig}>1,840 <Text style={s.unitText}>kcal</Text></Text>
            <Text style={s.statDesc}>Daily Target: 2,500 kcal (72%)</Text>
          </View>

          <View style={s.nutrDivider} />

          <View style={s.macroCol}>
            <MinimalMacroRow label="Protein" val="142g" />
            <MinimalMacroRow label="Carbs" val="238g" />
            <MinimalMacroRow label="Fats" val="58g" />
          </View>
        </View>

      </TouchableOpacity>

    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  section: { marginBottom: Spacing.md, gap: 10 },

  minimalCard: {
    backgroundColor: '#121212',
    borderRadius: Radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222222',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.gold,
    letterSpacing: 0.8,
  },

  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statBig: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  statDesc: {
    fontSize: 11.5,
    color: '#888',
    marginTop: 2,
  },

  nutritionGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  nutrMain: {
    flex: 1.1,
  },
  nutrDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#222',
    marginHorizontal: 12,
  },
  macroCol: {
    flex: 1,
  },
});
