// app/api/admin/settings/ads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let settings = await prisma.adSettings.findFirst();

    if (!settings) {
      settings = await prisma.adSettings.create({
        data: {
          provider: 'google_adsense',
          scriptUrl: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7542754799825568',
          clientId: 'ca-pub-7542754799825568',
          adSlot: '9422886372',
          isActive: true,
          position: 'global',
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching ad settings:', error);
    return NextResponse.json({ error: 'Failed to fetch ad settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    const existing = await prisma.adSettings.findFirst();

    let settings;
    if (existing) {
      settings = await prisma.adSettings.update({
        where: { id: existing.id },
        data: {
          provider: body.provider || 'google_adsense',
          scriptUrl: body.scriptUrl || '',
          clientId: body.clientId || '',
          adSlot: body.adSlot || '',
          isActive: body.isActive !== undefined ? body.isActive : true,
          position: body.position || 'global',
        },
      });
    } else {
      settings = await prisma.adSettings.create({
        data: {
          provider: body.provider || 'google_adsense',
          scriptUrl: body.scriptUrl || '',
          clientId: body.clientId || '',
          adSlot: body.adSlot || '',
          isActive: body.isActive !== undefined ? body.isActive : true,
          position: body.position || 'global',
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      data: settings,
      message: 'Ad settings saved successfully'
    });
  } catch (error) {
    console.error('Error saving ad settings:', error);
    return NextResponse.json({ error: 'Failed to save ad settings' }, { status: 500 });
  }
}