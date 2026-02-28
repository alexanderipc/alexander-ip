export default function ProjectDetailLoading() {
  return (
    <div className="animate-pulse">
      {/* Back link */}
      <div className="h-4 bg-slate-200 rounded w-32 mb-6" />

      {/* Header card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="h-4 bg-slate-200 rounded w-28 mb-2" />
        <div className="h-7 bg-slate-200 rounded w-64 mb-4" />
        <div className="h-2 bg-slate-200 rounded-full w-full mb-4" />
        <div className="flex gap-6">
          <div className="h-4 bg-slate-200 rounded w-32" />
          <div className="h-4 bg-slate-200 rounded w-40" />
        </div>
      </div>

      {/* Timeline card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="h-4 bg-slate-200 rounded w-20 mb-4" />
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 bg-slate-200 rounded-full w-24" />
          ))}
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="h-4 bg-slate-200 rounded w-24 mb-4" />
            <div className="space-y-3">
              <div className="h-12 bg-slate-200 rounded-lg" />
              <div className="h-12 bg-slate-200 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="h-4 bg-slate-200 rounded w-24 mb-4" />
            <div className="h-20 bg-slate-200 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
