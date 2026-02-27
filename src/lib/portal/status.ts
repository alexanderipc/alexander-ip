/**
 * Status workflow definitions for all service types.
 * Single source of truth used by both portal (client) and admin UIs.
 */

import type { ServiceType } from "@/lib/supabase/types";

/* ── Status arrays (ordered) ────────────────────────────────── */

export const DRAFTING_STATUSES = [
  "payment_received",
  "in_queue",
  "research_and_analysis",
  "drafting_in_progress",
  "internal_review",
  "draft_delivered",
  "client_review",
  "revisions",
  "final_version_ready",
  "filing",
  "filed_awaiting_receipt",
  "complete",
] as const;

export const PROSECUTION_STATUSES = [
  "payment_received",
  "office_action_review",
  "strategy_development",
  "strategy_proposal_sent",
  "client_decision_pending",
  "response_drafting",
  "response_review",
  "response_filed",
  "awaiting_examiner",
  "complete_granted",
] as const;

export const SEARCH_STATUSES = [
  "payment_received",
  "search_in_progress",
  "analysis_and_reporting",
  "report_delivered",
  "complete",
] as const;

export const GENERIC_STATUSES = [
  "payment_received",
  "in_progress",
  "review",
  "delivered",
  "complete",
] as const;

/* ── Service type → status flow mapping ─────────────────────── */

export const STATUS_FLOWS: Record<ServiceType, readonly string[]> = {
  patent_drafting: DRAFTING_STATUSES,
  patent_prosecution: PROSECUTION_STATUSES,
  patent_search: SEARCH_STATUSES,
  consultation: GENERIC_STATUSES,
  international_filing: GENERIC_STATUSES,
  fto: GENERIC_STATUSES,
  illustrations: GENERIC_STATUSES,
  filing: GENERIC_STATUSES,
  ip_valuation: GENERIC_STATUSES,
};

/* ── Default timelines (business days or calendar days) ──────── */

export const DEFAULT_TIMELINES: Record<ServiceType, number | null> = {
  consultation: 3,
  patent_search: 21,
  patent_drafting: 45,
  patent_prosecution: 30,
  international_filing: null, // must be set manually
  fto: 21,
  illustrations: 14,
  filing: 5,
  ip_valuation: 30,
};

/* ── Human-readable labels ───────────────────────────────────── */

const STATUS_LABELS: Record<string, string> = {
  // Drafting
  payment_received: "Payment Received",
  in_queue: "In Queue",
  research_and_analysis: "Research & Analysis",
  drafting_in_progress: "Drafting in Progress",
  internal_review: "Internal Review",
  draft_delivered: "Draft Delivered for Review",
  client_review: "Client Review Period",
  revisions: "Revisions",
  final_version_ready: "Final Version Ready",
  filing: "Filing",
  filed_awaiting_receipt: "Filed — Awaiting Receipt",
  complete: "Complete",

  // Prosecution
  office_action_review: "Office Action Under Review",
  strategy_development: "Strategy Development",
  strategy_proposal_sent: "Strategy Proposal Sent",
  client_decision_pending: "Client Decision Pending",
  response_drafting: "Response Drafting",
  response_review: "Response Under Review",
  response_filed: "Response Filed",
  awaiting_examiner: "Awaiting Examiner Reply",
  complete_granted: "Complete — Patent Granted",

  // Search
  search_in_progress: "Search in Progress",
  analysis_and_reporting: "Analysis & Report Writing",
  report_delivered: "Report Delivered",

  // Generic
  in_progress: "In Progress",
  review: "Under Review",
  delivered: "Delivered",
};

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── Service type labels ─────────────────────────────────────── */

const SERVICE_LABELS: Record<ServiceType, string> = {
  consultation: "Consultation",
  patent_search: "Patent Search",
  patent_drafting: "Patent Drafting",
  patent_prosecution: "Patent Prosecution",
  international_filing: "International Filing",
  fto: "FTO / Infringement Check",
  illustrations: "Patent Illustrations",
  filing: "Patent Filing",
  ip_valuation: "IP Valuation",
};

export function getServiceLabel(serviceType: ServiceType): string {
  return SERVICE_LABELS[serviceType] || serviceType;
}

/* ── Status utilities ────────────────────────────────────────── */

export function getStatusFlow(serviceType: ServiceType): readonly string[] {
  return STATUS_FLOWS[serviceType] || GENERIC_STATUSES;
}

export function getStatusIndex(serviceType: ServiceType, status: string): number {
  const flow = getStatusFlow(serviceType);
  const idx = flow.indexOf(status);
  return idx >= 0 ? idx : 0;
}

export function getProgressPercent(serviceType: ServiceType, status: string): number {
  const flow = getStatusFlow(serviceType);
  const idx = flow.indexOf(status);
  if (idx < 0) return 0;
  if (idx === flow.length - 1) return 100;
  return Math.round((idx / (flow.length - 1)) * 100);
}

export function getNextStatus(serviceType: ServiceType, currentStatus: string): string | null {
  const flow = getStatusFlow(serviceType);
  const idx = flow.indexOf(currentStatus);
  if (idx < 0 || idx >= flow.length - 1) return null;
  return flow[idx + 1];
}

export function getPreviousStatus(serviceType: ServiceType, currentStatus: string): string | null {
  const flow = getStatusFlow(serviceType);
  const idx = flow.indexOf(currentStatus);
  if (idx <= 0) return null;
  return flow[idx - 1];
}

export function isComplete(status: string): boolean {
  return status === "complete" || status === "complete_granted";
}

/* ── Status colors for badges ────────────────────────────────── */

type StatusColor = "blue" | "teal" | "amber" | "green" | "red" | "slate";

export function getStatusColor(status: string): StatusColor {
  if (isComplete(status)) return "green";
  if (status === "payment_received" || status === "in_queue") return "slate";
  if (status.includes("client") || status.includes("pending")) return "amber";
  if (status.includes("delivered") || status.includes("ready") || status.includes("report_delivered")) return "teal";
  if (status.includes("filed") || status.includes("awaiting")) return "blue";
  return "blue";
}

/* ── Delivery date calculation ───────────────────────────────── */

export function calculateDeliveryDate(startDate: string, timelineDays: number): string {
  const start = new Date(startDate);
  start.setDate(start.getDate() + timelineDays);
  return start.toISOString().split("T")[0];
}

export function getDaysRemaining(deliveryDate: string): number {
  const delivery = new Date(deliveryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  delivery.setHours(0, 0, 0, 0);
  return Math.ceil((delivery.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getDeadlineUrgency(deliveryDate: string): "overdue" | "urgent" | "normal" | "complete" {
  const days = getDaysRemaining(deliveryDate);
  if (days < 0) return "overdue";
  if (days <= 7) return "urgent";
  return "normal";
}
