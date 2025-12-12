import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase public env vars (NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY)");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

if (!supabaseServiceRoleKey) {
    // Don't throw here to allow client-side code to import `supabase`, but warn for server-only admin usage.
    console.warn("SUPABASE_SERVICE_ROLE_KEY is not set. Server admin features will fail.");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey || "", {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

export function handleSupabaseError(error: any) {
    console.error("Supabase Error: ", error);
    return {
        error: error?.message || "An unknown error occurred",
        details: error || null,
    };
}