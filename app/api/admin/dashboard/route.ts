// app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { subDays, format } from 'date-fns';

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
    const [users, admins, locations, weatherLogs, designs] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.savedLocation.count(),
      prisma.weatherLog.count(),
      prisma.kiteDesign.count(),
    ]);

    // Get recent users
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

    // Get recent activities (combined from all tables)
    const [recentLocations, recentWeather, recentDesigns] = await Promise.all([
      prisma.savedLocation.findMany({
        take: 10,
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
        take: 10,
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
        take: 10,
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
        id: loc.id,
        userId: loc.userId,
        userName: loc.user?.name || null,
        userImage: loc.user?.image || null,
        action: 'CREATE_LOCATION',
        details: `Membuat lokasi "${loc.name}"`,
        timestamp: loc.createdAt.toISOString(),
      })),
      ...recentWeather.map((log) => ({
        id: log.id,
        userId: log.userId || 'system',
        userName: log.user?.name || 'System',
        userImage: log.user?.image || null,
        action: 'CREATE_WEATHER',
        details: `Mencatat cuaca di "${log.location.name}" (${log.windSpeed} km/h)`,
        timestamp: log.timestamp.toISOString(),
      })),
      ...recentDesigns.map((design) => ({
        id: design.id,
        userId: design.userId,
        userName: design.user?.name || null,
        userImage: design.user?.image || null,
        action: 'CREATE_DESIGN',
        details: `Membuat desain AI "${design.category}"`,
        timestamp: design.createdAt.toISOString(),
      })),
    ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

    // Get weather stats
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

    // Get design stats
    const designStats = await prisma.kiteDesign.aggregate({
      _count: {
        category: true,
      },
    });

    const [frames, covers, publicDesigns, privateDesigns] = await Promise.all([
      prisma.kiteDesign.count({ where: { category: 'KERANGKA' } }),
      prisma.kiteDesign.count({ where: { category: 'SAMPUL' } }),
      prisma.kiteDesign.count({ where: { isPublic: true } }),
      prisma.kiteDesign.count({ where: { isPublic: false } }),
    ]);

    // Get chart data (daily growth)
    const chartData = [];
    for (let i = 0; i <= days; i++) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const nextDate = subDays(new Date(), i - 1);
      
      const [usersCount, locationsCount, designsCount] = await Promise.all([
        prisma.user.count({
          where: {
            createdAt: {
              lte: date,
            },
          },
        }),
        prisma.savedLocation.count({
          where: {
            createdAt: {
              lte: date,
            },
          },
        }),
        prisma.kiteDesign.count({
          where: {
            createdAt: {
              lte: date,
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

    chartData.reverse();

    // Get wind direction
    const windDirectionData = await prisma.weatherLog.findFirst({
      where: {
        timestamp: {
          gte: startDate,
        },
      },
      orderBy: { timestamp: 'desc' },
      select: { windDirection: true },
    });

    const directions = ['Utara', 'Timur', 'Selatan', 'Barat'];
    const windDirection = windDirectionData?.windDirection !== undefined
      ? directions[Math.round(windDirectionData.windDirection / 90) % 4]
      : 'N/A';

    return NextResponse.json({
      totalUsers: users,
      totalAdmins: admins,
      totalLocations: locations,
      totalWeatherLogs: weatherLogs,
      totalDesigns: designs,
      recentUsers,
      recentActivities,
      weatherStats: {
        avgWindSpeed: Math.round(weatherStats._avg.windSpeed || 0),
        maxWindSpeed: Math.round(weatherStats._max.windSpeed || 0),
        minWindSpeed: Math.round(weatherStats._min.windSpeed || 0),
        avgTemperature: Math.round(weatherStats._avg.temperature || 0),
        windDirection,
      },
      designStats: {
        totalFrames: frames,
        totalCovers: covers,
        publicDesigns,
        privateDesigns,
      },
      chartData,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}