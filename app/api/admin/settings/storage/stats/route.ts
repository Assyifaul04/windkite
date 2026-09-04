// app/api/admin/settings/storage/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [totalFiles, totalSize, neonFiles, neonSize, driveFiles, driveSize, tempFiles] = await Promise.all([
      prisma.storageFile.count(),
      prisma.storageFile.aggregate({ _sum: { fileSize: true } }),
      prisma.storageFile.count({ where: { driveFileId: null } }),
      prisma.storageFile.aggregate({ 
        where: { driveFileId: null },
        _sum: { fileSize: true } 
      }),
      prisma.storageFile.count({ where: { driveFileId: { not: null } } }),
      prisma.storageFile.aggregate({ 
        where: { driveFileId: { not: null } },
        _sum: { fileSize: true } 
      }),
      prisma.storageFile.count({ where: { storageType: 'temporary' } }),
    ]);

    const formatSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Count images
    const images = await prisma.storageFile.count({
      where: {
        mimeType: {
          in: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'],
        },
      },
    });

    return NextResponse.json({
      totalFiles,
      totalSize: formatSize(totalSize._sum.fileSize || 0),
      totalSizeBytes: totalSize._sum.fileSize || 0,
      neonFiles,
      neonSize: formatSize(neonSize._sum.fileSize || 0),
      googleDriveFiles: driveFiles,
      googleDriveSize: formatSize(driveSize._sum.fileSize || 0),
      images,
      tempFiles,
    });
  } catch (error) {
    console.error('Error fetching storage stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storage stats' },
      { status: 500 }
    );
  }
}