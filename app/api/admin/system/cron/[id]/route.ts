// app/api/admin/system/cron/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id } = await params;
    
    const job = await prisma.cronJob.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        schedule: body.schedule,
        command: body.command,
        status: body.status,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error updating cron job:', error);
    return NextResponse.json(
      { error: 'Failed to update cron job' },
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
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.cronJob.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Cron job deleted successfully' });
  } catch (error) {
    console.error('Error deleting cron job:', error);
    return NextResponse.json(
      { error: 'Failed to delete cron job' },
      { status: 500 }
    );
  }
}