// app/api/admin/designs/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const designId = formData.get('designId') as string;

    if (!file || !designId) {
      return NextResponse.json(
        { error: 'File and designId are required' },
        { status: 400 }
      );
    }

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed' },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Max 10MB' },
        { status: 400 }
      );
    }

    // Save file to temporary storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${randomUUID()}-${file.name}`;
    const uploadDir = join(process.cwd(), 'public/uploads/temp');
    
    await mkdir(uploadDir, { recursive: true });
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/temp/${fileName}`;

    // Create storage file record
    const storageFile = await prisma.storageFile.create({
      data: {
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        storageType: 'temporary',
        source: 'admin_upload',
        kiteDesignId: designId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Update design with thumbnail if not set
    const design = await prisma.kiteDesign.findUnique({
      where: { id: designId },
      select: { thumbnailUrl: true },
    });

    if (!design?.thumbnailUrl) {
      await prisma.kiteDesign.update({
        where: { id: designId },
        data: { thumbnailUrl: fileUrl },
      });
    }

    return NextResponse.json({
      message: 'File uploaded successfully',
      storageFile,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}