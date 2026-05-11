/**
 * Email sending via Resend.
 * Used for magic link auth emails and project notifications.
 */
import { Resend } from "resend";
import type { ServiceType } from "@/lib/supabase/types";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Alexander IP <noreply@alexander-ip.com>";

/** Escape user-supplied text before interpolating into HTML emails */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendMagicLinkEmail(
  to: string,
  magicLinkUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Sign in to Alexander IP",
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
              <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;font-weight:500;">My Projects</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 40px;">
              <h2 style="margin:0 0 12px;color:#0f1729;font-size:22px;font-weight:700;">Sign in to your account</h2>
              <p style="margin:0 0 32px;color:#334155;font-size:16px;line-height:1.6;">
                Tap the button below to securely access your project dashboard. This link expires in 1 hour.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${url}" style="height:56px;v-text-anchor:middle;width:280px;" arcsize="14%" fillcolor="#2563eb">
                      <center style="color:#ffffff;font-family:sans-serif;font-size:17px;font-weight:bold;">Sign in &rarr;</center>
                    </v:roundrect>
                    <![endif]-->
                    <a href="${url}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:17px;font-weight:700;padding:16px 48px;border-radius:10px;letter-spacing:0.2px;mso-hide:all;">
                      Sign in &rarr;
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
                Alexander IP &mdash; Patent Drafting &amp; Office Correspondence
              </p>
              <p style="margin:6px 0 0;color:#94a3b8;font-size:11px;">
                <a href="https://www.alexander-ip.com/legal/privacy" style="color:#94a3b8;text-decoration:underline;">Privacy Policy</a>
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
  patent_prosecution: "Office Correspondence",
  international_filing: "International Filing",
  fto: "Infringement Check",
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
  unsubscribeUrl?: string;
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
    ? `<p style="margin:0 0 28px;color:#334155;font-size:16px;line-height:1.6;">${escapeHtml(data.note).replace(/\n/g, "<br>")}</p>`
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
              <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;font-weight:500;">My Projects</p>
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
                Alexander IP &mdash; Patent Drafting &amp; Office Correspondence
              </p>
              <p style="margin:6px 0 0;color:#94a3b8;font-size:11px;">
                ${data.unsubscribeUrl ? `<a href="${data.unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a> &bull; ` : ""}<a href="https://www.alexander-ip.com/legal/privacy" style="color:#94a3b8;text-decoration:underline;">Privacy Policy</a>
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
  unsubscribeUrl?: string;
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
              <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;font-weight:500;">My Projects</p>
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
                      View Document &rarr;
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
                Alexander IP &mdash; Patent Drafting &amp; Office Correspondence
              </p>
              <p style="margin:6px 0 0;color:#94a3b8;font-size:11px;">
                ${data.unsubscribeUrl ? `<a href="${data.unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a> &bull; ` : ""}<a href="https://www.alexander-ip.com/legal/privacy" style="color:#94a3b8;text-decoration:underline;">Privacy Policy</a>
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

/* ── New Message Notification Email ─────────────────────────── */

interface MessageEmailData {
  projectTitle: string;
  senderName: string;
  messagePreview: string;
  portalUrl: string;
  unsubscribeUrl?: string;
}

export async function sendNewMessageEmail(
  to: string,
  data: MessageEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `New message — ${data.projectTitle}`,
      html: newMessageHtml(data),
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

function newMessageHtml(data: MessageEmailData): string {
  // Truncate preview to 200 chars
  const preview =
    data.messagePreview.length > 200
      ? data.messagePreview.slice(0, 200) + "..."
      : data.messagePreview;

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
              <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;font-weight:500;">My Projects</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 40px;">
              <h2 style="margin:0 0 12px;color:#0f1729;font-size:22px;font-weight:700;">New message</h2>
              <p style="margin:0 0 8px;color:#64748b;font-size:14px;">
                <strong style="color:#0f1729;">${data.senderName}</strong> sent a message on <strong style="color:#0f1729;">${data.projectTitle}</strong>
              </p>

              <!-- Message preview -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;margin:20px 0 28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0;color:#334155;font-size:15px;line-height:1.6;font-style:italic;">${escapeHtml(preview).replace(/\n/g, "<br>")}</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${data.portalUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:17px;font-weight:700;padding:16px 48px;border-radius:10px;letter-spacing:0.2px;">
                      View &amp; Reply &rarr;
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
                Alexander IP &mdash; Patent Drafting &amp; Office Correspondence
              </p>
              <p style="margin:6px 0 0;color:#94a3b8;font-size:11px;">
                ${data.unsubscribeUrl ? `<a href="${data.unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a> &bull; ` : ""}<a href="https://www.alexander-ip.com/legal/privacy" style="color:#94a3b8;text-decoration:underline;">Privacy Policy</a>
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

/* ── Admin New Order Notification ──────────────────────────── */

const ADMIN_EMAIL = "alexanderip.contact@gmail.com";

interface AdminOrderData {
  clientName: string;
  clientEmail: string;
  title: string;
  serviceType: ServiceType;
  amount: number; // cents/pence
  currency: string;
  estimatedDelivery: string | null;
  projectId: string;
}

export async function sendAdminNewOrderEmail(
  data: AdminOrderData
): Promise<{ success: boolean; error?: string }> {
  try {
    const formattedAmount = (data.amount / 100).toLocaleString("en-US", {
      style: "currency",
      currency: data.currency,
    });

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      cc: "finance.alexanderipc@gmail.com",
      subject: `💰 New order: ${formattedAmount} — ${data.title}`,
      html: adminOrderHtml({ ...data, formattedAmount }),
    });

    if (error) {
      console.error("Resend error (admin notification):", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Admin notification email failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown email error",
    };
  }
}

function adminOrderHtml(
  data: AdminOrderData & { formattedAmount: string }
): string {
  const serviceLabel = SERVICE_LABELS[data.serviceType] || data.serviceType;
  const deliveryLine = data.estimatedDelivery
    ? `<tr>
        <td style="padding:6px 0;color:#64748b;font-size:14px;width:140px;">Delivery</td>
        <td style="padding:6px 0;color:#0f1729;font-size:14px;font-weight:600;">${new Date(data.estimatedDelivery).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</td>
       </tr>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
        <tr><td style="background-color:#16a34a;padding:28px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">New Order Received</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 4px;color:#0f1729;font-size:28px;font-weight:800;">${data.formattedAmount}</p>
          <p style="margin:0 0 24px;color:#64748b;font-size:14px;">from ${data.clientName}</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:24px;">
            <tr><td style="padding:16px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;color:#64748b;font-size:14px;width:140px;">Project</td>
                  <td style="padding:6px 0;color:#0f1729;font-size:14px;font-weight:600;">${data.title}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#64748b;font-size:14px;">Service</td>
                  <td style="padding:6px 0;color:#0f1729;font-size:14px;font-weight:600;">${serviceLabel}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#64748b;font-size:14px;">Client</td>
                  <td style="padding:6px 0;color:#0f1729;font-size:14px;font-weight:600;">${data.clientEmail}</td>
                </tr>
                ${deliveryLine}
              </table>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="https://www.alexander-ip.com/admin/projects/${data.projectId}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 40px;border-radius:10px;">
              View Project &rarr;
            </a>
          </td></tr></table>
        </td></tr>
      </table>
    </td></tr>
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
              <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;font-weight:500;">My Projects</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 40px;">
              <h2 style="margin:0 0 8px;color:#0f1729;font-size:22px;font-weight:700;">Your project is ready</h2>
              <p style="margin:0 0 28px;color:#334155;font-size:16px;line-height:1.6;">
                Thank you for your payment. Your project has been created and you can track its progress in your account. Your tax invoice is available in your project documents.
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
                Alexander IP &mdash; Patent Drafting &amp; Office Correspondence
              </p>
              <p style="margin:6px 0 0;color:#94a3b8;font-size:11px;">
                <a href="https://www.alexander-ip.com/legal/privacy" style="color:#94a3b8;text-decoration:underline;">Privacy Policy</a>
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

/* ── Explorer Waitlist Emails ──────────────────────────────── */

export async function sendWaitlistConfirmationEmail(
  to: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "You're on the list — Portfolio Explorer",
      html: waitlistConfirmationHtml(escapeHtml(name)),
    });

    if (error) {
      console.error("Resend error (waitlist confirmation):", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Waitlist confirmation email failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown email error",
    };
  }
}

export async function sendAdminWaitlistNotificationEmail(data: {
  name: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New Explorer waitlist sign-up: ${data.name}`,
      html: adminWaitlistHtml(data),
    });

    if (error) {
      console.error("Resend error (admin waitlist):", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Admin waitlist notification failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown email error",
    };
  }
}

