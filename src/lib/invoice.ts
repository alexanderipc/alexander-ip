/**
 * Auto-generated PDF tax invoices (WEB-XXXX series).
 * Uses pdfkit for in-memory PDF generation, matching existing Alexander IP branding.
 * Invoices are uploaded to Supabase Storage and linked as project documents.
 */

import PDFDocument from "pdfkit";
import { createAdminClient } from "@/lib/supabase/admin";

/* ── Company details ──────────────────────────────────────────── */

const COMPANY = {
  name: "Alexander IPC Ltd",
  address: "4 Victoria Square, Bristol, BS8 4EU",
  vatNumber: "488116857",
};

/* ── Brand colours ────────────────────────────────────────────── */

const NAVY = "#0f1729";
const BRAND_BLUE = "#2563eb";
const PAID_GREEN = "#16a34a";

/* ── Types ────────────────────────────────────────────────────── */

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number; // major units (e.g. 10.00 = £10)
  vatRate: number | null; // 0.20 for 20%, null for "No VAT"
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string; // ISO date
  clientName: string;
  clientEmail: string;
  currency: string; // "GBP", "USD", etc.
  lineItems: InvoiceLineItem[];
  isPaid: boolean;
}

interface GenerateInvoiceParams {
  projectId: string;
  clientName: string;
  clientEmail: string;
  title: string;
  amountTotal: number; // cents/pence (Stripe smallest unit)
  amountTax: number; // from session.total_details.amount_tax
  currency: string; // "GBP", "USD", etc.
}

/* ── Currency helpers ─────────────────────────────────────────── */

function currencySymbol(code: string): string {
  switch (code.toUpperCase()) {
    case "GBP":
      return "\u00A3";
    case "USD":
      return "$";
    case "EUR":
      return "\u20AC";
    default:
      return code + " ";
  }
}

/* ── Invoice counter ──────────────────────────────────────────── */

export async function getNextInvoiceNumber(): Promise<string> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient.rpc("next_invoice_number");

  if (error || data === null || data === undefined) {
    throw new Error(
      `Failed to get invoice number: ${error?.message || "null returned"}`
    );
  }

  return `WEB-${String(data).padStart(4, "0")}`;
}

/* ── PDF generation ───────────────────────────────────────────── */

