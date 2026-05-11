import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import BookingsTable from "./BookingsTable";
import { Phone } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bookings — Admin",
};

export interface BookingRow {
  id: string;
  lead_name: string;
  lead_email: string;
  stage: string | null;
  topic: string | null;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string;
  rejection_reason: string | null;
  google_meet_url: string | null;
  created_at: string;
  decided_at: string | null;
}

export default async function AdminBookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/admin/bookings");

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/portal");

  // Pending requests — oldest first (FIFO is the fairer queue)
  const { data: pendingData } = await adminClient
    .from("lead_call_bookings")
    .select(
      "id, lead_name, lead_email, stage, topic, scheduled_at, duration_minutes, status, rejection_reason, google_meet_url, created_at, decided_at"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  // Recent decisions (everything else) — last 30 rows
  const { data: recentData } = await adminClient
    .from("lead_call_bookings")
    .select(
      "id, lead_name, lead_email, stage, topic, scheduled_at, duration_minutes, status, rejection_reason, google_meet_url, created_at, decided_at"
    )
    .neq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(30);

  const pending = (pendingData ?? []) as BookingRow[];
  const recent = (recentData ?? []) as BookingRow[];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Phone className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-navy">Intro call bookings</h1>
      </div>
      <p className="text-sm text-slate-600 mb-6">
        Every free 15-min intro call comes in as <strong>pending</strong>.
        Approving creates the Google Calendar event and sends the lead the Meet
        link. Rejecting emails the lead with the reason you give &mdash; they
        see it verbatim.
      </p>

      <BookingsTable pending={pending} recent={recent} />
    </div>
  );
}
