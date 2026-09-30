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
  return JSON.parse(cleanJson);
}
