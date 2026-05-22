import * as THREE from "three";
import type { ImpactScores } from "../data/projects";

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
    const count = Math.round(4 + score * 16); // 4..20 columns
    const mat = new THREE.MeshBasicMaterial({
      color: 0xf4c66a,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.materials.push(mat);
    for (let i = 0; i < count; i++) {
      const h = 14 + score * 46 + Math.random() * 10;
      const geo = new THREE.CylinderGeometry(0.5, 0.5, h, 6, 1, true);
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
      size: 2.2,
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
      mm.opacity = o * ((m as THREE.PointsMaterial).isPointsMaterial ? 0.55 : 0.7);
    }
  }

  dispose() {
    for (const g of this.geometries) g.dispose();
    for (const m of this.materials) m.dispose();
  }
}
