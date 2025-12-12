import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch task requests
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

    // Get user profile
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("house_group_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    // Build query
    let query = supabaseAdmin
      .from("task_requests")
      .select("*")
      .eq("house_group_id", userData.house_group_id)
      .order("created_at", { ascending: false });

    // Filter by status if provided
    if (status) {
      query = query.eq("status", status);
    }

    // Only admins can see all requests, members see their own
    if (userData.role !== "admin") {
      query = query.eq("requested_by", user.id);
    }

    const { data: requests, error: requestsError } = await query;

    if (requestsError) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch requests" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: requests,
    });
  } catch (error: any) {
    console.error("Fetch task requests error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

// POST - Create task request (Members can request, admins create)
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

    // Get user profile
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("house_group_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, description, assigned_to, deadline } = body;

    // Validate
    if (!title) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    // Create task request (store optional assignee and deadline)
    const { data: taskRequest, error: insertError } = await supabaseAdmin
      .from("task_requests")
      .insert({
        house_group_id: userData.house_group_id,
        requested_by: user.id,
        title,
        description: description || null,
        assigned_to: assigned_to ?? null,
        deadline: deadline ?? null,
        status: "submitted",
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to create task request" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: taskRequest,
      message: "Task request created successfully",
    });
  } catch (error: any) {
    console.error("Create task request error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
