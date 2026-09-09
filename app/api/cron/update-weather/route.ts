// app/api/cron/update-weather/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addHours, addDays, startOfDay } from 'date-fns';
import { KiteSuitability } from '@prisma/client';

const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const isVercelCron = req.headers.get('x-vercel-cron') === 'true';
    
    if (!isVercelCron && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting weather update cron job...');

    const weatherSettings = await prisma.weatherSettings.findFirst();
    
    if (!weatherSettings || !weatherSettings.apiKey) {
      console.error('❌ Weather API Key not configured in database');
      return NextResponse.json(
        { error: 'Weather API Key not configured' },
        { status: 400 }
      );
    }

    const API_KEY = weatherSettings.apiKey;

    const locations = await prisma.savedLocation.findMany({
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
      },
    });

    if (locations.length === 0) {
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

    for (const location of locations) {
      try {
        // === PERBAIKAN 1: Ambil data CURRENT WEATHER ===
        const currentWeather = await fetchCurrentWeather(
          location.latitude,
          location.longitude,
          API_KEY
        );
        
        // === PERBAIKAN 2: Ambil data FORECAST (48 jam) ===
        const forecastData = await fetchWeatherForecast(
          location.latitude,
          location.longitude,
          API_KEY
        );
        
        // Update current weather
        await updateCurrentWeather(location.id, currentWeather);
        
        // === PERBAIKAN 3: Simpan forecast data ===
        await saveForecastData(location.id, forecastData);
        
        updatedCount++;
        console.log(`✅ Updated weather & forecast for ${location.name}`);
      } catch (error) {
        errorCount++;
        const errorMsg = `Failed to update ${location.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

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
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// === FUNGSI BARU: Fetch Current Weather ===
async function fetchCurrentWeather(lat: number, lng: number, apiKey: string) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  
  const data = await response.json();
  
  return {
    windSpeed: data.wind.speed * 3.6,
    windGust: data.wind.gust ? data.wind.gust * 3.6 : data.wind.speed * 3.6 * 1.3,
    windDirection: data.wind.deg || 0,
    temperature: data.main.temp,
    humidity: data.main.humidity,
  };
}

// === FUNGSI BARU: Fetch Weather Forecast (48 jam) ===
async function fetchWeatherForecast(lat: number, lng: number, apiKey: string) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&cnt=40`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  
  const data = await response.json();
  
  // OpenWeatherMap memberikan data setiap 3 jam (8 data per hari = 40 data = 5 hari)
  return data.list.map((item: any) => ({
    timestamp: new Date(item.dt * 1000),
    temperature: item.main.temp,
    humidity: item.main.humidity,
    windSpeed: item.wind.speed * 3.6,
    windGust: item.wind.gust ? item.wind.gust * 3.6 : item.wind.speed * 3.6 * 1.3,
    windDirection: item.wind.deg || 0,
    weatherCode: item.weather[0]?.id || 0,
    weatherDesc: item.weather[0]?.description || '',
    isDaytime: item.sys?.pod === 'd' || false,
  }));
}

// === FUNGSI BARU: Update Current Weather ===
async function updateCurrentWeather(locationId: string, weatherData: any) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const existingLog = await prisma.weatherLog.findFirst({
    where: {
      locationId: locationId,
      timestamp: { gte: today },
    },
  });

  const suitability = calculateKiteSuitability(weatherData.windSpeed);

  if (existingLog) {
    await prisma.weatherLog.update({
      where: { id: existingLog.id },
      data: {
        windSpeed: weatherData.windSpeed,
        windGust: weatherData.windGust,
        windDirection: weatherData.windDirection,
        temperature: weatherData.temperature,
        humidity: weatherData.humidity,
        kiteSuitability: suitability,
        timestamp: new Date(), // Update waktu ke sekarang
      },
    });
  } else {
    await prisma.weatherLog.create({
      data: {
        locationId: locationId,
        windSpeed: weatherData.windSpeed,
        windGust: weatherData.windGust,
        windDirection: weatherData.windDirection,
        temperature: weatherData.temperature,
        humidity: weatherData.humidity,
        kiteSuitability: suitability,
        userId: null,
      },
    });
  }
}

// === FUNGSI BARU: Save Forecast Data ===
async function saveForecastData(locationId: string, forecastItems: any[]) {
  // Hapus forecast lama (lebih dari 24 jam)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  await prisma.weatherForecast.deleteMany({
    where: {
      locationId: locationId,
      timestamp: { lt: yesterday },
    },
  });

  // Simpan forecast baru
  for (const item of forecastItems) {
    const suitability = calculateKiteSuitability(item.windSpeed);
    
    await prisma.weatherForecast.upsert({
      where: {
        locationId_timestamp: {
          locationId: locationId,
          timestamp: item.timestamp,
        },
      },
      update: {
        temperature: item.temperature,
        humidity: item.humidity,
        windSpeed: item.windSpeed,
        windGust: item.windGust,
        windDirection: item.windDirection,
        kiteSuitability: suitability,
        weatherCode: item.weatherCode,
        weatherDesc: item.weatherDesc,
        isDaytime: item.isDaytime,
      },
      create: {
        locationId: locationId,
        timestamp: item.timestamp,
        temperature: item.temperature,
        humidity: item.humidity,
        windSpeed: item.windSpeed,
        windGust: item.windGust,
        windDirection: item.windDirection,
        kiteSuitability: suitability,
        weatherCode: item.weatherCode,
        weatherDesc: item.weatherDesc,
        isDaytime: item.isDaytime,
        forecastHour: Math.floor((item.timestamp.getTime() - new Date().getTime()) / (1000 * 60 * 60)),
      },
    });
  }
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
    const job = await prisma.cronJob.findFirst({
      where: { command: { contains: command } },
    });

    if (!job) {
      console.log(`⚠️ Cron job with command "${command}" not found`);
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