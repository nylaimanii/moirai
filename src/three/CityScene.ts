import * as THREE from "three";

// simple seeded PRNG so each project's city is deterministic
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export class CityScene {
  group: THREE.Group;
  private materials: THREE.Material[] = [];
  private geometries: THREE.BufferGeometry[] = [];

  constructor(projectId: string) {
    this.group = new THREE.Group();
    const rand = mulberry32(hashId(projectId));

    const GRID = 70;          // half-extent of the district (units)
    const CELL = 10;          // block size
    const cyan = 0x2fd0d8;
    const gold = 0xf4c66a;

    // ground grid plane (wireframe-ish via GridHelper)
    const grid = new THREE.GridHelper(GRID * 2, (GRID * 2) / CELL, gold, cyan);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.0;
    this.materials.push(grid.material as THREE.Material);
    this.group.add(grid);

    // buildings — extruded boxes as edge-wireframes on the grid cells
    const edgeMat = new THREE.LineBasicMaterial({
      color: cyan,
      transparent: true,
      opacity: 0.0,
    });
    this.materials.push(edgeMat);

    for (let gx = -GRID + CELL; gx < GRID; gx += CELL) {
      for (let gz = -GRID + CELL; gz < GRID; gz += CELL) {
        if (rand() < 0.45) continue; // some empty lots
        const h = 6 + rand() * 46;
        const w = CELL * (0.4 + rand() * 0.35);
        const d = CELL * (0.4 + rand() * 0.35);
        const box = new THREE.BoxGeometry(w, h, d);
        this.geometries.push(box);
        const edges = new THREE.EdgesGeometry(box);
        this.geometries.push(edges);
        const line = new THREE.LineSegments(edges, edgeMat);
        line.position.set(
          gx + (rand() - 0.5) * 2,
          h / 2,
          gz + (rand() - 0.5) * 2
        );
        this.group.add(line);
      }
    }

    // the project itself — a brighter gold tower at center with a halo ring
    {
      const h = 70;
      const box = new THREE.BoxGeometry(8, h, 8);
      this.geometries.push(box);
      const edges = new THREE.EdgesGeometry(box);
      this.geometries.push(edges);
      const mat = new THREE.LineBasicMaterial({
        color: gold,
        transparent: true,
        opacity: 0.0,
      });
      this.materials.push(mat);
      const tower = new THREE.LineSegments(edges, mat);
      tower.position.set(0, h / 2, 0);
      this.group.add(tower);

      // ground influence ring
      const ringGeo = new THREE.RingGeometry(GRID * 0.7, GRID * 0.74, 64);
      this.geometries.push(ringGeo);
      const ringMat = new THREE.MeshBasicMaterial({
        color: gold,
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide,
      });
      this.materials.push(ringMat);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.2;
      this.group.add(ring);
    }
  }

  // 0..1 — fades all city materials together
  setOpacity(o: number) {
    for (const m of this.materials) {
      // grid + edges full at ~0.85, ring subtle at ~0.5
      const cap = (m as THREE.MeshBasicMaterial).side === THREE.DoubleSide ? 0.5 : 0.85;
      (m as THREE.Material).opacity = o * cap;
    }
  }

  dispose() {
    for (const g of this.geometries) g.dispose();
    for (const m of this.materials) m.dispose();
  }
}