export async function generateInvoicePdf(
  data: InvoiceData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: `Invoice ${data.invoiceNumber}`,
        Author: "Alexander IP",
      },
    });

    const chunks: Uint8Array[] = [];
    doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = 595.28;
    const margin = 50;
    const contentWidth = pageWidth - margin * 2;
    const sym = currencySymbol(data.currency);

    // ── Header: dark navy band ──
    doc.rect(0, 0, pageWidth, 90).fill(NAVY);
    doc
      .fontSize(28)
      .font("Helvetica-Bold")
      .fillColor("#ffffff")
      .text("Alexander IP", margin, 30, { width: contentWidth });
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#94a3b8")
      .text("Patent Drafting & IP Consultancy", margin, 62, {
        width: contentWidth,
      });

    // ── TAX INVOICE title ──
    const afterHeader = 110;
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .fillColor(BRAND_BLUE)
      .text("TAX INVOICE", margin, afterHeader);

    // ── Two-column details ──
    const detailsY = afterHeader + 40;
    const rightColX = pageWidth - margin - 200;

    // Left: client
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor(NAVY)
      .text("Bill To:", margin, detailsY);
    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#334155")
      .text(data.clientName, margin, detailsY + 16);
    doc
      .fontSize(9)
      .fillColor("#64748b")
      .text(data.clientEmail, margin, detailsY + 30);

    // Right: invoice details
    const labelX = rightColX;
    const valueX = rightColX + 85;
    let rY = detailsY;

    const detailRow = (label: string, value: string, color = NAVY) => {
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#64748b")
        .text(label, labelX, rY);
      doc.font("Helvetica").fillColor(color).text(value, valueX, rY);
      rY += 16;
    };

    detailRow("Invoice No:", data.invoiceNumber);
    detailRow(
      "Date:",
      new Date(data.invoiceDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
    detailRow("VAT No:", COMPANY.vatNumber);

    if (data.isPaid) {
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor(PAID_GREEN)
        .text("Status:", labelX, rY);
      doc
        .font("Helvetica-Bold")
        .fillColor(PAID_GREEN)
        .text("PAID", valueX, rY);
      rY += 16;
    }

    // ── Company line ──
    const companyY = detailsY + 70;
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#94a3b8")
      .text(COMPANY.name, margin, companyY);
    doc.text(COMPANY.address, margin, companyY + 11);

    // ── Line items table ──
    const tableY = companyY + 40;
    const colDesc = margin;
    const colQty = margin + contentWidth * 0.5;
    const colUnit = margin + contentWidth * 0.6;
    const colVat = margin + contentWidth * 0.75;
    const colAmount = margin + contentWidth * 0.88;

    // Header row
    doc.rect(margin, tableY, contentWidth, 24).fill("#f1f5f9");
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#64748b");
    doc.text("Description", colDesc + 8, tableY + 7);
    doc.text("Qty", colQty, tableY + 7, { width: 40, align: "right" });
    doc.text("Unit Price", colUnit, tableY + 7, {
      width: 55,
      align: "right",
    });
    doc.text("VAT", colVat, tableY + 7, { width: 40, align: "right" });
    doc.text("Amount", colAmount, tableY + 7, { width: 52, align: "right" });

    // Data rows
    let rowY = tableY + 28;
    let subtotal = 0;
    let totalVat = 0;
    let totalNoVat = 0;

    for (const item of data.lineItems) {
      const lineTotal = item.quantity * item.unitPrice;
      const lineVat = item.vatRate ? lineTotal * item.vatRate : 0;

      if (item.vatRate) {
        totalVat += lineVat;
      } else {
        totalNoVat += lineTotal;
      }
      subtotal += lineTotal;

      doc.fontSize(9).font("Helvetica").fillColor(NAVY);
      doc.text(item.description, colDesc + 8, rowY, {
        width: contentWidth * 0.45,
      });
      doc.text(String(item.quantity), colQty, rowY, {
        width: 40,
        align: "right",
      });
      doc.text(`${sym}${item.unitPrice.toFixed(2)}`, colUnit, rowY, {
        width: 55,
        align: "right",
      });
      doc.text(
        item.vatRate ? `${(item.vatRate * 100).toFixed(0)}%` : "No VAT",
        colVat,
        rowY,
        { width: 40, align: "right" }
      );
      doc.text(`${sym}${lineTotal.toFixed(2)}`, colAmount, rowY, {
        width: 52,
        align: "right",
      });

      rowY += 20;
      doc
        .moveTo(margin, rowY)
        .lineTo(margin + contentWidth, rowY)
        .strokeColor("#e2e8f0")
        .lineWidth(0.5)
        .stroke();
      rowY += 8;
    }

    // ── Totals ──
    const totalsLabelX = margin + contentWidth * 0.62;
    const totalsValueX = margin + contentWidth * 0.88;
    let tY = rowY + 12;

    const totalRow = (
      label: string,
      value: string,
      bold = false,
      size = 9
    ) => {
      doc
        .fontSize(size)
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fillColor("#64748b")
        .text(label, totalsLabelX, tY, { width: 80 });
      doc
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fillColor(NAVY)
        .text(value, totalsValueX, tY, { width: 52, align: "right" });
      tY += 18;
    };

    totalRow("Subtotal", `${sym}${subtotal.toFixed(2)}`);

    if (totalNoVat > 0) {
      totalRow("TOTAL NO VAT", `${sym}${totalNoVat.toFixed(2)}`);
    }

    if (totalVat > 0) {
      totalRow("TOTAL VAT 20%", `${sym}${totalVat.toFixed(2)}`);
    }

    // Grand total line
    const grandTotal = subtotal + totalVat;
    doc
      .moveTo(totalsLabelX, tY)
      .lineTo(totalsLabelX + contentWidth * 0.38, tY)
      .strokeColor(NAVY)
      .lineWidth(1)
      .stroke();
    tY += 8;
    totalRow(
      `TOTAL ${data.currency.toUpperCase()}`,
      `${sym}${grandTotal.toFixed(2)}`,
      true,
      12
    );

    // ── PAID stamp ──
    if (data.isPaid) {
      tY += 20;
      doc.save();
      doc.rotate(-15, { origin: [totalsLabelX + 60, tY + 15] });
      doc
        .rect(totalsLabelX + 10, tY, 110, 36)
        .lineWidth(3)
        .strokeColor(PAID_GREEN)
        .stroke();
      doc
        .fontSize(22)
        .font("Helvetica-Bold")
        .fillColor(PAID_GREEN)
        .text("PAID", totalsLabelX + 30, tY + 7);
      doc.restore();
    }

    // ── Footer ──
    const footerY = 760;
    doc
      .moveTo(margin, footerY)
      .lineTo(margin + contentWidth, footerY)
      .strokeColor("#e2e8f0")
      .lineWidth(0.5)
      .stroke();
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#94a3b8")
      .text(
        `${COMPANY.name} \u00B7 ${COMPANY.address} \u00B7 VAT ${COMPANY.vatNumber}`,
        margin,
        footerY + 8,
        { width: contentWidth, align: "center" }
      );

    doc.end();
  });
}

