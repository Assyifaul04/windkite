// app/api/admin/settings/storage/backup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Hitung total data untuk backup
    const [users, designs, locations, weatherLogs] = await Promise.all([
      prisma.user.count(),
      prisma.kiteDesign.count(),
      prisma.savedLocation.count(),
      prisma.weatherLog.count(),
    ]);

    const filename = `backup-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
    
    const backupData = {
      timestamp: new Date().toISOString(),
      stats: {
        users,
        designs,
        locations,
        weatherLogs,
      },
      settings: await prisma.storageSettings.findFirst(),
    };

    // Di production, simpan backup ke file atau S3
    console.log('Backup created:', filename, backupData);

    return NextResponse.json({
      success: true,
      filename,
      data: backupData,
      message: 'Backup created successfully',
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { error: 'Failed to create backup: ' + (error as Error).message },
      { status: 500 }
    );
  }
}