// ═══════════════════════════════════════════════════
// Patent Tree 3D — Scientific Multi-Lobed Dot-Matrix
// Three.js 0.170.0 via CDN importmap
// ═══════════════════════════════════════════════════

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ── Constants ──

const BG_COLOR = 0xf0f2f5;
const GRID_Y = -120;
const BASE_RADIUS = 22;

const STATUS_COLORS = {
  GrantedPatent:          new THREE.Color(0x1a9baa),
  PendingPatent:          new THREE.Color(0x3672b8),
  PCTApplication:         new THREE.Color(0x7b4fb0),
  UnpublishedApplication: new THREE.Color(0x6a7a8c),
  Unknown:                new THREE.Color(0x6a7a8c),
};

const STATUS_HEX = {
  GrantedPatent:          '#1a9baa',
  PendingPatent:          '#3672b8',
  PCTApplication:         '#7b4fb0',
  UnpublishedApplication: '#6a7a8c',
  Unknown:                '#6a7a8c',
};

const TYPE_ORDER = [
  'GrantedPatent', 'PendingPatent', 'PCTApplication',
  'UnpublishedApplication', 'Unknown',
];

// Fidget-spinner shape: very tall lobes + high power = fat tips + thin necks
const LOBE_PARAMS = {
  GrantedPatent:          { height: 5.0,  power: 4.5 },
  PendingPatent:          { height: 4.6,  power: 4.5 },
  PCTApplication:         { height: 4.2,  power: 4.0 },
  UnpublishedApplication: { height: 3.8,  power: 4.0 },
  Unknown:                { height: 3.5,  power: 4.0 },
};

const REL_LABELS = {
  CIP:                  'Continuation-in-Part',
  Parent:               'Parent',
  PCT:                  'International Expansion',
  Priority:             'Claims Priority',
  Original:             'Original Filing',
  continuationInPart:   'Continuation-in-Part',
  parentPatent:         'Parent',
  internationalFiling:  'International Expansion',
  priorityParent:       'Claims Priority',
  originalPatent:       'Original Filing',
  childCIP:             'Child CIP',
  childPCT:             'International Expansion',
};

const CONN_COLOR = 0x99aabb;
const CONN_ACTIVE_COLOR = 0xd4a840;      // warm light golden
const CONN_ACTIVE_HEX = '#d4a840';

const MIN_TEXT_PX = 75;                   // minimum screen-space SPRITE height
const CONN_LABEL_MIN_PX = 50;            // connection labels — subtle, smaller minimum
const WIRE_OPACITY = 0.55;               // wireframe default opacity
const CONN_TUBE_RADIUS = 0.8;            // connection tube radius (default)
const CONN_TUBE_ACTIVE_RADIUS = 1.2;     // connection tube radius (active)

// ── Dot texture ──

let _dotTex = null;
function getDotTexture() {
  if (_dotTex) return _dotTex;
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.55, 'rgba(255,255,255,1)');
  g.addColorStop(0.8, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  _dotTex = new THREE.CanvasTexture(c);
  return _dotTex;
}

