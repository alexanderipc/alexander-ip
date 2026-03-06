"use client";

import { useState, useTransition } from "react";
import { BellOff, Bell } from "lucide-react";

interface NotificationMuteToggleProps {
  projectId: string;
  muted: boolean;
  label: string;
  action: (projectId: string) => Promise<{ success: boolean }>;
}

export default function NotificationMuteToggle({
  projectId,
  muted,
  label,
  action,
}: NotificationMuteToggleProps) {
  const [optimisticMuted, setOptimisticMuted] = useState(muted);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    setOptimisticMuted(!optimisticMuted);
    startTransition(async () => {
      try {
        await action(projectId);
      } catch {
        setOptimisticMuted(optimisticMuted); // revert on error
      }
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className="flex items-center gap-2 text-sm text-slate-500 hover:text-navy transition-colors disabled:opacity-50"
    >
      {optimisticMuted ? (
        <BellOff className="w-4 h-4 text-orange-500" />
      ) : (
        <Bell className="w-4 h-4" />
      )}
      <span>{label}</span>
      <span
        className={`ml-auto text-xs font-medium ${
          optimisticMuted ? "text-orange-500" : "text-green-600"
        }`}
      >
        {optimisticMuted ? "Muted" : "On"}
      </span>
    </button>
  );
}
