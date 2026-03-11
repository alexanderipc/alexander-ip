"use client";

import { useState, useTransition, useRef } from "react";
import { uploadDocument } from "@/app/admin/actions";
import { Upload, X, CheckCircle2, FileIcon, Loader2 } from "lucide-react";

interface DocumentUploadProps {
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

const DOC_TYPES = [
  { value: "patent_application", label: "Patent Application" },
  { value: "office_action", label: "Office Action" },
  { value: "response", label: "Response" },
  { value: "search_report", label: "Search Report" },
  { value: "filing_receipt", label: "Filing Receipt" },
  { value: "invoice", label: "Invoice" },
  { value: "correspondence", label: "Correspondence" },
  { value: "illustration", label: "Illustration" },
  { value: "other", label: "Other" },
];

type FileStatus = "pending" | "uploading" | "done" | "error";

interface QueuedFile {
  file: File;
  status: FileStatus;
  error?: string;
}

export default function DocumentUpload({ projectId }: DocumentUploadProps) {
  const [isPending, startTransition] = useTransition();
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [docType, setDocType] = useState("other");
  const [clientVisible, setClientVisible] = useState(true);
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

    if (errors.length > 0) setGlobalError(errors.join(". "));
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

        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "uploading" as FileStatus } : f
          )
        );

        try {
          const formData = new FormData();
          formData.append("file", files[i].file);
          formData.set("document_type", docType);
          formData.set("client_visible", clientVisible ? "true" : "false");
          await uploadDocument(projectId, formData);

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
      <input
        type="file"
        className="hidden"
        accept={ALLOWED_EXTENSIONS.join(",")}
        multiple
        onChange={handleFileChange}
        ref={fileInputRef}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex flex-col items-center justify-center w-full border-2 border-dashed border-slate-300 rounded-lg p-4 cursor-pointer hover:border-blue-400 transition-colors"
      >
        <Upload className="w-5 h-5 text-slate-400 mb-1" />
        <span className="text-xs text-slate-500">
          {files.length === 0 ? "Choose files" : "Add more files"}
        </span>
        <span className="text-[10px] text-slate-400 mt-0.5">
          Max 50 MB per file
        </span>
      </button>

      {/* File list */}
      {files.length > 0 && (
        <>
          <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
            {files.map((qf, i) => (
              <div
                key={`${qf.file.name}-${i}`}
                className="flex items-center gap-2 px-3 py-1.5"
              >
                {qf.status === "uploading" ? (
                  <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin flex-shrink-0" />
                ) : qf.status === "done" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                ) : qf.status === "error" ? (
                  <X className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                ) : (
                  <FileIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-navy truncate">{qf.file.name}</p>
                  {qf.error && (
                    <p className="text-[10px] text-red-500">{qf.error}</p>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 flex-shrink-0">
                  {formatSize(qf.file.size)}
                </span>
                {qf.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Options (apply to all files in batch) */}
          {pendingCount > 0 && (
            <>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs text-navy"
              >
                {DOC_TYPES.map((dt) => (
                  <option key={dt.value} value={dt.value}>
                    {dt.label}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={clientVisible}
                  onChange={(e) => setClientVisible(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Client visible
              </label>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={handleUpload}
                disabled={isPending}
                className="flex-1 px-3 py-2 rounded-lg bg-navy text-white text-xs font-medium hover:bg-navy-light disabled:opacity-50 transition-colors"
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
                className="flex-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors"
              >
                Done — clear
              </button>
            ) : (
              !isPending && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-500 text-xs hover:bg-slate-50 transition-colors"
                >
                  Clear
                </button>
              )
            )}
          </div>
        </>
      )}

      {globalError && (
        <p className="text-[10px] text-red-600 bg-red-50 rounded px-2 py-1">
          {globalError}
        </p>
      )}
    </div>
  );
}
