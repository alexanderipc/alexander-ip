import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

const limiter = createRateLimiter({ windowMs: 60_000, max: 5 });

/**
 * POST /api/auth/signup
 * Creates a new client account with email + password.
 * Uses admin API to create user with email_confirm: true (auto-confirmed).
 * Inserts a profile record with role "client".
 *
 * SECURITY: If the email already exists, returns a generic success response
 * without modifying the existing account. This prevents account takeover
 * and avoids leaking whether an email is registered.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (limiter.isLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { email, password, name } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Check if the user already exists (e.g. created via magic link or Stripe checkout)
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      // SECURITY: Never update an existing user's password through signup.
      // Return generic success to avoid revealing whether the email exists.
      // Users who need a password should use the magic-link or reset flow.
      console.log("[Signup] Existing account, no-op:", email);
      return NextResponse.json({ success: true });
    }

    // New user — create via admin API (auto-confirms email)
    const { data: userData, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: name || "" },
      });

    if (createError) {
      // Supabase returns "User already registered" if an auth user exists
      // but had no profile row. Return generic success to avoid info leak.
      if (createError.message?.toLowerCase().includes("already registered")) {
        console.log("[Signup] Auth user exists without profile, no-op:", email);
        return NextResponse.json({ success: true });
      }
      console.error("[Signup] Create user error:", createError.message);
      return NextResponse.json(
        { error: "Failed to create account. Please try again." },
        { status: 500 }
      );
    }

    if (!userData.user) {
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    const userId = userData.user.id;

    // Insert profile (trigger may have already created it, but ensure name is set)
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert(
        {
          id: userId,
          email,
          name: name || null,
          role: "client",
        },
        { onConflict: "id" }
      );

    if (profileError) {
      console.error("[Signup] Profile upsert error:", profileError.message);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Signup] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
