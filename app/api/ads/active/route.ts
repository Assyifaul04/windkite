// app/api/ads/active/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const position = req.nextUrl.searchParams.get('position');

    if (!position) {
      return NextResponse.json(
        { error: 'Position parameter required' },
        { status: 400 }
      );
    }

    // Untuk posisi "global", return semua iklan global aktif (multi-provider)
    if (position === 'global') {
      const ads = await prisma.adSettings.findMany({
        where: { position: 'global', isActive: true },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(ads);
    }

    // Untuk posisi lain, ambil 1 iklan aktif terbaru
    const ad = await prisma.adSettings.findFirst({
      where: { position, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    // Return null jika tidak ada (bukan 404) supaya frontend tidak error
    return NextResponse.json(ad || null);
  } catch (error) {
    console.error('Error fetching active ad:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active ad' },
      { status: 500 }
    );
  }
}