import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/backend/controllers/userController';
import { setSessionCookie, getUserOwnerId } from '@/backend/auth/session';
import { rateLimit, getClientIp } from '@/backend/security/rateLimit';

export async function POST(req: NextRequest) {
  // Brute-force protection: 10 attempts / 15 min per IP
  const limited = rateLimit(`login:${getClientIp(req)}`, 10, 15 * 60 * 1000);
  if (limited) return limited;

  try {
    const body = await req.json();
    const user = await loginUser({ email: body?.email, password: body?.password });
    const res = NextResponse.json({ success: true, user });
    setSessionCookie(res, getUserOwnerId(user), user.email);
    return res;
  } catch (error: any) {
    console.error('[API /api/auth/login Error]:', error?.message || error);
    // Generic message — don't reveal whether the email exists
    return NextResponse.json(
      { success: false, error: 'Incorrect email or password' },
      { status: 401 }
    );
  }
}
