// app/api/admin/designs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const design = await prisma.kiteDesign.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        frame: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            markerData: true,
            clipPathSvg: true,
          },
        },
        storageFile: true,
      },
    });

    if (!design) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(design);
  } catch (error) {
    console.error('Error fetching design:', error);
    return NextResponse.json(
      { error: 'Failed to fetch design' },
      { status: 500 }
    );
  }
}

// app/api/admin/designs/[id]/route.ts (lanjutan)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, status, isPublic, positionX, positionY, scale, rotation } = body;

    const design = await prisma.kiteDesign.update({
      where: { id: params.id },
      data: {
        title: title || undefined,
        description: description || undefined,
        status: status || undefined,
        isPublic: isPublic !== undefined ? isPublic : undefined,
        positionX: positionX !== undefined ? positionX : undefined,
        positionY: positionY !== undefined ? positionY : undefined,
        scale: scale !== undefined ? scale : undefined,
        rotation: rotation !== undefined ? rotation : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        frame: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(design);
  } catch (error) {
    console.error('Error updating design:', error);
    return NextResponse.json(
      { error: 'Failed to update design' },
      { status: 500 }
    );
  }
}

// app/api/admin/designs/[id]/route.ts (lanjutan)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get design with storage file
    const design = await prisma.kiteDesign.findUnique({
      where: { id: params.id },
      include: { storageFile: true },
    });

    if (!design) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      );
    }

    // Delete storage file if exists
    if (design.storageFile) {
      // Delete from Google Drive or storage provider
      // You can implement this based on your storage setup
    }

    // Delete design (cascade will handle storage file if not deleted)
    await prisma.kiteDesign.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Design deleted successfully' });
  } catch (error) {
    console.error('Error deleting design:', error);
    return NextResponse.json(
      { error: 'Failed to delete design' },
      { status: 500 }
    );
  }
}