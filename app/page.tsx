// app/(dashboard)/page.tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  Clock,
  ListTodo,
  Users,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Task } from "@/types";
import { formatDate, isOverdue, getDaysUntil } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    verified: 0,
    overdue: 0,
  });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  async function fetchDashboardData() {
    try {
      setLoading(true);

      // Fetch tasks based on role
      const endpoint =
        user?.role === "admin" ? "/api/tasks?limit=5" : "/api/tasks/my?limit=5";

      const res = await fetch(endpoint);
      const data = await res.json();

      if (data.success) {
        const tasks = data.data;
        setRecentTasks(tasks);

        // Calculate stats
        const total = tasks.length;
        const pending = tasks.filter(
          (t: Task) => t.status === "pending"
        ).length;
        const completed = tasks.filter(
          (t: Task) => t.status === "completed"
        ).length;
        const verified = tasks.filter(
          (t: Task) => t.status === "verified"
        ).length;
        const overdue = tasks.filter(
          (t: Task) => t.status === "pending" && isOverdue(t.deadline)
        ).length;

        setStats({ total, pending, completed, verified, overdue });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Selamat datang, {user?.full_name}! 👋
        </h1>
        <p className="text-gray-600 mt-1">
          Berikut adalah ringkasan tugas Anda hari ini
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<ListTodo className="w-6 h-6" />}
          label="Total Tugas"
          value={stats.total}
          color="bg-blue-500"
        />
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          label="Pending"
          value={stats.pending}
          color="bg-yellow-500"
        />
        <StatCard
          icon={<CheckCircle className="w-6 h-6" />}
          label="Selesai"
          value={stats.completed + stats.verified}
          color="bg-green-500"
        />
        {stats.overdue > 0 && (
          <StatCard
            icon={<AlertCircle className="w-6 h-6" />}
            label="Terlambat"
            value={stats.overdue}
            color="bg-red-500"
          />
        )}
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {user?.role === "admin" ? "Tugas Terbaru" : "Tugas Saya"}
          </h2>
          <Link
            href={user?.role === "admin" ? "/tasks/all" : "/tasks"}
            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-1"
          >
            Lihat Semua
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="divide-y divide-gray-200">
          {recentTasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <ListTodo className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Belum ada tugas</p>
            </div>
          ) : (
            recentTasks.map((task) => <TaskItem key={task.id} task={task} />)
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {user?.role === "admin" ? (
          <Link
            href="/tasks/new"
            className="p-6 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg hover:shadow-xl"
          >
            <h3 className="font-semibold text-lg mb-2">Buat Tugas Baru</h3>
            <p className="text-indigo-100 text-sm">
              Tambahkan tugas untuk anggota
            </p>
          </Link>
        ) : (
          <Link
            href="/requests/new"
            className="p-6 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg hover:shadow-xl"
          >
            <h3 className="font-semibold text-lg mb-2">Request Tugas</h3>
            <p className="text-indigo-100 text-sm">
              Ajukan permintaan tugas baru
            </p>
          </Link>
        )}

        <Link
          href="/profile"
          className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-indigo-600 transition"
        >
          <h3 className="font-semibold text-lg mb-2 text-gray-900">
            Profil Saya
          </h3>
          <p className="text-gray-600 text-sm">Kelola profil dan pengaturan</p>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${color} p-3 rounded-lg text-white`}>{icon}</div>
      </div>
    </div>
  );
}

function TaskItem({ task }: { task: Task }) {
  const daysUntil = getDaysUntil(task.deadline);
  const overdue = isOverdue(task.deadline) && task.status === "pending";

  return (
    <Link
      href={`/tasks/${task.id}`}
      className="p-4 hover:bg-gray-50 transition block"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 mb-1">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-gray-600 line-clamp-1 mb-2">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>📅 {formatDate(task.deadline)}</span>
            {overdue && (
              <span className="text-red-600 font-medium">⚠️ Terlambat</span>
            )}
            {!overdue && task.status === "pending" && daysUntil <= 3 && (
              <span className="text-yellow-600 font-medium">
                ⏰ {daysUntil} hari lagi
              </span>
            )}
          </div>
        </div>

        <StatusBadge status={task.status} />
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: "bg-yellow-100 text-yellow-700",
    completed: "bg-blue-100 text-blue-700",
    verified: "bg-green-100 text-green-700",
  };

  const labels = {
    pending: "Pending",
    completed: "Selesai",
    verified: "Terverifikasi",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        styles[status as keyof typeof styles]
      }`}
    >
      {labels[status as keyof typeof labels]}
    </span>
  );
}
