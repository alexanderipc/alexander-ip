interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
}

const paddings = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function Card({
  children,
  className = "",
  hover = false,
  padding = "md",
}: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm ${
        paddings[padding]
      } ${
        hover
          ? "transition-all duration-200 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
