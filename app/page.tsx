// app/page.tsx
import Link from "next/link";
import { Home, CheckCircle, Users, Upload, Shield } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-3 sm:px-4 py-12 sm:py-16 md:py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="bg-indigo-600 p-3 sm:p-4 rounded-3xl shadow-xl">
              <Home className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
            Kelola Tugas Rumah
            <span className="block text-indigo-600 mt-2 sm:mt-3">
              Dengan Mudah
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
            HomeChore membantu anggota rumah tangga mengatur dan membagi tugas
            secara adil dan terstruktur. Tingkatkan kerja sama dan kedisiplinan
            di rumah Anda.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16">
            <Link
              href="/auth/register"
              className="px-6 sm:px-8 py-3 sm:py-4 bg-indigo-600 text-white text-sm sm:text-base rounded-xl font-semibold hover:bg-indigo-700 transition shadow-lg hover:shadow-xl"
            >
              Mulai Sekarang
            </Link>
            <Link
              href="/auth/login"
              className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-indigo-600 text-sm sm:text-base rounded-xl font-semibold hover:bg-gray-50 transition shadow-lg border-2 border-indigo-600"
            >
              Masuk
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-12 sm:mt-16 md:mt-20">
            <FeatureCard
              icon={<CheckCircle className="w-8 h-8" />}
              title="Manajemen Tugas"
              description="Buat, edit, dan kelola tugas dengan mudah"
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Kolaborasi Tim"
              description="Kerja sama antar anggota rumah"
            />
            <FeatureCard
              icon={<Upload className="w-8 h-8" />}
              title="Upload Bukti"
              description="Foto bukti penyelesaian tugas"
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Verifikasi"
              description="Admin dapat memverifikasi tugas"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50 backdrop-blur">
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2 text-xs sm:text-sm">
              © 2024 HomeChore. Kelola tugas rumah dengan mudah.
            </p>
            <p className="text-xs sm:text-sm">
              Dibuat oleh Eric Yoel & Misael Yosa
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition">
      <div className="text-indigo-600 mb-4 flex justify-center">{icon}</div>
      <h3 className="font-semibold text-lg mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}
