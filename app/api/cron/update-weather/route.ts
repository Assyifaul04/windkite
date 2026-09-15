// app/api/cron/update-weather/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { KiteSuitability } from '@prisma/client';

const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const isVercelCron = req.headers.get('x-vercel-cron') === 'true';

    // Otorisasi: Terima dari Vercel internal ATAU Cron-Jobs.org via Bearer Token
    if (!isVercelCron && authHeader !== `Bearer ${CRON_SECRET}`) {
      console.log('⚠️ Unauthorized access attempt to /api/cron/update-weather');
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
        // 1. Fetch Current Weather
        const currentWeather = await fetchCurrentWeather(
          location.latitude,
          location.longitude,
          API_KEY
        );

        // 2. Fetch Forecast Weather (48 jam = 16 x 3 jam)
        const forecastData = await fetchWeatherForecast(
          location.latitude,
          location.longitude,
          API_KEY
        );

        // 3. Simpan Current Weather sebagai log baru (Time-series)
        await createCurrentWeatherLog(location.id, currentWeather);

        // 4. Upsert Forecast Data
        await saveForecastData(location.id, forecastData);

        updatedCount++;
        console.log(`✅ Updated weather & forecast for ${location.name}`);
      } catch (error) {
        errorCount++;
        const errorMsg = `Failed to update ${location.name}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    await updateCronJobStatus('update-weather', errorCount === 0);

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
    await updateCronJobStatus('update-weather', false);
    return NextResponse.json(
      {
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// === Fetch Current Weather ===
async function fetchCurrentWeather(lat: number, lng: number, apiKey: string) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`OpenWeather Current Error: ${response.statusText}`);

  const data = await response.json();

  return {
    windSpeed: data.wind.speed * 3.6, // m/s to km/h
    windGust: data.wind.gust ? data.wind.gust * 3.6 : data.wind.speed * 3.6 * 1.3,
    windDirection: data.wind.deg || 0,
    temperature: data.main.temp,
    humidity: data.main.humidity,
  };
}

// === Fetch Forecast (48 jam = cnt=16) ===
async function fetchWeatherForecast(lat: number, lng: number, apiKey: string) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&cnt=16`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`OpenWeather Forecast Error: ${response.statusText}`);

  const data = await response.json();

  return data.list.map((item: any) => ({
    timestamp: new Date(item.dt * 1000),
    temperature: item.main.temp,
    humidity: item.main.humidity,
    windSpeed: item.wind.speed * 3.6,
    windGust: item.wind.gust ? item.wind.gust * 3.6 : item.wind.speed * 3.6 * 1.3,
    windDirection: item.wind.deg || 0,
    weatherCode: item.weather[0]?.id || 0,
    weatherDesc: item.weather[0]?.description || '',
    isDaytime: item.sys?.pod === 'd',
  }));
}

// === Simpan Log Cuaca Terkini ===
async function createCurrentWeatherLog(locationId: string, weatherData: any) {
  const suitability = calculateKiteSuitability(weatherData.windSpeed);

  await prisma.weatherLog.create({
    data: {
      locationId: locationId,
      windSpeed: Math.round(weatherData.windSpeed * 10) / 10,
      windGust: Math.round(weatherData.windGust * 10) / 10,
      windDirection: Math.round(weatherData.windDirection),
      temperature: weatherData.temperature !== undefined ? Math.round(weatherData.temperature * 10) / 10 : null,
      humidity: weatherData.humidity !== undefined ? Math.round(weatherData.humidity) : null,
      kiteSuitability: suitability,
      userId: null,
    },
  });
}

// === Simpan Data Forecast ===
async function saveForecastData(locationId: string, forecastItems: any[]) {
  const now = new Date();

  // Hapus forecast yang sudah lewat (lebih tua dari hari kemarin)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  await prisma.weatherForecast.deleteMany({
    where: {
      locationId: locationId,
      timestamp: { lt: yesterday },
    },
  });

  for (const item of forecastItems) {
    const suitability = calculateKiteSuitability(item.windSpeed);
    const forecastHour = Math.max(
      0,
      Math.round((item.timestamp.getTime() - now.getTime()) / (1000 * 60 * 60))
    );

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
        forecastHour,
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
        forecastHour,
      },
    });
  }
}

// === Kelayakan Layangan ===
function calculateKiteSuitability(windSpeed: number): KiteSuitability {
  if (windSpeed < 5) return KiteSuitability.TIDAK_LAYAK;
  if (windSpeed < 15) return KiteSuitability.RINGAN;
  if (windSpeed < 30) return KiteSuitability.SEMUA;
  if (windSpeed < 45) return KiteSuitability.BERAT;
  return KiteSuitability.TIDAK_LAYAK;
}

// === Update Status Cron Internal (DB) ===
async function updateCronJobStatus(command: string, success: boolean) {
  try {
    const job = await prisma.cronJob.findFirst({
      where: {
        OR: [
          { command: { contains: command } },
          { name: { contains: 'Weather' } },
        ],
      },
    });

    if (!job) return;

    const nextRun = new Date();
    nextRun.setHours(nextRun.getHours() + 6); // Set estimasi eksekusi berikutnya (6 jam)

    await prisma.cronJob.update({
      where: { id: job.id },
      data: {
        lastRun: new Date(),
        nextRun,
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