// app/api/cron/generate-reports/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('[Cron] Generating reports...');
    
    const [totalLocations, totalWeatherLogs, totalUsers, totalDesigns] = await Promise.all([
      prisma.savedLocation.count(),
      prisma.weatherLog.count(),
      prisma.user.count(),
      prisma.kiteDesign.count(),
    ]);
    
    const report = {
      generatedAt: new Date().toISOString(),
      stats: {
        totalLocations,
        totalWeatherLogs,
        totalUsers,
        totalDesigns,
      },
    };
    
    // Update cron job stats
    await prisma.cronJob.updateMany({
      where: { 
        OR: [
          { command: 'node scripts/generate-reports.js' },
          { command: 'npm run generate-reports' },
        ]
      },
      data: {
        lastRun: new Date(),
        runs: { increment: 1 },
        successfulRuns: { increment: 1 },
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Reports generated successfully',
      report,
    });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json(
      { error: 'Failed to generate reports' },
      { status: 500 }
    );
  }
}