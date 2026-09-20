import { SampleDish, ScannedMeal } from '../types/plateVision';

export const SAMPLE_DISHES: SampleDish[] = [
  {
    id: 'dish-1',
    title: 'Grilled Salmon Bowl with Quinoa & Avocado',
    category: 'High Protein / Clean',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    totalCalories: 640,
    totalProtein: 42,
    totalCarbs: 55,
    totalFats: 22,
    detectedItems: [
      {
        id: 'item-1',
        name: 'Atlantic Salmon Fillet',
        calories: 320,
        protein: 34,
        carbs: 0,
        fats: 18,
        weightGrams: 180,
        boundingBox: { x: 25, y: 20, width: 45, height: 35 }
      },
      {
        id: 'item-2',
        name: 'Organic Quinoa',
        calories: 180,
        protein: 6,
        carbs: 34,
        fats: 2.5,
        weightGrams: 120,
        boundingBox: { x: 15, y: 55, width: 35, height: 30 }
      },
      {
        id: 'item-3',
        name: 'Sliced Hass Avocado',
        calories: 140,
        protein: 2,
        carbs: 8,
        fats: 12,
        weightGrams: 80,
        boundingBox: { x: 55, y: 50, width: 30, height: 35 }
      }
    ],
    aiAdvice: 'Excellent post-workout balanced meal! The omega-3 fats from salmon support joint health, while quinoa provides complex slow-release carbohydrates.'
  },
  {
    id: 'dish-2',
    title: 'Chicken Breast, Sweet Potato & Broccoli',
    category: 'Lean Muscle Build',
    imageUrl: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80',
    totalCalories: 520,
    totalProtein: 48,
    totalCarbs: 45,
    totalFats: 9,
    detectedItems: [
      {
        id: 'item-4',
        name: 'Grilled Chicken Breast',
        calories: 280,
        protein: 42,
        carbs: 0,
        fats: 5,
        weightGrams: 200,
        boundingBox: { x: 20, y: 15, width: 50, height: 40 }
      },
      {
        id: 'item-5',
        name: 'Roasted Sweet Potato',
        calories: 160,
        protein: 3,
        carbs: 37,
        fats: 1,
        weightGrams: 150,
        boundingBox: { x: 15, y: 58, width: 35, height: 32 }
      },
      {
        id: 'item-6',
        name: 'Steamed Broccoli Floret',
        calories: 80,
        protein: 3,
        carbs: 8,
        fats: 3,
        weightGrams: 120,
        boundingBox: { x: 55, y: 50, width: 32, height: 38 }
      }
    ],
    aiAdvice: 'Top tier bodybuilding staple! High protein-to-calorie ratio. Micronutrient density is fantastic with vitamin C and potassium.'
  },
  {
    id: 'dish-3',
    title: 'Mediterranean Greek Salad with Feta & Olives',
    category: 'Low Carb / Fiber Rich',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    totalCalories: 380,
    totalProtein: 14,
    totalCarbs: 18,
    totalFats: 28,
    detectedItems: [
      {
        id: 'item-7',
        name: 'Feta Cheese Cubes',
        calories: 180,
        protein: 10,
        carbs: 2,
        fats: 14,
        weightGrams: 70,
        boundingBox: { x: 30, y: 25, width: 35, height: 30 }
      },
      {
        id: 'item-8',
        name: 'Kalamata Olives & Extra Virgin Olive Oil',
        calories: 140,
        protein: 1,
        carbs: 4,
        fats: 14,
        weightGrams: 40,
        boundingBox: { x: 15, y: 55, width: 30, height: 30 }
      },
      {
        id: 'item-9',
        name: 'Cucumbers, Tomatoes & Red Onions',
        calories: 60,
        protein: 3,
        carbs: 12,
        fats: 0,
        weightGrams: 200,
        boundingBox: { x: 50, y: 45, width: 40, height: 40 }
      }
    ],
    aiAdvice: 'Light and refreshing! Great source of polyphenols and healthy fats. Consider adding a lean protein source like chicken if you need post-exercise recovery.'
  }
];

export const INITIAL_LOGGED_MEALS: ScannedMeal[] = [
  {
    id: 'log-1',
    title: 'Oatmeal with Blueberries & Almond Butter',
    timestamp: '08:30 AM',
    imageUrl: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=800&q=80',
    totalCalories: 450,
    totalProtein: 18,
    totalCarbs: 62,
    totalFats: 14,
    detectedItems: [],
    aiAdvice: 'Great complex carbohydrates to kickstart metabolic energy for the morning.'
  },
  {
    id: 'log-2',
    title: 'Grilled Salmon Bowl with Quinoa & Avocado',
    timestamp: '01:15 PM',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    totalCalories: 640,
    totalProtein: 42,
    totalCarbs: 55,
    totalFats: 22,
    detectedItems: [],
    aiAdvice: 'Perfect macro balance for lunch.'
  }
];
