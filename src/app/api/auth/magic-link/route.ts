import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMagicLinkEmail } from "@/lib/email";

/**
 * POST /api/auth/magic-link
 * Generates a magic link via Supabase Admin API and sends it via Resend.
 * Bypasses Supabase's built-in SMTP entirely.
 *
 * Flow:
 * 1. Admin API generates a hashed_token (no email sent by Supabase)
 * 2. We construct a verify URL: /auth/verify?token_hash=xxx&type=magiclink
 * 3. Resend sends the branded email with this link
 * 4. User clicks → /auth/verify page calls verifyOtp() → session created
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Use the request origin so links work on both localhost and production
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.startsWith("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    // Generate magic link via Supabase Admin API (no email sent by Supabase)
    const adminClient = createAdminClient();
    const { data, error: genError } =
      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    if (genError || !data?.properties?.hashed_token) {
      console.error("Generate link error:", genError);
      return NextResponse.json(
        { error: "Failed to generate sign-in link. Please try again." },
        { status: 500 }
      );
    }

    // Construct our own verify URL that the client-side page will handle
    const hashedToken = data.properties.hashed_token;
    const verifyUrl = `${baseUrl}/auth/verify?token_hash=${encodeURIComponent(hashedToken)}&type=magiclink`;

    // Send the email via Resend
    const { success, error: emailError } = await sendMagicLinkEmail(
      email,
      verifyUrl
    );

    if (!success) {
      console.error("Email send error:", emailError);
      return NextResponse.json(
        { error: "Failed to send sign-in email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Magic link route error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
