import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { groqService } from '@/services/groqService';
import { XpRewardModal } from '@/components/XpRewardModal';

interface MorningCheckinModalProps {
  visible: boolean;
  userName?: string;
  initialMetrics?: {
    sleepHours?: number;
    hrvMs?: number;
    muscleSoreness?: 'Low' | 'Moderate' | 'High';
    hydrationL?: number;
  };
  onClose: () => void;
  onSuccess: (data: any) => void;
}

export function MorningCheckinModal({ visible, userName, initialMetrics, onClose, onSuccess }: MorningCheckinModalProps) {
  const [timeInBed, setTimeInBed] = useState('8.0');
  const [timeAsleep, setTimeAsleep] = useState('7.2');
  const [hrvMs, setHrvMs] = useState('65');
  const [soreness, setSoreness] = useState<'Low' | 'Moderate' | 'High'>('Low');
  const [hydration, setHydration] = useState('2.5');
  const [saving, setSaving] = useState(false);
  const [showXpReward, setShowXpReward] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);

  useEffect(() => {
    if (visible && initialMetrics) {
      const hours = initialMetrics.sleepHours || 7.2;
      setTimeAsleep(String(hours));
      setTimeInBed(String(Number((hours + 0.8).toFixed(1))));
      setHrvMs(String(initialMetrics.hrvMs || 65));
      setSoreness(initialMetrics.muscleSoreness || 'Low');
      setHydration(String(initialMetrics.hydrationL || 2.5));
    }
  }, [visible, initialMetrics]);

  if (!visible && !showXpReward) return null;

  const bed = parseFloat(timeInBed) || 8.0;
  const asleep = parseFloat(timeAsleep) || 7.2;
  const calculatedEfficiency = bed > 0 ? Math.min(100, Math.round((asleep / bed) * 100)) : 90;

  const handleSave = async () => {
    setSaving(true);
    try {
      const hrv = parseFloat(hrvMs) || 65;
      const hyd = parseFloat(hydration) || 2.5;

      const res = await groqService.getRecoveryInsights({
        sleepHours: asleep,
        hrv,
        soreness,
        hydrationL: hyd,
        sleepEfficiency: calculatedEfficiency,
      });

      // Always set pendingData — use API result or a structured fallback from form values
      const fallback = {
        readinessPercentage: 80,
        statusLabel: 'Bio-Metrics Logged',
        description: 'Your sleep and recovery metrics have been recorded.',
        recommendations: [],
        breathingExercise: { name: 'Box Breathing 4-4-4-4', cycles: 5, targetHrvBoost: '+5%' },
        log: {
          sleep_hours: asleep,
          hrv_ms: hrv,
          sleep_efficiency: calculatedEfficiency,
          muscle_soreness: soreness,
          hydration_l: hyd,
        },
      };
      setPendingData(res ?? fallback);
      setShowXpReward(true);
    } catch {
      onClose();
    } finally {
      setSaving(false);
    }
  };


  const handleDismissModal = () => {
    if (pendingData) {
      onSuccess(pendingData);
    }
    onClose();
  };

  const handleFinishReward = () => {
    setShowXpReward(false);
    handleDismissModal();
  };

  return (
    <>
      <Modal visible={visible && !showXpReward} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.card}>
            <View style={s.topRow}>
              <View style={s.badge}>
                <Ionicons name="sunny-outline" size={14} color={Colors.gold} />
                <Text style={s.badgeText}>DAILY MORNING BIO-CHECKIN</Text>
              </View>
              <TouchableOpacity onPress={handleDismissModal} style={s.closeBtn}>
                <Ionicons name="close" size={16} color={Colors.text2} />
              </TouchableOpacity>
            </View>

            <Text style={s.title}>Good Morning, {userName || 'Athlete'}! 👋</Text>
            <Text style={s.sub}>
              Log last night's sleep duration and wearable heart metrics to calculate today's AI readiness score &amp; earn +5 XP.
            </Text>

            {/* Form Controls */}
            <View style={s.formGrid}>
              <View style={s.inputBox}>
                <Text style={s.label}>Time in Bed (Hrs)</Text>
                <TextInput
                  style={s.input}
                  keyboardType="numeric"
                  value={timeInBed}
                  onChangeText={setTimeInBed}
                  placeholder="8.0"
                  placeholderTextColor="#555"
                />
              </View>

              <View style={s.inputBox}>
                <Text style={s.label}>Time Asleep (Hrs)</Text>
                <TextInput
                  style={s.input}
                  keyboardType="numeric"
                  value={timeAsleep}
                  onChangeText={setTimeAsleep}
                  placeholder="7.2"
                  placeholderTextColor="#555"
                />
              </View>

              <View style={s.inputBox}>
                <Text style={s.label}>Sleep Efficiency</Text>
                <View style={s.readOnlyInput}>
                  <Text style={s.readOnlyText}>{calculatedEfficiency}%</Text>
                </View>
              </View>

              <View style={s.inputBox}>
                <Text style={s.label}>Wearable HRV (ms)</Text>
                <TextInput
                  style={s.input}
                  keyboardType="numeric"
                  value={hrvMs}
                  onChangeText={setHrvMs}
                  placeholder="65"
                  placeholderTextColor="#555"
                />
              </View>

              <View style={s.inputBox}>
                <Text style={s.label}>Hydration (Liters)</Text>
                <TextInput
                  style={s.input}
                  keyboardType="numeric"
                  value={hydration}
                  onChangeText={setHydration}
                  placeholder="2.5"
                  placeholderTextColor="#555"
                />
              </View>

              <View style={s.inputBox}>
                <Text style={s.label}>Muscle Soreness</Text>
                <View style={s.sorenessPills}>
                  {(['Low', 'Moderate', 'High'] as const).map(item => (
                    <TouchableOpacity
                      key={item}
                      style={[s.sorePill, soreness === item && s.sorePillActive]}
                      onPress={() => setSoreness(item)}>
                      <Text style={[s.soreText, soreness === item && s.soreTextActive]}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#0A0A0A" />
              ) : (
                <Text style={s.saveBtnText}>Save Bio-Metrics &amp; Calculate Readiness ➔</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <XpRewardModal
        visible={showXpReward}
        xpAmount={5}
        title="DAILY BIO-METRICS LOGGED!"
        message="Your sleep and recovery data have been ingested into the FitAI engine. Level progress updated!"
        onClose={handleFinishReward}
      />
    </>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#121212', borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245,196,0,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radii.full, borderWidth: 1, borderColor: 'rgba(245,196,0,0.3)' },
  badgeText: { fontSize: 10, fontWeight: '800', color: Colors.gold, letterSpacing: 0.8 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  sub: { fontSize: 12, color: Colors.text2, lineHeight: 17, marginBottom: 16 },

  formGrid: { gap: 12, marginBottom: 16 },
  inputBox: { gap: 4 },
  label: { fontSize: 11, fontWeight: '700', color: Colors.text2 },
  input: { backgroundColor: Colors.card2, borderRadius: Radii.md, padding: 12, color: Colors.text, fontSize: 14, borderWidth: 1, borderColor: Colors.border },
  readOnlyInput: { backgroundColor: Colors.card, borderRadius: Radii.md, padding: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  readOnlyText: { fontSize: 14, fontWeight: '800', color: Colors.gold },

  sorenessPills: { flexDirection: 'row', gap: 8 },
  sorePill: { flex: 1, backgroundColor: Colors.card2, borderRadius: Radii.md, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  sorePillActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  soreText: { fontSize: 12, fontWeight: '700', color: Colors.text2 },
  soreTextActive: { color: '#0A0A0A', fontWeight: '800' },

  saveBtn: { backgroundColor: Colors.gold, borderRadius: Radii.md, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  saveBtnText: { fontSize: 13, fontWeight: '900', color: '#0A0A0A' },
});
