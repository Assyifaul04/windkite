// app/api/admin/storage/files/route.ts
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

    const files = await prisma.storageFile.findMany({
      include: {
        kiteDesign: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error fetching storage files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storage files' },
      { status: 500 }
    );
  }
}