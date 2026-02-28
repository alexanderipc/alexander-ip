/**
 * Email sending via Resend.
 * Used for magic link auth emails and project notifications.
 */
import { Resend } from "resend";
import type { ServiceType } from "@/lib/supabase/types";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Alexander IP <noreply@alexander-ip.com>";

export async function sendMagicLinkEmail(
  to: string,
  magicLinkUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Sign in to Alexander IP Portal",
      html: magicLinkHtml(magicLinkUrl),
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Email send failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown email error",
    };
  }
}

function magicLinkHtml(url: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:#0f1729;padding:36px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Alexander IP</h1>
              <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;font-weight:500;">Client Portal</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 40px;">
              <h2 style="margin:0 0 12px;color:#0f1729;font-size:22px;font-weight:700;">Sign in to your portal</h2>
              <p style="margin:0 0 32px;color:#334155;font-size:16px;line-height:1.6;">
                Tap the button below to securely access your project dashboard. This link expires in 1 hour.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${url}" style="height:56px;v-text-anchor:middle;width:280px;" arcsize="14%" fillcolor="#2563eb">
                      <center style="color:#ffffff;font-family:sans-serif;font-size:17px;font-weight:bold;">Sign in to Portal &rarr;</center>
                    </v:roundrect>
                    <![endif]-->
                    <a href="${url}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:17px;font-weight:700;padding:16px 48px;border-radius:10px;letter-spacing:0.2px;mso-hide:all;">
                      Sign in to Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:32px 0 0;color:#64748b;font-size:14px;line-height:1.5;">
                If you didn&rsquo;t request this, you can safely ignore this email.
              </p>
              <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;line-height:1.5;">
                Button not working? Copy this link into your browser:
              </p>
              <p style="margin:6px 0 0;word-break:break-all;color:#64748b;font-size:11px;line-height:1.5;background-color:#f8fafc;padding:10px 12px;border-radius:6px;">
                ${url}
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;background-color:#f8fafc;">
              <p style="margin:0;color:#64748b;font-size:13px;font-weight:500;">
                Alexander IP &mdash; Patent Drafting &amp; Prosecution
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ── Project Created Email ──────────────────────────────────── */

const SERVICE_LABELS: Record<ServiceType, string> = {
  consultation: "Patent Consultation",
  patent_search: "Patent Search",
  patent_drafting: "Patent Drafting",
  patent_prosecution: "Patent Prosecution",
  international_filing: "International Filing",
  fto: "FTO / Infringement Check",
  illustrations: "Patent Illustrations",
  filing: "Patent Filing",
  ip_valuation: "IP Valuation",
  custom: "Custom Project",
};

interface ProjectEmailData {
  title: string;
  serviceType: ServiceType;
  estimatedDelivery: string | null;
  portalUrl: string;
}

export async function sendProjectCreatedEmail(
  to: string,
  data: ProjectEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Your project is ready — ${data.title}`,
      html: projectCreatedHtml(data),
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Email send failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown email error",
    };
  }
}

/* ── Project Status Update Email ────────────────────────────── */

interface StatusUpdateEmailData {
  title: string;
  serviceType: ServiceType;
  newStatus: string;
  statusLabel: string;
  note: string | null;
  portalUrl: string;
}

export async function sendStatusUpdateEmail(
  to: string,
  data: StatusUpdateEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Project update — ${data.title}`,
      html: statusUpdateHtml(data),
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Email send failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown email error",
    };
  }
}

