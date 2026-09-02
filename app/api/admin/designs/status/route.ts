// app/api/admin/designs/status/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [pending, processing, completed, failed, total] = await Promise.all([
      prisma.kiteDesign.count({ where: { status: 'PENDING' } }),
      prisma.kiteDesign.count({ where: { status: 'PROCESSING' } }),
      prisma.kiteDesign.count({ where: { status: 'COMPLETED' } }),
      prisma.kiteDesign.count({ where: { status: 'FAILED' } }),
      prisma.kiteDesign.count(),
    ]);

    return NextResponse.json({
      PENDING: pending,
      PROCESSING: processing,
      COMPLETED: completed,
      FAILED: failed,
      total,
    });
  } catch (error) {
    console.error('Error fetching status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}