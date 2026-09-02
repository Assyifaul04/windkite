// app/api/user/designs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createGeminiService } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { prompt, category, isPublic } = body;

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt wajib diisi' },
        { status: 400 }
      );
    }

    // Get AI settings
    const aiSettings = await prisma.aISettings.findFirst();
    if (!aiSettings || !aiSettings.apiKey) {
      return NextResponse.json(
        { error: 'AI settings not configured. Please contact administrator.' },
        { status: 400 }
      );
    }

    // Decrypt API key
    let apiKey = aiSettings.apiKey;
    try {
      const { decrypt } = await import('@/lib/encryption');
      apiKey = decrypt(apiKey);
    } catch (e) {
      console.warn('Failed to decrypt API key, using as is');
    }

    if (!apiKey || apiKey.length < 10) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check AI settings.' },
        { status: 400 }
      );
    }

    // Generate image using Gemini
    const geminiService = createGeminiService(apiKey);
    await geminiService.initialize();

    const result = await geminiService.generateImage({
      prompt,
      category: category || 'SAMPUL',
      userId: session.user.id,
      isPublic: isPublic || false,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate image' },
        { status: 500 }
      );
    }

    // Ambil design yang baru dibuat
    const design = await prisma.kiteDesign.findFirst({
      where: {
        userId: session.user.id,
        prompt: result.prompt,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: design || result,
    });
  } catch (error) {
    console.error('Error generating design:', error);
    return NextResponse.json(
      { error: 'Failed to generate design: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = { userId: session.user.id };
    if (category && ['KERANGKA', 'SAMPUL'].includes(category)) {
      where.category = category;
    }

    const designs = await prisma.kiteDesign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 50),
    });

    return NextResponse.json(designs);
  } catch (error) {
    console.error('Error fetching designs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch designs' },
      { status: 500 }
    );
  }
}