// ═══════════════════════════════════════════════════
// Patent Explorer — TypeScript types
// ═══════════════════════════════════════════════════

export interface PatentClaim {
  num: number;
  type: string;
  text: string;
}

export interface PatentDates {
  filed?: string;
  published?: string;
  granted?: string;
  expires?: string;
  priority?: string;
}

export interface PatentLink {
  target: string;
  rel: string;
  label: string;
}

export interface Patent {
  id: string;
  type: string;
  family: string | null;
  title: string;
  patentNumber: string;
  shortLabel: string;
  status: string;
  statusColor: string;
  patentType: string;
  jurisdiction: string;
  applicationNumber: string;
  inventor: string;
  assignee: string;
  dates: PatentDates;
  continuityChain: string;
  technologyField: string;
  ipc: string;
  cpc: string;
  problemSolved: string;
  coreSolution: string;
  keyComponents: string;
  advantages: string;
  totalClaims: string;
  examinerReasons: string;
  claims: PatentClaim[] | null;
  scopeComparison: string;
  citedPriorArt: string;
  isrXCitation: string;
  isrACitations: string;
  designatedStates: string;
  nationalPhaseDeadline: string;
  familyRole: string;
  keyDifference: string;
  espacenet: string;
  links: PatentLink[];
}

export interface PortfolioResponse {
  source: "dkg-live" | "cache" | "fallback";
  ual?: string;
  patents: Patent[];
  error?: string;
  fetchedAt?: string;
}

export interface SearchResponse {
  ual: string;
  matchedBy: string;
}

export interface NQuad {
  s: string;
  p: string;
  o: string;
  isUri: boolean;
}
