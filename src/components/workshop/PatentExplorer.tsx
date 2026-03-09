"use client";

import { useState } from "react";

interface PatentExplorerProps {
  src?: string;
}

export default function PatentExplorer({
  src = "/explorer",
}: PatentExplorerProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-[#070b14]"
         style={{ height: "calc(100vh - 220px)", minHeight: "600px" }}>
      {/* Loading state */}
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#070b14]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 mb-4">
              <svg
                className="w-6 h-6 text-blue-500 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
            <p className="text-slate-400 text-sm">Loading Portfolio Explorer...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#070b14]">
          <div className="text-center max-w-md px-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-800 mb-4">
              <svg viewBox="0 0 40 40" width="28" height="28">
                <path
                  d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z"
                  fill="none" stroke="#3b82f6" strokeWidth="2"
                />
                <path
                  d="M20 8 L30 14 L30 26 L20 32 L10 26 L10 14 Z"
                  fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.4"
                />
              </svg>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">
              Portfolio Explorer Offline
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              The Portfolio Explorer is currently running locally.
              To view the interactive 3D visualization, start the explorer server.
            </p>
            <code className="block bg-slate-800/50 text-slate-300 text-xs px-4 py-2 rounded-lg font-mono">
              cd patent-explorer && node server.js
            </code>
          </div>
        </div>
      )}

      {/* Iframe */}
      <iframe
        src={src}
        className="w-full h-full border-0"
        title="Portfolio Explorer"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{ display: error ? "none" : "block" }}
      />
    </div>
  );
}
