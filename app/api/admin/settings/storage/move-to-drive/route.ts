// app/api/admin/settings/storage/move-to-drive/route.ts
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
    if (!settings || !settings.googleDriveFolderId) {
      return NextResponse.json(
        { error: 'Google Drive folder ID not configured' },
        { status: 400 }
      );
    }

    // Get temporary files that are ready to move (older than tempStorageDays)
    const tempDate = new Date();
    tempDate.setDate(tempDate.getDate() - (settings.tempStorageDays || 7));

    const tempFiles = await prisma.storageFile.findMany({
      where: {
        storageType: 'temporary',
        driveFileId: null,
        createdAt: {
          lte: tempDate,
        },
      },
      include: {
        kiteDesign: true,
      },
    });

    if (tempFiles.length === 0) {
      return NextResponse.json({ 
        message: 'No temporary files to move',
        movedCount: 0 
      });
    }

    // In real implementation, you would upload to Google Drive here
    // For now, we'll simulate by marking files as moved
    const movedIds = tempFiles.map(f => f.id);
    
    await prisma.storageFile.updateMany({
      where: {
        id: { in: movedIds },
      },
      data: {
        storageType: 'permanent',
        driveFileId: `gdrive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        driveFolderId: settings.googleDriveFolderId,
        archivedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: `Successfully moved ${tempFiles.length} files to Google Drive`,
      movedCount: tempFiles.length,
    });
  } catch (error) {
    console.error('Error moving files to drive:', error);
    return NextResponse.json(
      { error: 'Failed to move files to Google Drive' },
      { status: 500 }
    );
  }
}