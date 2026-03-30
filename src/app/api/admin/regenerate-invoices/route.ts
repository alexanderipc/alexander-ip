import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateInvoicePdf, getNextInvoiceNumber } from "@/lib/invoice";

/* ── Helper: resolve client info from user ID ────────────────── */

async function resolveClient(
  adminClient: ReturnType<typeof createAdminClient>,
  projectId: string,
  clientId: string | null
) {
  let clientName = "Client";
  let clientEmail = "";
  let clientAddress: string | null = null;

  const candidates: string[] = [];
  if (clientId) candidates.push(clientId);

  const { data: owner } = await adminClient
    .from("project_members")
    .select("user_id")
    .eq("project_id", projectId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();
  if (owner?.user_id && !candidates.includes(owner.user_id)) {
    candidates.push(owner.user_id);
  }

  for (const uid of candidates) {
    const { data: profile } = await adminClient
      .from("profiles")
      .select("name, email, address_line1, address_line2, city, postal_code, country")
      .eq("id", uid)
      .single();

    if (profile) {
      clientName = profile.name || profile.email || clientName;
      clientEmail = profile.email || clientEmail;
      const addrParts = [
        profile.address_line1, profile.address_line2,
        profile.city, profile.postal_code, profile.country,
      ].filter(Boolean);
      if (addrParts.length > 0) clientAddress = addrParts.join("\n");
      break;
    }

    const { data: authData } = await adminClient.auth.admin.getUserById(uid);
    if (authData?.user) {
      const meta = authData.user.user_metadata || {};
      clientName = meta.full_name || meta.name || authData.user.email?.split("@")[0] || clientName;
      clientEmail = authData.user.email || clientEmail;
      break;
    }
  }

  return { clientName, clientEmail, clientAddress };
}

/* ── Helper: verify admin ─────────────────────────────────────── */

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return null;
  return { user, adminClient };
}

/**
 * GET /api/admin/regenerate-invoices
 * Finds projects that are missing invoices and generates them.
 * Admin-only endpoint.
 */
