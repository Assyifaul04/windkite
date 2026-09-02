// app/api/admin/system/cron/[id]/run/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simulate running the cron job
    const success = Math.random() > 0.2; // 80% success rate

    return NextResponse.json({
      success,
      message: success ? 'Cron job executed successfully' : 'Cron job execution failed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error running cron job:', error);
    return NextResponse.json(
      { error: 'Failed to run cron job' },
      { status: 500 }
    );
  }
}