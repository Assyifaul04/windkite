// app/api/admin/weather-analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';

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
    const startDate = startOfDay(subDays(new Date(), days));

    // Build where clause
    const where: any = {
      timestamp: { gte: startDate },
    };
    if (locationId && locationId !== 'all') {
      where.locationId = locationId;
    }

    // Get logs with location data
    const logs = await prisma.weatherLog.findMany({
      where,
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    // If no logs, return empty data
    if (logs.length === 0) {
      return NextResponse.json({
        windSpeedData: [],
        temperatureData: [],
        kiteSuitabilityData: [],
        statistics: {
          avgWindSpeed: 0,
          maxWindSpeed: 0,
          minWindSpeed: 0,
          avgTemperature: 0,
          avgHumidity: 0,
          totalLogs: 0,
        },
      });
    }

    // Group logs by date for chart data
    const dateMap = new Map();
    const today = new Date();
    const todayStr = format(today, 'dd/MM');

    logs.forEach(log => {
      const dateKey = format(log.timestamp, 'dd/MM');
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          date: dateKey,
          windSpeed: 0,
          windGust: 0,
          temperature: 0,
          humidity: 0,
          count: 0,
          tempCount: 0,
          humidityCount: 0,
        });
      }
      const entry = dateMap.get(dateKey);
      entry.windSpeed += log.windSpeed;
      entry.windGust += log.windGust;
      if (log.temperature !== null) {
        entry.temperature += log.temperature;
        entry.tempCount++;
      }
      if (log.humidity !== null) {
        entry.humidity += log.humidity;
        entry.humidityCount++;
      }
      entry.count++;
    });

    // Calculate averages for wind speed data
    const windSpeedData = Array.from(dateMap.values())
      .map(entry => ({
        date: entry.date,
        windSpeed: Math.round((entry.windSpeed / entry.count) * 10) / 10,
        windGust: Math.round((entry.windGust / entry.count) * 10) / 10,
      }))
      .filter(item => item.windSpeed > 0 || item.windGust > 0);

    // Calculate averages for temperature data
    const temperatureData = Array.from(dateMap.values())
      .map(entry => ({
        date: entry.date,
        temperature: entry.tempCount > 0 ? Math.round((entry.temperature / entry.tempCount) * 10) / 10 : 0,
        humidity: entry.humidityCount > 0 ? Math.round((entry.humidity / entry.humidityCount) * 10) / 10 : 0,
      }))
      .filter(item => item.temperature > 0 || item.humidity > 0);

    // Kite suitability distribution
    const suitabilityCount = await prisma.weatherLog.groupBy({
      by: ['kiteSuitability'],
      where,
      _count: true,
    });

    const suitabilityLabels: Record<string, string> = {
      TIDAK_LAYAK: 'Tidak Layak',
      RINGAN: 'Layak Ringan',
      BERAT: 'Layak Berat',
      SEMUA: 'Layak Semua',
    };

    const kiteSuitabilityData = suitabilityCount.map(item => ({
      name: suitabilityLabels[item.kiteSuitability] || item.kiteSuitability,
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

    // Calculate today's data
    const todayLogs = logs.filter(log => 
      format(log.timestamp, 'dd/MM') === todayStr
    );
    const todayAvgWind = todayLogs.length > 0 
      ? todayLogs.reduce((acc, log) => acc + log.windSpeed, 0) / todayLogs.length 
      : 0;

    return NextResponse.json({
      windSpeedData,
      temperatureData,
      kiteSuitabilityData,
      statistics: {
        avgWindSpeed: Math.round((stats._avg.windSpeed || 0) * 10) / 10,
        maxWindSpeed: Math.round((stats._max.windSpeed || 0) * 10) / 10,
        minWindSpeed: Math.round((stats._min.windSpeed || 0) * 10) / 10,
        avgTemperature: Math.round((stats._avg.temperature || 0) * 10) / 10,
        avgHumidity: Math.round((stats._avg.humidity || 0) * 10) / 10,
        totalLogs: stats._count || 0,
        todayAvgWind: Math.round(todayAvgWind * 10) / 10,
      },
    });
  } catch (error) {
    console.error('Error fetching weather analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather analytics', details: String(error) },
      { status: 500 }
    );
  }
}