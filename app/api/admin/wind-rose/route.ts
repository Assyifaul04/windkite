// app/api/admin/wind-rose/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { subDays } from 'date-fns';

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
      select: {
        windDirection: true,
        windSpeed: true,
      },
    });

    // Group by direction (rounded to nearest 10 degrees)
    const directionGroups = new Map();
    logs.forEach(log => {
      const dir = Math.round(log.windDirection / 10) * 10;
      const key = dir % 360;
      if (!directionGroups.has(key)) {
        directionGroups.set(key, {
          direction: key,
          speeds: [],
          count: 0,
        });
      }
      const group = directionGroups.get(key);
      group.speeds.push(log.windSpeed);
      group.count++;
    });

    const windRoseData = Array.from(directionGroups.values()).map(group => ({
      direction: group.direction,
      speed: Math.round(group.speeds.reduce((a: number, b: number) => a + b, 0) / group.speeds.length),
      count: group.count,
    }));

    return NextResponse.json(windRoseData);
  } catch (error) {
    console.error('Error fetching wind rose:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wind rose data' },
      { status: 500 }
    );
  }
}