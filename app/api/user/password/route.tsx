// app/api/user/password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

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
    const { current_password, new_password } = body;

    if (!current_password || !new_password) {
      return NextResponse.json(
        { success: false, error: "Current and new password required" },
        { status: 400 }
      );
    }

    // Verify current password
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("id", user.id)
      .single();

    if (!userData) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Try to sign in with current password to verify
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: userData.email,
      password: current_password,
    });

    if (signInError) {
      return NextResponse.json(
        { success: false, error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Update password
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: new_password,
      });

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Failed to update password" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error: any) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
