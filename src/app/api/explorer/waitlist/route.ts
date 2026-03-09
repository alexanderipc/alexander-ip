import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendWaitlistConfirmationEmail,
  sendAdminWaitlistNotificationEmail,
} from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from("explorer_waitlist")
      .insert({ name: name.trim(), email: email.trim().toLowerCase() });

    if (error) {
      // Unique constraint violation — email already on waitlist
      if (error.code === "23505") {
        return NextResponse.json({
          success: true,
          message: "You're already on the waitlist! We'll be in touch soon.",
        });
      }
      console.error("[Waitlist] Insert error:", error);
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }

    // Fire emails (non-blocking — don't fail the response if emails fail)
    Promise.all([
      sendWaitlistConfirmationEmail(email.trim().toLowerCase(), name.trim()),
      sendAdminWaitlistNotificationEmail({
        name: name.trim(),
        email: email.trim().toLowerCase(),
      }),
    ]).catch((err) => console.error("[Waitlist] Email error:", err));

    return NextResponse.json({
      success: true,
      message: "You're on the list! Check your email for confirmation.",
    });
  } catch (err) {
    console.error("[Waitlist] Error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
