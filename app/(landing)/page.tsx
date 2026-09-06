// app/(landing)/page.tsx
import WeatherWidget from '@/components/landing/WeatherWidget';
import FeaturesKite from '@/components/landing/FeaturesKite';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white transition-colors">
      {/* Weather Widget Section */}
      <section className="py-8 md:py-12 bg-white dark:bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">
              Pantau Cuaca & Angin <span className="text-yellow-400">Sekarang</span>
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">
              Pilih lokasi dan dapatkan data angin terkini
            </p>
          </div>
          <WeatherWidget />
        </div>
      </section>

      {/* Features Kite Section */}
      <FeaturesKite limit={6} />
    </div>
  );
}