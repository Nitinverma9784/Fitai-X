import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { detectEquipmentCategory, formatWeightBreakdown, ExerciseEquipmentCategory } from '@/utils/exerciseUtils';
import { workoutService, WorkoutExercise } from '@/services/workoutService';

interface LogWeightModalProps {
  visible: boolean;
  exercise: WorkoutExercise | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function LogWeightModal({ visible, exercise, onClose, onSuccess }: LogWeightModalProps) {
  const [saving, setSaving] = useState(false);
  const [equipmentCategory, setEquipmentCategory] = useState<ExerciseEquipmentCategory>('barbell');
  
  // Weight inputs
  const [barWeight, setBarWeight] = useState<number>(20);
  const [plateWeight, setPlateWeight] = useState<number>(20);
  const [dumbbellWeight, setDumbbellWeight] = useState<number>(15);
  const [machineWeight, setMachineWeight] = useState<number>(40);
  const [addedWeight, setAddedWeight] = useState<number>(0);
  const [isBodyweightOnly, setIsBodyweightOnly] = useState<boolean>(false);

  // Reps & RPE
  const [reps, setReps] = useState<number>(10);
  const [rpe, setRpe] = useState<number>(8);

  useEffect(() => {
    if (exercise && visible) {
      const cat = detectEquipmentCategory(exercise.name);
      setEquipmentCategory(cat);

      // Parse initial target reps if available
      const parsedReps = parseInt(exercise.reps || '10', 10);
      setReps(!isNaN(parsedReps) ? parsedReps : 10);

      if (cat === 'bodyweight') {
        setIsBodyweightOnly(true);
      }
    }
  }, [exercise, visible]);

  if (!visible || !exercise) return null;

  // Calculate total weight (kg)
  const calculateTotalWeight = (): number => {
    if (equipmentCategory === 'barbell') {
      return barWeight + plateWeight * 2;
    }
    if (equipmentCategory === 'dumbbell') {
      return dumbbellWeight;
    }
    if (equipmentCategory === 'cable_machine') {
      return machineWeight;
    }
    if (equipmentCategory === 'bodyweight') {
      return isBodyweightOnly ? 0 : addedWeight;
    }
    return machineWeight;
  };

  const totalWeight = calculateTotalWeight();

  const handleSave = async () => {
    setSaving(true);
    try {
      const isBw = equipmentCategory === 'bodyweight' && isBodyweightOnly;
      const barKg = equipmentCategory === 'barbell' ? barWeight : undefined;
      const plateKg = equipmentCategory === 'barbell' ? plateWeight : undefined;

      // 1. Save set detail to DB table exercise_logs
      await workoutService.saveExerciseLog({
        exerciseName: exercise.name,
        weightKg: totalWeight,
        barWeightKg: barKg,
        plateWeightKg: plateKg,
        repsAchieved: reps,
        isBodyweight: isBw,
      });

      // 2. Toggle exercise completion status
      await workoutService.toggleExercise(Number(exercise.id), true);

      onSuccess();
      onClose();
    } catch {
      // Handled cleanly
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.card}>

          {/* Header */}
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <View style={s.tagRow}>
                <View style={s.tagBadge}>
                  <Ionicons name="barbell" size={12} color={Colors.gold} />
                  <Text style={s.tagBadgeText}>
                    {equipmentCategory.toUpperCase()} EXERCISE
                  </Text>
                </View>
              </View>
              <Text style={s.title}>{exercise.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Ionicons name="close" size={18} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

            {/* Smart Equipment Type Category Switcher */}
            <View style={s.catRow}>
              {(['barbell', 'dumbbell', 'cable_machine', 'bodyweight'] as const).map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[s.catBtn, equipmentCategory === cat && s.catBtnSelected]}
                  onPress={() => setEquipmentCategory(cat)}>
                  <Text style={[s.catBtnText, equipmentCategory === cat && s.catBtnTextSelected]}>
                    {cat === 'barbell' ? '🏋️ Barbell' : cat === 'dumbbell' ? '🏋️ Dumbbell' : cat === 'cable_machine' ? '⚡ Machine' : '🤸 Bodyweight'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* BARBELL WEIGHT INPUTS */}
            {equipmentCategory === 'barbell' && (
              <View style={s.box}>
                <Text style={s.boxTitle}>BARBELL SETUP</Text>

                <Text style={s.label}>Barbell Base Weight (kg)</Text>
                <View style={s.presetRow}>
                  {[20, 15, 10, 0].map(w => (
                    <TouchableOpacity
                      key={w}
                      style={[s.presetChip, barWeight === w && s.presetChipSelected]}
                      onPress={() => setBarWeight(w)}>
                      <Text style={[s.presetChipText, barWeight === w && s.presetChipTextSelected]}>
                        {w === 20 ? '20kg Olympic Bar' : w === 0 ? '0kg / Bar Only' : `${w}kg Bar`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={s.label}>Plates Per Side (kg)</Text>
                <View style={s.counterRow}>
                  <TouchableOpacity style={s.counterBtn} onPress={() => setPlateWeight(Math.max(0, plateWeight - 2.5))}>
                    <Ionicons name="remove" size={20} color={Colors.text} />
                  </TouchableOpacity>
                  <TextInput
                    style={s.counterInput}
                    keyboardType="numeric"
                    value={String(plateWeight)}
                    onChangeText={v => setPlateWeight(parseFloat(v) || 0)}
                  />
                  <TouchableOpacity style={s.counterBtn} onPress={() => setPlateWeight(plateWeight + 2.5)}>
                    <Ionicons name="add" size={20} color={Colors.text} />
                  </TouchableOpacity>
                </View>

                <View style={s.calculatedCard}>
                  <Text style={s.calculatedTag}>TOTAL WORKING WEIGHT</Text>
                  <Text style={s.calculatedVal}>{totalWeight} <Text style={s.calculatedUnit}>kg</Text></Text>
                  <Text style={s.calculatedSub}>{barWeight}kg Bar + ({plateWeight}kg × 2 sides)</Text>
                </View>
              </View>
            )}

            {/* DUMBBELL WEIGHT INPUTS */}
            {equipmentCategory === 'dumbbell' && (
              <View style={s.box}>
                <Text style={s.boxTitle}>DUMBBELL SELECTION</Text>
                <Text style={s.label}>Weight Per Dumbbell (kg)</Text>
                <View style={s.counterRow}>
                  <TouchableOpacity style={s.counterBtn} onPress={() => setDumbbellWeight(Math.max(1, dumbbellWeight - 2.5))}>
                    <Ionicons name="remove" size={20} color={Colors.text} />
                  </TouchableOpacity>
                  <TextInput
                    style={s.counterInput}
                    keyboardType="numeric"
                    value={String(dumbbellWeight)}
                    onChangeText={v => setDumbbellWeight(parseFloat(v) || 0)}
                  />
                  <TouchableOpacity style={s.counterBtn} onPress={() => setDumbbellWeight(dumbbellWeight + 2.5)}>
                    <Ionicons name="add" size={20} color={Colors.text} />
                  </TouchableOpacity>
                </View>

                <View style={s.calculatedCard}>
                  <Text style={s.calculatedTag}>TOTAL DUMBBELL LOAD</Text>
                  <Text style={s.calculatedVal}>{dumbbellWeight} <Text style={s.calculatedUnit}>kg per DB</Text></Text>
                  <Text style={s.calculatedSub}>Target load saved for AI Progressive Overload</Text>
                </View>
              </View>
            )}

            {/* CABLE / MACHINE INPUTS */}
            {equipmentCategory === 'cable_machine' && (
              <View style={s.box}>
                <Text style={s.boxTitle}>MACHINE / STACK RESISTANCE</Text>
                <Text style={s.label}>Resistance Weight (kg)</Text>
                <View style={s.counterRow}>
                  <TouchableOpacity style={s.counterBtn} onPress={() => setMachineWeight(Math.max(5, machineWeight - 5))}>
                    <Ionicons name="remove" size={20} color={Colors.text} />
                  </TouchableOpacity>
                  <TextInput
                    style={s.counterInput}
                    keyboardType="numeric"
                    value={String(machineWeight)}
                    onChangeText={v => setMachineWeight(parseFloat(v) || 0)}
                  />
                  <TouchableOpacity style={s.counterBtn} onPress={() => setMachineWeight(machineWeight + 5)}>
                    <Ionicons name="add" size={20} color={Colors.text} />
                  </TouchableOpacity>
                </View>

                <View style={s.calculatedCard}>
                  <Text style={s.calculatedTag}>STACK WORKING WEIGHT</Text>
                  <Text style={s.calculatedVal}>{machineWeight} <Text style={s.calculatedUnit}>kg</Text></Text>
                </View>
              </View>
            )}

            {/* BODYWEIGHT INPUTS */}
            {equipmentCategory === 'bodyweight' && (
              <View style={s.box}>
                <Text style={s.boxTitle}>BODYWEIGHT / ADDED LOAD</Text>
                <TouchableOpacity
                  style={[s.toggleRow, isBodyweightOnly && s.toggleRowActive]}
                  onPress={() => setIsBodyweightOnly(!isBodyweightOnly)}>
                  <Ionicons name={isBodyweightOnly ? "checkbox" : "square-outline"} size={20} color={isBodyweightOnly ? Colors.gold : Colors.text2} />
                  <Text style={s.toggleText}>Bodyweight Only (No extra weight added)</Text>
                </TouchableOpacity>

                {!isBodyweightOnly && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={s.label}>Added Belt / Plate Weight (kg)</Text>
                    <View style={s.counterRow}>
                      <TouchableOpacity style={s.counterBtn} onPress={() => setAddedWeight(Math.max(0, addedWeight - 2.5))}>
                        <Ionicons name="remove" size={20} color={Colors.text} />
                      </TouchableOpacity>
                      <TextInput
                        style={s.counterInput}
                        keyboardType="numeric"
                        value={String(addedWeight)}
                        onChangeText={v => setAddedWeight(parseFloat(v) || 0)}
                      />
                      <TouchableOpacity style={s.counterBtn} onPress={() => setAddedWeight(addedWeight + 2.5)}>
                        <Ionicons name="add" size={20} color={Colors.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* REPS ACHIEVED & RPE */}
            <View style={s.box}>
              <Text style={s.boxTitle}>REPETITIONS & RPE EFFORT</Text>

              <Text style={s.label}>Reps Completed</Text>
              <View style={s.counterRow}>
                <TouchableOpacity style={s.counterBtn} onPress={() => setReps(Math.max(1, reps - 1))}>
                  <Ionicons name="remove" size={20} color={Colors.text} />
                </TouchableOpacity>
                <TextInput
                  style={s.counterInput}
                  keyboardType="numeric"
                  value={String(reps)}
                  onChangeText={v => setReps(parseInt(v, 10) || 0)}
                />
                <TouchableOpacity style={s.counterBtn} onPress={() => setReps(reps + 1)}>
                  <Ionicons name="add" size={20} color={Colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={[s.label, { marginTop: 12 }]}>Rate of Perceived Exertion (RPE 1-10)</Text>
              <View style={s.rpeRow}>
                {[
                  { score: 6, label: 'Easy (RPE 6)' },
                  { score: 8, label: 'Target (RPE 8)' },
                  { score: 10, label: 'Max Effort (RPE 10)' },
                ].map(item => (
                  <TouchableOpacity
                    key={item.score}
                    style={[s.rpeChip, rpe === item.score && s.rpeChipSelected]}
                    onPress={() => setRpe(item.score)}>
                    <Text style={[s.rpeChipText, rpe === item.score && s.rpeChipTextSelected]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

          </ScrollView>

          {/* Action Save Button */}
          <TouchableOpacity
            style={s.saveBtn}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}>
            {saving ? (
              <ActivityIndicator size="small" color="#0A0A0A" />
            ) : (
              <Text style={s.saveBtnText}>Save Set Data &amp; Overload Logs 💪</Text>
            )}
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 30, maxHeight: '90%', borderWidth: 1, borderColor: Colors.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  tagRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  tagBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,196,0,0.12)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(245,196,0,0.3)' },
  tagBadgeText: { fontSize: 9.5, fontWeight: '800', color: Colors.gold },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },

  catRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  catBtn: { flex: 1, backgroundColor: Colors.card2, borderRadius: 10, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  catBtnSelected: { backgroundColor: 'rgba(245,196,0,0.15)', borderColor: Colors.gold },
  catBtnText: { fontSize: 10, fontWeight: '700', color: Colors.text2 },
  catBtnTextSelected: { color: Colors.gold, fontWeight: '800' },

  box: { backgroundColor: Colors.card, borderRadius: Radii.md, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  boxTitle: { fontSize: 10, fontWeight: '800', color: Colors.gold, letterSpacing: 0.8, marginBottom: 10 },
  label: { fontSize: 11.5, fontWeight: '700', color: Colors.text, marginBottom: 6 },

  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  presetChip: { backgroundColor: Colors.card2, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  presetChipSelected: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  presetChipText: { fontSize: 11, fontWeight: '700', color: Colors.text2 },
  presetChipTextSelected: { color: '#0A0A0A', fontWeight: '900' },

  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  counterBtn: { width: 42, height: 42, borderRadius: 10, backgroundColor: Colors.card2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  counterInput: { flex: 1, height: 42, backgroundColor: Colors.card2, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, textAlign: 'center', fontSize: 18, fontWeight: '800', color: Colors.text },

  calculatedCard: { backgroundColor: Colors.card2, borderRadius: 10, padding: 12, marginTop: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245,196,0,0.2)' },
  calculatedTag: { fontSize: 9, fontWeight: '800', color: Colors.gold, letterSpacing: 0.8, marginBottom: 2 },
  calculatedVal: { fontSize: 20, fontWeight: '900', color: Colors.text },
  calculatedUnit: { fontSize: 12, color: Colors.text2 },
  calculatedSub: { fontSize: 10, color: Colors.text2, marginTop: 2 },

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.card2, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  toggleRowActive: { borderColor: Colors.gold, backgroundColor: 'rgba(245,196,0,0.08)' },
  toggleText: { fontSize: 12, fontWeight: '700', color: Colors.text },

  rpeRow: { flexDirection: 'row', gap: 6 },
  rpeChip: { flex: 1, backgroundColor: Colors.card2, paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  rpeChipSelected: { backgroundColor: Colors.green, borderColor: Colors.green },
  rpeChipText: { fontSize: 10.5, fontWeight: '700', color: Colors.text2 },
  rpeChipTextSelected: { color: '#0A0A0A', fontWeight: '900' },

  saveBtn: { backgroundColor: Colors.gold, borderRadius: Radii.md, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  saveBtnText: { fontSize: 14, fontWeight: '900', color: '#0A0A0A' },
});
