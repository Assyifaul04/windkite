// app/api/storage/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'cover_upload';

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      );
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${randomUUID()}.${fileExt}`;
    const filePath = join(process.cwd(), 'public', 'uploads', type, fileName);

    // Ensure directory exists
    await mkdir(join(process.cwd(), 'public', 'uploads', type), { recursive: true });

    // Save original file
    await writeFile(filePath, buffer);

    // Generate thumbnail if image
    let thumbnailPath = null;
    let thumbnailUrl = null;
    if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
      try {
        const thumbnailBuffer = await sharp(buffer)
          .resize(300, 300, { fit: 'cover' })
          .toBuffer();
        
        const thumbnailName = `thumb_${fileName}`;
        const thumbnailFilePath = join(process.cwd(), 'public', 'uploads', type, thumbnailName);
        await writeFile(thumbnailFilePath, thumbnailBuffer);
        thumbnailPath = `/uploads/${type}/${thumbnailName}`;
        thumbnailUrl = thumbnailPath;
      } catch (err) {
        console.error('Error creating thumbnail:', err);
      }
    }

    const fileUrl = `/uploads/${type}/${fileName}`;

    // Save to database
    const storageFile = await prisma.storageFile.create({
      data: {
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        storageType: 'temporary',
        source: type,
        ...(thumbnailUrl && { fileUrl: thumbnailUrl }), // Use thumbnail as fileUrl for display
      },
    });

    return NextResponse.json({
      success: true,
      fileUrl,
      thumbnailUrl,
      storageFileId: storageFile.id,
      fileSize: file.size,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}