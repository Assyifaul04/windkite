// app/api/cron/clean-sessions/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addHours } from 'date-fns';

const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key';

export async function GET(req: Request) {
  try {
    // Verifikasi authorization
    const authHeader = req.headers.get('authorization');
    const isVercelCron = req.headers.get('x-vercel-cron') === 'true';
    
    if (!isVercelCron && authHeader !== `Bearer ${CRON_SECRET}`) {
      console.log('❌ Unauthorized clean-sessions request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Cleaning old sessions...');
    
    const result = await prisma.session.deleteMany({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    });
    
    // Update cron job
    await prisma.cronJob.updateMany({
      where: { 
        command: { 
          in: ['clean-sessions', 'node scripts/clean-sessions.js'] 
        } 
      },
      data: {
        lastRun: new Date(),
        nextRun: addHours(new Date(), 24),
        runs: { increment: 1 },
        successfulRuns: { increment: 1 },
        status: 'active',
      },
    });
    
    console.log(`✅ Cleaned ${result.count} expired sessions`);
    
    return NextResponse.json({
      success: true,
      message: `Cleaned ${result.count} expired sessions`,
      deletedCount: result.count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json(
      { error: 'Failed to clean sessions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}