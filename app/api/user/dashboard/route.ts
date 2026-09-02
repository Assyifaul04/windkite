// app/api/user/dashboard/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Cek autentikasi
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Fetch data user untuk dashboard
    const [locations, weatherLogs, designs] = await Promise.all([
      // Lokasi user
      prisma.savedLocation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          weatherLogs: {
            take: 1,
            orderBy: { timestamp: 'desc' },
          },
        },
      }),
      
      // Weather logs user (dengan location data)
      prisma.weatherLog.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        include: {
          location: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: 10,
      }),
      
      // Kite designs user
      prisma.kiteDesign.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // Format response
    return NextResponse.json({
      stats: {
        totalLocations: locations.length,
        totalWeatherLogs: weatherLogs.length,
        totalDesigns: designs.length,
      },
      locations: locations.map(loc => ({
        id: loc.id,
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
        isPublic: loc.isPublic,
        createdAt: loc.createdAt,
        weatherLogs: loc.weatherLogs,
      })),
      weatherLogs: weatherLogs.map(log => ({
        id: log.id,
        windSpeed: log.windSpeed,
        windGust: log.windGust,
        windDirection: log.windDirection,
        temperature: log.temperature,
        humidity: log.humidity,
        kiteSuitability: log.kiteSuitability,
        timestamp: log.timestamp,
        location: log.location,
      })),
      designs: designs.map(design => ({
        id: design.id,
        prompt: design.prompt,
        imageUrl: design.imageUrl,
        category: design.category,
        isPublic: design.isPublic,
        createdAt: design.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}