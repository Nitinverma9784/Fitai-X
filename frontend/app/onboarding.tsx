import React, { useState } from 'react';
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
} from 'react-native';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { groqService } from '@/services/groqService';
import { sessionService } from '@/services/sessionService';
import { ChevronRightIcon, CheckIcon, SparklesIcon } from '@/components/icons/SvgIcons';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingWizardScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState('25');
  const [heightCm, setHeightCm] = useState('175');
  const [weightKg, setWeightKg] = useState('70');
  const [primaryGoal, setPrimaryGoal] = useState('Muscle Gain & Hypertrophy');
  const [equipment, setEquipment] = useState('Commercial Gym');
  const [injuries, setInjuries] = useState<string[]>(['None']);
  const [dietPref, setDietPref] = useState('High Protein Non-Veg');
  const [timeCommitment, setTimeCommitment] = useState('45 mins');

  const totalSteps = 6;

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      setSubmitting(true);
      try {
        await groqService.submitOnboarding({
          name: name || 'Athlete',
          age,
          heightCm,
          weightKg,
          goal: primaryGoal,
          equipment,
          injuries,
          dietPref,
          timeCommitment,
        });
        // Mark session as onboarded so future logins skip this screen
        sessionService.markOnboarded();
      } catch {
        // Continue cleanly
      } finally {
        setSubmitting(false);
        router.replace('/(tabs)');
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleInjury = (item: string) => {
    if (item === 'None') {
      setInjuries(['None']);
    } else {
      const filtered = injuries.filter(i => i !== 'None');
      if (filtered.includes(item)) {
        setInjuries(filtered.filter(i => i !== item));
      } else {
        setInjuries([...filtered, item]);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Header & Step Progress Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} disabled={step === 1}>
          <Ionicons name="arrow-back" size={20} color={step === 1 ? Colors.card2 : Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>FITGURU ONBOARDING</Text>
          <Text style={styles.stepIndicator}>Step {step} of {totalSteps}</Text>
        </View>
        <TouchableOpacity style={styles.draftBtn} onPress={handleNext}>
          <Text style={styles.draftText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Track */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` }]} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        {/* Step 1: Basic Profile */}
        {step === 1 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>Let's build your athletic profile</Text>
            <Text style={styles.stepSub}>Required for personalized AI hypertrophy & recovery</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor={Colors.text2}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age</Text>
              <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput style={styles.input} value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput style={styles.input} value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" />
            </View>
          </View>
        )}

        {/* Step 2: Primary Goal */}
        {step === 2 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>Select your primary fitness goal</Text>
            <Text style={styles.stepSub}>Feeds into the Dynamic Goal Engine</Text>

            {[
              'Muscle Gain & Hypertrophy',
              'Fat Loss & Body Recomposition',
              'Powerlifting & Peak Strength',
              'Endurance & Half Marathon',
            ].map(g => {
              const active = primaryGoal === g;
              return (
                <TouchableOpacity
                  key={g}
                  style={[styles.optionCard, active && styles.optionCardActive]}
                  onPress={() => setPrimaryGoal(g)}>
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
        )}

        {/* Step 3: Equipment Access */}
        {step === 3 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>What equipment do you have access to?</Text>
            <Text style={styles.stepSub}>Workout simulator filter</Text>

            {['Commercial Gym', 'Home Gym (Barbell + Rack)', 'Dumbbells & Resistance Bands', 'Bodyweight Only'].map(eq => {
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
        )}

        {/* Step 4: Injury History */}
        {step === 4 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>Any past or active injuries?</Text>
            <Text style={styles.stepSub}>Triggers AI conflict detection & safety filters</Text>

            {['None', 'Shoulder / Rotator Cuff', 'Lower Back Stress', 'Knee Joint Pain', 'Wrist / Elbow Strain'].map(inj => {
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
        )}

        {/* Step 5: Dietary Preferences */}
        {step === 5 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>Dietary Preferences</Text>
            <Text style={styles.stepSub}>Feeds Meal Planner & AI Grocery Generator</Text>

            {['High Protein Non-Veg', 'Vegetarian (Eggs Allowed)', 'Strict Vegan', 'Keto / Low Carb'].map(d => {
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
        )}

        {/* Step 6: Available Time */}
        {step === 6 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>Daily Available Time</Text>
            <Text style={styles.stepSub}>Workout duration constraint</Text>

            {['30 mins', '45 mins', '60 mins', '90 mins'].map(t => {
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
        )}
      </ScrollView>

      {/* Footer Navigation CTA */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} disabled={submitting} activeOpacity={0.85}>
          {submitting ? (
            <ActivityIndicator size="small" color="#0A0A0A" />
          ) : (
            <Text style={styles.nextBtnText}>
              {step === totalSteps ? 'Complete Onboarding & Build Plan 🚀' : 'Continue →'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
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
  headerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.gold,
    letterSpacing: 1,
  },
  stepIndicator: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  draftBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  draftText: {
    fontSize: 11,
    color: Colors.text2,
    fontWeight: '600',
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.card2,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.gold,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  contentContainer: {
    paddingVertical: Spacing.lg,
  },
  stepBox: {
    backgroundColor: Colors.card,
    borderRadius: Radii.xxl,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  stepSub: {
    fontSize: 12,
    color: Colors.text2,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
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
    padding: 16,
    marginBottom: 10,
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
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
  },
  nextBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A0A0A',
  },
});
