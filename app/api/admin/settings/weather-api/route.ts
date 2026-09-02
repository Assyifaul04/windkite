// app/api/admin/settings/weather-api/route.ts
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

    let settings = await prisma.weatherSettings.findFirst();

    if (!settings) {
      settings = await prisma.weatherSettings.create({
        data: {
          provider: 'openweather',
          apiKey: '',
          apiUrl: 'https://api.openweathermap.org/data/2.5',
          defaultLocation: 'Jakarta',
          cacheDuration: 300,
          autoUpdate: true,
          updateInterval: 3600,
          retryCount: 3,
          timeout: 5000,
        },
      });
    }

    // Kirim API Key asli jika ada, bukan masked
    return NextResponse.json({
      ...settings,
      // Kirim apiKey asli agar bisa diisi di form
      apiKey: settings.apiKey || '',
    });
  } catch (error) {
    console.error('Error fetching weather settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings: ' + (error as Error).message },
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
    
    const existing = await prisma.weatherSettings.findFirst();

    let settings;
    if (existing) {
      settings = await prisma.weatherSettings.update({
        where: { id: existing.id },
        data: {
          provider: body.provider || 'openweather',
          apiKey: body.apiKey || '',
          apiUrl: body.apiUrl || 'https://api.openweathermap.org/data/2.5',
          defaultLocation: body.defaultLocation || 'Jakarta',
          cacheDuration: body.cacheDuration || 300,
          autoUpdate: body.autoUpdate !== undefined ? body.autoUpdate : true,
          updateInterval: body.updateInterval || 3600,
          retryCount: body.retryCount || 3,
          timeout: body.timeout || 5000,
        },
      });
    } else {
      settings = await prisma.weatherSettings.create({
        data: {
          provider: body.provider || 'openweather',
          apiKey: body.apiKey || '',
          apiUrl: body.apiUrl || 'https://api.openweathermap.org/data/2.5',
          defaultLocation: body.defaultLocation || 'Jakarta',
          cacheDuration: body.cacheDuration || 300,
          autoUpdate: body.autoUpdate !== undefined ? body.autoUpdate : true,
          updateInterval: body.updateInterval || 3600,
          retryCount: body.retryCount || 3,
          timeout: body.timeout || 5000,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      data: settings,
      message: 'Weather settings saved successfully'
    });
  } catch (error) {
    console.error('Error saving weather settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings: ' + (error as Error).message },
      { status: 500 }
    );
  }
}