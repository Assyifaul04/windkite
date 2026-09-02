// app/api/admin/storage/stats/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [totalFiles, tempFiles, permanentFiles, driveFiles] = await Promise.all([
      prisma.storageFile.count(),
      prisma.storageFile.count({ where: { storageType: 'temporary' } }),
      prisma.storageFile.count({ where: { storageType: 'permanent' } }),
      prisma.storageFile.count({ where: { driveFileId: { not: null } } }),
    ]);

    const totalSize = await prisma.storageFile.aggregate({
      _sum: {
        fileSize: true,
      },
    });

    return NextResponse.json({
      totalFiles,
      totalSize: totalSize._sum.fileSize || 0,
      tempFiles,
      permanentFiles,
      driveFiles,
    });
  } catch (error) {
    console.error('Error fetching storage stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storage stats' },
      { status: 500 }
    );
  }
}