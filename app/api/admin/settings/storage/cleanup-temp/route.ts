// app/api/admin/settings/storage/cleanup-temp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get settings
    const settings = await prisma.storageSettings.findFirst();
    const retentionDays = settings?.tempStorageDays || 7;
    
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() - retentionDays);

    // Delete expired temporary files
    const deleted = await prisma.storageFile.deleteMany({
      where: {
        storageType: 'temporary',
        expiresAt: {
          lte: expireDate,
        },
      },
    });

    return NextResponse.json({
      message: `Cleaned up ${deleted.count} temporary files`,
      deletedCount: deleted.count,
    });
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
    return NextResponse.json(
      { error: 'Failed to clean up temporary files' },
      { status: 500 }
    );
  }
}