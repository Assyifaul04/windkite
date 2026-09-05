// app/api/cron/generate-reports/route.ts
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
      console.log('❌ Unauthorized generate-reports request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Generating reports...');
    
    const [totalLocations, totalWeatherLogs, totalUsers, totalDesigns, totalFrames] = await Promise.all([
      prisma.savedLocation.count(),
      prisma.weatherLog.count(),
      prisma.user.count(),
      prisma.kiteDesign.count(),
      prisma.kiteFrame.count(),
    ]);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayWeatherLogs = await prisma.weatherLog.count({
      where: {
        timestamp: {
          gte: today,
        },
      },
    });
    
    const report = {
      generatedAt: new Date().toISOString(),
      stats: {
        totalLocations,
        totalWeatherLogs,
        totalUsers,
        totalDesigns,
        totalFrames,
        todayWeatherLogs,
      },
    };
    
    // Update cron job
    await prisma.cronJob.updateMany({
      where: { 
        command: { 
          in: ['generate-reports', 'node scripts/generate-reports.js'] 
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
    
    console.log('✅ Reports generated successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Reports generated successfully',
      report,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json(
      { error: 'Failed to generate reports', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}