// app/api/admin/system/cron/route.ts (dengan database)
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addHours } from 'date-fns';

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
    
    const job = await prisma.cronJob.create({
      data: {
        name: body.name,
        description: body.description || '',
        schedule: body.schedule,
        command: body.command,
        status: body.status || 'active',
        nextRun: addHours(new Date(), 6),
        runs: 0,
        successfulRuns: 0,
        failedRuns: 0,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Error creating cron job:', error);
    return NextResponse.json(
      { error: 'Failed to create cron job' },
      { status: 500 }
    );
  }
}