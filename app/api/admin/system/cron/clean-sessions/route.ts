// app/api/cron/clean-sessions/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('[Cron] Cleaning old sessions...');
    
    // Hapus session yang expired
    const result = await prisma.session.deleteMany({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    });
    
    // Update cron job
    await prisma.cronJob.updateMany({
      where: { command: 'node scripts/clean-sessions.js' },
      data: {
        lastRun: new Date(),
        runs: { increment: 1 },
        successfulRuns: { increment: 1 },
      },
    });
    
    return NextResponse.json({
      success: true,
      message: `Cleaned ${result.count} expired sessions`,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json(
      { error: 'Failed to clean sessions' },
      { status: 500 }
    );
  }
}