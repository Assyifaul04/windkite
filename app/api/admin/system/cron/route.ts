// app/api/admin/system/cron/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addHours, addMinutes, setHours, setMinutes, setSeconds } from 'date-fns';

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
    
    // Validate required fields
    if (!body.name || !body.schedule || !body.command) {
      return NextResponse.json(
        { error: 'Name, schedule, and command are required' },
        { status: 400 }
      );
    }
    
    // Calculate next run time
    const nextRun = calculateNextRun(body.schedule);
    
    const job = await prisma.cronJob.create({
      data: {
        name: body.name,
        description: body.description || '',
        schedule: body.schedule,
        command: body.command,
        status: body.status || 'active',
        nextRun: nextRun,
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

// Helper untuk menghitung nextRun dari cron expression
function calculateNextRun(schedule: string): Date {
  const now = new Date();
  const parts = schedule.trim().split(' ');
  
  if (parts.length !== 5) {
    return addHours(now, 6);
  }

  const [minute, hour, day, month, dayOfWeek] = parts;
  
  let nextRun = new Date(now);
  
  // Set detik ke 0
  nextRun = setSeconds(nextRun, 0);
  nextRun = setMinutes(nextRun, 0);
  
  // Pattern: "0 */6 * * *" (setiap 6 jam)
  if (minute === '0' && hour === '*/6' && day === '*' && month === '*' && dayOfWeek === '*') {
    nextRun = addHours(now, 6);
    nextRun = setMinutes(nextRun, 0);
    nextRun = setSeconds(nextRun, 0);
  }
  // Pattern: "0 0 * * *" (setiap hari jam 00:00)
  else if (minute === '0' && hour === '0' && day === '*' && month === '*' && dayOfWeek === '*') {
    nextRun = new Date(now);
    nextRun.setDate(now.getDate() + 1);
    nextRun.setHours(0, 0, 0, 0);
  }
  // Pattern: "0 * * * *" (setiap jam)
  else if (minute === '0' && hour === '*' && day === '*' && month === '*' && dayOfWeek === '*') {
    nextRun = addHours(now, 1);
    nextRun = setMinutes(nextRun, 0);
    nextRun = setSeconds(nextRun, 0);
  }
  // Pattern: "*/30 * * * *" (setiap 30 menit)
  else if (minute === '*/30' && hour === '*' && day === '*' && month === '*' && dayOfWeek === '*') {
    const minutes = now.getMinutes();
    const nextMinutes = minutes < 30 ? 30 : 60;
    nextRun = new Date(now);
    nextRun.setMinutes(nextMinutes, 0, 0);
    if (nextMinutes === 60) {
      nextRun.setHours(now.getHours() + 1);
      nextRun.setMinutes(0, 0, 0);
    }
  }
  // Pattern: "0 0 * * 0" (setiap Minggu)
  else if (minute === '0' && hour === '0' && day === '*' && month === '*' && dayOfWeek === '0') {
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    nextRun = new Date(now);
    nextRun.setDate(now.getDate() + daysUntilSunday);
    nextRun.setHours(0, 0, 0, 0);
  }
  // Custom pattern - try to parse
  else {
    // Try to parse minute
    let minutesOffset = 0;
    let hoursOffset = 0;
    let daysOffset = 0;
    
    if (minute !== '*' && !minute.startsWith('*/')) {
      const min = parseInt(minute);
      if (!isNaN(min) && min > now.getMinutes()) {
        minutesOffset = min - now.getMinutes();
      } else if (!isNaN(min)) {
        hoursOffset = 1;
        minutesOffset = min - now.getMinutes() + 60;
      }
    }
    
    if (hour !== '*' && !hour.startsWith('*/')) {
      const hr = parseInt(hour);
      if (!isNaN(hr) && hr > now.getHours()) {
        hoursOffset = hr - now.getHours();
      } else if (!isNaN(hr)) {
        daysOffset = 1;
        hoursOffset = hr - now.getHours() + 24;
      }
    }
    
    nextRun = new Date(now);
    nextRun.setHours(now.getHours() + hoursOffset);
    nextRun.setMinutes(now.getMinutes() + minutesOffset);
    nextRun.setSeconds(0);
    nextRun.setDate(now.getDate() + daysOffset);
  }
  
  // Ensure nextRun is in the future
  if (nextRun <= now) {
    nextRun = addHours(now, 6);
  }
  
  return nextRun;
}