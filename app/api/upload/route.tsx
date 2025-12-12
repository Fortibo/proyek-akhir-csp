// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  try {
    // Guard: ensure service role key is configured server-side.
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error(
        "[upload] SUPABASE_SERVICE_ROLE_KEY not set (server misconfiguration)."
      );
      return new NextResponse(
        JSON.stringify({
          success: false,
          error:
            "Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY is not set.",
        }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    // Read cookie token (session) — don't log token contents
    const token = request.cookies.get("sb-access-token")?.value;
    if (!token) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: "Unauthorized: missing session token",
        }),
        {
          status: 401,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    // Validate user via supabaseAdmin.auth.getUser
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) {
      console.error(
        "[upload] auth.getUser failed:",
        authError?.message ?? authError
      );
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: "Invalid token / unauthorized",
        }),
        {
          status: 401,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }
    const user = authData.user;
    console.log(`[upload] incoming upload request from user.id=${user.id}`);

    // Parse form
    const formData = await request.formData();
    const file = formData.get("file") as Blob | null;
    const bucket = (formData.get("bucket") as string) || "task-proofs";

    console.log("[upload] target bucket:", bucket);

    if (!file) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "No file provided" }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    const fileType = (file as any).type || "application/octet-stream";
    const arrayBuffer = await file.arrayBuffer();
    const fileSize = arrayBuffer.byteLength;
    if (!fileType.startsWith("image/")) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "File must be an image" }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }
    if (fileSize > 5 * 1024 * 1024) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: "File size must be less than 5MB",
        }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    const origName = (file as any).name || "upload";
    const ext = origName.toString().split(".").pop() || "jpg";
    const fileName = `${user.id}-${Date.now()}.${ext}`;

    // Convert to Buffer (Node runtime). This relies on Node Buffer existing in dev server.
    const buffer = Buffer.from(arrayBuffer);

    // Attempt upload using supabaseAdmin exported from lib/supabase (as requested)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, buffer, { contentType: fileType, upsert: false });

    if (uploadError) {
      console.error("[upload] uploadError:", uploadError);
      if (
        (uploadError as any)?.status === 404 ||
        (uploadError as any)?.statusCode === "404"
      ) {
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: `Bucket "${bucket}" not found.`,
          }),
          {
            status: 400,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          }
        );
      }
      if (
        (uploadError as any)?.status === 403 ||
        (uploadError as any)?.status === 401
      ) {
        return new NextResponse(
          JSON.stringify({
            success: false,
            error:
              "Storage access denied. Check service role key / permissions.",
          }),
          {
            status: 403,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          }
        );
      }
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: "Failed to upload file",
          details: uploadError,
        }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    // Public or signed URL
    const { data: publicData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(fileName);
    let url: any = publicData?.publicUrl ?? null;
    if (!url) {
      try {
        const { data: signed } = await supabaseAdmin.storage
          .from(bucket)
          .createSignedUrl(fileName, 60 * 60);
        url = signed?.signedUrl ?? null;
      } catch (e) {
        console.warn(
          "[upload] createSignedUrl failed:",
          (e as any)?.message ?? e
        );
      }
    }

    return new NextResponse(
      JSON.stringify({
        success: true,
        data: { path: uploadData?.path ?? null, url },
        message: "File uploaded successfully",
      }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("[upload] unhandled exception:", err);
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: "Server error",
        details: err?.message ?? String(err),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
