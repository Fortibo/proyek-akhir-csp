// app/api/members/[id]/route.tsx
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params;
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

    // Check if current user is admin
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from("users")
      .select("role, house_group_id")
      .eq("id", user.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: admin only" },
        { status: 403 }
      );
    }

    // Check if member exists and is in same house group
    const { data: member, error: memberError } = await supabaseAdmin
      .from("users")
      .select("role, house_group_id")
      .eq("id", memberId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, error: "Member not found" },
        { status: 404 }
      );
    }

    if (member.house_group_id !== currentUser.house_group_id) {
      return NextResponse.json(
        { success: false, error: "Member not in your house group" },
        { status: 403 }
      );
    }

    // Prevent changing own role
    if (memberId === user.id) {
      return NextResponse.json(
        { success: false, error: "Cannot change your own role" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (!action || !["promote", "demote"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action. Must be 'promote' or 'demote'",
        },
        { status: 400 }
      );
    }

    let newRole: "admin" | "member";

    if (action === "promote") {
      if (member.role === "admin") {
        return NextResponse.json(
          { success: false, error: "User is already an admin" },
          { status: 400 }
        );
      }
      newRole = "admin";
    } else {
      // demote
      if (member.role === "member") {
        return NextResponse.json(
          { success: false, error: "User is already a member" },
          { status: 400 }
        );
      }

      // Check if this is the last admin
      const { data: admins, error: adminError } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("house_group_id", currentUser.house_group_id)
        .eq("role", "admin");

      if (adminError) {
        return NextResponse.json(
          { success: false, error: "Failed to check admins" },
          { status: 500 }
        );
      }

      if (admins.length <= 1) {
        return NextResponse.json(
          { success: false, error: "Cannot demote the last admin" },
          { status: 400 }
        );
      }

      newRole = "member";
    }

    // Update member role
    const { data: updatedMember, error: updateError } = await supabaseAdmin
      .from("users")
      .update({ role: newRole })
      .eq("id", memberId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Failed to update member role" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedMember,
      message: `Member ${action}d successfully`,
    });
  } catch (error: any) {
    console.error("Update member role error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params;
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

    // Check if current user is admin
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from("users")
      .select("role, house_group_id")
      .eq("id", user.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: admin only" },
        { status: 403 }
      );
    }

    // Check if member exists and is in same house group
    const { data: member, error: memberError } = await supabaseAdmin
      .from("users")
      .select("role, house_group_id")
      .eq("id", memberId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, error: "Member not found" },
        { status: 404 }
      );
    }

    if (member.house_group_id !== currentUser.house_group_id) {
      return NextResponse.json(
        { success: false, error: "Member not in your house group" },
        { status: 403 }
      );
    }

    // Prevent deleting self
    if (memberId === user.id) {
      return NextResponse.json(
        { success: false, error: "Cannot delete yourself" },
        { status: 400 }
      );
    }

    // Check if this is the last admin
    if (member.role === "admin") {
      const { data: admins, error: adminError } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("house_group_id", currentUser.house_group_id)
        .eq("role", "admin");

      if (adminError) {
        return NextResponse.json(
          { success: false, error: "Failed to check admins" },
          { status: 500 }
        );
      }

      if (admins.length <= 1) {
        return NextResponse.json(
          { success: false, error: "Cannot delete the last admin" },
          { status: 400 }
        );
      }
    }

    // Delete from users table first
    const { error: deleteUserError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", memberId);

    if (deleteUserError) {
      return NextResponse.json(
        { success: false, error: "Failed to delete member" },
        { status: 500 }
      );
    }

    // Delete from auth (optional, but recommended)
    const { error: deleteAuthError } =
      await supabaseAdmin.auth.admin.deleteUser(memberId);
    if (deleteAuthError) {
      console.warn("Failed to delete auth user:", deleteAuthError);
      // Don't fail the request, as the user is already removed from the app
    }

    return NextResponse.json({
      success: true,
      message: "Member deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete member error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
