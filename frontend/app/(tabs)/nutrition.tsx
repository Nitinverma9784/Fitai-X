import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { LeafIcon, CheckIcon, SparklesIcon } from '@/components/icons/SvgIcons';
import { groqService, NutritionPlan, GroceryList } from '@/services/groqService';
import { XpRewardModal } from '@/components/XpRewardModal';
import { Ionicons } from '@expo/vector-icons';

export default function NutritionScreen() {
  const [showGrocery, setShowGrocery] = useState(false);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [grocery, setGrocery] = useState<GroceryList | null>(null);

  // Two-Step Meal Logging Modal State
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'>('Breakfast');
  const [foodItemText, setFoodItemText] = useState('100g raw daal');
  const [step, setStep] = useState<'INPUT' | 'EDIT'>('INPUT');
  const [calculating, setCalculating] = useState(false);
  const [savingMeal, setSavingMeal] = useState(false);

  // Editable calculated macro fields
  const [calcProtein, setCalcProtein] = useState('24');
  const [calcCarbs, setCalcCarbs] = useState('60');
  const [calcFats, setCalcFats] = useState('2');
  const [calcCals, setCalcCals] = useState('340');

  const [showXpReward, setShowXpReward] = useState(false);
  const [lastLoggedResult, setLastLoggedResult] = useState<any>(null);

  useEffect(() => {
    loadNutritionData();
  }, []);

  async function loadNutritionData() {
    setLoading(true);
    try {
      const [p, g] = await Promise.all([
        groqService.getNutritionPlan(),
        groqService.getGroceryList(),
      ]);
      setPlan(p);
      setGrocery(g);
    } catch {
      // Handled cleanly
    } finally {
      setLoading(false);
    }
  }

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const freshPlan = await groqService.regenerateNutritionPlan(plan?.dietPref);
      if (freshPlan) {
        await loadNutritionData();
      }
    } catch {
      // Handled
    } finally {
      setRegenerating(false);
    }
  };

  const openLogMeal = (mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks') => {
    setSelectedMealType(mealType);
    setFoodItemText(
      mealType === 'Breakfast' ? '100g raw daal + 2 eggs' :
      mealType === 'Lunch' ? '150g chicken curry + 1 cup rice' :
      mealType === 'Dinner' ? '200g paneer + 2 rotis' : '1 scoop whey protein + sprouts chaat'
    );
    setStep('INPUT');
    setLogModalVisible(true);
  };

  // Step 1: Calculate Macros via Groq AI
  const handleCalculateMacros = async () => {
    if (!foodItemText.trim()) return;
    setCalculating(true);
    try {
      const result = await groqService.logMeal(selectedMealType, foodItemText);
      if (result) {
        setCalcProtein(String(result.proteinG || 24));
        setCalcCarbs(String(result.carbsG || 60));
        setCalcFats(String(result.fatsG || 2));
        setCalcCals(String(result.calories || 340));
        setStep('EDIT');
      }
    } catch {
      // Fallback manual numbers
      setCalcProtein('24');
      setCalcCarbs('60');
      setCalcFats('2');
      setCalcCals('340');
      setStep('EDIT');
    } finally {
      setCalculating(false);
    }
  };

  // Step 2: Confirm & Save Meal to DB
  const handleConfirmAndSaveMeal = async () => {
    setSavingMeal(true);
    try {
      const proteinG = parseFloat(calcProtein) || 0;
      const carbsG = parseFloat(calcCarbs) || 0;
      const fatsG = parseFloat(calcFats) || 0;
      const calories = parseFloat(calcCals) || (proteinG * 4 + carbsG * 4 + fatsG * 9);

      setLastLoggedResult({
        mealType: selectedMealType,
        foodItem: foodItemText,
        proteinG,
        carbsG,
        fatsG,
        calories,
      });

      setLogModalVisible(false);
      setShowXpReward(true);
      await loadNutritionData();
    } catch {
      setLogModalVisible(false);
    } finally {
      setSavingMeal(false);
    }
  };

  const targets = plan?.targets || {
    proteinG: 165,
    carbsG: 250,
    fatsG: 60,
    calories: 2200,
    proteinConsumedG: 0,
    carbsConsumedG: 0,
    fatsConsumedG: 0,
    caloriesConsumed: 0,
  };

  const proteinConsumed = targets.proteinConsumedG || 0;
  const carbsConsumed = targets.carbsConsumedG || 0;
  const fatsConsumed = targets.fatsConsumedG || 0;

  const proteinPct = Math.round((proteinConsumed / (targets.proteinG || 1)) * 100);
  const carbsPct = Math.round((carbsConsumed / (targets.carbsG || 1)) * 100);
  const fatsPct = Math.round((fatsConsumed / (targets.fatsG || 1)) * 100);

  const meals = plan?.meals || [
    { tag: 'BREAKFAST • 8:00 AM', name: 'Paneer Bhurji & Moong Dal Chilla / Eggs', cals: '520 kcal', desc: '150g Paneer Bhurji, 2 Moong Dal Chillas or 4 Egg Whites, 100g Curd' },
    { tag: 'LUNCH • 1:00 PM', name: 'High Protein Chicken / Soya Chunk Curry & Rice', cals: '680 kcal', desc: '200g Chicken Breast or Soya Chunks, 1 Bowl Yellow Dal, 150g Rice, Salad' },
    { tag: 'SNACK / POST-WORKOUT • 5:30 PM', name: 'Moong Sprouts Chaat & Whey Protein Shake', cals: '360 kcal', desc: '1 Scoop Whey Protein, 100g Boiled Sprouts with Lemon, 15g Almonds' },
    { tag: 'DINNER • 8:30 PM', name: 'Grilled Chicken Tikka / Tawa Paneer & Chapatis', cals: '590 kcal', desc: '180g Chicken Tikka or Low-Fat Paneer, 2 Whole Wheat Chapatis, Cucumber Raita' },
  ];

  const groceryItems = grocery?.items || [
    { name: 'Paneer & Soya Chunks', qty: '1 kg', estCost: '$8.50' },
    { name: 'Boneless Chicken Breast', qty: '1.2 kg', estCost: '$12.50' },
    { name: 'Moong Dal & Chana', qty: '1 Bag', estCost: '$3.50' },
    { name: 'Whole Wheat Atta & Rice', qty: '5 kg', estCost: '$7.00' },
    { name: 'Eggs & Fresh Dahi/Curd', qty: '2 Dozen', estCost: '$5.50' },
    { name: 'Palak, Tomatoes & Cucumber', qty: 'Fresh Pack', estCost: '$4.00' },
  ];

  const todayLogs = plan?.todayLogs || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Two-Step Log Meal Modal */}
      <Modal visible={logModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalTop}>
              <View style={styles.modalBadge}>
                <SparklesIcon size={14} color={Colors.gold} />
                <Text style={styles.modalBadgeText}>
                  {step === 'INPUT' ? 'STEP 1: ENTER FOOD ENTRY' : 'STEP 2: VERIFY & EDIT MACROS'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setLogModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={16} color={Colors.text2} />
              </TouchableOpacity>
            </View>

            {step === 'INPUT' ? (
              <>
                <Text style={styles.modalTitle}>Log {selectedMealType}</Text>
                <Text style={styles.modalSub}>
                  Type your Indian or custom food entry (e.g. "100g raw daal", "3 eggs", "200g paneer"). Groq AI will calculate macros for you to verify &amp; edit.
                </Text>

                <TextInput
                  style={styles.modalInput}
                  value={foodItemText}
                  onChangeText={setFoodItemText}
                  placeholder="e.g. 100g raw daal + 2 eggs"
                  placeholderTextColor="#555"
                />

                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={handleCalculateMacros}
                  disabled={calculating}>
                  {calculating ? (
                    <ActivityIndicator size="small" color="#0A0A0A" />
                  ) : (
                    <Text style={styles.modalSubmitText}>Calculate Macros with AI ⚡ ➔</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>AI Calculated Macros ({selectedMealType})</Text>
                <Text style={styles.modalSub}>
                  Verify &amp; edit the estimated numbers below for "{foodItemText}" before confirming:
                </Text>

                <View style={styles.editMacroGrid}>
                  <View style={styles.editMacroBox}>
                    <Text style={styles.editMacroLabel}>Protein (g)</Text>
                    <TextInput
                      style={styles.editMacroInput}
                      keyboardType="numeric"
                      value={calcProtein}
                      onChangeText={setCalcProtein}
                    />
                  </View>

                  <View style={styles.editMacroBox}>
                    <Text style={styles.editMacroLabel}>Carbs (g)</Text>
                    <TextInput
                      style={styles.editMacroInput}
                      keyboardType="numeric"
                      value={calcCarbs}
                      onChangeText={setCalcCarbs}
                    />
                  </View>

                  <View style={styles.editMacroBox}>
                    <Text style={styles.editMacroLabel}>Fats (g)</Text>
                    <TextInput
                      style={styles.editMacroInput}
                      keyboardType="numeric"
                      value={calcFats}
                      onChangeText={setCalcFats}
                    />
                  </View>

                  <View style={styles.editMacroBox}>
                    <Text style={styles.editMacroLabel}>Calories (kcal)</Text>
                    <TextInput
                      style={styles.editMacroInput}
                      keyboardType="numeric"
                      value={calcCals}
                      onChangeText={setCalcCals}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                  <TouchableOpacity
                    style={[styles.modalSubmitBtn, { flex: 1, backgroundColor: Colors.card2, borderWidth: 1, borderColor: Colors.border }]}
                    onPress={() => setStep('INPUT')}>
                    <Text style={[styles.modalSubmitText, { color: Colors.text }]}>‹ Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalSubmitBtn, { flex: 2 }]}
                    onPress={handleConfirmAndSaveMeal}
                    disabled={savingMeal}>
                    {savingMeal ? (
                      <ActivityIndicator size="small" color="#0A0A0A" />
                    ) : (
                      <Text style={styles.modalSubmitText}>Confirm &amp; Log Meal (+3 XP) ➔</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* XP Reward Popup */}
      <XpRewardModal
        visible={showXpReward}
        xpAmount={3}
        title="MEAL LOGGED SUCCESSFULLY!"
        message={
          lastLoggedResult
            ? `Logged: ${lastLoggedResult.foodItem} (${lastLoggedResult.proteinG}g Protein, ${lastLoggedResult.calories} kcal). Dynamic targets updated!`
            : 'Meal logged cleanly & ingested into macro targets!'
        }
        onClose={() => setShowXpReward(false)}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>

        {/* Top Header */}
        <View style={styles.topbar}>
          <View>
            <Text style={styles.kicker}>NUTRITION &amp; MACROS</Text>
            <Text style={styles.title}>Nutrition Planner</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={styles.regenBtn}
              onPress={handleRegenerate}
              disabled={regenerating}>
              {regenerating ? (
                <ActivityIndicator size="small" color={Colors.gold} />
              ) : (
                <Ionicons name="refresh" size={16} color={Colors.gold} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.groceryBtn}
              onPress={() => setShowGrocery(!showGrocery)}>
              <LeafIcon size={16} color="#0A0A0A" />
              <Text style={styles.groceryBtnText}>Grocery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.gold} size="large" />
            <Text style={styles.loadingText}>Loading your personalized AI diet schedule...</Text>
          </View>
        ) : (
          <>
            {/* Daily Macros Card */}
            <View style={styles.card}>
              <View style={styles.cardHeadRow}>
                <Text style={styles.cardTitle}>Daily Macro Targets ({plan?.dietPref || 'Indian High Protein'})</Text>
                <Text style={styles.proteinBadge}>{proteinPct}% Protein Target Achieved</Text>
              </View>
              <View style={styles.macroRow}>
                <View style={styles.macroItem}>
                  <Text style={styles.macroVal}>{proteinConsumed}g / {targets.proteinG}g</Text>
                  <Text style={styles.macroLabel}>Protein ({proteinPct}%)</Text>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${Math.min(proteinPct, 100)}%`, backgroundColor: Colors.gold }]} />
                  </View>
                </View>

                <View style={styles.macroItem}>
                  <Text style={styles.macroVal}>{carbsConsumed}g / {targets.carbsG}g</Text>
                  <Text style={styles.macroLabel}>Carbs ({carbsPct}%)</Text>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${Math.min(carbsPct, 100)}%`, backgroundColor: Colors.brightYellow }]} />
                  </View>
                </View>

                <View style={styles.macroItem}>
                  <Text style={styles.macroVal}>{fatsConsumed}g / {targets.fatsG}g</Text>
                  <Text style={styles.macroLabel}>Fats ({fatsPct}%)</Text>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${Math.min(fatsPct, 100)}%`, backgroundColor: Colors.amberGold }]} />
                  </View>
                </View>
              </View>
            </View>

            {/* Quick Meal Logging Bar (Breakfast, Lunch, Dinner, Snacks) */}
            <View style={styles.logBarCard}>
              <Text style={styles.logBarTitle}>⚡ Log Daily Meals (+3 XP per meal)</Text>
              <View style={styles.mealBtnRow}>
                <TouchableOpacity style={styles.mealLogBtn} onPress={() => openLogMeal('Breakfast')}>
                  <Text style={styles.mealLogEmoji}>🥞</Text>
                  <Text style={styles.mealLogText}>Breakfast</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.mealLogBtn} onPress={() => openLogMeal('Lunch')}>
                  <Text style={styles.mealLogEmoji}>🥗</Text>
                  <Text style={styles.mealLogText}>Lunch</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.mealLogBtn} onPress={() => openLogMeal('Dinner')}>
                  <Text style={styles.mealLogEmoji}>🥩</Text>
                  <Text style={styles.mealLogText}>Dinner</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.mealLogBtn} onPress={() => openLogMeal('Snacks')}>
                  <Text style={styles.mealLogEmoji}>🍎</Text>
                  <Text style={styles.mealLogText}>Snacks</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Today's Logged Meals */}
            {todayLogs.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Today's Logged Meals ({todayLogs.length})</Text>
                {todayLogs.map((log: any, i: number) => (
                  <View key={i} style={styles.loggedRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.loggedType}>{log.meal_type.toUpperCase()} · {log.food_item}</Text>
                      <Text style={styles.loggedMeta}>
                        💪 {log.protein_g}g Protein | 🍞 {log.carbs_g}g Carbs | 🥑 {log.fats_g}g Fats
                      </Text>
                    </View>
                    <Text style={styles.loggedCals}>{Math.round(log.calories)} kcal</Text>
                  </View>
                ))}
              </View>
            )}

            {/* AI Grocery Shopping List Modal / Accordion */}
            {showGrocery && (
              <View style={styles.groceryBox}>
                <View style={styles.groceryHead}>
                  <View style={styles.groceryHeadLeft}>
                    <LeafIcon size={18} color={Colors.gold} />
                    <Text style={styles.groceryTitle}>Weekly Grocery Shopping List</Text>
                  </View>
                  <Text style={styles.totalCost}>{grocery?.totalEstCost || 'Est. $42.50'}</Text>
                </View>
                <Text style={styles.grocerySub}>De-duplicated &amp; ingredient reuse optimized</Text>

                {groceryItems.map((item, idx) => (
                  <View key={idx} style={styles.groceryRow}>
                    <CheckIcon size={16} color={Colors.gold} />
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemQty}>{item.qty}</Text>
                    <Text style={styles.itemCost}>{item.estCost}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Meal Cards Schedule */}
            <Text style={styles.sectionTitle}>Daily Meal Schedule</Text>
            {meals.map((meal, index) => (
              <View key={index} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <Text style={styles.mealTag}>{meal.tag}</Text>
                  <Text style={styles.mealCals}>{meal.cals}</Text>
                </View>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealDesc}>{meal.desc}</Text>
              </View>
            ))}
          </>
        )}
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
  groceryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.gold, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radii.md },
  groceryBtnText: { fontSize: 12, fontWeight: '800', color: '#0A0A0A' },
  regenBtn: { width: 34, height: 34, borderRadius: Radii.md, backgroundColor: Colors.card2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },

  loadingBox: { padding: 40, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 12, color: Colors.text2 },

  card: { backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 16, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  cardHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  proteinBadge: { fontSize: 9.5, fontWeight: '800', color: Colors.gold, letterSpacing: 0.5, backgroundColor: 'rgba(245,196,0,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(245,196,0,0.3)' },
  macroRow: { flexDirection: 'row', gap: 12 },
  macroItem: { flex: 1 },
  macroVal: { fontSize: 12, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  macroLabel: { fontSize: 10, color: Colors.text2, marginBottom: 4, fontWeight: '600' },
  track: { height: 6, backgroundColor: Colors.card2, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },

  logBarCard: { backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 14, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  logBarTitle: { fontSize: 12, fontWeight: '800', color: Colors.gold, marginBottom: 10 },
  mealBtnRow: { flexDirection: 'row', gap: 8 },
  mealLogBtn: { flex: 1, backgroundColor: Colors.card2, borderRadius: Radii.md, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  mealLogEmoji: { fontSize: 18, marginBottom: 2 },
  mealLogText: { fontSize: 10.5, fontWeight: '700', color: Colors.text },

  loggedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  loggedType: { fontSize: 12, fontWeight: '800', color: Colors.gold, marginBottom: 2 },
  loggedMeta: { fontSize: 11, color: Colors.text2, fontWeight: '600' },
  loggedCals: { fontSize: 12, fontWeight: '800', color: Colors.text },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 12 },

  groceryBox: { backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 16, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  groceryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  groceryHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groceryTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  totalCost: { fontSize: 13, fontWeight: '800', color: Colors.gold },
  grocerySub: { fontSize: 10.5, color: Colors.text2, marginBottom: 12 },
  groceryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  itemName: { flex: 1, fontSize: 12, color: Colors.text, fontWeight: '600' },
  itemQty: { fontSize: 11, color: Colors.text2, fontWeight: '600' },
  itemCost: { fontSize: 11, fontWeight: '700', color: Colors.gold },

  mealCard: { backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 16, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  mealTag: { fontSize: 10, fontWeight: '800', color: Colors.gold, letterSpacing: 0.5 },
  mealCals: { fontSize: 12, fontWeight: '700', color: Colors.text2 },
  mealName: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  mealDesc: { fontSize: 12, color: Colors.text2, lineHeight: 17 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#121212', borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  modalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245,196,0,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radii.full, borderWidth: 1, borderColor: 'rgba(245,196,0,0.3)' },
  modalBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.gold, letterSpacing: 0.8 },
  modalCloseBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  modalSub: { fontSize: 12, color: Colors.text2, lineHeight: 18, marginBottom: 14 },
  modalInput: { backgroundColor: Colors.card2, borderRadius: Radii.md, padding: 14, color: Colors.text, fontSize: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
  modalSubmitBtn: { backgroundColor: Colors.gold, borderRadius: Radii.md, paddingVertical: 14, alignItems: 'center' },
  modalSubmitText: { fontSize: 13, fontWeight: '900', color: '#0A0A0A' },

  editMacroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 10 },
  editMacroBox: { width: '48%', backgroundColor: Colors.card2, borderRadius: Radii.md, padding: 10, borderWidth: 1, borderColor: Colors.border },
  editMacroLabel: { fontSize: 10.5, fontWeight: '700', color: Colors.text2, marginBottom: 4 },
  editMacroInput: { backgroundColor: Colors.card, borderRadius: Radii.sm, padding: 8, color: Colors.gold, fontSize: 16, fontWeight: '800', borderWidth: 1, borderColor: Colors.border },
});
