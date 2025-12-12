// /app/signup/page.tsx
"use client";
import AuthForm from "@/app/components/AuthForm";
import { useAuth } from "@/contexts/AuthContext";
import { group } from "console";
import { Home, Loader2, Lock, Mail, Ticket, User, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Action = "create" | "join";

export default function SignUpPage() {
  const { register } = useAuth();
  const [action, setAction] = useState<Action>("create");
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    group_name: "",
    invite_code: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Password tidak sama");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }

    if (action === "create" && !formData.group_name) {
      setError("Nama House Group harus diisi");
      return;
    }

    if (action === "join" && !formData.invite_code) {
      setError("Kode Undangan harus diisi");
      return;
    }
    setLoading(true);

    const result = await register({
      full_name: formData.full_name,
      email: formData.email,
      password: formData.password,
      action,
      group_name: formData.group_name,
      invite_code: formData.invite_code,
    });

    if (!result.success) {
      setError(result.error || "Gagal membuat akun");
      setLoading(false);
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-indigo-600 p-3 rounded-2xl">
              <Home className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">HomeChore</h1>
          <p className="text-gray-600 mt-2">Buat akun baru</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Action Toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => setAction("create")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
                action === "create"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Buat Grup
            </button>
            <button
              type="button"
              onClick={() => setAction("join")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
                action === "join"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Gabung Grup
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="nama@email.com"
                />
              </div>
            </div>

            {/* Conditional: Group Name or Invite Code */}
            {action === "create" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Grup
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    name="group_name"
                    type="text"
                    value={formData.group_name}
                    onChange={handleChange}
                    required={action === "create"}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Kosan Bersama"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kode Invite
                </label>
                <div className="relative">
                  <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    name="invite_code"
                    type="text"
                    value={formData.invite_code}
                    onChange={handleChange}
                    required={action === "join"}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase"
                    placeholder="HC84X9P2"
                    maxLength={8}
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Daftar"
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Sudah punya akun?
              <Link
                href="/auth/login"
                className="text-indigo-600 font-medium hover:text-indigo-700"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">
          © 2024 HomeChore. Kelola tugas rumah dengan mudah.
        </p>
      </div>
    </div>
  );
}
