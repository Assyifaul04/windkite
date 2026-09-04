// app/api/admin/designs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Get single design
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

    const design = await prisma.kiteDesign.findUnique({
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
      { error: 'Failed to fetch design', details: String(error) },
      { status: 500 }
    );
  }
}

// PATCH - Update design (partial update)
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
    if (body.status !== undefined) updateData.status = body.status;
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.positionX !== undefined) updateData.positionX = body.positionX;
    if (body.positionY !== undefined) updateData.positionY = body.positionY;
    if (body.scale !== undefined) updateData.scale = body.scale;
    if (body.rotation !== undefined) updateData.rotation = body.rotation;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const design = await prisma.kiteDesign.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(design);
  } catch (error) {
    console.error('Error updating design:', error);
    return NextResponse.json(
      { error: 'Failed to update design', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Delete design
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

    // Get design with storage file
    const design = await prisma.kiteDesign.findUnique({
      where: { id },
      include: { storageFile: true },
    });

    if (!design) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      );
    }

    // Delete storage file if exists (optional: delete from Supabase)
    if (design.storageFile) {
      // You can implement deletion from Supabase here
    }

    await prisma.kiteDesign.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Design deleted successfully' });
  } catch (error) {
    console.error('Error deleting design:', error);
    return NextResponse.json(
      { error: 'Failed to delete design', details: String(error) },
      { status: 500 }
    );
  }
}