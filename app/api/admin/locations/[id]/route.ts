// app/api/user/locations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const location = await prisma.savedLocation.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this location
    if (location.userId !== session.user.id && !location.isPublic) {
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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if location exists and belongs to user
    const existingLocation = await prisma.savedLocation.findUnique({
      where: { id },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    if (existingLocation.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this location' },
        { status: 403 }
      );
    }

    const { name, latitude, longitude, isPublic } = await req.json();

    // Validasi
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nama lokasi harus diisi' },
        { status: 400 }
      );
    }

    const location = await prisma.savedLocation.update({
      where: { id },
      data: {
        name: name.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        isPublic: isPublic ?? false,
      },
    });

    return NextResponse.json(location);
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Cek apakah lokasi ada
    const existingLocation = await prisma.savedLocation.findUnique({
      where: { id },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Check if user owns this location
    if (existingLocation.userId !== session.user.id) {
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
      message: 'Location deleted successfully',
      id: id
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { error: 'Failed to delete location', details: String(error) },
      { status: 500 }
    );
  }
}