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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(locations);
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

    // Cek apakah lokasi sudah ada (case insensitive)
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

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json(
      { error: 'Failed to create location', details: String(error) },
      { status: 500 }
    );
  }
}