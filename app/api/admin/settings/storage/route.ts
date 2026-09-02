// app/api/admin/settings/storage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.storageSettings.findFirst();
    
    if (!settings) {
      // Return default settings jika belum ada
      return NextResponse.json({
        provider: 'neon',
        storageEndpoint: '',
        storageBucket: 'kite-designs',
        storageUrl: '',
        accessKey: '',
        secretKey: '',
        region: 'us-east-2',
        databaseName: 'windkite_db',
        autoBackup: true,
        backupSchedule: 'daily',
        retentionDays: 30,
        compressImages: true,
        maxUploadSize: 10,
        autoMoveToDrive: true,
        tempStorageDays: 7,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching storage settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storage settings' },
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
    
    const existing = await prisma.storageSettings.findFirst();
    
    let settings;
    if (existing) {
      settings = await prisma.storageSettings.update({
        where: { id: existing.id },
        data: {
          provider: body.provider || 'neon',
          storageEndpoint: body.storageEndpoint || '',
          storageBucket: body.storageBucket || 'kite-designs',
          storageUrl: body.storageUrl || '',
          accessKey: body.accessKey || '',
          secretKey: body.secretKey || '',
          region: body.region || 'us-east-2',
          databaseName: body.databaseName || 'windkite_db',
          autoBackup: body.autoBackup !== undefined ? body.autoBackup : true,
          backupSchedule: body.backupSchedule || 'daily',
          retentionDays: body.retentionDays || 30,
          compressImages: body.compressImages !== undefined ? body.compressImages : true,
          maxUploadSize: body.maxUploadSize || 10,
          googleDriveFolderId: body.googleDriveFolderId || '',
          autoMoveToDrive: body.autoMoveToDrive !== undefined ? body.autoMoveToDrive : true,
          tempStorageDays: body.tempStorageDays || 7,
        },
      });
    } else {
      settings = await prisma.storageSettings.create({
        data: {
          provider: body.provider || 'neon',
          storageEndpoint: body.storageEndpoint || '',
          storageBucket: body.storageBucket || 'kite-designs',
          storageUrl: body.storageUrl || '',
          accessKey: body.accessKey || '',
          secretKey: body.secretKey || '',
          region: body.region || 'us-east-2',
          databaseName: body.databaseName || 'windkite_db',
          autoBackup: body.autoBackup !== undefined ? body.autoBackup : true,
          backupSchedule: body.backupSchedule || 'daily',
          retentionDays: body.retentionDays || 30,
          compressImages: body.compressImages !== undefined ? body.compressImages : true,
          maxUploadSize: body.maxUploadSize || 10,
          googleDriveFolderId: body.googleDriveFolderId || '',
          autoMoveToDrive: body.autoMoveToDrive !== undefined ? body.autoMoveToDrive : true,
          tempStorageDays: body.tempStorageDays || 7,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      data: settings,
      message: 'Storage settings saved successfully'
    });
  } catch (error) {
    console.error('Error saving storage settings:', error);
    return NextResponse.json(
      { error: 'Failed to save storage settings: ' + (error as Error).message },
      { status: 500 }
    );
  }
}