"use client";

import { useState, useEffect } from "react";
import { UploadCloud, X } from "lucide-react";

/**
 * Modal shown once when a client first opens their project portal.
 * Nudges them to upload invention disclosure documents.
 * Dismissed state is stored in localStorage to avoid nagging.
 */
export default function UploadNudgeModal({ projectId }: { projectId: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const key = `upload-nudge-dismissed-${projectId}`;
    const dismissed = localStorage.getItem(key);
    if (!dismissed) {
      // Small delay so the page loads first
      const timer = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [projectId]);

  function dismiss() {
    localStorage.setItem(`upload-nudge-dismissed-${projectId}`, "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-5">
          <UploadCloud className="w-8 h-8 text-blue-600" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-navy mb-2">
          Upload your invention documents
        </h2>

        {/* Description */}
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          To get started on your project, please upload any relevant materials
          &mdash; invention descriptions, sketches, diagrams, prior art, or
          reference documents. You&apos;ll find the upload area in the sidebar on
          your project page.
        </p>

        {/* CTA */}
        <button
          onClick={dismiss}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <UploadCloud className="w-4 h-4" />
          Got it, I&apos;ll upload my files
        </button>

        <p className="text-[11px] text-slate-400 mt-4">
          You can always upload files later from the project sidebar.
        </p>
      </div>
    </div>
  );
}
