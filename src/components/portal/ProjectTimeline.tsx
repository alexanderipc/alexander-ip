import type { ServiceType } from "@/lib/supabase/types";
import { getStatusFlow, getStatusLabel, getStatusIndex } from "@/lib/portal/status";

interface ProjectTimelineProps {
  serviceType: ServiceType;
  currentStatus: string;
}

export default function ProjectTimeline({
  serviceType,
  currentStatus,
}: ProjectTimelineProps) {
  const flow = getStatusFlow(serviceType);
  const currentIdx = getStatusIndex(serviceType, currentStatus);

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center min-w-max py-4 px-2">
        {flow.map((status, i) => {
          const isPast = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isFuture = i > currentIdx;

          return (
            <div key={status} className="flex items-center">
              {/* Node */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isPast
                      ? "bg-teal-500 border-teal-500"
                      : isCurrent
                      ? "bg-blue-500 border-blue-500 ring-4 ring-blue-100"
                      : "bg-white border-slate-300"
                  }`}
                >
                  {isPast && (
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <span
                  className={`text-[10px] mt-1.5 max-w-[80px] text-center leading-tight ${
                    isCurrent
                      ? "text-blue-700 font-semibold"
                      : isPast
                      ? "text-teal-600"
                      : "text-slate-400"
                  }`}
                >
                  {getStatusLabel(status)}
                </span>
              </div>

              {/* Connector line */}
              {i < flow.length - 1 && (
                <div
                  className={`w-8 h-0.5 mx-1 mt-[-18px] ${
                    isPast
                      ? "bg-teal-400"
                      : isFuture
                      ? "bg-slate-200"
                      : "bg-blue-300"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
