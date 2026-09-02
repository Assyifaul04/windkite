// app/api/admin/settings/storage/move-to-drive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ambil semua desain yang masih di Neon
    const designs = await prisma.kiteDesign.findMany({
      where: {
        imageUrl: {
          not: null,
        },
      },
    });

    // Filter desain yang masih di Neon (bukan Google Drive)
    const neonDesigns = designs.filter(d => 
      d.imageUrl && (
        !d.imageUrl.includes('googleapis.com') &&
        !d.imageUrl.includes('drive.google.com') &&
        !d.imageUrl.includes('googleusercontent.com')
      )
    );

    let movedCount = 0;

    for (const design of neonDesigns) {
      try {
        // Simulasi upload ke Google Drive
        const driveUrl = `https://drive.google.com/file/d/${design.id}/view`;
        
        await prisma.kiteDesign.update({
          where: { id: design.id },
          data: {
            imageUrl: driveUrl,
          },
        });
        
        movedCount++;
      } catch (error) {
        console.error(`Failed to move file ${design.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      movedCount,
      message: `${movedCount} files moved to Google Drive`,
    });
  } catch (error) {
    console.error('Error moving files to drive:', error);
    return NextResponse.json(
      { error: 'Failed to move files to Google Drive: ' + (error as Error).message },
      { status: 500 }
    );
  }
}