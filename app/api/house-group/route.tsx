// app/api/house-group/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

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

    // Get user's house group ID
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("house_group_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.house_group_id) {
      return NextResponse.json(
        { success: false, error: "User not in a house group" },
        { status: 404 }
      );
    }

    // Get house group details
    const { data: groupData, error: groupError } = await supabaseAdmin
      .from("house_groups")
      .select("*")
      .eq("id", userData.house_group_id)
      .single();

    if (groupError || !groupData) {
      return NextResponse.json(
        { success: false, error: "House group not found" },
        { status: 404 }
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
    });
  } catch (error: any) {
    console.error("Get house group error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
