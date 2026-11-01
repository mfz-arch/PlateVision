import { NextRequest, NextResponse } from 'next/server';
import { getSession, unauthorized, forbidden, isAdminEmail } from '@/backend/auth/session';
import { getAdminOverview } from '@/backend/controllers/adminController';

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();
  if (!isAdminEmail(session.email)) return forbidden();

  try {
    const stats = await getAdminOverview();
    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    console.error('[API /api/admin/overview Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}

