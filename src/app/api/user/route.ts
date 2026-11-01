import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile, updateUserProfile, deleteUserAccount } from '@/backend/controllers/userController';
import { deleteAllMealsForUser } from '@/backend/controllers/mealController';
import { getSession, unauthorized, clearSessionCookie } from '@/backend/auth/session';

// GET /api/user — the signed-in user's own profile (identity comes from the session cookie)
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();

  try {
    const user = await getUserProfile(session.email);
    if (!user) {
      const res = unauthorized('Account not found.');
      clearSessionCookie(res);
      return res;
    }
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('[API /api/user GET Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch user profile' }, { status: 500 });
  }
}

// POST /api/user — update the signed-in user's own profile
export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();

  try {
    const body = await req.json();
    const user = await updateUserProfile(session.email, body);
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('[API /api/user POST Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to update user profile' }, { status: 500 });
  }
}

// DELETE /api/user — permanently delete account + all meals (GDPR / CCPA right to erasure)
export async function DELETE(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();

  try {
    await deleteAllMealsForUser(session.uid);
    await deleteUserAccount(session.email);
    const res = NextResponse.json({ success: true });
    clearSessionCookie(res);
    return res;
  } catch (error: any) {
    console.error('[API /api/user DELETE Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete account' }, { status: 500 });
  }
}
