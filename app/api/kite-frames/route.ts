// app/api/kite-frames/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '6', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;

    // Query untuk mengambil frame yang PUBLISHED dan isPublic = true
    const frames = await prisma.kiteFrame.findMany({
      where: {
        status: 'PUBLISHED',
        isPublic: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            designs: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: skip,
    });

    // Hitung total untuk pagination
    const total = await prisma.kiteFrame.count({
      where: {
        status: 'PUBLISHED',
        isPublic: true,
      },
    });

    return NextResponse.json({
      frames,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching kite frames:', error);
    return NextResponse.json(
      { error: 'Gagal memuat kerangka layangan' },
      { status: 500 }
    );
  }
}