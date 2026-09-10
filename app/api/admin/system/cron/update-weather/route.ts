// app/api/cron/update-weather/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateNextRun } from '@/lib/cron-utils';
import { KiteSuitability } from '@prisma/client';

const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const isVercelCron = req.headers.get('x-vercel-cron') === 'true';

    if (!isVercelCron && authHeader !== `Bearer ${CRON_SECRET}`) {
      console.log('⚠️ Unauthorized access attempt to /api/cron/update-weather');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting weather update cron job...');

    const weatherSettings = await prisma.weatherSettings.findFirst();

    if (!weatherSettings || !weatherSettings.apiKey) {
      console.error('❌ Weather API Key not configured in database');
      return NextResponse.json(
        {
          error: 'Weather API Key not configured',
          message: 'Silakan konfigurasi API Key di Settings → Weather API',
        },
        { status: 400 }
      );
    }

    const API_KEY = weatherSettings.apiKey;
    const provider = weatherSettings.provider || 'openweather';
    const defaultLocation = weatherSettings.defaultLocation || 'Jakarta';

    console.log(`📡 Using provider: ${provider} with default location: ${defaultLocation}`);

    // === Ambil semua lokasi ===
    let locations = await prisma.savedLocation.findMany({
      select: { id: true, name: true, latitude: true, longitude: true },
    });

    // === Kalau tidak ada lokasi, buat default ===
    if (locations.length === 0) {
      console.log('⚠️ No locations found, creating default location...');
      try {
        const defaultWeather = await fetchWeatherData(0, 0, API_KEY, provider, defaultLocation);
        const defaultLoc = await prisma.savedLocation.create({
          data: {
            name: defaultLocation,
            latitude: -6.2088,
            longitude: 106.8456,
            isPublic: true,
            userId: 'system',
          },
        });

        await prisma.weatherLog.create({
          data: {
            locationId: defaultLoc.id,
            windSpeed: defaultWeather.windSpeed,
            windGust: defaultWeather.windGust,
            windDirection: defaultWeather.windDirection,
            temperature: defaultWeather.temperature,
            humidity: defaultWeather.humidity,
            kiteSuitability: calculateKiteSuitability(defaultWeather.windSpeed),
            userId: null,
          },
        });

        locations = [{
          id: defaultLoc.id,
          name: defaultLoc.name,
          latitude: defaultLoc.latitude,
          longitude: defaultLoc.longitude,
        }];

        console.log(`✅ Created default location ${defaultLocation}`);
      } catch (error) {
        console.log('⚠️ Failed to create default location:', error);
        return NextResponse.json({
          success: true,
          message: 'No locations to update',
          updatedCount: 0,
          errorCount: 0,
          forecastCount: 0,
        });
      }
    }

    let updatedCount = 0;
    let errorCount = 0;
    let forecastCount = 0;
    const errors: string[] = [];

    // === Update weather + forecast untuk setiap lokasi ===
    for (const location of locations) {
      try {
        console.log(`🌤️ Fetching weather for: ${location.name} (${location.latitude}, ${location.longitude})`);

        // 1. Current weather
        const weatherData = await fetchWeatherData(
          location.latitude,
          location.longitude,
          API_KEY,
          provider
        );

        await prisma.weatherLog.create({
          data: {
            locationId: location.id,
            windSpeed: Math.round(weatherData.windSpeed * 10) / 10,
            windGust: Math.round((weatherData.windGust || weatherData.windSpeed * 1.3) * 10) / 10,
            windDirection: Math.round(weatherData.windDirection),
            temperature: weatherData.temperature !== undefined ? Math.round(weatherData.temperature * 10) / 10 : null,
            humidity: weatherData.humidity !== undefined ? Math.round(weatherData.humidity) : null,
            kiteSuitability: calculateKiteSuitability(weatherData.windSpeed),
            userId: null,
          },
        });

        updatedCount++;
        console.log(`✅ Updated current weather for ${location.name} (Wind: ${weatherData.windSpeed.toFixed(1)} km/h)`);

        // 2. Forecast (48 jam ke depan, interval 3 jam)
        try {
          const forecastEntries = await fetchForecastData(
            location.latitude,
            location.longitude,
            API_KEY,
            provider
          );

          for (const entry of forecastEntries) {
            await prisma.weatherForecast.upsert({
              where: {
                locationId_timestamp: {
                  locationId: location.id,
                  timestamp: entry.timestamp,
                },
              },
              update: {
                temperature: entry.temperature,
                humidity: entry.humidity,
                windSpeed: entry.windSpeed,
                windGust: entry.windGust,
                windDirection: entry.windDirection,
                kiteSuitability: calculateKiteSuitability(entry.windSpeed),
                forecastHour: entry.forecastHour,
                isDaytime: entry.isDaytime,
                weatherCode: entry.weatherCode,
                weatherDesc: entry.weatherDesc,
              },
              create: {
                locationId: location.id,
                timestamp: entry.timestamp,
                temperature: entry.temperature,
                humidity: entry.humidity,
                windSpeed: entry.windSpeed,
                windGust: entry.windGust,
                windDirection: entry.windDirection,
                kiteSuitability: calculateKiteSuitability(entry.windSpeed),
                forecastHour: entry.forecastHour,
                isDaytime: entry.isDaytime,
                weatherCode: entry.weatherCode,
                weatherDesc: entry.weatherDesc,
              },
            });
            forecastCount++;
          }

          console.log(`✅ Updated ${forecastEntries.length} forecast entries for ${location.name}`);
        } catch (forecastError) {
          console.error(`⚠️ Forecast failed for ${location.name}:`, forecastError);
          // Tidak fatal — current weather tetap tersimpan
        }
      } catch (error) {
        errorCount++;
        const errorMsg = `Failed to update ${location.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    // === Update status cron job ===
    await updateCronJobStatus('update-weather', errorCount === 0);

    console.log(`✅ Weather update completed: ${updatedCount} updated, ${errorCount} errors, ${forecastCount} forecast`);

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} locations, ${errorCount} errors, ${forecastCount} forecast entries`,
      updatedCount,
      errorCount,
      forecastCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Cron job failed:', error);

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

// ==========================================
// Fetch current weather
// ==========================================
async function fetchWeatherData(
  lat: number,
  lng: number,
  apiKey: string,
  provider: string = 'openweather',
  locationName?: string
) {
  let url = '';
  const useNameQuery = locationName && lat === 0 && lng === 0;

  switch (provider) {
    case 'openweather':
      url = useNameQuery
        ? `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(locationName!)}&appid=${apiKey}&units=metric`
        : `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
      break;
    case 'weatherbit':
      url = useNameQuery
        ? `https://api.weatherbit.io/v2.0/current?city=${encodeURIComponent(locationName!)}&key=${apiKey}`
        : `https://api.weatherbit.io/v2.0/current?lat=${lat}&lon=${lng}&key=${apiKey}`;
      break;
    case 'tomorrow':
      url = useNameQuery
        ? `https://api.tomorrow.io/v4/timelines?location=-6.2088,106.8456&apikey=${apiKey}`
        : `https://api.tomorrow.io/v4/timelines?location=${lat},${lng}&apikey=${apiKey}`;
      break;
    default:
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
  }

  console.log(`🌐 Fetching current from: ${provider} (${useNameQuery ? 'name: ' + locationName : 'coords: ' + lat + ', ' + lng})`);

  const response = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ API Error (${response.status}):`, errorText.substring(0, 200));
    if (response.status === 401) throw new Error('Invalid API Key. Please check your API Key in Settings → Weather API');
    if (response.status === 404) throw new Error('Location not found. Please check the location name or coordinates');
    if (response.status === 429) throw new Error('API rate limit exceeded. Please try again later');
    throw new Error(`HTTP error! status: ${response.status} - ${errorText.substring(0, 100)}`);
  }

  const data = await response.json();

  switch (provider) {
    case 'openweather':
      if (!data.main || !data.wind) throw new Error('Invalid response from OpenWeatherMap');
      return {
        windSpeed: data.wind.speed * 3.6,
        windGust: data.wind.gust ? data.wind.gust * 3.6 : data.wind.speed * 3.6 * 1.3,
        windDirection: data.wind.deg || 0,
        temperature: data.main.temp,
        humidity: data.main.humidity,
      };
    case 'weatherbit': {
      if (!data.data || data.data.length === 0) throw new Error('Invalid response from WeatherBit');
      const wbData = data.data[0];
      return {
        windSpeed: wbData.wind_spd * 3.6,
        windGust: wbData.wind_gust_spd ? wbData.wind_gust_spd * 3.6 : wbData.wind_spd * 3.6 * 1.3,
        windDirection: wbData.wind_dir || 0,
        temperature: wbData.temp,
        humidity: wbData.rh,
      };
    }
    case 'tomorrow': {
      if (!data.data?.timelines?.[0]?.intervals?.[0]) throw new Error('Invalid response from Tomorrow.io');
      const values = data.data.timelines[0].intervals[0].values;
      return {
        windSpeed: values.windSpeed || 0,
        windGust: values.windGust || values.windSpeed * 1.3 || 0,
        windDirection: values.windDirection || 0,
        temperature: values.temperature || 0,
        humidity: values.humidity || 0,
      };
    }
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// ==========================================
// Fetch forecast (48 jam ke depan, interval 3 jam)
// ==========================================
interface ForecastEntry {
  timestamp: Date;
  temperature: number | null;
  humidity: number | null;
  windSpeed: number;
  windGust: number;
  windDirection: number;
  forecastHour: number;
  isDaytime: boolean;
  weatherCode: number | null;
  weatherDesc: string | null;
}

async function fetchForecastData(
  lat: number,
  lng: number,
  apiKey: string,
  provider: string = 'openweather'
): Promise<ForecastEntry[]> {
  let url = '';

  switch (provider) {
    case 'openweather':
      url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&cnt=16`;
      break;
    case 'weatherbit':
      url = `https://api.weatherbit.io/v2.0/forecast/hourly?lat=${lat}&lon=${lng}&key=${apiKey}&hours=48`;
      break;
    case 'tomorrow':
      url = `https://api.tomorrow.io/v4/timelines?location=${lat},${lng}&fields=temperature,humidity,windSpeed,windGust,windDirection,weatherCode&timesteps=1h&units=metric&apikey=${apiKey}`;
      break;
    default:
      url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&cnt=16`;
  }

  console.log(`🌐 Fetching forecast from: ${provider} (coords: ${lat}, ${lng})`);

  const response = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Forecast API error! status: ${response.status} - ${errorText.substring(0, 100)}`);
  }

  const data = await response.json();
  const entries: ForecastEntry[] = [];
  const now = new Date();
  now.setMinutes(0, 0, 0);

  switch (provider) {
    case 'openweather': {
      // OpenWeather 5-day/3-hour forecast
      if (!data.list || !Array.isArray(data.list)) {
        throw new Error('Invalid forecast response from OpenWeatherMap');
      }
      for (const item of data.list) {
        const ts = new Date(item.dt * 1000);
        if (ts < now) continue;
        const hour = ts.getHours();
        entries.push({
          timestamp: ts,
          temperature: item.main?.temp ?? null,
          humidity: item.main?.humidity ?? null,
          windSpeed: (item.wind?.speed || 0) * 3.6,
          windGust: (item.wind?.gust || item.wind?.speed || 0) * 3.6 * 1.3,
          windDirection: item.wind?.deg || 0,
          forecastHour: Math.round((ts.getTime() - now.getTime()) / (1000 * 60 * 60)),
          isDaytime: hour >= 5 && hour < 18,
          weatherCode: item.weather?.[0]?.id ?? null,
          weatherDesc: item.weather?.[0]?.description ?? null,
        });
      }
      break;
    }
    case 'weatherbit': {
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid forecast response from WeatherBit');
      }
      for (const item of data.data) {
        const ts = new Date(item.timestamp * 1000 || item.ts * 1000);
        if (ts < now) continue;
        const hour = ts.getHours();
        entries.push({
          timestamp: ts,
          temperature: item.temp ?? null,
          humidity: item.rh ?? null,
          windSpeed: (item.wind_spd || 0) * 3.6,
          windGust: (item.wind_gust_spd || item.wind_spd || 0) * 3.6 * 1.3,
          windDirection: item.wind_dir || 0,
          forecastHour: Math.round((ts.getTime() - now.getTime()) / (1000 * 60 * 60)),
          isDaytime: hour >= 5 && hour < 18,
          weatherCode: item.weather?.code ?? null,
          weatherDesc: item.weather?.description ?? null,
        });
      }
      break;
    }
    case 'tomorrow': {
      const intervals = data.data?.timelines?.[0]?.intervals;
      if (!intervals || !Array.isArray(intervals)) {
        throw new Error('Invalid forecast response from Tomorrow.io');
      }
      for (const item of intervals) {
        const ts = new Date(item.startTime);
        if (ts < now) continue;
        const hour = ts.getHours();
        const v = item.values || {};
        entries.push({
          timestamp: ts,
          temperature: v.temperature ?? null,
          humidity: v.humidity ?? null,
          windSpeed: v.windSpeed ?? 0,
          windGust: v.windGust ?? (v.windSpeed ?? 0) * 1.3,
          windDirection: v.windDirection ?? 0,
          forecastHour: Math.round((ts.getTime() - now.getTime()) / (1000 * 60 * 60)),
          isDaytime: hour >= 5 && hour < 18,
          weatherCode: v.weatherCode ?? null,
          weatherDesc: null,
        });
      }
      break;
    }
    default:
      throw new Error(`Unsupported provider for forecast: ${provider}`);
  }

  return entries;
}

