import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth callback — exchanges the code from a magic link for a session.
 * Supabase redirects here after the user clicks the magic link in their email.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "/portal";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user is admin → redirect to /admin instead
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "admin") {
          return NextResponse.redirect(new URL("/admin", origin));
        }
      }

      return NextResponse.redirect(new URL(redirect, origin));
    }
  }

  // If code exchange fails, redirect to login with error
  return NextResponse.redirect(
    new URL("/auth/login?error=auth_failed", origin)
  );
}
