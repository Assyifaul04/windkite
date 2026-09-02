// app/api/user/weather-logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { locationId, windSpeed, windDirection, temperature, humidity } = await req.json();

    // Validasi input
    if (!locationId) {
      return NextResponse.json(
        { error: 'Lokasi wajib dipilih' },
        { status: 400 }
      );
    }

    if (windSpeed === undefined || windDirection === undefined) {
      return NextResponse.json(
        { error: 'Kecepatan angin dan arah angin wajib diisi' },
        { status: 400 }
      );
    }

    // Cek apakah lokasi milik user
    const location = await prisma.savedLocation.findUnique({
      where: { id: locationId },
      select: { userId: true },
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Lokasi tidak ditemukan' },
        { status: 404 }
      );
    }

    if (location.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses ke lokasi ini' },
        { status: 403 }
      );
    }

    // Tentukan kite suitability berdasarkan kecepatan angin
    let kiteSuitability = 'TIDAK_LAYAK';
    if (windSpeed < 5) {
      kiteSuitability = 'TIDAK_LAYAK';
    } else if (windSpeed < 15) {
      kiteSuitability = 'RINGAN';
    } else if (windSpeed < 30) {
      kiteSuitability = 'SEMUA';
    } else if (windSpeed < 45) {
      kiteSuitability = 'BERAT';
    } else {
      kiteSuitability = 'TIDAK_LAYAK';
    }

    const weatherLog = await prisma.weatherLog.create({
      data: {
        locationId,
        userId: session.user.id,
        windSpeed,
        windDirection,
        temperature: temperature || null,
        humidity: humidity || null,
        windGust: windSpeed * 1.3, // Estimasi hembusan
        kiteSuitability: kiteSuitability as any,
      },
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(weatherLog, { status: 201 });
  } catch (error) {
    console.error('Error creating weather log:', error);
    return NextResponse.json(
      { error: 'Failed to create weather log' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const weatherLogs = await prisma.weatherLog.findMany({
      where: { userId: session.user.id },
      orderBy: { timestamp: 'desc' },
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: Math.min(limit, 50),
    });

    return NextResponse.json(weatherLogs);
  } catch (error) {
    console.error('Error fetching weather logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather logs' },
      { status: 500 }
    );
  }
}