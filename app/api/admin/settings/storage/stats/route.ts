// app/api/admin/settings/storage/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Total semua desain
    const totalDesigns = await prisma.kiteDesign.count();

    // Ambil semua imageUrl untuk analisis
    const allDesigns = await prisma.kiteDesign.findMany({
      select: { imageUrl: true, createdAt: true },
    });

    // Hitung file di Neon S3
    const neonFiles = allDesigns.filter(d => 
      d.imageUrl && (
        d.imageUrl.includes('neon.tech') ||
        d.imageUrl.includes('storage.c-1') ||
        d.imageUrl.includes('neonstorage') ||
        (!d.imageUrl.includes('googleapis.com') && 
         !d.imageUrl.includes('drive.google.com') &&
         !d.imageUrl.includes('googleusercontent.com'))
      )
    ).length;

    // Hitung file di Google Drive
    const googleDriveFiles = allDesigns.filter(d => 
      d.imageUrl && (
        d.imageUrl.includes('googleapis.com') ||
        d.imageUrl.includes('drive.google.com') ||
        d.imageUrl.includes('googleusercontent.com')
      )
    ).length;

    // Hitung file temporary (7 hari terakhir)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const tempFiles = allDesigns.filter(d => 
      new Date(d.createdAt) >= sevenDaysAgo
    ).length;

    // Hitung total size (approximate)
    const totalSizeBytes = allDesigns.length * 500 * 1024; // Asumsi 500KB per file
    const totalSize = formatBytes(totalSizeBytes);

    return NextResponse.json({
      totalFiles: totalDesigns,
      totalSize: totalSize,
      totalSizeBytes: totalSizeBytes,
      neonFiles: neonFiles || 0,
      neonSize: formatBytes(neonFiles * 500 * 1024),
      googleDriveFiles: googleDriveFiles || 0,
      googleDriveSize: formatBytes(googleDriveFiles * 500 * 1024),
      images: totalDesigns,
      tempFiles: tempFiles || 0,
    });
  } catch (error) {
    console.error('Error fetching storage stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storage stats: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}