/**
 * Per-service welcome message + auto-attached guidance docs.
 *
 * Every new project gets a friendly markdown welcome message from admin.
 * For patent_drafting and patent_search projects, the matching Invention
 * Disclosure Guidance .docx is also:
 *   1. Attached inline to the welcome message (renders as a chip)
 *   2. Saved as a project_documents row (so it shows in the Docs tab)
 *
 * The welcome text itself stays in the friendly "what to expect from the
 * portal" style — no patronising "your responsibility" framing. There's one
 * soft sentence in the "best results" bullet that nods to the attached
 * guidance doc; that's the only content delta vs. the pre-existing welcome.
 *
 * Implementation notes:
 *  - Guidance .docx files live in `templates/` at the repo root and are
 *    bundled with the deployment (see next.config.outputFileTracingIncludes).
 *  - The welcome body uses markdown — the chat renders both markdown and
 *    HTML formats, but markdown keeps the message visually identical to the
 *    pre-existing one for non-drafting/non-search projects.
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
 * any step fails.
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
    const filePath = path.join(process.cwd(), "templates", template.templatePath);
    const buffer = await fs.readFile(filePath);

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
      // Continue — the message attachment still works without the docs-tab row
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

/* ── Welcome message builder ──────────────────────────────────── */

/**
 * Builds the friendly markdown welcome message. Identical to the
 * pre-existing version (which used to live in the Stripe webhook) — moved
 * here so both the webhook and the admin manual createProject path can
 * share the same source of truth.
 *
 * The `hasGuidanceAttached` flag tweaks one bullet in "Getting the best
 * results" to nod to the attached invention-disclosure doc — light touch,
 * just enough that the client notices the attachment.
 */
function buildWelcomeMessage(
  firstName: string,
  projectTitle: string,
  estimatedDelivery: string | null,
  serviceType: string,
  hasGuidanceAttached: boolean
): string {
  const deliveryLine = estimatedDelivery
    ? `Your estimated delivery date is **${new Date(estimatedDelivery).toLocaleDateString(
        "en-GB",
        { weekday: "long", day: "numeric", month: "long", year: "numeric" }
      )}**. I'll keep you updated on progress throughout, and you can track everything from this portal.`
    : "I'll keep you updated on progress throughout, and you can track everything from this portal.";

  const { uploadGuidance, bestResults } = getServiceGuidance(
    serviceType,
    hasGuidanceAttached
  );

  return [
    `Hi ${firstName},`,
    "",
    `Welcome to your project portal for **${projectTitle}**! Thank you for choosing Alexander IP — I'm looking forward to working with you on this.`,
    "",
    `## What happens next`,
    "",
    deliveryLine,
    "",
    `## Your portal at a glance`,
    "",
    `- **\u{1F4C4} Documents** — Your VAT invoice is already in the Documents section on the right. This is also where you'll find all deliverables once they're ready.`,
    `- **\u{1F4E4} Upload files** — ${uploadGuidance}`,
    "- **\u{1F4AC} Messages** — This chat is the best way to reach me. Send questions, additional information, or feedback at any time. I aim to respond within a few hours during UK business hours.",
    "- **\u{1F4CA} Progress** — The timeline at the top of this page shows exactly where your project stands. You'll also see detailed updates in the feed below.",
    "- **\u{1F514} Notifications** — You'll receive email alerts at key milestones. Toggle these on or off using the bell icon above.",
    "- **\u{1F465} Team access** — Need a colleague or co-inventor to see this project? Use the Team section in the sidebar to invite them.",
    "",
    `## Getting the best results`,
    "",
    bestResults,
    "",
    "If you have any questions at all, just drop me a message here. There's no such thing as a silly question!",
    "",
    "Best regards,",
    "**Alex Rowley**",
    "*Patent Consultant — Alexander IP*",
  ].join("\n");
}

