import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const { name, email, country, service, description, referral, timeline, budget_aware } = data;

    // Validate required fields
    if (!name || !email || !service || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Format the email body
    const emailBody = `
New Enquiry from Alexander IP Website
======================================

Name: ${name}
Email: ${email}
Country: ${country || "Not specified"}
Service: ${service}
Timeline: ${timeline || "Not specified"}
Referral Source: ${referral || "Not specified"}
Budget Aware: ${budget_aware ? "Yes" : "No"}

Invention Description:
${description}

======================================
Sent from alexander-ip.com contact form
    `.trim();

    // TODO: Integrate with email provider (Resend, SendGrid, etc.)
    // For now, log to console in development
    console.log("New contact form submission:");
    console.log(emailBody);

    // When Resend is configured, uncomment:
    // const { Resend } = await import('resend');
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'Alexander IP Website <noreply@alexander-ip.com>',
    //   to: 'hello@alexander-ip.com',
    //   replyTo: email,
    //   subject: `New Enquiry: ${service} — ${name}`,
    //   text: emailBody,
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
