// app/api/admin/settings/weather-api/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Total weather logs
    const totalLogs = await prisma.weatherLog.count();

    // Last update
    const lastLog = await prisma.weatherLog.findFirst({
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true },
    });

    // Total locations
    const totalLocations = await prisma.savedLocation.count();

    // Calculate success rate (dari data aktual)
    let successRate = 0;
    if (totalLogs > 0) {
      // Hitung dari data yang ada (simulasi)
      const successCount = await prisma.weatherLog.count({
        where: {
          kiteSuitability: {
            not: 'TIDAK_LAYAK',
          },
        },
      });
      successRate = (successCount / totalLogs) * 100;
    }

    return NextResponse.json({
      totalLogs,
      lastUpdate: lastLog?.timestamp?.toISOString() || null,
      successRate: Math.round(successRate * 10) / 10,
      totalLocations,
    });
  } catch (error) {
    console.error('Error fetching weather stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}