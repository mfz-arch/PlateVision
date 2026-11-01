import { NextRequest, NextResponse } from 'next/server';
import { getSession, unauthorized, forbidden, isAdminEmail } from '@/backend/auth/session';
import { getAdminUsers } from '@/backend/controllers/adminController';

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();
  if (!isAdminEmail(session.email)) return forbidden();

  try {
    const search = req.nextUrl.searchParams.get('search') || undefined;
    const users = await getAdminUsers(search);
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error('[API /api/admin/users Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

