// app/api/admin/system/cron/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addHours, setMinutes, setSeconds } from 'date-fns';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    
    // Cek apakah job ada
    const existingJob = await prisma.cronJob.findUnique({
      where: { id },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: 'Cron job not found' },
        { status: 404 }
      );
    }
    
    // Update data
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.schedule !== undefined) {
      updateData.schedule = body.schedule;
      updateData.nextRun = calculateNextRun(body.schedule);
    }
    if (body.command !== undefined) updateData.command = body.command;
    if (body.status !== undefined) updateData.status = body.status;
    
    const job = await prisma.cronJob.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error updating cron job:', error);
    return NextResponse.json(
      { error: 'Failed to update cron job', details: error instanceof Error ? error.message : 'Unknown error' },
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

    const existingJob = await prisma.cronJob.findUnique({
      where: { id },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: 'Cron job not found' },
        { status: 404 }
      );
    }

    await prisma.cronJob.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Cron job deleted successfully' });
  } catch (error) {
    console.error('Error deleting cron job:', error);
    return NextResponse.json(
      { error: 'Failed to delete cron job', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function calculateNextRun(schedule: string): Date {
  const now = new Date();
  const parts = schedule.trim().split(' ');
  
  if (parts.length !== 5) {
    return addHours(now, 6);
  }

  const [minute, hour, day, month, dayOfWeek] = parts;
  let nextRun = new Date(now);
  nextRun = setSeconds(nextRun, 0);
  nextRun = setMinutes(nextRun, 0);
  
  if (minute === '0' && hour === '*/6' && day === '*' && month === '*' && dayOfWeek === '*') {
    nextRun = addHours(now, 6);
    nextRun = setMinutes(nextRun, 0);
    nextRun = setSeconds(nextRun, 0);
    return nextRun;
  }
  
  if (minute === '0' && hour === '0' && day === '*' && month === '*' && dayOfWeek === '*') {
    nextRun = new Date(now);
    nextRun.setDate(now.getDate() + 1);
    nextRun.setHours(0, 0, 0, 0);
    return nextRun;
  }
  
  nextRun = addHours(now, 6);
  nextRun = setMinutes(nextRun, 0);
  nextRun = setSeconds(nextRun, 0);
  return nextRun;
}