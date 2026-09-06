// app/api/admin/weather-logs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Cek apakah data ada
    const existingLog = await prisma.weatherLog.findUnique({
      where: { id },
    });

    if (!existingLog) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }

    // Hapus data
    await prisma.weatherLog.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Weather log deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting weather log:', error);
    return NextResponse.json(
      { error: 'Failed to delete weather log' },
      { status: 500 }
    );
  }
}