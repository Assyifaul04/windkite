// app/api/admin/settings/weather-api/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const totalLogs = await prisma.weatherLog.count();

    const lastLog = await prisma.weatherLog.findFirst({
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true },
    });

    // Get total locations from location.json
    let totalLocations = 0;
    try {
      const filePath = path.join(process.cwd(), 'public', 'data', 'location.json');
      // Check if file exists
      if (fs.existsSync(filePath)) {
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(fileContents);
        totalLocations = data.locations?.length || 0;
      } else {
        console.warn('location.json not found at:', filePath);
      }
    } catch (error) {
      console.error('Error loading location.json:', error);
    }

    // If still 0, try to get from database
    if (totalLocations === 0) {
      try {
        const dbLocations = await prisma.savedLocation.count();
        totalLocations = dbLocations;
      } catch (dbError) {
        console.error('Error counting saved locations:', dbError);
      }
    }

    let successRate = 0;
    if (totalLogs > 0) {
      try {
        const successCount = await prisma.weatherLog.count({
          where: {
            kiteSuitability: {
              not: 'TIDAK_LAYAK',
            },
          },
        });
        successRate = (successCount / totalLogs) * 100;
      } catch (error) {
        console.error('Error calculating success rate:', error);
      }
    }

    return NextResponse.json({
      totalLogs,
      lastUpdate: lastLog?.timestamp?.toISOString() || null,
      successRate: Math.round(successRate * 10) / 10,
      totalLocations: totalLocations || 31, // fallback to Jember locations count
    });
  } catch (error) {
    console.error('Error fetching weather stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch stats',
        totalLogs: 0,
        lastUpdate: null,
        successRate: 0,
        totalLocations: 31 // fallback
      },
      { status: 500 }
    );
  }
}