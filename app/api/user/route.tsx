// app/api/user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateInviteCode } from "@/lib/utils";

// GET - Get current user profile
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

    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select(
        `
        *,
        house_group:house_groups(*)
      `
      )
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: userData,
    });
  } catch (error: any) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

// PUT - Update user profile or house group
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const updates: any = {};

    // Handle house group changes
    if (body.action === "leave_house_group") {
      // Get current user data
      const { data: userData, error: userError } = await supabaseAdmin
        .from("users")
        .select("house_group_id, role")
        .eq("id", user.id)
        .single();

      if (userError || !userData?.house_group_id) {
        return NextResponse.json(
          { success: false, error: "User not in a house group" },
          { status: 400 }
        );
      }

      // Check if admin and if there are other admins
      if (userData.role === "admin") {
        const { count: adminCount } = await supabaseAdmin
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("house_group_id", userData.house_group_id)
          .eq("role", "admin");

        if (adminCount && adminCount <= 1) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Cannot leave house group as the only admin. Delete the house group instead or assign another admin.",
            },
            { status: 400 }
          );
        }
      }

      updates.house_group_id = null;
      updates.role = "member";
    } else if (body.action === "join_house_group") {
      if (!body.invite_code) {
        return NextResponse.json(
          { success: false, error: "Invite code is required" },
          { status: 400 }
        );
      }

      // Validate invite code
      const { data: groupData, error: groupError } = await supabaseAdmin
        .from("house_groups")
        .select()
        .eq("invite_code", body.invite_code.toUpperCase())
        .single();

      if (groupError || !groupData) {
        return NextResponse.json(
          { success: false, error: "Invalid invite code" },
          { status: 400 }
        );
      }

      updates.house_group_id = groupData.id;
      updates.role = "member";
    } else if (body.action === "create_house_group") {
      if (!body.group_name) {
        return NextResponse.json(
          { success: false, error: "Group name is required" },
          { status: 400 }
        );
      }

      const newInviteCode = generateInviteCode();
      const { data: groupData, error: groupError } = await supabaseAdmin
        .from("house_groups")
        .insert({
          name: body.group_name,
          invite_code: newInviteCode,
          created_by: user.id,
        })
        .select()
        .single();

      if (groupError || !groupData) {
        return NextResponse.json(
          {
            success: false,
            error: groupError?.message || "Failed to create house group",
          },
          { status: 400 }
        );
      }

      updates.house_group_id = groupData.id;
      updates.role = "admin";
    } else {
      // Regular profile updates
      if (body.full_name !== undefined) updates.full_name = body.full_name;
      if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url;

      if (Object.keys(updates).length === 0) {
        return NextResponse.json(
          { success: false, error: "No valid fields to update" },
          { status: 400 }
        );
      }
    }

    const { data: userData, error: updateError } = await supabaseAdmin
      .from("users")
      .update(updates)
      .eq("id", user.id)
      .select(
        `
        *,
        house_group:house_groups(*)
      `
      )
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: userData,
      message: body.action
        ? "House group updated successfully"
        : "Profile updated successfully",
    });
  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
