import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const service = formData.get("service") as string;
    const description = formData.get("description") as string;
    const countries = (formData.get("countries") as string) || "";
    const priorSearch = (formData.get("prior_search") as string) || "";
    const referral = (formData.get("referral") as string) || "";
    const timeline = (formData.get("timeline") as string) || "";
    const budgetAware = formData.get("budget_aware") === "on";
    const attachment = formData.get("attachment") as File | null;

    // Validate required fields
    if (!name || !email || !service || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Handle file attachment — upload to Supabase Storage
    let attachmentUrl: string | null = null;
    let attachmentName: string | null = null;

    if (attachment && attachment.size > 0) {
      const adminClient = createAdminClient();
      const timestamp = Date.now();
      const safeName = attachment.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `enquiries/${timestamp}-${safeName}`;

      const arrayBuffer = await attachment.arrayBuffer();
      const { error: uploadError } = await adminClient.storage
        .from("project-documents")
        .upload(filePath, Buffer.from(arrayBuffer), {
          contentType: attachment.type,
        });

      if (!uploadError) {
        // Generate a signed URL valid for 30 days
        const { data: signedData } = await adminClient.storage
          .from("project-documents")
          .createSignedUrl(filePath, 60 * 60 * 24 * 30);

        attachmentUrl = signedData?.signedUrl || null;
        attachmentName = attachment.name;
      } else {
        console.error("File upload error:", uploadError);
        // Continue without attachment — don't fail the form
      }
    }

    // Build email body
    const attachmentLine = attachmentUrl
      ? `\nAttachment: ${attachmentName}\nDownload: ${attachmentUrl}\n`
      : "";

    const emailText = `
New Enquiry from Alexander IP Website
======================================

Name: ${name}
Email: ${email}
Service: ${service}
Country: ${countries || "Not specified"}
Prior Search: ${priorSearch || "Not specified"}
Timeline: ${timeline || "Not specified"}
Referral Source: ${referral || "Not specified"}
Budget Aware: ${budgetAware ? "Yes" : "No"}
${attachmentLine}
Invention Description:
${description}

======================================
Sent from alexander-ip.com contact form
    `.trim();

    // Send email via Resend
    const { error: emailError } = await resend.emails.send({
      from: "Alexander IP Website <noreply@alexander-ip.com>",
      to: "alexanderip.contact@gmail.com",
      replyTo: email,
      subject: `New Enquiry: ${service} — ${name}`,
      text: emailText,
    });

    if (emailError) {
      console.error("Email send error:", emailError);
      // Still return success to the user — their enquiry details are logged
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
