// ═══════════════════════════════════════════════════
// Patent Client — fetches & parses patent portfolio data
// ═══════════════════════════════════════════════════

export class DKGClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl; // server API base (empty = same origin)
  }

  // Search for a patent by number → returns portfolio identifier
  async search(query) {
    const res = await fetch(`${this.baseUrl}/api/explorer/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Search failed: ${res.status}`);
    }
    return res.json();
  }

  // Fetch full portfolio → returns { source, patents[] }
  async fetchPortfolio(ual) {
    const res = await fetch(`${this.baseUrl}/api/explorer/portfolio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ual })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Portfolio fetch failed: ${res.status}`);
    }
    return res.json();
  }

  // Smart load: accepts patent number, returns portfolio
  async load(input) {
    input = input.trim();
    let ual;

    if (input.startsWith('did:dkg:')) {
      ual = input;
    } else {
      const result = await this.search(input);
      ual = result.ual;
    }

    return this.fetchPortfolio(ual);
  }
}
