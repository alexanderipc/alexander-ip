// ═══════════════════════════════════════════════════
// Portfolio Client — fetches patent portfolio data
// ═══════════════════════════════════════════════════

export class PortfolioClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  // Load portfolio by patent number or keyword → returns { source, patents[], slug }
  async load(query) {
    const res = await fetch(`${this.baseUrl}/api/explorer/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.trim() })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Search failed: ${res.status}`);
    }
    return res.json();
  }
}
