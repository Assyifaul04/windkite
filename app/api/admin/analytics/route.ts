// app/api/admin/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { subDays, subMonths, format } from 'date-fns';

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
    const period = searchParams.get('period') || '30d';
    const days = parseInt(period);
    const startDate = subDays(new Date(), days);

    // Get total counts
    const [
      totalUsers,
      totalAdmins,
      totalLocations,
      publicLocations,
      totalWeatherLogs,
      totalDesigns,
      totalFrames,
      publicFrames,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.savedLocation.count(),
      prisma.savedLocation.count({ where: { isPublic: true } }),
      prisma.weatherLog.count(),
      prisma.kiteDesign.count(),
      prisma.kiteFrame.count(),
      prisma.kiteFrame.count({ where: { isPublic: true } }),
    ]);

    // Get growth data
    const previousPeriodStart = subMonths(new Date(), 1);
    const [currentPeriodUsers, previousPeriodUsers] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: startDate } } }),
      prisma.user.count({
        where: { 
          createdAt: { 
            gte: previousPeriodStart,
            lt: startDate,
          },
        },
      }),
    ]);

    const [currentPeriodLocations, previousPeriodLocations] = await Promise.all([
      prisma.savedLocation.count({ where: { createdAt: { gte: startDate } } }),
      prisma.savedLocation.count({
        where: { 
          createdAt: { 
            gte: previousPeriodStart,
            lt: startDate,
          },
        },
      }),
    ]);

    const [currentPeriodDesigns, previousPeriodDesigns] = await Promise.all([
      prisma.kiteDesign.count({ where: { createdAt: { gte: startDate } } }),
      prisma.kiteDesign.count({
        where: { 
          createdAt: { 
            gte: previousPeriodStart,
            lt: startDate,
          },
        },
      }),
    ]);

    // Calculate growth percentages
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // Get user growth data (daily)
    const userGrowthData = [];
    const daysToShow = Math.min(days, 30);
    for (let i = daysToShow; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const nextDate = subDays(new Date(), i - 1);
      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });
      userGrowthData.push({
        date: format(date, 'dd/MM'),
        users: count,
      });
    }

    // Get activity distribution
    const [locationsCount, weatherCount, designsCount] = await Promise.all([
      prisma.savedLocation.count(),
      prisma.weatherLog.count(),
      prisma.kiteDesign.count(),
    ]);

    const activityDistribution = [
      { name: 'Lokasi', value: locationsCount },
      { name: 'Cuaca', value: weatherCount },
      { name: 'Desain AI', value: designsCount },
    ];

    // Get weather data
    const weatherLogs = await prisma.weatherLog.findMany({
      where: {
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: 'asc' },
      take: 30,
    });

    const weatherChartData = weatherLogs.map((log) => ({
      date: format(log.timestamp, 'dd/MM'),
      windSpeed: Math.round(log.windSpeed),
      temperature: log.temperature ? Math.round(log.temperature) : 0,
    }));

    // Get design status distribution
    const [pending, processing, completed, failed] = await Promise.all([
      prisma.kiteDesign.count({ where: { status: 'PENDING' } }),
      prisma.kiteDesign.count({ where: { status: 'PROCESSING' } }),
      prisma.kiteDesign.count({ where: { status: 'COMPLETED' } }),
      prisma.kiteDesign.count({ where: { status: 'FAILED' } }),
    ]);

    const designStatusDistribution = [
      { name: 'Pending', value: pending },
      { name: 'Processing', value: processing },
      { name: 'Completed', value: completed },
      { name: 'Failed', value: failed },
    ].filter(item => item.value > 0);

    // Get design categories
    const designCategories = [
      { category: 'Kerangka', count: totalFrames },
      { category: 'Sampul', count: totalDesigns },
    ];

    // Get top users
    const topUsers = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            savedLocations: true,
            weatherLogs: true,
            kiteDesigns: true,
          },
        },
      },
      orderBy: {
        savedLocations: {
          _count: 'desc',
        },
      },
    });

    const formattedTopUsers = topUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      locations: user._count.savedLocations,
      weatherLogs: user._count.weatherLogs,
      designs: user._count.kiteDesigns,
    }));

    // Get average wind speed
    const windSpeedAvg = await prisma.weatherLog.aggregate({
      where: { timestamp: { gte: startDate } },
      _avg: { windSpeed: true },
    });

    return NextResponse.json({
      totalUsers,
      totalAdmins,
      totalLocations,
      publicLocations,
      totalWeatherLogs,
      totalDesigns,
      totalFrames,
      publicFrames,
      userGrowth: calculateGrowth(currentPeriodUsers, previousPeriodUsers),
      locationGrowth: calculateGrowth(currentPeriodLocations, previousPeriodLocations),
      designGrowth: calculateGrowth(currentPeriodDesigns, previousPeriodDesigns),
      avgWindSpeed: Math.round(windSpeedAvg._avg.windSpeed || 0),
      userGrowthData,
      activityDistribution,
      weatherData: weatherChartData,
      designCategories,
      designStatusDistribution,
      topUsers: formattedTopUsers,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}