// app/api/user/locations/route.ts
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

    const { name, latitude, longitude, isPublic } = await req.json();

    // Validasi input
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nama lokasi wajib diisi' },
        { status: 400 }
      );
    }

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Latitude dan Longitude wajib diisi' },
        { status: 400 }
      );
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Latitude dan Longitude harus berupa angka' },
        { status: 400 }
      );
    }

    const location = await prisma.savedLocation.create({
      data: {
        name: name.trim(),
        latitude,
        longitude,
        isPublic: isPublic || false,
        userId: session.user.id,
      },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create location',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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
    const isPublic = searchParams.get('public');

    const where: any = { userId: session.user.id };
    
    if (isPublic === 'true') {
      where.isPublic = true;
    } else if (isPublic === 'false') {
      where.isPublic = false;
    }

    const locations = await prisma.savedLocation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        weatherLogs: {
          take: 1,
          orderBy: { timestamp: 'desc' },
        },
        _count: {
          select: { weatherLogs: true },
        },
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