function statusUpdateHtml(data: StatusUpdateEmailData): string {
  const serviceLabel = SERVICE_LABELS[data.serviceType] || data.serviceType;
  const noteBlock = data.note
    ? `<p style="margin:0 0 28px;color:#334155;font-size:16px;line-height:1.6;">${data.note.replace(/\n/g, "<br>")}</p>`
    : "";

  const isComplete = data.newStatus === "complete";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:#0f1729;padding:36px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Alexander IP</h1>
              <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;font-weight:500;">Client Portal</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 40px;">
              <h2 style="margin:0 0 8px;color:#0f1729;font-size:22px;font-weight:700;">${isComplete ? "Your project is complete" : "Project update"}</h2>

              ${noteBlock}

              <!-- Status card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:0 0 6px;color:#64748b;font-size:14px;width:140px;">Project</td>
                        <td style="padding:0 0 6px;color:#0f1729;font-size:14px;font-weight:600;">${data.title}</td>
                      </tr>
                      <tr>
                        <td style="padding:0 0 6px;color:#64748b;font-size:14px;">Service</td>
                        <td style="padding:0 0 6px;color:#0f1729;font-size:14px;font-weight:600;">${serviceLabel}</td>
                      </tr>
                      <tr>
                        <td style="padding:0;color:#64748b;font-size:14px;">Status</td>
                        <td style="padding:0;">
                          <span style="display:inline-block;background-color:${isComplete ? "#dcfce7" : "#dbeafe"};color:${isComplete ? "#166534" : "#1e40af"};font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;">${data.statusLabel}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${data.portalUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:17px;font-weight:700;padding:16px 48px;border-radius:10px;letter-spacing:0.2px;">
                      View Your Project &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;background-color:#f8fafc;">
              <p style="margin:0;color:#64748b;font-size:13px;font-weight:500;">
                Alexander IP &mdash; Patent Drafting &amp; Prosecution
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ── Document Notification Email ───────────────────────────── */

interface DocumentEmailData {
  title: string;
  filename: string;
  portalUrl: string;
}

export async function sendDocumentUploadedEmail(
  to: string,
  data: DocumentEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `New document — ${data.title}`,
      html: documentUploadedHtml(data),
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Email send failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown email error",
    };
  }
}

function documentUploadedHtml(data: DocumentEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:#0f1729;padding:36px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Alexander IP</h1>
              <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;font-weight:500;">Client Portal</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 40px;">
              <h2 style="margin:0 0 12px;color:#0f1729;font-size:22px;font-weight:700;">New document available</h2>
              <p style="margin:0 0 28px;color:#334155;font-size:16px;line-height:1.6;">
                A new document has been uploaded to your project <strong>${data.title}</strong>.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0;color:#0f1729;font-size:14px;font-weight:600;">${data.filename}</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${data.portalUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:17px;font-weight:700;padding:16px 48px;border-radius:10px;letter-spacing:0.2px;">
                      View in Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;background-color:#f8fafc;">
              <p style="margin:0;color:#64748b;font-size:13px;font-weight:500;">
                Alexander IP &mdash; Patent Drafting &amp; Prosecution
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ── Project Created Email (HTML) ──────────────────────────── */

function projectCreatedHtml(data: ProjectEmailData): string {
  const serviceLabel = SERVICE_LABELS[data.serviceType] || data.serviceType;
  const deliveryLine = data.estimatedDelivery
    ? `<tr>
        <td style="padding:0 0 6px;color:#64748b;font-size:14px;width:140px;">Estimated delivery</td>
        <td style="padding:0 0 6px;color:#0f1729;font-size:14px;font-weight:600;">${new Date(data.estimatedDelivery).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</td>
       </tr>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:#0f1729;padding:36px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Alexander IP</h1>
              <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;font-weight:500;">Client Portal</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 40px;">
              <h2 style="margin:0 0 8px;color:#0f1729;font-size:22px;font-weight:700;">Your project is ready</h2>
              <p style="margin:0 0 28px;color:#334155;font-size:16px;line-height:1.6;">
                Thank you for your payment. Your project has been created and you can track its progress in your client portal.
              </p>

              <!-- Project details card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:0 0 6px;color:#64748b;font-size:14px;width:140px;">Project</td>
                        <td style="padding:0 0 6px;color:#0f1729;font-size:14px;font-weight:600;">${data.title}</td>
                      </tr>
                      <tr>
                        <td style="padding:0 0 6px;color:#64748b;font-size:14px;">Service</td>
                        <td style="padding:0 0 6px;color:#0f1729;font-size:14px;font-weight:600;">${serviceLabel}</td>
                      </tr>
                      ${deliveryLine}
                      <tr>
                        <td style="padding:0;color:#64748b;font-size:14px;">Status</td>
                        <td style="padding:0;">
                          <span style="display:inline-block;background-color:#dbeafe;color:#1e40af;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;">Payment Received</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${data.portalUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:17px;font-weight:700;padding:16px 48px;border-radius:10px;letter-spacing:0.2px;">
                      View Your Project &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;color:#64748b;font-size:14px;line-height:1.6;">
                You&rsquo;ll receive updates as your project progresses. You can check back any time at <a href="https://www.alexander-ip.com/auth/login" style="color:#2563eb;text-decoration:none;font-weight:500;">alexander-ip.com/auth/login</a>.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;background-color:#f8fafc;">
              <p style="margin:0;color:#64748b;font-size:13px;font-weight:500;">
                Alexander IP &mdash; Patent Drafting &amp; Prosecution
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
