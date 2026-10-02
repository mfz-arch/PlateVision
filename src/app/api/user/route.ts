import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile, updateUserProfile } from '@/backend/controllers/userController';

// GET /api/user - Retrieve user profile and macro targets from MongoDB Atlas
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email') || undefined;
    const user = await getUserProfile(email);
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('[API /api/user GET Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

// POST /api/user - Save user onboarding and recalculate target macros in MongoDB Atlas
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await updateUserProfile(body);
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('[API /api/user POST Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update user profile' },
      { status: 500 }
    );
  }
}
