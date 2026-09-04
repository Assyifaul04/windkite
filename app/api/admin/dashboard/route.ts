// app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';

// Helper function untuk mengecek apakah value adalah array
// Fixed: Proper type guard for JsonValue
function isArrayOfMarkers(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '7d';
    const days = parseInt(range);
    const startDate = subDays(new Date(), days);

    // Get all users
    const [totalUsers, totalAdmins] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
    ]);

    // Get locations and weather logs
    const [totalLocations, totalWeatherLogs] = await Promise.all([
      prisma.savedLocation.count(),
      prisma.weatherLog.count(),
    ]);

    // Get total designs
    const totalDesigns = await prisma.kiteDesign.count();

    // Get recent users (5 newest)
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });

    // Get recent activities from various tables
    const [recentLocations, recentWeather, recentDesigns, recentFrames] = await Promise.all([
      prisma.savedLocation.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      }),
      prisma.weatherLog.findMany({
        take: 5,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          location: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.kiteDesign.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          frame: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.kiteFrame.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      }),
    ]);

    // Format recent activities
    const recentActivities = [
      ...recentLocations.map((loc) => ({
        id: `loc-${loc.id}`,
        userId: loc.userId,
        userName: loc.user?.name || 'Unknown',
        userImage: loc.user?.image || null,
        action: 'CREATE_LOCATION',
        details: `Membuat lokasi "${loc.name}" (${loc.latitude}, ${loc.longitude})`,
        timestamp: loc.createdAt.toISOString(),
      })),
      ...recentWeather.map((log) => ({
        id: `weather-${log.id}`,
        userId: log.userId || 'system',
        userName: log.user?.name || 'System',
        userImage: log.user?.image || null,
        action: 'CREATE_WEATHER',
        details: `Mencatat cuaca di "${log.location?.name || 'Unknown'}" (${log.windSpeed} km/h, ${log.kiteSuitability})`,
        timestamp: log.timestamp.toISOString(),
      })),
      ...recentDesigns.map((design) => ({
        id: `design-${design.id}`,
        userId: design.userId,
        userName: design.user?.name || 'Unknown',
        userImage: design.user?.image || null,
        action: 'CREATE_DESIGN',
        details: `Membuat desain "${design.title || 'Untitled'}" menggunakan frame "${design.frame?.name || 'Unknown'}"`,
        timestamp: design.createdAt.toISOString(),
      })),
      ...recentFrames.map((frame) => {
        // Safe check untuk markerData
        const markerCount = (() => {
          if (!frame.markerData) return 0;
          // Type guard untuk memastikan markerData adalah array
          // Fixed: Using the fixed isArrayOfMarkers function
          if (isArrayOfMarkers(frame.markerData)) {
            return frame.markerData.length;
          }
          return 0;
        })();

        return {
          id: `frame-${frame.id}`,
          userId: frame.userId,
          userName: frame.user?.name || 'Unknown',
          userImage: frame.user?.image || null,
          action: 'CREATE_FRAME',
          details: `Membuat frame "${frame.name}" dengan ${markerCount} markers`,
          timestamp: frame.createdAt.toISOString(),
        };
      }),
    ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

    // Get weather stats (last 7 days)
    const weatherStats = await prisma.weatherLog.aggregate({
      where: {
        timestamp: {
          gte: startDate,
        },
      },
      _avg: {
        windSpeed: true,
        temperature: true,
      },
      _max: {
        windSpeed: true,
      },
      _min: {
        windSpeed: true,
      },
    });

    // Get wind direction from latest weather log
    const latestWeather = await prisma.weatherLog.findFirst({
      where: {
        timestamp: {
          gte: startDate,
        },
      },
      orderBy: { timestamp: 'desc' },
      select: { windDirection: true },
    });

    // Determine wind direction
    const getWindDirection = (degrees: number | null | undefined) => {
      if (degrees === null || degrees === undefined) return 'N/A';
      const directions = ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut'];
      const index = Math.round(degrees / 45) % 8;
      return directions[index];
    };

    // Get design stats
    const [totalFrames, totalDesignsCount, publicDesigns, privateDesigns] = await Promise.all([
      prisma.kiteFrame.count(),
      prisma.kiteDesign.count(),
      prisma.kiteDesign.count({ where: { isPublic: true } }),
      prisma.kiteDesign.count({ where: { isPublic: false } }),
    ]);

    // Get design status distribution
    const designStatusDistribution = await prisma.$transaction([
      prisma.kiteDesign.count({ where: { status: 'PENDING' } }),
      prisma.kiteDesign.count({ where: { status: 'PROCESSING' } }),
      prisma.kiteDesign.count({ where: { status: 'COMPLETED' } }),
      prisma.kiteDesign.count({ where: { status: 'FAILED' } }),
    ]);

    // Get chart data (daily growth)
    const chartData = [];
    for (let i = days; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const [usersCount, locationsCount, designsCount] = await Promise.all([
        prisma.user.count({
          where: {
            createdAt: {
              lte: dayEnd,
            },
          },
        }),
        prisma.savedLocation.count({
          where: {
            createdAt: {
              lte: dayEnd,
            },
          },
        }),
        prisma.kiteDesign.count({
          where: {
            createdAt: {
              lte: dayEnd,
            },
          },
        }),
      ]);

      chartData.push({
        date: format(date, 'dd/MM'),
        users: usersCount,
        locations: locationsCount,
        designs: designsCount,
      });
    }

    return NextResponse.json({
      totalUsers,
      totalAdmins,
      totalLocations,
      totalWeatherLogs,
      totalDesigns: totalDesignsCount,
      recentUsers,
      recentActivities,
      weatherStats: {
        avgWindSpeed: Math.round(weatherStats._avg.windSpeed || 0),
        maxWindSpeed: Math.round(weatherStats._max.windSpeed || 0),
        minWindSpeed: Math.round(weatherStats._min.windSpeed || 0),
        avgTemperature: Math.round(weatherStats._avg.temperature || 0),
        windDirection: getWindDirection(latestWeather?.windDirection),
      },
      designStats: {
        totalFrames,
        totalCovers: totalDesignsCount,
        publicDesigns,
        privateDesigns,
        pending: designStatusDistribution[0],
        processing: designStatusDistribution[1],
        completed: designStatusDistribution[2],
        failed: designStatusDistribution[3],
      },
      chartData,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: String(error) },
      { status: 500 }
    );
  }
}