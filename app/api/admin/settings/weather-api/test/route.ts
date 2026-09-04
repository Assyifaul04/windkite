// app/api/admin/settings/weather-api/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma'; // was missing -> ReferenceError on masked-key path

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { apiKey, provider, location } = await req.json();

    // Validasi API Key - cek apakah masih masked
    if (!apiKey || apiKey.length < 5) {
      return NextResponse.json(
        {
          success: false,
          error: 'API Key tidak valid. Pastikan API Key Anda benar.'
        },
        { status: 400 }
      );
    }

    // Jika API Key masih masked (••••••••), ambil dari database
    let finalApiKey = apiKey;
    if (apiKey === '••••••••' || apiKey.includes('•')) {
      const settings = await prisma.weatherSettings.findFirst();
      if (settings?.apiKey) {
        finalApiKey = settings.apiKey;
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'API Key tidak ditemukan di database. Silakan simpan terlebih dahulu.'
          },
          { status: 400 }
        );
      }
    }

    const testLocation = location || 'Jakarta';
    const encodedLocation = encodeURIComponent(testLocation);

    // Test connection berdasarkan provider
    let testUrl = '';

    switch (provider) {
      case 'openweather':
        testUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodedLocation}&appid=${finalApiKey}&units=metric`;
        break;
      case 'weatherbit':
        testUrl = `https://api.weatherbit.io/v2.0/current?city=${encodedLocation}&key=${finalApiKey}`;
        break;
      case 'tomorrow':
        testUrl = `https://api.tomorrow.io/v4/timelines?location=${encodedLocation}&apikey=${finalApiKey}`;
        break;
      case 'custom':
        testUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodedLocation}&appid=${finalApiKey}&units=metric`;
        break;
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Provider tidak didukung'
          },
          { status: 400 }
        );
    }

    console.log(`Testing weather API: ${provider} -> ${testUrl}`);

    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        let weatherInfo = '';
        if (data.main && data.weather) {
          weatherInfo = `🌡️ ${data.main.temp}°C, ☁️ ${data.weather[0]?.description || 'N/A'}`;
        } else if (data.data && data.data[0]) {
          weatherInfo = `☁️ ${data.data[0].weather?.description || 'N/A'}`;
        }

        return NextResponse.json({
          success: true,
          message: `✅ Koneksi ${provider} berhasil!`,
          data: data,
          weatherInfo: weatherInfo
        });
      } else {
        let errorMessage = 'Koneksi gagal';

        if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        }

        // Cek apakah error karena API key belum aktif
        if (response.status === 401 && errorMessage.includes('Invalid API key')) {
          errorMessage = '⏳ API Key belum aktif. Tunggu hingga 2 jam setelah pembuatan API Key.';
        }

        return NextResponse.json(
          {
            success: false,
            error: `❌ Gagal terhubung ke ${provider}: ${errorMessage}`,
            status: response.status,
            details: data
          },
          { status: response.status }
        );
      }
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: 'Gagal menguji koneksi: ' + (fetchError as Error).message,
          status: 500
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error testing weather API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal menguji koneksi: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}