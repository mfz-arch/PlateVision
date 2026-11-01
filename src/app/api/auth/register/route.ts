import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/backend/controllers/userController';
import { setSessionCookie, getUserOwnerId } from '@/backend/auth/session';
import { rateLimit, getClientIp } from '@/backend/security/rateLimit';

export async function POST(req: NextRequest) {
  // Bot / spam protection: 5 sign-ups per hour per IP
  const limited = rateLimit(`register:${getClientIp(req)}`, 5, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const body = await req.json();

    // Honeypot field: real users never fill it, bots usually do
    if (body?.website) {
      return NextResponse.json({ success: false, error: 'Failed to create account' }, { status: 400 });
    }

    const user = await registerUser(body);
    const res = NextResponse.json({ success: true, user });
    setSessionCookie(res, getUserOwnerId(user), user.email);
    return res;
  } catch (error: any) {
    console.error('[API /api/auth/register Error]:', error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create account' },
      { status: 400 }
    );
  }
}
