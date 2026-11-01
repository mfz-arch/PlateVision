import { NextRequest, NextResponse } from 'next/server';
import { getSession, unauthorized, forbidden, isAdminEmail } from '@/backend/auth/session';
import { getAdminActivity } from '@/backend/controllers/adminController';

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();
  if (!isAdminEmail(session.email)) return forbidden();

  try {
    const activity = await getAdminActivity();
    return NextResponse.json({ success: true, activity });
  } catch (error: any) {
    console.error('[API /api/admin/activity Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch activity feed' },
      { status: 500 }
    );
  }
}

