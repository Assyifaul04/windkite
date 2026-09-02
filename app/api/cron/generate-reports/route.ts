// app/api/cron/generate-reports/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { subDays, format } from 'date-fns';

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

    console.log('📊 Generating daily report...');

    const startDate = subDays(new Date(), 1);
    const endDate = new Date();

    // Get stats for the day
    const [newUsers, newLocations, newWeather, newDesigns, totalUsers, totalLocations] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.savedLocation.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.weatherLog.count({
        where: { timestamp: { gte: startDate, lte: endDate } },
      }),
      prisma.kiteDesign.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.user.count(),
      prisma.savedLocation.count(),
    ]);

    // Calculate growth
    const prevTotalUsers = await prisma.user.count({
      where: { createdAt: { lt: startDate } },
    });
    const prevTotalLocations = await prisma.savedLocation.count({
      where: { createdAt: { lt: startDate } },
    });

    const report = {
      date: format(new Date(), 'yyyy-MM-dd'),
      summary: {
        newUsers,
        newLocations,
        newWeather,
        newDesigns,
        totalUsers,
        totalLocations,
        userGrowth: prevTotalUsers > 0 ? ((totalUsers - prevTotalUsers) / prevTotalUsers * 100).toFixed(2) : '0',
        locationGrowth: prevTotalLocations > 0 ? ((totalLocations - prevTotalLocations) / prevTotalLocations * 100).toFixed(2) : '0',
      },
    };

    // Save report to database or send email
    console.log('📊 Daily Report:', JSON.stringify(report, null, 2));

    // Update cron job status
    await updateCronJobStatus('3', true, 1);

    return NextResponse.json({
      success: true,
      report,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Generate reports cron failed:', error);
    await updateCronJobStatus('3', false, 0);
    return NextResponse.json(
      { error: 'Generate reports failed' },
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
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000),
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