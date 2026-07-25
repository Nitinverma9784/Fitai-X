import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { groqService, UserProfile } from '@/services/groqService';

const GOALS = [
  'Muscle Gain & Hypertrophy',
  'Fat Loss & Body Recomposition',
  'Powerlifting & Peak Strength',
  'Endurance & Half Marathon',
];
const EQUIPMENT_OPTIONS = [
  'Commercial Gym',
  'Home Gym (Barbell + Rack)',
  'Dumbbells & Resistance Bands',
  'Bodyweight Only',
];
const INJURY_OPTIONS = [
  'None',
  'Shoulder / Rotator Cuff',
  'Lower Back Stress',
  'Knee Joint Pain',
  'Wrist / Elbow Strain',
];
const DIET_OPTIONS = [
  'High Protein Non-Veg',
  'Vegetarian (Eggs Allowed)',
  'Strict Vegan',
  'Keto / Low Carb',
];
const TIME_OPTIONS = ['30 mins', '45 mins', '60 mins', '90 mins'];

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [goal, setGoal] = useState('');
  const [equipment, setEquipment] = useState('');
  const [injuries, setInjuries] = useState<string[]>(['None']);
  const [dietPref, setDietPref] = useState('');
  const [timeCommitment, setTimeCommitment] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const u = await groqService.getUserProfile();
        if (u) {
          setName(u.name ?? '');
          setAge(String(u.age ?? ''));
          setHeightCm(String(u.height_cm ?? ''));
          setWeightKg(String(u.weight_kg ?? ''));
          setGoal(u.goal ?? GOALS[0]);
          setEquipment(u.equipment ?? EQUIPMENT_OPTIONS[0]);
          setInjuries(u.injuries && u.injuries.length > 0 ? u.injuries : ['None']);
          setDietPref(u.diet_pref ?? DIET_OPTIONS[0]);
          setTimeCommitment(u.time_commitment ?? TIME_OPTIONS[1]);
        }
      } catch {
        // Use defaults silently
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const toggleInjury = (item: string) => {
    if (item === 'None') {
      setInjuries(['None']);
    } else {
      const filtered = injuries.filter(i => i !== 'None');
      if (filtered.includes(item)) {
        const next = filtered.filter(i => i !== item);
        setInjuries(next.length > 0 ? next : ['None']);
      } else {
        setInjuries([...filtered, item]);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Partial<UserProfile> = {
        name: name.trim() || 'Athlete',
        age: Number(age) || undefined,
        height_cm: Number(heightCm) || undefined,
        weight_kg: Number(weightKg) || undefined,
        goal,
        equipment,
        injuries,
        diet_pref: dietPref,
        time_commitment: timeCommitment,
      };
      const result = await groqService.updateProfile(payload);
      if (result) {
        router.back();
      } else {
        Alert.alert('Save Failed', 'Could not save your profile. Please check your connection and try again.');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>EDIT FITNESS PROFILE</Text>
          <Text style={styles.headerSub}>Changes apply to all AI systems</Text>
        </View>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color="#0A0A0A" />
            : <Text style={styles.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {/* ── Section: Personal Info ─────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>PERSONAL INFORMATION</Text>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your athlete name"
              placeholderTextColor={Colors.text2}
            />
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                placeholder="25"
                placeholderTextColor={Colors.text2}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={heightCm}
                onChangeText={setHeightCm}
                keyboardType="numeric"
                placeholder="175"
                placeholderTextColor={Colors.text2}
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={weightKg}
              onChangeText={setWeightKg}
              keyboardType="numeric"
              placeholder="70"
              placeholderTextColor={Colors.text2}
            />
          </View>
        </View>

        {/* ── Section: Primary Goal ──────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>PRIMARY FITNESS GOAL</Text>
        <View style={styles.card}>
          {GOALS.map(g => {
            const active = goal === g;
            return (
              <TouchableOpacity
                key={g}
                style={[styles.optionCard, active && styles.optionCardActive]}
                onPress={() => setGoal(g)}>
                <Ionicons
                  name={active ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={active ? Colors.gold : Colors.text2}
                />
                <Text style={[styles.optionText, active && styles.optionTextActive]}>{g}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Section: Equipment ─────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>EQUIPMENT ACCESS</Text>
        <View style={styles.card}>
          {EQUIPMENT_OPTIONS.map(eq => {
            const active = equipment === eq;
            return (
              <TouchableOpacity
                key={eq}
                style={[styles.optionCard, active && styles.optionCardActive]}
                onPress={() => setEquipment(eq)}>
                <Ionicons
                  name={active ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={active ? Colors.gold : Colors.text2}
                />
                <Text style={[styles.optionText, active && styles.optionTextActive]}>{eq}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Section: Injuries ──────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>INJURY HISTORY  <Text style={styles.multiHint}>(select all that apply)</Text></Text>
        <View style={styles.card}>
          {INJURY_OPTIONS.map(inj => {
            const active = injuries.includes(inj);
            return (
              <TouchableOpacity
                key={inj}
                style={[styles.optionCard, active && styles.optionCardActive]}
                onPress={() => toggleInjury(inj)}>
                <Ionicons
                  name={active ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={active ? Colors.gold : Colors.text2}
                />
                <Text style={[styles.optionText, active && styles.optionTextActive]}>{inj}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Section: Diet ──────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>DIETARY PREFERENCE</Text>
        <View style={styles.card}>
          {DIET_OPTIONS.map(d => {
            const active = dietPref === d;
            return (
              <TouchableOpacity
                key={d}
                style={[styles.optionCard, active && styles.optionCardActive]}
                onPress={() => setDietPref(d)}>
                <Ionicons
                  name={active ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={active ? Colors.gold : Colors.text2}
                />
                <Text style={[styles.optionText, active && styles.optionTextActive]}>{d}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Section: Time Commitment ───────────────────────────────────── */}
        <Text style={styles.sectionLabel}>DAILY WORKOUT DURATION</Text>
        <View style={styles.card}>
          {TIME_OPTIONS.map(t => {
            const active = timeCommitment === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.optionCard, active && styles.optionCardActive]}
                onPress={() => setTimeCommitment(t)}>
                <Ionicons
                  name={active ? 'time' : 'time-outline'}
                  size={20}
                  color={active ? Colors.gold : Colors.text2}
                />
                <Text style={[styles.optionText, active && styles.optionTextActive]}>{t} per session</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bottom CTA */}
        <TouchableOpacity
          style={[styles.ctaBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}>
          {saving
            ? <ActivityIndicator size="small" color="#0A0A0A" />
            : <Text style={styles.ctaBtnText}>Save Changes & Update AI Plan 🚀</Text>}
        </TouchableOpacity>

        <View style={{ height: 32 }} />
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.text2,
    fontSize: 13,
    fontWeight: '700',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.gold,
    letterSpacing: 1,
  },
  headerSub: {
    fontSize: 10,
    color: Colors.text2,
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radii.md,
    minWidth: 56,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0A0A0A',
  },
  // Content
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.text2,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  multiHint: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.text2,
    letterSpacing: 0,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.xl,
    padding: 16,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text2,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.card2,
    borderRadius: Radii.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card2,
    borderRadius: Radii.md,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionCardActive: {
    borderColor: Colors.gold,
    backgroundColor: 'rgba(245, 196, 0, 0.08)',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text2,
  },
  optionTextActive: {
    color: Colors.text,
    fontWeight: '800',
  },
  ctaBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A0A0A',
  },
});
