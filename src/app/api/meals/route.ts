import { NextRequest, NextResponse } from 'next/server';
import { getLoggedMeals, deleteLoggedMeal } from '@/backend/controllers/mealController';

// GET /api/meals - Retrieve logged meals from MongoDB Atlas
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date') || undefined;

    const meals = await getLoggedMeals(dateStr);

    return NextResponse.json({ success: true, meals });
  } catch (error: any) {
    console.error('[API /api/meals GET Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch meals' },
      { status: 500 }
    );
  }
}

// DELETE /api/meals?id=xxx - Delete a meal from MongoDB Atlas
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing meal ID' },
        { status: 400 }
      );
    }

    await deleteLoggedMeal(id);

    return NextResponse.json({ success: true, message: 'Meal deleted successfully' });
  } catch (error: any) {
    console.error('[API /api/meals DELETE Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete meal' },
      { status: 500 }
    );
  }
}
