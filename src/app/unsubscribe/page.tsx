import { Metadata } from "next";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NotificationPreferences } from "@/lib/supabase/types";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/supabase/types";
import Link from "next/link";
import { CheckCircle, XCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Unsubscribe — Alexander IP",
  description: "Manage your email notification preferences.",
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <ErrorState message="Missing unsubscribe token." />;
  }

  const result = verifyUnsubscribeToken(token);
  if (!result) {
    return <ErrorState message="Invalid or expired unsubscribe link." />;
  }

  const { userId, type } = result;
  const adminClient = createAdminClient();

  // Fetch current preferences
  const { data: profile } = await adminClient
    .from("profiles")
    .select("notification_preferences")
    .eq("id", userId)
    .single();

  if (!profile) {
    return <ErrorState message="Account not found." />;
  }

  const currentPrefs: NotificationPreferences =
    (profile.notification_preferences as NotificationPreferences | null) ??
    DEFAULT_NOTIFICATION_PREFERENCES;

  // Build updated preferences
  let updatedPrefs: NotificationPreferences;
  let unsubLabel: string;

  if (type === "all") {
    updatedPrefs = {
      status_updates: false,
      document_uploads: false,
      new_messages: false,
    };
    unsubLabel = "all email notifications";
  } else {
    updatedPrefs = { ...currentPrefs, [type]: false };
    const labels: Record<string, string> = {
      status_updates: "status update emails",
      document_uploads: "document upload emails",
      new_messages: "new message emails",
    };
    unsubLabel = labels[type] || type;
  }

  // Update in DB
  await adminClient
    .from("profiles")
    .update({ notification_preferences: updatedPrefs })
    .eq("id", userId);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <h1 className="text-xl font-bold text-navy mb-2">Unsubscribed</h1>
        <p className="text-slate-600 text-sm mb-6">
          You&rsquo;ve been unsubscribed from {unsubLabel}. You can re-enable
          notifications at any time in your{" "}
          <Link
            href="/portal/settings"
            className="text-blue hover:text-blue-dark font-medium underline"
          >
            portal settings
          </Link>
          .
        </p>
        <p className="text-xs text-slate-400">
          Essential emails (sign-in links and project creation confirmations)
          will still be sent.
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-6 h-6 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-navy mb-2">
          Something went wrong
        </h1>
        <p className="text-slate-600 text-sm mb-6">{message}</p>
        <p className="text-xs text-slate-400">
          You can manage your notification preferences from your{" "}
          <Link
            href="/portal/settings"
            className="text-blue hover:text-blue-dark font-medium underline"
          >
            portal settings
          </Link>{" "}
          instead.
        </p>
      </div>
    </div>
  );
}
