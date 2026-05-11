/**
 * One-off cleanup: delete the three Claude QA test projects on production,
 * their storage files, and the test client auth users.
 *
 * Run: node --env-file=.env.local scripts/cleanup-claude-qa-test-projects.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://syuzcmspaqiisuurpjix.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_PROJECT_IDS = [
  "a8cba252-ec3e-41aa-8615-527e731d09dd", // #37 drafting (old HTML welcome)
  "416e4604-6e4b-4802-bedf-f5f67032fffe", // patent_search (old HTML welcome)
  "26318ce5-16ee-4185-966e-d80f7344de53", // drafting (new friendly welcome)
];

const TEST_CLIENT_EMAILS = [
  "claudeqa-drafting-test@alexander-ip.com",
  "claudeqa-search-test@alexander-ip.com",
  "claudeqa-revised-test@alexander-ip.com",
];

async function main() {
  // 1. Storage cleanup — list and delete every file under each test projectId/
  for (const pid of TEST_PROJECT_IDS) {
    const { data: files, error: listErr } = await supabase.storage
      .from("project-documents")
      .list(pid, { limit: 1000 });
    if (listErr) {
      console.warn(`[storage] list failed for ${pid}:`, listErr.message);
      continue;
    }
    if (!files || files.length === 0) {
      console.log(`[storage] no files under ${pid}/`);
      continue;
    }
    const paths = files.map((f) => `${pid}/${f.name}`);
    const { error: rmErr } = await supabase.storage
      .from("project-documents")
      .remove(paths);
    if (rmErr) {
      console.warn(`[storage] remove failed for ${pid}:`, rmErr.message);
    } else {
      console.log(`[storage] removed ${paths.length} file(s) under ${pid}/`);
    }
  }

  // 2. Delete projects — should cascade to project_messages, project_documents,
  //    project_updates, project_members via existing ON DELETE CASCADE FKs.
  const { data: deletedProjects, error: projErr } = await supabase
    .from("projects")
    .delete()
    .in("id", TEST_PROJECT_IDS)
    .select("id, title");
  if (projErr) {
    console.error("[projects] delete failed:", projErr.message);
  } else {
    console.log(`[projects] deleted ${deletedProjects?.length ?? 0} row(s):`);
    for (const p of deletedProjects ?? []) {
      console.log(`  - ${p.id}  ${p.title}`);
    }
  }

  // 3. Delete auth users (test clients). Look up each by email.
  const { data: usersList, error: usersErr } =
    await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (usersErr) {
    console.error("[auth] listUsers failed:", usersErr.message);
    return;
  }
  for (const email of TEST_CLIENT_EMAILS) {
    const u = usersList.users.find((x) => x.email === email);
    if (!u) {
      console.log(`[auth] no user found for ${email}`);
      continue;
    }
    const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
    if (delErr) {
      console.warn(`[auth] delete failed for ${email}:`, delErr.message);
    } else {
      console.log(`[auth] deleted ${email}  (id=${u.id})`);
    }
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
