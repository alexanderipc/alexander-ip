interface ProgressBarProps {
  percent: number;
  size?: "sm" | "md";
}

export default function ProgressBar({ percent, size = "md" }: ProgressBarProps) {
  const h = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className={`w-full bg-slate-100 rounded-full ${h} overflow-hidden`}>
      <div
        className={`${h} rounded-full transition-all duration-500 ease-out ${
          percent >= 100
            ? "bg-teal-500"
            : percent > 50
            ? "bg-blue-500"
            : "bg-blue-400"
        }`}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}
