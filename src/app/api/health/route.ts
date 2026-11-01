import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/backend/config/mongodb';
import User from '@/backend/models/User';

export async function GET() {
  try {
    const startTime = Date.now();
    await connectToDatabase();
    const userCount = await User.countDocuments({});
    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      status: 'ok',
      mongodb: 'connected',
      userCount,
      latencyMs: durationMs,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Health Check Error]:', error);
    return NextResponse.json(
      {
        status: 'error',
        mongodb: 'disconnected',
        error: error?.message || 'Database connection failed',
        hint: 'Please ensure MongoDB Atlas Network Access has 0.0.0.0/0 allowed so Vercel serverless IPs can connect.'
      },
      { status: 503 }
    );
  }
}

