"use client";

import { useState, useTransition, useRef } from "react";
import { clientUploadDocument } from "@/app/portal/actions";
import { Upload, X, CheckCircle2 } from "lucide-react";

interface ClientDocumentUploadProps {
  projectId: string;
}

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".doc",
  ".docx",
  ".txt",
];

export default function ClientDocumentUpload({
  projectId,
}: ClientDocumentUploadProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setSuccess(false);
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("File is too large (max 10 MB)");
      setSelectedFile(null);
      e.target.value = "";
      return;
    }
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(
        `File type not allowed. Accepted: ${ALLOWED_EXTENSIONS.join(", ")}`
      );
      setSelectedFile(null);
      e.target.value = "";
      return;
    }
    setSelectedFile(file);
  }

  function clearFile() {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSubmit() {
    if (!selectedFile) {
      setError("No file selected");
      return;
    }

    setError(null);
    setSuccess(false);

    // Build FormData manually with the stored File reference
    const formData = new FormData();
    formData.append("file", selectedFile);

    startTransition(async () => {
      try {
        await clientUploadDocument(projectId, formData);
        setSelectedFile(null);
        setSuccess(true);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setTimeout(() => setSuccess(false), 4000);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Upload failed. Please retry."
        );
      }
    });
  }

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        type="file"
        className="hidden"
        accept={ALLOWED_EXTENSIONS.join(",")}
        onChange={handleFileChange}
        ref={fileInputRef}
      />

      {!selectedFile ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center w-full border-2 border-dashed border-slate-300 rounded-lg p-5 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
        >
          <Upload className="w-5 h-5 text-slate-400 mb-1.5" />
          <span className="text-sm font-medium text-slate-600">
            Upload a document
          </span>
          <span className="text-xs text-slate-400 mt-0.5">
            PDF, Word, images or text &middot; Max 10 MB
          </span>
        </button>
      ) : (
        <div className="border border-slate-200 rounded-lg p-3">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-navy truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-400">
                {(selectedFile.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Uploading..." : "Upload Document"}
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1.5">
          {error}
        </p>
      )}

      {success && (
        <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 rounded px-2 py-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Document uploaded successfully
        </div>
      )}
    </div>
  );
}