function getServiceGuidance(
  serviceType: string,
  hasGuidanceAttached: boolean
): { uploadGuidance: string; bestResults: string } {
  switch (serviceType) {
    case "patent_search":
      return {
        uploadGuidance:
          "Please upload any relevant materials — a description of the invention or concept you'd like searched, any existing patent numbers you're aware of, and details of the technical field. The more specific you are about what's novel, the more targeted the search will be.",
        bestResults: hasGuidanceAttached
          ? "I've attached an **Invention Disclosure Guidance — Search** document below; it's a short, plain-English overview of what's helpful to share for a patentability search. The most useful thing you can provide is a clear description of the invention — what it does, how it works, and what you believe is new or different about it compared to existing solutions. If you have any existing patent numbers or prior art references, please share those too."
          : "The most useful thing you can provide is a **clear description of the invention** — what it does, how it works, and what you believe is new or different about it compared to existing solutions. If you have any existing patent numbers or prior art references, please share those too.",
      };
    case "patent_drafting":
      return {
        uploadGuidance:
          "Please upload your invention disclosure, including any descriptions, sketches, diagrams, technical specifications, and prototype photos. The more detail you provide, the stronger the patent application will be.",
        bestResults: hasGuidanceAttached
          ? "I've attached an **Invention Disclosure Guidance** document below — it's a quick read and walks through exactly what's helpful to include. The single most important thing you can do is upload a thorough invention disclosure — describe what your invention is, how it works, what makes it different from existing solutions, and any technical details you can share. Sketches and diagrams are extremely helpful, even rough ones. If you have a working prototype, photos or videos are valuable too."
          : "The single most important thing you can do is **upload a thorough invention disclosure** — describe what your invention is, how it works, what makes it different from existing solutions, and any technical details you can share. Sketches and diagrams are extremely helpful, even rough ones. If you have a working prototype, photos or videos are valuable too.",
      };
    case "patent_prosecution":
      return {
        uploadGuidance:
          "Please upload the office action or official correspondence you've received, along with the patent application as filed and any prior communications with the patent office. If you have views on how to respond, please share those too.",
        bestResults:
          "Please share the **full office action** and your **patent application as filed**. If you have any thoughts on the examiner's objections or a preferred response strategy, let me know — your technical insight into what makes the invention distinct is invaluable for crafting a strong response.",
      };
    case "international_filing":
      return {
        uploadGuidance:
          "Please upload your existing patent application (as filed or granted), any search reports or examination results, and details of which countries or regions you're targeting.",
        bestResults:
          "Please provide the **patent application to be filed** (or the publication number if it's already published), along with details of your **target countries or regions**. If you have any priority documents or existing search/examination reports, please upload those as well.",
      };
    case "fto":
      return {
        uploadGuidance:
          "Please upload a detailed description of the product or process to be assessed, including technical specifications, drawings, and any patent numbers you're already aware of that may be relevant.",
        bestResults:
          "The key to a useful FTO analysis is a **detailed description of the product or process** you plan to commercialise — the more specific and technically complete, the better. If you're aware of any patents that might be relevant, please share those too. Let me know the target markets where you plan to operate.",
      };
    case "illustrations":
      return {
        uploadGuidance:
          "Please upload the sketches, photos, CAD files, or other visuals you'd like turned into formal patent illustrations. Include any specific views or cross-sections you need, and the relevant patent application text if available.",
        bestResults:
          "Please provide the **source material** for the illustrations — rough sketches, photos, CAD models, or annotated diagrams. Let me know which views are needed (e.g. perspective, exploded, cross-section) and any patent office formatting requirements. Reference to the relevant part of the patent description is very helpful.",
      };
    case "filing":
      return {
        uploadGuidance:
          "Please upload the finalised patent application documents (specification, claims, abstract, drawings) and any relevant priority documents. Let me know the target patent office and any filing deadlines.",
        bestResults:
          "Please ensure all **application documents are finalised** — specification, claims, abstract, and drawings. If claiming priority from an earlier application, upload the priority document and confirm the filing date. Let me know about any **upcoming deadlines** so I can prioritise accordingly.",
      };
    case "consultation":
      return {
        uploadGuidance:
          "Please upload any relevant background materials — invention descriptions, existing patents, business plans, or specific questions you'd like to discuss. This helps me prepare and make the most of our time together.",
        bestResults:
          "To get the most from the consultation, please share any **background materials** and a **list of questions or topics** you'd like to cover. The more context I have in advance, the more tailored and useful the advice will be.",
      };
    case "ip_valuation":
      return {
        uploadGuidance:
          "Please upload the patent documents or portfolio details to be valued, along with any commercial information — licensing agreements, revenue data, market size estimates, and the purpose of the valuation (e.g. sale, licensing, investment, litigation).",
        bestResults:
          "A thorough valuation depends on both the **technical scope of the IP** and the **commercial context**. Please share the patent documents, any licensing or revenue history, information about the relevant market, and the purpose of the valuation. The more commercial data you can provide, the more robust the valuation will be.",
      };
    default:
      return {
        uploadGuidance:
          "Please upload any relevant materials using the upload area in the sidebar. The more detail you provide, the stronger the end result.",
        bestResults:
          "The most important thing you can do is **provide as much relevant detail as possible** — descriptions, documents, sketches, specifications, and any background context. The more I have to work with, the better the outcome.",
      };
  }
}

/**
 * Build the welcome message body + attachment list for a new project.
 *
 * The body is always markdown (renders identically to the pre-existing
 * webhook welcome). For patent_drafting / patent_search:
 *   - The caller passes `guidance` (from attachGuidanceDocToProject)
 *   - The message includes the guidance .docx as an attachment
 *   - The "best results" bullet picks up a one-sentence nod to the doc
 *
 * For other service types, `guidance` should be null — the message is
 * unchanged from the original.
 */
export function buildWelcomeContent(
  serviceType: string,
  firstName: string,
  title: string,
  estimatedDelivery: string | null,
  guidance: MessageAttachment | null
): WelcomeContent {
  const body = buildWelcomeMessage(
    firstName,
    title,
    estimatedDelivery,
    serviceType,
    guidance !== null
  );
  return {
    body,
    body_format: "markdown",
    attachments: guidance ? [guidance] : [],
  };
}
