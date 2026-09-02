// app/api/admin/weather-analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { subDays, format } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30d';
    const locationId = searchParams.get('locationId');
    const days = parseInt(period);
    const startDate = subDays(new Date(), days);

    const where: any = {
      timestamp: { gte: startDate },
    };
    if (locationId && locationId !== 'all') {
      where.locationId = locationId;
    }

    const logs = await prisma.weatherLog.findMany({
      where,
      include: {
        location: true,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    // Wind speed data
    const windSpeedData = logs.map(log => ({
      date: format(log.timestamp, 'dd/MM'),
      windSpeed: log.windSpeed,
      windGust: log.windGust,
    }));

    // Temperature data
    const temperatureData = logs
      .filter(log => log.temperature !== null && log.humidity !== null)
      .map(log => ({
        date: format(log.timestamp, 'dd/MM'),
        temperature: log.temperature || 0,
        humidity: log.humidity || 0,
      }));

    // Kite suitability distribution
    const suitabilityCount = await prisma.weatherLog.groupBy({
      by: ['kiteSuitability'],
      where,
      _count: true,
    });

    const kiteSuitabilityData = suitabilityCount.map(item => ({
      name: item.kiteSuitability,
      value: item._count,
    }));

    // Statistics
    const stats = await prisma.weatherLog.aggregate({
      where,
      _avg: {
        windSpeed: true,
        temperature: true,
        humidity: true,
      },
      _max: {
        windSpeed: true,
      },
      _min: {
        windSpeed: true,
      },
      _count: true,
    });

    return NextResponse.json({
      windSpeedData,
      temperatureData,
      kiteSuitabilityData,
      statistics: {
        avgWindSpeed: Math.round(stats._avg.windSpeed || 0),
        maxWindSpeed: Math.round(stats._max.windSpeed || 0),
        minWindSpeed: Math.round(stats._min.windSpeed || 0),
        avgTemperature: Math.round(stats._avg.temperature || 0),
        avgHumidity: Math.round(stats._avg.humidity || 0),
        totalLogs: stats._count,
      },
    });
  } catch (error) {
    console.error('Error fetching weather analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather analytics' },
      { status: 500 }
    );
  }
}