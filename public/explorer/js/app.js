// ═══════════════════════════════════════════════════
// App Controller — orchestrates search, viz, panel, chat
// ═══════════════════════════════════════════════════

import { PortfolioClient } from './dkg-client.js';
import { PatentTree3D as PatentTree } from './patent-tree-3d.js';
import { DetailPanel } from './panel.js';
import { ChatPanel } from './chat.js';
import { LandingScene } from './landing-scene.js';

// ─── Mobile Detection ───
function isMobile() { return window.innerWidth <= 768; }
function updateMobileClass() {
  document.body.classList.toggle('mobile', isMobile());
}
updateMobileClass();
window.addEventListener('resize', updateMobileClass);

// ─── Init ───
const portfolio = new PortfolioClient();
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

// ─── Mobile List + Toggle ───
const mobileListToggle = document.getElementById('mobile-list-toggle');
const mobileListBody = document.getElementById('mobile-list-body');
const mobileListCount = document.getElementById('mobile-list-count');
const mobilePatentItems = document.getElementById('mobile-patent-items');
const mobileListSection = document.getElementById('mobile-patent-list');

if (mobileListToggle && mobileListSection) {
  mobileListToggle.addEventListener('click', () => {
    mobileListSection.classList.toggle('collapsed');
    const chevron = mobileListToggle.querySelector('.mobile-chevron');
    if (chevron) chevron.textContent = mobileListSection.classList.contains('collapsed') ? '\u25B2' : '\u25BC';
  });
}

function populateMobileList(patents) {
  if (!mobilePatentItems) return;
  mobilePatentItems.innerHTML = '';
  if (mobileListCount) mobileListCount.textContent = `(${patents.length})`;

  const colorOrder = { '#22c55e': 0, '#1a9baa': 0, '#3b82f6': 1, '#3672b8': 1, '#a855f7': 2, '#7b4fb0': 2 };
  const sorted = [...patents].sort((a, b) => {
    const aO = colorOrder[a.statusColor] ?? 3;
    const bO = colorOrder[b.statusColor] ?? 3;
    return aO - bO;
  });

  sorted.forEach(patent => {
    const li = document.createElement('li');
    li.className = 'mobile-patent-item';

    const statusColor = patent.statusColor || '#6a7a8c';
    const number = patent.patentNumber || patent.applicationNumber || 'Unknown';
    const title = patent.title || '';
    const espacenet = patent.espacenet || '';

    li.innerHTML = `
      <div class="mobile-patent-header">
        <span class="mobile-patent-dot" style="background:${statusColor}"></span>
        <span class="mobile-patent-number">${number}</span>
      </div>
      <div class="mobile-patent-detail">
        <div class="mobile-patent-title">${title}</div>
        ${espacenet ? `<a class="mobile-patent-link" href="${espacenet}" target="_blank" rel="noopener">View on Espacenet \u2192</a>` : ''}
      </div>`;

    li.querySelector('.mobile-patent-header').addEventListener('click', () => {
      li.classList.toggle('expanded');
    });

    mobilePatentItems.appendChild(li);
  });
}

// ─── Search ───
async function search() {
  const query = searchInput.value.trim();
  if (!query) { searchInput.focus(); return; }

  searchBtn.disabled = true;
  searchBtn.textContent = 'Loading...';
  setBadge('loading', 'Loading portfolio...');

  // Show loading overlay (cinematic transition)
  const isFirstLoad = document.getElementById('landing').style.display !== 'none';
  if (isFirstLoad) {
    if (landingScene) { landingScene.dispose(); landingScene = null; }
    document.getElementById('landing').style.display = 'none';
    loadingOverlay.style.display = 'flex';
  }

  try {
    const result = await portfolio.load(query);
    currentPortfolio = result;

    const count = result.patents?.length || 0;
    setBadge('live', `${count} patent${count !== 1 ? 's' : ''} loaded`);

    if (result.error) {
      statusText.textContent = `Note: ${result.error}`;
      statusText.style.display = 'block';
    } else {
      statusText.style.display = 'none';
    }

    // Show workspace before rendering so Three.js can measure container
    document.getElementById('workspace').style.display = 'flex';

    // Render visualization (triggers camera fly-in animation)
    const slug = result.slug || '';
    tree.setPortfolioSlug(slug);
    panel._portfolioSlug = slug;
    tree.render(result.patents);

    // Load into chat
    chat.setPortfolio(result.patents);

    // Populate mobile patent list
    populateMobileList(result.patents);

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
const q = params.get('q');
if (q) {
  searchInput.value = q;
  search();
}

// ─── Waitlist Modal ───
const waitlistBtn = document.getElementById('waitlist-btn');
const topbarWaitlistBtn = document.getElementById('topbar-waitlist-btn');
const waitlistOverlay = document.getElementById('waitlist-overlay');
const waitlistForm = document.getElementById('waitlist-form');
const waitlistMessage = document.getElementById('waitlist-message');

if (waitlistBtn && waitlistOverlay) {
  waitlistBtn.addEventListener('click', () => {
    waitlistOverlay.classList.add('open');
    waitlistMessage.textContent = '';
    const firstInput = waitlistForm?.querySelector('input');
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
  });

  waitlistOverlay.querySelector('.waitlist-close')?.addEventListener('click', () => {
    waitlistOverlay.classList.remove('open');
  });

  waitlistOverlay.addEventListener('click', (e) => {
    if (e.target === waitlistOverlay) waitlistOverlay.classList.remove('open');
  });

  if (topbarWaitlistBtn) {
    topbarWaitlistBtn.addEventListener('click', () => {
      waitlistOverlay.classList.add('open');
      waitlistMessage.textContent = '';
      const firstInput = waitlistForm?.querySelector('input');
      if (firstInput) setTimeout(() => firstInput.focus(), 100);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && waitlistOverlay.classList.contains('open')) {
      waitlistOverlay.classList.remove('open');
    }
  });
}

// ─── Mobile: Legend toggle ───
const legendToggle = document.getElementById('legend-toggle');
const legend = document.getElementById('legend');
if (legendToggle && legend) {
  legendToggle.addEventListener('click', () => {
    legend.classList.toggle('mobile-visible');
  });
}

// ─── Mobile: Auto-collapse chat when detail panel opens ───
const chatPanel = document.getElementById('chat');
const origPanelOpen = panel.open.bind(panel);
panel.open = function(patent) {
  if (isMobile() && chatPanel) {
    chatPanel.classList.remove('mobile-expanded');
  }
  origPanelOpen(patent);
};

if (waitlistForm) {
  waitlistForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = waitlistForm.name.value.trim();
    const email = waitlistForm.email.value.trim();
    if (!name || !email) return;

    const submitBtn = waitlistForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    waitlistMessage.textContent = '';

    try {
      const res = await fetch('/api/explorer/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();

      if (res.ok) {
        waitlistMessage.style.color = '#22c55e';
        waitlistMessage.textContent = data.message || "You're on the list! Check your email.";
        waitlistForm.reset();
        setTimeout(() => waitlistOverlay.classList.remove('open'), 3000);
      } else {
        waitlistMessage.style.color = '#ef4444';
        waitlistMessage.textContent = data.error || 'Something went wrong.';
      }
    } catch {
      waitlistMessage.style.color = '#ef4444';
      waitlistMessage.textContent = 'Network error. Please try again.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign Up';
    }
  });
}
