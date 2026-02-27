import type { ProjectMilestone } from "@/lib/supabase/types";
import { CheckCircle, Circle } from "lucide-react";

interface MilestonesListProps {
  milestones: ProjectMilestone[];
}

export default function MilestonesList({ milestones }: MilestonesListProps) {
  if (milestones.length === 0) return null;

  return (
    <div className="space-y-2">
      {milestones.map((m) => (
        <div
          key={m.id}
          className="flex items-center gap-3 py-2"
        >
          {m.completed_date ? (
            <CheckCircle className="w-5 h-5 text-teal-500 shrink-0" />
          ) : (
            <Circle className="w-5 h-5 text-slate-300 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm ${
                m.completed_date
                  ? "text-slate-400 line-through"
                  : "text-navy font-medium"
              }`}
            >
              {m.title}
            </p>
          </div>
          {m.target_date && (
            <span
              className={`text-xs shrink-0 ${
                m.completed_date ? "text-slate-300" : "text-slate-500"
              }`}
            >
              {new Date(m.target_date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
