import React, { useState, useEffect } from 'react';
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
import { groqService, RecoveryInsights } from '@/services/groqService';
import {
  SparklesIcon, HeartIcon, MoonIcon, ActivityIcon,
  WindIcon, LeafIcon,
} from '@/components/icons/SvgIcons';

export default function RecoveryScreen() {
  const [loading, setLoading] = useState(false);
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Pause'>('Inhale');

  const [insights, setInsights] = useState<RecoveryInsights>({
    readinessPercentage: 92,
    statusLabel: 'Optimal Recovery State',
    description: 'HRV is 14ms above baseline and sleep efficiency hit 94%. Your body is primed for daily activity.',
    recommendations: [
      { category: 'Mobility', title: 'Thoracic & Hip Opener Routine', duration: '12 mins', advice: 'Relieves lower spine stress & opens thoracic cage.', icon: 'refresh-cw' },
      { category: 'Nutrition', title: 'Post-Workout Glycogen & Whey', advice: 'Consume 35g protein + 60g complex carbs within 45m.', icon: 'coffee' },
      { category: 'Hydration', title: 'Electrolyte Replenishment', advice: 'Add 500mg sodium + potassium to 750ml water.', icon: 'droplet' }
    ],
    breathingExercise: { name: 'Box Breathing 4-4-4-4', cycles: 5, targetHrvBoost: '+8%' }
  });

  useEffect(() => {
    let timer: any;
    if (breathingActive) {
      const phases: ('Inhale' | 'Hold' | 'Exhale' | 'Pause')[] = ['Inhale', 'Hold', 'Exhale', 'Pause'];
      let idx = 0;
      timer = setInterval(() => {
        idx = (idx + 1) % phases.length;
        setBreathPhase(phases[idx]);
      }, 4000);
    }
    return () => clearInterval(timer);
  }, [breathingActive]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await groqService.getRecoveryInsights({
        sleepHours: 8.2,
        hrv: 68,
        soreness: 'Low',
      });
      if (res) {
        setInsights(res);
      }
    } catch {
      // Handled cleanly
    } finally {
      setLoading(false);
    }
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
          <View>
            <Text style={styles.kicker}>HEALTH & BIO-RECOVERY</Text>
            <Text style={styles.title}>Recovery Guide</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#0A0A0A" />
            ) : (
              <SparklesIcon size={18} color="#0A0A0A" />
            )}
          </TouchableOpacity>
        </View>

        {/* Hero Recovery Readiness Gauge Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <View style={styles.gaugeCircle}>
              <Text style={styles.gaugeNum}>{insights.readinessPercentage}%</Text>
              <Text style={styles.gaugeSub}>READY</Text>
            </View>
          </View>

          <View style={styles.heroRight}>
            <Text style={styles.statusLbl}>{insights.statusLabel.toUpperCase()}</Text>
            <Text style={styles.desc}>{insights.description}</Text>
          </View>
        </View>

        {/* 2x2 Key Health Mini Cards */}
        <View style={styles.grid2}>
          <View style={styles.miniCard}>
            <View style={styles.miniTop}>
              <Text style={styles.miniLabel}>HRV Score</Text>
              <ActivityIcon size={16} color={Colors.green} />
            </View>
            <Text style={styles.miniVal}>68 <Text style={styles.miniUnit}>ms</Text></Text>
            <Text style={styles.miniSub}>+14ms vs 7d avg</Text>
          </View>

          <View style={styles.miniCard}>
            <View style={styles.miniTop}>
              <Text style={styles.miniLabel}>Sleep Duration</Text>
              <MoonIcon size={16} color="#818cf8" />
            </View>
            <Text style={styles.miniVal}>8.2 <Text style={styles.miniUnit}>hrs</Text></Text>
            <Text style={styles.miniSub}>94% Deep Sleep Efficiency</Text>
          </View>

          <View style={styles.miniCard}>
            <View style={styles.miniTop}>
              <Text style={styles.miniLabel}>Stress Level</Text>
              <HeartIcon size={16} color={Colors.gold} />
            </View>
            <Text style={styles.miniVal}>Low <Text style={styles.miniUnit}>18/100</Text></Text>
            <Text style={styles.miniSub}>Optimal Parasympathetic</Text>
          </View>

          <View style={styles.miniCard}>
            <View style={styles.miniTop}>
              <Text style={styles.miniLabel}>Resting Heart Rate</Text>
              <HeartIcon size={16} color={Colors.red} />
            </View>
            <Text style={styles.miniVal}>52 <Text style={styles.miniUnit}>bpm</Text></Text>
            <Text style={styles.miniSub}>Baseline match</Text>
          </View>
        </View>

        {/* Muscle Recovery Status Progress */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Muscle Group Recovery Status</Text>

          <View style={styles.muscleRow}>
            <View style={styles.muscleTop}>
              <Text style={styles.muscleName}>Upper Body (Chest / Triceps)</Text>
              <Text style={styles.musclePercent}>95% Rested</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: '95%', backgroundColor: Colors.green }]} />
            </View>
          </View>

          <View style={styles.muscleRow}>
            <View style={styles.muscleTop}>
              <Text style={styles.muscleName}>Pull Group (Back / Biceps)</Text>
              <Text style={styles.musclePercent}>88% Rested</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: '88%', backgroundColor: Colors.green }]} />
            </View>
          </View>

          <View style={styles.muscleRow}>
            <View style={styles.muscleTop}>
              <Text style={styles.muscleName}>Lower Body (Quads / Hamstrings)</Text>
              <Text style={styles.musclePercent}>45% Sore</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: '45%', backgroundColor: Colors.amberGold }]} />
            </View>
          </View>
        </View>

        {/* Box Breathing Guided Routine */}
        <View style={styles.card}>
          <View style={styles.breathHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <WindIcon size={18} color="#38bdf8" />
              <Text style={styles.cardTitle}>{insights.breathingExercise.name}</Text>
            </View>
            <Text style={styles.breathBoost}>{insights.breathingExercise.targetHrvBoost} HRV</Text>
          </View>

          <View style={styles.breathBody}>
            <TouchableOpacity
              style={[styles.breathCircle, breathingActive && styles.breathCircleActive]}
              onPress={() => setBreathingActive(!breathingActive)}
              activeOpacity={0.85}>
              <Text style={styles.breathPhaseText}>
                {breathingActive ? breathPhase.toUpperCase() : 'TAP TO START'}
              </Text>
              <Text style={styles.breathCyclesText}>
                {breathingActive ? '4s interval' : `${insights.breathingExercise.cycles} cycles`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Bio-Coach Actionable Recommendations */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>AI Recovery Action Plan</Text>
        </View>

        {insights.recommendations.map((rec, i) => (
          <View key={i} style={styles.recCard}>
            <View style={styles.recIconBox}>
              <LeafIcon size={20} color={Colors.gold} />
            </View>
            <View style={styles.recContent}>
              <View style={styles.recHeader}>
                <Text style={styles.recCategory}>{rec.category.toUpperCase()}</Text>
                {rec.duration && <Text style={styles.recDuration}>{rec.duration}</Text>}
              </View>
              <Text style={styles.recTitle}>{rec.title}</Text>
              <Text style={styles.recAdvice}>{rec.advice}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg, paddingTop: (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0) + 12 },
  container: { flex: 1, paddingHorizontal: Spacing.lg },
  contentContainer: { paddingBottom: 100 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: Spacing.md },
  kicker: { fontSize: 10.5, fontWeight: '800', color: Colors.gold, letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginTop: 2 },
  refreshBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
  heroCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radii.xxl, padding: 18, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight },
  heroLeft: { marginRight: 16 },
  gaugeCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: Colors.gold, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.card2 },
  gaugeNum: { fontSize: 24, fontWeight: '800', color: Colors.gold },
  gaugeSub: { fontSize: 8, fontWeight: '800', color: Colors.text2, letterSpacing: 0.5 },
  heroRight: { flex: 1 },
  statusLbl: { fontSize: 13, fontWeight: '800', color: Colors.green, marginBottom: 4 },
  desc: { fontSize: 12, color: Colors.text2, lineHeight: 17 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: Spacing.md },
  miniCard: { width: '48%', backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 14, borderWidth: 1, borderColor: Colors.border },
  miniTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  miniLabel: { fontSize: 11, fontWeight: '600', color: Colors.text2 },
  miniVal: { fontSize: 18, fontWeight: '800', color: Colors.text },
  miniUnit: { fontSize: 12, color: Colors.text2, fontWeight: '600' },
  miniSub: { fontSize: 10, color: Colors.text2, marginTop: 2, fontWeight: '600' },
  card: { backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 16, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  cardTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  muscleRow: { marginTop: 10 },
  muscleTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  muscleName: { fontSize: 12, fontWeight: '700', color: Colors.text2 },
  musclePercent: { fontSize: 11, fontWeight: '800', color: Colors.gold },
  track: { height: 8, backgroundColor: Colors.card2, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  breathHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  breathBoost: { fontSize: 11, fontWeight: '800', color: Colors.gold, backgroundColor: 'rgba(245,196,0,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  breathBody: { alignItems: 'center', marginVertical: 10 },
  breathCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.card2, borderWidth: 2, borderColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
  breathCircleActive: { backgroundColor: 'rgba(245,196,0,0.15)', borderColor: Colors.brightYellow },
  breathPhaseText: { fontSize: 13, fontWeight: '800', color: Colors.gold, letterSpacing: 0.5 },
  breathCyclesText: { fontSize: 10, color: Colors.text2, marginTop: 4 },
  sectionHead: { marginVertical: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  recCard: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  recIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.card2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  recContent: { flex: 1 },
  recHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  recCategory: { fontSize: 9.5, fontWeight: '800', color: Colors.gold, letterSpacing: 0.5 },
  recDuration: { fontSize: 10, color: Colors.text2, fontWeight: '600' },
  recTitle: { fontSize: 13.5, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  recAdvice: { fontSize: 11.5, color: Colors.text2, lineHeight: 16 },
});