export async function GET() {
  try {
    const auth = await verifyAdmin();
    if (!auth) return NextResponse.json({ error: "Admin only" }, { status: 403 });
    const { adminClient } = auth;

    // Get all projects with a price_paid (i.e. they were paid for)
    const { data: projects, error: projError } = await adminClient
      .from("projects")
      .select("id, title, price_paid, currency, stripe_payment_id, client_id, service_type, created_at")
      .not("price_paid", "is", null)
      .gt("price_paid", 0)
      .order("created_at", { ascending: true });

    if (projError) {
      return NextResponse.json({ error: projError.message }, { status: 500 });
    }

    // Get all existing invoice documents
    const { data: existingInvoices } = await adminClient
      .from("project_documents")
      .select("project_id")
      .eq("document_type", "invoice");

    const projectsWithInvoices = new Set(
      (existingInvoices || []).map((d) => d.project_id)
    );

    // Find projects missing invoices
    const missing = (projects || []).filter(
      (p) => !projectsWithInvoices.has(p.id)
    );

    if (missing.length === 0) {
      return NextResponse.json({
        message: "All paid projects have invoices",
        totalProjects: projects?.length || 0,
        withInvoices: projectsWithInvoices.size,
        missing: 0,
      });
    }

    // Generate invoices for missing projects
    const results: { projectId: string; title: string; status: string; invoiceNumber?: string }[] = [];

    for (const project of missing) {
      try {
        const { clientName, clientEmail, clientAddress } = await resolveClient(
          adminClient, project.id, project.client_id
        );

        const amountTotal = project.price_paid || 0;
        const hasTax = project.currency === "GBP";
        const subtotalPence = hasTax ? Math.round(amountTotal / 1.2) : amountTotal;
        const subtotal = subtotalPence / 100;

        const invoiceNumber = await getNextInvoiceNumber();

        const pdfBuffer = await generateInvoicePdf({
          invoiceNumber,
          invoiceDate: project.created_at || new Date().toISOString(),
          clientName,
          clientEmail,
          clientAddress,
          currency: (project.currency || "GBP").toUpperCase(),
          lineItems: [{
            description: project.title || "Patent Services",
            quantity: 1,
            unitPrice: subtotal,
            vatRate: hasTax ? 0.2 : null,
          }],
          isPaid: true,
          stripePaymentIntentId: project.stripe_payment_id,
          stripeSessionId: null,
        });

        // Upload to storage
        const safeName = `Invoice_${invoiceNumber}.pdf`.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `${project.id}/${Date.now()}-${safeName}`;

        const { error: uploadError } = await adminClient.storage
          .from("project-documents")
          .upload(filePath, pdfBuffer, { contentType: "application/pdf" });

        if (uploadError) throw new Error(`Upload: ${uploadError.message}`);

        // Create document record
        const { error: insertError } = await adminClient
          .from("project_documents")
          .insert({
            project_id: project.id,
            filename: `Invoice ${invoiceNumber}.pdf`,
            file_url: filePath,
            document_type: "invoice",
            client_visible: true,
          });

        if (insertError) throw new Error(`DB: ${insertError.message}`);

        results.push({
          projectId: project.id,
          title: project.title,
          status: "generated",
          invoiceNumber,
        });
      } catch (err) {
        results.push({
          projectId: project.id,
          title: project.title,
          status: `error - ${err instanceof Error ? err.message : "unknown"}`,
        });
      }
    }

    const generated = results.filter((r) => r.status === "generated").length;
    return NextResponse.json({
      message: `Generated ${generated}/${missing.length} missing invoices`,
      totalProjects: projects?.length || 0,
      withInvoices: projectsWithInvoices.size,
      missing: missing.length,
      generated,
      results,
    });
  } catch (err) {
    console.error("[MissingInvoices] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/regenerate-invoices
 * Regenerates all existing invoice PDFs with the current template layout.
 * Admin-only endpoint.
 */
export async function POST() {
  try {
    const auth = await verifyAdmin();
    if (!auth) return NextResponse.json({ error: "Admin only" }, { status: 403 });
    const { adminClient } = auth;

    // Fetch all invoice documents
    const { data: invoiceDocs, error: docsError } = await adminClient
      .from("project_documents")
      .select("id, project_id, filename, file_url, document_type, uploaded_at")
      .eq("document_type", "invoice")
      .order("uploaded_at", { ascending: true });

    if (docsError) {
      return NextResponse.json(
        { error: `Failed to fetch invoices: ${docsError.message}` },
        { status: 500 }
      );
    }

    if (!invoiceDocs || invoiceDocs.length === 0) {
      return NextResponse.json({ message: "No invoices found", count: 0 });
    }

    const results: { id: string; filename: string; status: string }[] = [];

    for (const doc of invoiceDocs) {
      try {
        // Extract invoice number from filename (e.g. "Invoice WEB-0001.pdf")
        const invoiceNumberMatch = doc.filename.match(/WEB-\d+/);
        const invoiceNumber = invoiceNumberMatch
          ? invoiceNumberMatch[0]
          : doc.filename.replace(/\.pdf$/i, "").replace(/^Invoice\s*/i, "");

        // Fetch the project and client info
        const { data: project } = await adminClient
          .from("projects")
          .select(
            "id, title, price_paid, currency, stripe_payment_id, client_id, service_type"
          )
          .eq("id", doc.project_id)
          .single();

        if (!project) {
          results.push({
            id: doc.id,
            filename: doc.filename,
            status: "skipped - project not found",
          });
          continue;
        }

        const { clientName, clientEmail, clientAddress } = await resolveClient(
          adminClient, doc.project_id, project.client_id
        );

        // Calculate amounts
        const amountTotal = project.price_paid || 0;
        // Try to figure out VAT from total (assume 20% VAT if GBP)
        const hasTax = project.currency === "GBP";
        const subtotalPence = hasTax
          ? Math.round(amountTotal / 1.2)
          : amountTotal;
        const subtotal = subtotalPence / 100;

        // Regenerate PDF
        const pdfBuffer = await generateInvoicePdf({
          invoiceNumber,
          invoiceDate: doc.uploaded_at || new Date().toISOString(),
          clientName,
          clientEmail,
          clientAddress,
          currency: (project.currency || "GBP").toUpperCase(),
          lineItems: [
            {
              description: project.title || "Patent Services",
              quantity: 1,
              unitPrice: subtotal,
              vatRate: hasTax ? 0.2 : null,
            },
          ],
          isPaid: true,
          stripePaymentIntentId: project.stripe_payment_id,
          stripeSessionId: null,
        });

        // Delete old file first, then upload fresh (update/upsert doesn't reliably overwrite)
        await adminClient.storage
          .from("project-documents")
          .remove([doc.file_url]);

        const { error: uploadError } = await adminClient.storage
          .from("project-documents")
          .upload(doc.file_url, pdfBuffer, {
            contentType: "application/pdf",
          });

        if (uploadError) {
          results.push({
            id: doc.id,
            filename: doc.filename,
            status: `error - ${uploadError.message}`,
          });
          continue;
        }

        results.push({
          id: doc.id,
          filename: doc.filename,
          status: "regenerated",
        });
      } catch (err) {
        results.push({
          id: doc.id,
          filename: doc.filename,
          status: `error - ${err instanceof Error ? err.message : "unknown"}`,
        });
      }
    }

    const successCount = results.filter((r) => r.status === "regenerated").length;
    return NextResponse.json({
      message: `Regenerated ${successCount}/${results.length} invoices`,
      count: successCount,
      total: results.length,
      results,
    });
  } catch (err) {
    console.error("[RegenerateInvoices] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
