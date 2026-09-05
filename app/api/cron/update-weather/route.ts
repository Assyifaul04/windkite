// app/api/cron/update-weather/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addHours } from 'date-fns';
import { KiteSuitability } from '@prisma/client';

// Verifikasi secret untuk keamanan
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key';

export async function GET(req: Request) {
  try {
    // Verifikasi authorization
    const authHeader = req.headers.get('authorization');
    const isVercelCron = req.headers.get('x-vercel-cron') === 'true';
    
    if (!isVercelCron && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting weather update cron job...');

    // === PERBAIKAN: Ambil API Key dari database ===
    const weatherSettings = await prisma.weatherSettings.findFirst();
    
    if (!weatherSettings || !weatherSettings.apiKey) {
      console.error('❌ Weather API Key not configured in database');
      return NextResponse.json(
        { error: 'Weather API Key not configured. Please set it in Settings > Weather API' },
        { status: 400 }
      );
    }

    const API_KEY = weatherSettings.apiKey;

    // Get all locations
    const locations = await prisma.savedLocation.findMany({
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
      },
    });

    if (locations.length === 0) {
      console.log('⚠️ No locations found to update');
      return NextResponse.json({
        success: true,
        message: 'No locations to update',
        updatedCount: 0,
        errorCount: 0,
      });
    }

    let updatedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Update weather data for each location
    for (const location of locations) {
      try {
        const weatherData = await fetchWeatherData(
          location.latitude,
          location.longitude,
          API_KEY
        );
        
        // Cek apakah sudah ada data hari ini
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const existingLog = await prisma.weatherLog.findFirst({
          where: {
            locationId: location.id,
            timestamp: {
              gte: today,
            },
          },
        });

        if (existingLog) {
          // Update data yang sudah ada
          await prisma.weatherLog.update({
            where: { id: existingLog.id },
            data: {
              windSpeed: weatherData.windSpeed,
              windGust: weatherData.windGust || weatherData.windSpeed * 1.3,
              windDirection: weatherData.windDirection,
              temperature: weatherData.temperature,
              humidity: weatherData.humidity,
              kiteSuitability: calculateKiteSuitability(weatherData.windSpeed),
            },
          });
        } else {
          // Buat data baru
          await prisma.weatherLog.create({
            data: {
              locationId: location.id,
              windSpeed: weatherData.windSpeed,
              windGust: weatherData.windGust || weatherData.windSpeed * 1.3,
              windDirection: weatherData.windDirection,
              temperature: weatherData.temperature,
              humidity: weatherData.humidity,
              kiteSuitability: calculateKiteSuitability(weatherData.windSpeed),
              userId: null, // System update
            },
          });
        }

        updatedCount++;
        console.log(`✅ Updated weather for ${location.name}`);
      } catch (error) {
        errorCount++;
        const errorMsg = `Failed to update ${location.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    // Update cron job status - cari berdasarkan command
    await updateCronJobStatus('update-weather', errorCount === 0, updatedCount);

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} locations, ${errorCount} errors`,
      updatedCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    
    await updateCronJobStatus('update-weather', false, 0);
    
    return NextResponse.json(
      { 
        error: 'Cron job failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

async function fetchWeatherData(lat: number, lng: number, apiKey: string) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
  
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    windSpeed: data.wind.speed * 3.6, // Convert m/s to km/h
    windGust: data.wind.gust ? data.wind.gust * 3.6 : data.wind.speed * 3.6 * 1.3,
    windDirection: data.wind.deg || 0,
    temperature: data.main.temp,
    humidity: data.main.humidity,
  };
}

function calculateKiteSuitability(windSpeed: number): KiteSuitability {
  if (windSpeed < 5) return KiteSuitability.TIDAK_LAYAK;
  if (windSpeed < 15) return KiteSuitability.RINGAN;
  if (windSpeed < 30) return KiteSuitability.SEMUA;
  if (windSpeed < 45) return KiteSuitability.BERAT;
  return KiteSuitability.TIDAK_LAYAK;
}

async function updateCronJobStatus(command: string, success: boolean, runs: number) {
  try {
    // Cari cron job berdasarkan command
    const job = await prisma.cronJob.findFirst({
      where: { command: { contains: command } },
    });

    if (!job) {
      console.log(`⚠️ Cron job with command "${command}" not found, skipping status update`);
      return;
    }

    await prisma.cronJob.update({
      where: { id: job.id },
      data: {
        lastRun: new Date(),
        nextRun: addHours(new Date(), 6),
        runs: { increment: 1 },
        successfulRuns: success ? { increment: 1 } : undefined,
        failedRuns: !success ? { increment: 1 } : undefined,
        status: success ? 'active' : 'failed',
      },
    });
  } catch (error) {
    console.error('Failed to update cron job status:', error);
  }
}