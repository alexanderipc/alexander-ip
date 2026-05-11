/**
 * One-off: cancel Rahmatullah's intro call.
 *
 * What this does:
 *  1. Looks up his booking row in lead_call_bookings
 *  2. Sends him a polite Resend email explaining the reason
 *  3. Updates the row to status='cancelled'
 *
 * What this does NOT do (you must do this yourself):
 *  - Delete the Google Calendar event. Open Google Calendar, find the
 *    "Intro call — Alexander IP & Rahmatullah" event at 10:00 on Tue 12 May,
 *    click Delete, and choose "Send update to guests". That triggers Google's
 *    auto-cancellation email.
 *
 * Run: node --env-file=.env.local scripts/cancel-rahmatullah.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const LEAD_EMAIL = "rahmatullahshahbazi5@gmail.com";
const LEAD_NAME = "Rahmatullah";
const FROM_EMAIL = "Alexander IP <noreply@alexander-ip.com>";
const REPLY_TO = "alexanderip.contact@gmail.com";

const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://syuzcmspaqiisuurpjix.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
if (!RESEND_KEY) {
  console.error("Missing RESEND_API_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const resend = new Resend(RESEND_KEY);

const EMAIL_HTML = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
        <tr><td style="background-color:#0f1729;padding:32px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Alexander IP</h1>
          <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;font-weight:500;">About your intro call</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;color:#0f1729;font-size:16px;line-height:1.6;">Hi Rahmatullah,</p>
          <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">
            Thank you for booking an intro call with me for Tuesday 12 May. I'm writing to let you know I have to cancel it, and I want to be upfront about why.
          </p>
          <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">
            From what you described, it sounds like you're looking for help <strong>building</strong> a device &mdash; the engineering and physical construction side. That's outside what I can offer. I'm a patent attorney, not an engineer: my work is the legal protection of an invention <em>after</em> it exists (drafting patent applications, dealing with patent offices), not designing, prototyping, or making the device itself.
          </p>
          <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">
            If you do reach the point where you have a working prototype and you'd like to protect it with a patent, you'd be very welcome to book again. But for the building / engineering side, you'd be better off speaking with a mechanical or electronics engineer.
          </p>
          <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">
            I'm sorry I can't help directly on this one, and I wish you the very best of luck with the project.
          </p>
          <p style="margin:24px 0 0;color:#0f1729;font-size:15px;line-height:1.6;">
            All the best,<br>
            Alexander Rowley<br>
            <span style="color:#64748b;font-size:13px;">Alexander IP</span>
          </p>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;background-color:#f8fafc;">
          <p style="margin:0;color:#64748b;font-size:12px;font-weight:500;">Alexander IP &mdash; Patent Drafting &amp; Office Correspondence</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

async function main() {
  console.log("Looking up booking row for", LEAD_EMAIL, "...");
  const { data: rows, error: lookupErr } = await supabase
    .from("lead_call_bookings")
    .select("id, lead_name, lead_email, scheduled_at, status, google_event_id")
    .eq("lead_email", LEAD_EMAIL);

  if (lookupErr) {
    console.error("DB lookup failed:", lookupErr.message);
    process.exit(1);
  }
  if (!rows || rows.length === 0) {
    console.error("No booking found for that email.");
    process.exit(1);
  }

  console.log("Found", rows.length, "row(s):");
  for (const r of rows) {
    console.log(
      `  - id=${r.id}  status=${r.status}  scheduled_at=${r.scheduled_at}  gcal=${r.google_event_id ?? "<none>"}`
    );
  }

  const target = rows.find((r) => r.status === "booked") ?? rows[0];
  console.log("\nTarget row:", target.id);
  console.log("Sending cancellation email via Resend...");

  const { data: sent, error: sendErr } = await resend.emails.send({
    from: FROM_EMAIL,
    to: LEAD_EMAIL,
    replyTo: REPLY_TO,
    subject: "About your intro call on Tuesday — Alexander IP",
    html: EMAIL_HTML,
  });

  if (sendErr) {
    console.error("Resend failed:", sendErr);
    process.exit(1);
  }
  console.log("Email sent. Resend id:", sent?.id);

  console.log("Updating DB status to 'cancelled'...");
  const { error: updateErr } = await supabase
    .from("lead_call_bookings")
    .update({ status: "cancelled" })
    .eq("id", target.id);
  if (updateErr) {
    console.error("DB update failed:", updateErr.message);
    process.exit(1);
  }
  console.log("DB row updated.");

  console.log("\n----------");
  console.log("DONE — email sent and booking marked cancelled.");
  console.log("\nNEXT STEP (manual):");
  console.log("  1. Open Google Calendar");
  console.log('  2. Find the "Intro call — Alexander IP & Rahmatullah" event');
  console.log("     on Tuesday 12 May at 10:00 UK");
  console.log('  3. Click Delete → "Send update to guests"');
  console.log("  4. Google will email him an auto-cancellation notice");
  console.log("----------");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
