// app/api/user/designs/[id]/route.ts
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

    const design = await prisma.kiteDesign.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!design) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      );
    }

    if (design.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this design' },
        { status: 403 }
      );
    }

    await prisma.kiteDesign.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Design deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting design:', error);
    return NextResponse.json(
      { error: 'Failed to delete design' },
      { status: 500 }
    );
  }
}