// ==========================================
// Kite suitability
// ==========================================
function calculateKiteSuitability(windSpeed: number): KiteSuitability {
  if (windSpeed < 5) return KiteSuitability.TIDAK_LAYAK;
  if (windSpeed < 15) return KiteSuitability.RINGAN;
  if (windSpeed < 30) return KiteSuitability.SEMUA;
  if (windSpeed < 45) return KiteSuitability.BERAT;
  return KiteSuitability.TIDAK_LAYAK;
}

// ==========================================
// Update cron job status (FIXED — pakai calculateNextRun)
// ==========================================
async function updateCronJobStatus(jobId: string, success: boolean) {
  try {
    const existingJob = await prisma.cronJob.findFirst({
      where: {
        OR: [
          { id: jobId },
          { command: { contains: 'update-weather' } },
          { name: { contains: 'Weather Update' } },
        ],
      },
    });

    if (!existingJob) {
      console.log(`⚠️ Cron job not found, skipping status update`);
      return;
    }

    // PENTING: hitung nextRun dari schedule job yang tersimpan
    const nextRun = calculateNextRun(existingJob.schedule);

    await prisma.cronJob.update({
      where: { id: existingJob.id },
      data: {
        lastRun: new Date(),
        nextRun,
        runs: { increment: 1 },
        successfulRuns: success ? { increment: 1 } : undefined,
        failedRuns: !success ? { increment: 1 } : undefined,
        status: success ? 'active' : 'failed',
      },
    });

    console.log(`✅ Cron job status updated. Next run: ${nextRun.toISOString()}`);
  } catch (error) {
    console.error('Failed to update cron job status:', error);
  }
}