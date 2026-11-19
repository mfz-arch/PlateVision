import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getSession } from '@/backend/auth/session';
import { rateLimit, getClientIp } from '@/backend/security/rateLimit';
import TokenUsage from '@/backend/models/TokenUsage';
import { toLocalDateStr } from '@/lib/date';

export const maxDuration = 60;

const FIX_PROMPT = `You are an expert AI clinical dietitian. The user previously scanned a food image and you identified the items below. However, the user is telling you that some items were incorrectly identified or their nutritional values are wrong.

**Previous AI Result:**
{PREVIOUS_RESULT}

**User's Correction:**
{USER_CORRECTION}

Re-analyze the food image with the user's correction in mind. Fix the mistakes the user pointed out. Keep items that were correct. Update or replace items that were wrong.
IMPORTANT: Preserve the exact "id" and "boundingBox" coordinates (in normalized 0-100 percentages: ymin, xmin, ymax, xmax, or x, y, width, height) from Previous AI Result for every item that refers to the same region on the plate. Only compute a new boundingBox if a brand-new food item was added.

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
      'gemini-3.1-flash-lite'
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
          let cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
          let parsed: any;
          try {
            parsed = JSON.parse(cleanJson);
          } catch {
            const firstBrace = cleanJson.indexOf('{');
            const lastBrace = cleanJson.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace > firstBrace) {
              cleanJson = cleanJson.slice(firstBrace, lastBrace + 1);
              parsed = JSON.parse(cleanJson);
            } else {
              throw new Error('Invalid JSON response from Vision AI');
            }
          }

          const prevItems: any[] = Array.isArray(previousResult?.detectedItems)
            ? previousResult.detectedItems
            : [];
          const quadrantBoxes = [
            { x: 35, y: 10, width: 55, height: 45 },
            { x: 8, y: 52, width: 42, height: 40 },
            { x: 52, y: 60, width: 40, height: 35 },
            { x: 8, y: 12, width: 35, height: 38 }
          ];

          // Normalize bounding boxes while preserving accurate previous boxes
          if (Array.isArray(parsed.detectedItems)) {
            parsed.detectedItems = parsed.detectedItems.map((item: any, idx: number) => {
              const matchedPrev =
                prevItems.find((p) => p?.id && item?.id && p.id === item.id) ||
                prevItems.find(
                  (p) =>
                    p?.name &&
                    item?.name &&
                    p.name.toLowerCase().trim() === item.name.toLowerCase().trim()
                ) ||
                prevItems[idx];

              const box = item.boundingBox;
              let finalBox = matchedPrev?.boundingBox &&
                typeof matchedPrev.boundingBox.x === 'number' &&
                typeof matchedPrev.boundingBox.y === 'number'
                ? { ...matchedPrev.boundingBox }
                : quadrantBoxes[idx % quadrantBoxes.length];

              if (box) {
                if (Array.isArray(box) && box.length === 4) {
                  let [ymin, xmin, ymax, xmax] = box.map(Number);
                  if (ymax > 100 || xmax > 100) {
                    ymin /= 10; xmin /= 10; ymax /= 10; xmax /= 10;
                  }
                  if ([ymin, xmin, ymax, xmax].every((n) => Number.isFinite(n))) {
                    finalBox = {
                      x: Math.max(5, Math.min(85, Math.round(xmin))),
                      y: Math.max(5, Math.min(85, Math.round(ymin))),
                      width: Math.max(15, Math.min(75, Math.round(Math.abs(xmax - xmin)))),
                      height: Math.max(15, Math.min(75, Math.round(Math.abs(ymax - ymin))))
                    };
                  }
                } else if (typeof box === 'object') {
                  if (box.ymin !== undefined && box.xmin !== undefined && box.ymax !== undefined && box.xmax !== undefined) {
                    let ymin = Number(box.ymin) > 100 ? Number(box.ymin) / 10 : Number(box.ymin);
                    let xmin = Number(box.xmin) > 100 ? Number(box.xmin) / 10 : Number(box.xmin);
                    let ymax = Number(box.ymax) > 100 ? Number(box.ymax) / 10 : Number(box.ymax);
                    let xmax = Number(box.xmax) > 100 ? Number(box.xmax) / 10 : Number(box.xmax);
                    if ([ymin, xmin, ymax, xmax].every((n) => Number.isFinite(n))) {
                      finalBox = {
                        x: Math.max(5, Math.min(85, Math.round(xmin))),
                        y: Math.max(5, Math.min(85, Math.round(ymin))),
                        width: Math.max(15, Math.min(75, Math.round(Math.abs(xmax - xmin)))),
                        height: Math.max(15, Math.min(75, Math.round(Math.abs(ymax - ymin))))
                      };
                    }
                  } else if (box.x !== undefined && box.y !== undefined) {
                    const bx = Number(box.x);
                    const by = Number(box.y);
                    const bw = Number(box.width || 40);
                    const bh = Number(box.height || 40);
                    if ([bx, by, bw, bh].every((n) => Number.isFinite(n))) {
                      finalBox = {
                        x: Math.max(5, Math.min(85, Math.round(bx))),
                        y: Math.max(5, Math.min(85, Math.round(by))),
                        width: Math.max(15, Math.min(75, Math.round(bw))),
                        height: Math.max(15, Math.min(75, Math.round(bh)))
                      };
                    }
                  }
                }
              }

              return {
                id: item.id || matchedPrev?.id || `fixed-${idx + 1}`,
                name: item.name || `Item ${idx + 1}`,
                calories: Number(item.calories) || 0,
                protein: Number(item.protein) || 0,
                carbs: Number(item.carbs) || 0,
                fats: Number(item.fats) || 0,
                weightGrams: Number(item.weightGrams) || 100,
                boundingBox: finalBox
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
