/**
 * GET /api/auth/microsoft — Initiates Microsoft OAuth flow.
 * Admin-only. Redirects to Microsoft login with OneDrive scopes.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function GET() {
  // Verify caller is admin
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Auth check failed" }, { status: 500 });
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Microsoft OAuth not configured" },
      { status: 500 }
    );
  }

  // Generate CSRF state token and store in httpOnly cookie
  const state = crypto.randomBytes(32).toString("hex");

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "Files.ReadWrite offline_access",
    response_mode: "query",
    state,
  });

  const authUrl = `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?${params.toString()}`;

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("microsoft_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
