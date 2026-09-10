// app/api/admin/system/cron/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateNextRun } from '@/lib/cron-utils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobs = await prisma.cronJob.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching cron jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cron jobs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    if (!body.name || !body.schedule || !body.command) {
      return NextResponse.json(
        { error: 'Name, schedule, and command are required' },
        { status: 400 }
      );
    }

    // Validasi format schedule (5 field)
    if (body.schedule.trim().split(/\s+/).length !== 5) {
      return NextResponse.json(
        { error: 'Schedule must be in cron format (5 fields): "minute hour day month dayOfWeek"' },
        { status: 400 }
      );
    }

    const id = `cron_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const nextRun = calculateNextRun(body.schedule);

    const job = await prisma.cronJob.create({
      data: {
        id,
        name: body.name,
        description: body.description || '',
        schedule: body.schedule,
        command: body.command,
        status: body.status || 'active',
        nextRun,
        runs: 0,
        successfulRuns: 0,
        failedRuns: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Error creating cron job:', error);
    return NextResponse.json(
      { error: 'Failed to create cron job', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}