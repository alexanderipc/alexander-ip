import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import NotificationSettings from "@/components/portal/NotificationSettings";
import type { NotificationPreferences } from "@/lib/supabase/types";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/supabase/types";

export const metadata = {
  title: "Settings — Alexander IP",
  description: "Manage your notification preferences and data rights.",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?redirect=/portal/settings");

  const { data: profile } = await supabase
    .from("profiles")
    .select("notification_preferences")
    .eq("id", user.id)
    .single();

  const prefs: NotificationPreferences =
    (profile?.notification_preferences as NotificationPreferences | null) ??
    DEFAULT_NOTIFICATION_PREFERENCES;

  return (
    <div className="max-w-2xl">
      <Link
        href="/portal"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to projects
      </Link>

      <h1 className="text-2xl font-bold text-navy mb-8">Settings</h1>

      {/* Notification preferences */}
      <div className="mb-10">
        <NotificationSettings initial={prefs} />
      </div>

      {/* GDPR Data Rights */}
      <div className="border-t border-slate-200 pt-8">
        <h2 className="text-lg font-semibold text-navy mb-2">Your Data</h2>
        <p className="text-sm text-slate-500 mb-4">
          Under UK GDPR, you have the right to access, rectify, or request
          deletion of your personal data. To make a data subject access request
          or exercise any data rights, contact us directly.
        </p>
        <a
          href="mailto:alexanderip.contact@gmail.com?subject=Data%20Subject%20Access%20Request"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue hover:text-blue-dark transition-colors"
        >
          <Mail className="w-4 h-4" />
          Send a data request
        </a>
        <p className="text-xs text-slate-400 mt-3">
          See our{" "}
          <Link
            href="/legal/privacy"
            className="text-blue hover:text-blue-dark underline"
          >
            Privacy Policy
          </Link>{" "}
          for full details on how your data is processed and stored.
        </p>
      </div>
    </div>
  );
}
