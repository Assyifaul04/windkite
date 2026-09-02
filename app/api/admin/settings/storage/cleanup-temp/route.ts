// app/api/admin/settings/storage/cleanup-temp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ambil setting retention days
    const settings = await prisma.storageSettings.findFirst();
    const retentionDays = settings?.tempStorageDays || 7;
    const cutoffDate = subDays(new Date(), retentionDays);

    // Cari file yang sudah melewati masa retention
    const oldDesigns = await prisma.kiteDesign.findMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        // Filter file yang masih di Neon (bukan Google Drive)
        imageUrl: {
          contains: 'neon',
        },
      },
    });

    let deletedCount = 0;

    for (const design of oldDesigns) {
      try {
        // Hapus file dari database
        await prisma.kiteDesign.delete({
          where: { id: design.id },
        });
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete file ${design.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `${deletedCount} temporary files cleaned up`,
    });
  } catch (error) {
    console.error('Error cleaning temp files:', error);
    return NextResponse.json(
      { error: 'Failed to clean temporary files' },
      { status: 500 }
    );
  }
}