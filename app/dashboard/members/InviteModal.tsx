"use client";

import { useEffect, useState } from "react";
import { UserPlus, Link as LinkIcon, Copy, Plus } from "lucide-react";

interface Invite {
  id: string;
  code: string;
  created_at: string;
  expires_at?: string | null;
  used_by?: string | null;
  revoked?: boolean;
  link?: string;
}

export default function InviteModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [isCopied, setCopied] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expiresDays, setExpiresDays] = useState<number | "">(7);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) fetchInvites();
  }, [open]);

  async function fetchInvites() {
    setLoading(true);
    try {
      const res = await fetch("/api/invites");
      const json = await res.json();
      if (json.success) setInvites(json.data || []);
      else setError(json.error || "Failed to load invites");
    } catch (e) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    setError(null);
    setCreating(true);
    try {
      const body: any = {};
      if (expiresDays) body.expires_in_days = Number(expiresDays);

      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success && json.data) {
        // prepend new invite
        setInvites((s) => [json.data, ...s]);
      } else {
        setError(json.error || "Failed to create invite");
      }
    } catch (e) {
      setError("Network error");
    } finally {
      setCreating(false);
    }
  }

  function copyLink(link?: string, code?: string) {
    const finalLink =
      link || `${window.location.origin}/auth/register?invite=${code || ""}`;
    navigator.clipboard.writeText(finalLink).then(() => {
      // noop
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Invite Members</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            Close
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600">
              Expires (days)
            </label>
            <input
              type="number"
              min={1}
              value={expiresDays as any}
              onChange={(e) =>
                setExpiresDays(e.target.value ? Number(e.target.value) : "")
              }
              className="mt-1 w-full border px-3 py-2 rounded-lg"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              {creating ? "Creating..." : "Create Invite"}
            </button>
          </div>
        </div>

        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

        <div className="space-y-3 max-h-60 overflow-auto">
          {loading ? (
            <div className="text-center py-6">Loading...</div>
          ) : invites.length === 0 ? (
            <div className="text-gray-600 text-sm">No invites yet.</div>
          ) : (
            invites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{inv.code}</div>
                  <div className="text-xs text-gray-500">{inv.created_at}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      copyLink(inv.link, inv.code);
                      setCopied(true);
                      setTimeout(() => {
                        setCopied(false);
                      }, 2000);
                    }}
                    className="inline-flex items-center gap-2 text-sm text-indigo-600"
                  >
                    <Copy className="w-4 h-4" /> {isCopied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
