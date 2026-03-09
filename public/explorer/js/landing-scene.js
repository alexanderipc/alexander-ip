// ═══════════════════════════════════════════════════
// Landing Scene — Three.js animated background
// Light void with perspective grid + floating particles
// ═══════════════════════════════════════════════════

import * as THREE from 'three';

export class LandingScene {
  constructor(canvas) {
    this._canvas = canvas;
    this._disposed = false;

    const w = window.innerWidth;
    const h = window.innerHeight;

    // Renderer
    this._renderer = new THREE.WebGLRenderer({
      canvas, alpha: true, antialias: true, powerPreference: 'high-performance'
    });
    this._renderer.setSize(w, h);
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.setClearColor(0x000000, 0); // transparent — CSS gradient shows through

    // Scene
    this._scene = new THREE.Scene();
    this._scene.fog = new THREE.Fog(0xf0f4fa, 400, 1800);

    // Camera — elevated looking down at grid
    this._camera = new THREE.PerspectiveCamera(50, w / h, 1, 3000);
    this._camera.position.set(0, 180, 350);
    this._camera.lookAt(0, -40, -200);

    // Lighting
    this._scene.add(new THREE.AmbientLight(0x8899bb, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(100, 200, 150);
    this._scene.add(dirLight);

    // Build scene
    this._addGrid();
    this._addParticles();
    this._addConnectionCurves();

    // Handle resize
    this._onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      this._camera.aspect = w / h;
      this._camera.updateProjectionMatrix();
      this._renderer.setSize(w, h);
    };
    window.addEventListener('resize', this._onResize);

    // Start animation
    this._clock = new THREE.Clock();
    this._animate();
  }

  _addGrid() {
    const gridShader = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0x3b82f6) },
        uFade: { value: 900.0 },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uFade;
        varying vec3 vWorldPos;
        void main() {
          float dist = length(vWorldPos.xz);
          float fade = 1.0 - smoothstep(0.0, uFade, dist);
          // Fine grid
          float gx = abs(fract(vWorldPos.x / 50.0 - 0.5) - 0.5) / fwidth(vWorldPos.x / 50.0);
          float gz = abs(fract(vWorldPos.z / 50.0 - 0.5) - 0.5) / fwidth(vWorldPos.z / 50.0);
          float fine = 1.0 - min(min(gx, gz), 1.0);
          // Coarse grid
          float cx = abs(fract(vWorldPos.x / 200.0 - 0.5) - 0.5) / fwidth(vWorldPos.x / 200.0);
          float cz = abs(fract(vWorldPos.z / 200.0 - 0.5) - 0.5) / fwidth(vWorldPos.z / 200.0);
          float coarse = 1.0 - min(min(cx, cz), 1.0);
          float line = fine * 0.06 + coarse * 0.15;
          gl_FragColor = vec4(uColor, line * fade);
        }
      `,
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), gridShader);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -60;
    this._scene.add(plane);
  }

  _addParticles() {
    const count = 150;
    const positions = new Float32Array(count * 3);
    const velocities = [];
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1200;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 300 - 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1200;
      velocities.push({
        x: (Math.random() - 0.5) * 0.15,
        y: Math.random() * 0.08 + 0.02,
        z: (Math.random() - 0.5) * 0.15
      });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x93a8c8, size: 2.5, transparent: true, opacity: 0.18,
      sizeAttenuation: true, depthWrite: false,
    });
    this._particles = new THREE.Points(geo, mat);
    this._particleVelocities = velocities;
    this._scene.add(this._particles);
  }

  _addConnectionCurves() {
    // Abstract flowing data curves — like particle tracks
    const curves = [];
    for (let i = 0; i < 8; i++) {
      const points = [];
      const startX = (Math.random() - 0.5) * 400;
      const startZ = (Math.random() - 0.5) * 400;
      const startY = Math.random() * 60 - 30;
      for (let j = 0; j < 5; j++) {
        points.push(new THREE.Vector3(
          startX + (Math.random() - 0.5) * 200,
          startY + Math.random() * 80 - 40,
          startZ - j * 100 + (Math.random() - 0.5) * 80
        ));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(60));
      const lineMat = new THREE.LineDashedMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.12,
        dashSize: 8,
        gapSize: 6,
        linewidth: 1,
      });
      const line = new THREE.Line(curveGeo, lineMat);
      line.computeLineDistances();
      curves.push({ line, mat: lineMat, speed: 0.3 + Math.random() * 0.4 });
      this._scene.add(line);
    }
    this._curves = curves;
  }

  _animate() {
    if (this._disposed) return;
    requestAnimationFrame(() => this._animate());

    const elapsed = this._clock.getElapsedTime();

    // Gentle camera sway
    this._camera.position.x = Math.sin(elapsed * 0.08) * 30;
    this._camera.position.y = 180 + Math.sin(elapsed * 0.12) * 8;
    this._camera.lookAt(0, -40, -200);

    // Animate particles (subtle upward drift + breathing)
    if (this._particles) {
      const pos = this._particles.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        pos.array[i * 3] += this._particleVelocities[i].x;
        pos.array[i * 3 + 1] += this._particleVelocities[i].y;
        pos.array[i * 3 + 2] += this._particleVelocities[i].z;

        // Reset particles that drift too high
        if (pos.array[i * 3 + 1] > 200) {
          pos.array[i * 3 + 1] = -100;
          pos.array[i * 3] = (Math.random() - 0.5) * 1200;
          pos.array[i * 3 + 2] = (Math.random() - 0.5) * 1200;
        }
      }
      pos.needsUpdate = true;

      // Breathing size
      this._particles.material.size = 2.5 + Math.sin(elapsed * 0.5) * 0.5;
    }

    // Animate dashed line flow
    this._curves?.forEach(c => {
      c.mat.dashOffset -= c.speed * 0.05;
    });

    this._renderer.render(this._scene, this._camera);
  }

  dispose() {
    this._disposed = true;
    window.removeEventListener('resize', this._onResize);

    // Dispose all geometries and materials
    this._scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });

    this._renderer.dispose();
  }
}
