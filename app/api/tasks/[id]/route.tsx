// app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET - Get single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: task, error: taskError } = await supabaseAdmin
      .from("tasks")
      .select(
        `
        *,
        assigned_user:users!tasks_assigned_to_fkey(id, full_name, avatar_url),
        creator:users!tasks_created_by_fkey(id, full_name)
      `
      )
      .eq("id", id)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error: any) {
    console.error("Get task error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

// PUT - Update task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get existing task
    const { data: existingTask } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: any = {};

    // Admin can update everything
    if (userData.role === "admin") {
      if (body.title !== undefined) updates.title = body.title;
      if (body.description !== undefined)
        updates.description = body.description;
      if (body.assigned_to !== undefined)
        updates.assigned_to = body.assigned_to;
      if (body.deadline !== undefined) updates.deadline = body.deadline;
      if (body.status !== undefined) updates.status = body.status;
      if (body.proof_image_url !== undefined)
        updates.proof_image_url = body.proof_image_url;
    } else {
      // Members can only update status and proof
      if (body.status !== undefined) {
        // Member can only mark as completed
        if (body.status === "completed") {
          updates.status = body.status;
        }
      }
      if (body.proof_image_url !== undefined) {
        updates.proof_image_url = body.proof_image_url;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Update task
    const { data: task, error: updateError } = await supabaseAdmin
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select(
        `
        *,
        assigned_user:users!tasks_assigned_to_fkey(id, full_name, avatar_url)
      `
      )
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Failed to update task" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: task,
      message: "Task updated successfully",
    });
  } catch (error: any) {
    console.error("Update task error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete task (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      .select("role")
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
        { success: false, error: "Only admins can delete tasks" },
        { status: 403 }
      );
    }

    // Delete task
    const { error: deleteError } = await supabaseAdmin
      .from("tasks")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: "Failed to delete task" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete task error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
