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

    // Create user via admin API (auto-confirms email)
    const { data: userData, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: name || "" },
      });

    if (createError) {
      console.error("[Signup] Create user error:", createError.message);

      // Don't reveal whether the email already exists
      if (
        createError.message.includes("already") ||
        createError.message.includes("duplicate")
      ) {
        return NextResponse.json(
          {
            error:
              "An account with this email may already exist. Try signing in instead.",
          },
          { status: 409 }
        );
      }

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

    // Insert profile (the trigger may have already done this, but upsert to be safe)
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert(
        {
          id: userData.user.id,
          email,
          name: name || null,
          role: "client",
        },
        { onConflict: "id" }
      );

    if (profileError) {
      console.error("[Signup] Profile upsert error:", profileError.message);
      // User was created, profile insert failed — not critical, trigger may handle it
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
