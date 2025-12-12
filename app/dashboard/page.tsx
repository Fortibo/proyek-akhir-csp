"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

function Card({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-gray-900">{value}</div>
      {subtitle && <div className="mt-1 text-xs text-gray-400">{subtitle}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!loading && user) {
      fetchStats();
    }
  }, [loading, user]);

  async function fetchStats() {
    try {
      const res = await fetch("/api/dashboard/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }

  if (loading || statsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";

  return (
    <>
      <header className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Ringkasan aktivitas dan metrik utama.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/requests"
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:bg-indigo-700 transition"
          >
            Lihat Requests
          </Link>
          <Link
            href="/dashboard/members"
            className="px-4 py-2 bg-white border-2 border-indigo-600 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition"
          >
            Members
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isAdmin ? (
          <>
            <Card
              title="Total Tasks"
              value={stats?.total_tasks || 0}
              subtitle="Semua tugas"
            />
            <Card
              title="Pending Tasks"
              value={stats?.pending_tasks || 0}
              subtitle="Menunggu dikerjakan"
            />
            <Card
              title="Members"
              value={stats?.total_members || 0}
              subtitle="Anggota aktif"
            />
            <Card
              title="Open Requests"
              value={stats?.pending_requests || 0}
              subtitle="Permintaan menunggu"
            />
          </>
        ) : (
          <>
            <Card
              title="My Tasks"
              value={stats?.total_tasks || 0}
              subtitle="Tugas ditugaskan ke saya"
            />
            <Card
              title="Pending"
              value={stats?.pending_tasks || 0}
              subtitle="Belum dikerjakan"
            />
            <Card
              title="Completed"
              value={stats?.completed_tasks || 0}
              subtitle="Sudah dikerjakan"
            />
            <Card
              title="Verified"
              value={stats?.verified_tasks || 0}
              subtitle="Sudah diverifikasi"
            />
          </>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Task Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Tasks</span>
              <span className="font-semibold text-gray-900">
                {stats?.total_tasks || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending</span>
              <span className="font-semibold text-yellow-600">
                {stats?.pending_tasks || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="font-semibold text-blue-600">
                {stats?.completed_tasks || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Verified</span>
              <span className="font-semibold text-green-600">
                {stats?.verified_tasks || 0}
              </span>
            </div>
            {stats?.overdue_tasks > 0 && (
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="text-sm text-red-600 font-medium">
                  Overdue Tasks
                </span>
                <span className="font-semibold text-red-600">
                  {stats?.overdue_tasks}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Link
              href="/dashboard/tasks"
              className="block w-full px-4 py-2 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition text-center font-medium"
            >
              View All Tasks
            </Link>
            {isAdmin && (
              <>
                <Link
                  href="/dashboard/members"
                  className="block w-full px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-center font-medium"
                >
                  Manage Members
                </Link>
                <Link
                  href="/dashboard/requests"
                  className="block w-full px-4 py-2 text-sm bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition text-center font-medium"
                >
                  View Requests
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
