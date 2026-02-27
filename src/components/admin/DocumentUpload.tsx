"use client";

import { useState, useTransition, useRef } from "react";
import { uploadDocument } from "@/app/admin/actions";
import { Upload } from "lucide-react";

interface DocumentUploadProps {
  projectId: string;
}

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

export default function DocumentUpload({ projectId }: DocumentUploadProps) {
  const [isPending, startTransition] = useTransition();
  const [docType, setDocType] = useState("other");
  const [clientVisible, setClientVisible] = useState(true);
  const [fileName, setFileName] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    formData.set("document_type", docType);
    formData.set("client_visible", clientVisible ? "true" : "false");

    startTransition(async () => {
      try {
        await uploadDocument(projectId, formData);
        setFileName(null);
        formRef.current?.reset();
      } catch (err) {
        console.error("Upload failed:", err);
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3">
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-4 cursor-pointer hover:border-blue-400 transition-colors">
        <Upload className="w-5 h-5 text-slate-400 mb-1" />
        <span className="text-xs text-slate-500">
          {fileName || "Choose file"}
        </span>
        <input
          type="file"
          name="file"
          className="hidden"
          onChange={(e) =>
            setFileName(e.target.files?.[0]?.name || null)
          }
        />
      </label>

      {fileName && (
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

          <button
            type="submit"
            disabled={isPending}
            className="w-full px-3 py-2 rounded-lg bg-navy text-white text-xs font-medium hover:bg-navy-light disabled:opacity-50 transition-colors"
          >
            {isPending ? "Uploading..." : "Upload"}
          </button>
        </>
      )}
    </form>
  );
}
