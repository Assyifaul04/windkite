// app/api/user/locations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Next.js 15+ requires params to be a Promise
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Await the params to get the id
    const { id } = await params;

    const location = await prisma.savedLocation.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    if (location.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this location' },
        { status: 403 }
      );
    }

    await prisma.savedLocation.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Location deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    );
  }
}

// Also add PUT/PATCH and GET handlers if needed with the same pattern
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const location = await prisma.savedLocation.findUnique({
      where: { id },
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    if (location.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json(location);
  } catch (error) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      { error: 'Failed to fetch location' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const location = await prisma.savedLocation.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    if (location.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Update only allowed fields
    const updatedLocation = await prisma.savedLocation.update({
      where: { id },
      data: {
        name: body.name,
        isPublic: body.isPublic,
        // Add other updatable fields as needed
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedLocation,
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}