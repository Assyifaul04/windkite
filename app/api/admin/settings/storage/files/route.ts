// app/api/admin/settings/storage/files/route.ts
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

    // Get all storage files with user info
    const files = await prisma.storageFile.findMany({
      include: {
        kiteDesign: {
          select: {
            id: true,
            title: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Format files for display
    const formattedFiles = files.map(file => ({
      id: file.id,
      name: file.fileName,
      url: file.fileUrl,
      size: file.fileSize,
      type: file.mimeType,
      category: file.source || 'General',
      userId: file.kiteDesign?.user?.id || 'system',
      userName: file.kiteDesign?.user?.name || 'System',
      userImage: file.kiteDesign?.user?.image || null,
      createdAt: file.createdAt.toISOString(),
      storage: file.driveFileId ? 'google_drive' : 'neon',
      isPublic: file.storageType === 'permanent',
      driveFileId: file.driveFileId,
      storageType: file.storageType,
    }));

    return NextResponse.json(formattedFiles);
  } catch (error) {
    console.error('Error fetching storage files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storage files' },
      { status: 500 }
    );
  }
}