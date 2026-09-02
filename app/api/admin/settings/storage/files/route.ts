// app/api/admin/settings/storage/files/route.ts
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

    // Ambil semua file dari KiteDesign
    const designs = await prisma.kiteDesign.findMany({
      select: {
        id: true,
        prompt: true,
        imageUrl: true,
        category: true,
        isPublic: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    // Format data file
    const files = designs.map((design) => {
      // Cek apakah file di Google Drive
      const isGoogleDrive = design.imageUrl?.includes('googleapis.com') || 
                           design.imageUrl?.includes('drive.google.com') ||
                           design.imageUrl?.includes('googleusercontent.com');
      
      // Cek apakah file di Neon S3
      const isNeon = design.imageUrl?.includes('neon.tech') || 
                    design.imageUrl?.includes('storage.c-1') ||
                    (!isGoogleDrive && design.imageUrl?.length > 0);

      let storageType = 'unknown';
      if (isGoogleDrive) storageType = 'google_drive';
      else if (isNeon) storageType = 'neon';
      else if (design.imageUrl && design.imageUrl.length > 0) storageType = 'neon';
      
      return {
        id: design.id,
        name: design.prompt?.slice(0, 50) + (design.prompt?.length > 50 ? '...' : '') || 'Untitled',
        url: design.imageUrl || '',
        size: 0,
        type: 'image/png',
        category: design.category || 'SAMPUL',
        userId: design.user?.id || 'system',
        userName: design.user?.name || 'System',
        userImage: design.user?.image || null,
        createdAt: design.createdAt.toISOString(),
        storage: storageType,
        isPublic: design.isPublic || false,
      };
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Cek apakah file ada
    const design = await prisma.kiteDesign.findUnique({
      where: { id },
    });

    if (!design) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Hapus file dari database
    await prisma.kiteDesign.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file: ' + (error as Error).message },
      { status: 500 }
    );
  }
}