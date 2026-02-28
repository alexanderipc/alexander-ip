/**
 * Hand-written Database types matching the Supabase schema.
 * Can be replaced with auto-generated types via:
 *   npx supabase gen types typescript --project-id <id>
 */

export type UserRole = "admin" | "client";

export type ServiceType =
  | "consultation"
  | "patent_search"
  | "patent_drafting"
  | "patent_prosecution"
  | "international_filing"
  | "fto"
  | "illustrations"
  | "filing"
  | "ip_valuation"
  | "custom";

export type DocumentType =
  | "patent_application"
  | "office_action"
  | "response"
  | "search_report"
  | "filing_receipt"
  | "invoice"
  | "correspondence"
  | "illustration"
  | "other";

export type RelationshipType =
  | "continuation"
  | "divisional"
  | "pct_national_phase"
  | "related"
  | "search_then_draft";

/* ── Row types ─────────────────────────────────────────────── */

export interface Profile {
  id: string;
  role: UserRole;
  name: string | null;
  email: string | null;
  company: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  service_type: ServiceType;
  title: string;
  description: string | null;
  status: string;
  jurisdictions: string[];
  start_date: string;
  default_timeline_days: number | null;
  estimated_delivery_date: string | null;
  actual_delivery_date: string | null;
  price_paid: number | null;
  currency: string;
  stripe_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  status_from: string | null;
  status_to: string;
  note: string | null;
  internal_note: string | null;
  notify_client: boolean;
  created_at: string;
}

export interface ProjectDocument {
  id: string;
  project_id: string;
  filename: string;
  file_url: string;
  document_type: DocumentType;
  client_visible: boolean;
  uploaded_at: string;
  uploaded_by: string | null;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  target_date: string | null;
  completed_date: string | null;
  is_client_visible: boolean;
  created_at: string;
}

export interface ProjectMessage {
  id: string;
  project_id: string;
  sender_id: string;
  body: string;
  is_admin: boolean;
  read_at: string | null;
  created_at: string;
}

export interface LinkedProject {
  id: string;
  project_a_id: string;
  project_b_id: string;
  relationship_type: RelationshipType;
  created_at: string;
}

/**
 * We intentionally don't use a Database generic with the Supabase client.
 * The Supabase auto-generated types require exact Relationships[] fields
 * that are complex to hand-write. Instead, we use the Row types above
 * with explicit type annotations on query results.
 *
 * When needed, generate proper types via:
 *   npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
 */

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Database {}
