/**
 * GET /api/auth/microsoft/callback — Microsoft OAuth callback.
 * Exchanges the authorization code for tokens and stores them.
 * Requires admin auth + validates CSRF state parameter.
 */

import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/microsoft/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  // Verify caller is admin (prevents unauthenticated token injection)
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(
        new URL("/admin?microsoft_auth=not_authenticated", request.url)
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.redirect(
        new URL("/admin?microsoft_auth=not_authorized", request.url)
      );
    }
  } catch {
    return NextResponse.redirect(
      new URL("/admin?microsoft_auth=error", request.url)
    );
  }

  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  const state = request.nextUrl.searchParams.get("state");

  // Verify CSRF state matches cookie
  const storedState = request.cookies.get("microsoft_oauth_state")?.value;
  if (!state || !storedState || state !== storedState) {
    console.error("[Microsoft OAuth] State mismatch — possible CSRF attack");
    return NextResponse.redirect(
      new URL("/admin?microsoft_auth=invalid_state", request.url)
    );
  }

  if (error) {
    console.error("[Microsoft OAuth] Error:", error, request.nextUrl.searchParams.get("error_description"));
    const response = NextResponse.redirect(
      new URL("/admin?microsoft_auth=error", request.url)
    );
    response.cookies.delete("microsoft_oauth_state");
    return response;
  }

  if (!code) {
    const response = NextResponse.redirect(
      new URL("/admin?microsoft_auth=no_code", request.url)
    );
    response.cookies.delete("microsoft_oauth_state");
    return response;
  }

  try {
    await exchangeCodeForTokens(code);
    console.log("[Microsoft OAuth] Tokens stored successfully");
    const response = NextResponse.redirect(
      new URL("/admin?microsoft_auth=success", request.url)
    );
    response.cookies.delete("microsoft_oauth_state");
    return response;
  } catch (err) {
    console.error("[Microsoft OAuth] Token exchange failed:", err);
    const response = NextResponse.redirect(
      new URL("/admin?microsoft_auth=error", request.url)
    );
    response.cookies.delete("microsoft_oauth_state");
    return response;
  }
}
