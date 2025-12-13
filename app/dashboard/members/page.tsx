// app/dashboard/members/page.tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { UserPlus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import InviteModal from "./InviteModal";

interface Member {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

export default function MembersPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    try {
      const res = await fetch("/api/members");
      const data = await res.json();
      if (data.success) {
        setMembers(data.data);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm("Yakin ingin menghapus member ini?")) return;

    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        setMembers(members.filter((m) => m.id !== memberId));
        alert("Member berhasil dihapus");
      } else {
        alert(data.error || "Gagal menghapus member");
      }
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Terjadi kesalahan");
    }
  }

  async function handlePromoteMember(memberId: string) {
    if (!confirm("Yakin ingin promote member ini menjadi admin?")) return;

    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "promote" }),
      });

      const data = await res.json();

      if (data.success) {
        setMembers(
          members.map((m) => (m.id === memberId ? { ...m, role: "admin" } : m))
        );
        alert("Member berhasil dipromote menjadi admin");
      } else {
        alert(data.error || "Gagal promote member");
      }
    } catch (error) {
      console.error("Error promoting member:", error);
      alert("Terjadi kesalahan");
    }
  }

  async function handleDemoteMember(memberId: string) {
    if (!confirm("Yakin ingin demote admin ini menjadi member?")) return;

    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "demote" }),
      });

      const data = await res.json();

      if (data.success) {
        setMembers(
          members.map((m) => (m.id === memberId ? { ...m, role: "member" } : m))
        );
        alert("Admin berhasil didemote menjadi member");
      } else {
        alert(data.error || "Gagal demote admin");
      }
    } catch (error) {
      console.error("Error demoting member:", error);
      alert("Terjadi kesalahan");
    }
  }

  const isAdmin = user?.role === "admin";
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Members</h2>
        {isAdmin && (
          <>
            <button
              onClick={() => setInviteOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition"
            >
              <UserPlus className="w-5 h-5" />
              Invite Member
            </button>
            <InviteModal
              open={inviteOpen}
              onClose={() => setInviteOpen(false)}
            />
          </>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-12 text-center">
          <p className="text-gray-600">Tidak ada members</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Name
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Email
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Role
                </th>
                {isAdmin && (
                  <th className="text-right px-4 py-3 font-medium text-gray-700">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {m.full_name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{m.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        m.role === "admin"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {m.role === "admin" ? "Admin" : "Member"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      {m.id !== user?.id && (
                        <div className="flex gap-2 justify-end">
                          {m.role === "member" ? (
                            <button
                              onClick={() => handlePromoteMember(m.id)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                            >
                              <ChevronUp className="w-4 h-4" />
                              Promote
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDemoteMember(m.id)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition"
                            >
                              <ChevronDown className="w-4 h-4" />
                              Demote
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveMember(m.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
