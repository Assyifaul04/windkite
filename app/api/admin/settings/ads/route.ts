// app/api/admin/settings/ads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Ambil SEMUA pengaturan iklan (List)
export async function GET() {
  try {
    const settings = await prisma.adSettings.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching ad settings:', error);
    return NextResponse.json({ error: 'Failed to fetch ad settings' }, { status: 500 });
  }
}

// POST - Tambah iklan baru
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const settings = await prisma.adSettings.create({
      data: {
        provider: body.provider || 'google_adsense',
        scriptUrl: body.scriptUrl || '',
        clientId: body.clientId || '',
        adSlot: body.adSlot || '',
        isActive: body.isActive !== undefined ? body.isActive : true,
        position: body.position || 'global',
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: settings,
      message: 'Ad settings added successfully'
    });
  } catch (error) {
    console.error('Error saving ad settings:', error);
    return NextResponse.json({ error: 'Failed to save ad settings' }, { status: 500 });
  }
}

// PATCH - Update status aktif/nonaktif atau update data
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, ...updateData } = await req.json();

    const settings = await prisma.adSettings.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ 
      success: true, 
      data: settings,
      message: 'Ad settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating ad settings:', error);
    return NextResponse.json({ error: 'Failed to update ad settings' }, { status: 500 });
  }
}

// DELETE - Hapus iklan
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await req.json();

    await prisma.adSettings.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Ad settings deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ad settings:', error);
    return NextResponse.json({ error: 'Failed to delete ad settings' }, { status: 500 });
  }
}