// app/dashboard/requests/page.tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

interface TaskRequest {
  id: string;
  title: string;
  description?: string;
  status: "submitted" | "approved" | "rejected";
  requested_by?: { full_name: string };
  rejection_reason?: string | null;
  assigned_to?: string | null;
  deadline?: string | null;
}

export default function RequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TaskRequest[]>([]);
  const [membersMap, setMembersMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      const res = await fetch("/api/task-requests");
      const data = await res.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    async function loadMembers() {
      try {
        const res = await fetch("/api/members");
        const d = await res.json();
        if (d.success && mounted) {
          const map: Record<string, string> = {};
          (d.data || []).forEach((m: any) => (map[m.id] = m.full_name));
          setMembersMap(map);
        }
      } catch (err) {
        console.error("Failed to load members", err);
      }
    }
    loadMembers();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleApproveRequest(requestId: string) {
    try {
      const res = await fetch(`/api/task-requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });

      const data = await res.json();

      if (data.success) {
        const updatedReq = data.data?.request || data.data;
        setRequests(requests.map((r) => (r.id === requestId ? updatedReq : r)));
        alert("Request approved");
      } else {
        alert(data.error || "Gagal approve request");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Terjadi kesalahan");
    }
  }

  async function handleRejectRequest(requestId: string) {
    try {
      const reason = prompt("Enter rejection reason (optional):");
      if (reason === null) return; // user cancelled

      const res = await fetch(`/api/task-requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", rejection_reason: reason }),
      });

      const data = await res.json();

      if (data.success) {
        const updatedReq = data.data?.request || data.data;
        setRequests(requests.map((r) => (r.id === requestId ? updatedReq : r)));
        alert("Request rejected");
      } else {
        alert(data.error || "Gagal reject request");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Terjadi kesalahan");
    }
  }

  const isAdmin = user?.role === "admin";
  const pendingRequests = requests.filter((r) => r.status === "submitted");

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Task Requests
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-lg">
          <p className="text-gray-600">No requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {isAdmin && pendingRequests.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-sm text-yellow-800">
                You have {pendingRequests.length} pending request
                {pendingRequests.length > 1 ? "s" : ""}
              </p>
            </div>
          )}

          {requests.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-lg hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-gray-900">{r.title}</div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.status === "submitted"
                          ? "bg-yellow-100 text-yellow-800"
                          : r.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {r.status === "submitted"
                        ? "Pending"
                        : r.status === "approved"
                        ? "Approved"
                        : "Rejected"}
                    </span>
                  </div>
                  {r.description && (
                    <p className="text-sm text-gray-600 mt-2">
                      {r.description}
                    </p>
                  )}
                  {r.deadline && (
                    <p className="text-sm text-gray-600 mt-2">
                      Member Proposed Deadline:{" "}
                      {new Date(r.deadline).toLocaleDateString()}
                    </p>
                  )}
                  {r.assigned_to && (
                    <p className="text-sm text-gray-600 mt-2">
                      Member Proposed Assignee:{" "}
                      {membersMap[r.assigned_to] ?? r.assigned_to}
                    </p>
                  )}
                  {r.status === "rejected" && r.rejection_reason && (
                    <p className="text-sm text-red-600 mt-2">
                      Reason: {r.rejection_reason}
                    </p>
                  )}
                </div>

                {isAdmin && r.status === "submitted" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveRequest(r.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectRequest(r.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
