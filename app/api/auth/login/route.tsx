import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return NextResponse.json(
        { success: false, error: "Email atau password salah" },
        { status: 401 }
      );
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();
    if (userError || !userData) {
      return NextResponse.json(
        {
          success: false,
          error: userError?.message || "User Profile tidak ditemukan",
        },
        { status: 404 }
      );
    }

    if (!userData.house_group_id) {
      return NextResponse.json(
        { success: false, error: "User belum tergabung dalam grup" },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: userData,
      message: "Login berhasil",
    });

    response.cookies.set("sb-access-token", data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    response.cookies.set("sb-refresh-token", data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error: ", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
