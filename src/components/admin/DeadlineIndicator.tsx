import { getDaysRemaining, getDeadlineUrgency, isComplete } from "@/lib/portal/status";

interface DeadlineIndicatorProps {
  deliveryDate: string | null;
  status: string;
}

const DELIVERED_STATUSES = ["report_delivered", "draft_delivered", "review", "complete", "complete_granted"];

function isDelivered(status: string): boolean {
  return DELIVERED_STATUSES.includes(status) || status.includes("delivered");
}

export default function DeadlineIndicator({
  deliveryDate,
  status,
}: DeadlineIndicatorProps) {
  // Completed or delivered — show green with checkmark
  if (isComplete(status) || isDelivered(status)) {
    const label = isComplete(status) ? "Done" : "Delivered";
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        {label}
        {deliveryDate && (
          <span className="text-green-500 ml-0.5">
            {new Date(deliveryDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </span>
        )}
      </span>
    );
  }

  if (!deliveryDate) {
    return (
      <span className="text-xs text-slate-400">No date set</span>
    );
  }

  const days = getDaysRemaining(deliveryDate);
  const urgency = getDeadlineUrgency(deliveryDate);

  const formatted = new Date(deliveryDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  const colorMap = {
    overdue: "text-red-600",
    urgent: "text-amber-600",
    normal: "text-slate-600",
    complete: "text-green-600",
  };

  const dotMap = {
    overdue: "bg-red-500",
    urgent: "bg-amber-500",
    normal: "bg-slate-400",
    complete: "bg-green-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${colorMap[urgency]}`}
    >
      <span className={`w-2 h-2 rounded-full ${dotMap[urgency]}`} />
      {formatted}
      {urgency === "overdue" && (
        <span className="text-red-500">({Math.abs(days)}d late)</span>
      )}
      {urgency === "urgent" && (
        <span>({days}d)</span>
      )}
    </span>
  );
}