/* ── Orchestrator: generate + upload + record ─────────────────── */

export async function generateAndStoreInvoice(
  params: GenerateInvoiceParams
): Promise<string | null> {
  const adminClient = createAdminClient();

  try {
    // 1. Atomic invoice number
    const invoiceNumber = await getNextInvoiceNumber();
    console.log(`[Invoice] Generating ${invoiceNumber}`);

    // 2. Build line item from Stripe amounts
    // amountTotal includes tax; amountTax is the tax portion
    const hasTax = params.amountTax > 0;
    const subtotalPence = params.amountTotal - params.amountTax;
    const subtotal = subtotalPence / 100;

    const lineItems: InvoiceLineItem[] = [
      {
        description: params.title,
        quantity: 1,
        unitPrice: subtotal,
        vatRate: hasTax ? 0.2 : null,
      },
    ];

    // 3. Generate PDF in memory
    const pdfBuffer = await generateInvoicePdf({
      invoiceNumber,
      invoiceDate: new Date().toISOString(),
      clientName: params.clientName,
      clientEmail: params.clientEmail,
      currency: params.currency.toUpperCase(),
      lineItems,
      isPaid: true,
    });

    console.log(`[Invoice] PDF generated: ${pdfBuffer.length} bytes`);

    // 4. Upload to Supabase Storage (same pattern as admin uploads)
    const safeName = `Invoice_${invoiceNumber}.pdf`.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );
    const filePath = `${params.projectId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await adminClient.storage
      .from("project-documents")
      .upload(filePath, pdfBuffer, {
        contentType: "application/pdf",
      });

    if (uploadError) {
      throw new Error(`Invoice upload failed: ${uploadError.message}`);
    }

    // 5. Create project_documents record (client-visible invoice)
    const { error: insertError } = await adminClient
      .from("project_documents")
      .insert({
        project_id: params.projectId,
        filename: `Invoice ${invoiceNumber}.pdf`,
        file_url: filePath,
        document_type: "invoice",
        client_visible: true,
      });

    if (insertError) {
      throw new Error(`Invoice record failed: ${insertError.message}`);
    }

    console.log(`[Invoice] Stored: ${filePath}`);
    return invoiceNumber;
  } catch (err) {
    console.error("[Invoice] Generation failed:", err);
    return null;
  }
}
