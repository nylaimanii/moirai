import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// coarse land test — recognizable continent silhouettes via overlapping blobs.
// not geographically exact; stylized for the holographic look.
function isLand(lat: number, lon: number): boolean {
  const blobs: [number, number, number][] = [
    [54, -110, 26], [44, -100, 24], [33, -95, 18], [18, -95, 12], // n america
    [8, -75, 12], [-10, -60, 26], [-25, -60, 16], [-38, -65, 8],  // s america
    [54, 28, 30], [44, 12, 16],                                   // europe
    [22, 18, 26], [4, 22, 18], [-12, 26, 18], [-30, 24, 10],      // africa
    [60, 90, 40], [38, 100, 30], [22, 78, 16], [62, 150, 16],     // asia
    [-25, 133, 18], [-32, 147, 10],                               // australia
  ];
  for (const [bLat, bLon, rad] of blobs) {
    const dLat = lat - bLat;
    let dLon = lon - bLon;
    if (dLon > 180) dLon -= 360;
    if (dLon < -180) dLon += 360;
    // squash longitude a bit so blobs look less circular
    if (Math.sqrt(dLat * dLat + dLon * dLon * 0.55) < rad) return true;
  }
  return false;
}

export class GlobeScene {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private globe: THREE.Group;
  private stars: THREE.Points;
  private frameId = 0;
  private container: HTMLElement;
  private onResize: () => void;

  constructor(container: HTMLElement) {
    this.container = container;
    const w = container.clientWidth;
    const h = container.clientHeight;

    // renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    container.appendChild(this.renderer.domElement);

    // scene + camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000);
    this.camera.position.set(0, 0, 320);

    // controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.rotateSpeed = 0.5;
    this.controls.minDistance = 140;
    this.controls.maxDistance = 600;
    this.controls.enablePan = false;

    // globe group
    this.globe = new THREE.Group();
    this.scene.add(this.globe);

    const R = 100;

    // inner dark sphere so the wireframe has a body
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(R * 0.99, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0x0a1628 })
    );
    this.globe.add(core);

    // neon wireframe sphere
    const wire = new THREE.Mesh(
      new THREE.SphereGeometry(R, 36, 24),
      new THREE.MeshBasicMaterial({
        color: 0x16e08c,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      })
    );
    this.globe.add(wire);

    // glowing landmass dots — fibonacci sphere masked by isLand
    {
      const N = 6000;
      const pts: number[] = [];
      for (let i = 0; i < N; i++) {
        const y = 1 - (i / (N - 1)) * 2; // -1..1
        const radius = Math.sqrt(1 - y * y);
        const theta = Math.PI * (3 - Math.sqrt(5)) * i;
        const lat = Math.asin(y) * (180 / Math.PI);
        let lon = ((theta % (2 * Math.PI)) * (180 / Math.PI)) - 180;
        if (!isLand(lat, lon)) continue;
        const rr = R * 1.005;
        pts.push(
          rr * radius * Math.cos(theta),
          rr * y,
          rr * radius * Math.sin(theta)
        );
      }
      const landGeo = new THREE.BufferGeometry();
      landGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(pts), 3)
      );
      const land = new THREE.Points(
        landGeo,
        new THREE.PointsMaterial({
          color: 0x16e08c,
          size: 1.7,
          transparent: true,
          opacity: 0.9,
        })
      );
      this.globe.add(land);
    }

    // starfield
    const starCount = 1500;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 600 + Math.random() * 800;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        color: 0x5fd0e6,
        size: 1.4,
        transparent: true,
        opacity: 0.7,
      })
    );
    this.scene.add(this.stars);

    // resize handling
    this.onResize = () => {
      const nw = this.container.clientWidth;
      const nh = this.container.clientHeight;
      this.camera.aspect = nw / nh;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", this.onResize);

    this.animate = this.animate.bind(this);
    this.animate();
  }

  private animate() {
    this.frameId = requestAnimationFrame(this.animate);
    // idle auto-rotate
    this.globe.rotation.y += 0.0012;
    this.stars.rotation.y += 0.0002;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this.frameId);
    window.removeEventListener("resize", this.onResize);
    this.controls.dispose();
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
        obj.geometry.dispose();
        const mat = obj.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    });
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
