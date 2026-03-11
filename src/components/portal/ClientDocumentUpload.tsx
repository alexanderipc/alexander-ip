"use client";

import { useState, useTransition, useRef } from "react";
import { clientUploadDocument } from "@/app/portal/actions";
import { Upload, X, CheckCircle2, FileIcon, Loader2 } from "lucide-react";

interface ClientDocumentUploadProps {
  projectId: string;
}

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".doc",
  ".docx",
  ".txt",
  ".zip",
  ".rar",
  ".7z",
  ".xlsx",
  ".csv",
  ".pptx",
];

type FileStatus = "pending" | "uploading" | "done" | "error";

interface QueuedFile {
  file: File;
  status: FileStatus;
  error?: string;
}

export default function ClientDocumentUpload({
  projectId,
}: ClientDocumentUploadProps) {
  const [isPending, startTransition] = useTransition();
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setGlobalError(null);
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;

    const queued: QueuedFile[] = [];
    const errors: string[] = [];

    for (const file of Array.from(selected)) {
      if (file.size > MAX_SIZE) {
        errors.push(`${file.name}: too large (max 50 MB)`);
        continue;
      }
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        errors.push(`${file.name}: unsupported type`);
        continue;
      }
      queued.push({ file, status: "pending" });
    }

    if (errors.length > 0) {
      setGlobalError(errors.join(". "));
    }

    setFiles((prev) => [...prev, ...queued]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function clearAll() {
    setFiles([]);
    setGlobalError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleUpload() {
    const pending = files.filter((f) => f.status === "pending");
    if (pending.length === 0) return;

    startTransition(async () => {
      for (let i = 0; i < files.length; i++) {
        if (files[i].status !== "pending") continue;

        // Mark as uploading
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "uploading" as FileStatus } : f
          )
        );

        try {
          const formData = new FormData();
          formData.append("file", files[i].file);
          await clientUploadDocument(projectId, formData);

          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i ? { ...f, status: "done" as FileStatus } : f
            )
          );
        } catch (err) {
          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i
                ? {
                    ...f,
                    status: "error" as FileStatus,
                    error:
                      err instanceof Error ? err.message : "Upload failed",
                  }
                : f
            )
          );
        }
      }
    });
  }

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const doneCount = files.filter((f) => f.status === "done").length;
  const allDone = files.length > 0 && doneCount === files.length;

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        type="file"
        className="hidden"
        accept={ALLOWED_EXTENSIONS.join(",")}
        multiple
        onChange={handleFileChange}
        ref={fileInputRef}
      />

      {/* Drop zone / add button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex flex-col items-center justify-center w-full border-2 border-dashed border-slate-300 rounded-lg p-5 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
      >
        <Upload className="w-5 h-5 text-slate-400 mb-1.5" />
        <span className="text-sm font-medium text-slate-600">
          {files.length === 0 ? "Upload documents" : "Add more files"}
        </span>
        <span className="text-xs text-slate-400 mt-0.5">
          PDF, Word, Excel, images, archives &middot; Max 50 MB per file
        </span>
      </button>

      {/* File list */}
      {files.length > 0 && (
        <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
          {files.map((qf, i) => (
            <div
              key={`${qf.file.name}-${i}`}
              className="flex items-center gap-2 px-3 py-2"
            >
              {qf.status === "uploading" ? (
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
              ) : qf.status === "done" ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : qf.status === "error" ? (
                <X className="w-4 h-4 text-red-500 flex-shrink-0" />
              ) : (
                <FileIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-navy truncate">{qf.file.name}</p>
                <p className="text-[11px] text-slate-400">
                  {formatSize(qf.file.size)}
                  {qf.error && (
                    <span className="text-red-500 ml-1.5">{qf.error}</span>
                  )}
                </p>
              </div>
              {qf.status === "pending" && (
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {files.length > 0 && (
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={isPending}
              className="flex-1 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isPending
                ? "Uploading..."
                : `Upload ${pendingCount} file${pendingCount > 1 ? "s" : ""}`}
            </button>
          )}
          {allDone ? (
            <button
              type="button"
              onClick={clearAll}
              className="flex-1 px-3 py-2 rounded-lg bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 transition-colors"
            >
              All uploaded — clear list
            </button>
          ) : (
            !isPending && (
              <button
                type="button"
                onClick={clearAll}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-500 text-sm hover:bg-slate-50 transition-colors"
              >
                Clear
              </button>
            )
          )}
        </div>
      )}

      {/* Global error */}
      {globalError && (
        <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1.5">
          {globalError}
        </p>
      )}
    </div>
  );
}
