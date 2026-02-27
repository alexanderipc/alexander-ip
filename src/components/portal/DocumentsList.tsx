import type { ProjectDocument } from "@/lib/supabase/types";
import { FileText, Download } from "lucide-react";

const typeLabels: Record<string, string> = {
  patent_application: "Patent Application",
  office_action: "Office Action",
  response: "Response",
  search_report: "Search Report",
  filing_receipt: "Filing Receipt",
  invoice: "Invoice",
  correspondence: "Correspondence",
  illustration: "Illustration",
  other: "Document",
};

interface DocumentsListProps {
  documents: (ProjectDocument & { signed_url?: string })[];
}

export default function DocumentsList({ documents }: DocumentsListProps) {
  if (documents.length === 0) {
    return (
      <p className="text-sm text-slate-400 italic">
        No documents yet — files will appear here as they become available.
      </p>
    );
  }

  return (
    <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
      {documents.map((doc) => (
        <a
          key={doc.id}
          href={doc.signed_url || doc.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="w-5 h-5 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-navy truncate group-hover:text-blue-600 transition-colors">
                {doc.filename}
              </p>
              <p className="text-xs text-slate-400">
                {typeLabels[doc.document_type] || doc.document_type} ·{" "}
                {new Date(doc.uploaded_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <Download className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
        </a>
      ))}
    </div>
  );
}
