import { NextRequest, NextResponse } from 'next/server';
import { getMealsForUser, saveMealForUser, deleteMealForUser } from '@/backend/controllers/mealController';
import { getSession, unauthorized } from '@/backend/auth/session';

// GET /api/meals?date=YYYY-MM-DD — only the signed-in user's meals for that day
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();

  try {
    const dateStr = req.nextUrl.searchParams.get('date') || undefined;
    const meals = await getMealsForUser(session.uid, dateStr);
    return NextResponse.json({ success: true, meals });
  } catch (error: any) {
    console.error('[API /api/meals GET Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch meals' }, { status: 500 });
  }
}

// POST /api/meals — log a confirmed meal for the signed-in user
export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();

  try {
    const body = await req.json();
    const meal = await saveMealForUser(session.uid, body);
    return NextResponse.json({ success: true, meal });
  } catch (error: any) {
    console.error('[API /api/meals POST Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to save meal' }, { status: 500 });
  }
}

// DELETE /api/meals?id=xxx — delete one of the signed-in user's meals
export async function DELETE(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();

  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing meal ID' }, { status: 400 });
    }

    const deleted = await deleteMealForUser(session.uid, id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Meal not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Meal deleted successfully' });
  } catch (error: any) {
    console.error('[API /api/meals DELETE Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete meal' }, { status: 500 });
  }
}
