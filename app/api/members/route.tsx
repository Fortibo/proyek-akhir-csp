// app/api/members/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET - Fetch all members in house group
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-access-token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    // Get user's house group
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("house_group_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch all members in the same house group
    const { data: members, error: membersError } = await supabaseAdmin
      .from("users")
      .select("id, full_name, email, avatar_url, role, created_at")
      .eq("house_group_id", userData.house_group_id)
      .order("created_at", { ascending: true });

    if (membersError) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch members" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: members,
    });
  } catch (error: any) {
    console.error("Fetch members error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
