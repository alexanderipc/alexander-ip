// Context file loader — maps portfolio identifiers to rich analysis documents
// Each context file exports a default string with verbatim claims, prosecution history, and strategy

const LOADERS: Record<string, () => Promise<string>> = {
  moye: () => import("./moye").then((m) => m.default),
};

// Map UALs and search terms to context file slugs
const CONTEXT_IDS: Record<string, string> = {
  "did:dkg:base:84532/0xd5550173b0f7b8766ab2770e4ba86caf714a5af5/847382":
    "moye",
  moye: "moye",
};

export function resolveContextId(
  ual: string | null,
  searchTerm: string | null
): string | null {
  if (ual && CONTEXT_IDS[ual]) return CONTEXT_IDS[ual];
  if (searchTerm) {
    const normalized = searchTerm.trim().toLowerCase();
    if (CONTEXT_IDS[normalized]) return CONTEXT_IDS[normalized];
  }
  return null;
}

export async function loadContext(
  id: string | null
): Promise<string | null> {
  if (!id) return null;
  const loader = LOADERS[id];
  if (!loader) return null;
  try {
    return await loader();
  } catch {
    console.warn(`[Explorer] Failed to load context for: ${id}`);
    return null;
  }
}
