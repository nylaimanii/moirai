import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PROJECTS } from "../data/projects";
import { sampleLandPoints } from "./landPoints";

function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

export class GlobeScene {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private globe: THREE.Group;
  private stars: THREE.Points;
  private pins!: THREE.Group;
  private frameId = 0;
  private container: HTMLElement;
  private onResize: () => void;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private homePos = new THREE.Vector3(0, 0, 320);
  private homeTarget = new THREE.Vector3(0, 0, 0);
  private flyT = 1;           // 0..1 tween progress; 1 = settled
  private flyFrom = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
  private flyTo = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
  private flying = false;
  private selectedId: string | null = null;
  private onSelectCb: ((id: string | null) => void) | null = null;
  private onPointerMove: (e: PointerEvent) => void;
  private onClick: (e: PointerEvent) => void;

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
      new THREE.MeshBasicMaterial({ color: 0x060d18 })
    );
    this.globe.add(core);

    // neon wireframe sphere
    const wire = new THREE.Mesh(
      new THREE.SphereGeometry(R, 36, 24),
      new THREE.MeshBasicMaterial({
        color: 0x1b9fc4,
        wireframe: true,
        transparent: true,
        opacity: 0.08,
      })
    );
    this.globe.add(wire);

    // real landmass dots — sampled from actual coastline geojson
    {
      const landPts = sampleLandPoints(1.4);
      const positions = new Float32Array(landPts.length * 3);
      for (let i = 0; i < landPts.length; i++) {
        const [lat, lon] = landPts[i];
        const v = latLonToVec3(lat, lon, R * 1.004);
        positions[i * 3] = v.x;
        positions[i * 3 + 1] = v.y;
        positions[i * 3 + 2] = v.z;
      }
      const landGeo = new THREE.BufferGeometry();
      landGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const land = new THREE.Points(
        landGeo,
        new THREE.PointsMaterial({
          color: 0x3ff0c0,
          size: 1.15,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.95,
        })
      );
      this.globe.add(land);
    }

    // atmosphere glow — fresnel shell, brightest at the rim
    {
      const atmoMat = new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uColor: { value: new THREE.Color(0x2fd0d8) },
          uIntensity: { value: 0.85 },
        },
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          uniform vec3 uColor;
          uniform float uIntensity;
          void main() {
            // fresnel: glow strongest where normal faces away from camera (the rim)
            float fres = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.4);
            gl_FragColor = vec4(uColor, clamp(fres, 0.0, 1.0) * uIntensity);
          }
        `,
      });
      const atmo = new THREE.Mesh(
        new THREE.SphereGeometry(R * 1.18, 96, 96),
        atmoMat
      );
      // atmosphere is added to the SCENE (not this.globe) so it doesn't
      // spin — a glow halo shouldn't rotate. it stays centered on origin.
      this.scene.add(atmo);
    }

    // project pins — glowing markers at each project's lat/lon
    this.pins = new THREE.Group();
    this.globe.add(this.pins);
    for (const p of PROJECTS) {
      const pos = latLonToVec3(p.lat, p.lon, R * 1.01);
      const pin = new THREE.Mesh(
        new THREE.SphereGeometry(1.6, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xf4c66a })
      );
      pin.position.copy(pos);
      pin.userData.projectId = p.id;
      // a soft halo ring around each pin
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(2.8, 12, 12),
        new THREE.MeshBasicMaterial({
          color: 0xf4c66a,
          transparent: true,
          opacity: 0.25,
        })
      );
      halo.position.copy(pos);
      halo.userData.isHalo = true;
      pin.userData.halo = halo;
      this.pins.add(pin);
      this.pins.add(halo);
    }

    // pointer raycasting — hover cursor + click to dive
    this.onPointerMove = (e: PointerEvent) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = this.raycaster.intersectObjects(this.pins.children, false);
      const overPin = hits.some((h) => h.object.userData.projectId);
      this.renderer.domElement.style.cursor = overPin ? "pointer" : "grab";
    };
    this.onClick = (e: PointerEvent) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = this.raycaster.intersectObjects(this.pins.children, false);
      const hit = hits.find((h) => h.object.userData.projectId);
      if (hit) {
        this.diveTo(hit.object.userData.projectId as string, hit.object.position.clone());
      }
    };
    this.renderer.domElement.addEventListener("pointermove", this.onPointerMove);
    this.renderer.domElement.addEventListener("click", this.onClick);

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
        size: 0.9,
        transparent: true,
        opacity: 0.5,
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
    // idle auto-rotate — paused while a project is selected
    if (this.selectedId === null) {
      this.globe.rotation.y += 0.0012;
    }
    this.stars.rotation.y += 0.0002;
    // pulse the pin halos
    const pulse = 1 + Math.sin(performance.now() * 0.003) * 0.18;
    this.pins.children.forEach((child) => {
      if ((child as THREE.Mesh).userData.isHalo) {
        child.scale.setScalar(pulse);
      }
    });
    if (this.flying) {
      this.flyT = Math.min(1, this.flyT + 0.022);
      const e = this.flyT < 0.5
        ? 4 * this.flyT * this.flyT * this.flyT
        : 1 - Math.pow(-2 * this.flyT + 2, 3) / 2; // easeInOutCubic
      this.camera.position.lerpVectors(this.flyFrom.pos, this.flyTo.pos, e);
      this.controls.target.lerpVectors(this.flyFrom.target, this.flyTo.target, e);
      if (this.flyT >= 1) {
        this.flying = false;
        // re-enable controls only when back at orbit (selectedId null)
        this.controls.enabled = this.selectedId === null;
      }
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  setOnSelect(cb: (id: string | null) => void) {
    this.onSelectCb = cb;
  }

  private startFly(toPos: THREE.Vector3, toTarget: THREE.Vector3) {
    this.flyFrom.pos.copy(this.camera.position);
    this.flyFrom.target.copy(this.controls.target);
    this.flyTo.pos.copy(toPos);
    this.flyTo.target.copy(toTarget);
    this.flyT = 0;
    this.flying = true;
    this.controls.enabled = false;
  }

  diveTo(id: string, pinWorldPos: THREE.Vector3) {
    // pinWorldPos is in globe-local space (pins are children of globe).
    // convert to world, then place the camera a bit outside it looking at it.
    const worldPos = pinWorldPos.clone();
    this.globe.localToWorld(worldPos);
    const dir = worldPos.clone().normalize();
    const camPos = worldPos.clone().add(dir.multiplyScalar(55)); // 55 units above the pin
    this.startFly(camPos, worldPos);
    this.selectedId = id;
    if (this.onSelectCb) this.onSelectCb(id);
  }

  returnToOrbit() {
    this.startFly(this.homePos.clone(), this.homeTarget.clone());
    this.selectedId = null;
    if (this.onSelectCb) this.onSelectCb(null);
  }

  zoomIn() {
    const target = this.controls.target;
    const dist = this.camera.position.distanceTo(target);
    const next = Math.max(this.controls.minDistance, dist * 0.82);
    const dir = this.camera.position.clone().sub(target).normalize();
    this.camera.position.copy(target).add(dir.multiplyScalar(next));
    this.controls.update();
  }
  zoomOut() {
    const target = this.controls.target;
    const dist = this.camera.position.distanceTo(target);
    const next = Math.min(this.controls.maxDistance, dist * 1.22);
    const dir = this.camera.position.clone().sub(target).normalize();
    this.camera.position.copy(target).add(dir.multiplyScalar(next));
    this.controls.update();
  }

  dispose() {
    cancelAnimationFrame(this.frameId);
    window.removeEventListener("resize", this.onResize);
    this.renderer.domElement.removeEventListener("pointermove", this.onPointerMove);
    this.renderer.domElement.removeEventListener("click", this.onClick);
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
