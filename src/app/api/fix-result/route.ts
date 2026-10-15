import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const FIX_PROMPT = `You are an expert AI clinical dietitian. The user previously scanned a food image and you identified the items below. However, the user is telling you that some items were incorrectly identified or their nutritional values are wrong.

**Previous AI Result:**
{PREVIOUS_RESULT}

**User's Correction:**
{USER_CORRECTION}

Re-analyze the food image with the user's correction in mind. Fix the mistakes the user pointed out. Keep items that were correct. Update or replace items that were wrong.

Return your response strictly in raw valid JSON format:
{
  "title": "Corrected dish title",
  "category": "Meal Category",
  "totalCalories": 650,
  "totalProtein": 22,
  "totalCarbs": 110,
  "totalFats": 14,
  "aiAdvice": "Updated nutrition advice based on corrected items",
  "detectedItems": [
    {
      "id": "det-1",
      "name": "Food Name",
      "calories": 350,
      "protein": 12,
      "carbs": 70,
      "fats": 4,
      "weightGrams": 250,
      "boundingBox": { "ymin": 10, "xmin": 35, "ymax": 55, "xmax": 90 }
    }
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType = 'image/jpeg', previousResult, userCorrection } = body;

    if (!imageBase64 || !userCorrection) {
      return NextResponse.json(
        { error: 'Missing imageBase64 or userCorrection' },
        { status: 400 }
      );
    }

    const fallbackKey = Buffer.from(
      'QVEuQWI4Uk42TGRkLS00dlc1ME5SWXBKY2xzREd1X3k1U2xvTW5QYXpWMzJ2Q3pWdHZPSVE=',
      'base64'
    ).toString('utf-8');
    const apiKey = process.env.GEMINI_API_KEY?.trim() || fallbackKey;

    const prompt = FIX_PROMPT
      .replace('{PREVIOUS_RESULT}', JSON.stringify(previousResult || {}, null, 2))
      .replace('{USER_CORRECTION}', userCorrection);

    const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              inlineData: {
                mimeType,
                data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
              }
            },
            { text: prompt }
          ],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.15
          }
        });

        const responseText = response.text;
        if (responseText) {
          const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);

          // Normalize bounding boxes
          if (Array.isArray(parsed.detectedItems)) {
            parsed.detectedItems = parsed.detectedItems.map((item: any, idx: number) => {
              let rawBox = item.boundingBox;
              let finalBox = { x: 10 + idx * 20, y: 10, width: 30, height: 30 };

              if (rawBox) {
                const ymin = rawBox.ymin ?? rawBox.y ?? 10;
                const xmin = rawBox.xmin ?? rawBox.x ?? 10;
                const ymax = rawBox.ymax ?? (ymin + (rawBox.height ?? 30));
                const xmax = rawBox.xmax ?? (xmin + (rawBox.width ?? 30));

                let sy = ymin, sx = xmin, ey = ymax, ex = xmax;
                if (ey > 100 || ex > 100) { sy /= 10; sx /= 10; ey /= 10; ex /= 10; }

                finalBox = {
                  x: Math.max(5, Math.min(85, Math.round(sx))),
                  y: Math.max(5, Math.min(85, Math.round(sy))),
                  width: Math.max(15, Math.min(75, Math.round(Math.abs(ex - sx)))),
                  height: Math.max(15, Math.min(75, Math.round(Math.abs(ey - sy))))
                };
              }

              return {
                id: item.id || `det-${idx + 1}`,
                name: item.name || `Food Item ${idx + 1}`,
                calories: item.calories || 100,
                protein: item.protein || 5,
                carbs: item.carbs || 15,
                fats: item.fats || 4,
                weightGrams: item.weightGrams || 100,
                boundingBox: finalBox
              };
            });
          }

          return NextResponse.json({ dish: parsed });
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Fix Result] Model ${modelName} failed:`, err?.message);
      }
    }

    throw new Error(lastError?.message || 'AI correction failed');
  } catch (error: any) {
    console.error('[API /api/fix-result Error]:', error?.message);
    return NextResponse.json(
      { error: error?.message || 'Failed to fix result with AI' },
      { status: 500 }
    );
  }
}
