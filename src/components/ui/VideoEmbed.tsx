import { Play } from "lucide-react";

interface VideoEmbedProps {
  title?: string;
  subtitle?: string;
  className?: string;
  aspectRatio?: "16/9" | "4/3" | "1/1";
}

export default function VideoEmbed({
  title = "Video coming soon",
  subtitle = "Alexander will be adding intro videos here",
  className = "",
  aspectRatio = "16/9",
}: VideoEmbedProps) {
  const aspectClasses = {
    "16/9": "aspect-video",
    "4/3": "aspect-[4/3]",
    "1/1": "aspect-square",
  };

  return (
    <div
      className={`relative ${aspectClasses[aspectRatio]} bg-gradient-to-br from-navy to-navy-light rounded-xl overflow-hidden ${className}`}
    >
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }} />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
        <div className="w-16 h-16 rounded-full bg-teal/90 flex items-center justify-center mb-4 shadow-lg">
          <Play className="w-7 h-7 ml-1" fill="white" />
        </div>
        <p className="text-lg font-semibold">{title}</p>
        {subtitle && (
          <p className="text-sm text-slate-300 mt-1">{subtitle}</p>
        )}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/40 to-transparent" />
    </div>
  );
}
