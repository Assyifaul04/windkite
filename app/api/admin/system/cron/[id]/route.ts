// app/api/admin/system/cron/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

let cronJobs = [
  {
    id: '1',
    name: 'Update Weather Data',
    description: 'Fetch latest weather data for all locations',
    schedule: '0 */6 * * *',
    command: 'node scripts/update-weather.js',
    status: 'active' as const,
    lastRun: new Date(Date.now() - 3600000).toISOString(),
    nextRun: new Date(Date.now() + 3600000 * 5).toISOString(),
    runs: 125,
    successfulRuns: 120,
    failedRuns: 5,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Clean Old Sessions',
    description: 'Remove expired user sessions',
    schedule: '0 0 * * *',
    command: 'node scripts/clean-sessions.js',
    status: 'active' as const,
    lastRun: new Date(Date.now() - 86400000).toISOString(),
    nextRun: new Date(Date.now() + 86400000).toISOString(),
    runs: 30,
    successfulRuns: 30,
    failedRuns: 0,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const jobIndex = cronJobs.findIndex(j => j.id === params.id);

    if (jobIndex === -1) {
      return NextResponse.json({ error: 'Cron job not found' }, { status: 404 });
    }

    cronJobs[jobIndex] = {
      ...cronJobs[jobIndex],
      name: body.name || cronJobs[jobIndex].name,
      description: body.description || cronJobs[jobIndex].description,
      schedule: body.schedule || cronJobs[jobIndex].schedule,
      command: body.command || cronJobs[jobIndex].command,
      status: body.status || cronJobs[jobIndex].status,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(cronJobs[jobIndex]);
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobIndex = cronJobs.findIndex(j => j.id === params.id);

    if (jobIndex === -1) {
      return NextResponse.json({ error: 'Cron job not found' }, { status: 404 });
    }

    cronJobs.splice(jobIndex, 1);

    return NextResponse.json({ message: 'Cron job deleted successfully' });
  } catch (error) {
    console.error('Error deleting cron job:', error);
    return NextResponse.json(
      { error: 'Failed to delete cron job' },
      { status: 500 }
    );
  }
}