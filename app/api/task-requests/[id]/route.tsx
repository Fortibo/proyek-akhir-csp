import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// PUT - Update task request (Admin only - approve/reject)
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

    // Only admins can update requests
    if (userData.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Only admins can update requests" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      status,
      assigned_to: body_assigned_to,
      deadline: body_deadline,
      rejection_reason: body_rejection_reason,
    } = body;

    // Validate status
    if (!["submitted", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    // Fetch existing request to check previous status and details
    const { data: existingRequest, error: fetchReqError } = await supabaseAdmin
      .from("task_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchReqError || !existingRequest) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
        { status: 404 }
      );
    }

    // Prepare fields to update on the request (include reviewer info)
    const updateFields: any = { status };
    if (status === "approved" || status === "rejected") {
      updateFields.reviewed_at = new Date().toISOString();
      updateFields.reviewed_by = user.id;
    }

    // If admin provided a rejection reason, save it
    if (body_rejection_reason !== undefined) {
      updateFields.rejection_reason = body_rejection_reason;
    }

    // If admin provided assigned_to or deadline in the request body, save them on the request
    if (body_assigned_to !== undefined) {
      updateFields.assigned_to = body_assigned_to;
    }
    if (body_deadline !== undefined) {
      updateFields.deadline = body_deadline;
    }

    // Update request status and reviewer info
    const { data: updatedRequest, error: updateError } = await supabaseAdmin
      .from("task_requests")
      .update(updateFields)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Failed to update request" },
        { status: 500 }
      );
    }

    // If transitioned to approved (and wasn't already approved), create a task
    let createdTask = null;
    if (status === "approved" && existingRequest.status !== "approved") {
      const { title, description, house_group_id } = existingRequest as any;

      const assignedTo =
        body_assigned_to ?? (existingRequest as any).assigned_to ?? null;
      const deadline =
        body_deadline ??
        (existingRequest as any).deadline ??
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: task, error: insertTaskError } = await supabaseAdmin
        .from("tasks")
        .insert({
          house_group_id: house_group_id,
          title,
          description: description || null,
          assigned_to: assignedTo,
          created_by: user.id,
          deadline: deadline,
          status: "pending",
        })
        .select(
          `*, assigned_user:users!tasks_assigned_to_fkey(id, full_name, avatar_url)`
        )
        .single();

      if (insertTaskError) {
        console.error("Failed to create task from request:", insertTaskError);
        return NextResponse.json(
          { success: false, error: "Failed to create task from request" },
          { status: 500 }
        );
      }

      createdTask = task;
    }

    return NextResponse.json({
      success: true,
      data: { request: updatedRequest, task: createdTask },
      message: "Task request updated successfully",
    });
  } catch (error: any) {
    console.error("Update task request error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete task request (Admin only)
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

    // Only admins can delete requests
    if (userData.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Only admins can delete requests" },
        { status: 403 }
      );
    }

    // Delete request
    const { error: deleteError } = await supabaseAdmin
      .from("task_requests")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: "Failed to delete request" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Task request deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete task request error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
