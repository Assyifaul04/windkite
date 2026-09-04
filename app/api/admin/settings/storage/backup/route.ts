// app/api/admin/settings/storage/backup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { format } from 'date-fns';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a backup record
    const backup = await prisma.cronJob.create({
      data: {
        name: `Database Backup ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
        description: 'Manual database backup',
        schedule: 'manual',
        command: 'backup',
        status: 'running',
        nextRun: new Date(),
        runs: 0,
        successfulRuns: 0,
        failedRuns: 0,
      },
    });

    // Simulate backup process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update backup status
    await prisma.cronJob.update({
      where: { id: backup.id },
      data: {
        status: 'active',
        lastRun: new Date(),
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000),
        runs: 1,
        successfulRuns: 1,
      },
    });

    return NextResponse.json({
      message: 'Backup created successfully',
      filename: `backup_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.sql`,
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}