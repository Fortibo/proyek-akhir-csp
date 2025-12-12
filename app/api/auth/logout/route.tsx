import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-access-token")?.value;

    if (token) {
      await supabaseAdmin.auth.admin.signOut(token);
    }

    const response = NextResponse.json({
      success: true,
      message: "Logout berhasil",
    });
    response.cookies.delete("sb-access-token");
    response.cookies.delete("sb-refresh-token");

    return response;
  } catch (error: any) {
    console.error("Logout error: ", error);
    // Still clear cookies even if error
    const response = NextResponse.json({
      success: true,
      message: "Logout berhasil",
    });

    response.cookies.delete("sb-access-token");
    response.cookies.delete("sb-refresh-token");

    return response;
  }
}
