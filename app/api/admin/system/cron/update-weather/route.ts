// app/api/cron/update-weather/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { KiteSuitability } from '@prisma/client'; // Import the enum type

// Vercel Cron Job - GET method
export async function GET() {
  try {
    console.log('[Cron] Updating weather data...');
    
    const locations = await prisma.savedLocation.findMany({
      where: { isPublic: true },
      select: {
        id: true,
        userId: true,
        name: true,
        latitude: true,
        longitude: true,
      },
    });
    
    if (locations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No locations found to update',
        total: 0,
      });
    }
    
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];
    
    for (const location of locations) {
      try {
        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (!apiKey) {
          throw new Error('OPENWEATHER_API_KEY is not set');
        }
        
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${location.latitude}&lon=${location.longitude}&appid=${apiKey}&units=metric`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        await prisma.weatherLog.create({
          data: {
            locationId: location.id,
            userId: location.userId,
            windSpeed: data.wind?.speed || 0,
            windGust: data.wind?.gust || 0,
            windDirection: data.wind?.deg || 0,
            temperature: data.main?.temp || null,
            humidity: data.main?.humidity || null,
            kiteSuitability: calculateSuitability(data.wind?.speed || 0) as KiteSuitability, // Cast to enum type
          },
        });
        
        successCount++;
      } catch (error) {
        failCount++;
        errors.push(`${location.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error(`Error updating ${location.name}:`, error);
      }
    }
    
    // Update cron job stats di database
    await prisma.cronJob.updateMany({
      where: { 
        OR: [
          { command: 'node scripts/update-weather.js' },
          { command: 'npm run update-weather' },
        ]
      },
      data: {
        lastRun: new Date(),
        runs: { increment: 1 },
        successfulRuns: successCount > 0 ? { increment: 1 } : undefined,
        failedRuns: successCount === 0 ? { increment: 1 } : undefined,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: `Weather updated: ${successCount} success, ${failCount} failed`,
      total: locations.length,
      successCount,
      failCount,
      errors: errors.slice(0, 5), // Return first 5 errors
    });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update weather',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function calculateSuitability(windSpeed: number): KiteSuitability {
  if (windSpeed < 5) return KiteSuitability.TIDAK_LAYAK;
  if (windSpeed < 10) return KiteSuitability.RINGAN;
  if (windSpeed < 20) return KiteSuitability.BERAT;
  return KiteSuitability.SEMUA;
}