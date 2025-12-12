// app/api/tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET - Fetch tasks
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
    const limit = searchParams.get("limit");
    const status = searchParams.get("status");
    const myTasks = searchParams.get("my_tasks") === "true";

    // Build query
    let query = supabaseAdmin
      .from("tasks")
      .select(
        `
        *,
        assigned_user:users!tasks_assigned_to_fkey(id, full_name, avatar_url),
        creator:users!tasks_created_by_fkey(id, full_name)
      `
      )
      .eq("house_group_id", userData.house_group_id)
      .order("created_at", { ascending: false });

    // Filter by assigned user if member or if my_tasks=true
    if (userData.role !== "admin" || myTasks) {
      query = query.eq("assigned_to", user.id);
    }

    // Filter by status
    if (status) {
      query = query.eq("status", status);
    }

    // Limit results
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data: tasks, error: tasksError } = await query;

    if (tasksError) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch tasks" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tasks,
    });
  } catch (error: any) {
    console.error("Fetch tasks error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

// POST - Create task (Admin only)
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

    // Check if admin
    if (userData.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Only admins can create tasks" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, assigned_to, deadline } = body;

    // Validate
    if (!title || !assigned_to || !deadline) {
      return NextResponse.json(
        {
          success: false,
          error: "Title, assigned_to, and deadline are required",
        },
        { status: 400 }
      );
    }

    // Create task
    const { data: task, error: insertError } = await supabaseAdmin
      .from("tasks")
      .insert({
        house_group_id: userData.house_group_id,
        title,
        description: description || null,
        assigned_to,
        created_by: user.id,
        deadline,
        status: "pending",
      })
      .select(
        `
        *,
        assigned_user:users!tasks_assigned_to_fkey(id, full_name, avatar_url)
      `
      )
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: "Failed to create task" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: task,
      message: "Task created successfully",
    });
  } catch (error: any) {
    console.error("Create task error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
