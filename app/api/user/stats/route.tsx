// app/api/user/stats/route.ts
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

    // Fetch all user's tasks
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from("tasks")
      .select("status")
      .eq("assigned_to", user.id);

    if (tasksError) {
      console.error("Tasks fetch error:", tasksError);
    }

    const stats = {
      total_tasks: tasks?.length || 0,
      completed_tasks:
        tasks?.filter(
          (t) => t.status === "completed" || t.status === "verified"
        ).length || 0,
      verified_tasks: tasks?.filter((t) => t.status === "verified").length || 0,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error("Get stats error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
