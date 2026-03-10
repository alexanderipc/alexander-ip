/**
 * Admin-only test endpoint for invoice generation.
 * POST /api/admin/test-invoice
 * Body: { projectId, clientName, clientEmail, title, amountTotal, amountTax, currency }
 *
 * Remove this route after testing.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAndStoreInvoice } from "@/lib/invoice";

export async function POST(request: Request) {
  // Verify admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      projectId,
      clientName,
      clientEmail,
      title,
      amountTotal,
      amountTax,
      currency,
    } = body;

    if (!projectId || !clientName || !clientEmail || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const invoiceNumber = await generateAndStoreInvoice({
      projectId,
      clientName,
      clientEmail,
      title,
      amountTotal: amountTotal || 60,
      amountTax: amountTax || 10,
      currency: currency || "GBP",
    });

    return NextResponse.json({
      success: true,
      invoiceNumber,
    });
  } catch (err) {
    console.error("[test-invoice] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
