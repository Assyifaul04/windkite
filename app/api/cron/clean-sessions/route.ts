// app/api/cron/clean-sessions/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';

const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key';

export async function GET(req: Request) {
  try {
    // Verifikasi authorization
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      const isVercelCron = req.headers.get('x-vercel-cron') === 'true';
      if (!isVercelCron) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('🧹 Starting session cleanup...');

    // Delete expired sessions
    const expiredSessions = await prisma.session.deleteMany({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    });

    // Delete old verification tokens
    const expiredTokens = await prisma.verificationToken.deleteMany({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    });

    console.log(`✅ Deleted ${expiredSessions.count} expired sessions`);
    console.log(`✅ Deleted ${expiredTokens.count} expired verification tokens`);

    // Update cron job status
    await updateCronJobStatus('2', true, expiredSessions.count);

    return NextResponse.json({
      success: true,
      message: `Cleaned ${expiredSessions.count} sessions and ${expiredTokens.count} tokens`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Clean sessions cron failed:', error);
    await updateCronJobStatus('2', false, 0);
    return NextResponse.json(
      { error: 'Clean sessions failed' },
      { status: 500 }
    );
  }
}

async function updateCronJobStatus(jobId: string, success: boolean, runs: number) {
  try {
    await prisma.cronJob.update({
      where: { id: jobId },
      data: {
        lastRun: new Date(),
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day
        runs: { increment: 1 },
        successfulRuns: success ? { increment: 1 } : undefined,
        failedRuns: !success ? { increment: 1 } : undefined,
        status: success ? 'active' : 'failed',
      },
    });
  } catch (error) {
    console.error('Failed to update cron job status:', error);
  }
}