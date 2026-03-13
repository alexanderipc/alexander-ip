import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/auth/signup
 * Creates a new client account with email + password.
 * Uses admin API to create user with email_confirm: true (auto-confirmed).
 * Inserts a profile record with role "client".
 */
export async function POST(request: NextRequest) {
  try {
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

    let userId: string;

    if (existingProfile) {
      // Existing user — set their password (allows returning clients to create a password)
      const { error: updateError } =
        await adminClient.auth.admin.updateUserById(existingProfile.id, {
          password,
          email_confirm: true,
          user_metadata: { name: name || undefined },
        });

      if (updateError) {
        console.error("[Signup] Update password error:", updateError.message);
        return NextResponse.json(
          { error: "Failed to set password. Please try again." },
          { status: 500 }
        );
      }

      userId = existingProfile.id;
    } else {
      // New user — create via admin API (auto-confirms email)
      const { data: userData, error: createError } =
        await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name: name || "" },
        });

      if (createError) {
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

      userId = userData.user.id;
    }

    // Upsert profile (trigger may have already created it, but ensure name is set)
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert(
        {
          id: userId,
          email,
          name: name || null,
          role: existingProfile ? undefined : "client",
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
