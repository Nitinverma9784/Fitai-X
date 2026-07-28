export interface GroceryItem {
  id: string;
  name: string;
  category: 'Protein' | 'Carbs' | 'Fats' | 'Produce' | 'Pantry';
  quantity: string;
  estimatedCostUsd: number;
  reusedInMealCount: number;
}

export interface GroceryPlanResult {
  weeklyBudgetUsd: number;
  totalEstimatedCostUsd: number;
  savingsUsd: number;
  zeroWasteReuseScorePct: number;
  dietPreference: string;
  shoppingList: GroceryItem[];
  dailyMealOutline: Array<{ day: string; breakfast: string; lunch: string; dinner: string; snack: string }>;
}

export function generateGroceryPlan(weeklyBudgetUsd: number = 60, dietPref: string = 'High Protein Non-Veg'): GroceryPlanResult {
  const isVeg = dietPref.toLowerCase().includes('veg') && !dietPref.toLowerCase().includes('non');
  const isBudgetStrict = weeklyBudgetUsd <= 50;

  const baseItems: GroceryItem[] = isVeg
    ? [
        { id: '1', name: 'Greek Yogurt (1kg)', category: 'Protein', quantity: '2 tubs', estimatedCostUsd: 7.5, reusedInMealCount: 7 },
        { id: '2', name: 'Organic Tofu & Cottage Cheese', category: 'Protein', quantity: '1.2 kg', estimatedCostUsd: 9.0, reusedInMealCount: 5 },
        { id: '3', name: 'Brown Rice & Quinoa Bulk Pack', category: 'Carbs', quantity: '2 kg', estimatedCostUsd: 6.0, reusedInMealCount: 7 },
        { id: '4', name: 'Rolled Oats', category: 'Carbs', quantity: '1 kg', estimatedCostUsd: 3.5, reusedInMealCount: 7 },
        { id: '5', name: 'Lentils & Chickpeas', category: 'Protein', quantity: '1.5 kg', estimatedCostUsd: 4.5, reusedInMealCount: 6 },
        { id: '6', name: 'Fresh Spinach & Broccoli', category: 'Produce', quantity: '800 g', estimatedCostUsd: 5.5, reusedInMealCount: 5 },
        { id: '7', name: 'Peanut Butter & Almonds', category: 'Fats', quantity: '500 g', estimatedCostUsd: 6.0, reusedInMealCount: 7 },
      ]
    : [
        { id: '1', name: 'Chicken Breast (Bulk Pack)', category: 'Protein', quantity: '2.5 kg', estimatedCostUsd: 16.5, reusedInMealCount: 7 },
        { id: '2', name: 'Free-Range Eggs (30 Large)', category: 'Protein', quantity: '30 pcs', estimatedCostUsd: 7.0, reusedInMealCount: 7 },
        { id: '3', name: 'Jasmine Rice & Oats', category: 'Carbs', quantity: '2 kg', estimatedCostUsd: 5.5, reusedInMealCount: 7 },
        { id: '4', name: 'Sweet Potatoes & Bananas', category: 'Produce', quantity: '2 kg', estimatedCostUsd: 5.0, reusedInMealCount: 6 },
        { id: '5', name: 'Frozen Broccoli & Mixed Veggies', category: 'Produce', quantity: '1 kg', estimatedCostUsd: 4.5, reusedInMealCount: 5 },
        { id: '6', name: 'Olive Oil & Peanut Butter', category: 'Fats', quantity: '500 ml', estimatedCostUsd: 6.5, reusedInMealCount: 7 },
      ];

  let filteredList = baseItems;
  if (isBudgetStrict) {
    filteredList = baseItems.slice(0, 5);
  }

  const totalCost = filteredList.reduce((acc, curr) => acc + curr.estimatedCostUsd, 0);
  const roundedCost = Math.round(totalCost * 100) / 100;
  const savings = Math.max(0, Math.round((weeklyBudgetUsd - roundedCost) * 100) / 100);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mealOutline = days.map((day) => ({
    day,
    breakfast: 'Oats with Greek Yogurt & Peanut Butter',
    lunch: isVeg ? 'Quinoa Bowl with Tofu & Grilled Veggies' : 'Chicken Breast with Jasmine Rice & Broccoli',
    dinner: isVeg ? 'Lentil Curry with Brown Rice' : 'Egg Omelette / Scramble with Sweet Potato & Salad',
    snack: 'Protein Shake or Handful of Almonds',
  }));

  return {
    weeklyBudgetUsd,
    totalEstimatedCostUsd: roundedCost,
    savingsUsd: savings,
    zeroWasteReuseScorePct: 94,
    dietPreference: dietPref,
    shoppingList: filteredList,
    dailyMealOutline: mealOutline,
  };
}
