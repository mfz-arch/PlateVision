import { NextRequest, NextResponse } from 'next/server';
import { analyzePlateImage } from '@/backend/controllers/mealController';
import { getSession } from '@/backend/auth/session';
import { rateLimit, getClientIp } from '@/backend/security/rateLimit';

// POST /api/analyze-plate — analyze a meal photo (does NOT save it to the log)
export async function POST(req: NextRequest) {
  const session = getSession(req);
  const clientIp = getClientIp(req);
  const userId = session?.uid || `guest:${clientIp}`;

  // 40 AI scans per hour for authenticated users, 20 for guests
  const limitKey = session ? `scan:user:${session.uid}` : `scan:ip:${clientIp}`;
  const maxLimit = session ? 40 : 20;
  const limited = rateLimit(limitKey, maxLimit, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const body = await req.json();
    const { imageBase64, mimeType = 'image/jpeg' } = body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json({ error: 'Missing imageBase64 payload' }, { status: 400 });
    }
    if (imageBase64.length > 8_000_000) {
      return NextResponse.json({ error: 'Image is too large. Please use a smaller photo.' }, { status: 413 });
    }
    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(mimeType)) {
      return NextResponse.json({ error: 'Unsupported image type.' }, { status: 415 });
    }

    const dish = await analyzePlateImage(imageBase64, mimeType, userId);
    return NextResponse.json({ isMock: false, dish });
  } catch (error: any) {
    console.error('[API /api/analyze-plate Error]:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Failed to analyze plate. Please try again.' },
      { status: 500 }
    );
  }
}
