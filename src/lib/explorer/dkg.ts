// ═══════════════════════════════════════════════════
// DKG Helpers — ported from patent-explorer/server.js
// ═══════════════════════════════════════════════════

import type { NQuad, Patent } from "./types";

const DKG =
  process.env.DKG_NODE_URL ||
  "https://v6-pegasus-node-02.origin-trail.network:8900";
const API_V = process.env.DKG_API_VERSION || "v1";

/**
 * Fetch a Knowledge Asset from DKG by UAL.
 * POST to initiate → poll until complete → return N-Quads array.
 */
export async function dkgGet(ual: string): Promise<string[]> {
  // Step 1: POST to initiate
  const initRes = await fetch(`${DKG}/${API_V}/get`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: ual, contentType: "public" }),
  });
  if (!initRes.ok) throw new Error(`DKG POST failed: ${initRes.status}`);
  const { operationId } = await initRes.json();
  if (!operationId) throw new Error("No operationId from DKG");

  // Step 2: Poll until complete (up to 60s)
  const start = Date.now();
  while (Date.now() - start < 60000) {
    await new Promise((r) => setTimeout(r, 2000));
    const poll = await fetch(`${DKG}/${API_V}/get/${operationId}`);
    if (!poll.ok) throw new Error(`DKG poll failed: ${poll.status}`);
    const data = await poll.json();
    if (data.status === "COMPLETED")
      return (data.data?.assertion?.public as string[]) || [];
    if (data.status === "FAILED") throw new Error("DKG operation failed");
  }
  throw new Error("DKG operation timed out");
}

/** Parse a single N-Quad line into subject/predicate/object. */
export function parseNQuad(line: string): NQuad | null {
  line = line.trim();
  if (!line || line.startsWith("#")) return null;

  const uriMatch = line.match(
    /^<([^>]+)>\s+<([^>]+)>\s+<([^>]+)>\s*\.$/
  );
  if (uriMatch)
    return { s: uriMatch[1], p: uriMatch[2], o: uriMatch[3], isUri: true };

  const litMatch = line.match(
    /^<([^>]+)>\s+<([^>]+)>\s+"((?:[^"\\]|\\.)*)"\s*(?:\^\^<[^>]+>)?\s*\.$/
  );
  if (litMatch) {
    const val = litMatch[3]
      .replace(/\\"/g, '"')
      .replace(/\\n/g, "\n")
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) =>
        String.fromCharCode(parseInt(h, 16))
      );
    return { s: litMatch[1], p: litMatch[2], o: val, isUri: false };
  }
  return null;
}