function waitlistConfirmationHtml(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
        <tr><td style="background-color:#0f1729;padding:36px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Alexander IP</h1>
          <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;font-weight:500;">Portfolio Explorer</p>
        </td></tr>
        <tr><td style="padding:36px 32px 40px;">
          <h2 style="margin:0 0 8px;color:#0f1729;font-size:22px;font-weight:700;">You&rsquo;re on the list!</h2>
          <p style="margin:0 0 20px;color:#334155;font-size:16px;line-height:1.6;">
            Hi ${name}, thanks for your interest in the Portfolio Explorer. We&rsquo;ll let you know as soon as you can visualize your own patent portfolio.
          </p>
          <p style="margin:0 0 28px;color:#334155;font-size:16px;line-height:1.6;">
            In the meantime, you can explore our demo portfolio to see how patent families combine to define the shape of your protection.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="https://www.alexander-ip.com/explorer" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 40px;border-radius:10px;">
              Try the Demo &rarr;
            </a>
          </td></tr></table>
        </td></tr>
        <tr><td style="padding:0 32px 32px;text-align:center;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">Alexander IP Ltd &middot; <a href="https://www.alexander-ip.com/legal/privacy" style="color:#94a3b8;">Privacy Policy</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function adminWaitlistHtml(data: { name: string; email: string }): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
        <tr><td style="background-color:#2563eb;padding:28px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">New Waitlist Sign-up</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:24px;">
            <tr><td style="padding:16px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;color:#64748b;font-size:14px;width:100px;">Name</td>
                  <td style="padding:6px 0;color:#0f1729;font-size:14px;font-weight:600;">${escapeHtml(data.name)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#64748b;font-size:14px;">Email</td>
                  <td style="padding:6px 0;color:#0f1729;font-size:14px;font-weight:600;">${escapeHtml(data.email)}</td>
                </tr>
              </table>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="https://www.alexander-ip.com/admin/waitlist" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 40px;border-radius:10px;">
              View Waitlist &rarr;
            </a>
          </td></tr></table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ── Free Intro Call: Confirmation to lead + admin notify ────── */

interface BookingEmailData {
  leadName: string;
  leadEmail: string;
  stageLabel: string | null;
  topic: string | null;
  ukDateLabel: string; // e.g. "Tuesday, 5 May 2026"
  ukTimeLabel: string; // e.g. "10:30"
  meetUrl: string | null;
  hostEmail: string;
}

export async function sendBookingConfirmationToLead(
  data: BookingEmailData
): Promise<void> {
  try {
    const meetBlock = data.meetUrl
      ? `<p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">A calendar invite with the Google Meet link will land in your inbox separately. You can also join directly here:</p>
         <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
           <a href="${data.meetUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 36px;border-radius:10px;">Join Google Meet &rarr;</a>
         </td></tr></table>
         <p style="margin:18px 0 0;word-break:break-all;color:#94a3b8;font-size:11px;">Link: ${data.meetUrl}</p>`
      : `<p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">I&rsquo;ll send a calendar invite with the Google Meet link to <strong>${escapeHtml(data.leadEmail)}</strong> shortly.</p>`;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.leadEmail,
      replyTo: data.hostEmail,
      subject: `Confirmed — intro call ${data.ukDateLabel} at ${data.ukTimeLabel} UK`,
      html: `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
        <tr><td style="background-color:#0f1729;padding:36px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Alexander IP</h1>
          <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;font-weight:500;">Intro Call Confirmed</p>
        </td></tr>
        <tr><td style="padding:36px 32px 40px;">
          <h2 style="margin:0 0 12px;color:#0f1729;font-size:22px;font-weight:700;">See you ${escapeHtml(data.ukDateLabel)}</h2>
          <p style="margin:0 0 20px;color:#334155;font-size:16px;line-height:1.6;">Hi ${escapeHtml(data.leadName)}, your free 15-minute intro call is locked in.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:6px 0;color:#64748b;font-size:14px;width:120px;">When</td><td style="padding:6px 0;color:#0f1729;font-size:14px;font-weight:600;">${escapeHtml(data.ukDateLabel)}</td></tr>
                <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Time</td><td style="padding:6px 0;color:#0f1729;font-size:14px;font-weight:600;">${escapeHtml(data.ukTimeLabel)} UK time (15 min)</td></tr>
                ${data.stageLabel ? `<tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Stage</td><td style="padding:6px 0;color:#0f1729;font-size:14px;font-weight:600;">${escapeHtml(data.stageLabel)}</td></tr>` : ""}
                ${data.topic ? `<tr><td style="padding:6px 0;color:#64748b;font-size:14px;vertical-align:top;">Topic</td><td style="padding:6px 0;color:#0f1729;font-size:14px;font-weight:600;">${escapeHtml(data.topic)}</td></tr>` : ""}
              </table>
            </td></tr>
          </table>
          ${meetBlock}
          <p style="margin:28px 0 0;color:#64748b;font-size:14px;line-height:1.6;">Need to reschedule? Just reply to this email and I&rsquo;ll sort it.</p>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;background-color:#f8fafc;">
          <p style="margin:0;color:#64748b;font-size:13px;font-weight:500;">Alexander IP &mdash; Patent Drafting &amp; Office Correspondence</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    });
  } catch (err) {
    console.error("Booking confirmation email failed:", err);
  }
}

export async function sendBookingNotificationToAdmin(
  data: BookingEmailData & {
    leadId: string;
    googleConfigured: boolean;
    googleError: string | null;
  }
): Promise<void> {
  try {
    let statusMsg: string;
    if (data.meetUrl) {
      statusMsg = "✅ Google Calendar event created — invite sent automatically.";
    } else if (data.googleError) {
      statusMsg = `❌ Google event creation FAILED — send invite manually. Error: ${escapeHtml(data.googleError)}`;
    } else if (!data.googleConfigured) {
      statusMsg =
        "⚠️ Google env vars not set in Vercel — send a calendar invite manually. (Check GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN are present in Production env and the deployment was redeployed after adding them.)";
    } else {
      statusMsg = "⚠️ Google call returned no event — send a calendar invite manually.";
    }

    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `📞 New intro call: ${data.ukDateLabel} ${data.ukTimeLabel} — ${data.leadName}`,
      html: `
<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#f1f5f9;padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <h2 style="color:#0f1729;margin:0 0 8px;font-size:20px;">📞 New intro call booked</h2>
    <p style="color:#64748b;margin:0 0 20px;font-size:14px;">${statusMsg}</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
      <tr><td style="padding:12px 16px;color:#64748b;font-size:13px;width:120px;">When</td><td style="padding:12px 16px;color:#0f1729;font-size:13px;font-weight:600;">${escapeHtml(data.ukDateLabel)} at ${escapeHtml(data.ukTimeLabel)} UK</td></tr>
      <tr><td style="padding:12px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Lead</td><td style="padding:12px 16px;color:#0f1729;font-size:13px;font-weight:600;border-top:1px solid #e2e8f0;">${escapeHtml(data.leadName)} &lt;${escapeHtml(data.leadEmail)}&gt;</td></tr>
      ${data.stageLabel ? `<tr><td style="padding:12px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Stage</td><td style="padding:12px 16px;color:#0f1729;font-size:13px;font-weight:600;border-top:1px solid #e2e8f0;">${escapeHtml(data.stageLabel)}</td></tr>` : ""}
      ${data.topic ? `<tr><td style="padding:12px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;vertical-align:top;">Topic</td><td style="padding:12px 16px;color:#0f1729;font-size:13px;border-top:1px solid #e2e8f0;white-space:pre-wrap;">${escapeHtml(data.topic)}</td></tr>` : ""}
      ${data.meetUrl ? `<tr><td style="padding:12px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Meet link</td><td style="padding:12px 16px;border-top:1px solid #e2e8f0;"><a href="${data.meetUrl}" style="color:#2563eb;font-size:13px;">${data.meetUrl}</a></td></tr>` : ""}
    </table>
    <p style="color:#94a3b8;margin:20px 0 0;font-size:12px;">Booking ID: ${escapeHtml(data.leadId)}</p>
  </div>
</body></html>`,
    });
  } catch (err) {
    console.error("Admin booking notification failed:", err);
  }
}

/* ── Paid Consultation: Confirmation to lead + admin notify ───── */

interface ConsultationBookingEmailData {
  leadName: string;
  leadEmail: string;
  stageLabel: string | null;
  topic: string | null;
  ukDateLabel: string;
  ukTimeLabel: string;
  durationMinutes: number;
  meetUrl: string | null;
  hostEmail: string;
}

export async function sendConsultationBookingConfirmationToLead(
  data: ConsultationBookingEmailData
): Promise<void> {
  try {
    const meetBlock = data.meetUrl
      ? `<p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">A calendar invite with the Google Meet link will land in your inbox separately. You can also join directly here:</p>
         <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
           <a href="${data.meetUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 36px;border-radius:10px;">Join Google Meet &rarr;</a>
         </td></tr></table>
         <p style="margin:18px 0 0;word-break:break-all;color:#94a3b8;font-size:11px;">Link: ${data.meetUrl}</p>`
      : `<p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">I&rsquo;ll send a calendar invite with the Google Meet link to <strong>${escapeHtml(data.leadEmail)}</strong> shortly.</p>`;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.leadEmail,
      replyTo: data.hostEmail,
      subject: `Confirmed — patent consultation ${data.ukDateLabel} at ${data.ukTimeLabel} UK`,
      html: `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
        <tr><td style="background-color:#0f1729;padding:36px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Alexander IP</h1>
          <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;font-weight:500;">Patent Consultation Confirmed</p>
        </td></tr>
        <tr><td style="padding:36px 32px 40px;">
          <h2 style="margin:0 0 12px;color:#0f1729;font-size:22px;font-weight:700;">See you ${escapeHtml(data.ukDateLabel)}</h2>
          <p style="margin:0 0 20px;color:#334155;font-size:16px;line-height:1.6;">Hi ${escapeHtml(data.leadName)}, your ${data.durationMinutes}-minute patent consultation is locked in. Payment received — invoice will follow separately.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:6px 0;color:#64748b;font-size:14px;width:120px;">When</td><td style="padding:6px 0;color:#0f1729;font-size:14px;font-weight:600;">${escapeHtml(data.ukDateLabel)}</td></tr>
                <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Time</td><td style="padding:6px 0;color:#0f1729;font-size:14px;font-weight:600;">${escapeHtml(data.ukTimeLabel)} UK time (${data.durationMinutes} min)</td></tr>
                ${data.stageLabel ? `<tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Stage</td><td style="padding:6px 0;color:#0f1729;font-size:14px;font-weight:600;">${escapeHtml(data.stageLabel)}</td></tr>` : ""}
                ${data.topic ? `<tr><td style="padding:6px 0;color:#64748b;font-size:14px;vertical-align:top;">Topic</td><td style="padding:6px 0;color:#0f1729;font-size:14px;font-weight:600;">${escapeHtml(data.topic)}</td></tr>` : ""}
              </table>
            </td></tr>
          </table>
          ${meetBlock}
          <p style="margin:28px 0 0;color:#64748b;font-size:14px;line-height:1.6;">Need to reschedule? Just reply to this email and I&rsquo;ll sort it. Full refund if I can&rsquo;t provide value during the consultation.</p>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;background-color:#f8fafc;">
          <p style="margin:0;color:#64748b;font-size:13px;font-weight:500;">Alexander IP &mdash; Patent Drafting &amp; Office Correspondence</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    });
  } catch (err) {
    console.error("Consultation booking confirmation email failed:", err);
  }
}

export async function sendConsultationBookingNotificationToAdmin(
  data: ConsultationBookingEmailData & {
    bookingId: string;
    projectId: string;
    googleConfigured: boolean;
    googleError: string | null;
  }
): Promise<void> {
  try {
    let statusMsg: string;
    if (data.meetUrl) {
      statusMsg = "✅ Google Calendar event created — invite sent automatically.";
    } else if (data.googleError) {
      statusMsg = `❌ Google event creation FAILED — send invite manually. Error: ${escapeHtml(data.googleError)}`;
    } else if (!data.googleConfigured) {
      statusMsg = "⚠️ Google env vars not set — send a calendar invite manually.";
    } else {
      statusMsg = "⚠️ Google call returned no event — send a calendar invite manually.";
    }

    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `💼 Paid consultation booked: ${data.ukDateLabel} ${data.ukTimeLabel} — ${data.leadName}`,
      html: `
<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#f1f5f9;padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <h2 style="color:#0f1729;margin:0 0 8px;font-size:20px;">💼 Paid consultation booked</h2>
    <p style="color:#64748b;margin:0 0 20px;font-size:14px;">${statusMsg}</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
      <tr><td style="padding:12px 16px;color:#64748b;font-size:13px;width:120px;">When</td><td style="padding:12px 16px;color:#0f1729;font-size:13px;font-weight:600;">${escapeHtml(data.ukDateLabel)} at ${escapeHtml(data.ukTimeLabel)} UK (${data.durationMinutes} min)</td></tr>
      <tr><td style="padding:12px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Lead</td><td style="padding:12px 16px;color:#0f1729;font-size:13px;font-weight:600;border-top:1px solid #e2e8f0;">${escapeHtml(data.leadName)} &lt;${escapeHtml(data.leadEmail)}&gt;</td></tr>
      ${data.stageLabel ? `<tr><td style="padding:12px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Stage</td><td style="padding:12px 16px;color:#0f1729;font-size:13px;font-weight:600;border-top:1px solid #e2e8f0;">${escapeHtml(data.stageLabel)}</td></tr>` : ""}
      ${data.topic ? `<tr><td style="padding:12px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;vertical-align:top;">Topic</td><td style="padding:12px 16px;color:#0f1729;font-size:13px;border-top:1px solid #e2e8f0;white-space:pre-wrap;">${escapeHtml(data.topic)}</td></tr>` : ""}
      ${data.meetUrl ? `<tr><td style="padding:12px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Meet link</td><td style="padding:12px 16px;border-top:1px solid #e2e8f0;"><a href="${data.meetUrl}" style="color:#2563eb;font-size:13px;">${data.meetUrl}</a></td></tr>` : ""}
    </table>
    <p style="color:#94a3b8;margin:20px 0 0;font-size:12px;">Booking ID: ${escapeHtml(data.bookingId)} · Project ID: ${escapeHtml(data.projectId)}</p>
  </div>
</body></html>`,
    });
  } catch (err) {
    console.error("Admin consultation booking notification failed:", err);
  }
}

/* ── Quote Request: Send saved package to client ─────────────── */

interface QuoteEmailData {
  total: string;
  complexityName: string;
  extrasNames: string[];
  timelineName: string | null;
  timelineDays: number | null;
  resumeUrl: string;
}

export async function sendQuoteEmail(
  to: string,
  data: QuoteEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Your patent drafting quote — ${data.total}`,
      html: quoteEmailHtml(data),
    });
    if (error) {
      console.error("Resend error (quote email):", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error("Quote email failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown email error",
    };
  }
}

function quoteEmailHtml(data: QuoteEmailData): string {
  const extrasRows = data.extrasNames.length
    ? data.extrasNames
        .map(
          (n) =>
            `<tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Add-on</td><td style="padding:6px 0;color:#0f1729;font-size:14px;font-weight:600;">${escapeHtml(n)}</td></tr>`
        )
        .join("")
    : "";
  const timelineRow =
    data.timelineName && data.timelineDays
      ? `<tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Delivery</td><td style="padding:6px 0;color:#0f1729;font-size:14px;font-weight:600;">${escapeHtml(data.timelineName)} &mdash; ${data.timelineDays} days</td></tr>`
      : "";

  return `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
        <tr><td style="background-color:#0f1729;padding:36px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Alexander IP</h1>
          <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;font-weight:500;">Your Saved Quote</p>
        </td></tr>
        <tr><td style="padding:36px 32px 40px;">
          <h2 style="margin:0 0 12px;color:#0f1729;font-size:22px;font-weight:700;">Here&rsquo;s your patent drafting quote</h2>
          <p style="margin:0 0 24px;color:#334155;font-size:16px;line-height:1.6;">
            Thanks for configuring a package. Click below to come straight back to your quote &mdash; everything you selected will be pre-filled.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;color:#64748b;font-size:14px;width:140px;">Complexity</td>
                  <td style="padding:6px 0;color:#0f1729;font-size:14px;font-weight:600;">${escapeHtml(data.complexityName)}</td>
                </tr>
                ${extrasRows}
                ${timelineRow}
                <tr><td colspan="2" style="padding:14px 0 0;border-top:1px solid #e2e8f0;margin-top:8px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
                    <tr>
                      <td style="color:#64748b;font-size:14px;">Total</td>
                      <td align="right" style="color:#0f1729;font-size:22px;font-weight:800;">${escapeHtml(data.total)}</td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="${data.resumeUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:17px;font-weight:700;padding:16px 48px;border-radius:10px;letter-spacing:0.2px;">
              Resume &amp; Order &rarr;
            </a>
          </td></tr></table>

          <p style="margin:28px 0 0;color:#64748b;font-size:14px;line-height:1.6;">
            Quotes are honoured for 30 days. Questions? Just reply to this email &mdash; you&rsquo;ll reach me directly.
          </p>
          <p style="margin:18px 0 0;color:#94a3b8;font-size:12px;line-height:1.5;">
            Resume link: <span style="word-break:break-all;">${data.resumeUrl}</span>
          </p>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;background-color:#f8fafc;">
          <p style="margin:0;color:#64748b;font-size:13px;font-weight:500;">Alexander IP &mdash; Patent Drafting &amp; Office Correspondence</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/* ── Quote Request: Notify admin of new lead ─────────────────── */

interface AdminQuoteData {
  clientEmail: string;
  total: string;
  complexityName: string;
  extrasNames: string[];
  timelineName: string | null;
  timelineDays: number | null;
}

export async function sendAdminQuoteRequestEmail(
  data: AdminQuoteData
): Promise<void> {
  try {
    const extrasLine = data.extrasNames.length
      ? data.extrasNames.join(", ")
      : "(none)";
    const timelineLine =
      data.timelineName && data.timelineDays
        ? `${data.timelineName} (${data.timelineDays} days)`
        : "—";

    const html = `
<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#f1f5f9;padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <h2 style="color:#0f1729;margin:0 0 8px;font-size:20px;">📨 New quote requested</h2>
    <p style="color:#64748b;margin:0 0 20px;font-size:14px;">A site visitor saved their package and asked for it by email. Hot lead.</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
      <tr><td style="padding:12px 16px;color:#64748b;font-size:13px;width:140px;">Email</td><td style="padding:12px 16px;color:#0f1729;font-size:13px;font-weight:600;">${escapeHtml(data.clientEmail)}</td></tr>
      <tr><td style="padding:12px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Complexity</td><td style="padding:12px 16px;color:#0f1729;font-size:13px;font-weight:600;border-top:1px solid #e2e8f0;">${escapeHtml(data.complexityName)}</td></tr>
      <tr><td style="padding:12px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Add-ons</td><td style="padding:12px 16px;color:#0f1729;font-size:13px;font-weight:600;border-top:1px solid #e2e8f0;">${escapeHtml(extrasLine)}</td></tr>
      <tr><td style="padding:12px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Delivery</td><td style="padding:12px 16px;color:#0f1729;font-size:13px;font-weight:600;border-top:1px solid #e2e8f0;">${escapeHtml(timelineLine)}</td></tr>
      <tr><td style="padding:12px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Total quoted</td><td style="padding:12px 16px;color:#16a34a;font-size:16px;font-weight:800;border-top:1px solid #e2e8f0;">${escapeHtml(data.total)}</td></tr>
    </table>
    <p style="color:#64748b;margin:20px 0 0;font-size:13px;">Consider following up directly — the quote includes a resume link valid for 30 days.</p>
  </div>
</body></html>`;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `📨 Quote request: ${data.total} — ${data.clientEmail}`,
      html,
    });
  } catch (err) {
    console.error("Admin quote notification failed:", err);
  }
}

/* ── Checkout Error Alert (admin-only) ───────────────────────── */

interface CheckoutErrorData {
  service: string;
  customAmount: number | null;
  currency: string | null;
  description: string | null;
  errorMessage: string;
  detectedCountry: string | null;
  userAgent: string | null;
}

export async function sendCheckoutErrorAlert(
  data: CheckoutErrorData
): Promise<void> {
  try {
    const subject = `🚨 Checkout failure: ${data.service}`;
    const amountStr =
      data.customAmount && data.currency
        ? `${(data.customAmount / 100).toFixed(2)} ${data.currency.toUpperCase()}`
        : "n/a";

    const html = `
<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#f1f5f9;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <h2 style="color:#dc2626;margin:0 0 16px;font-size:20px;">Checkout failure</h2>
    <p style="color:#334155;margin:0 0 16px;">A user attempted to start a Stripe checkout but it failed before redirect. They likely saw the generic "Something went wrong" error.</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:0;">
      <tr><td style="padding:12px 16px;color:#64748b;font-size:13px;width:140px;">Service</td><td style="padding:12px 16px;color:#0f1729;font-size:13px;font-weight:600;">${escapeHtml(data.service)}</td></tr>
      <tr><td style="padding:12px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Amount</td><td style="padding:12px 16px;color:#0f1729;font-size:13px;font-weight:600;border-top:1px solid #e2e8f0;">${escapeHtml(amountStr)}</td></tr>
      <tr><td style="padding:12px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Country (Vercel)</td><td style="padding:12px 16px;color:#0f1729;font-size:13px;font-weight:600;border-top:1px solid #e2e8f0;">${escapeHtml(data.detectedCountry || "unknown")}</td></tr>
      <tr><td style="padding:12px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">User agent</td><td style="padding:12px 16px;color:#0f1729;font-size:12px;border-top:1px solid #e2e8f0;word-break:break-all;">${escapeHtml(data.userAgent || "unknown")}</td></tr>
      ${data.description ? `<tr><td style="padding:12px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;vertical-align:top;">Description</td><td style="padding:12px 16px;color:#0f1729;font-size:12px;border-top:1px solid #e2e8f0;white-space:pre-wrap;">${escapeHtml(data.description)}</td></tr>` : ""}
    </table>
    <p style="color:#64748b;margin:20px 0 8px;font-size:13px;font-weight:600;">Error</p>
    <pre style="background:#fef2f2;color:#991b1b;border:1px solid #fecaca;border-radius:6px;padding:12px;font-size:12px;white-space:pre-wrap;word-break:break-word;margin:0;">${escapeHtml(data.errorMessage)}</pre>
    <p style="color:#94a3b8;margin:24px 0 0;font-size:12px;">Check Vercel logs for the full stack trace and Stripe dashboard for any related events.</p>
  </div>
</body></html>`;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject,
      html,
    });
  } catch (err) {
    console.error("Failed to send checkout error alert:", err);
  }
}

/* ── Custom Offer Email ──────────────────────────────────────── */

interface OfferEmailData {
  clientName: string | null;
  title: string;
  description: string | null;
  serviceType: ServiceType;
  formattedAmount: string;
  timelineDays: number | null;
  offerUrl: string;
  officialFeesLine?: string | null;
  coverFeeLine?: string | null;
}

export async function sendOfferEmail(
  to: string,
  data: OfferEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `You have a new offer from Alexander IP — ${data.title}`,
      html: offerHtml(data),
    });

    if (error) {
      console.error("Resend error (offer):", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Offer email failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown email error",
    };
  }
}

function offerHtml(data: OfferEmailData): string {
  const serviceLabel = SERVICE_LABELS[data.serviceType] || data.serviceType;
  const greeting = data.clientName ? `Hi ${escapeHtml(data.clientName)},` : "Hi,";
  const descBlock = data.description
    ? `<p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">${escapeHtml(data.description).replace(/\n/g, "<br>")}</p>`
    : "";
  const timelineLine = data.timelineDays
    ? `<tr>
        <td style="padding:6px 0;color:#64748b;font-size:14px;width:140px;">Timeline</td>
        <td style="padding:6px 0;color:#0f1729;font-size:14px;font-weight:600;">${data.timelineDays} days</td>
       </tr>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background-color:#0f1729;padding:36px 32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Alexander IP</h1>
            <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;font-weight:500;">Custom Offer</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 32px 40px;">
            <p style="margin:0 0 8px;color:#334155;font-size:16px;line-height:1.6;">${greeting}</p>
            <h2 style="margin:0 0 16px;color:#0f1729;font-size:22px;font-weight:700;">You have a custom offer</h2>

            ${descBlock}

            <!-- Offer details card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;color:#64748b;font-size:14px;width:140px;">Project</td>
                      <td style="padding:6px 0;color:#0f1729;font-size:14px;font-weight:600;">${escapeHtml(data.title)}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#64748b;font-size:14px;">Service</td>
                      <td style="padding:6px 0;color:#0f1729;font-size:14px;font-weight:600;">${serviceLabel}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#64748b;font-size:14px;">Professional Fees</td>
                      <td style="padding:6px 0;color:#0f1729;font-size:20px;font-weight:800;">${data.formattedAmount}</td>
                    </tr>
                    ${data.officialFeesLine ? `<tr>
                      <td colspan="2" style="padding:6px 0;color:#0f1729;font-size:14px;font-weight:600;">${escapeHtml(data.officialFeesLine)}</td>
                    </tr>` : ""}
                    ${data.coverFeeLine ? `<tr>
                      <td colspan="2" style="padding:6px 0;color:#0f1729;font-size:14px;font-weight:600;">${escapeHtml(data.coverFeeLine)}</td>
                    </tr>` : ""}
                    ${timelineLine}
                  </table>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
              <a href="${data.offerUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:17px;font-weight:700;padding:16px 48px;border-radius:10px;letter-spacing:0.2px;">
                View Offer &amp; Pay &rarr;
              </a>
            </td></tr></table>

            <p style="margin:28px 0 0;color:#64748b;font-size:14px;line-height:1.5;">
              Once payment is processed your project will be created automatically and you&rsquo;ll receive access to your project dashboard.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;background-color:#f8fafc;">
            <p style="margin:0;color:#64748b;font-size:13px;font-weight:500;">
              Alexander IP &mdash; Patent Drafting &amp; Office Correspondence
            </p>
            <p style="margin:6px 0 0;color:#94a3b8;font-size:11px;">
              <a href="https://www.alexander-ip.com/legal/privacy" style="color:#94a3b8;text-decoration:underline;">Privacy Policy</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ── Free Intro Call: Approval-flow emails ───────────────────── */

interface BookingRequestEmailData {
  leadName: string;
  leadEmail: string;
  stageLabel: string | null;
  topic: string | null;
  ukDateLabel: string;
  ukTimeLabel: string;
  hostEmail: string;
}

/**
 * Sent to the lead the moment they submit a booking request.
 * Sets the expectation that approval is needed before a Meet link is issued.
 */
export async function sendBookingRequestReceivedToLead(
  data: BookingRequestEmailData
): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.leadEmail,
      replyTo: data.hostEmail,
      subject: `Call request received — ${data.ukDateLabel} ${data.ukTimeLabel} UK`,
      html: `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
        <tr><td style="background-color:#0f1729;padding:36px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Alexander IP</h1>
          <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;font-weight:500;">Call request received</p>
        </td></tr>
        <tr><td style="padding:36px 32px 40px;">
          <h2 style="margin:0 0 12px;color:#0f1729;font-size:22px;font-weight:700;">Thanks, ${escapeHtml(data.leadName)} &mdash; I&rsquo;ll be in touch shortly</h2>
          <p style="margin:0 0 20px;color:#334155;font-size:16px;line-height:1.6;">
            I&rsquo;ve received your request and will review it personally. You&rsquo;ll hear back from me within one working day &mdash; usually much sooner.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 10px;color:#64748b;font-size:12px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Your requested slot</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:6px 0;color:#64748b;font-size:14px;width:120px;">When</td><td style="padding:6px 0;color:#0f1729;font-size:14px;font-weight:600;">${escapeHtml(data.ukDateLabel)}</td></tr>
                <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Time</td><td style="padding:6px 0;color:#0f1729;font-size:14px;font-weight:600;">${escapeHtml(data.ukTimeLabel)} UK (15 min)</td></tr>
                ${data.stageLabel ? `<tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Stage</td><td style="padding:6px 0;color:#0f1729;font-size:14px;font-weight:600;">${escapeHtml(data.stageLabel)}</td></tr>` : ""}
                ${data.topic ? `<tr><td style="padding:6px 0;color:#64748b;font-size:14px;vertical-align:top;">Topic</td><td style="padding:6px 0;color:#0f1729;font-size:14px;font-weight:600;">${escapeHtml(data.topic)}</td></tr>` : ""}
              </table>
            </td></tr>
          </table>
          <p style="margin:0 0 12px;color:#334155;font-size:15px;line-height:1.6;">
            <strong style="color:#0f1729;">What happens next:</strong>
          </p>
          <ul style="margin:0 0 24px;padding-left:20px;color:#334155;font-size:15px;line-height:1.7;">
            <li>I review your request to make sure it&rsquo;s something I can usefully help with.</li>
            <li>If yes, you&rsquo;ll receive a calendar invite with the Google Meet link, and the slot is locked in.</li>
            <li>If I&rsquo;m not the right fit, I&rsquo;ll let you know why &mdash; usually with a pointer to a better resource.</li>
          </ul>
          <p style="margin:0;color:#64748b;font-size:14px;line-height:1.6;">
            Reply to this email if you want to add anything to your request.
          </p>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;background-color:#f8fafc;">
          <p style="margin:0;color:#64748b;font-size:13px;font-weight:500;">Alexander IP &mdash; Patent Drafting &amp; Office Correspondence</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    });
  } catch (err) {
    console.error("Booking request-received email failed:", err);
  }
}

