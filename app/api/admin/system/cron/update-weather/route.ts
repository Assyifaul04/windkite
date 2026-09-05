// app/api/cron/update-weather/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addHours } from 'date-fns';
import { KiteSuitability } from '@prisma/client';

// Secret untuk keamanan
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key';

export async function GET(req: Request) {
  try {
    // Verifikasi authorization - menerima Bearer token
    const authHeader = req.headers.get('authorization');
    const isVercelCron = req.headers.get('x-vercel-cron') === 'true';
    
    // Allow either Bearer token OR Vercel cron header
    if (!isVercelCron && authHeader !== `Bearer ${CRON_SECRET}`) {
      console.log('⚠️ Unauthorized access attempt to /api/cron/update-weather');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting weather update cron job...');

    // 1. Ambil settings weather API dari database
    const weatherSettings = await prisma.weatherSettings.findFirst();
    
    if (!weatherSettings || !weatherSettings.apiKey) {
      console.error('❌ Weather API Key not configured in database');
      return NextResponse.json(
        { 
          error: 'Weather API Key not configured', 
          message: 'Silakan konfigurasi API Key di Settings → Weather API' 
        },
        { status: 400 }
      );
    }

    const API_KEY = weatherSettings.apiKey;
    const provider = weatherSettings.provider || 'openweather';
    const defaultLocation = weatherSettings.defaultLocation || 'Jakarta';

    console.log(`📡 Using provider: ${provider} with default location: ${defaultLocation}`);

    // 2. Get all saved locations
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
      
      // Try to fetch weather for default location if no locations exist
      try {
        const defaultWeather = await fetchWeatherData(
          0, 0, // will use default location name
          API_KEY,
          provider,
          defaultLocation
        );
        
        // Create a default location if none exists
        const defaultLoc = await prisma.savedLocation.create({
          data: {
            name: defaultLocation,
            latitude: -6.2088, // Jakarta
            longitude: 106.8456,
            isPublic: true,
            userId: 'system',
          },
        });
        
        // Save weather data
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
        
        console.log(`✅ Created default location ${defaultLocation} with weather data`);
        return NextResponse.json({
          success: true,
          message: `Created default location ${defaultLocation} with weather data`,
          updatedCount: 1,
          errorCount: 0,
        });
      } catch (error) {
        console.log('⚠️ No locations to update and failed to create default');
        return NextResponse.json({
          success: true,
          message: 'No locations to update',
          updatedCount: 0,
          errorCount: 0,
        });
      }
    }

    let updatedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // 3. Update weather for each location
    for (const location of locations) {
      try {
        console.log(`🌤️ Fetching weather for: ${location.name} (${location.latitude}, ${location.longitude})`);
        
        const weatherData = await fetchWeatherData(
          location.latitude,
          location.longitude,
          API_KEY,
          provider
        );
        
        // Save to database
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
        console.log(`✅ Updated weather for ${location.name} (Wind: ${weatherData.windSpeed.toFixed(1)} km/h)`);
      } catch (error) {
        errorCount++;
        const errorMsg = `Failed to update ${location.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    // 4. Update cron job status in database
    await updateCronJobStatus('update-weather', errorCount === 0, updatedCount);

    console.log(`✅ Weather update completed: ${updatedCount} updated, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} locations, ${errorCount} errors`,
      updatedCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Cron job failed:', error);
    
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

async function fetchWeatherData(
  lat: number,
  lng: number,
  apiKey: string,
  provider: string = 'openweather',
  locationName?: string
) {
  let url = '';
  let data: any;

  // If location name is provided and coordinates are default (0,0), use name-based query
  const useNameQuery = locationName && lat === 0 && lng === 0;

  switch (provider) {
    case 'openweather':
      if (useNameQuery) {
        url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(locationName)}&appid=${apiKey}&units=metric`;
      } else {
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
      }
      break;
    case 'weatherbit':
      if (useNameQuery) {
        url = `https://api.weatherbit.io/v2.0/current?city=${encodeURIComponent(locationName)}&key=${apiKey}`;
      } else {
        url = `https://api.weatherbit.io/v2.0/current?lat=${lat}&lon=${lng}&key=${apiKey}`;
      }
      break;
    case 'tomorrow':
      if (useNameQuery) {
        // Tomorrow.io requires coordinates, not name
        url = `https://api.tomorrow.io/v4/timelines?location=-6.2088,106.8456&apikey=${apiKey}`; // Default to Jakarta
      } else {
        url = `https://api.tomorrow.io/v4/timelines?location=${lat},${lng}&apikey=${apiKey}`;
      }
      break;
    default:
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
  }

  console.log(`🌐 Fetching from: ${provider} (${useNameQuery ? 'name: ' + locationName : 'coords: ' + lat + ', ' + lng})`);

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ API Error (${response.status}):`, errorText.substring(0, 200));
    
    // Handle specific error codes
    if (response.status === 401) {
      throw new Error('Invalid API Key. Please check your API Key in Settings → Weather API');
    }
    if (response.status === 404) {
      throw new Error('Location not found. Please check the location name or coordinates');
    }
    if (response.status === 429) {
      throw new Error('API rate limit exceeded. Please try again later');
    }
    
    throw new Error(`HTTP error! status: ${response.status} - ${errorText.substring(0, 100)}`);
  }

  data = await response.json();

  // Parse berdasarkan provider
  switch (provider) {
    case 'openweather':
      if (!data.main || !data.wind) {
        console.error('❌ Invalid OpenWeatherMap response:', JSON.stringify(data).substring(0, 200));
        throw new Error('Invalid response from OpenWeatherMap');
      }
      return {
        windSpeed: data.wind.speed * 3.6, // Convert m/s to km/h
        windGust: data.wind.gust ? data.wind.gust * 3.6 : data.wind.speed * 3.6 * 1.3,
        windDirection: data.wind.deg || 0,
        temperature: data.main.temp,
        humidity: data.main.humidity,
      };
    
    case 'weatherbit':
      if (!data.data || data.data.length === 0) {
        throw new Error('Invalid response from WeatherBit');
      }
      const wbData = data.data[0];
      return {
        windSpeed: wbData.wind_spd * 3.6,
        windGust: wbData.wind_gust_spd ? wbData.wind_gust_spd * 3.6 : wbData.wind_spd * 3.6 * 1.3,
        windDirection: wbData.wind_dir || 0,
        temperature: wbData.temp,
        humidity: wbData.rh,
      };
    
    case 'tomorrow':
      if (!data.data || !data.data.timelines || data.data.timelines.length === 0) {
        throw new Error('Invalid response from Tomorrow.io');
      }
      const intervals = data.data.timelines[0].intervals;
      if (!intervals || intervals.length === 0) {
        throw new Error('No weather data available');
      }
      const values = intervals[0].values;
      return {
        windSpeed: values.windSpeed || 0,
        windGust: values.windGust || values.windSpeed * 1.3 || 0,
        windDirection: values.windDirection || 0,
        temperature: values.temperature || 0,
        humidity: values.humidity || 0,
      };
    
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

function calculateKiteSuitability(windSpeed: number): KiteSuitability {
  if (windSpeed < 5) return KiteSuitability.TIDAK_LAYAK;
  if (windSpeed < 15) return KiteSuitability.RINGAN;
  if (windSpeed < 30) return KiteSuitability.SEMUA;
  if (windSpeed < 45) return KiteSuitability.BERAT;
  return KiteSuitability.TIDAK_LAYAK;
}

async function updateCronJobStatus(jobId: string, success: boolean, runs: number) {
  try {
    // Find the cron job by command or name
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

    await prisma.cronJob.update({
      where: { id: existingJob.id },
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