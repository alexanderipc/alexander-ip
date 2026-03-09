// ═══════════════════════════════════════════════════
// App Controller — orchestrates search, viz, panel, chat
// ═══════════════════════════════════════════════════

import { DKGClient } from './dkg-client.js';
import { PatentTree3D as PatentTree } from './patent-tree-3d.js';
import { DetailPanel } from './panel.js';
import { ChatPanel } from './chat.js';
import { LandingScene } from './landing-scene.js';

// ─── Init ───
const dkg = new DKGClient();
const tree = new PatentTree(document.getElementById('viz'));
const panel = new DetailPanel(document.getElementById('panel'));
const chat = new ChatPanel(document.getElementById('chat'));

// ─── Landing Scene ───
let landingScene = null;
const landingCanvas = document.getElementById('landing-canvas');
if (landingCanvas) {
  landingScene = new LandingScene(landingCanvas);
}

const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const badge = document.getElementById('source-badge');
const statusText = document.getElementById('status-text');
const loadingOverlay = document.getElementById('loading-overlay');

let currentPortfolio = null;

// ─── Search ───
async function search() {
  const query = searchInput.value.trim();
  if (!query) { searchInput.focus(); return; }

  searchBtn.disabled = true;
  searchBtn.textContent = 'Loading...';
  setBadge('loading', 'Fetching from DKG...');

  // Show loading overlay (cinematic transition)
  const isFirstLoad = document.getElementById('landing').style.display !== 'none';
  if (isFirstLoad) {
    // Dispose landing scene
    if (landingScene) { landingScene.dispose(); landingScene = null; }
    document.getElementById('landing').style.display = 'none';
    loadingOverlay.style.display = 'flex';
  }

  try {
    const result = await dkg.load(query);
    currentPortfolio = result;

    const source = result.source === 'dkg-live' ? 'Live from DKG' :
      result.source === 'cache' ? 'Cached data' : 'Fallback data';
    const count = result.patents?.length || 0;
    setBadge(result.source === 'dkg-live' ? 'live' : 'fallback',
      `${source} \u2022 ${count} patents`);

    if (result.error) {
      statusText.textContent = `DKG warning: ${result.error}`;
      statusText.style.display = 'block';
    } else {
      statusText.style.display = 'none';
    }

    // Show workspace before rendering so Three.js can measure container
    document.getElementById('workspace').style.display = 'flex';

    // Render visualization (triggers camera fly-in animation)
    tree.render(result.patents);

    // Load into chat
    chat.setPortfolio(result.patents);

    // Fade out loading overlay after a brief moment
    if (loadingOverlay.style.display !== 'none') {
      loadingOverlay.style.transition = 'opacity 0.6s ease-out';
      loadingOverlay.style.opacity = '0';
      setTimeout(() => {
        loadingOverlay.style.display = 'none';
        loadingOverlay.style.opacity = '1';
        loadingOverlay.style.transition = '';
      }, 600);
    }

  } catch (err) {
    setBadge('error', err.message);
    // Hide loading overlay on error
    loadingOverlay.style.display = 'none';
    if (isFirstLoad) {
      document.getElementById('landing').style.display = 'flex';
    }
  } finally {
    searchBtn.disabled = false;
    searchBtn.textContent = 'Explore';
  }
}

searchBtn.addEventListener('click', search);
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') search();
});

// ─── Node interactions ───
tree.onNodeClick = (patent) => {
  panel.open(patent);
};

// Hover popout is now handled internally by PatentTree3D
// (side-anchored card with leader line + drawing thumbnail)
tree.onNodeHover = () => {};

panel.onFamilyClick = (targetId) => {
  const patent = currentPortfolio?.patents?.find(p => p.id === targetId);
  if (patent) panel.open(patent);
};

// ─── Filter toggles ───
document.querySelectorAll('.filter-toggle').forEach(el => {
  el.addEventListener('change', () => {
    tree.setFilter(el.dataset.filter, el.checked);
  });
});

// ─── Topbar search (in workspace view) ───
const topbarSearch = document.getElementById('topbar-search');
const topbarSearchBtn = document.getElementById('topbar-search-btn');
const topbarBadge = document.getElementById('topbar-badge');

topbarSearchBtn?.addEventListener('click', () => {
  searchInput.value = topbarSearch.value;
  search();
});
topbarSearch?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { searchInput.value = topbarSearch.value; search(); }
});

// ─── Badge helper ───
function setBadge(type, text) {
  badge.className = `source-badge ${type}`;
  badge.textContent = text;
  if (topbarBadge) {
    topbarBadge.className = `source-badge ${type}`;
    topbarBadge.textContent = text;
  }
}

// ─── Auto-load if URL has a query ───
const params = new URLSearchParams(window.location.search);
const q = params.get('q') || params.get('ual');
if (q) {
  searchInput.value = q;
  search();
}
