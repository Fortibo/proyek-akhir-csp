// app/api/house-group/regenerate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateInviteCode } from "@/lib/utils";

export async function POST(request: NextRequest) {
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

    // Get user data
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("house_group_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.house_group_id) {
      return NextResponse.json(
        { success: false, error: "User not in a house group" },
        { status: 404 }
      );
    }

    // Check if admin
    if (userData.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Only admins can regenerate invite code" },
        { status: 403 }
      );
    }

    // Generate new code
    const newCode = generateInviteCode();

    // Update house group
    const { data: groupData, error: updateError } = await supabaseAdmin
      .from("house_groups")
      .update({ invite_code: newCode })
      .eq("id", userData.house_group_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Failed to regenerate code" },
        { status: 500 }
      );
    }

    // Count members
    const { count: memberCount } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("house_group_id", userData.house_group_id);

    return NextResponse.json({
      success: true,
      data: {
        ...groupData,
        member_count: memberCount || 0,
      },
      message: "Invite code regenerated successfully",
    });
  } catch (error: any) {
    console.error("Regenerate code error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
