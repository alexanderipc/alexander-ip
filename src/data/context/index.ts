// Context file loader — maps portfolio slugs to rich analysis documents
// Each context file exports a default string with verbatim claims, prosecution history, and strategy

const LOADERS: Record<string, () => Promise<string>> = {
  moye: () => import("./moye").then((m) => m.default),
};

// Map portfolio slugs to context file slugs
const CONTEXT_IDS: Record<string, string> = {
  moye: "moye",
  "moye-portfolio": "moye",
};

export function resolveContextId(
  slug: string | null
): string | null {
  if (slug && CONTEXT_IDS[slug]) return CONTEXT_IDS[slug];
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
