import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/backend/controllers/userController';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await registerUser(body);
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('[API /api/auth/register Error]:', error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create account' },
      { status: 400 }
    );
  }
}