/**
 * Sent to admin when a new pending intro-call request arrives.
 * Distinct from `sendBookingNotificationToAdmin` (which was for the old
 * auto-confirm flow) — this one calls out that approval is required.
 */
export async function sendBookingRequestNotificationToAdmin(data: {
  leadName: string;
  leadEmail: string;
  stageLabel: string | null;
  topic: string | null;
  ukDateLabel: string;
  ukTimeLabel: string;
  leadId: string;
}): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `📞 NEW REQUEST — ${data.ukDateLabel} ${data.ukTimeLabel} — ${data.leadName}`,
      html: `
<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#f1f5f9;padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <h2 style="color:#0f1729;margin:0 0 8px;font-size:20px;">📞 New intro call request</h2>
    <p style="color:#b45309;margin:0 0 20px;font-size:14px;background:#fef3c7;padding:10px 14px;border-radius:8px;border-left:3px solid #f59e0b;">
      ⚠️ Pending your approval. No calendar event has been created yet and the lead has NOT been sent a Meet link.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
      <tr><td style="padding:12px 16px;color:#64748b;font-size:13px;width:120px;">When</td><td style="padding:12px 16px;color:#0f1729;font-size:13px;font-weight:600;">${escapeHtml(data.ukDateLabel)} at ${escapeHtml(data.ukTimeLabel)} UK</td></tr>
      <tr><td style="padding:12px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Lead</td><td style="padding:12px 16px;color:#0f1729;font-size:13px;font-weight:600;border-top:1px solid #e2e8f0;">${escapeHtml(data.leadName)} &lt;${escapeHtml(data.leadEmail)}&gt;</td></tr>
      ${data.stageLabel ? `<tr><td style="padding:12px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Stage</td><td style="padding:12px 16px;color:#0f1729;font-size:13px;font-weight:600;border-top:1px solid #e2e8f0;">${escapeHtml(data.stageLabel)}</td></tr>` : ""}
      ${data.topic ? `<tr><td style="padding:12px 16px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;vertical-align:top;">Topic</td><td style="padding:12px 16px;color:#0f1729;font-size:13px;border-top:1px solid #e2e8f0;white-space:pre-wrap;">${escapeHtml(data.topic)}</td></tr>` : ""}
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr><td align="center">
      <a href="https://www.alexander-ip.com/admin/bookings" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:12px 32px;border-radius:8px;">
        Review &amp; Decide &rarr;
      </a>
    </td></tr></table>
    <p style="color:#94a3b8;margin:20px 0 0;font-size:12px;">Request ID: ${escapeHtml(data.leadId)}</p>
  </div>
