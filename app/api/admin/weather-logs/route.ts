// app/api/admin/weather-logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get('locationId');

    const where: any = {};
    if (locationId && locationId !== 'all') {
      where.locationId = locationId;
    }

    const logs = await prisma.weatherLog.findMany({
      where,
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 100,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching weather logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather logs' },
      { status: 500 }
    );
  }
}