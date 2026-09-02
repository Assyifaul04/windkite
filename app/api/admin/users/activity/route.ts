// app/api/admin/users/activity/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    // Dapatkan aktivitas dari semua tabel
    const [locations, weatherLogs, kiteDesigns] = await Promise.all([
      prisma.savedLocation.findMany({
        take: 100,
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
        take: 100,
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
        take: 100,
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

    // Format activity logs
    const activities = [
      ...locations.map((loc) => ({
        id: loc.id,
        userId: loc.userId,
        userName: loc.user?.name || null,
        userImage: loc.user?.image || null,
        action: 'CREATE_LOCATION',
        details: `Membuat lokasi "${loc.name}"`,
        timestamp: loc.createdAt.toISOString(),
      })),
      ...weatherLogs.map((log) => ({
        id: log.id,
        userId: log.userId || 'system',
        userName: log.user?.name || 'System',
        userImage: log.user?.image || null,
        action: 'CREATE_WEATHER',
        details: `Mencatat cuaca di "${log.location.name}" (${log.windSpeed} km/h)`,
        timestamp: log.timestamp.toISOString(),
      })),
      ...kiteDesigns.map((design) => ({
        id: design.id,
        userId: design.userId,
        userName: design.user?.name || null,
        userImage: design.user?.image || null,
        action: 'CREATE_DESIGN',
        details: `Membuat desain AI "${design.category}" dengan prompt: ${design.prompt.slice(0, 50)}...`,
        timestamp: design.createdAt.toISOString(),
      })),
    ];

    // Filter by action if provided
    const filteredActivities = action && action !== 'all'
      ? activities.filter((a) => a.action === action)
      : activities;

    // Sort by timestamp desc and limit to 50
    const sortedActivities = filteredActivities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50);

    return NextResponse.json(sortedActivities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}