</body></html>`,
    });
  } catch (err) {
    console.error("Admin pending-request notification failed:", err);
  }
}

/**
 * Sent to the lead when admin rejects the intro-call request.
 * The reason is shown back to them verbatim (after HTML-escaping).
 */
export async function sendBookingRejectedToLead(data: {
  leadName: string;
  leadEmail: string;
  ukDateLabel: string;
  ukTimeLabel: string;
  reason: string;
  hostEmail: string;
}): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.leadEmail,
      replyTo: data.hostEmail,
      subject: `About your intro call request — Alexander IP`,
      html: `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
        <tr><td style="background-color:#0f1729;padding:32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Alexander IP</h1>
          <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;font-weight:500;">About your call request</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;color:#0f1729;font-size:16px;line-height:1.6;">Hi ${escapeHtml(data.leadName)},</p>
          <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">
            Thank you for requesting an intro call (${escapeHtml(data.ukDateLabel)} at ${escapeHtml(data.ukTimeLabel)} UK). Unfortunately, I&rsquo;m not going to be able to take this one. Here&rsquo;s why:
          </p>
          <div style="margin:0 0 20px;padding:16px 20px;background:#f8fafc;border-left:3px solid #2563eb;border-radius:6px;color:#0f1729;font-size:15px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(data.reason)}</div>
          <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">
            I want to be upfront rather than have us both spend 15 minutes finding this out on a call. If circumstances change and a future call would be a better fit, you&rsquo;re welcome to book again any time.
          </p>
          <p style="margin:0 0 0;color:#334155;font-size:15px;line-height:1.7;">
            All the best,<br>
            Alexander
          </p>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;background-color:#f8fafc;">
          <p style="margin:0;color:#64748b;font-size:12px;font-weight:500;">Alexander IP &mdash; Patent Drafting &amp; Office Correspondence</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    });
  } catch (err) {
    console.error("Booking rejection email failed:", err);
  }
}
