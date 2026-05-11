/**
 * Per-service welcome content + auto-attached guidance docs.
 *
 * For patent_drafting + patent_search projects, every new project gets a
 * tailored HTML welcome message with the matching Invention Disclosure
 * Guidance .docx attached. For other service types we fall back to the
 * pre-existing markdown welcome text (no attachment).
 *
 * Implementation notes:
 *  - Guidance .docx files live in `templates/` at the repo root and are
 *    bundled with the deployment.
 *  - On project creation we copy the file into the project's Supabase
 *    Storage bucket and create a project_documents row, so the guidance
 *    also shows up in the Documents tab alongside the message attachment.
 *  - Welcome HTML is sanitized-friendly (no inline styles, no events,
 *    tags only from the DOMPurify allowlist).
 */
import { promises as fs } from "fs";
import path from "path";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MessageAttachment } from "@/components/chat/Attachment";

interface GuidanceTemplate {
  filename: string;
  /** Path inside the repo's `templates/` directory. */
  templatePath: string;
  mimeType: string;
}

const GUIDANCE: Record<string, GuidanceTemplate> = {
  patent_drafting: {
    filename: "Invention Disclosure Guidance.docx",
    templatePath: "Invention_Disclosure_Guidance.docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  patent_search: {
    filename: "Invention Disclosure Guidance — Search.docx",
    templatePath: "Invention_Disclosure_Guidance_Search.docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
};

export interface WelcomeContent {
  body: string;
  body_format: "html" | "markdown";
  attachments: MessageAttachment[];
}

/**
 * Upload the matching guidance .docx into Supabase Storage and create a
 * project_documents row for it. Returns a MessageAttachment ready to be
 * embedded in the welcome message's attachments JSON.
 *
 * Returns null for service types that don't have a guidance doc, or if
 * any step fails (caller falls back to the pre-existing welcome flow).
 */
export async function attachGuidanceDocToProject(
  adminClient: SupabaseClient,
  projectId: string,
  serviceType: string,
  uploadedBy: string
): Promise<MessageAttachment | null> {
  const template = GUIDANCE[serviceType];
  if (!template) return null;

  try {
    // Read the bundled template from the deployment filesystem
    const filePath = path.join(process.cwd(), "templates", template.templatePath);
    const buffer = await fs.readFile(filePath);

    // Upload to Supabase Storage under the project's namespace.
    // Filename sanitization mirrors the existing upload route convention.
    const safeName = template.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${projectId}/${Date.now()}-${safeName}`;
    const { error: uploadErr } = await adminClient.storage
      .from("project-documents")
      .upload(storagePath, buffer, {
        contentType: template.mimeType,
        upsert: false,
      });
    if (uploadErr) {
      console.error("[welcome] Guidance upload failed:", uploadErr.message);
      return null;
    }

    // Also create a project_documents row so it shows in the Documents tab
    const { error: docErr } = await adminClient
      .from("project_documents")
      .insert({
        project_id: projectId,
        filename: template.filename,
        file_url: storagePath,
        document_type: "correspondence",
        client_visible: true,
        uploaded_by: uploadedBy,
      });
    if (docErr) {
      console.error("[welcome] project_documents insert failed:", docErr.message);
      // Continue anyway — the message attachment still works without the docs-tab row
    }

    return {
      filename: template.filename,
      file_url: storagePath,
      mime_type: template.mimeType,
      size: buffer.byteLength,
    };
  } catch (err) {
    console.error("[welcome] Unexpected error attaching guidance:", err);
    return null;
  }
}

/* ── Welcome content builders ─────────────────────────────────── */

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function patentDraftingWelcomeHtml(
  firstName: string,
  title: string,
  estimatedDelivery: string | null
): string {
  const deliveryDate = formatDate(estimatedDelivery);
  const deliveryLine = deliveryDate
    ? `<p>Your estimated delivery date is <strong>${escapeHtml(deliveryDate)}</strong>. Once you've sent me your disclosure I'll review it, come back with any clarifying questions, and then start drafting. You'll see the draft before anything is filed and there's normally a round or two of revisions before submission.</p>`
    : `<p>Once you've sent me your disclosure I'll review it, come back with any clarifying questions, and then start drafting. You'll see the draft before anything is filed and there's normally a round or two of revisions before submission.</p>`;

  return [
    `<p>Hi <strong>${escapeHtml(firstName)}</strong>,</p>`,
    `<p>Welcome to your project portal for <strong>${escapeHtml(title)}</strong> &mdash; thank you for choosing me to draft your patent.</p>`,
    `<h2>Please read the attached guidance document first</h2>`,
    `<p><strong>I have attached the <em>Invention Disclosure Guidance</em> document to this message. Please open it and read it from beginning to end before sending me anything else.</strong> It walks through exactly what I need from you, in what form, and clears up the most common worries about the disclosure process. The questions are deliberately in plain English &mdash; no patent training needed.</p>`,
    `<h2>Your responsibility, very clearly</h2>`,
    `<p><strong>The patent application I draft can only be as complete as the information you give me.</strong> Patent law is unforgiving here: anything you do not tell me cannot be added later without losing your priority date. It is your responsibility to make sure I have:</p>`,
    `<ul>`,
    `<li>A full account of how the invention works &mdash; mechanically, electronically, algorithmically, or whichever combination applies</li>`,
    `<li>The technical and commercial context that matters: who uses it, how, alongside what other technologies, and under what constraints</li>`,
    `<li>Every variation or alternative you have considered, however rough</li>`,
    `<li>Anything similar you have already come across, plus any of your own prior public disclosures (sold, demoed, posted online, shown to investors without an NDA)</li>`,
    `</ul>`,
    `<p><strong>If after reading the guidance you are unsure what is meant by any question, or whether something is worth including &mdash; please message me before sending the disclosure.</strong> It is much easier to clarify now than to discover, three months into prosecution, that a key technical detail was never disclosed.</p>`,
    `<h2>What happens next</h2>`,
    deliveryLine,
    `<p>You can reply directly to this chat or upload files using the paperclip below &mdash; whatever is easiest.</p>`,
    `<p>Best regards,<br><strong>Alex Rowley</strong><br><em>Patent Consultant &mdash; Alexander IP</em></p>`,
  ].join("");
}

function patentSearchWelcomeHtml(
  firstName: string,
  title: string,
  estimatedDelivery: string | null
): string {
  const deliveryDate = formatDate(estimatedDelivery);
  const deliveryLine = deliveryDate
    ? `<p>Your estimated delivery date is <strong>${escapeHtml(deliveryDate)}</strong>. Once I have your description I will run the search across the major patent databases, identify the closest prior art, and report back with my opinion on the patentability of the concept and the strongest angles to pursue if you decide to file.</p>`
    : `<p>Once I have your description I will run the search across the major patent databases, identify the closest prior art, and report back with my opinion on the patentability of the concept and the strongest angles to pursue if you decide to file.</p>`;

  return [
    `<p>Hi <strong>${escapeHtml(firstName)}</strong>,</p>`,
    `<p>Welcome to your project portal for <strong>${escapeHtml(title)}</strong> &mdash; thank you for commissioning a patentability search.</p>`,
    `<h2>Please read the attached guidance document first</h2>`,
    `<p><strong>I have attached the <em>Invention Disclosure Guidance &mdash; Search</em> document to this message. Please open it and read it before sending me anything else.</strong> It explains exactly what I need to run an effective search and clears up the most common worries (you do not need a working prototype, you do not need to guess the right keywords, our correspondence is confidential).</p>`,
    `<h2>Your responsibility, very clearly</h2>`,
    `<p><strong>The quality of the search is bounded by what you describe to me &mdash; I can only search for what I have been told.</strong> It is your responsibility to make sure I have:</p>`,
    `<ul>`,
    `<li>A clear, plain-English description of the concept and what you believe is genuinely new about it</li>`,
    `<li>Roughly how it works &mdash; enough that I can identify the right keywords and patent classifications</li>`,
    `<li>The technical field and any commercial context that helps situate the search</li>`,
    `<li>Any prior art, competitor products, or related patents you are already aware of</li>`,
    `</ul>`,
    `<p><strong>If after reading the guidance you are unsure what level of detail to give, or what is meant by any of the questions &mdash; please message me before I start the search.</strong> A short clarifying conversation now is much cheaper than a search aimed at the wrong target.</p>`,
    `<h2>What happens next</h2>`,
    deliveryLine,
    `<p>You can reply directly to this chat or upload files using the paperclip below &mdash; whatever is easiest.</p>`,
    `<p>Best regards,<br><strong>Alex Rowley</strong><br><em>Patent Consultant &mdash; Alexander IP</em></p>`,
  ].join("");
}

/**
 * Build the welcome message body + attachment list for a new project.
 *
 * For patent_drafting / patent_search:
 *   - HTML body emphasising the attached guidance + the client's responsibility
 *   - Caller passes the guidance attachment in `guidance` (from
 *     attachGuidanceDocToProject); we include it on the message
 *
 * For other service types:
 *   - Falls back to the existing markdown welcome — caller provides
 *     `legacyMarkdown` so this module stays decoupled from the webhook's
 *     pre-existing `buildWelcomeMessage`. If no markdown is provided we
 *     return an empty body (caller skips inserting the row).
 */
export function buildWelcomeContent(
  serviceType: string,
  firstName: string,
  title: string,
  estimatedDelivery: string | null,
  guidance: MessageAttachment | null,
  legacyMarkdown: string | null
): WelcomeContent {
  if (serviceType === "patent_drafting") {
    return {
      body: patentDraftingWelcomeHtml(firstName, title, estimatedDelivery),
      body_format: "html",
      attachments: guidance ? [guidance] : [],
    };
  }
  if (serviceType === "patent_search") {
    return {
      body: patentSearchWelcomeHtml(firstName, title, estimatedDelivery),
      body_format: "html",
      attachments: guidance ? [guidance] : [],
    };
  }
  return {
    body: legacyMarkdown ?? "",
    body_format: "markdown",
    attachments: [],
  };
}
