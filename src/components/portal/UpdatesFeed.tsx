import type { ProjectUpdate } from "@/lib/supabase/types";
import { getStatusLabel } from "@/lib/portal/status";
import StatusBadge from "./StatusBadge";
import Markdown from "react-markdown";

interface UpdatesFeedProps {
  updates: ProjectUpdate[];
}

export default function UpdatesFeed({ updates }: UpdatesFeedProps) {
  if (updates.length === 0) {
    return (
      <p className="text-sm text-slate-400 italic">No updates yet.</p>
    );
  }

  return (
    <div className="space-y-0">
      {updates.map((update, i) => (
        <div key={update.id} className="relative pl-8 pb-6">
          {/* Timeline line */}
          {i < updates.length - 1 && (
            <div className="absolute left-[11px] top-6 bottom-0 w-px bg-slate-200" />
          )}

          {/* Timeline dot */}
          <div className="absolute left-0 top-1.5 w-[23px] h-[23px] rounded-full bg-white border-2 border-blue-400 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <time className="text-xs text-slate-400">
                {new Date(update.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </time>
              {update.status_from && update.status_to && (
                <span className="text-xs text-slate-400">
                  {getStatusLabel(update.status_from)} →{" "}
                  <StatusBadge status={update.status_to} size="sm" />
                </span>
              )}
            </div>
            {update.note && (
              <div className="prose prose-sm prose-slate max-w-none">
                <Markdown>{update.note}</Markdown>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
