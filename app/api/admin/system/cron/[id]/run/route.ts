// app/api/admin/system/cron/[id]/run/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addHours, setMinutes, setSeconds } from 'date-fns';

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

    console.log(`🔄 Executing cron job: ${job.name} (${job.command})`);

    let success = false;
    let result = '';
    let details = '';

    try {
      const command = job.command.toLowerCase();
      
      // Weather update
      if (command === 'update-weather' || command.includes('weather')) {
        const weatherResult = await executeWeatherUpdate();
        success = weatherResult.success;
        result = weatherResult.message;
        details = weatherResult.details || '';
      } 
      // Session cleanup
      else if (command === 'clean-sessions' || command.includes('clean')) {
        const sessionResult = await executeSessionCleanup();
        success = sessionResult.success;
        result = sessionResult.message;
        details = sessionResult.details || '';
      } 
      // Report generation
      else if (command === 'generate-reports' || command.includes('report')) {
        const reportResult = await executeReportGeneration();
        success = reportResult.success;
        result = reportResult.message;
        details = reportResult.details || '';
      } 
      else {
        result = `Unknown command: ${job.command}`;
        success = false;
      }
    } catch (error) {
      console.error('Error executing cron job:', error);
      result = error instanceof Error ? error.message : 'Unknown error';
      success = false;
    }

    // Update job statistics
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

    updateData.nextRun = calculateNextRun(job.schedule);

    const updatedJob = await prisma.cronJob.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success,
      message: success ? 'Cron job executed successfully' : 'Cron job execution failed',
      result,
      details: details || undefined,
      timestamp: new Date().toISOString(),
      job: updatedJob,
    });
  } catch (error) {
    console.error('Error running cron job:', error);
    return NextResponse.json(
      { error: 'Failed to run cron job', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Weather update execution - FIXED baseUrl
async function executeWeatherUpdate(): Promise<{ success: boolean; message: string; details?: string }> {
  try {
    // FIX: Use proper base URL
    let baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL;
    
    // If still undefined, use localhost for development
    if (!baseUrl) {
      baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://your-domain.com' // Ganti dengan domain produksi Anda
        : 'http://localhost:3000';
    }
    
    // Remove trailing slash if exists
    baseUrl = baseUrl.replace(/\/$/, '');
    
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key';
    
    console.log(`🌐 Calling weather update API at: ${baseUrl}/api/cron/update-weather`);
    
    const response = await fetch(`${baseUrl}/api/cron/update-weather`, {
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      message: data.message || 'Weather update completed successfully',
      details: `Updated ${data.updatedCount || 0} locations, ${data.errorCount || 0} errors`,
    };
  } catch (error) {
    console.error('Weather update error:', error);
    return {
      success: false,
      message: `Failed to update weather: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error instanceof Error ? error.stack : undefined,
    };
  }
}

// Session cleanup execution - FIXED baseUrl
async function executeSessionCleanup(): Promise<{ success: boolean; message: string; details?: string }> {
  try {
    let baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL;
    
    if (!baseUrl) {
      baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://your-domain.com'
        : 'http://localhost:3000';
    }
    
    baseUrl = baseUrl.replace(/\/$/, '');
    
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key';
    
    console.log(`🌐 Calling clean sessions API at: ${baseUrl}/api/cron/clean-sessions`);
    
    const response = await fetch(`${baseUrl}/api/cron/clean-sessions`, {
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Session cleanup completed',
      details: `Deleted ${data.deletedCount || 0} sessions`,
    };
  } catch (error) {
    console.error('Session cleanup error:', error);
    return {
      success: false,
      message: `Failed to clean sessions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error instanceof Error ? error.stack : undefined,
    };
  }
}

// Report generation execution - FIXED baseUrl
async function executeReportGeneration(): Promise<{ success: boolean; message: string; details?: string }> {
  try {
    let baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL;
    
    if (!baseUrl) {
      baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://your-domain.com'
        : 'http://localhost:3000';
    }
    
    baseUrl = baseUrl.replace(/\/$/, '');
    
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key';
    
    console.log(`🌐 Calling generate reports API at: ${baseUrl}/api/cron/generate-reports`);
    
    const response = await fetch(`${baseUrl}/api/cron/generate-reports`, {
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Report generation completed',
      details: `Report generated at ${data.timestamp || new Date().toISOString()}`,
    };
  } catch (error) {
    console.error('Report generation error:', error);
    return {
      success: false,
      message: `Failed to generate reports: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error instanceof Error ? error.stack : undefined,
    };
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
  
  // Daily at midnight: "0 0 * * *"
  if (minute === '0' && hour === '0' && day === '*' && month === '*' && dayOfWeek === '*') {
    nextRun = new Date(now);
    if (now.getHours() >= 0 && now.getMinutes() > 0) {
      nextRun.setDate(now.getDate() + 1);
    }
    nextRun.setHours(0, 0, 0, 0);
    return nextRun;
  }
  
  // Every 6 hours: "0 */6 * * *"
  if (minute === '0' && hour === '*/6' && day === '*' && month === '*' && dayOfWeek === '*') {
    nextRun = addHours(now, 6);
    nextRun = setMinutes(nextRun, 0);
    nextRun = setSeconds(nextRun, 0);
    return nextRun;
  }
  
  // Every hour: "0 * * * *"
  if (minute === '0' && hour === '*' && day === '*' && month === '*' && dayOfWeek === '*') {
    nextRun = addHours(now, 1);
    nextRun = setMinutes(nextRun, 0);
    nextRun = setSeconds(nextRun, 0);
    return nextRun;
  }
  
  // Default: 6 hours from now
  nextRun = addHours(now, 6);
  nextRun = setMinutes(nextRun, 0);
  nextRun = setSeconds(nextRun, 0);
  
  return nextRun;
}