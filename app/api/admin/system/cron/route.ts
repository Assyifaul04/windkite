// app/api/admin/system/cron/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addHours, setMinutes, setSeconds } from 'date-fns';

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
    
    // Validasi
    if (!body.name || !body.schedule || !body.command) {
      return NextResponse.json(
        { error: 'Name, schedule, and command are required' },
        { status: 400 }
      );
    }
    
    // Generate ID unik
    const id = `cron_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Hitung next run
    const nextRun = calculateNextRun(body.schedule);
    
    const job = await prisma.cronJob.create({
      data: {
        id: id,
        name: body.name,
        description: body.description || '',
        schedule: body.schedule,
        command: body.command,
        status: body.status || 'active',
        nextRun: nextRun,
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
  
  // Setiap 6 jam: "0 */6 * * *"
  if (minute === '0' && hour === '*/6' && day === '*' && month === '*' && dayOfWeek === '*') {
    nextRun = addHours(now, 6);
    nextRun = setMinutes(nextRun, 0);
    nextRun = setSeconds(nextRun, 0);
    return nextRun;
  }
  
  // Setiap hari jam 00:00: "0 0 * * *"
  if (minute === '0' && hour === '0' && day === '*' && month === '*' && dayOfWeek === '*') {
    nextRun = new Date(now);
    nextRun.setDate(now.getDate() + 1);
    nextRun.setHours(0, 0, 0, 0);
    return nextRun;
  }
  
  // Setiap jam: "0 * * * *"
  if (minute === '0' && hour === '*' && day === '*' && month === '*' && dayOfWeek === '*') {
    nextRun = addHours(now, 1);
    nextRun = setMinutes(nextRun, 0);
    nextRun = setSeconds(nextRun, 0);
    return nextRun;
  }
  
  // Default: 6 jam dari sekarang
  nextRun = addHours(now, 6);
  nextRun = setMinutes(nextRun, 0);
  nextRun = setSeconds(nextRun, 0);
  return nextRun;
}