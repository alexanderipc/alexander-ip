import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateInvoicePdf } from "@/lib/invoice";

/**
 * POST /api/admin/regenerate-invoices
 * Regenerates all existing invoice PDFs with the current template layout.
 * Admin-only endpoint.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Verify admin
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

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

        // Fetch client data from every available source
        let clientName: string = "Client";
        let clientEmail: string = "";
        let clientAddress: string | null = null;

        // Try user ID sources: client_id on project, then project_members owner
        const userIdCandidates: string[] = [];
        if (project.client_id) userIdCandidates.push(project.client_id);

        const { data: owner } = await adminClient
          .from("project_members")
          .select("user_id")
          .eq("project_id", doc.project_id)
          .eq("role", "owner")
          .limit(1)
          .maybeSingle();
        if (owner?.user_id && !userIdCandidates.includes(owner.user_id)) {
          userIdCandidates.push(owner.user_id);
        }

        for (const uid of userIdCandidates) {
          // 1. Try profiles table
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

          // 2. Try auth.users directly (always has email + user_metadata)
          const { data: authData } = await adminClient.auth.admin.getUserById(uid);
          if (authData?.user) {
            const meta = authData.user.user_metadata || {};
            clientName = meta.full_name || meta.name || authData.user.email?.split("@")[0] || clientName;
            clientEmail = authData.user.email || clientEmail;
            break;
          }
        }

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

        // Overwrite the existing file in storage
        const { error: uploadError } = await adminClient.storage
          .from("project-documents")
          .update(doc.file_url, pdfBuffer, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (uploadError) {
          // If update fails (file might not exist at path), try upload
          const { error: uploadError2 } = await adminClient.storage
            .from("project-documents")
            .upload(doc.file_url, pdfBuffer, {
              contentType: "application/pdf",
              upsert: true,
            });

          if (uploadError2) {
            results.push({
              id: doc.id,
              filename: doc.filename,
              status: `error - ${uploadError2.message}`,
            });
            continue;
          }
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
