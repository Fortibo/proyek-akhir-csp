// app/(dashboard)/settings/page.tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Copy, RefreshCw, Users, Home, Check } from "lucide-react";

interface HouseGroupData {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  member_count: number;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [groupData, setGroupData] = useState<HouseGroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    fetchGroupData();
  }, []);

  async function fetchGroupData() {
    try {
      setLoading(true);
      const res = await fetch("/api/house-group");
      const data = await res.json();

      if (data.success) {
        setGroupData(data.data);
      }
    } catch (error) {
      console.error("Error fetching group data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyCode() {
    if (groupData?.invite_code) {
      await navigator.clipboard.writeText(groupData.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleRegenerateCode() {
    if (
      !confirm(
        "Regenerate invite code? Kode lama tidak akan bisa digunakan lagi."
      )
    ) {
      return;
    }

    setRegenerating(true);
    try {
      const res = await fetch("/api/house-group/regenerate", {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        setGroupData(data.data);
        alert("Invite code berhasil di-regenerate");
      } else {
        alert(data.error || "Gagal regenerate code");
      }
    } catch (error) {
      console.error("Error regenerating code:", error);
      alert("Terjadi kesalahan");
    } finally {
      setRegenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* House Group Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <Home className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">House Group</h2>
            <p className="text-sm text-gray-600">Informasi grup rumah Anda</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Grup
            </label>
            <input
              type="text"
              value={groupData?.name || ""}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jumlah Anggota
            </label>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-400" />
              <span className="text-gray-900 font-medium">
                {groupData?.member_count || 0} members
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Code */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Invite Code
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Bagikan kode ini ke anggota baru untuk bergabung dengan grup Anda.
        </p>

        <div className="flex items-center gap-3">
          <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg">
            <code className="text-2xl font-mono font-bold text-indigo-600">
              {groupData?.invite_code}
            </code>
          </div>

          <button
            onClick={handleCopyCode}
            className="p-3 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition"
            title="Copy code"
          >
            {copied ? (
              <Check className="w-5 h-5" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>

          {isAdmin && (
            <button
              onClick={handleRegenerateCode}
              disabled={regenerating}
              className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
              title="Regenerate code"
            >
              <RefreshCw
                className={`w-5 h-5 ${regenerating ? "animate-spin" : ""}`}
              />
            </button>
          )}
        </div>

        {isAdmin && (
          <p className="text-xs text-gray-500 mt-3">
            Hanya admin yang bisa regenerate invite code
          </p>
        )}
      </div>

      {/* How to Invite */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Cara Mengundang Anggota Baru
        </h3>
        <ol className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="font-bold">1.</span>
            <span>Copy invite code di atas</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">2.</span>
            <span>
              Bagikan kode ke calon anggota via WhatsApp, email, atau chat
              lainnya
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">3.</span>
            <span>
              Minta mereka register di HomeChore dan pilih "Join Existing Group"
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">4.</span>
            <span>Masukkan invite code saat registrasi</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
