import Link from "next/link";
import { Calendar, ArrowRight, MessageCircle } from "lucide-react";
import type { Project } from "@/lib/supabase/types";
import { getServiceLabel, getProgressPercent, getDaysRemaining, isComplete } from "@/lib/portal/status";
import StatusBadge from "./StatusBadge";
import ProgressBar from "./ProgressBar";

interface ProjectCardProps {
  project: Project;
  href: string;
  unreadMessages?: number;
}

export default function ProjectCard({ project, href, unreadMessages = 0 }: ProjectCardProps) {
  const percent = getProgressPercent(project.service_type, project.status);
  const complete = isComplete(project.status);
  const daysLeft = project.estimated_delivery_date
    ? getDaysRemaining(project.estimated_delivery_date)
    : null;

  return (
    <Link
      href={href}
      className="block bg-white rounded-xl border border-slate-200 p-6 hover:border-blue-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-blue-600 mb-1">
            {getServiceLabel(project.service_type)}
          </p>
          <h3 className="text-lg font-semibold text-navy truncate group-hover:text-blue-700 transition-colors">
            {project.title}
          </h3>
        </div>
        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0 mt-1" />
      </div>

      <div className="mb-4 flex items-center gap-2">
        <StatusBadge status={project.status} size="sm" />
        {unreadMessages > 0 && (
          <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            <MessageCircle className="w-3 h-3" />
            {unreadMessages} new
          </span>
        )}
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span>Progress</span>
          <span>{percent}%</span>
        </div>
        <ProgressBar percent={percent} size="sm" />
      </div>

      {!complete && project.estimated_delivery_date && (
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <Calendar className="w-4 h-4" />
          <span>
            Est. delivery:{" "}
            {new Date(project.estimated_delivery_date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          {daysLeft !== null && daysLeft > 0 && (
            <span className="text-slate-400">
              ({daysLeft} day{daysLeft !== 1 ? "s" : ""})
            </span>
          )}
          {daysLeft !== null && daysLeft < 0 && (
            <span className="text-red-500 font-medium">
              ({Math.abs(daysLeft)} day{Math.abs(daysLeft) !== 1 ? "s" : ""} overdue)
            </span>
          )}
        </div>
      )}

      {complete && project.actual_delivery_date && (
        <div className="flex items-center gap-1.5 text-sm text-teal-600">
          <Calendar className="w-4 h-4" />
          <span>
            Completed{" "}
            {new Date(project.actual_delivery_date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      )}
    </Link>
  );
}
