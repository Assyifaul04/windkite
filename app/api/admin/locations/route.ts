// app/api/admin/locations/route.ts
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
    const includeForecast = searchParams.get('includeForecast') === 'true';

    const locations = await prisma.savedLocation.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        weatherLogs: {
          take: 1,
          orderBy: { timestamp: 'desc' },
        },
        _count: {
          select: {
            weatherLogs: true,
            weatherForecasts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Jika diminta include forecast
    let result = locations;
    if (includeForecast) {
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 3);

      const forecasts = await prisma.weatherForecast.findMany({
        where: {
          locationId: {
            in: locations.map(l => l.id),
          },
          timestamp: {
            gte: now,
            lte: endDate,
          },
        },
        orderBy: { timestamp: 'asc' },
      });

      // Group forecast by locationId
      const forecastMap = new Map();
      forecasts.forEach(f => {
        if (!forecastMap.has(f.locationId)) {
          forecastMap.set(f.locationId, []);
        }
        forecastMap.get(f.locationId).push(f);
      });

      result = locations.map(location => ({
        ...location,
        forecast: forecastMap.get(location.id) || [],
      }));
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, latitude, longitude, isPublic } = body;

    // Validasi input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nama lokasi harus diisi' },
        { status: 400 }
      );
    }

    if (latitude === undefined || isNaN(parseFloat(latitude))) {
      return NextResponse.json(
        { error: 'Latitude harus berupa angka' },
        { status: 400 }
      );
    }

    if (longitude === undefined || isNaN(parseFloat(longitude))) {
      return NextResponse.json(
        { error: 'Longitude harus berupa angka' },
        { status: 400 }
      );
    }

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    if (latNum < -90 || latNum > 90) {
      return NextResponse.json(
        { error: 'Latitude harus antara -90 dan 90' },
        { status: 400 }
      );
    }

    if (lngNum < -180 || lngNum > 180) {
      return NextResponse.json(
        { error: 'Longitude harus antara -180 dan 180' },
        { status: 400 }
      );
    }

    // Cek apakah lokasi sudah ada
    const existingLocation = await prisma.savedLocation.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive',
        },
      },
    });

    if (existingLocation) {
      return NextResponse.json(
        { error: `Lokasi dengan nama "${name.trim()}" sudah ada` },
        { status: 409 }
      );
    }

    const location = await prisma.savedLocation.create({
      data: {
        name: name.trim(),
        latitude: latNum,
        longitude: lngNum,
        isPublic: isPublic || false,
        userId: session.user.id,
      },
    });

    // === TAMBAHAN: Ambil data cuaca awal untuk lokasi baru ===
    try {
      const weatherSettings = await prisma.weatherSettings.findFirst();
      if (weatherSettings?.apiKey) {
        // Panggil API weather untuk mendapatkan data awal
        const weatherResponse = await fetch(
          `${process.env.NEXTAUTH_URL}/api/weather?locationId=${location.id}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.CRON_SECRET}`,
            },
          }
        );
        if (!weatherResponse.ok) {
          console.warn('Initial weather fetch failed for new location');
        }
      }
    } catch (error) {
      console.warn('Could not fetch initial weather for new location:', error);
    }

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json(
      { error: 'Failed to create location', details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, latitude, longitude, isPublic } = body;

    // Validasi
    const location = await prisma.savedLocation.findUnique({
      where: { id },
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const updatedLocation = await prisma.savedLocation.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedLocation);
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      );
    }

    // Cek apakah lokasi ada
    const existingLocation = await prisma.savedLocation.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            weatherLogs: true,
            weatherForecasts: true,
          },
        },
      },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Hapus semua data terkait
    await prisma.$transaction([
      prisma.weatherForecast.deleteMany({
        where: { locationId: id },
      }),
      prisma.weatherLog.deleteMany({
        where: { locationId: id },
      }),
      prisma.savedLocation.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Location and all related data deleted successfully',
      id: id,
      deletedData: {
        weatherLogs: existingLocation._count.weatherLogs,
        weatherForecasts: existingLocation._count.weatherForecasts,
      },
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { error: 'Failed to delete location', details: String(error) },
      { status: 500 }
    );
  }
}