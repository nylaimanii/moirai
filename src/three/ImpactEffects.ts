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
  // traffic streaks
  private traffic: THREE.Points | null = null;
  private trafficVel: Float32Array | null = null;
  private trafficCount = 0;
  // health ripple rings
  private healthRings: THREE.Mesh[] = [];
  // habitat (tree dots that flicker out)
  private habitat: THREE.Points | null = null;
  private habitatBase: Float32Array | null = null;
  private habitatCount = 0;
  // noise rings
  private noiseRings: THREE.Mesh[] = [];
  // global fade multiplier — set by setOpacity, read by update() for per-ring fades
  private _fadeMul = 0;

  constructor(scores: ImpactScores, gridHalfExtent: number) {
    this.group = new THREE.Group();
    this.scores = scores;
    this.grid = gridHalfExtent;
    this.buildEconomy();
    this.buildPollution();
    this.buildTraffic();
    this.buildHealth();
    this.buildHabitat();
    this.buildNoise();
  }

  // ---- ECONOMY: gold energy columns rising from the ground, count + height by score ----
  private buildEconomy() {
    const score = this.scores.economy / 100; // 0..1
    const count = Math.round(3 + score * 17); // 3..20 columns
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
      const geo = new THREE.CylinderGeometry(0.7, 1.0, h, 8, 1, false);
      this.geometries.push(geo);
      const col = new THREE.Mesh(geo, mat);
      const a = Math.random() * Math.PI * 2;
      const r = this.grid * 0.3 + Math.random() * this.grid * 0.55;
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

  // ---- TRAFFIC: orange streaks flowing along the ground grid, speed/count by score ----
  private buildTraffic() {
    const score = this.scores.traffic / 100;
    const count = Math.round(40 + score * 200);
    this.trafficCount = count;
    const positions = new Float32Array(count * 3);
    this.trafficVel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) this.resetTrafficParticle(positions, i);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.geometries.push(geo);
    const mat = new THREE.PointsMaterial({
      color: 0xe8702a,
      size: 4,
      map: softCircleTexture(),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.materials.push(mat);
    this.traffic = new THREE.Points(geo, mat);
    this.group.add(this.traffic);
  }

  private resetTrafficParticle(positions: Float32Array, i: number) {
    // streaks travel along axis-aligned "roads" near ground level
    const onX = Math.random() < 0.5;
    const lane = (Math.floor(Math.random() * 7) - 3) * 8; // grid lanes
    const start = -this.grid + Math.random() * 4;
    if (onX) {
      positions[i * 3] = start;
      positions[i * 3 + 1] = 1.5;
      positions[i * 3 + 2] = lane;
    } else {
      positions[i * 3] = lane;
      positions[i * 3 + 1] = 1.5;
      positions[i * 3 + 2] = start;
    }
    if (this.trafficVel) {
      const score = this.scores.traffic / 100;
      // higher score = SLOWER (congestion/jams) — counterintuitive but that's the point
      const speed = (0.9 - score * 0.5) * (0.6 + Math.random() * 0.6);
      this.trafficVel[i * 3] = onX ? speed : 0;
      this.trafficVel[i * 3 + 1] = 0;
      this.trafficVel[i * 3 + 2] = onX ? 0 : speed;
    }
  }

  // ---- HEALTH: rose ripple rings expanding from center, rate/brightness by score ----
  private buildHealth() {
    const score = this.scores.health / 100;
    const ringCount = Math.round(2 + score * 4); // 2..6 rings
    for (let i = 0; i < ringCount; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xe03a5f,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      mat.userData.isRing = true;
      this.materials.push(mat);
      const geo = new THREE.RingGeometry(1, 2.8, 48);
      this.geometries.push(geo);
      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 1;
      ring.userData.offset = (i / ringCount) * Math.PI * 2;
      ring.userData.speed = 0.4 + score * 0.6;
      this.healthRings.push(ring);
      this.group.add(ring);
    }
  }

  // ---- HABITAT: green ground dots that dim/flicker, loss fraction by score ----
  private buildHabitat() {
    const score = this.scores.habitat / 100; // higher = more loss
    const count = 180;
    this.habitatCount = count;
    const positions = new Float32Array(count * 3);
    this.habitatBase = new Float32Array(count); // per-dot "alive" base 0/1
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * this.grid;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = 2.5;
      positions[i * 3 + 2] = Math.sin(a) * r;
      // higher score = more dots "lost" (flicker toward dead)
      this.habitatBase[i] = Math.random() > score ? 1 : 0;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.geometries.push(geo);
    const mat = new THREE.PointsMaterial({
      color: 0xc8ff5e,
      size: 3.4,
      map: softCircleTexture(),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.materials.push(mat);
    this.habitat = new THREE.Points(geo, mat);
    this.group.add(this.habitat);
  }

  // ---- NOISE: cyan concentric sound-wave rings, amplitude by score ----
  private buildNoise() {
    const score = this.scores.noise / 100;
    const ringCount = Math.round(2 + score * 3); // 2..5
    for (let i = 0; i < ringCount; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x4dd0ff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      mat.userData.isRing = true;
      this.materials.push(mat);
      const geo = new THREE.RingGeometry(1, 1.15, 48);
      this.geometries.push(geo);
      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.6;
      ring.userData.offset = (i / ringCount) * Math.PI * 2;
      ring.userData.speed = 0.5 + score * 0.5;
      this.noiseRings.push(ring);
      this.group.add(ring);
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
    // traffic: advect along roads, recycle off-grid
    if (this.traffic && this.trafficVel) {
      const pos = this.traffic.geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < this.trafficCount; i++) {
        arr[i * 3] += this.trafficVel[i * 3] * dt * 60;
        arr[i * 3 + 2] += this.trafficVel[i * 3 + 2] * dt * 60;
        if (Math.abs(arr[i * 3]) > this.grid || Math.abs(arr[i * 3 + 2]) > this.grid) {
          this.resetTrafficParticle(arr, i);
        }
      }
      pos.needsUpdate = true;
    }
    // health rings: expand outward + fade as they grow, loop. per-ring opacity owned here.
    for (const ring of this.healthRings) {
      const off = ring.userData.offset as number;
      const spd = ring.userData.speed as number;
      const phase = (t * spd + off) % (Math.PI); // 0..PI loop
      const grow = phase / Math.PI;              // 0..1
      const s = 1 + grow * this.grid * 0.9;
      ring.scale.set(s, s, s);
      ring.userData.localFade = 1 - grow;
      (ring.material as THREE.MeshBasicMaterial).opacity = (1 - grow) * this._fadeMul * 0.5;
    }
    // habitat: jitter a per-frame flicker value (applied to material in setOpacity)
    if (this.habitat && this.habitatBase && this.habitatCount > 0) {
      this.habitat.userData.flicker = 0.5 + Math.sin(t * 8) * 0.5;
    }
    // noise rings: expand + loop, tighter than health
    for (const ring of this.noiseRings) {
      const off = ring.userData.offset as number;
      const spd = ring.userData.speed as number;
      const phase = (t * spd + off) % (Math.PI);
      const grow = phase / Math.PI;
      const s = 1 + grow * this.grid * 1.1;
      ring.scale.set(s, s, s);
      ring.userData.localFade = 1 - grow;
      (ring.material as THREE.MeshBasicMaterial).opacity = (1 - grow) * this._fadeMul * 0.4;
    }
  }

  setOpacity(o: number) {
    this._fadeMul = o;
    for (const m of this.materials) {
      // rings own their own opacity (set per-frame in update via _fadeMul)
      if (m.userData.isRing) continue;
      const mm = m as THREE.Material & { opacity: number };
      // economy columns brighter, particle effects softer
      mm.opacity = o * ((m as THREE.PointsMaterial).isPointsMaterial ? 0.6 : 0.55);
    }
    // habitat: override the points opacity with the flicker modulation
    if (this.habitat) {
      (this.habitat.material as THREE.PointsMaterial).opacity =
        o * 0.85 * (this.habitat.userData.flicker ?? 1);
    }
    // traffic: punch through the gold pillars
    if (this.traffic) {
      (this.traffic.material as THREE.PointsMaterial).opacity = o * 0.85;
    }
  }

  dispose() {
    for (const g of this.geometries) g.dispose();
    for (const m of this.materials) m.dispose();
    if (_softTex) { _softTex.dispose(); _softTex = null; }
  }
}
