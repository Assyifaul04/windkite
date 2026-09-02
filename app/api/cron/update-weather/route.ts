// app/api/cron/update-weather/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addHours } from 'date-fns';

// Verifikasi secret untuk keamanan
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key';

export async function GET(req: Request) {
  try {
    // Verifikasi authorization
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      // Untuk Vercel Cron Jobs, verifikasi dengan header x-vercel-cron
      const isVercelCron = req.headers.get('x-vercel-cron') === 'true';
      if (!isVercelCron) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('🔄 Starting weather update cron job...');

    // Get all locations
    const locations = await prisma.savedLocation.findMany({
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
      },
    });

    let updatedCount = 0;
    let errorCount = 0;

    // Update weather data for each location
    for (const location of locations) {
      try {
        // Fetch weather data from API
        const weatherData = await fetchWeatherData(location.latitude, location.longitude);
        
        // Save to database
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

        updatedCount++;
        console.log(`✅ Updated weather for ${location.name}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to update ${location.name}:`, error);
      }
    }

    // Update cron job status
    await updateCronJobStatus('1', true, updatedCount);

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} locations, ${errorCount} errors`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    
    // Update cron job status as failed
    await updateCronJobStatus('1', false, 0);
    
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}

async function fetchWeatherData(lat: number, lng: number) {
  // Implementasi fetch weather data dari API
  // Contoh menggunakan OpenWeatherMap atau WeatherAPI
  const API_KEY = process.env.WEATHER_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  return {
    windSpeed: data.wind.speed * 3.6, // Convert m/s to km/h
    windGust: data.wind.gust ? data.wind.gust * 3.6 : data.wind.speed * 3.6 * 1.3,
    windDirection: data.wind.deg || 0,
    temperature: data.main.temp,
    humidity: data.main.humidity,
  };
}

function calculateKiteSuitability(windSpeed: number): string {
  if (windSpeed < 5) return 'TIDAK_LAYAK';
  if (windSpeed < 15) return 'RINGAN';
  if (windSpeed < 30) return 'SEMUA';
  if (windSpeed < 45) return 'BERAT';
  return 'TIDAK_LAYAK';
}

async function updateCronJobStatus(jobId: string, success: boolean, runs: number) {
  try {
    await prisma.cronJob.update({
      where: { id: jobId },
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