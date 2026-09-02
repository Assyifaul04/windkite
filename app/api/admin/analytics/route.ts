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
    const [totalUsers, totalLocations, totalWeatherLogs, totalDesigns] = await Promise.all([
      prisma.user.count(),
      prisma.savedLocation.count(),
      prisma.weatherLog.count(),
      prisma.kiteDesign.count(),
    ]);

    // Get growth data
    const previousPeriodStart = subMonths(new Date(), 1);
    const [currentPeriodUsers, previousPeriodUsers] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: startDate } },
      }),
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
      prisma.savedLocation.count({
        where: { createdAt: { gte: startDate } },
      }),
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
      prisma.kiteDesign.count({
        where: { createdAt: { gte: startDate } },
      }),
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
    for (let i = 0; i <= Math.min(days, 30); i++) {
      const date = subDays(new Date(), i);
      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: date,
            lt: subDays(date, -1),
          },
        },
      });
      userGrowthData.push({
        date: format(date, 'dd/MM'),
        users: count,
      });
    }
    userGrowthData.reverse();

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
    const weatherData = await prisma.weatherLog.findMany({
      where: {
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: 'asc' },
      take: 30,
    });

    const weatherChartData = weatherData.map((log) => ({
      date: format(log.timestamp, 'dd/MM'),
      windSpeed: log.windSpeed,
      temperature: log.temperature || 0,
    }));

    // Get design categories
    const designCategories = [
      { category: 'Kerangka', count: await prisma.kiteDesign.count({ where: { category: 'KERANGKA' } }) },
      { category: 'Sampul', count: await prisma.kiteDesign.count({ where: { category: 'SAMPUL' } }) },
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
      totalLocations,
      totalWeatherLogs,
      totalDesigns,
      userGrowth: calculateGrowth(currentPeriodUsers, previousPeriodUsers),
      locationGrowth: calculateGrowth(currentPeriodLocations, previousPeriodLocations),
      designGrowth: calculateGrowth(currentPeriodDesigns, previousPeriodDesigns),
      avgWindSpeed: Math.round(windSpeedAvg._avg.windSpeed || 0),
      userGrowthData,
      activityDistribution,
      weatherData: weatherChartData,
      designCategories,
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