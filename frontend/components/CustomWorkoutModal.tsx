import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { workoutService, WorkoutRecord } from '@/services/workoutService';
import { VERIFIED_EXERCISE_CATALOG } from '@/constants/exerciseCatalog';

interface CustomWorkoutModalProps {
  visible: boolean;
  onClose: () => void;
  onPlanCreated: (customExercises: string[], customTitle?: string) => void;
}

interface SelectedExercise {
  id: string;
  name: string;
  targetMuscle: string;
  sets: number;
  reps: string;
  restSec: number;
  icon: string;
  images?: [string, string];
  videoUrl?: string;
  steps?: string[];
  tip?: string;
}

const CATEGORIES = ['All', 'Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core'];

export function CustomWorkoutModal({ visible, onClose, onPlanCreated }: CustomWorkoutModalProps) {
  const [catalog, setCatalog] = useState<any[]>(VERIFIED_EXERCISE_CATALOG);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [customTitle, setCustomTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadCatalog() {
      setLoadingCatalog(true);
      try {
        const serverCat = await workoutService.getExerciseCatalog();
        if (Array.isArray(serverCat) && serverCat.length > 0) {
          setCatalog(serverCat);
        }
      } catch (e) {
        console.warn('⚠️ Could not load exercise catalog:', e);
      } finally {
        setLoadingCatalog(false);
      }
    }
    if (visible) {
      loadCatalog();
    }
  }, [visible]);

  const filteredCatalog = catalog.filter(item => {
    const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const nameStr = (item.name || '').toLowerCase();
    const targetStr = (item.targetMuscle || item.target_muscle || '').toLowerCase();
    const queryStr = searchQuery.toLowerCase();
    const matchQuery = nameStr.includes(queryStr) || targetStr.includes(queryStr);
    return matchCategory && matchQuery;
  });

  const addExercise = (item: any) => {
    if (selectedExercises.some(ex => ex.name === item.name)) return;
    const newItem: SelectedExercise = {
      id: item.id || String(Date.now()),
      name: item.name,
      targetMuscle: item.targetMuscle || item.category || 'Target Muscle',
      sets: 3,
      reps: '10-12',
      restSec: 60,
      icon: item.icon || 'dumbbell',
      images: item.images,
      videoUrl: item.videoUrl,
      steps: item.steps,
      tip: item.tip,
    };
    setSelectedExercises(prev => [...prev, newItem]);
  };

  const removeExercise = (index: number) => {
    setSelectedExercises(prev => prev.filter((_, i) => i !== index));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...selectedExercises];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setSelectedExercises(next);
  };

  const moveDown = (index: number) => {
    if (index === selectedExercises.length - 1) return;
    const next = [...selectedExercises];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setSelectedExercises(next);
  };

  const updateSets = (index: number, delta: number) => {
    setSelectedExercises(prev =>
      prev.map((ex, i) => (i === index ? { ...ex, sets: Math.max(1, Math.min(10, ex.sets + delta)) } : ex))
    );
  };

  const handleMakePlan = async () => {
    if (selectedExercises.length === 0) {
      Alert.alert('No Exercises Selected', 'Please select at least 1 exercise to build your custom workout.');
      return;
    }
    const exerciseNames = selectedExercises.map(ex => ex.name);
    onPlanCreated(exerciseNames, customTitle.trim() || undefined);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>AI CUSTOM ROUTINE</Text>
            <Text style={styles.title}>Custom Workout Builder</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
          {/* Custom Routine Title Input */}
          <View style={styles.titleCard}>
            <Text style={styles.sectionLabel}>ROUTINE NAME (OPTIONAL)</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="e.g. Heavy Upper Body Power, Chest & Arms Burnout"
              placeholderTextColor={Colors.text2}
              value={customTitle}
              onChangeText={setCustomTitle}
            />
          </View>

          {/* Selected Exercises Block */}
          <View style={styles.blockCard}>
            <View style={styles.blockHeader}>
              <Text style={styles.sectionLabel}>SELECTED EXERCISES ({selectedExercises.length})</Text>
              {selectedExercises.length > 0 && (
                <TouchableOpacity onPress={() => setSelectedExercises([])}>
                  <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            {selectedExercises.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="barbell-outline" size={32} color={Colors.text2} />
                <Text style={styles.emptyTitle}>No exercises added yet</Text>
                <Text style={styles.emptySub}>Select exercises from the library below to compose your routine.</Text>
              </View>
            ) : (
              selectedExercises.map((ex, idx) => (
                <View key={`${ex.name}-${idx}`} style={styles.selectedRow}>
                  <Image
                    source={{ uri: (ex.images && ex.images[0]) ? ex.images[0] : 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pushups/0.jpg' }}
                    style={styles.exThumb}
                  />
                  <View style={styles.exInfo}>
                    <Text style={styles.exName}>{ex.name}</Text>
                    <Text style={styles.exTarget}>{ex.targetMuscle}</Text>
                  </View>

                  {/* Reorder Arrows */}
                  <View style={styles.arrowCol}>
                    <TouchableOpacity onPress={() => moveUp(idx)} disabled={idx === 0} style={styles.arrowBtn}>
                      <Ionicons name="chevron-up" size={14} color={idx === 0 ? '#333' : Colors.text2} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => moveDown(idx)} disabled={idx === selectedExercises.length - 1} style={styles.arrowBtn}>
                      <Ionicons name="chevron-down" size={14} color={idx === selectedExercises.length - 1 ? '#333' : Colors.text2} />
                    </TouchableOpacity>
                  </View>

                  {/* Sets Control */}
                  <View style={styles.setsBox}>
                    <TouchableOpacity onPress={() => updateSets(idx, -1)} style={styles.setBtn}>
                      <Text style={styles.setBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.setsVal}>{ex.sets} sets</Text>
                    <TouchableOpacity onPress={() => updateSets(idx, 1)} style={styles.setBtn}>
                      <Text style={styles.setBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Remove Button */}
                  <TouchableOpacity onPress={() => removeExercise(idx)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={16} color="#FF4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Exercise Library Section */}
          <View style={styles.libraryCard}>
            <Text style={styles.sectionLabel}>EXERCISE LIBRARY</Text>

            {/* Search Input */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={Colors.text2} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by exercise or muscle (e.g. Bench, Squat, Lats)..."
                placeholderTextColor={Colors.text2}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery !== '' && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color={Colors.text2} />
                </TouchableOpacity>
              )}
            </View>

            {/* Muscle Group Category Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
              {CATEGORIES.map(cat => {
                const active = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.pill, active && styles.pillActive]}
                    onPress={() => setSelectedCategory(cat)}>
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Catalog Grid List */}
            <View style={styles.catalogList}>
              {loadingCatalog ? (
                <View style={{ paddingVertical: 24, alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color={Colors.gold} />
                  <Text style={{ fontSize: 12, color: Colors.text2 }}>Loading exercise catalog...</Text>
                </View>
              ) : filteredCatalog.length === 0 ? (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: Colors.text2 }}>No exercises found matching "{searchQuery}"</Text>
                </View>
              ) : (
                filteredCatalog.map(item => {
                  const isSelected = selectedExercises.some(ex => ex.name === item.name);
                  const thumbUri = (item.images && item.images[0]) ? item.images[0] : 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pushups/0.jpg';
                  return (
                    <View key={item.name} style={styles.itemRow}>
                      <Image source={{ uri: thumbUri }} style={styles.itemThumb} />
                      <View style={styles.itemMain}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemSub}>{item.targetMuscle || item.category} • {item.equipment || 'Gym'}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.addBtn, isSelected && styles.addedBtn]}
                        onPress={() => addExercise(item)}
                        disabled={isSelected}>
                        <Text style={[styles.addBtnText, isSelected && styles.addedBtnText]}>
                          {isSelected ? '✓ Added' : '+ Add'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        </ScrollView>

        {/* Footer Make Plan Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.makePlanBtn, submitting && { opacity: 0.7 }]}
            onPress={handleMakePlan}
            disabled={submitting}>
            {submitting ? (
              <View style={styles.btnRow}>
                <ActivityIndicator size="small" color="#0A0A0A" />
                <Text style={styles.makePlanText}>Generating AI Reasoning & Video Guides...</Text>
              </View>
            ) : (
              <View style={styles.btnRow}>
                <Ionicons name="sparkles" size={18} color="#0A0A0A" />
                <Text style={styles.makePlanText}>MAKE PLAN ({selectedExercises.length} EXERCISES)</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.bg, marginTop: 40, borderTopLeftRadius: Radii.lg, borderTopRightRadius: Radii.lg, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.card },
  kicker: { fontSize: 10, fontWeight: '800', color: Colors.gold, letterSpacing: 1 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text, marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 14 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: Colors.text2, letterSpacing: 0.8, marginBottom: 8 },
  titleCard: { backgroundColor: Colors.card, borderRadius: Radii.md, padding: 14, borderWidth: 1, borderColor: Colors.border },
  titleInput: { backgroundColor: '#141414', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: Colors.text, fontSize: 13, borderWidth: 1, borderColor: Colors.border },
  blockCard: { backgroundColor: Colors.card, borderRadius: Radii.md, padding: 14, borderWidth: 1, borderColor: Colors.border },
  blockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clearText: { fontSize: 11, fontWeight: '700', color: '#FF4444' },
  emptyBox: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  emptySub: { fontSize: 12, color: Colors.text2, textAlign: 'center', paddingHorizontal: 20 },
  selectedRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141414', borderRadius: 8, padding: 10, marginBottom: 8, gap: 8, borderWidth: 1, borderColor: Colors.border },
  exThumb: { width: 40, height: 40, borderRadius: 6, backgroundColor: '#222' },
  exNum: { fontSize: 12, fontWeight: '900', color: Colors.gold, width: 16 },
  exInfo: { flex: 1 },
  exName: { fontSize: 13, fontWeight: '700', color: Colors.text },
  exTarget: { fontSize: 10, color: Colors.text2 },
  arrowCol: { gap: 2 },
  arrowBtn: { padding: 2 },
  setsBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 6, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 4, paddingVertical: 2, gap: 4 },
  setBtn: { paddingHorizontal: 6, paddingVertical: 2 },
  setBtnText: { fontSize: 14, fontWeight: '700', color: Colors.gold },
  setsVal: { fontSize: 11, fontWeight: '800', color: Colors.text },
  deleteBtn: { padding: 6 },
  libraryCard: { backgroundColor: Colors.card, borderRadius: Radii.md, padding: 14, borderWidth: 1, borderColor: Colors.border },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141414', borderRadius: 10, paddingHorizontal: 12, height: 44, gap: 8, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 13, paddingVertical: 0, height: '100%', textAlignVertical: 'center' },
  pillsScroll: { marginBottom: 14 },
  pill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#141414', borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  pillActive: { backgroundColor: 'rgba(245,196,0,0.15)', borderColor: Colors.gold },
  pillText: { fontSize: 12, fontWeight: '600', color: Colors.text2 },
  pillTextActive: { color: Colors.gold, fontWeight: '700' },
  catalogList: { gap: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141414', borderRadius: 8, padding: 10, gap: 10, borderWidth: 1, borderColor: Colors.border },
  itemThumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#222' },
  itemIconBox: { width: 32, height: 32, borderRadius: 6, backgroundColor: 'rgba(245,196,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  itemMain: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '700', color: Colors.text },
  itemSub: { fontSize: 11, color: Colors.text2, marginTop: 1 },
  addBtn: { backgroundColor: Colors.gold, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
  addedBtn: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: Colors.border },
  addBtnText: { fontSize: 12, fontWeight: '800', color: '#0A0A0A' },
  addedBtnText: { color: Colors.text2 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.card },
  makePlanBtn: { backgroundColor: Colors.gold, borderRadius: Radii.md, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  makePlanText: { fontSize: 13, fontWeight: '900', color: '#0A0A0A', letterSpacing: 0.5 },
});
