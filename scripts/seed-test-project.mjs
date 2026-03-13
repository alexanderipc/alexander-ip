/**
 * Seed a test project + test client for E2E testing.
 * Run: node scripts/seed-test-project.mjs
 *
 * Creates:
 *  1. Auth user (or reuses existing) for the test email
 *  2. Profile row
 *  3. Project row
 *  4. project_members row (owner)
 *  5. Welcome message with markdown
 *  6. Prints a magic link URL to log in as the test client
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://syuzcmspaqiisuurpjix.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5dXpjbXNwYXFpaXN1dXJwaml4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjEzMzI5NiwiZXhwIjoyMDg3NzA5Mjk2fQ.HW0563Y0WUi8vzl3SN7afQHC_cX9bL90Xk35MGSkrRs";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_EMAIL = "ar12682@my.bristol.ac.uk";
const TEST_NAME = "Test Client";
const SITE_URL = "https://www.alexander-ip.com";

async function main() {
  // 1. Create or find the test user
  let userId;
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", TEST_EMAIL)
    .maybeSingle();

  if (existingProfile) {
    userId = existingProfile.id;
    console.log("Reusing existing user:", userId);
  } else {
    const { data: newUser, error: createErr } =
      await admin.auth.admin.createUser({
        email: TEST_EMAIL,
        email_confirm: true, // skip email verification
        user_metadata: { name: TEST_NAME },
      });
    if (createErr) throw new Error(`Create user failed: ${createErr.message}`);
    userId = newUser.user.id;
    console.log("Created new user:", userId);

    // Ensure profile row exists (trigger may handle this, but be safe)
    await admin.from("profiles").upsert({
      id: userId,
      email: TEST_EMAIL,
      name: TEST_NAME,
      role: "client",
    });
  }

  // 2. Find admin user (for welcome message sender)
  const { data: adminUser } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(1)
    .single();

  // 3. Create test project
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 30);

  const { data: project, error: projErr } = await admin
    .from("projects")
    .insert({
      title: "Test Patent Search — E2E Testing",
      description:
        "This is a test project for verifying portal functionality. Safe to delete.",
      service_type: "patent_search",
      status: "search_in_progress",
      client_id: userId,
      start_date: new Date().toISOString().split("T")[0],
      estimated_delivery_date: deliveryDate.toISOString().split("T")[0],
      default_timeline_days: 30,
      currency: "GBP",
      price_paid: 26400, // £264.00 in pence
    })
    .select()
    .single();

  if (projErr) throw new Error(`Create project failed: ${projErr.message}`);
  console.log("Created project:", project.id);

  // 4. Add project_members row
  const { error: memberErr } = await admin.from("project_members").insert({
    project_id: project.id,
    user_id: userId,
    role: "owner",
  });
  if (memberErr)
    console.warn("Member insert warning:", memberErr.message);

  // 5. Insert welcome message (with markdown to test rendering)
  if (adminUser) {
    const welcomeBody = [
      `Hi ${TEST_NAME.split(" ")[0]},`,
      "",
      `Welcome to your project portal for **Test Patent Search — E2E Testing**. I'm looking forward to working with you on this.`,
      "",
      "Here's how to get the most out of your portal:",
      "",
      "- **Documents** — Your VAT invoice is already in the Documents section. Upload any relevant files (invention descriptions, sketches, prior art, etc.) here too — it's the easiest way to share materials with me.",
      "- **Messages** — Use this chat to send me questions or additional information at any time. I'll respond as soon as I can.",
      "- **Progress updates** — You'll see updates in the feed on this page, and receive email notifications at key milestones.",
      "- **Notifications** — Toggle email alerts on or off using the bell icon on this page.",
      "",
      "If you have any questions at all, just drop me a message here.",
      "",
      "Best regards,",
      "Alex",
    ].join("\n");

    await admin.from("project_messages").insert({
      project_id: project.id,
      sender_id: adminUser.id,
      body: welcomeBody,
      is_admin: true,
    });
    console.log("Inserted welcome message");
  }

  // 6. Insert a payment-received update
  await admin.from("project_updates").insert({
    project_id: project.id,
    status_from: null,
    status_to: "payment_received",
    note: "Payment received.",
    notify_client: true,
  });

  // 7. Generate magic link
  const { data: linkData, error: linkErr } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email: TEST_EMAIL,
      options: {
        redirectTo: `${SITE_URL}/portal/projects/${project.id}`,
      },
    });

  if (linkErr) {
    console.error("Magic link error:", linkErr.message);
  } else {
    // Build the verify URL matching the app's auth flow (/auth/verify page)
    const tokenHash = linkData.properties?.hashed_token;
    const magicUrl = `${SITE_URL}/auth/verify?token_hash=${encodeURIComponent(tokenHash)}&type=magiclink`;
    console.log("\n========================================");
    console.log("TEST CLIENT LOGIN LINK:");
    console.log(magicUrl);
    console.log("========================================\n");
  }

  console.log("Done! Project ID:", project.id);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
