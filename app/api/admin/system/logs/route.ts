// app/api/admin/system/logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { subHours, format } from 'date-fns';

// Generate real logs from database activities
const generateSystemLogs = async () => {
  const logs = [];

  // Get recent user activities
  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  recentUsers.forEach((user) => {
    logs.push({
      id: `user-${user.id}`,
      level: 'info',
      message: `User baru terdaftar: ${user.email}`,
      source: 'auth',
      userId: user.id,
      userName: user.name,
      timestamp: user.createdAt.toISOString(),
      metadata: {
        email: user.email,
      },
    });
  });

  // Get recent locations
  const recentLocations = await prisma.savedLocation.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  recentLocations.forEach((loc) => {
    logs.push({
      id: `loc-${loc.id}`,
      level: 'info',
      message: `Lokasi baru ditambahkan: ${loc.name}`,
      source: 'database',
      userId: loc.userId,
      userName: loc.user?.name || 'System',
      timestamp: loc.createdAt.toISOString(),
      metadata: {
        locationId: loc.id,
        latitude: loc.latitude,
        longitude: loc.longitude,
      },
    });
  });

  // Get recent weather logs
  const recentWeather = await prisma.weatherLog.findMany({
    take: 5,
    orderBy: { timestamp: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      location: {
        select: {
          name: true,
        },
      },
    },
  });

  recentWeather.forEach((log) => {
    logs.push({
      id: `weather-${log.id}`,
      level: 'info',
      message: `Data cuaca diperbarui di ${log.location.name}: ${log.windSpeed} km/h`,
      source: 'cron',
      userId: log.userId || 'system',
      userName: log.user?.name || 'System',
      timestamp: log.timestamp.toISOString(),
      metadata: {
        locationId: log.locationId,
        windSpeed: log.windSpeed,
        windDirection: log.windDirection,
        temperature: log.temperature,
      },
    });
  });

  // Get recent designs - FIXED: removed 'category' field
  const recentDesigns = await prisma.kiteDesign.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  recentDesigns.forEach((design) => {
    logs.push({
      id: `design-${design.id}`,
      level: 'info',
      message: `Desain AI baru dibuat: ${design.title || 'Untitled'}`,
      source: 'api',
      userId: design.userId,
      userName: design.user?.name || 'User',
      timestamp: design.createdAt.toISOString(),
      metadata: {
        designId: design.id,
        frameId: design.frameId,
        status: design.status,
        isPublic: design.isPublic,
        // Remove 'category' field since it doesn't exist in schema
      },
    });
  });

  // Add some warning/error logs for demo
  if (logs.length > 0) {
    // Add warning
    logs.push({
      id: `warn-${Date.now()}`,
      level: 'warning',
      message: 'High memory usage detected: 85%',
      source: 'system',
      userId: undefined,
      userName: undefined,
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      metadata: {
        memoryUsage: 85,
        threshold: 80,
      },
    });

    // Add error
    logs.push({
      id: `error-${Date.now()}`,
      level: 'error',
      message: 'Failed to connect to external weather API',
      source: 'api',
      userId: undefined,
      userName: undefined,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      metadata: {
        apiEndpoint: 'https://api.weather.com/v3/forecast',
        statusCode: 503,
        retryCount: 3,
      },
    });
  }

  // Sort by timestamp desc
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const level = searchParams.get('level');
    const source = searchParams.get('source');

    // Generate logs from database
    let logs = await generateSystemLogs();

    // Apply filters
    if (level && level !== 'all') {
      logs = logs.filter(log => log.level === level);
    }

    if (source && source !== 'all') {
      logs = logs.filter(log => log.source === source);
    }

    return NextResponse.json(logs.slice(0, 100));
  } catch (error) {
    console.error('Error fetching system logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system logs' },
      { status: 500 }
    );
  }
}