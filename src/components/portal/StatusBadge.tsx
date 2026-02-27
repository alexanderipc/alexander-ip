import { getStatusLabel, getStatusColor } from "@/lib/portal/status";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const colorClasses: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  teal: "bg-teal-50 text-teal-700 border-teal-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  green: "bg-green-50 text-green-700 border-green-200",
  red: "bg-red-50 text-red-700 border-red-200",
  slate: "bg-slate-50 text-slate-600 border-slate-200",
};

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const color = getStatusColor(status);
  const classes = colorClasses[color] || colorClasses.blue;
  const sizeClasses = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${classes} ${sizeClasses}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