function patentNumToFilename(pn) {
  return (pn || '').replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

// ═══════════════════════════════════════
// PatentTree3D
// ═══════════════════════════════════════

export class PatentTree3D {
  constructor(container) {
    this._container = container;
    this._scene = null;
    this._gridScene = null;
    this._camera = null;
    this._renderer = null;
    this._controls = null;
    this._composer = null;
    this._clock = null;

    this._patents = [];
    this._inventions = [];
    this._filters = { unpublished: true, pct: true, expired: true };

    this._inventionGroups = new Map();
    this._hitMeshes = [];
    this._connections = [];
    this._textSprites = [];           // tracked for min-size clamping

    this._raycaster = new THREE.Raycaster();
    this._pointer = new THREE.Vector2(-999, -999);
    this._hoveredPatent = null;
    this._hoveredInvention = null;
    this._hoveredLobeIdx = -1;
    this._selectedPatent = null;
    this._animFrameId = null;

    this._cameraTarget = null;
    this._cameraLookAt = null;
    this._cameraAnimating = false;
    this._flyingIn = false;

    this._bubbleMesh = null;

    // DOM overlays for hover popout
    this._popoutEl = null;
    this._popoutVisible = false;
    this._hiddenLobeSpriteInfo = null;

    this.onNodeClick = null;
    this.onNodeHover = null;
  }

  // ─── Public API ───

  render(patents) {
    this._patents = patents || [];
    if (!this._scene) this._initScene();
    this._clearScene();
    const filtered = this._filteredPatents();
    if (!filtered.length) return;
    this._inventions = this._groupIntoInventions(filtered);
    this._layout(this._inventions);
    for (const inv of this._inventions) {
      this._createInventionMesh(inv);
    }
    this._buildAllConnections();
    this._createPortfolioBubble();
    this._fitView();
  }

  setFilter(key, value) {
    this._filters[key] = value;
    this.render(this._patents);
  }

  highlightPatent(patentId) {
    for (const inv of this._inventions) {
      if (inv.patents.find(p => p.id === patentId)) {
        this._highlightInvention(inv);
        return;
      }
    }
  }

  dispose() {
    if (this._animFrameId) cancelAnimationFrame(this._animFrameId);
    this._renderer?.dispose();
    this._popoutEl?.remove();
  }

  // ─── Scene Setup ───

  _initScene() {
    const w = this._container.clientWidth;
    const h = this._container.clientHeight;

    this._renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.setSize(w, h);
    this._renderer.outputColorSpace = THREE.SRGBColorSpace;
    this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this._renderer.toneMappingExposure = 1.1;
    this._container.appendChild(this._renderer.domElement);

    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(BG_COLOR);

    this._camera = new THREE.PerspectiveCamera(55, w / h, 1, 8000);
    this._camera.position.set(0, 100, 350);

    this._controls = new OrbitControls(this._camera, this._renderer.domElement);
    this._controls.enableDamping = true;
    this._controls.dampingFactor = 0.06;
    this._controls.minDistance = 60;
    this._controls.maxDistance = 2500;
    this._controls.maxPolarAngle = Math.PI * 0.47;  // prevent camera below grid

    this._scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 0.7);
    key.position.set(80, 200, 120);
    this._scene.add(key);
    const fill = new THREE.DirectionalLight(0xddeeff, 0.3);
    fill.position.set(-60, 50, -80);
    this._scene.add(fill);

    this._composer = new EffectComposer(this._renderer);
    this._composer.addPass(new RenderPass(this._scene, this._camera));
    this._composer.addPass(new UnrealBloomPass(
      new THREE.Vector2(w, h), 0.12, 0.3, 0.92
    ));

    this._addGridPlane();
    this._createHoverOverlays();
    this._clock = new THREE.Clock();

    this._resizeObs = new ResizeObserver(() => {
      const rw = this._container.clientWidth;
      const rh = this._container.clientHeight;
      this._camera.aspect = rw / rh;
      this._camera.updateProjectionMatrix();
      this._renderer.setSize(rw, rh);
      this._composer.setSize(rw, rh);
    });
    this._resizeObs.observe(this._container);

    this._renderer.domElement.addEventListener('pointermove', e => this._onPointerMove(e));
    this._renderer.domElement.addEventListener('click', e => this._onClick(e));

    // Stop camera animation when user starts orbiting/zooming — prevents fight
    this._controls.addEventListener('start', () => {
      this._cameraAnimating = false;
      this._flyingIn = false;
    });

    this._animate();
  }

  // ─── Grid Floor — light blue, dense, low opacity ───

  _addGridPlane() {
    this._gridScene = new THREE.Scene();

    const gridMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uColor1: { value: new THREE.Color(0xb0ccdd) },
        uColor2: { value: new THREE.Color(0xc0d8e8) },
        uTime:   { value: 0 },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uTime;
        varying vec3 vWorldPos;
        void main() {
          vec2 coord = vWorldPos.xz;
          // Fine grid: denser (every 25 units)
          vec2 gf = abs(fract(coord / 25.0 - 0.5) - 0.5) / fwidth(coord / 25.0);
          float fine = 1.0 - min(min(gf.x, gf.y), 1.0);
          // Coarse grid: every 125 units
          vec2 gc = abs(fract(coord / 125.0 - 0.5) - 0.5) / fwidth(coord / 125.0);
          float coarse = 1.0 - min(min(gc.x, gc.y), 1.0);
          // Axes
          float axisX = 1.0 - min(abs(coord.x) / fwidth(coord.x), 1.0);
          float axisZ = 1.0 - min(abs(coord.y) / fwidth(coord.y), 1.0);
          float axes = max(axisX, axisZ) * 0.30;
          // Fade
          float dist = length(coord);
          float fade = exp(-dist * 0.0005);
          float intensity = (fine * 0.25 + coarse * 0.55 + axes) * fade;
          // Subtle wave
          float wave = sin(dist * 0.02 - uTime * 2.0) * 0.5 + 0.5;
          intensity += coarse * wave * 0.18 * fade;
          vec3 col = mix(uColor1, uColor2, smoothstep(0.0, 800.0, dist));
          gl_FragColor = vec4(col, intensity);
        }
      `,
    });

    const gridGeo = new THREE.PlaneGeometry(6000, 6000, 1, 1);
    gridGeo.rotateX(-Math.PI / 2);
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    gridMesh.position.y = GRID_Y;
    this._gridScene.add(gridMesh);
    this._gridPlane = gridMesh;
  }

  // ─── Hover Popout (expands from lobe label position) ───

  _createHoverOverlays() {
    this._popoutEl = document.createElement('div');
    Object.assign(this._popoutEl.style, {
      position: 'absolute', top: '0', left: '0',
      width: '320px', pointerEvents: 'none', zIndex: '50',
      opacity: '0', transition: 'opacity 0.12s ease, transform 0.15s ease',
      transform: 'scale(0.92)', transformOrigin: 'top center',
      fontFamily: '"Segoe UI", system-ui, sans-serif',
    });
    this._popoutEl.innerHTML = `
      <div style="background:rgba(255,255,255,0.97); border:1px solid #c0c8d4;
        border-radius:10px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.10);">
        <div style="height:4px; width:100%;" class="popout-accent"></div>
        <div style="padding:12px 16px 8px;">
          <div class="popout-number" style="font-size:15px; font-weight:700; color:#1a2a3a; font-family:Consolas,monospace;"></div>
          <div class="popout-title" style="font-size:13px; color:#3a4a5a; margin-top:4px; line-height:1.3;"></div>
          <div class="popout-status" style="font-size:11px; font-weight:600; margin-top:4px;"></div>
        </div>
        <div class="popout-drawing" style="padding:0 12px 12px; display:none;">
          <img style="width:100%; border-radius:6px; border:1px solid #e0e4ea;" />
        </div>
        <div class="popout-hint" style="padding:0 16px 8px; font-size:10px; color:#8899aa;">Click for details</div>
      </div>
    `;
    this._container.appendChild(this._popoutEl);
    this._popoutEl.style.display = 'none';
  }

  _showHoverPopout(patent, invention, lobeIdx) {
    if (!this._popoutEl || !patent) return;

    // Populate content
    const accent = this._popoutEl.querySelector('.popout-accent');
    accent.style.background = STATUS_HEX[patent.type] || '#6a7a8c';
    this._popoutEl.querySelector('.popout-number').textContent = patent.patentNumber || patent.shortLabel;
    this._popoutEl.querySelector('.popout-title').textContent = patent.title || 'Untitled';
    const statusEl = this._popoutEl.querySelector('.popout-status');
    statusEl.textContent = (patent.status || patent.type || '').split(' — ')[0];
    statusEl.style.color = STATUS_HEX[patent.type] || '#6a7a8c';

    // Drawing thumbnail
    const drawingDiv = this._popoutEl.querySelector('.popout-drawing');
    const drawingImg = drawingDiv.querySelector('img');
    const filename = patentNumToFilename(patent.patentNumber || patent.shortLabel);
    drawingImg.onload = () => { drawingDiv.style.display = 'block'; };
    drawingImg.onerror = () => { drawingDiv.style.display = 'none'; };
    drawingImg.src = `/explorer/data/drawings/${filename}.png`;

    // Position at lobe tip screen coords
    this._positionPopoutAtLobe(invention, lobeIdx);
    this._popoutEl.style.display = 'block';
    requestAnimationFrame(() => {
      this._popoutEl.style.opacity = '1';
      this._popoutEl.style.transform = 'scale(1)';
    });

    // Hide the 3D sprite label so the popout replaces it
    this._hideLobeSprite(invention, lobeIdx, true);
    this._popoutVisible = true;
  }

  _hideHoverPopout() {
    if (!this._popoutEl) return;
    this._popoutEl.style.opacity = '0';
    this._popoutEl.style.transform = 'scale(0.92)';
    setTimeout(() => {
      if (!this._popoutVisible) this._popoutEl.style.display = 'none';
    }, 150);
    // Restore any hidden lobe sprite
    if (this._hiddenLobeSpriteInfo) {
      this._hideLobeSprite(
        this._hiddenLobeSpriteInfo.inv,
        this._hiddenLobeSpriteInfo.idx, false);
      this._hiddenLobeSpriteInfo = null;
    }
    this._popoutVisible = false;
  }

  _positionPopoutAtLobe(invention, lobeIdx) {
    const tipWorld = invention.lobeTips[lobeIdx].clone();
    tipWorld.applyMatrix4(invention.group.matrixWorld);
    const tipScreen = tipWorld.clone().project(this._camera);
    const rect = this._renderer.domElement.getBoundingClientRect();
    const tipX = (tipScreen.x * 0.5 + 0.5) * rect.width;
    const tipY = (-tipScreen.y * 0.5 + 0.5) * rect.height;

    // Project shape center to screen to determine lobe direction from center
    const centerWorld = invention.group.position.clone();
    const centerScreen = centerWorld.clone().project(this._camera);
    const cx = (centerScreen.x * 0.5 + 0.5) * rect.width;
    const cy = (-centerScreen.y * 0.5 + 0.5) * rect.height;

    const popoutW = 320;
    const popoutH = this._popoutEl.offsetHeight || 180;
    const margin = 16;   // gap between tip and popout edge

    // Direction from shape center → lobe tip in screen space
    const dx = tipX - cx;
    const dy = tipY - cy;

    let left, top;
    if (Math.abs(dx) > Math.abs(dy)) {
      // Lobe extends more horizontally — place popout to the side
      if (dx > 0) {
        // Lobe points right → place popout to the right of the tip
        left = tipX + margin;
      } else {
        // Lobe points left → place popout to the left of the tip
        left = tipX - popoutW - margin;
      }
      top = tipY - popoutH / 2;
    } else {
      // Lobe extends more vertically — place popout above or below
      left = tipX - popoutW / 2;
      if (dy < 0) {
        // Lobe points up → place popout above
        top = tipY - popoutH - margin;
      } else {
        // Lobe points down → place popout below
        top = tipY + margin;
      }
    }

    // Clamp to viewport bounds
    left = Math.max(8, Math.min(left, rect.width - popoutW - 8));
    top = Math.max(8, Math.min(top, rect.height - popoutH - 8));

    this._popoutEl.style.left = left + 'px';
    this._popoutEl.style.top = top + 'px';
  }

  _hideLobeSprite(invention, lobeIdx, hide) {
    const group = this._inventionGroups.get(invention.id);
    if (!group) return;
    group.traverse(child => {
      if (child.isSprite && child.userData.isLobeLabel && child.userData.lobeIdx === lobeIdx) {
        child.visible = !hide;
      }
    });
    if (hide) this._hiddenLobeSpriteInfo = { inv: invention, idx: lobeIdx };
  }

  // ─── Data Grouping ───

  _groupIntoInventions(patents) {
    const families = new Map();
    for (const p of patents) {
      const fam = p.family || 'solo_' + p.id;
      if (!families.has(fam)) families.set(fam, []);
      families.get(fam).push(p);
    }

    const inventions = [];
    for (const [famId, pats] of families) {
      pats.sort((a, b) =>
        TYPE_ORDER.indexOf(a.type || 'Unknown') - TYPE_ORDER.indexOf(b.type || 'Unknown')
      );
      inventions.push({
        id: famId,
        patents: pats,
        title: pats[0].title || 'Untitled',
        group: null,
        lobeDirections: null,
        lobeTips: null,
        originalPositions: null,
        baseY: 0,
        _x: 0, _y: 0, _z: 0,
      });
    }
    return inventions;
  }

  // ─── Layout ───

  _layout(inventions) {
    const spacing = 280;
    const totalWidth = (inventions.length - 1) * spacing;
    const startX = -totalWidth / 2;

    for (let i = 0; i < inventions.length; i++) {
      const inv = inventions[i];
      inv._x = startX + i * spacing;
      inv._y = GRID_Y + 65 + BASE_RADIUS + Math.sin(i * 1.5) * 8;
      inv._z = Math.cos(i * 2.1) * 15;
      inv.baseY = inv._y;
    }
  }

  // ─── Lobe Direction Computation ───

  _computeLobeDirections(N) {
    if (N === 1) return [new THREE.Vector3(0, 1, 0)];
    if (N === 2) return [
      new THREE.Vector3(0.12, 1, 0).normalize(),
      new THREE.Vector3(-0.12, -1, 0).normalize(),
    ];
    const dirs = [];
    const golden = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < N; i++) {
      const theta = Math.acos(1 - 2 * (i + 0.5) / N);
      const phi = 2 * Math.PI * i / golden;
      dirs.push(new THREE.Vector3(
        Math.sin(theta) * Math.cos(phi),
        Math.cos(theta),
        Math.sin(theta) * Math.sin(phi),
      ));
    }
    return dirs;
  }

  // ─── Dot-Matrix Parametric Surface ───

  _generateDotMatrix(invention) {
    const N = invention.patents.length;
    const dirs = this._computeLobeDirections(N);
    invention.lobeDirections = dirs;

    const positions = [];
    const colors = [];
    const numLat = 60;
    const maxLon = 90;

    const lobeTips = dirs.map(() => ({ maxR: 0, pos: new THREE.Vector3() }));

    // Track grid structure for wireframe connectivity
    const rings = [];    // rings[i] = { start, count }
    let totalPoints = 0;

    for (let i = 0; i <= numLat; i++) {
      const theta = Math.PI * i / numLat;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      const numLon = Math.max(6, Math.round(maxLon * sinTheta));

      rings.push({ start: totalPoints, count: numLon });

      for (let j = 0; j < numLon; j++) {
        const phi = 2 * Math.PI * j / numLon;
        const nx = sinTheta * Math.cos(phi);
        const ny = cosTheta;
        const nz = sinTheta * Math.sin(phi);
        const surfN = new THREE.Vector3(nx, ny, nz);

        let r = BASE_RADIUS;
        let maxDot = -Infinity;
        let closestLobe = 0;

        for (let k = 0; k < N; k++) {
          const d = surfN.dot(dirs[k]);
          const lp = LOBE_PARAMS[invention.patents[k].type] || LOBE_PARAMS.Unknown;
          if (d > 0) r += lp.height * BASE_RADIUS * Math.pow(d, lp.power);
          if (d > maxDot) { maxDot = d; closestLobe = k; }
        }

        if (r > lobeTips[closestLobe].maxR) {
          lobeTips[closestLobe].maxR = r;
          lobeTips[closestLobe].pos.set(nx * r, ny * r, nz * r);
        }

        positions.push(nx * r, ny * r, nz * r);
        const col = STATUS_COLORS[invention.patents[closestLobe].type] || STATUS_COLORS.Unknown;
        colors.push(col.r, col.g, col.b);
        totalPoints++;
      }
    }

    invention.lobeTips = lobeTips.map(lt => lt.pos.clone());

    // ── Build wireframe edges: ~3 connections per dot (molecule lattice) ──
    const edgeIndices = [];
    for (let i = 0; i < rings.length; i++) {
      const { start, count } = rings[i];
      // 1. Connect within ring (longitude neighbours)
      for (let j = 0; j < count; j++) {
        edgeIndices.push(start + j, start + (j + 1) % count);
      }
      // 2. Connect to next ring (latitude neighbour)
      if (i < rings.length - 1) {
        const next = rings[i + 1];
        for (let j = 0; j < count; j++) {
          const tgtJ = Math.round(j / count * next.count) % next.count;
          edgeIndices.push(start + j, next.start + tgtJ);
        }
      }
      // 3. Diagonal to next ring (+1 offset) — triangulates the mesh
      if (i < rings.length - 1) {
        const next = rings[i + 1];
        for (let j = 0; j < count; j++) {
          const tgtJ = (Math.round(j / count * next.count) + 1) % next.count;
          edgeIndices.push(start + j, next.start + tgtJ);
        }
      }
    }

    return {
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
      edges: new Uint32Array(edgeIndices),
    };
  }

  // ─── Invention Mesh Creation ───

  _createInventionMesh(invention) {
    const group = new THREE.Group();
    group.position.set(invention._x, invention._y, invention._z);
    group.userData.invention = invention;
    invention.group = group;

    const { positions, colors, edges } = this._generateDotMatrix(invention);
    invention.originalPositions = new Float32Array(positions);

    // Shared position + color attributes (wireframe and points share same buffer)
    const posAttr = new THREE.BufferAttribute(positions, 3);
    const colAttr = new THREE.BufferAttribute(colors, 3);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', posAttr);
    geo.setAttribute('color', colAttr);

    const mat = new THREE.PointsMaterial({
      size: 5.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      map: getDotTexture(),
    });
    const points = new THREE.Points(geo, mat);
    points.userData.isDotMatrix = true;
    group.add(points);

    // ── Molecule wireframe: shared position buffer so animation applies to both ──
    const wireGeo = new THREE.BufferGeometry();
    wireGeo.setAttribute('position', posAttr);          // shared!
    wireGeo.setAttribute('color', colAttr);              // shared!
    wireGeo.setIndex(new THREE.BufferAttribute(edges, 1));
    const wireMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: WIRE_OPACITY,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    wireframe.userData.isWireframe = true;
    group.add(wireframe);

    // Invisible hitbox
    const maxR = Math.max(...invention.lobeTips.map(t => t.length()), BASE_RADIUS);
    const hitGeo = new THREE.SphereGeometry(maxR * 1.25, 16, 16);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    hitMesh.userData.invention = invention;
    group.add(hitMesh);
    this._hitMeshes.push(hitMesh);

    // Lobe tip labels
    for (let i = 0; i < invention.patents.length; i++) {
      const pat = invention.patents[i];
      const tipPos = invention.lobeTips[i];
      const label = this._createTextSprite(pat.patentNumber || pat.shortLabel, {
        fontSize: 48, color: '#1a2a3a',
        bgColor: 'rgba(255,255,255,0.88)', padding: 14,
        borderColor: STATUS_HEX[pat.type] || '#888',
      });
      const dir = tipPos.clone().normalize();
      label.position.copy(tipPos).addScaledVector(dir, 20);
      const baseW = 72, baseH = 15;
      label.scale.set(baseW, baseH, 1);
      label.userData.isLobeLabel = true;
      label.userData.lobeIdx = i;
      label.userData.baseScale = { x: baseW, y: baseH };
      group.add(label);
      this._textSprites.push(label);
    }

    // Entry animation
    group.scale.setScalar(0.001);
    group.userData._entryStart = performance.now();
    group.userData._entryDelay = this._inventionGroups.size * 250;
    group.userData._entering = true;

    this._scene.add(group);
    this._inventionGroups.set(invention.id, group);
  }

  // ─── Text Sprite ───

  _createTextSprite(text, opts = {}) {
    const fontSize = opts.fontSize || 24;
    const fontColor = opts.color || '#1a2a3a';
    const bgColor = opts.bgColor || 'transparent';
    const padding = opts.padding || 0;
    const borderColor = opts.borderColor || null;
    const italic = opts.italic || false;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 768;
    canvas.height = 128;

    const fontStyle = italic ? 'italic' : 'normal';
    const fontWeight = italic ? '500' : '600';
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (bgColor !== 'transparent') {
      const tw = ctx.measureText(text).width;
      const bw = Math.min(tw + padding * 2, 760);
      const bh = fontSize + padding * 2;
      const bx = (768 - bw) / 2;
      const by = (128 - bh) / 2;
      ctx.fillStyle = bgColor;
      ctx.fillRect(bx, by, bw, bh);
      if (borderColor) {
        ctx.fillStyle = borderColor;
        ctx.fillRect(bx, by, 4, bh);
      }
    } else if (italic) {
      // No background box — add subtle text halo for legibility
      ctx.strokeStyle = 'rgba(240,242,245,0.85)';
      ctx.lineWidth = 5;
      ctx.lineJoin = 'round';
      ctx.strokeText(text, 384, 64);
    }

    ctx.fillStyle = fontColor;
    ctx.fillText(text, 384, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({
      map: texture, transparent: true, depthWrite: false,
    });
    return new THREE.Sprite(mat);
  }

  // ─── Connections ───

  _buildAllConnections() {
    for (const inv of this._inventions) this._buildConnections(inv);
  }

  _buildConnections(invention) {
    const idToIdx = new Map();
    invention.patents.forEach((p, i) => idToIdx.set(p.id, i));
    const seen = new Set();

    for (const patent of invention.patents) {
      for (const link of (patent.links || [])) {
        const tgtIdx = idToIdx.get(link.target);
        if (tgtIdx === undefined) continue;
        const srcIdx = idToIdx.get(patent.id);
        if (srcIdx === undefined) continue;

        const pairKey = [srcIdx, tgtIdx].sort().join('-');
        if (seen.has(pairKey)) continue;
        seen.add(pairKey);

        const tipA = invention.lobeTips[srcIdx];
        const tipB = invention.lobeTips[tgtIdx];
        if (!tipA || !tipB) continue;

        const mid = tipA.clone().add(tipB).multiplyScalar(0.5);
        let outward;
        if (mid.length() < 2) {
          const arb = Math.abs(tipA.y) < 0.9
            ? new THREE.Vector3(0, 1, 0)
            : new THREE.Vector3(1, 0, 0);
          outward = tipA.clone().cross(arb).normalize().multiplyScalar(BASE_RADIUS * 1.0);
        } else {
          outward = mid.clone().normalize().multiplyScalar(BASE_RADIUS * 0.6);
        }
        const control = mid.clone().add(outward);

        // Connection curve
        const curve = new THREE.QuadraticBezierCurve3(tipA, control, tipB);

        // Default tube — glossy Phong material for nice specular highlights
        const tubeGeo = new THREE.TubeGeometry(curve, 48, CONN_TUBE_RADIUS, 8, false);
        // Vertex-color gradient: blend source patent color → target patent color
        const srcColor = STATUS_COLORS[invention.patents[srcIdx]?.type] || new THREE.Color(CONN_COLOR);
        const tgtColor = STATUS_COLORS[invention.patents[tgtIdx]?.type] || new THREE.Color(CONN_COLOR);
        const tubeVerts = tubeGeo.attributes.position.count;
        const tubeColors = new Float32Array(tubeVerts * 3);
        const tmpC = new THREE.Color();
        for (let vi = 0; vi < tubeVerts; vi++) {
          // Estimate t along tube from vertex position
          const vPos = new THREE.Vector3().fromBufferAttribute(tubeGeo.attributes.position, vi);
          const distA = vPos.distanceTo(tipA);
          const distB = vPos.distanceTo(tipB);
          const t = distA / (distA + distB + 0.001);
          tmpC.copy(srcColor).lerp(tgtColor, t);
          tubeColors[vi * 3] = tmpC.r;
          tubeColors[vi * 3 + 1] = tmpC.g;
          tubeColors[vi * 3 + 2] = tmpC.b;
        }
        tubeGeo.setAttribute('color', new THREE.BufferAttribute(tubeColors, 3));
        const tubeMat = new THREE.MeshPhongMaterial({
          vertexColors: true, transparent: true, opacity: 0.72,
          shininess: 80, specular: new THREE.Color(0x555555),
        });
        const tube = new THREE.Mesh(tubeGeo, tubeMat);
        tube.userData.isConnTube = true;
        invention.group.add(tube);

        // Active tube (golden, thicker, shinier)
        const activeGeo = new THREE.TubeGeometry(curve, 48, CONN_TUBE_ACTIVE_RADIUS, 8, false);
        const activeMat = new THREE.MeshPhongMaterial({
          color: CONN_ACTIVE_COLOR, transparent: true, opacity: 0.95,
          shininess: 100, specular: new THREE.Color(0x666655),
          emissive: new THREE.Color(0x3a2800), emissiveIntensity: 0.3,
        });
        const activeTube = new THREE.Mesh(activeGeo, activeMat);
        activeTube.userData.isConnTube = true;
        activeTube.visible = false;
        invention.group.add(activeTube);

        // Endpoint dots — glossy spheres
        const dotGeo = new THREE.SphereGeometry(3.5, 16, 16);
        const dotMatA = new THREE.MeshPhongMaterial({
          color: srcColor, transparent: true, opacity: 0.85,
          shininess: 100, specular: new THREE.Color(0x555555),
        });
        const dotA = new THREE.Mesh(dotGeo, dotMatA);
        dotA.userData.isConnTube = true;
        dotA.position.copy(tipA);
        invention.group.add(dotA);
        const dotMatB = new THREE.MeshPhongMaterial({
          color: tgtColor, transparent: true, opacity: 0.85,
          shininess: 100, specular: new THREE.Color(0x555555),
        });
        const dotB = new THREE.Mesh(dotGeo.clone(), dotMatB);
        dotB.userData.isConnTube = true;
        dotB.position.copy(tipB);
        invention.group.add(dotB);

        // Relationship label — subtle annotation, no white box
        const relText = REL_LABELS[link.rel] || REL_LABELS[link.label] || link.label || link.rel;
        const labelPos = curve.getPoint(0.5);
        labelPos.add(outward.clone().normalize().multiplyScalar(14));

        const label = this._createTextSprite(relText, {
          fontSize: 36, color: '#556677', italic: true,
          bgColor: 'transparent', padding: 0,
        });
        const lBW = 60, lBH = 10;
        label.position.copy(labelPos);
        label.scale.set(lBW, lBH, 1);
        label.userData.baseScale = { x: lBW, y: lBH };
        label.userData.minTextPx = CONN_LABEL_MIN_PX;
        label.userData.isConnLabel = true;
        invention.group.add(label);
        this._textSprites.push(label);

        this._connections.push({
          dashedLine: tube, solidLine: activeTube, labelSprite: label,
          dotA, dotB, srcIdx, tgtIdx,
          inventionId: invention.id, relText,
        });
      }
    }
  }

  // --- Portfolio Bubble (convex envelope via support function) ---

  _createPortfolioBubble() {
    if (this._inventions.length < 1) return;
    // Dispose previous
    if (this._bubbleMeshes) {
      for (const m of this._bubbleMeshes) {
        this._scene.remove(m);
        m.geometry.dispose();
        m.material.dispose();
      }
      this._bubbleMeshes = null;
    }
    if (this._bubbleMesh) {
      this._scene.remove(this._bubbleMesh);
      this._bubbleMesh.geometry.dispose();
      this._bubbleMesh.material.dispose();
      this._bubbleMesh = null;
    }

    // 1. Collect all dot-matrix surface points in world space
    const pts = [];
    for (const inv of this._inventions) {
      if (!inv.originalPositions) continue;
      const p = inv.originalPositions;
      for (let i = 0; i < p.length; i += 3) {
        pts.push(inv._x + p[i], inv._y + p[i + 1], inv._z + p[i + 2]);
      }
    }
    if (pts.length < 9) return;

    // 2. Centroid
    const nPts = pts.length / 3;
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < pts.length; i += 3) { cx += pts[i]; cy += pts[i+1]; cz += pts[i+2]; }
    cx /= nPts; cy /= nPts; cz /= nPts;

    // 3. Precompute centred points for speed
    const cp = new Float32Array(pts.length);
    for (let i = 0; i < pts.length; i += 3) {
      cp[i] = pts[i] - cx;
      cp[i + 1] = pts[i + 1] - cy;
      cp[i + 2] = pts[i + 2] - cz;
    }

    // 4. Compute support function: for each direction on a lat/lon grid,
    //    find the maximum projection of any point onto that direction.
    //    This yields a smooth convex envelope — no gap-filling needed.
    const padding = 15;
    const nLat = 48, nLon = 64;
    const stride = nLon + 1;
    const total = (nLat + 1) * stride;
    const radii = new Float32Array(total);

    for (let i = 0; i <= nLat; i++) {
      const theta = Math.PI * i / nLat;
      const st = Math.sin(theta), ct = Math.cos(theta);
      for (let j = 0; j <= nLon; j++) {
        const phi = 2 * Math.PI * j / nLon;
        const dx = st * Math.cos(phi), dy = ct, dz = st * Math.sin(phi);

        let maxProj = 0;
        for (let k = 0; k < cp.length; k += 3) {
          const proj = cp[k] * dx + cp[k + 1] * dy + cp[k + 2] * dz;
          if (proj > maxProj) maxProj = proj;
        }
        radii[i * stride + j] = maxProj + padding;
      }
    }

    // 5. Smooth gently for organic feel (just 3 passes)
    for (let pass = 0; pass < 3; pass++) {
      const sm = new Float32Array(total);
      for (let i = 0; i <= nLat; i++) {
        for (let j = 0; j <= nLon; j++) {
          const idx = i * stride + j;
          let s = radii[idx] * 4, w = 4;
          if (i > 0) { s += radii[(i - 1) * stride + j]; w++; }
          if (i < nLat) { s += radii[(i + 1) * stride + j]; w++; }
          const jl = j > 0 ? j - 1 : nLon;
          const jr = j < nLon ? j + 1 : 0;
          s += radii[i * stride + jl]; w++;
          s += radii[i * stride + jr]; w++;
          sm[idx] = s / w;
        }
      }
      for (let k = 0; k < total; k++) radii[k] = sm[k];
    }

    // Ensure seam
    for (let i = 0; i <= nLat; i++) {
      const v = (radii[i * stride] + radii[i * stride + nLon]) * 0.5;
      radii[i * stride] = v;
      radii[i * stride + nLon] = v;
    }

    // 6. Generate mesh positions
    const positions = [];
    for (let i = 0; i <= nLat; i++) {
      const theta = Math.PI * i / nLat;
      const st = Math.sin(theta), ct = Math.cos(theta);
      for (let j = 0; j <= nLon; j++) {
        const phi = 2 * Math.PI * j / nLon;
        const r = radii[i * stride + j];
        positions.push(cx + st * Math.cos(phi) * r, cy + ct * r, cz + st * Math.sin(phi) * r);
      }
    }

    const indices = [];
    for (let i = 0; i < nLat; i++) {
      for (let j = 0; j < nLon; j++) {
        const a = i * stride + j, b = a + stride;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: {
        uColor: { value: new THREE.Color(0x4488cc) },
        uOpacity: { value: 0.0 },
        uTime: { value: 0 },
      },
      vertexShader: `uniform float uTime;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;
void main(){
  vNormal=normalize(normalMatrix*normal);
  vec3 wp=(modelMatrix*vec4(position,1.0)).xyz;
  float disp=sin(wp.x*0.04+uTime*0.7)*2.5
            +sin(wp.y*0.05+uTime*0.5)*2.0
            +sin(wp.z*0.03+uTime*0.6)*2.0
            +sin(wp.x*0.08+wp.z*0.06+uTime*0.9)*1.5;
  vec3 displaced=position+normal*disp;
  vec4 mvPos=modelViewMatrix*vec4(displaced,1.0);
  vViewDir=normalize(-mvPos.xyz);
  vWorldPos=wp;
  gl_Position=projectionMatrix*mvPos;
}`,
      fragmentShader: `uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;
void main(){
  float fresnel=1.0-abs(dot(vNormal,vViewDir));
  fresnel=pow(fresnel,2.0);
  float shimmer=sin(vWorldPos.x*0.04+vWorldPos.y*0.03+uTime*0.6)*0.5+0.5;
  float alpha=mix(0.05,uOpacity,fresnel)+shimmer*0.015;
  gl_FragColor=vec4(uColor,alpha);
}`,
    });

    this._bubbleMesh = new THREE.Mesh(geo, mat);
    this._bubbleMesh.renderOrder = -1;
    this._bubbleMesh.userData._entryStart = performance.now();
    this._scene.add(this._bubbleMesh);
  }

    // ─── Animation Loop ───

  _animate() {
    this._animFrameId = requestAnimationFrame(() => this._animate());
    const delta = this._clock.getDelta();
    const elapsed = this._clock.getElapsedTime();
    const now = performance.now();

    if (this._flyingIn) {
      const t = Math.min((now - this._flyInStart) / this._flyInDuration, 1);
      const e = 1 - Math.pow(1 - t, 3);
      this._camera.position.lerpVectors(this._flyInFrom, this._flyInTo, e);
      this._controls.target.lerpVectors(this._flyInLookFrom, this._flyInLookTo, e);
      if (t >= 1) this._flyingIn = false;
    }

    for (const inv of this._inventions) {
      const group = inv.group;
      if (!group) continue;

      if (group.userData._entering) {
        const age = now - group.userData._entryStart - group.userData._entryDelay;
        if (age < 0) continue;
        const t = Math.min(age / 900, 1);
        const e = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        group.scale.setScalar(Math.max(e, 0.001));
        if (t >= 1) group.userData._entering = false;
        continue;
      }

      // No rotation — keep shapes stationary for readability

      const wave = Math.sin(elapsed * 0.25 + inv._x * 0.008) * 4
                 + Math.cos(elapsed * 0.18 + inv._z * 0.012) * 3;
      group.position.y = inv.baseY + wave;

      group.traverse(child => {
        if (!child.userData.isDotMatrix || !inv.originalPositions) return;
        const pos = child.geometry.attributes.position;
        const arr = pos.array;
        const orig = inv.originalPositions;
        for (let i = 0; i < pos.count; i++) {
          const ox = orig[i * 3], oy = orig[i * 3 + 1], oz = orig[i * 3 + 2];
          const noise = Math.sin(ox * 0.12 + elapsed * 0.7)
                      * Math.sin(oy * 0.18 + elapsed * 0.5)
                      * Math.cos(oz * 0.14 + elapsed * 0.35);
          const scale = 1 + noise * 0.025;
          arr[i * 3] = ox * scale;
          arr[i * 3 + 1] = oy * scale;
          arr[i * 3 + 2] = oz * scale;
        }
        pos.needsUpdate = true;
      });
    }

    if (this._gridPlane) {
      this._gridPlane.material.uniforms.uTime.value = elapsed;
    }

    if (this._bubbleMesh) {
      const bubbleAge = now - this._bubbleMesh.userData._entryStart;
      const fadeT = Math.max(0, Math.min((bubbleAge - 1200) / 1500, 1));
      this._bubbleMesh.material.uniforms.uOpacity.value = 0.45 * fadeT * fadeT * (3 - 2 * fadeT);
      this._bubbleMesh.material.uniforms.uTime.value = elapsed;
    }

    if (this._cameraAnimating && this._cameraLookAt) {
      // Smoothly pan orbit target; optionally also move camera position
      if (this._cameraTarget) {
        this._camera.position.lerp(this._cameraTarget, 0.06);
      }
      this._controls.target.lerp(this._cameraLookAt, 0.06);
      const targetDist = this._cameraTarget
        ? this._camera.position.distanceTo(this._cameraTarget)
        : 0;
      const lookDist = this._controls.target.distanceTo(this._cameraLookAt);
      if (targetDist < 1 && lookDist < 1) {
        this._cameraAnimating = false;
      }
    }

    // ── Minimum text size: clamp sprite scale so text stays legible ──
    this._clampTextSizes();

    // ── Update hover popout position (tracks moving shapes) ──
    if (this._popoutVisible && this._hoveredInvention && this._hoveredLobeIdx >= 0) {
      this._positionPopoutAtLobe(this._hoveredInvention, this._hoveredLobeIdx);
    }

    this._controls.update();
    this._composer.render();

    if (this._gridScene) {
      this._renderer.autoClear = false;
      this._renderer.clearDepth();
      this._renderer.render(this._gridScene, this._camera);
      this._renderer.autoClear = true;
    }
  }

  _clampTextSizes() {
    const halfFov = THREE.MathUtils.degToRad(this._camera.fov * 0.5);
    const vH = this._renderer.domElement.clientHeight;
    const camPos = this._camera.position;

    const _worldPos = new THREE.Vector3();

    for (const sprite of this._textSprites) {
      if (!sprite.parent || !sprite.visible) continue;
      const base = sprite.userData.baseScale;
      if (!base) continue;

      sprite.getWorldPosition(_worldPos);
      const dist = camPos.distanceTo(_worldPos);
      if (dist < 1) continue;

      // Apparent pixel height = (worldScaleY / dist) * (vH / (2 * tan(fov/2)))
      const pixelsPerUnit = vH / (2 * dist * Math.tan(halfFov));
      const apparentPx = base.y * pixelsPerUnit;
      const minPx = sprite.userData.minTextPx || MIN_TEXT_PX;

      if (apparentPx < minPx && apparentPx > 0) {
        const factor = minPx / apparentPx;
        sprite.scale.set(base.x * factor, base.y * factor, 1);
      } else {
        sprite.scale.set(base.x, base.y, 1);
      }
    }
  }

  // ─── Interaction ───

  _onPointerMove(e) {
    const rect = this._renderer.domElement.getBoundingClientRect();
    this._pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this._pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this._raycaster.setFromCamera(this._pointer, this._camera);
    const hits = this._raycaster.intersectObjects(this._hitMeshes, false);

    if (hits.length) {
      const invention = hits[0].object.userData.invention;
      if (invention) {
        const localPt = invention.group.worldToLocal(hits[0].point.clone());
        const patent = this._findClosestLobe(invention, localPt);
        if (patent) {
          const lobeIdx = invention.patents.indexOf(patent);
          // Always update — even if same patent, ensures popout is shown
          const changed = !this._hoveredPatent || patent.id !== this._hoveredPatent.id;
          this._hoveredPatent = patent;
          this._hoveredInvention = invention;
          this._hoveredLobeIdx = lobeIdx;
          this._renderer.domElement.style.cursor = 'pointer';
          if (changed || !this._popoutVisible) {
            this._showHoverPopout(patent, invention, lobeIdx);
          }
          if (changed && this.onNodeHover) this.onNodeHover(patent, e);
        }
      }
    } else if (this._hoveredPatent) {
      this._hoveredPatent = null;
      this._hoveredInvention = null;
      this._hoveredLobeIdx = -1;
      this._renderer.domElement.style.cursor = 'default';
      if (this.onNodeHover) this.onNodeHover(null, e);
    }
  }

  _onClick(e) {
    this._raycaster.setFromCamera(this._pointer, this._camera);
    const hits = this._raycaster.intersectObjects(this._hitMeshes, false);

    if (hits.length) {
      const invention = hits[0].object.userData.invention;
      if (invention) {
        const localPt = invention.group.worldToLocal(hits[0].point.clone());
        const patent = this._findClosestLobe(invention, localPt);
        if (patent) {
          const lobeIdx = invention.patents.indexOf(patent);

          if (this._selectedPatent && this._selectedPatent.id === patent.id) {
            this._selectedPatent = null;
            this._resetHighlight();
          } else {
            this._selectedPatent = patent;
            this._highlightConnections(invention, lobeIdx);
            // Center on clicked lobe — keep current viewing angle
            this._centerOnLobe(invention, lobeIdx);
          }

          // Show popout for clicked lobe (stays alongside detail panel)
          this._showHoverPopout(patent, invention, lobeIdx);
          this._hoveredPatent = patent;
          this._hoveredInvention = invention;
          this._hoveredLobeIdx = lobeIdx;
          if (this.onNodeClick) this.onNodeClick(patent);
        }
      }
    } else {
      if (this._selectedPatent) {
        this._selectedPatent = null;
        this._resetHighlight();
      }
      this._hideHoverPopout();
    }
  }

  _findClosestLobe(invention, localPoint) {
    if (!invention.lobeTips || !invention.patents.length) return null;

    // Use screen-space proximity: project all lobe tips to screen coords
    // and find which is closest to the current pointer position.
    const rect = this._renderer.domElement.getBoundingClientRect();
    const ptrX = (this._pointer.x * 0.5 + 0.5) * rect.width;
    const ptrY = (-this._pointer.y * 0.5 + 0.5) * rect.height;

    let bestDist = Infinity;
    let bestIdx = 0;
    for (let i = 0; i < invention.lobeTips.length; i++) {
      const tipWorld = invention.lobeTips[i].clone()
        .applyMatrix4(invention.group.matrixWorld);
      const tipScreen = tipWorld.project(this._camera);
      const sx = (tipScreen.x * 0.5 + 0.5) * rect.width;
      const sy = (-tipScreen.y * 0.5 + 0.5) * rect.height;
      const dist = (sx - ptrX) ** 2 + (sy - ptrY) ** 2;
      if (dist < bestDist) { bestDist = dist; bestIdx = i; }
    }
    return invention.patents[bestIdx];
  }

  _centerOnLobe(invention, lobeIdx) {
    // Smoothly pan the orbit target to center on the clicked lobe's world position.
    // Camera position stays put — preserves the user's current viewing angle.
    const tipLocal = invention.lobeTips[lobeIdx];
    if (!tipLocal) return;
    const tipWorld = tipLocal.clone().applyMatrix4(invention.group.matrixWorld);
    this._cameraLookAt = tipWorld;
    // Keep camera where it is — just re-target the orbit center
    this._cameraTarget = null;
    this._cameraAnimating = true;
  }

  // ─── Connection Highlighting — solid golden ───

  _highlightConnections(invention, lobeIdx) {
    for (const [id, group] of this._inventionGroups) {
      const isTarget = id === invention.id;
      group.traverse(child => {
        if (!child.material || child.material.opacity === undefined) return;
        if (child.userData.isConnTube) return;        // handled by connection code below
        if (child.userData.isDotMatrix) {
          child.material.opacity = isTarget ? 0.92 : 0.12;
        } else if (child.userData.isWireframe) {
          child.material.opacity = isTarget ? WIRE_OPACITY : 0.03;
        } else if (child.isSprite) {
          child.visible = isTarget;
        }
      });
    }

    for (const conn of this._connections) {
      const isActive = conn.inventionId === invention.id
        && (conn.srcIdx === lobeIdx || conn.tgtIdx === lobeIdx);

      if (isActive) {
        // Show solid golden line, hide dashed
        conn.dashedLine.visible = false;
        conn.solidLine.visible = true;
        conn.dotA.material.color.setHex(CONN_ACTIVE_COLOR);
        conn.dotA.material.opacity = 1.0;
        conn.dotB.material.color.setHex(CONN_ACTIVE_COLOR);
        conn.dotB.material.opacity = 1.0;
        conn.labelSprite.visible = true;
        this._updateLabelHighlight(conn.labelSprite, conn.relText, true);
      } else {
        // Hide inactive connections
        conn.dashedLine.visible = false;
        conn.solidLine.visible = false;
        conn.dotA.visible = false;
        conn.dotB.visible = false;
        conn.labelSprite.visible = false;
      }
    }
  }

  _updateLabelHighlight(sprite, text, active) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 768;
    canvas.height = 128;

    const fSize = active ? 40 : 36;
    const fontStyle = active ? 'normal' : 'italic';
    const fontWeight = active ? '600' : '500';
    ctx.font = `${fontStyle} ${fontWeight} ${fSize}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (active) {
      // Subtle golden halo + text
      ctx.strokeStyle = 'rgba(240,242,245,0.9)';
      ctx.lineWidth = 6;
      ctx.lineJoin = 'round';
      ctx.strokeText(text, 384, 64);
      ctx.fillStyle = '#8a6a18';
    } else {
      // Subtle halo for legibility against geometry
      ctx.strokeStyle = 'rgba(240,242,245,0.85)';
      ctx.lineWidth = 5;
      ctx.lineJoin = 'round';
      ctx.strokeText(text, 384, 64);
      ctx.fillStyle = '#556677';
    }
    ctx.fillText(text, 384, 64);

    sprite.material.map.dispose();
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    sprite.material.map = texture;
    sprite.material.needsUpdate = true;
  }

  _highlightInvention(invention) {
    for (const [id, group] of this._inventionGroups) {
      const active = id === invention.id;
      group.traverse(child => {
        if (!child.material || child.material.opacity === undefined) return;
        if (child.userData.isConnTube) {
          child.material.opacity = active ? child.material.opacity : 0.05;
          return;
        }
        if (child.userData.isDotMatrix) {
          child.material.opacity = active ? 0.92 : 0.2;
        } else if (child.userData.isWireframe) {
          child.material.opacity = active ? WIRE_OPACITY : 0.04;
        } else if (child.isSprite) {
          child.visible = active;
        }
      });
    }
  }

  _resetHighlight() {
    for (const [, group] of this._inventionGroups) {
      group.traverse(child => {
        if (!child.material || child.material.opacity === undefined) return;
        if (child.userData.isConnTube) return;        // handled below
        child.visible = true;
        if (child.userData.isDotMatrix) child.material.opacity = 0.92;
        else if (child.userData.isWireframe) child.material.opacity = WIRE_OPACITY;
      });
    }

    for (const conn of this._connections) {
      conn.dashedLine.visible = true;
      conn.dashedLine.material.opacity = 0.45;
      conn.solidLine.visible = false;
      conn.dotA.visible = true;
      conn.dotA.material.color.setHex(CONN_COLOR);
      conn.dotA.material.opacity = 0.6;
      conn.dotB.visible = true;
      conn.dotB.material.color.setHex(CONN_COLOR);
      conn.dotB.material.opacity = 0.6;
      conn.labelSprite.visible = true;
      this._updateLabelHighlight(conn.labelSprite, conn.relText, false);
    }
  }

  // ─── Camera Fly-In ───

  _fitView() {
    if (!this._inventions.length) return;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (const inv of this._inventions) {
      minX = Math.min(minX, inv._x); maxX = Math.max(maxX, inv._x);
      minY = Math.min(minY, inv._y); maxY = Math.max(maxY, inv._y);
      minZ = Math.min(minZ, inv._z); maxZ = Math.max(maxZ, inv._z);
    }

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const cz = (minZ + maxZ) / 2;
    const span = Math.max(maxX - minX, maxY - minY, maxZ - minZ, 200);

    const finalPos = new THREE.Vector3(cx, cy + span * 0.55, cz + span * 1.1);
    const finalLookAt = new THREE.Vector3(cx, cy - span * 0.08, cz - span * 0.1);

    this._camera.position.set(cx, cy + span * 4, cz + span * 3);
    this._controls.target.set(cx, cy, cz);
    this._controls.update();

    this._flyInStart = performance.now();
    this._flyInDuration = 2500;
    this._flyInFrom = this._camera.position.clone();
    this._flyInTo = finalPos;
    this._flyInLookFrom = this._controls.target.clone();
    this._flyInLookTo = finalLookAt;
    this._flyingIn = true;
  }

  // ─── Filtering ───

  _filteredPatents() {
    return this._patents.filter(p => {
      if (!this._filters.unpublished && p.type === 'UnpublishedApplication') return false;
      if (!this._filters.pct && p.type === 'PCTApplication') return false;
      if (!this._filters.expired && p.dates?.expires) {
        if (new Date(p.dates.expires) < new Date()) return false;
      }
      return true;
    });
  }

  // ─── Scene Cleanup ───

  _clearScene() {
    for (const [, group] of this._inventionGroups) {
      this._scene.remove(group);
      group.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      });
    }
    if (this._bubbleMesh) {
      this._scene.remove(this._bubbleMesh);
      this._bubbleMesh.geometry.dispose();
      this._bubbleMesh.material.dispose();
      this._bubbleMesh = null;
    }
    this._inventionGroups.clear();
    this._hitMeshes = [];
    this._connections = [];
    this._textSprites = [];
    this._inventions = [];
    this._selectedPatent = null;
    this._hoveredPatent = null;
    this._hoveredInvention = null;
    this._hoveredLobeIdx = -1;
    this._hideHoverPopout();
  }
}
