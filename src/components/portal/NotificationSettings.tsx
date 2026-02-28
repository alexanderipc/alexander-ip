"use client";

import { useState, useTransition } from "react";
import { Bell, FileText, MessageSquare, RefreshCw } from "lucide-react";
import { updateNotificationPreferences } from "@/app/portal/actions";
import type { NotificationPreferences } from "@/lib/supabase/types";

interface Props {
  initial: NotificationPreferences;
}

const SETTINGS = [
  {
    key: "status_updates" as const,
    label: "Status Updates",
    description:
      "Emails when your project status changes (e.g. drafting started, review ready, complete).",
    icon: RefreshCw,
  },
  {
    key: "document_uploads" as const,
    label: "Document Uploads",
    description:
      "Emails when new documents are uploaded to your project (e.g. draft specifications, office actions).",
    icon: FileText,
  },
  {
    key: "new_messages" as const,
    label: "New Messages",
    description:
      "Emails when Alexander IP sends you a message on your project.",
    icon: MessageSquare,
  },
];

export default function NotificationSettings({ initial }: Props) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(initial);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggle(key: keyof NotificationPreferences) {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSaved(false);

    startTransition(async () => {
      try {
        await updateNotificationPreferences(updated);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        // Revert on error
        setPrefs(prefs);
        console.error("Failed to update preferences:", err);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Bell className="w-5 h-5 text-blue" />
        <h2 className="text-lg font-semibold text-navy">
          Email Notifications
        </h2>
        {isPending && (
          <span className="text-xs text-slate-400 ml-2">Saving...</span>
        )}
        {saved && !isPending && (
          <span className="text-xs text-green-600 ml-2">Saved</span>
        )}
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Choose which emails you receive. Essential emails (sign-in links, project
        creation confirmations) are always sent.
      </p>

      <div className="space-y-3">
        {SETTINGS.map((s) => {
          const Icon = s.icon;
          const enabled = prefs[s.key];

          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggle(s.key)}
              disabled={isPending}
              className={`w-full text-left flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 ${
                enabled
                  ? "bg-white border-blue/30 shadow-sm"
                  : "bg-slate-50 border-slate-200 opacity-70"
              } ${isPending ? "cursor-wait" : "cursor-pointer hover:border-blue/40"}`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  enabled ? "bg-blue/10" : "bg-slate-200"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    enabled ? "text-blue" : "text-slate-400"
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-navy">
                    {s.label}
                  </span>
                  {/* Toggle switch */}
                  <div
                    className={`w-10 h-6 rounded-full relative transition-colors duration-200 ${
                      enabled ? "bg-blue" : "bg-slate-300"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                        enabled ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 pr-12">
                  {s.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