/** Convert an array of N-Quad strings into structured Patent objects. */
export function nquadsToPatents(nquads: string[]): Patent[] {
  // Group by subject
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subjects = new Map<string, any>();
  for (const line of nquads) {
    const q = parseNQuad(line);
    if (!q) continue;
    if (!subjects.has(q.s))
      subjects.set(q.s, { _id: q.s, _links: [] as { predicate: string; target: string }[] });
    const obj = subjects.get(q.s)!;
    const prop = q.p.split("#").pop()!.split("/").pop()!;
    if (q.isUri) {
      obj._links.push({ predicate: prop, target: q.o });
      if (prop === "type") obj._type = q.o;
      else obj[prop] = q.o;
    } else {
      obj[prop] = q.o;
    }
  }

  const allIds = new Set(subjects.keys());
  const patents: Patent[] = [];

  const edgeLabels: Record<string, string> = {
    continuationInPart: "CIP",
    parentPatent: "Parent",
    internationalFiling: "PCT",
    priorityParent: "Priority",
    originalPatent: "Original",
    childCIP: "CIP",
    childPCT: "PCT",
  };

  for (const [id, props] of subjects) {
    const typeStr: string = props._type || "";
    let statusColor = "#475569",
      type = "Unknown";
    if (typeStr.includes("GrantedPatent")) {
      statusColor = "#22c55e";
      type = "GrantedPatent";
    } else if (typeStr.includes("PendingPatent")) {
      statusColor = "#3b82f6";
      type = "PendingPatent";
    } else if (typeStr.includes("PCTApplication")) {
      statusColor = "#a855f7";
      type = "PCTApplication";
    } else if (typeStr.includes("UnpublishedApplication")) {
      statusColor = "#475569";
      type = "UnpublishedApplication";
    }

    // Build dates
    const dates: Patent["dates"] = {};
    if (props.filingDate)
      dates.filed = props.filingDate.replace(/^Filed:\s*/, "");
    if (props.publicationDate)
      dates.published = props.publicationDate.replace(/^Published:\s*/, "");
    if (props.grantDate)
      dates.granted = props.grantDate.replace(/^Granted:\s*/, "");
    if (props.expirationDate)
      dates.expires = props.expirationDate.replace(/^Expires:\s*/, "");
    if (props.priorityDate)
      dates.priority = props.priorityDate.replace(/^Priority:\s*/, "");

    // Build links
    const links: Patent["links"] = [];
    for (const link of props._links) {
      if (link.predicate === "type") continue;
      if (allIds.has(link.target)) {
        links.push({
          target: link.target,
          rel: link.predicate,
          label: edgeLabels[link.predicate] || link.predicate,
        });
      }
    }

    // Build claims
    const claims: NonNullable<Patent["claims"]> = [];
    if (props.independentClaim) {
      const m = props.independentClaim.match(/Claim\s+(\d+)/);
      claims.push({
        num: m ? +m[1] : 1,
        type: "Independent",
        text: props.independentClaim.replace(/^Claim\s+\d+\s*\u2014\s*/, ""),
      });
    }
    for (let i = 1; i <= 20; i++) {
      const k = `dependentClaim${i}`;
      if (props[k]) {
        const m = props[k].match(/Claim\s+(\d+)/);
        claims.push({
          num: m ? +m[1] : i,
          type: "Dependent",
          text: props[k].replace(/^Claim\s+\d+\s*\u2014\s*/, ""),
        });
      }
    }

    // Short label
    let shortLabel = "?";
    const pn: string = props.patentNumber || "";
    const wo = pn.match(/WO\s*[\d/]+(\d{3})\s/);
    if (wo) shortLabel = "WO'" + wo[1];
    else if (pn.startsWith("PCT/")) {
      const m = pn.match(/(\d+)$/);
      shortLabel = m ? "PCT'" + m[1] : pn.substring(0, 8);
    } else {
      const m = pn.match(/(\d{3})\s*[BA]|(\d{3})$/);
      if (m) shortLabel = "US'" + (m[1] || m[2]);
    }

    patents.push({
      id,
      type,
      family: null,
      title: props.title || "Untitled",
      patentNumber: props.patentNumber || id.split(":").pop()!,
      shortLabel,
      status: props.status || type,
      statusColor,
      patentType: props.patentType || type,
      jurisdiction: props.jurisdiction || "",
      applicationNumber: props.applicationNumber || "",
      inventor: props.inventor || "",
      assignee: props.assignee || "",
      dates,
      continuityChain: props.continuityChain || "",
      technologyField: props.technologyField || "",
      ipc: props.ipcClassification || "",
      cpc: props.cpcClassification || "",
      problemSolved: props.problemSolved || "",
      coreSolution: props.coreSolution || "",
      keyComponents: props.keyComponents || "",
      advantages: props.advantages || "",
      totalClaims: props.totalClaims || "",
      examinerReasons: props.examinerReasons || "",
      claims: claims.length ? claims : null,
      scopeComparison: props.scopeComparison || "",
      citedPriorArt: props.citedPriorArt || "",
      isrXCitation: props.isrXCitation || "",
      isrACitations: props.isrACitations || "",
      designatedStates: props.designatedStates || "",
      nationalPhaseDeadline: props.nationalPhaseDeadline || "",
      familyRole: props.familyRole || "",
      keyDifference: props.keyDifference || "",
      espacenet: props.espacenetURL || "",
      links,
    });
  }

  // Assign families via BFS connected components
  const idMap = new Map(patents.map((p) => [p.id, p]));
  const adj = new Map<string, Set<string>>();
  patents.forEach((p) => {
    if (!adj.has(p.id)) adj.set(p.id, new Set());
    (p.links || []).forEach((l) => {
      if (idMap.has(l.target)) {
        adj.get(p.id)!.add(l.target);
        if (!adj.has(l.target)) adj.set(l.target, new Set());
        adj.get(l.target)!.add(p.id);
      }
    });
  });
  const visited = new Set<string>();
  let fi = 0;
  for (const p of patents) {
    if (visited.has(p.id)) continue;
    const fname = `family${fi++}`;
    const queue = [p.id];
    while (queue.length) {
      const c = queue.shift()!;
      if (visited.has(c)) continue;
      visited.add(c);
      const cp = idMap.get(c);
      if (cp) cp.family = fname;
      (adj.get(c) || new Set()).forEach((n) => {
        if (!visited.has(n)) queue.push(n);
      });
    }
  }

  return patents;
}
