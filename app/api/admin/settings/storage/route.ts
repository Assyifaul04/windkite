// app/api/admin/settings/storage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.storageSettings.findFirst();
    
    if (!settings) {
      // Return default settings if not found
      return NextResponse.json({
        provider: 'supabase',
        databaseUrl: process.env.DATABASE_URL || '',
        databaseName: 'windkite_db',
        storageEndpoint: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        storageBucket: 'kite-frames',
        storageUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        accessKey: '',
        secretKey: '',
        region: 'us-east-2',
        autoBackup: true,
        backupSchedule: 'daily',
        retentionDays: 30,
        compressImages: true,
        maxUploadSize: 10,
        googleDriveFolderId: '',
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const existing = await prisma.storageSettings.findFirst();
    
    let settings;
    if (existing) {
      settings = await prisma.storageSettings.update({
        where: { id: existing.id },
        data: {
          provider: body.provider || 'supabase',
          databaseUrl: body.databaseUrl,
          databaseName: body.databaseName || 'windkite_db',
          storageEndpoint: body.storageEndpoint,
          storageBucket: body.storageBucket || 'kite-frames',
          storageUrl: body.storageUrl,
          accessKey: body.accessKey,
          secretKey: body.secretKey,
          region: body.region || 'us-east-2',
          autoBackup: body.autoBackup !== undefined ? body.autoBackup : true,
          backupSchedule: body.backupSchedule || 'daily',
          retentionDays: body.retentionDays || 30,
          compressImages: body.compressImages !== undefined ? body.compressImages : true,
          maxUploadSize: body.maxUploadSize || 10,
          googleDriveFolderId: body.googleDriveFolderId,
          autoMoveToDrive: body.autoMoveToDrive !== undefined ? body.autoMoveToDrive : true,
          tempStorageDays: body.tempStorageDays || 7,
        },
      });
    } else {
      settings = await prisma.storageSettings.create({
        data: {
          provider: body.provider || 'supabase',
          databaseUrl: body.databaseUrl || '',
          databaseName: body.databaseName || 'windkite_db',
          storageEndpoint: body.storageEndpoint || '',
          storageBucket: body.storageBucket || 'kite-frames',
          storageUrl: body.storageUrl || '',
          accessKey: body.accessKey || '',
          secretKey: body.secretKey || '',
          region: body.region || 'us-east-2',
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

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error saving storage settings:', error);
    return NextResponse.json(
      { error: 'Failed to save storage settings' },
      { status: 500 }
    );
  }
}