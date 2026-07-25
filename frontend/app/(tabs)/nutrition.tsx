import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { LeafIcon, CheckIcon, SparklesIcon } from '@/components/icons/SvgIcons';

export default function NutritionScreen() {
  const [showGrocery, setShowGrocery] = useState(false);

  const groceryItems = [
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

        {/* Daily Macros Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Macro Targets</Text>
          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <Text style={styles.macroVal}>165g / 180g</Text>
              <Text style={styles.macroLabel}>Protein (91%)</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: '91%', backgroundColor: Colors.gold }]} />
              </View>
            </View>

            <View style={styles.macroItem}>
              <Text style={styles.macroVal}>220g / 250g</Text>
              <Text style={styles.macroLabel}>Carbs (88%)</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: '88%', backgroundColor: Colors.brightYellow }]} />
              </View>
            </View>

            <View style={styles.macroItem}>
              <Text style={styles.macroVal}>55g / 65g</Text>
              <Text style={styles.macroLabel}>Fats (84%)</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: '84%', backgroundColor: Colors.amberGold }]} />
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
              <Text style={styles.totalCost}>Est. $42.50</Text>
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

        <View style={styles.mealCard}>
          <View style={styles.mealHeader}>
            <Text style={styles.mealTag}>BREAKFAST • 8:00 AM</Text>
            <Text style={styles.mealCals}>540 kcal</Text>
          </View>
          <Text style={styles.mealName}>Oatmeal Bowl with Whey & Berries</Text>
          <Text style={styles.mealDesc}>70g Oats, 1 Scoop Whey Protein, 10g Chia Seeds, Blueberries</Text>
        </View>

        <View style={styles.mealCard}>
          <View style={styles.mealHeader}>
            <Text style={styles.mealTag}>LUNCH • 1:00 PM</Text>
            <Text style={styles.mealCals}>680 kcal</Text>
          </View>
          <Text style={styles.mealName}>Grilled Chicken & Sweet Potato Bowl</Text>
          <Text style={styles.mealDesc}>200g Chicken Breast, 250g Sweet Potato, Roasted Broccoli</Text>
        </View>

        <View style={styles.mealCard}>
          <View style={styles.mealHeader}>
            <Text style={styles.mealTag}>POST-WORKOUT • 5:30 PM</Text>
            <Text style={styles.mealCals}>350 kcal</Text>
          </View>
          <Text style={styles.mealName}>Anabolic Greek Yogurt & Honey</Text>
          <Text style={styles.mealDesc}>250g 0% Greek Yogurt, 15g Honey, 20g Almonds</Text>
        </View>

        <View style={styles.mealCard}>
          <View style={styles.mealHeader}>
            <Text style={styles.mealTag}>DINNER • 8:30 PM</Text>
            <Text style={styles.mealCals}>580 kcal</Text>
          </View>
          <Text style={styles.mealName}>Lean Egg White Stir-Fry & Rice</Text>
          <Text style={styles.mealDesc}>6 Whole Egg Whites + 2 Eggs, 150g Jasmine Rice, Vegetables</Text>
        </View>
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

