import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMagicLinkEmail } from "@/lib/email";
import { createRateLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const limiter = createRateLimiter({ windowMs: 60_000, max: 3 });

/**
 * POST /api/auth/magic-link
 * Generates a magic link via Supabase Admin API and sends it via Resend.
 * Bypasses Supabase's built-in SMTP entirely.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (limiter.isLimited(ip)) return rateLimitResponse();

    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Use hardcoded base URL to prevent host header injection
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.alexander-ip.com";

    // Generate magic link via Supabase Admin API (no email sent by Supabase)
    const adminClient = createAdminClient();
    const { data, error: genError } =
      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    if (genError || !data?.properties?.hashed_token) {
      console.error("Generate link error:", genError, "| email:", email);

      // Always return the same response to prevent user enumeration
      // (don't reveal whether the email exists in the system)
      return NextResponse.json({ success: true });
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
