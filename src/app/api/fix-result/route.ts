import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getSession } from '@/backend/auth/session';
import { rateLimit, getClientIp } from '@/backend/security/rateLimit';
import TokenUsage from '@/backend/models/TokenUsage';
import { toLocalDateStr } from '@/lib/date';

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

const fallbackApiKey = Buffer.from(
  'QVEuQWI4Uk42TGRkLS00dlc1ME5SWXBKY2xzREd1X3k1U2xvTW5QYXpWMzJ2Q3pWdHZPSVE=',
  'base64'
).toString('utf-8');

export async function POST(req: NextRequest) {
  const session = getSession(req);
  const clientIp = getClientIp(req);
  const userId = session?.uid || `guest:${clientIp}`;

  const limitKey = session ? `fix:user:${session.uid}` : `fix:ip:${clientIp}`;
  const maxLimit = session ? 20 : 10;
  const limited = rateLimit(limitKey, maxLimit, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const body = await req.json();
    const { imageBase64, mimeType = 'image/jpeg', previousResult } = body;
    const userCorrection = typeof body.userCorrection === 'string' ? body.userCorrection.trim().slice(0, 500) : '';

    if (!imageBase64 || typeof imageBase64 !== 'string' || !userCorrection) {
      return NextResponse.json(
        { error: 'Missing imageBase64 or userCorrection' },
        { status: 400 }
      );
    }
    if (imageBase64.length > 8_000_000) {
      return NextResponse.json({ error: 'Image is too large.' }, { status: 413 });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim() || fallbackApiKey;

    const prompt = FIX_PROMPT
      .replace('{PREVIOUS_RESULT}', JSON.stringify(previousResult || {}, null, 2).slice(0, 6000))
      .replace('{USER_CORRECTION}', userCorrection);

    const modelsToTry = [
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.8-flash'
    ];
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

        // Record Token Usage asynchronously
        if (response.usageMetadata) {
          const usage = response.usageMetadata;
          const promptTokens = usage.promptTokenCount || 0;
          const candidatesTokens = usage.candidatesTokenCount || 0;
          const totalTokens = usage.totalTokenCount || (promptTokens + candidatesTokens);

          TokenUsage.create({
            dateStr: toLocalDateStr(),
            userId,
            action: 'fix_result',
            aiModel: modelName,
            promptTokens,
            candidatesTokens,
            totalTokens
          }).catch((err) => console.warn('[TokenUsage] Failed to record fix tokens:', err.message));
        }

        const responseText = response.text;
        if (responseText) {
          const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);

          // Normalize bounding boxes
          if (Array.isArray(parsed.detectedItems)) {
            parsed.detectedItems = parsed.detectedItems.map((item: any, idx: number) => {
              let box = item.boundingBox;
              let x = 10, y = 10, width = 40, height = 40;

              if (box) {
                if (box.ymin !== undefined && box.xmin !== undefined && box.ymax !== undefined && box.xmax !== undefined) {
                  let ymin = box.ymin > 100 ? box.ymin / 10 : box.ymin;
                  let xmin = box.xmin > 100 ? box.xmin / 10 : box.xmin;
                  let ymax = box.ymax > 100 ? box.ymax / 10 : box.ymax;
                  let xmax = box.xmax > 100 ? box.xmax / 10 : box.xmax;
                  x = Math.max(5, Math.min(85, Math.round(xmin)));
                  y = Math.max(5, Math.min(85, Math.round(ymin)));
                  width = Math.max(15, Math.min(75, Math.round(Math.abs(xmax - xmin))));
                  height = Math.max(15, Math.min(75, Math.round(Math.abs(ymax - ymin))));
                } else if (box.x !== undefined && box.y !== undefined) {
                  x = Math.max(5, Math.min(85, Math.round(box.x)));
                  y = Math.max(5, Math.min(85, Math.round(box.y)));
                  width = Math.max(15, Math.min(75, Math.round(box.width || 40)));
                  height = Math.max(15, Math.min(75, Math.round(box.height || 40)));
                }
              }

              return {
                id: item.id || `fixed-${idx + 1}`,
                name: item.name || `Item ${idx + 1}`,
                calories: Number(item.calories) || 0,
                protein: Number(item.protein) || 0,
                carbs: Number(item.carbs) || 0,
                fats: Number(item.fats) || 0,
                weightGrams: Number(item.weightGrams) || 100,
                boundingBox: { x, y, width, height }
              };
            });
          }

          return NextResponse.json({
            success: true,
            dish: {
              id: 'fixed-' + Date.now(),
              title: parsed.title || 'Corrected Dish',
              category: parsed.category || 'Corrected AI Scan',
              totalCalories: parsed.totalCalories || 0,
              totalProtein: parsed.totalProtein || 0,
              totalCarbs: parsed.totalCarbs || 0,
              totalFats: parsed.totalFats || 0,
              detectedItems: parsed.detectedItems || [],
              aiAdvice: parsed.aiAdvice || 'Updated nutrition breakdown based on your correction.'
            }
          });
        }
      } catch (err: any) {
        console.warn(`[AI Fix] Model ${modelName} failed:`, err?.message || err);
        lastError = err;
      }
    }

    return NextResponse.json(
      { error: `AI correction failed: ${lastError?.message || 'Unable to update result.'}` },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('[API /api/fix-result Error]:', error?.message || error);
    return NextResponse.json(
      { error: 'Failed to process AI correction request.' },
      { status: 500 }
    );
  }
}
