// app/api/admin/settings/general/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Simpan settings di database atau file
let generalSettings = {
  siteName: 'WindKite Platform',
  siteDescription: 'Platform informasi angin dan desain layangan AI',
  siteUrl: 'https://windkite.com',
  language: 'id',
  timezone: 'Asia/Jakarta',
  dateFormat: 'dd/MM/yyyy',
  timeFormat: 'HH:mm',
  maintenanceMode: false,
  registrationEnabled: true,
  emailNotifications: true,
  twoFactorAuth: false,
  analyticsEnabled: false,
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(generalSettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
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
    generalSettings = { ...generalSettings, ...body };

    return NextResponse.json({ success: true, data: generalSettings });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}