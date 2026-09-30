import { GoogleGenAI } from '@google/genai';

const SYSTEM_PROMPT = `You are an expert AI clinical dietitian and computer vision model. 
Analyze the provided food image in detail. 

Identify every distinct food item visible on the plate.
Estimate portion weights in grams, total calories, protein (g), carbs (g), and fats (g).
Provide bounding box percentages (x, y, width, height from 0 to 100) for each identified item so we can draw visual overlays.

Return your response strictly in raw valid JSON format adhering to this structure:
{
  "title": "Descriptive Name of the Dish",
  "category": "Meal Category (e.g., High-Protein Bowl, Traditional Platter, Balanced Meal)",
  "totalCalories": 450,
  "totalProtein": 32,
  "totalCarbs": 48,
  "totalFats": 14,
  "aiAdvice": "Actionable, positive nutrition insight about this specific meal",
  "detectedItems": [
    {
      "id": "det-1",
      "name": "Identified Food Component",
      "calories": 200,
      "protein": 25,
      "carbs": 0,
      "fats": 8,
      "weightGrams": 140,
      "boundingBox": { "x": 15, "y": 20, "width": 40, "height": 45 }
    }
  ]
}`;

export async function analyzeFoodImageWithGemini(cleanBase64: string, mimeType = 'image/jpeg') {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in .env.local');
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: [
      {
        inlineData: {
          mimeType: mimeType,
          data: cleanBase64
        }
      },
      {
        text: SYSTEM_PROMPT
      }
    ],
    config: {
      responseMimeType: 'application/json',
      temperature: 0.1
    }
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error('Empty response received from Gemini Vision Model');
  }

  const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleanJson);

  // Post-process detectedItems to guarantee valid bounding boxes
  if (Array.isArray(parsed.detectedItems)) {
    const fallbackBoxes = [
      { x: 15, y: 20, width: 42, height: 45 },
      { x: 52, y: 22, width: 38, height: 40 },
      { x: 22, y: 55, width: 50, height: 36 },
      { x: 10, y: 30, width: 35, height: 35 }
    ];

    parsed.detectedItems = parsed.detectedItems.map((item: any, idx: number) => {
      let box = item.boundingBox;
      if (!box || typeof box.x !== 'number' || typeof box.y !== 'number' || typeof box.width !== 'number' || typeof box.height !== 'number') {
        box = fallbackBoxes[idx % fallbackBoxes.length];
      } else {
        // Ensure values are within 0..100%
        box.x = Math.max(5, Math.min(85, box.x));
        box.y = Math.max(5, Math.min(85, box.y));
        box.width = Math.max(15, Math.min(70, box.width));
        box.height = Math.max(15, Math.min(70, box.height));
      }

      return {
        id: item.id || `det-${idx + 1}`,
        name: item.name || `Food Item ${idx + 1}`,
        calories: item.calories || 100,
        protein: item.protein || 5,
        carbs: item.carbs || 10,
        fats: item.fats || 3,
        weightGrams: item.weightGrams || 100,
        boundingBox: box
      };
    });
  }

  return parsed;
}
