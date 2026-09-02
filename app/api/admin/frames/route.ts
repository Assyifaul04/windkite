// app/api/admin/frames/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadToSupabase } from '@/lib/supabase-storage';
import { randomUUID } from 'crypto';

// POST - Create new frame
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';

    // Handle file upload (multipart/form-data)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const name = formData.get('name') as string || 'Untitled Frame';
      const description = formData.get('description') as string || '';
      const isPublic = formData.get('isPublic') === 'true';

      if (!file) {
        return NextResponse.json(
          { error: 'File is required' },
          { status: 400 }
        );
      }

      // Validate file
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Only image files are allowed' },
          { status: 400 }
        );
      }

      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File size must be less than 10MB' },
          { status: 400 }
        );
      }

      // Upload to Supabase Storage
      const ext = file.name.split('.').pop();
      const fileName = `${randomUUID()}.${ext}`;
      const path = `frames/${fileName}`;

      const uploadResult = await uploadToSupabase(file, path);

      // Create frame in database
      const frame = await prisma.kiteFrame.create({
        data: {
          name,
          description: description || null,
          imageUrl: uploadResult.url,
          thumbnailUrl: uploadResult.url,
          canvasWidth: 800,
          canvasHeight: 600,
          isPublic: isPublic || false,
          markerData: [],
          clipPathSvg: null,
          userId: session.user.id,
        },
      });

      return NextResponse.json(frame, { status: 201 });
    }

    // Handle JSON data
    const body = await request.json();
    const {
      name,
      description,
      imageUrl,
      canvasWidth,
      canvasHeight,
      isPublic,
      markerData,
      clipPathSvg,
    } = body;

    if (!name || !imageUrl) {
      return NextResponse.json(
        { error: 'Name and imageUrl are required' },
        { status: 400 }
      );
    }

    const frame = await prisma.kiteFrame.create({
      data: {
        name,
        description: description || null,
        imageUrl,
        thumbnailUrl: imageUrl,
        canvasWidth: canvasWidth || 800,
        canvasHeight: canvasHeight || 600,
        isPublic: isPublic || false,
        markerData: markerData || [],
        clipPathSvg: clipPathSvg || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(frame, { status: 201 });
  } catch (error) {
    console.error('Error creating frame:', error);
    return NextResponse.json(
      { error: 'Failed to create frame', details: String(error) },
      { status: 500 }
    );
  }
}

// GET - Get all frames
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    const where: any = {};
    
    if (status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const frames = await prisma.kiteFrame.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            designs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(frames);
  } catch (error) {
    console.error('Error fetching frames:', error);
    return NextResponse.json(
      { error: 'Failed to fetch frames', details: String(error) },
      { status: 500 }
    );
  }
}