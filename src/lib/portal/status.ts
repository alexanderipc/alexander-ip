/**
 * Status workflow definitions for all service types.
 * Single source of truth used by both portal (client) and admin UIs.
 */

import type { ServiceType } from "@/lib/supabase/types";

/* ── Status arrays (ordered) ────────────────────────────────── */

export const DRAFTING_STATUSES = [
  "payment_received",
  "research_and_drafting",
  "draft_delivered",
  "filing",
  "filed",
  "complete",
] as const;

export const PROSECUTION_STATUSES = [
  "payment_received",
  "office_action_review",
  "response_drafting",
  "response_filed",
  "awaiting_examiner",
  "complete",
] as const;

export const SEARCH_STATUSES = [
  "payment_received",
  "search_in_progress",
  "report_writing",
  "report_delivered",
  "complete",
] as const;

export const CONSULTATION_STATUSES = [
  "payment_received",
  "consultation_scheduled",
  "complete",
] as const;

export const FILING_STATUSES = [
  "payment_received",
  "application_preparation",
  "filed",
  "complete",
] as const;

export const INTERNATIONAL_FILING_STATUSES = [
  "payment_received",
  "application_preparation",
  "national_phase_filed",
  "awaiting_receipts",
  "complete",
] as const;

export const FTO_STATUSES = [
  "payment_received",
  "analysis_in_progress",
  "report_writing",
  "report_delivered",
  "complete",
] as const;

export const ILLUSTRATION_STATUSES = [
  "payment_received",
  "illustration_in_progress",
  "figures_delivered",
  "complete",
] as const;

export const VALUATION_STATUSES = [
  "payment_received",
  "valuation_analysis",
  "report_delivered",
  "complete",
] as const;

/* ── Service type → status flow mapping ─────────────────────── */

export const STATUS_FLOWS: Record<ServiceType, readonly string[]> = {
  patent_drafting: DRAFTING_STATUSES,
  patent_prosecution: PROSECUTION_STATUSES,
  patent_search: SEARCH_STATUSES,
  consultation: CONSULTATION_STATUSES,
  international_filing: INTERNATIONAL_FILING_STATUSES,
  fto: FTO_STATUSES,
  illustrations: ILLUSTRATION_STATUSES,
  filing: FILING_STATUSES,
  ip_valuation: VALUATION_STATUSES,
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
  // Shared
  payment_received: "Payment Received",
  complete: "Complete",

  // Drafting
  research_and_drafting: "Research & Drafting",
  draft_delivered: "Draft Delivered",
  filing: "Filing",
  filed: "Filed",

  // Prosecution
  office_action_review: "Office Action Review",
  response_drafting: "Response Drafting",
  response_filed: "Response Filed",
  awaiting_examiner: "Awaiting Examiner",

  // Search & FTO
  search_in_progress: "Search in Progress",
  analysis_in_progress: "Analysis in Progress",
  report_writing: "Report Writing",
  report_delivered: "Report Delivered",

  // Consultation
  consultation_scheduled: "Consultation Scheduled",

  // Filing & International
  application_preparation: "Application Preparation",
  national_phase_filed: "National Phase Filed",
  awaiting_receipts: "Awaiting Receipts",

  // Illustrations
  illustration_in_progress: "Illustration in Progress",
  figures_delivered: "Figures Delivered",

  // Valuation
  valuation_analysis: "Valuation Analysis",
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
  return STATUS_FLOWS[serviceType] || CONSULTATION_STATUSES;
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
  return status === "complete";
}

/* ── Status colors for badges ────────────────────────────────── */

type StatusColor = "blue" | "teal" | "amber" | "green" | "red" | "slate";

export function getStatusColor(status: string): StatusColor {
  if (isComplete(status)) return "green";
  if (status === "payment_received") return "slate";
  if (status.includes("delivered") || status.includes("scheduled")) return "teal";
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
