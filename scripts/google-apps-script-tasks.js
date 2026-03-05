/**
 * Google Apps Script: Alexander IP — Auto-create Google Tasks from order emails
 *
 * HOW TO SET UP:
 * 1. Go to https://script.google.com
 * 2. Create a new project, name it "Alexander IP Tasks"
 * 3. Paste this entire file into Code.gs
 * 4. Click the ⏰ clock icon (Triggers) in the left sidebar
 * 5. Click "+ Add Trigger"
 *    - Function: processNewOrderEmails
 *    - Event source: Time-driven
 *    - Type: Minutes timer
 *    - Interval: Every 5 minutes
 * 6. Click Save, authorize the permissions when prompted
 * 7. Done! New orders will auto-create tasks with delivery deadlines.
 *
 * OPTIONAL: Run createLabel() once manually to create the Gmail label.
 *
 * NOTE: The Tasks API must be enabled:
 * 1. In the Apps Script editor, click "Services" (+ icon) in the left sidebar
 * 2. Scroll to "Tasks API" and click Add
 */

// ── Configuration ──────────────────────────────────────────────
const CONFIG = {
  // Gmail search query for new order emails
  SEARCH_QUERY: 'from:noreply@alexander-ip.com subject:"New order" -label:tasks-created',

  // Gmail label to mark processed emails (prevents re-processing)
  PROCESSED_LABEL: "tasks-created",

  // Google Tasks list name (uses default "@default" task list)
  // Change to a specific list name if you want a separate list
  TASK_LIST: "@default",
};

// ── Main function (runs on schedule) ───────────────────────────

function processNewOrderEmails() {
  // Ensure the processed label exists
  let label = GmailApp.getUserLabelByName(CONFIG.PROCESSED_LABEL);
  if (!label) {
    label = GmailApp.createLabel(CONFIG.PROCESSED_LABEL);
  }

  // Search for unprocessed order emails
  const threads = GmailApp.search(CONFIG.SEARCH_QUERY, 0, 20);

  if (threads.length === 0) {
    Logger.log("No new order emails found.");
    return;
  }

  Logger.log(`Found ${threads.length} new order email(s).`);

  for (const thread of threads) {
    try {
      const messages = thread.getMessages();
      const message = messages[messages.length - 1]; // Latest message in thread

      const subject = message.getSubject();
      const body = message.getBody(); // HTML body

      // Extract data from email
      const projectTitle = extractProjectTitle(body) || extractTitleFromSubject(subject);
      const deliveryDate = extractDeliveryDate(body);
      const amount = extractAmountFromSubject(subject);
      const clientEmail = extractClientEmail(body);

      if (!projectTitle) {
        Logger.log(`Skipping email — couldn't extract project title: ${subject}`);
        thread.addLabel(label); // Still mark as processed
        continue;
      }

      // Build task title
      let taskTitle = `📋 ${projectTitle}`;
      if (amount) {
        taskTitle = `📋 ${projectTitle} (${amount})`;
      }

      // Build task notes
      const notes = [];
      notes.push(`Auto-created from Alexander IP order email`);
      if (clientEmail) notes.push(`Client: ${clientEmail}`);
      if (amount) notes.push(`Amount: ${amount}`);
      notes.push(`Email date: ${message.getDate().toLocaleDateString("en-GB")}`);
      notes.push(`\nAdmin link: https://www.alexander-ip.com/admin`);

      // Create the Google Task
      const task = {
        title: taskTitle,
        notes: notes.join("\n"),
      };

      if (deliveryDate) {
        // Google Tasks API expects RFC 3339 date
        task.due = formatDateRFC3339(deliveryDate);
        Logger.log(`Creating task: "${taskTitle}" due ${task.due}`);
      } else {
        Logger.log(`Creating task: "${taskTitle}" (no delivery date)`);
      }

      Tasks.Tasks.insert(task, CONFIG.TASK_LIST);

      // Mark email as processed
      thread.addLabel(label);
      Logger.log(`✅ Task created for: ${projectTitle}`);

    } catch (err) {
      Logger.log(`❌ Error processing thread: ${err.message}`);
      // Don't label it — will retry next run
    }
  }
}

// ── Parsing helpers ────────────────────────────────────────────

/**
 * Extract project title from the email HTML body.
 * Looks for the "Project" row in the details table.
 */
function extractProjectTitle(html) {
  // Match the table row: <td>Project</td><td>TITLE</td>
  const match = html.match(
    /Project<\/td>\s*<td[^>]*>([^<]+)<\/td>/i
  );
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}

/**
 * Fallback: extract title from subject line.
 * Subject format: "💰 New order: $3,390.00 — Patent Drafting Package..."
 */
function extractTitleFromSubject(subject) {
  // Remove emoji and amount, get text after the em dash
  const match = subject.match(/—\s*(.+)$/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return subject;
}

/**
 * Extract delivery date from email HTML.
 * Looks for the "Delivery" row with date like "11 March 2026"
 */
function extractDeliveryDate(html) {
  // Match: <td>Delivery</td><td>11 March 2026</td>
  const match = html.match(
    /Delivery<\/td>\s*<td[^>]*>(\d{1,2}\s+\w+\s+\d{4})<\/td>/i
  );
  if (match && match[1]) {
    const parsed = new Date(match[1]);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return null;
}

/**
 * Extract the monetary amount from the subject line.
 * Subject format: "💰 New order: $3,390.00 — ..."
 */
function extractAmountFromSubject(subject) {
  const match = subject.match(/:\s*([£$€][\d,]+\.?\d*)/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

/**
 * Extract the client email from the email HTML body.
 * Looks for the "Client" row in the details table.
 */
function extractClientEmail(html) {
  const match = html.match(
    /Client<\/td>\s*<td[^>]*>([^<]+)<\/td>/i
  );
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}

/**
 * Format a Date as RFC 3339 date string for Google Tasks API.
 * Tasks API wants: "2026-03-11T00:00:00.000Z"
 */
function formatDateRFC3339(date) {
  return date.toISOString();
}

// ── One-time setup helpers ─────────────────────────────────────

/**
 * Run this once to create the Gmail label.
 * (Also auto-created on first run of processNewOrderEmails)
 */
function createLabel() {
  const existing = GmailApp.getUserLabelByName(CONFIG.PROCESSED_LABEL);
  if (existing) {
    Logger.log(`Label "${CONFIG.PROCESSED_LABEL}" already exists.`);
  } else {
    GmailApp.createLabel(CONFIG.PROCESSED_LABEL);
    Logger.log(`Created label "${CONFIG.PROCESSED_LABEL}".`);
  }
}

/**
 * Run this to test with the most recent order email without creating a task.
 * Shows what would be extracted.
 */
function testExtraction() {
  const threads = GmailApp.search('from:noreply@alexander-ip.com subject:"New order"', 0, 1);

  if (threads.length === 0) {
    Logger.log("No order emails found to test with.");
    return;
  }

  const message = threads[0].getMessages()[0];
  const subject = message.getSubject();
  const body = message.getBody();

  Logger.log("Subject: " + subject);
  Logger.log("Project title: " + (extractProjectTitle(body) || "NOT FOUND"));
  Logger.log("Title from subject: " + extractTitleFromSubject(subject));
  Logger.log("Delivery date: " + (extractDeliveryDate(body) || "NOT FOUND"));
  Logger.log("Amount: " + (extractAmountFromSubject(subject) || "NOT FOUND"));
  Logger.log("Client email: " + (extractClientEmail(body) || "NOT FOUND"));
}
