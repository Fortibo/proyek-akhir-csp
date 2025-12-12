// app/dashboard/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  User,
  FileText,
  Settings,
  CheckSquare,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/members", label: "Members", icon: Users },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/requests", label: "Requests", icon: FileText },
  { href: "/dashboard/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname() || "";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-600 p-3 rounded-3xl shadow-xl">
          <Home className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">HomeChore</div>
          <div className="text-xs text-gray-500">Kelola tugas rumah</div>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {NAV.map((n) => {
          const Active =
            pathname === n.href || pathname.startsWith(n.href + "/");
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                Active
                  ? "bg-indigo-50 text-indigo-700 shadow-sm"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="p-2 bg-white rounded-lg shadow-xs">
                <Icon
                  className={`w-4 h-4 ${
                    Active ? "text-indigo-600" : "text-gray-500"
                  }`}
                />
              </span>
              <span>{n.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 pt-4 border-t border-gray-100 text-sm">
        <div className="text-xs text-gray-500">Signed in as</div>
        <div className="mt-2 font-medium text-gray-900">Eric Yoel</div>
        <div className="text-xs text-gray-500">eric@example.com</div>
      </div>
    </div>
  );
}
