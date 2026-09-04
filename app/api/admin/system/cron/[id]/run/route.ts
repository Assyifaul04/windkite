// app/api/admin/system/cron/[id]/run/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addHours, addDays, setHours, setMinutes, setSeconds } from 'date-fns';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const job = await prisma.cronJob.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json({ error: 'Cron job not found' }, { status: 404 });
    }

    // Execute command berdasarkan tipe
    let success = false;
    let result = '';

    try {
      switch (job.command) {
        case 'node scripts/update-weather.js':
        case 'npm run update-weather':
          result = await executeWeatherUpdate();
          success = true;
          break;
        case 'node scripts/clean-sessions.js':
        case 'npm run clean-sessions':
          result = await executeSessionCleanup();
          success = true;
          break;
        case 'node scripts/generate-reports.js':
        case 'npm run generate-reports':
          result = await executeReportGeneration();
          success = true;
          break;
        default:
          // Untuk command lain, coba eksekusi dengan child_process
          try {
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execPromise = promisify(exec);
            
            const { stdout, stderr } = await execPromise(job.command);
            result = stdout || stderr || 'Command executed successfully';
            success = true;
          } catch (execError) {
            console.error('Command execution error:', execError);
            result = execError instanceof Error ? execError.message : 'Unknown execution error';
            success = false;
          }
      }
    } catch (error) {
      console.error('Error executing cron job:', error);
      result = error instanceof Error ? error.message : 'Unknown error';
      success = false;
    }

    // Update statistik
    const updateData: any = {
      lastRun: new Date(),
      runs: { increment: 1 },
      status: success ? 'active' : 'failed',
    };

    if (success) {
      updateData.successfulRuns = { increment: 1 };
    } else {
      updateData.failedRuns = { increment: 1 };
    }

    // Recalculate next run
    updateData.nextRun = calculateNextRun(job.schedule);

    const updatedJob = await prisma.cronJob.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success,
      message: success ? 'Cron job executed successfully' : 'Cron job execution failed',
      result,
      timestamp: new Date().toISOString(),
      job: updatedJob,
    });
  } catch (error) {
    console.error('Error running cron job:', error);
    return NextResponse.json(
      { error: 'Failed to run cron job' },
      { status: 500 }
    );
  }
}

// Helper functions untuk command
async function executeWeatherUpdate(): Promise<string> {
  try {
    // Panggil API internal untuk update weather
    const baseUrl = process.env.NEXTAUTH_URL || 'http://windkite.vercel.app';
    const response = await fetch(`${baseUrl}/api/cron/update-weather`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return `Weather update completed: ${data.message || 'Success'}`;
  } catch (error) {
    console.error('Weather update error:', error);
    throw new Error(`Failed to update weather: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function executeSessionCleanup(): Promise<string> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://windkite.vercel.app';
    const response = await fetch(`${baseUrl}/api/cron/clean-sessions`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return `Session cleanup completed: ${data.message || 'Success'}`;
  } catch (error) {
    console.error('Session cleanup error:', error);
    throw new Error(`Failed to clean sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function executeReportGeneration(): Promise<string> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://windkite.vercel.app';
    const response = await fetch(`${baseUrl}/api/cron/generate-reports`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return `Report generation completed: ${data.message || 'Success'}`;
  } catch (error) {
    console.error('Report generation error:', error);
    throw new Error(`Failed to generate reports: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Updated: Better schedule calculation with daily support
function calculateNextRun(schedule: string): Date {
  const now = new Date();
  const parts = schedule.trim().split(' ');
  
  if (parts.length !== 5) {
    return addHours(now, 6);
  }

  const [minute, hour, day, month, dayOfWeek] = parts;
  
  let nextRun = new Date(now);
  nextRun = setSeconds(nextRun, 0);
  
  // Check for common patterns
  // Pattern: "0 0 * * *" (daily at midnight - for weather update)
  if (minute === '0' && hour === '0' && day === '*' && month === '*' && dayOfWeek === '*') {
    nextRun = new Date(now);
    // If current time is after midnight, set to next midnight
    if (now.getHours() >= 0 && now.getMinutes() > 0) {
      nextRun.setDate(now.getDate() + 1);
    }
    nextRun.setHours(0, 0, 0, 0);
    return nextRun;
  }
  
  // Pattern: "0 */6 * * *" (every 6 hours)
  if (minute === '0' && hour === '*/6' && day === '*' && month === '*' && dayOfWeek === '*') {
    nextRun = addHours(now, 6);
    nextRun = setMinutes(nextRun, 0);
    nextRun = setSeconds(nextRun, 0);
    return nextRun;
  }
  
  // Pattern: "0 1 * * *" (daily at 1 AM)
  if (minute === '0' && day === '*' && month === '*' && dayOfWeek === '*') {
    const hourNum = parseInt(hour);
    if (!isNaN(hourNum)) {
      nextRun = new Date(now);
      if (now.getHours() >= hourNum) {
        nextRun.setDate(now.getDate() + 1);
      }
      nextRun.setHours(hourNum, 0, 0, 0);
      return nextRun;
    }
  }
  
  // Pattern: "0 * * * *" (every hour)
  if (minute === '0' && hour === '*' && day === '*' && month === '*' && dayOfWeek === '*') {
    nextRun = addHours(now, 1);
    nextRun = setMinutes(nextRun, 0);
    nextRun = setSeconds(nextRun, 0);
    return nextRun;
  }
  
  // Pattern: "*/30 * * * *" (every 30 minutes)
  if (minute === '*/30' && hour === '*' && day === '*' && month === '*' && dayOfWeek === '*') {
    const minutes = now.getMinutes();
    const nextMinutes = minutes < 30 ? 30 : 60;
    nextRun = new Date(now);
    nextRun.setMinutes(nextMinutes, 0, 0);
    if (nextMinutes === 60) {
      nextRun.setHours(now.getHours() + 1);
      nextRun.setMinutes(0, 0, 0);
    }
    return nextRun;
  }
  
  // Pattern: "0 0 * * 0" (every Sunday at midnight)
  if (minute === '0' && hour === '0' && day === '*' && month === '*' && dayOfWeek === '0') {
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    nextRun = new Date(now);
    nextRun.setDate(now.getDate() + daysUntilSunday);
    nextRun.setHours(0, 0, 0, 0);
    return nextRun;
  }
  
  // Default: 6 hours from now
  nextRun = addHours(now, 6);
  nextRun = setMinutes(nextRun, 0);
  nextRun = setSeconds(nextRun, 0);
  
  return nextRun;
}