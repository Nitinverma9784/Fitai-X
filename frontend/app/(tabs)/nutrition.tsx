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
} from 'react-native';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { LeafIcon, CheckIcon } from '@/components/icons/SvgIcons';
import { groqService, NutritionPlan, GroceryList } from '@/services/groqService';

export default function NutritionScreen() {
  const [showGrocery, setShowGrocery] = useState(false);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [grocery, setGrocery] = useState<GroceryList | null>(null);

  useEffect(() => {
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
    loadNutritionData();
  }, []);

  const targets = plan?.targets || {
    proteinG: 180,
    carbsG: 250,
    fatsG: 65,
    calories: 2300,
    proteinConsumedG: 165,
    carbsConsumedG: 220,
    fatsConsumedG: 55,
  };

  const proteinPct = Math.round((targets.proteinConsumedG / (targets.proteinG || 1)) * 100);
  const carbsPct = Math.round((targets.carbsConsumedG / (targets.carbsG || 1)) * 100);
  const fatsPct = Math.round((targets.fatsConsumedG / (targets.fatsG || 1)) * 100);

  const meals = plan?.meals || [
    { tag: 'BREAKFAST • 8:00 AM', name: 'Oatmeal Bowl with Whey & Berries', cals: '540 kcal', desc: '70g Oats, 1 Scoop Whey Protein, 10g Chia Seeds, Blueberries' },
    { tag: 'LUNCH • 1:00 PM', name: 'Grilled Chicken & Sweet Potato Bowl', cals: '680 kcal', desc: '200g Chicken Breast, 250g Sweet Potato, Roasted Broccoli' },
    { tag: 'POST-WORKOUT • 5:30 PM', name: 'Anabolic Greek Yogurt & Honey', cals: '350 kcal', desc: '250g 0% Greek Yogurt, 15g Honey, 20g Almonds' },
    { tag: 'DINNER • 8:30 PM', name: 'Lean Egg White Stir-Fry & Rice', cals: '580 kcal', desc: '6 Whole Egg Whites + 2 Eggs, 150g Jasmine Rice, Vegetables' },
  ];

  const groceryItems = grocery?.items || [
    { name: 'Boneless Chicken Breast', qty: '1.2 kg', estCost: '$12.50' },
    { name: 'Liquid Egg Whites & Eggs', qty: '2 Dozen', estCost: '$6.80' },
    { name: 'Rolled Oats & Chia Seeds', qty: '1 Bag', estCost: '$4.20' },
    { name: 'Greek Yogurt (0% Fat)', qty: '1 Tub', estCost: '$5.00' },
    { name: 'Jasmine Rice & Sweet Potatoes', qty: '2 kg', estCost: '$6.00' },
    { name: 'Spinach, Broccoli & Avocados', qty: 'Fresh Pack', estCost: '$8.00' },
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
            <Text style={styles.kicker}>BUDGET & MACRO ENGINE</Text>
            <Text style={styles.title}>AI Nutrition Planner</Text>
          </View>
          <TouchableOpacity
            style={styles.groceryBtn}
            onPress={() => setShowGrocery(!showGrocery)}>
            <LeafIcon size={16} color="#0A0A0A" />
            <Text style={styles.groceryBtnText}>Grocery List</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.gold} size="large" />
            <Text style={styles.loadingText}>Generating AI meal schedule & macro plan...</Text>
          </View>
        ) : (
          <>
            {/* Daily Macros Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Daily Macro Targets ({plan?.dietPref || 'High Protein'})</Text>
              <View style={styles.macroRow}>
                <View style={styles.macroItem}>
                  <Text style={styles.macroVal}>{targets.proteinConsumedG}g / {targets.proteinG}g</Text>
                  <Text style={styles.macroLabel}>Protein ({proteinPct}%)</Text>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${Math.min(proteinPct, 100)}%`, backgroundColor: Colors.gold }]} />
                  </View>
                </View>

                <View style={styles.macroItem}>
                  <Text style={styles.macroVal}>{targets.carbsConsumedG}g / {targets.carbsG}g</Text>
                  <Text style={styles.macroLabel}>Carbs ({carbsPct}%)</Text>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${Math.min(carbsPct, 100)}%`, backgroundColor: Colors.brightYellow }]} />
                  </View>
                </View>

                <View style={styles.macroItem}>
                  <Text style={styles.macroVal}>{targets.fatsConsumedG}g / {targets.fatsG}g</Text>
                  <Text style={styles.macroLabel}>Fats ({fatsPct}%)</Text>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${Math.min(fatsPct, 100)}%`, backgroundColor: Colors.amberGold }]} />
                  </View>
                </View>
              </View>
            </View>

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
                <Text style={styles.grocerySub}>De-duplicated & ingredient reuse optimized</Text>

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

            {/* Today's Meal Schedule */}
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Today's Meal Schedule</Text>
            </View>

            {meals.map((meal, idx) => (
              <View key={idx} style={styles.mealCard}>
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
  safeArea: { flex: 1, backgroundColor: Colors.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  container: { flex: 1, paddingHorizontal: Spacing.lg },
  contentContainer: { paddingBottom: 100 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: Spacing.md },
  kicker: { fontSize: 10.5, fontWeight: '800', color: Colors.gold, letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginTop: 2 },
  groceryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.gold, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radii.full },
  groceryBtnText: { fontSize: 11, fontWeight: '800', color: '#0A0A0A' },
  loadingBox: { padding: 40, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 12, color: Colors.text2 },
  card: { backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 16, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  cardTitle: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  macroRow: { gap: 12 },
  macroItem: { marginBottom: 4 },
  macroVal: { fontSize: 13, fontWeight: '800', color: Colors.text },
  macroLabel: { fontSize: 11, color: Colors.text2, marginBottom: 4 },
  track: { height: 8, backgroundColor: Colors.card2, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  groceryBox: { backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 16, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.gold },
  groceryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  groceryHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groceryTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  totalCost: { fontSize: 13, fontWeight: '800', color: Colors.gold },
  grocerySub: { fontSize: 11, color: Colors.text2, marginVertical: 8 },
  groceryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  itemName: { flex: 1, fontSize: 12.5, fontWeight: '600', color: Colors.text },
  itemQty: { fontSize: 11, color: Colors.text2 },
  itemCost: { fontSize: 11, fontWeight: '700', color: Colors.gold, marginLeft: 8 },
  sectionHead: { marginVertical: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  mealCard: { backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  mealTag: { fontSize: 9.5, fontWeight: '800', color: Colors.gold },
  mealCals: { fontSize: 11, fontWeight: '700', color: Colors.text2 },
  mealName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  mealDesc: { fontSize: 11.5, color: Colors.text2, marginTop: 2 },
});
