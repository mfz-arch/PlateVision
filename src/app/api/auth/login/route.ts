import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/backend/controllers/userController';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await loginUser(body);
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('[API /api/auth/login Error]:', error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Incorrect email or password' },
      { status: 401 }
    );
  }
}
