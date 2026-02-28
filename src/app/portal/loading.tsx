export default function PortalLoading() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 bg-slate-200 rounded w-48 mb-2" />
          <div className="h-4 bg-slate-200 rounded w-64" />
        </div>
        <div className="h-10 bg-slate-200 rounded-lg w-32" />
      </div>

      {/* Project cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200 p-6"
          >
            <div className="h-4 bg-slate-200 rounded w-24 mb-3" />
            <div className="h-6 bg-slate-200 rounded w-48 mb-4" />
            <div className="h-2 bg-slate-200 rounded-full w-full mb-3" />
            <div className="flex items-center justify-between">
              <div className="h-4 bg-slate-200 rounded w-20" />
              <div className="h-4 bg-slate-200 rounded w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
