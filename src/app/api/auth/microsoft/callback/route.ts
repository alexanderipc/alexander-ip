/**
 * GET /api/auth/microsoft/callback — Microsoft OAuth callback.
 * Exchanges the authorization code for tokens and stores them.
 */

import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/microsoft/auth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    console.error("[Microsoft OAuth] Error:", error, request.nextUrl.searchParams.get("error_description"));
    return NextResponse.redirect(
      new URL("/admin?microsoft_auth=error", request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/admin?microsoft_auth=no_code", request.url)
    );
  }

  try {
    await exchangeCodeForTokens(code);
    console.log("[Microsoft OAuth] Tokens stored successfully");
    return NextResponse.redirect(
      new URL("/admin?microsoft_auth=success", request.url)
    );
  } catch (err) {
    console.error("[Microsoft OAuth] Token exchange failed:", err);
    return NextResponse.redirect(
      new URL("/admin?microsoft_auth=error", request.url)
    );
  }
}
