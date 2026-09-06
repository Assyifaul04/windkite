// app/api/weather/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get('locationId');

    let location = null;

    if (locationId && locationId !== 'default') {
      location = await prisma.savedLocation.findUnique({
        where: { id: locationId },
      });
    }

    if (!location) {
      location = await prisma.savedLocation.findFirst({
        where: { isPublic: true },
        orderBy: { createdAt: 'asc' },
      });
    }

    if (!location) {
      return NextResponse.json(
        { error: 'Belum ada lokasi publik di database. Tambahkan SavedLocation dengan isPublic: true.' },
        { status: 404 }
      );
    }

    const logs = await prisma.weatherLog.findMany({
      where: { locationId: location.id },
      orderBy: { timestamp: 'desc' },
      take: 24,
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyLogs = await prisma.weatherLog.findMany({
      where: {
        locationId: location.id,
        timestamp: { gte: sevenDaysAgo },
      },
      orderBy: { timestamp: 'asc' },
    });

    const todayKey = new Date().toDateString();

    type DailyBucket = {
      dateKey: string;
      label: string;
      max: number;
      min: number;
      humiditySum: number;
      count: number;
    };
    const dailyMap = new Map<string, DailyBucket>();

    dailyLogs.forEach((log) => {
      const date = new Date(log.timestamp);
      const dateKey = date.toDateString();
      const temp = log.temperature ?? 0;
      const bucket = dailyMap.get(dateKey);
      if (!bucket) {
        dailyMap.set(dateKey, {
          dateKey,
          label: date.toLocaleDateString('id-ID', { weekday: 'short' }),
          max: temp,
          min: temp,
          humiditySum: log.humidity ?? 0,
          count: 1,
        });
      } else {
        bucket.max = Math.max(bucket.max, temp);
        bucket.min = Math.min(bucket.min, temp);
        bucket.humiditySum += log.humidity ?? 0;
        bucket.count += 1;
      }
    });

    const daily = Array.from(dailyMap.values()).map((d) => ({
      day: d.label,
      tempMax: Math.round(d.max),
      tempMin: Math.round(d.min),
      cloudy: d.count > 0 && d.humiditySum / d.count > 60,
      isToday: d.dateKey === todayKey,
    }));

    const latestLog = logs[0] ?? null;

    return NextResponse.json({
      location: {
        id: location.id,
        name: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
      },
      current: {
        temperature: latestLog?.temperature ?? null,
        humidity: latestLog?.humidity ?? null,
        windSpeed: latestLog?.windSpeed ?? 0,
        windGust: latestLog?.windGust ?? 0,
        windDirection: latestLog?.windDirection ?? 0,
        kiteSuitability: latestLog?.kiteSuitability ?? 'TIDAK_LAYAK',
        updatedAt: latestLog?.timestamp ?? null,
      },
      hourly: logs
        .map((log) => ({
          time: new Date(log.timestamp).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: log.timestamp,
          temp: log.temperature ?? 0,
          humidity: log.humidity ?? 0,
          windSpeed: log.windSpeed,
          windGust: log.windGust,
          windDirection: log.windDirection,
          kiteSuitability: log.kiteSuitability,
        }))
        .reverse(),
      daily,
    });
  } catch (error) {
    console.error('Error fetching weather:', error);
    return NextResponse.json({ error: 'Gagal mengambil data cuaca' }, { status: 500 });
  }
}