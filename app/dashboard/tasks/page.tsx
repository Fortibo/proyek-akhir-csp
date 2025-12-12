// app/(dashboard)/tasks/page.tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  Upload,
  Send,
  Check,
  X,
} from "lucide-react";
import { Task } from "@/types";
import { formatDate, getDaysUntil, cn } from "@/lib/utils";

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [membersMap, setMembersMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [uploadingProof, setUploadingProof] = useState<string | null>(null);
  const [taskRequests, setTaskRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  useEffect(() => {
    fetchTasks();
    if (user?.role === "admin") {
      fetchTaskRequests();
    }
  }, [statusFilter, showMyTasks, user]);

  // load members map for admin to resolve assignee names
  useEffect(() => {
    let mounted = true;
    async function loadMembersMap() {
      try {
        const res = await fetch("/api/members");
        const d = await res.json();
        if (d.success && mounted) {
          const map: Record<string, string> = {};
          (d.data || []).forEach((m: any) => (map[m.id] = m.full_name));
          setMembersMap(map);
        }
      } catch (err) {
        console.error("Failed to load members map", err);
      }
    }
    if (user?.role === "admin") loadMembersMap();
    return () => {
      mounted = false;
    };
  }, [user]);

  async function fetchTasks() {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (showMyTasks) {
        params.append("my_tasks", "true");
      }

      const res = await fetch(`/api/tasks?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setTasks(data.data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTaskRequests() {
    try {
      setRequestsLoading(true);
      const res = await fetch("/api/task-requests?status=submitted");
      const data = await res.json();

      if (data.success) {
        setTaskRequests(data.data);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setRequestsLoading(false);
    }
  }

  async function handleApproveRequest(requestId: string) {
    try {
      const res = await fetch(`/api/task-requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });

      const data = await res.json();

      if (data.success) {
        const createdTask = data.data?.task || null;

        // Remove the approved request from the list (we only fetch status=submitted)
        setTaskRequests(taskRequests.filter((r) => r.id !== requestId));

        // Add the newly created task to the tasks list
        if (createdTask) {
          setTasks((prev) => [createdTask, ...(prev || [])]);
        }

        alert("Request approved and task created");
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
      const res = await fetch(`/api/task-requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });

      const data = await res.json();

      if (data.success) {
        const updatedReq = data.data?.request || data.data;
        setTaskRequests(
          taskRequests.map((r) => (r.id === requestId ? updatedReq : r))
        );
        alert("Request rejected");
      } else {
        alert(data.error || "Gagal reject request");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Terjadi kesalahan");
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm("Yakin ingin menghapus task ini?")) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        setTasks(tasks.filter((t) => t.id !== taskId));
        alert("Task berhasil dihapus");
      } else {
        alert(data.error || "Gagal menghapus task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Terjadi kesalahan");
    }
  }

  async function handleMarkComplete(taskId: string) {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });

      const data = await res.json();

      if (data.success) {
        setTasks(tasks.map((t) => (t.id === taskId ? data.data : t)));
        alert("Task ditandai sebagai selesai");
      } else {
        alert(data.error || "Gagal update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Terjadi kesalahan");
    }
  }

  async function handleVerifyTask(taskId: string) {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "verified" }),
      });

      const data = await res.json();

      if (data.success) {
        setTasks(tasks.map((t) => (t.id === taskId ? data.data : t)));
        alert("Task berhasil diverifikasi");
      } else {
        alert(data.error || "Gagal verifikasi task");
      }
    } catch (error) {
      console.error("Error verifying task:", error);
      alert("Terjadi kesalahan");
    }
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Tasks
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
            {showMyTasks
              ? "Tasks yang ditugaskan ke saya"
              : "Semua tasks di grup"}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm sm:text-base rounded-lg hover:bg-indigo-700 transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Buat Task Baru</span>
            <span className="sm:hidden">Buat</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
        <div className="space-y-3 sm:space-y-4">
          {/* Search */}
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari task..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter - Scrollable on mobile */}
          <div className="overflow-x-auto -mx-3 sm:-mx-4 px-3 sm:px-4">
            <div className="flex gap-1.5 sm:gap-2 whitespace-nowrap">
              <button
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition text-xs sm:text-sm",
                  statusFilter === "all"
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                Semua
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={cn(
                  "px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition text-xs sm:text-sm",
                  statusFilter === "pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter("completed")}
                className={cn(
                  "px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition text-xs sm:text-sm",
                  statusFilter === "completed"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                Completed
              </button>
              <button
                onClick={() => setStatusFilter("verified")}
                className={cn(
                  "px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition text-xs sm:text-sm",
                  statusFilter === "verified"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                Verified
              </button>
            </div>
          </div>

          {/* My Tasks Toggle */}
          {isAdmin && (
            <label className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition w-fit">
              <input
                type="checkbox"
                checked={showMyTasks}
                onChange={(e) => setShowMyTasks(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                My Tasks Only
              </span>
            </label>
          )}
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Tidak ada task
          </h3>
          <p className="text-gray-600">
            {searchQuery
              ? "Tidak ada task yang cocok dengan pencarian"
              : "Belum ada task yang dibuat"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map((task) => {
            const daysUntil = getDaysUntil(task.deadline);
            const isOverdue = daysUntil < 0 && task.status === "pending";
            const isMyTask = task.assigned_to === user?.id;

            return (
              <div
                key={task.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                  {/* Task Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                        {task.title}
                      </h3>
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
                          task.status === "verified" &&
                            "bg-green-100 text-green-800",
                          task.status === "completed" &&
                            "bg-blue-100 text-blue-800",
                          task.status === "pending" &&
                            "bg-yellow-100 text-yellow-800"
                        )}
                      >
                        {task.status === "verified"
                          ? "Verified"
                          : task.status === "completed"
                          ? "Completed"
                          : "Pending"}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1.5 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">
                          {task.assigned_user?.full_name || "Unassigned"}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>{formatDate(task.deadline)}</span>
                      </span>
                      {isOverdue && (
                        <span className="text-red-600 font-medium">
                          Terlambat {Math.abs(daysUntil)} hari
                        </span>
                      )}
                      {!isOverdue &&
                        daysUntil <= 3 &&
                        task.status === "pending" && (
                          <span className="text-orange-600 font-medium">
                            {daysUntil === 0
                              ? "Deadline hari ini!"
                              : `${daysUntil} hari lagi`}
                          </span>
                        )}
                    </div>

                    {/* Proof Image - Responsive size */}
                    {task.proof_image_url && (
                      <div className="mt-2 sm:mt-3">
                        <img
                          src={task.proof_image_url}
                          alt="Task proof"
                          className="max-w-xs sm:max-w-sm rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 sm:gap-2 min-w-max">
                    {/* Member Actions */}
                    {isMyTask && task.status === "pending" && (
                      <>
                        <button
                          onClick={() => setUploadingProof(task.id)}
                          className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition whitespace-nowrap"
                        >
                          <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Upload Bukti</span>
                          <span className="sm:hidden">Upload</span>
                        </button>
                        <button
                          onClick={() => handleMarkComplete(task.id)}
                          className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition whitespace-nowrap"
                        >
                          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Selesai</span>
                          <span className="sm:hidden">Done</span>
                        </button>
                      </>
                    )}

                    {/* Admin Actions */}
                    {isAdmin && (
                      <>
                        {task.status === "completed" && (
                          <button
                            onClick={() => handleVerifyTask(task.id)}
                            className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition whitespace-nowrap"
                          >
                            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Verify</span>
                            <span className="sm:hidden">OK</span>
                          </button>
                        )}
                        <button
                          onClick={() => setEditingTask(task)}
                          className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition"
                        >
                          <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Edit</span>
                          <span className="sm:hidden">✎</span>
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Delete</span>
                          <span className="sm:hidden">✕</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Task Modal */}
      {(showCreateModal || editingTask) && (
        <TaskFormModal
          task={editingTask}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTask(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingTask(null);
            fetchTasks();
          }}
        />
      )}

      {/* Task Requests Section (Admin Only) */}
      {isAdmin && (
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
            Task Requests
          </h2>

          {requestsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : taskRequests.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
              <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-3" />
              <p className="text-sm sm:text-base text-gray-600">
                No pending requests
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4">
              {taskRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                          {request.title}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 whitespace-nowrap">
                          Pending
                        </span>
                      </div>

                      {request.description && (
                        <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">
                          {request.description}
                        </p>
                      )}
                      {request.deadline && (
                        <p className="text-xs sm:text-sm text-gray-600 mb-1.5">
                          <span className="font-medium">
                            Proposed Deadline:
                          </span>{" "}
                          {new Date(request.deadline).toLocaleDateString()}
                        </p>
                      )}
                      {request.assigned_to && (
                        <p className="text-xs sm:text-sm text-gray-600 mb-1.5">
                          <span className="font-medium">
                            Proposed Assignee:
                          </span>{" "}
                          {membersMap[request.assigned_to] ??
                            request.assigned_to}
                        </p>
                      )}
                      {request.status === "rejected" &&
                        request.rejection_reason && (
                          <p className="text-xs sm:text-sm text-red-600 mb-1.5">
                            <span className="font-medium">Reason:</span>{" "}
                            {request.rejection_reason}
                          </p>
                        )}
                    </div>

                    <div className="flex gap-1.5 sm:gap-2 min-w-max">
                      <button
                        onClick={() => handleApproveRequest(request.id)}
                        className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition whitespace-nowrap"
                      >
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Approve</span>
                        <span className="sm:hidden">✓</span>
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition whitespace-nowrap"
                      >
                        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Reject</span>
                        <span className="sm:hidden">✕</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Request Task Button (Members Only) */}
      {!isAdmin && (
        <div className="mt-6 sm:mt-8 flex justify-center">
          <button
            onClick={() => setShowRequestModal(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 sm:py-3 bg-indigo-600 text-white text-sm sm:text-base rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            Request New Task
          </button>
        </div>
      )}

      {/* Upload Proof Modal */}
      {uploadingProof && (
        <UploadProofModal
          taskId={uploadingProof}
          onClose={() => setUploadingProof(null)}
          onSuccess={() => {
            setUploadingProof(null);
            fetchTasks();
          }}
        />
      )}

      {/* Request Task Modal (Members Only) */}
      {showRequestModal && (
        <RequestTaskModal
          onClose={() => setShowRequestModal(false)}
          onSuccess={() => {
            setShowRequestModal(false);
            // Refresh user's own requests so the UI reflects the newly created request
            fetchTaskRequests();
            alert("Task request sent successfully");
          }}
        />
      )}
    </div>
  );
}

// Task Form Modal Component
function TaskFormModal({
  task,
  onClose,
  onSuccess,
}: {
  task: Task | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    assigned_to: task?.assigned_to || "",
    deadline: task?.deadline
      ? new Date(task.deadline).toISOString().slice(0, 16)
      : "",
  });

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
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const url = task ? `/api/tasks/${task.id}` : "/api/tasks";
      const method = task ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        alert(task ? "Task berhasil diupdate" : "Task berhasil dibuat");
        onSuccess();
      } else {
        alert(data.error || "Gagal menyimpan task");
      }
    } catch (error) {
      console.error("Error saving task:", error);
      alert("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            {task ? "Edit Task" : "Buat Task Baru"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Judul Task
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Contoh: Cuci piring"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Deskripsi (opsional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Detail task..."
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Ditugaskan ke
            </label>
            <select
              required
              value={formData.assigned_to}
              onChange={(e) =>
                setFormData({ ...formData, assigned_to: e.target.value })
              }
              className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Pilih member...</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name} ({member.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Deadline
            </label>
            <input
              type="datetime-local"
              required
              value={formData.deadline}
              onChange={(e) =>
                setFormData({ ...formData, deadline: e.target.value })
              }
              className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 sm:gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-xs sm:text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-xs sm:text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : task ? "Update" : "Buat Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Upload Proof Modal Component
function UploadProofModal({
  taskId,
  onClose,
  onSuccess,
}: {
  taskId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  }

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    try {
      // Upload file
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "task-proofs");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadData.success) {
        alert(uploadData.error || "Gagal upload file");
        return;
      }

      // Update task with proof URL
      const updateRes = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proof_image_url: uploadData.data.url }),
      });

      const updateData = await updateRes.json();

      if (updateData.success) {
        alert("Bukti berhasil diupload");
        onSuccess();
      } else {
        alert(updateData.error || "Gagal update task");
      }
    } catch (error) {
      console.error("Error uploading proof:", error);
      alert("Terjadi kesalahan");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Upload Bukti
          </h2>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Pilih Foto
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-xs sm:text-sm text-gray-500 file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-2.5 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          {preview && (
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Preview:
              </p>
              <img
                src={preview}
                alt="Preview"
                className="w-full rounded-lg border border-gray-200"
              />
            </div>
          )}

          <div className="flex gap-2 sm:gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-xs sm:text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1 px-4 py-2 text-xs sm:text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Request Task Modal Component
function RequestTaskModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<
    Array<{ id: string; full_name: string }>
  >([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigned_to: "",
    deadline: "",
  });

  useEffect(() => {
    let mounted = true;
    async function loadMembers() {
      try {
        const res = await fetch("/api/members");
        const data = await res.json();
        if (data.success && mounted) {
          setMembers(data.data || []);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/task-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        onSuccess();
      } else {
        alert(data.error || "Gagal membuat request");
      }
    } catch (error) {
      console.error("Error creating request:", error);
      alert("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Request New Task
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Task Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Contoh: Bersihkan ruang tamu"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Detail task yang diminta..."
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Assign To (optional)
            </label>
            <select
              value={formData.assigned_to}
              onChange={(e) =>
                setFormData({ ...formData, assigned_to: e.target.value })
              }
              className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Deadline (optional)
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) =>
                setFormData({ ...formData, deadline: e.target.value })
              }
              className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 sm:gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-xs sm:text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-xs sm:text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
