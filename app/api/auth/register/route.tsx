import { supabaseAdmin } from "@/lib/supabase";
import { generateInviteCode } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, email, password, action, group_name, invite_code } =
      body;

    if (!full_name || !email || !password || !action) {
      return NextResponse.json(
        {
          success: false,
          error: "data tidak Lengkap",
        },
        { status: 400 }
      );
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: authError?.message || "Gagal membuat akun" },
        { status: 400 }
      );
    }

    let houseGroupId: string;
    let userRole: "admin" | "member" = "member";

    if (action === "create") {
      //buat house group

      if (!group_name) {
        return NextResponse.json(
          {
            success: false,
            error: "Nama House Group harus diisi",
          },
          { status: 400 }
        );
      }

      const newInviteCode = generateInviteCode();
      const { data: groupData, error: groupError } = await supabaseAdmin
        .from("house_groups")
        .insert({
          name: group_name,
          invite_code: newInviteCode,
          created_by: authData.user.id,
        })
        .select()
        .single();
      if (groupError || !groupData) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          {
            success: false,
            error: groupError?.message || "Gagal membuat house group",
          },
          { status: 400 }
        );
      }

      houseGroupId = groupData.id;
      userRole = "admin";
    } else {
      if (!invite_code) {
        return NextResponse.json(
          {
            success: false,
            error: "Kode Undangan harus diisi",
          },
          { status: 400 }
        );
      }

      const { data: groupData, error: groupError } = await supabaseAdmin
        .from("house_groups")
        .select()
        .eq("invite_code", invite_code.toUpperCase())
        .single();

      if (groupError || !groupData) {
        return NextResponse.json(
          {
            success: false,
            error: groupError?.message || "Kode Undangan tidak valid",
          },
          { status: 400 }
        );
      }

      houseGroupId = groupData.id;
      userRole = "member";
    }

    const { error: userError } = await supabaseAdmin.from("users").insert({
      id: authData.user.id,
      full_name,
      email,
      house_group_id: houseGroupId,
      role: userRole,
    });

    if (userError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        {
          success: false,
          error: userError?.message || "Gagal membuat user",
        },
        { status: 400 }
      );
    }

    const { data: sessionData, error: sessionError } =
      await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

    if (sessionError || !sessionData) {
      return NextResponse.json(
        { success: false, error: sessionError?.message || "Gagal masuk" },
        { status: 400 }
      );
    }

    const { data: userData } = await supabaseAdmin
      .from("users")
      .select()
      .eq("id", authData.user.id)
      .single();

    const response = NextResponse.json({
      success: true,
      user: userData,
      message: "Register berhasil",
    });

    response.cookies.set("sb-access-token", sessionData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    response.cookies.set(
      "sb-refresh-token",
      sessionData.session.refresh_token,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      }
    );

    return response;
  } catch (error: any) {
    console.error("Register error: ", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal membuat akun" },
      { status: 400 }
    );
  }
}
