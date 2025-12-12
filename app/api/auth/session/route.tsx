import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-access-token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "No session found" },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      const response = NextResponse.json(
        { success: false, user: null, error: "Invalid Session" },
        { status: 401 }
      );
      response.cookies.delete("sb-access-token");
      response.cookies.delete("sb-refresh-token");
      return response;
    }
    //get user profile

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
        {
          success: false,
          user: null,
          error: userError?.message || "User Profile not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user: userData });
  } catch (error: any) {
    console.error("Session error: ", error);
    return NextResponse.json(
      { success: false, error: error.message || "Session Check Failed" },
      { status: 500 }
    );
  }
}
