import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/backend/auth/session';

// POST /api/auth/logout — clear the session cookie
export async function POST() {
  const res = NextResponse.json({ success: true });
  clearSessionCookie(res);
  return res;
}
