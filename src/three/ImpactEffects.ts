import * as THREE from "three";
import type { ImpactScores } from "../data/projects";

// soft radial-gradient sprite so particles read as haze, not squares
let _softTex: THREE.Texture | null = null;
function softCircleTexture(): THREE.Texture {
  if (_softTex) return _softTex;
  const size = 64;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.5)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  _softTex = tex;
  return tex;
}

export class ImpactEffects {
  group: THREE.Group;
  private materials: THREE.Material[] = [];
  private geometries: THREE.BufferGeometry[] = [];
  private scores: ImpactScores;
  private grid: number;

  // economy columns
  private columns: THREE.Mesh[] = [];
  // pollution particles
  private pollution: THREE.Points | null = null;
  private pollutionVel: Float32Array | null = null;
  private pollutionCount = 0;

  constructor(scores: ImpactScores, gridHalfExtent: number) {
    this.group = new THREE.Group();
    this.scores = scores;
    this.grid = gridHalfExtent;
    this.buildEconomy();
    this.buildPollution();
  }

  // ---- ECONOMY: gold energy columns rising from the ground, count + height by score ----
  private buildEconomy() {
    const score = this.scores.economy / 100; // 0..1
    const count = Math.round(5 + score * 13); // 5..18 columns
    const mat = new THREE.MeshBasicMaterial({
      color: 0xf4c66a,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.materials.push(mat);
    for (let i = 0; i < count; i++) {
      const h = 24 + score * 60 + Math.random() * 12;
      const geo = new THREE.CylinderGeometry(1.1, 1.6, h, 8, 1, false);
      this.geometries.push(geo);
      const col = new THREE.Mesh(geo, mat);
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * this.grid * 0.8;
      col.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
      col.userData.baseY = h / 2;
      col.userData.h = h;
      col.userData.phase = Math.random() * Math.PI * 2;
      this.columns.push(col);
      this.group.add(col);
    }
  }

  // ---- POLLUTION: violet particle haze emitted from center, drifts on a wind ----
  private buildPollution() {
    const score = this.scores.pollution / 100;
    const count = Math.round(60 + score * 340); // 60..400 particles
    this.pollutionCount = count;
    const positions = new Float32Array(count * 3);
    this.pollutionVel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      this.resetPollutionParticle(positions, i);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.geometries.push(geo);
    const mat = new THREE.PointsMaterial({
      color: 0x9d7bff,
      size: 4.5,
      map: softCircleTexture(),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.materials.push(mat);
    this.pollution = new THREE.Points(geo, mat);
    this.group.add(this.pollution);
  }

  private resetPollutionParticle(positions: Float32Array, i: number) {
    // spawn near center-ground, low
    positions[i * 3] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 1] = Math.random() * 4;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    if (this.pollutionVel) {
      // drift on a "wind" (+x) plus rise
      this.pollutionVel[i * 3] = 0.15 + Math.random() * 0.2;
      this.pollutionVel[i * 3 + 1] = 0.08 + Math.random() * 0.12;
      this.pollutionVel[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }
  }

  update(dt: number) {
    const t = performance.now() * 0.001;
    // economy: gentle vertical pulse
    for (const col of this.columns) {
      const p = col.userData.phase as number;
      col.scale.y = 1 + Math.sin(t * 1.5 + p) * 0.08;
    }
    // pollution: advect + recycle particles that drift too far
    if (this.pollution && this.pollutionVel) {
      const pos = this.pollution.geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < this.pollutionCount; i++) {
        arr[i * 3] += this.pollutionVel[i * 3] * dt * 60;
        arr[i * 3 + 1] += this.pollutionVel[i * 3 + 1] * dt * 60;
        arr[i * 3 + 2] += this.pollutionVel[i * 3 + 2] * dt * 60;
        // recycle if drifted past the district or risen too high
        const dist = Math.hypot(arr[i * 3], arr[i * 3 + 2]);
        if (dist > this.grid * 1.4 || arr[i * 3 + 1] > 50) {
          this.resetPollutionParticle(arr, i);
        }
      }
      pos.needsUpdate = true;
    }
  }

  setOpacity(o: number) {
    for (const m of this.materials) {
      const mm = m as THREE.Material & { opacity: number };
      // economy columns brighter, pollution softer
      mm.opacity = o * ((m as THREE.PointsMaterial).isPointsMaterial ? 0.6 : 0.9);
    }
  }

  dispose() {
    for (const g of this.geometries) g.dispose();
    for (const m of this.materials) m.dispose();
    if (_softTex) { _softTex.dispose(); _softTex = null; }
  }
}
