// app/api/invites/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateInviteCode } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, expires_in_days } = body || {};

    // Read sb-access-token cookie from request headers
    const cookieHeader = (request as any).headers.get("cookie") || "";
    const match = cookieHeader.match(/sb-access-token=([^;]+)/);
    const tokenValue = match ? match[1] : null;
    if (!tokenValue) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Verify user
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(tokenValue);
    if (authError || !authData?.user) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }
    const user = authData.user;

    // generate code
    const code = generateInviteCode().toUpperCase();

    const expires_at = expires_in_days ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString() : null;

    // User must belong to a house_group and be admin
    const { data: userRow } = await supabaseAdmin.from("users").select("house_group_id, role").eq("id", user.id).single();
    if (!userRow || userRow.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden: admin only" }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin.from("invites").insert({
      code: code.toUpperCase(),
      house_group_id: userRow.house_group_id,
      created_by: user.id,
      email: email || null,
      expires_at,
    }).select().single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message || "Failed to create invite" }, { status: 400 });
    }

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const link = `${origin}/auth/register?invite=${encodeURIComponent(code)}`;

    return NextResponse.json({ success: true, data: { ...data, link } });
  } catch (err: any) {
    console.error("/api/invites error", err);
    return NextResponse.json({ success: false, error: err?.message || "Server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const cookieHeader = (request as any).headers.get("cookie") || "";
    const match = cookieHeader.match(/sb-access-token=([^;]+)/);
    const tokenValue = match ? match[1] : null;
    if (!tokenValue) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data: authData } = await supabaseAdmin.auth.getUser(tokenValue);
    if (!authData?.user) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

    const user = authData.user;
    const { data: userRow } = await supabaseAdmin.from("users").select("house_group_id, role").eq("id", user.id).single();
    if (!userRow || userRow.role !== "admin") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const { data, error } = await supabaseAdmin.from("invites").select().eq("house_group_id", userRow.house_group_id).order("created_at", { ascending: false });
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("/api/invites GET error", err);
    return NextResponse.json({ success: false, error: err?.message || "Server error" }, { status: 500 });
  }
}
