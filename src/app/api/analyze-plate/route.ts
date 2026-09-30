import { NextRequest, NextResponse } from 'next/server';
import { processAndSavePlateScan } from '@/backend/controllers/mealController';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType = 'image/jpeg' } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'Missing imageBase64 payload' }, { status: 400 });
    }

    // Process image through Cloudinary, Gemini 3.5 Flash Lite Vision AI & MongoDB Atlas
    const savedMeal = await processAndSavePlateScan(imageBase64, mimeType);

    return NextResponse.json({
      isMock: false,
      dish: savedMeal
    });

  } catch (error: any) {
    console.error('[API /api/analyze-plate Error]:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Failed to analyze plate with Gemini Vision AI' },
      { status: 500 }
    );
  }
}
