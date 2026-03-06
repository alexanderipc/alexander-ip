import type { ProjectDocument } from "@/lib/supabase/types";
import DocumentThumbnailGrid from "@/components/ui/DocumentThumbnailGrid";

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

  return <DocumentThumbnailGrid documents={documents} />;
}
