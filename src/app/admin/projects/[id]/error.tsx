"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminProjectError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[Admin Project Error]", error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
        <AlertTriangle className="w-7 h-7 text-red-500" />
      </div>
      <h2 className="text-xl font-semibold text-navy mb-2">
        Something went wrong
      </h2>
      <p className="text-slate-500 text-sm mb-6">
        There was an error loading this project. This is usually temporary
        &mdash; please try again.
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
