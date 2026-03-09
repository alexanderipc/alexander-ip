// ═══════════════════════════════════════════════════
// Detail Panel — shows full patent info on click
// ═══════════════════════════════════════════════════

export class DetailPanel {
  constructor(panelEl) {
    this.el = panelEl;
    this.titleEl = panelEl.querySelector('.panel-title');
    this.numberEl = panelEl.querySelector('.panel-number');
    this.statusEl = panelEl.querySelector('.panel-status');
    this.bodyEl = panelEl.querySelector('.panel-body');
    this.onFamilyClick = null;

    panelEl.querySelector('.panel-close').addEventListener('click', () => this.close());
  }

  open(patent) {
    this.titleEl.textContent = patent.title;
    this.numberEl.textContent = patent.patentNumber +
      (patent.applicationNumber ? ` \u2022 App: ${patent.applicationNumber}` : '');
    this.statusEl.textContent = patent.status;
    this.statusEl.style.background = patent.statusColor + '22';
    this.statusEl.style.color = patent.statusColor;

    let html = '';

    // DKG Verification Badge
    html += `<div class="dkg-badge">
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="#22c55e" stroke-width="2">
        <path d="M2 8l4 4 8-8"/>
      </svg>
      Verified on OriginTrail DKG
    </div>`;

    // Identity
    html += this._section('Identity', [
      this._row('Type', patent.patentType),
      this._row('Jurisdiction', patent.jurisdiction),
      this._row('Inventor', patent.inventor),
      patent.assignee && patent.assignee !== patent.inventor ? this._row('Assignee', patent.assignee) : '',
      patent.continuityChain ? this._row('Continuity', patent.continuityChain) : '',
      this._row('Family Role', patent.familyRole)
    ]);

    // Dates
    if (patent.dates && Object.keys(patent.dates).length) {
      html += this._section('Key Dates', Object.entries(patent.dates).map(([k, v]) =>
        this._row(k.charAt(0).toUpperCase() + k.slice(1), v)
      ));
    }

    // Technology
    const tech = [];
    if (patent.technologyField) tech.push(`<div class="panel-text">${patent.technologyField}</div>`);
    if (patent.problemSolved) tech.push(`<div class="panel-text"><strong>Problem:</strong> ${patent.problemSolved}</div>`);
    if (patent.coreSolution) tech.push(`<div class="panel-text"><strong>Solution:</strong> ${patent.coreSolution}</div>`);
    if (patent.keyComponents) tech.push(`<div class="panel-text"><strong>Components:</strong> ${patent.keyComponents}</div>`);
    if (patent.advantages) tech.push(`<div class="panel-text"><strong>Advantages:</strong> ${patent.advantages}</div>`);
    if (patent.keyDifference) tech.push(`<div class="panel-text"><strong>Key Difference:</strong> ${patent.keyDifference}</div>`);
    if (tech.length) html += `<div class="panel-section"><div class="panel-section-title">Technical Summary</div>${tech.join('')}</div>`;

    // Claims
    if (patent.claims) {
      let ch = `<div class="panel-text" style="margin-bottom:8px">${patent.totalClaims}</div>`;
      patent.claims.forEach(c => {
        const isIndep = c.type.includes('Independent');
        ch += `<div class="claim-card" style="border-left-color:${isIndep ? patent.statusColor : '#334155'}">
          <div class="claim-header" style="color:${isIndep ? patent.statusColor : '#64748b'}">Claim ${c.num} \u2014 ${c.type}</div>
          <div class="claim-text">${c.text}</div></div>`;
      });
      if (patent.examinerReasons) ch += `<div class="panel-text" style="margin-top:8px"><strong>Examiner:</strong> ${patent.examinerReasons}</div>`;
      html += `<div class="panel-section"><div class="panel-section-title">Claims</div>${ch}</div>`;
    }

    // ISR
    if (patent.isrCitations?.length) {
      let ih = '';
      patent.isrCitations.forEach(c => {
        ih += `<div style="margin-bottom:6px"><span style="color:${c.cat === 'X' ? '#f59e0b' : '#64748b'};font-weight:700">[${c.cat}]</span> <span class="panel-text">${c.doc}</span>`;
        if (c.note) ih += `<div style="font-size:11px;color:#64748b;margin-left:24px">${c.note}</div>`;
        ih += '</div>';
      });
      html += `<div class="panel-section"><div class="panel-section-title">ISR Citations</div>${ih}</div>`;
    }

    // Classification
    if (patent.ipc || patent.cpc) {
      html += this._section('Classification', [
        patent.ipc ? this._row('IPC', patent.ipc) : '',
        patent.cpc ? this._row('CPC', patent.cpc) : ''
      ]);
    }

    // Prior Art
    if (patent.citedPriorArt) {
      html += `<div class="panel-section"><div class="panel-section-title">Cited Prior Art</div><div class="panel-text">${patent.citedPriorArt}</div></div>`;
    }

    // International
    if (patent.designatedStates || patent.nationalPhaseDeadline) {
      html += this._section('International Scope', [
        patent.designatedStates ? this._row('States', patent.designatedStates) : '',
        patent.nationalPhaseDeadline ? this._row('Deadline', patent.nationalPhaseDeadline) : ''
      ]);
    }

    // Family links
    if (patent.links?.length) {
      let lh = '';
      patent.links.forEach(link => {
        lh += `<div class="family-link" data-target="${link.target}">
          <div class="family-link-label">${link.label}</div>
          <div class="family-link-id">${link.target.split(':').pop()}</div>
        </div>`;
      });
      html += `<div class="panel-section"><div class="panel-section-title">Related Patents</div>${lh}</div>`;
    }

    // Patent Drawing (blueprint style)
    if (patent.drawing || patent.patentNumber) {
      const drawingSrc = patent.drawing ||
        `/explorer/data/drawings/${(patent.patentNumber || '').replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')}.png`;
      html += `<div class="panel-section patent-drawing-section">
        <div class="panel-section-title">Patent Drawing</div>
        <div class="patent-drawing-container" data-lightbox-src="${drawingSrc}">
          <img src="${drawingSrc}" alt="Patent Drawing" onerror="this.closest('.patent-drawing-section').style.display='none'">
        </div>
      </div>`;
    }

    // Espacenet
    if (patent.espacenet) {
      html += `<div class="panel-section"><a class="panel-link" href="${patent.espacenet}" target="_blank" rel="noopener">View on Espacenet \u2192</a></div>`;
    }

    this.bodyEl.innerHTML = html;
    this.el.classList.add('open');
    document.querySelector('.chat-panel')?.classList.add('detail-open');

    // Bind family link clicks
    this.bodyEl.querySelectorAll('.family-link').forEach(el => {
      el.addEventListener('click', () => {
        const target = el.dataset.target;
        if (this.onFamilyClick) this.onFamilyClick(target);
      });
    });

    // Bind patent drawing lightbox
    this.bodyEl.querySelectorAll('.patent-drawing-container').forEach(el => {
      el.addEventListener('click', () => {
        const lightbox = document.getElementById('lightbox');
        const img = document.getElementById('lightbox-img');
        if (lightbox && img) {
          img.src = el.dataset.lightboxSrc;
          lightbox.classList.add('open');
        }
      });
    });
  }

  close() {
    this.el.classList.remove('open');
    document.querySelector('.chat-panel')?.classList.remove('detail-open');
  }

  _section(title, rows) {
    return `<div class="panel-section"><div class="panel-section-title">${title}</div>${rows.filter(Boolean).join('')}</div>`;
  }

  _row(label, value) {
    if (!value) return '';
    return `<div class="panel-row"><div class="panel-label">${label}</div><div class="panel-value">${value}</div></div>`;
  }
}
