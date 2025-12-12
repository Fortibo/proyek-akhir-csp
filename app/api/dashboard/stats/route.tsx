// app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-access-token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify token and get user
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

    const isAdmin = userData.role === "admin";

    // Build query based on role
    let tasksQuery = supabaseAdmin
      .from("tasks")
      .select("*", { count: "exact" })
      .eq("house_group_id", userData.house_group_id);

    // If member, only show their tasks
    if (!isAdmin) {
      tasksQuery = tasksQuery.eq("assigned_to", user.id);
    }

    const { data: allTasks, count: totalTasks } = await tasksQuery;

    // Calculate stats
    const pendingTasks =
      allTasks?.filter((t) => t.status === "pending").length || 0;
    const completedTasks =
      allTasks?.filter((t) => t.status === "completed").length || 0;
    const verifiedTasks =
      allTasks?.filter((t) => t.status === "verified").length || 0;

    // Count overdue tasks
    const now = new Date();
    const overdueTasks =
      allTasks?.filter(
        (t) => t.status === "pending" && new Date(t.deadline) < now
      ).length || 0;

    const stats: any = {
      total_tasks: totalTasks || 0,
      pending_tasks: pendingTasks,
      completed_tasks: completedTasks,
      verified_tasks: verifiedTasks,
      overdue_tasks: overdueTasks,
    };

    // Admin-only stats
    if (isAdmin) {
      // Count members
      const { count: memberCount } = await supabaseAdmin
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("house_group_id", userData.house_group_id);

      // Count pending requests
      const { count: requestCount } = await supabaseAdmin
        .from("task_requests")
        .select("*", { count: "exact", head: true })
        .eq("house_group_id", userData.house_group_id)
        .eq("status", "submitted");

      stats.total_members = memberCount || 0;
      stats.pending_requests = requestCount || 0;
    }

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
