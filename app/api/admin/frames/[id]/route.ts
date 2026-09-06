// app/api/admin/frames/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Get single frame
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const frame = await prisma.kiteFrame.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        designs: {
          select: {
            id: true,
            title: true,
            coverImageUrl: true,
            status: true,
            isPublic: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            designs: true,
          },
        },
      },
    });

    if (!frame) {
      return NextResponse.json(
        { error: 'Frame not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(frame);
  } catch (error) {
    console.error('Error fetching frame:', error);
    return NextResponse.json(
      { error: 'Failed to fetch frame', details: String(error) },
      { status: 500 }
    );
  }
}

// PATCH - Partial update (untuk status change dan field lainnya)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const updateData: any = {};

    // Handle status update - otomatis set isPublic
    if (body.status !== undefined) {
      updateData.status = body.status;
      
      // Jika status menjadi PUBLISHED, otomatis isPublic = true
      if (body.status === 'PUBLISHED') {
        updateData.isPublic = true;
      }
      // Jika status menjadi DRAFT atau ARCHIVED, isPublic = false
      else if (body.status === 'DRAFT' || body.status === 'ARCHIVED') {
        updateData.isPublic = false;
      }
    }

    // Handle field updates lainnya
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.thumbnailUrl !== undefined) updateData.thumbnailUrl = body.thumbnailUrl;
    if (body.canvasWidth !== undefined) updateData.canvasWidth = body.canvasWidth;
    if (body.canvasHeight !== undefined) updateData.canvasHeight = body.canvasHeight;
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;
    if (body.markerData !== undefined) updateData.markerData = body.markerData;
    if (body.clipPathSvg !== undefined) updateData.clipPathSvg = body.clipPathSvg;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const frame = await prisma.kiteFrame.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            designs: true,
          },
        },
      },
    });

    return NextResponse.json(frame);
  } catch (error) {
    console.error('Error updating frame:', error);
    return NextResponse.json(
      { error: 'Failed to update frame', details: String(error) },
      { status: 500 }
    );
  }
}

// PUT - Full update (kompatibilitas)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.thumbnailUrl !== undefined) updateData.thumbnailUrl = body.thumbnailUrl;
    if (body.canvasWidth !== undefined) updateData.canvasWidth = body.canvasWidth;
    if (body.canvasHeight !== undefined) updateData.canvasHeight = body.canvasHeight;
    
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === 'PUBLISHED') {
        updateData.isPublic = true;
      } else if (body.status === 'DRAFT' || body.status === 'ARCHIVED') {
        updateData.isPublic = false;
      }
    }
    
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;
    if (body.markerData !== undefined) updateData.markerData = body.markerData;
    if (body.clipPathSvg !== undefined) updateData.clipPathSvg = body.clipPathSvg;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const frame = await prisma.kiteFrame.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            designs: true,
          },
        },
      },
    });

    return NextResponse.json(frame);
  } catch (error) {
    console.error('Error updating frame:', error);
    return NextResponse.json(
      { error: 'Failed to update frame', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Delete frame
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const frame = await prisma.kiteFrame.findUnique({
      where: { id },
      include: {
        _count: {
          select: { designs: true },
        },
      },
    });

    if (!frame) {
      return NextResponse.json(
        { error: 'Frame not found' },
        { status: 404 }
      );
    }

    if (frame._count.designs > 0) {
      return NextResponse.json(
        { error: 'Cannot delete frame with existing designs' },
        { status: 400 }
      );
    }

    await prisma.kiteFrame.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Frame deleted successfully' });
  } catch (error) {
    console.error('Error deleting frame:', error);
    return NextResponse.json(
      { error: 'Failed to delete frame', details: String(error) },
      { status: 500 }
    );
  }
}