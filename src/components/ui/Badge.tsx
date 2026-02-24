interface BadgeProps {
  children: React.ReactNode;
  variant?: "teal" | "navy" | "amber" | "slate";
  className?: string;
}

const variants = {
  teal: "bg-teal/10 text-teal-dark",
  navy: "bg-navy/10 text-navy",
  amber: "bg-amber/10 text-amber-light",
  slate: "bg-slate-100 text-slate-600",
};

export default function Badge({
  children,
  variant = "teal",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
