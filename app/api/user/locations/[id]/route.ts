// app/api/user/locations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const location = await prisma.savedLocation.findUnique({
      where: { id: params.id },
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
      where: { id: params.id },
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