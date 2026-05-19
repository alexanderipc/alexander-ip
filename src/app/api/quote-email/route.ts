import { NextRequest, NextResponse } from "next/server";
import { sendQuoteEmail, sendAdminQuoteRequestEmail } from "@/lib/email";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const limiter = createRateLimiter({ windowMs: 60_000, max: 3 });

interface QuoteRequest {
  email?: string;
  total?: string;
  complexityName?: string;
  extrasNames?: string[];
  timelineName?: string | null;
  timelineDays?: number | null;
  resumeUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (limiter.isLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = (await request.json()) as QuoteRequest;

    const email = (body.email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const total = String(body.total || "").slice(0, 40);
    const complexityName = String(body.complexityName || "").slice(0, 80);
    const extrasNames = Array.isArray(body.extrasNames)
      ? body.extrasNames
          .filter((s): s is string => typeof s === "string")
          .map((s) => s.slice(0, 80))
          .slice(0, 10)
      : [];
    const timelineName = body.timelineName ? String(body.timelineName).slice(0, 40) : null;
    const timelineDays =
      typeof body.timelineDays === "number" && body.timelineDays > 0
        ? Math.min(365, Math.floor(body.timelineDays))
        : null;
    const resumeUrl = String(body.resumeUrl || "").slice(0, 500);

    if (!total || !complexityName || !resumeUrl) {
      return NextResponse.json({ error: "Missing required quote data" }, { status: 400 });
    }

    // Only allow our own domain in the resume URL
    if (!resumeUrl.startsWith("https://www.alexander-ip.com/") && !resumeUrl.startsWith("https://alexander-ip.com/")) {
      return NextResponse.json({ error: "Invalid resume URL" }, { status: 400 });
    }

    const clientResult = await sendQuoteEmail(email, {
      total,
      complexityName,
      extrasNames,
      timelineName,
      timelineDays,
      resumeUrl,
    });

    if (!clientResult.success) {
      return NextResponse.json(
        { error: "Failed to send quote email. Please try again." },
        { status: 500 }
      );
    }

    // Fire-and-forget admin notification
    void sendAdminQuoteRequestEmail({
      clientEmail: email,
      total,
      complexityName,
      extrasNames,
      timelineName,
      timelineDays,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Quote email error:", error);
    return NextResponse.json(
      { error: "Failed to send quote email." },
      { status: 500 }
    );
  }
}
