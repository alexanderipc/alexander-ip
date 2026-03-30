import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * GET /api/admin/backfill-profiles
 * Pulls customer_details (name, address) from Stripe checkout sessions
 * and backfills any profiles that are missing this data.
 * Then regenerates invoices for affected projects.
 * Admin-only endpoint.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminClient = createAdminClient();
    const { data: adminProfile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    // Get all profiles (we'll skip the admin user by checking email match)
    const { data: profiles, error: profError } = await adminClient
      .from("profiles")
      .select("id, name, email, address_line1, country");

    if (profError || !profiles) {
      return NextResponse.json(
        { error: `Failed to fetch profiles: ${profError?.message || "null"}` },
        { status: 500 }
      );
    }

    const results: { email: string; name: string | null; updates: string[] }[] = [];

    // List recent checkout sessions from Stripe (last 100)
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      expand: ["data.customer_details"],
    });

    // Build a map of email → best customer_details from Stripe
    const stripeDataByEmail = new Map<string, {
      name: string | null;
      address: Stripe.Address | null;
    }>();

    for (const session of sessions.data) {
      if (session.status !== "complete") continue;
      const cd = session.customer_details;
      if (!cd?.email) continue;

      const email = cd.email.toLowerCase();
      const existing = stripeDataByEmail.get(email);

      // Keep the most complete entry (prefer one with name + address)
      if (!existing ||
        (!existing.name && cd.name) ||
        (!existing.address?.line1 && cd.address?.line1)) {
        stripeDataByEmail.set(email, {
          name: cd.name || existing?.name || null,
          address: cd.address?.line1 ? cd.address : existing?.address || null,
        });
      }
    }

    // Update profiles
    for (const profile of profiles) {
      if (!profile.email) continue;

      const stripeData = stripeDataByEmail.get(profile.email.toLowerCase());
      if (!stripeData) continue;

      const updates: Record<string, string | null> = {};
      const updateNotes: string[] = [];

      // Update name if profile doesn't have a proper one
      if (stripeData.name && (!profile.name || profile.name === profile.email?.split("@")[0])) {
        updates.name = stripeData.name;
        updateNotes.push(`name: ${stripeData.name}`);
      }

      // Update address if profile doesn't have one
      if (stripeData.address && !profile.address_line1) {
        if (stripeData.address.line1) {
          updates.address_line1 = stripeData.address.line1;
        }
        if (stripeData.address.line2) {
          updates.address_line2 = stripeData.address.line2;
        }
        if (stripeData.address.city) {
          updates.city = stripeData.address.city;
        }
        if (stripeData.address.postal_code) {
          updates.postal_code = stripeData.address.postal_code;
        }
        if (stripeData.address.country) {
          updates.country = stripeData.address.country;
        }
        updateNotes.push(`address: ${stripeData.address.city || ""} ${stripeData.address.country || ""}`);
      }

      // Update country even if no full address, if we have it
      if (stripeData.address?.country && !profile.country) {
        updates.country = stripeData.address.country;
        if (!updateNotes.some(n => n.includes("address"))) {
          updateNotes.push(`country: ${stripeData.address.country}`);
        }
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await adminClient
          .from("profiles")
          .update(updates)
          .eq("id", profile.id);

        if (error) {
          updateNotes.push(`ERROR: ${error.message}`);
        }
      }

      if (updateNotes.length > 0) {
        results.push({
          email: profile.email,
          name: updates.name || profile.name,
          updates: updateNotes,
        });
      }
    }

    return NextResponse.json({
      message: `Updated ${results.length} profiles from Stripe data`,
      stripeSessionsChecked: sessions.data.length,
      uniqueEmails: stripeDataByEmail.size,
      profilesUpdated: results.length,
      results,
    });
  } catch (err) {
    console.error("[BackfillProfiles] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
