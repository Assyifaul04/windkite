// app/api/admin/system/cron/[id]/run/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateNextRun } from '@/lib/cron-utils';

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

    const job = await prisma.cronJob.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json({ error: 'Cron job not found' }, { status: 404 });
    }

    console.log(`🔄 Executing cron job: ${job.name} (${job.command})`);

    let success = false;
    let result = '';
    let details = '';

    try {
      const command = job.command.toLowerCase();

      if (command === 'update-weather' || command.includes('weather')) {
        const weatherResult = await executeWeatherUpdate();
        success = weatherResult.success;
        result = weatherResult.message;
        details = weatherResult.details || '';
      } else if (command === 'clean-sessions' || command.includes('clean')) {
        const sessionResult = await executeSessionCleanup();
        success = sessionResult.success;
        result = sessionResult.message;
        details = sessionResult.details || '';
      } else if (command === 'generate-reports' || command.includes('report')) {
        const reportResult = await executeReportGeneration();
        success = reportResult.success;
        result = reportResult.message;
        details = reportResult.details || '';
      } else {
        result = `Unknown command: ${job.command}`;
        success = false;
      }
    } catch (error) {
      console.error('Error executing cron job:', error);
      result = error instanceof Error ? error.message : 'Unknown error';
      success = false;
    }

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

    // PENTING: hitung nextRun dari schedule job, bukan hardcoded
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

// ==========================================
// Helper: resolve base URL
// ==========================================
function resolveBaseUrl(): string {
  let baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  if (!baseUrl) {
    baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://your-domain.com'
      : 'http://localhost:3000';
  }

  return baseUrl.replace(/\/$/, '');
}

// ==========================================
// Execute Weather Update
// ==========================================
async function executeWeatherUpdate(): Promise<{ success: boolean; message: string; details?: string }> {
  try {
    const baseUrl = resolveBaseUrl();
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
      details: `Updated ${data.updatedCount || 0} locations, ${data.errorCount || 0} errors, ${data.forecastCount || 0} forecast entries`,
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

// ==========================================
// Execute Session Cleanup
// ==========================================
async function executeSessionCleanup(): Promise<{ success: boolean; message: string; details?: string }> {
  try {
    const baseUrl = resolveBaseUrl();
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

// ==========================================
// Execute Report Generation
// ==========================================
async function executeReportGeneration(): Promise<{ success: boolean; message: string; details?: string }> {
  try {
    const baseUrl = resolveBaseUrl();
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