// app/api/locations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Ambil daftar lokasi publik untuk widget cuaca
export async function GET() {
  try {
    const locations = await prisma.savedLocation.findMany({
      where: {
        isPublic: true,
      },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({
      locations,
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}