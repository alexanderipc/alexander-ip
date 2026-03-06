import type { ProjectDocument } from "@/lib/supabase/types";
import { FileText, FileType2, Download, Eye, EyeOff } from "lucide-react";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot).toLowerCase() : "";
}

function isImage(filename: string): boolean {
  return IMAGE_EXTENSIONS.includes(getExtension(filename));
}

function isPdf(filename: string): boolean {
  return getExtension(filename) === ".pdf";
}

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

interface DocumentThumbnailGridProps {
  documents: (ProjectDocument & { signed_url?: string })[];
  showVisibility?: boolean;
}

export default function DocumentThumbnailGrid({
  documents,
  showVisibility = false,
}: DocumentThumbnailGridProps) {
  if (documents.length === 0) {
    return (
      <p className="text-sm text-slate-400 italic">
        No documents yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {documents.map((doc) => {
        const url = doc.signed_url || doc.file_url;
        const image = isImage(doc.filename);
        const pdf = isPdf(doc.filename);

        return (
          <a
            key={doc.id}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative rounded-lg border border-slate-200 overflow-hidden hover:shadow-md hover:border-blue-300 transition-all"
          >
            {/* Thumbnail area */}
            <div className="aspect-square w-full bg-slate-50 flex items-center justify-center overflow-hidden">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt={doc.filename}
                  className="w-full h-full object-cover"
                />
              ) : pdf ? (
                <div className="flex flex-col items-center gap-2">
                  <FileType2 className="w-12 h-12 text-red-500" />
                  <span className="text-[10px] font-bold text-red-500 uppercase">PDF</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-12 h-12 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {getExtension(doc.filename).replace(".", "") || "FILE"}
                  </span>
                </div>
              )}
            </div>

            {/* Download overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-2 shadow-lg">
                <Download className="w-4 h-4 text-blue-600" />
              </div>
            </div>

            {/* File info */}
            <div className="p-2 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-700 truncate" title={doc.filename}>
                {doc.filename}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {typeLabels[doc.document_type] || doc.document_type}
              </p>
              {showVisibility && (
                <div className="flex items-center gap-1 mt-1">
                  {doc.client_visible ? (
                    <>
                      <Eye className="w-3 h-3 text-emerald-500" />
                      <span className="text-[10px] text-emerald-600">Client visible</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3 text-amber-500" />
                      <span className="text-[10px] text-amber-600">Admin only</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </a>
        );
      })}
    </div>
  );
}
