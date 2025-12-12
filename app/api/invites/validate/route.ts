import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = (url.searchParams.get("code") || "").toUpperCase();
    if (!code) return NextResponse.json({ success: false, error: "code required" }, { status: 400 });

    // First try the new invites table
    const { data: invite, error } = await supabaseAdmin
      .from("invites")
      .select()
      .eq("code", code)
      .single();

    if (invite && !error) {
      if (invite.revoked) return NextResponse.json({ success: true, valid: false, reason: "revoked" });
      if (invite.used_by) return NextResponse.json({ success: true, valid: false, reason: "used" });
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) return NextResponse.json({ success: true, valid: false, reason: "expired" });

      const { data: group, error: groupErr } = await supabaseAdmin
        .from("house_groups")
        .select("invite_code")
        .eq("id", invite.house_group_id)
        .single();

      const groupInviteCode = group?.invite_code || null;

      return NextResponse.json({
        success: true,
        valid: true,
        data: { house_group_id: invite.house_group_id, house_group_invite_code: groupInviteCode },
      });
    }

    // Fallback: check legacy house_groups.invite_code (for existing codes)
    const { data: legacyGroup, error: legacyErr } = await supabaseAdmin
      .from("house_groups")
      .select("id, invite_code")
      .eq("invite_code", code)
      .single();

    if (legacyGroup && !legacyErr) {
      return NextResponse.json({ success: true, valid: true, data: { house_group_id: legacyGroup.id, house_group_invite_code: legacyGroup.invite_code } });
    }

    return NextResponse.json({ success: true, valid: false, reason: "not_found" });
  } catch (err: any) {
    console.error("/api/invites/validate error", err);
    return NextResponse.json({ success: false, error: err?.message || "Server error" }, { status: 500 });
  }
}
