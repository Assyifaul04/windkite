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

// PUT - Update frame
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

    const {
      name,
      description,
      imageUrl,
      thumbnailUrl,
      canvasWidth,
      canvasHeight,
      isPublic,
      markerData,
      clipPathSvg,
      status,
    } = body;

    if (!name || !imageUrl) {
      return NextResponse.json(
        { error: 'Name and imageUrl are required' },
        { status: 400 }
      );
    }

    const frame = await prisma.kiteFrame.update({
      where: { id },
      data: {
        name,
        description: description || null,
        imageUrl,
        thumbnailUrl: thumbnailUrl || imageUrl,
        canvasWidth: canvasWidth || 800,
        canvasHeight: canvasHeight || 600,
        isPublic: isPublic !== undefined ? isPublic : false,
        markerData: markerData || [],
        clipPathSvg: clipPathSvg || null,
        status: status || undefined,
      },
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