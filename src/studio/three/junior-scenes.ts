import * as THREE from "three";
import {
  CAP_OPEN_POS,
  LDR_SENSOR_POS,
  PIANO_NOTES,
  type JuniorLessonId,
  type Point2D,
} from "../logic/junior-circuits";

export interface JuniorSceneState {
  lessonId: JuniorLessonId;
  isDark: boolean;
  // Table Lamp
  capPos: Point2D;
  lampOn: boolean;
  isDraggingCap: boolean;
  // Mood Lamp
  moodHex: string;
  moodIntensity: number; // 0..1 breathing factor
  moodOn: boolean;
  // Fill a Ring
  potValue01: number; // 0..1
  ringColors: (string | null)[];
  // Mini Piano
  activePianoKey: number | null; // 0..3
  soundPulse: number; // 0..1
  // Siren
  sirenArmed: boolean;
  sirenRedOn: boolean;
  sirenBlueOn: boolean;
  // Wi-Fi Switch
  wifiLampOn: boolean;
  wifiPulse: number; // 0..1
  wifiHost: string;
  // Robot Radar Gate (07)
  roverDistanceCm: number; // 5..80
  gateAngleDeg: number; // 0..115
  gateOpen: boolean;
  // Smart Plant Fan (08)
  roomTempC: number; // 16..40
  fanMode: "off" | "eco" | "turbo";
  fanSpinAngle: number; // radians
}

export interface JuniorLessonRig {
  root: THREE.Group;
  capGroup?: THREE.Group;
  update: (state: JuniorSceneState) => void;
  dispose: () => void;
}

export function disposeObject3D(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    const mat = (mesh as { material?: THREE.Material | THREE.Material[] }).material;
    if (mat) {
      const mats = Array.isArray(mat) ? mat : [mat];
      for (const m of mats) {
        const record = m as unknown as Record<string, unknown>;
        for (const val of Object.values(record)) {
          if (val instanceof THREE.Texture) {
            val.dispose();
          }
        }
        m.dispose();
      }
    }
  });
}

function addOutline(
  mesh: THREE.Mesh,
  color = 0x2a2622,
  opacity = 0.55,
  thresholdAngle = 22,
): void {
  const edges = new THREE.EdgesGeometry(mesh.geometry, thresholdAngle);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
  line.raycast = () => {};
  mesh.add(line);
}

function tagRecursive(obj: THREE.Object3D, key: string, value: string): void {
  obj.userData[key] = value;
  obj.traverse((child) => {
    child.userData[key] = value;
  });
}

function createDraftingFloorTexture(isDark: boolean): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = isDark ? "#0f172a" : "#faf6ef";
  ctx.fillRect(0, 0, size, size);

  // Subtle architectural drafting paper grid
  const minor = size / 8;
  ctx.strokeStyle = isDark ? "rgba(148, 163, 184, 0.08)" : "rgba(180, 168, 148, 0.24)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 8; i++) {
    const p = i * minor + 0.5;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  // Major drafting grid line
  ctx.strokeStyle = isDark ? "rgba(148, 163, 184, 0.16)" : "rgba(160, 146, 124, 0.34)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0.5, 0.5, size - 1, size - 1);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(9, 9);
  return tex;
}

export function createDraftingFloor(isDark: boolean): {
  mesh: THREE.Mesh;
  setTheme: (dark: boolean) => void;
} {
  const geo = new THREE.PlaneGeometry(34, 34);
  const mat = new THREE.MeshStandardMaterial({
    map: createDraftingFloorTexture(isDark),
    roughness: 0.94,
    metalness: 0.0,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.005;
  mesh.receiveShadow = true;

  return {
    mesh,
    setTheme(dark: boolean) {
      if (mat.map) mat.map.dispose();
      mat.map = createDraftingFloorTexture(dark);
      mat.needsUpdate = true;
    },
  };
}

function createShieldTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#d5dbe3";
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 236, 236);

  ctx.fillStyle = "#334155";
  ctx.font = "bold 24px monospace";
  ctx.textAlign = "center";
  ctx.fillText("ESP32-S3", 128, 104);

  ctx.font = "600 16px monospace";
  ctx.fillStyle = "#475569";
  ctx.fillText("WROOM-1", 128, 134);

  ctx.font = "500 13px monospace";
  ctx.fillStyle = "#64748b";
  ctx.fillText("Wi-Fi · BLE 5.0", 128, 166);

  // Subtle corner alignment dot
  ctx.beginPath();
  ctx.arc(36, 36, 8, 0, Math.PI * 2);
  ctx.fillStyle = "#64748b";
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBreadboardTopTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#f4efe4";
  ctx.fillRect(0, 0, 512, 256);

  // Top & bottom power rails
  ctx.fillStyle = "#dc2626";
  ctx.fillRect(22, 16, 468, 4);
  ctx.fillStyle = "#2563eb";
  ctx.fillRect(22, 42, 468, 4);

  ctx.fillStyle = "#dc2626";
  ctx.fillRect(22, 210, 468, 4);
  ctx.fillStyle = "#2563eb";
  ctx.fillRect(22, 236, 468, 4);

  // Center DIP channel
  ctx.fillStyle = "#e2dacb";
  ctx.fillRect(16, 120, 480, 16);

  // Pin holes grid
  ctx.fillStyle = "#3b3834";
  for (let col = 0; col < 24; col++) {
    const x = 32 + col * 19.5;
    // Top & bottom power sockets
    if (col % 6 !== 5) {
      ctx.fillRect(x, 26, 6, 6);
      ctx.fillRect(x, 220, 6, 6);
    }
    // Main terminal strips (5 rows top, 5 rows bottom)
    for (let row = 0; row < 5; row++) {
      ctx.fillRect(x, 56 + row * 12, 5.5, 5.5);
      ctx.fillRect(x, 144 + row * 12, 5.5, 5.5);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createLdrFaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#f5ece0";
  ctx.fillRect(0, 0, 128, 128);

  // Cadmium sulfide wavy serpentine track
  ctx.strokeStyle = "#c2410c";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const y = 24 + i * 16;
    if (i % 2 === 0) {
      ctx.moveTo(24, y);
      ctx.lineTo(104, y);
    } else {
      ctx.moveTo(104, y);
      ctx.lineTo(24, y);
    }
  }
  ctx.stroke();

  // Metallic electrode edges
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(64, 64, 54, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createGlowPoolTexture(hex: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createRadialGradient(128, 128, 8, 128, 128, 124);
  grad.addColorStop(0, `${hex}cc`);
  grad.addColorStop(0.45, `${hex}55`);
  grad.addColorStop(1, `${hex}00`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createEsp32Model(): THREE.Group {
  const group = new THREE.Group();

  // Main matte charcoal PCB
  const pcbMat = new THREE.MeshStandardMaterial({
    color: 0x1e2530,
    roughness: 0.62,
    metalness: 0.08,
  });
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.13, 1.32), pcbMat);
  pcb.position.y = 0.22;
  pcb.castShadow = true;
  pcb.receiveShadow = true;
  addOutline(pcb, 0x0f172a, 0.65);
  group.add(pcb);

  // Gold PCB Antenna meander section on right end
  const antBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.135, 1.06),
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.7 }),
  );
  antBase.position.set(1.16, 0.225, 0);
  group.add(antBase);

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    metalness: 0.78,
    roughness: 0.28,
  });
  for (let i = 0; i < 4; i++) {
    const trace = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.02, 0.74), goldMat);
    trace.position.set(1.0 + i * 0.11, 0.295, i % 2 === 0 ? 0.06 : -0.06);
    group.add(trace);
  }

  // Metallic ESP32 RF Shield
  const shield = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 0.16, 0.94),
    new THREE.MeshStandardMaterial({
      map: createShieldTexture(),
      metalness: 0.45,
      roughness: 0.35,
    }),
  );
  shield.position.set(0.46, 0.36, 0);
  shield.castShadow = true;
  addOutline(shield, 0x334155, 0.55);
  group.add(shield);

  // Dual USB-C silver port on left edge
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    metalness: 0.7,
    roughness: 0.28,
  });
  const usbc = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.42), metalMat);
  usbc.position.set(-1.38, 0.32, 0);
  addOutline(usbc, 0x334155, 0.55);
  group.add(usbc);

  // Small BOOT & EN tactile buttons
  const btnBodyMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
  const btnCapMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
  for (const zOff of [-0.34, 0.34]) {
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.14), btnBodyMat);
    base.position.set(-0.98, 0.31, zOff);
    group.add(base);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 12), btnCapMat);
    cap.position.set(-0.98, 0.36, zOff);
    group.add(cap);
  }

  // Onboard Power LED (warm red dot)
  const pwrLed = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.04, 0.06),
    new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.4,
    }),
  );
  pwrLed.position.set(-0.52, 0.31, -0.35);
  group.add(pwrLed);

  // Dual 15-pin black headers + gold pins along front and back
  const headerMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6 });
  for (const zSide of [-0.56, 0.56]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.16, 0.12), headerMat);
    strip.position.set(-0.1, 0.12, zSide);
    group.add(strip);

    for (let i = 0; i < 15; i++) {
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.34, 6), goldMat);
      pin.position.set(-1.18 + i * 0.155, 0.21, zSide);
      group.add(pin);
    }
  }

  tagRecursive(group, "calloutId", "esp32");
  return group;
}

function createBreadboardModel(): THREE.Group {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(3.05, 0.24, 1.62),
    [
      new THREE.MeshStandardMaterial({ color: 0xe6dfd1, roughness: 0.72 }),
      new THREE.MeshStandardMaterial({ color: 0xe6dfd1, roughness: 0.72 }),
      new THREE.MeshStandardMaterial({ map: createBreadboardTopTexture(), roughness: 0.7 }),
      new THREE.MeshStandardMaterial({ color: 0xd8d0c0, roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ color: 0xded7c8, roughness: 0.72 }),
      new THREE.MeshStandardMaterial({ color: 0xded7c8, roughness: 0.72 }),
    ],
  );
  body.position.y = 0.12;
  body.castShadow = true;
  body.receiveShadow = true;
  addOutline(body, 0x3b352e, 0.5);
  group.add(body);

  return group;
}

function createDupontWire(
  start: [number, number, number],
  end: [number, number, number],
  hexColor: number,
  arcHeight = 0.95,
  midOffset: [number, number] = [0, 0],
): THREE.Group {
  const wireGroup = new THREE.Group();
  const p0 = new THREE.Vector3(start[0], start[1] + 0.16, start[2]);
  const p3 = new THREE.Vector3(end[0], end[1] + 0.16, end[2]);
  const midX = (p0.x + p3.x) * 0.5 + midOffset[0];
  const midZ = (p0.z + p3.z) * 0.5 + midOffset[1];
  const p1 = new THREE.Vector3(
    THREE.MathUtils.lerp(p0.x, midX, 0.55),
    Math.max(p0.y, p3.y) + arcHeight,
    THREE.MathUtils.lerp(p0.z, midZ, 0.55),
  );
  const p2 = new THREE.Vector3(
    THREE.MathUtils.lerp(midX, p3.x, 0.45),
    Math.max(p0.y, p3.y) + arcHeight,
    THREE.MathUtils.lerp(midZ, p3.z, 0.45),
  );

  const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 24, 0.036, 8, false),
    new THREE.MeshStandardMaterial({
      color: hexColor,
      roughness: 0.42,
      metalness: 0.05,
    }),
  );
  tube.castShadow = true;
  wireGroup.add(tube);

  // Iconic black rectangular Dupont connector boots at each end
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.45 });
  const bootGeo = new THREE.BoxGeometry(0.11, 0.22, 0.11);
  for (const pt of [start, end]) {
    const boot = new THREE.Mesh(bootGeo, bootMat);
    boot.position.set(pt[0], pt[1] + 0.1, pt[2]);
    addOutline(boot, 0x09090b, 0.6);
    wireGroup.add(boot);
  }

  return wireGroup;
}

function createAxialResistor(
  x: number,
  y: number,
  z: number,
  bands: [number, number, number],
  rotY = 0,
): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;

  // Beige ceramic resistor body
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.34, 12),
    new THREE.MeshStandardMaterial({ color: 0xd9b98b, roughness: 0.55 }),
  );
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.12;
  addOutline(body, 0x443627, 0.45);
  g.add(body);

  // 3 color bands
  const offsets = [-0.09, 0, 0.09];
  bands.forEach((col, i) => {
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.058, 0.058, 0.036, 12),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.45 }),
    );
    band.rotation.z = Math.PI / 2;
    band.position.set(offsets[i], 0.12, 0);
    g.add(band);
  });

  // Bent metallic leads down into breadboard
  const leadMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    metalness: 0.85,
    roughness: 0.2,
  });
  for (const side of [-0.24, 0.24]) {
    const horiz = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.16, 6), leadMat);
    horiz.rotation.z = Math.PI / 2;
    horiz.position.set(side * 0.82, 0.12, 0);
    g.add(horiz);

    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.16, 6), leadMat);
    leg.position.set(side, 0.05, 0);
    g.add(leg);
  }

  return g;
}

function createTableLampProp(): {
  group: THREE.Group;
  setLit: (on: boolean) => void;
} {
  const group = new THREE.Group();

  // Warm ceramic base (sage terracotta aesthetic matching learn-esp32)
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xd97757,
    roughness: 0.48,
    metalness: 0.05,
  });
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.56, 0.14, 24), baseMat);
  foot.position.y = 0.07;
  foot.castShadow = true;
  addOutline(foot, 0x3f2318, 0.45);
  group.add(foot);

  const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.48, 0.72, 24), baseMat);
  vase.position.y = 0.5;
  vase.castShadow = true;
  addOutline(vase, 0x3f2318, 0.4);
  group.add(vase);

  // Brass stem collar
  const brass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.16, 0.28, 16),
    new THREE.MeshStandardMaterial({ color: 0xd4a24c, metalness: 0.72, roughness: 0.28 }),
  );
  brass.position.y = 0.96;
  group.add(brass);

  // Linen conical shade (warm off-white when OFF, rich warm golden glow when ON)
  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0xf7efe0,
    emissive: 0xffa73b,
    emissiveIntensity: 0.0,
    roughness: 0.82,
    side: THREE.DoubleSide,
  });
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.56, 1.02, 1.02, 28, 1, true),
    shadeMat,
  );
  shade.position.y = 1.56;
  shade.castShadow = true;
  addOutline(shade, 0x5c4d3c, 0.42);
  group.add(shade);

  // Top rim cap ring
  const topRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.56, 0.028, 8, 28),
    new THREE.MeshStandardMaterial({ color: 0xd4a24c, metalness: 0.65, roughness: 0.3 }),
  );
  topRim.rotation.x = Math.PI / 2;
  topRim.position.y = 2.07;
  group.add(topRim);

  // Inner bulb
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff7dc,
    emissive: 0xffcc55,
    emissiveIntensity: 0.0,
    roughness: 0.2,
  });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 14), bulbMat);
  bulb.position.y = 1.38;
  group.add(bulb);

  // Dynamic warm PointLight + floor glow pool
  const light = new THREE.PointLight(0xffb84d, 0, 7.5, 1.5);
  light.position.set(0, 1.35, 0);
  group.add(light);

  const poolMat = new THREE.MeshBasicMaterial({
    map: createGlowPoolTexture("#ffb84d"),
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 3.8), poolMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.015;
  pool.raycast = () => {};
  group.add(pool);

  tagRecursive(group, "calloutId", "lamp");

  return {
    group,
    setLit(on: boolean) {
      shadeMat.emissiveIntensity = on ? 0.82 : 0.0;
      shadeMat.color.setHex(on ? 0xfff5dc : 0xf2e9d8);
      bulbMat.emissiveIntensity = on ? 2.4 : 0.0;
      light.intensity = on ? 6.5 : 0;
      poolMat.opacity = on ? 0.85 : 0;
    },
  };
}

function createDraggableCap(): THREE.Group {
  const cap = new THREE.Group();

  const matteDark = new THREE.MeshStandardMaterial({
    color: 0x262930,
    roughness: 0.55,
    metalness: 0.14,
  });

  // Main cylindrical cap body
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 0.52, 24), matteDark);
  body.position.y = 0.26;
  body.castShadow = true;
  addOutline(body, 0x0f172a, 0.7);
  cap.add(body);

  // Tactile grip rim around bottom
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.44, 0.032, 10, 24),
    new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.45 }),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.08;
  cap.add(rim);

  // Cute knurled top pinch knob so users immediately recognize it is grabbable
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.16, 18), matteDark);
  knob.position.y = 0.58;
  addOutline(knob, 0x0f172a, 0.7);
  cap.add(knob);

  tagRecursive(cap, "dragId", "cap");
  tagRecursive(cap, "calloutId", "cap");
  return cap;
}

function buildTableLampLesson(): JuniorLessonRig {
  const root = new THREE.Group();

  const esp = createEsp32Model();
  esp.position.set(0.15, 0, -1.45);
  root.add(esp);

  const bb = createBreadboardModel();
  bb.position.set(-0.95, 0, 0.72);
  root.add(bb);

  // LDR Light Sensor centered at LDR_SENSOR_POS (-0.95, 0.72)
  const ldrGroup = new THREE.Group();
  ldrGroup.position.set(LDR_SENSOR_POS.x, 0.24, LDR_SENSOR_POS.z);

  const leadMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.85, roughness: 0.2 });
  for (const xOff of [-0.08, 0.08]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.26, 8), leadMat);
    leg.position.set(xOff, 0.12, 0);
    ldrGroup.add(leg);
  }
  const ldrDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.09, 20),
    [
      new THREE.MeshStandardMaterial({ color: 0xe6dccb, roughness: 0.6 }),
      new THREE.MeshStandardMaterial({ map: createLdrFaceTexture(), roughness: 0.4 }),
      new THREE.MeshStandardMaterial({ color: 0xd6cab6, roughness: 0.6 }),
    ],
  );
  ldrDisc.position.y = 0.26;
  addOutline(ldrDisc, 0x7c2d12, 0.55);
  ldrGroup.add(ldrDisc);

  // Target guide ring on breadboard around LDR so kids immediately know where to drag The Cap
  const targetRingMat = new THREE.MeshBasicMaterial({
    color: 0xf97316,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
  });
  const targetRing = new THREE.Mesh(new THREE.RingGeometry(0.36, 0.43, 32), targetRingMat);
  targetRing.rotation.x = -Math.PI / 2;
  targetRing.position.y = 0.012;
  ldrGroup.add(targetRing);

  tagRecursive(ldrGroup, "calloutId", "ldr");
  root.add(ldrGroup);

  // 10k divider resistor + 220R lamp resistor
  root.add(createAxialResistor(-0.32, 0.24, 0.92, [0x78350f, 0x111827, 0xf97316]));
  root.add(createAxialResistor(0.18, 0.24, 0.52, [0xdc2626, 0xdc2626, 0x78350f]));

  // Table Lamp at right (seated cleanly above the bottom-right Schematic inset)
  const lamp = createTableLampProp();
  lamp.group.position.set(2.25, 0, 0.18);
  root.add(lamp.group);

  // Curving Dupont jumper wires (red 3V3, amber GPIO34, blue GPIO26, black GND)
  root.add(createDupontWire([-0.92, 0.24, -0.89], [-1.35, 0.24, 0.28], 0xef4444, 0.85, [-0.1, -0.1]));
  root.add(createDupontWire([-0.46, 0.24, -0.89], [-0.58, 0.24, 0.72], 0xf59e0b, 1.05, [0.15, 0]));
  root.add(createDupontWire([0.16, 0.24, -0.89], [0.42, 0.24, 0.52], 0x3b82f6, 0.92, [0.22, -0.05]));
  root.add(createDupontWire([0.46, 0.24, 0.52], [1.75, 0.14, 0.18], 0x3b82f6, 0.62, [0.05, 0.08]));
  root.add(createDupontWire([0.78, 0.24, -0.89], [0.15, 0.24, 1.18], 0x1f2937, 0.78, [0.35, 0.1]));

  // Draggable 3D Black Cap
  const capGroup = createDraggableCap();
  capGroup.position.set(CAP_OPEN_POS.x, 0, CAP_OPEN_POS.z);
  root.add(capGroup);

  return {
    root,
    capGroup,
    update(state) {
      // Lift cap smoothly onto breadboard when near the LDR sensor
      const dist = Math.hypot(state.capPos.x - LDR_SENSOR_POS.x, state.capPos.z - LDR_SENSOR_POS.z);
      const lift = dist < 1.15 ? 0.24 : 0;
      const hover = state.isDraggingCap ? 0.12 : 0;
      capGroup.position.set(state.capPos.x, lift + hover, state.capPos.z);
      targetRingMat.color.setHex(state.lampOn ? 0x10b981 : 0xf97316);
      targetRingMat.opacity = state.lampOn ? 0.35 : 0.78;
      lamp.setLit(state.lampOn);
    },
    dispose: () => disposeObject3D(root),
  };
}

function buildMoodLampLesson(): JuniorLessonRig {
  const root = new THREE.Group();

  const esp = createEsp32Model();
  esp.position.set(0.15, 0, -1.45);
  root.add(esp);

  const bb = createBreadboardModel();
  bb.position.set(-0.95, 0, 0.72);
  root.add(bb);

  // 3× 220 Ω RGB Resistors
  root.add(createAxialResistor(-1.35, 0.24, 0.65, [0xdc2626, 0xdc2626, 0x78350f]));
  root.add(createAxialResistor(-0.8, 0.24, 0.65, [0xdc2626, 0xdc2626, 0x78350f]));
  root.add(createAxialResistor(-0.25, 0.24, 0.65, [0xdc2626, 0xdc2626, 0x78350f]));

  // Frosted Glass Orb Mood Lamp
  const orbGroup = new THREE.Group();
  orbGroup.position.set(2.3, 0, 0.72);

  const woodBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.72, 0.36, 28),
    new THREE.MeshStandardMaterial({ color: 0xc29362, roughness: 0.72 }),
  );
  woodBase.position.y = 0.18;
  woodBase.castShadow = true;
  addOutline(woodBase, 0x4b3621, 0.45);
  orbGroup.add(woodBase);

  // Copper touch ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.032, 10, 28),
    new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.78, roughness: 0.25 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.36;
  orbGroup.add(ring);

  // Inner bright RGB core + outer frosted glass sphere
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xff9f43,
    emissive: 0xff9f43,
    emissiveIntensity: 1.8,
    roughness: 0.2,
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 16), coreMat);
  core.position.y = 1.08;
  orbGroup.add(core);

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xfffaf2,
    emissive: 0xff9f43,
    emissiveIntensity: 0.65,
    roughness: 0.38,
    transparent: true,
    opacity: 0.84,
  });
  const glass = new THREE.Mesh(new THREE.SphereGeometry(0.84, 28, 22), glassMat);
  glass.position.y = 1.12;
  glass.castShadow = true;
  orbGroup.add(glass);

  const orbLight = new THREE.PointLight(0xff9f43, 5.5, 7.5, 1.5);
  orbLight.position.set(0, 1.15, 0);
  orbGroup.add(orbLight);

  const poolMat = new THREE.MeshBasicMaterial({
    map: createGlowPoolTexture("#ffffff"),
    color: 0xff9f43,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 3.8), poolMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.015;
  pool.raycast = () => {};
  orbGroup.add(pool);

  tagRecursive(orbGroup, "clickId", "mood-toggle");
  tagRecursive(orbGroup, "calloutId", "orb");
  root.add(orbGroup);

  // R, G, B Dupont wires
  root.add(createDupontWire([-0.6, 0.24, -0.89], [-1.35, 0.24, 0.42], 0xef4444, 0.88));
  root.add(createDupontWire([-0.28, 0.24, -0.89], [-0.8, 0.24, 0.42], 0x10b981, 0.96));
  root.add(createDupontWire([0.04, 0.24, -0.89], [-0.25, 0.24, 0.42], 0x3b82f6, 1.04));
  root.add(createDupontWire([0.2, 0.24, 0.72], [1.65, 0.16, 0.72], 0xf97316, 0.6));

  return {
    root,
    update(state) {
      const col = new THREE.Color(state.moodHex);
      const factor = state.moodOn ? 0.45 + state.moodIntensity * 0.55 : 0;
      coreMat.color.copy(col);
      coreMat.emissive.copy(col);
      coreMat.emissiveIntensity = state.moodOn ? 1.2 + factor * 1.4 : 0.05;
      glassMat.emissive.copy(col);
      glassMat.emissiveIntensity = state.moodOn ? 0.35 + factor * 0.65 : 0;
      orbLight.color.copy(col);
      orbLight.intensity = state.moodOn ? 3.2 + factor * 4.5 : 0;
      poolMat.color.copy(col);
      poolMat.opacity = state.moodOn ? 0.35 + factor * 0.45 : 0;
    },
    dispose: () => disposeObject3D(root),
  };
}

function buildFillRingLesson(): JuniorLessonRig {
  const root = new THREE.Group();

  const esp = createEsp32Model();
  esp.position.set(0.15, 0, -1.45);
  root.add(esp);

  const bb = createBreadboardModel();
  bb.position.set(-0.95, 0, 0.72);
  root.add(bb);

  // Rotary Potentiometer on breadboard
  const potGroup = new THREE.Group();
  potGroup.position.set(-0.95, 0.24, 0.72);

  const potBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.26, 0.62),
    new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.48 }),
  );
  potBox.position.y = 0.13;
  addOutline(potBox, 0x1e3a8a, 0.6);
  potGroup.add(potBox);

  const knobPivot = new THREE.Group();
  knobPivot.position.y = 0.26;
  const knobCyl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.26, 0.44, 20),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45 }),
  );
  knobCyl.position.y = 0.22;
  addOutline(knobCyl, 0x0f172a, 0.7);
  knobPivot.add(knobCyl);

  const pointer = new THREE.Mesh(
    new THREE.BoxGeometry(0.055, 0.04, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xf97316, emissiveIntensity: 0.4 }),
  );
  pointer.position.set(0, 0.45, -0.09);
  knobPivot.add(pointer);
  potGroup.add(knobPivot);

  tagRecursive(potGroup, "clickId", "pot-step");
  tagRecursive(potGroup, "calloutId", "pot");
  root.add(potGroup);

  // 12-LED WS2812B NeoPixel Ring on sleek tilted stand
  const ringHolder = new THREE.Group();
  ringHolder.position.set(2.3, 0, 0.72);

  const stand = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.18, 0.72),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 }),
  );
  stand.position.y = 0.09;
  addOutline(stand, 0x0f172a, 0.55);
  ringHolder.add(stand);

  const ringDiscGroup = new THREE.Group();
  ringDiscGroup.position.set(0, 1.05, 0);
  ringDiscGroup.rotation.x = -0.35;

  const ringPcb = new THREE.Mesh(
    new THREE.TorusGeometry(0.86, 0.15, 12, 36),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 }),
  );
  ringPcb.scale.set(1, 1, 0.35);
  addOutline(ringPcb, 0x3f3f46, 0.5);
  ringDiscGroup.add(ringPcb);

  const ledMaterials: THREE.MeshStandardMaterial[] = [];
  for (let i = 0; i < 12; i++) {
    // Clockwise starting from top (12 o'clock)
    const angle = Math.PI / 2 - (i / 12) * Math.PI * 2;
    const lx = Math.cos(angle) * 0.86;
    const ly = Math.sin(angle) * 0.86;

    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.18, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 }),
    );
    housing.position.set(lx, ly, 0.05);
    ringDiscGroup.add(housing);

    const mat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      emissive: 0x000000,
      emissiveIntensity: 0,
      roughness: 0.25,
    });
    ledMaterials.push(mat);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.04, 14), mat);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(lx, ly, 0.09);
    ringDiscGroup.add(lens);
  }
  ringHolder.add(ringDiscGroup);

  const ringLight = new THREE.PointLight(0x22d3ee, 0, 5.5, 1.5);
  ringLight.position.set(0, 1.05, 0.5);
  ringHolder.add(ringLight);

  tagRecursive(ringHolder, "calloutId", "ring");
  root.add(ringHolder);

  // Dupont wires routed neatly behind the NeoPixel stand so all 12 LEDs stay unobstructed
  root.add(createDupontWire([-0.7, 0.24, -0.89], [-0.95, 0.24, 0.34], 0xf59e0b, 0.88));
  root.add(createDupontWire([0.32, 0.24, -0.89], [1.92, 0.14, 0.28], 0x10b981, 0.62, [0.1, -0.25]));
  root.add(createDupontWire([0.82, 0.24, -0.89], [2.25, 0.14, 0.22], 0xef4444, 0.55, [0.2, -0.3]));

  return {
    root,
    update(state) {
      // Rotate potentiometer knob smoothly from +135° to -135°
      knobPivot.rotation.y = (0.5 - state.potValue01) * Math.PI * 1.5;

      let activeCount = 0;
      let lastHex = "#22d3ee";
      ledMaterials.forEach((mat, i) => {
        const hex = state.ringColors[i];
        if (hex) {
          activeCount += 1;
          lastHex = hex;
          mat.color.set(hex);
          mat.emissive.set(hex);
          mat.emissiveIntensity = 1.9;
        } else {
          mat.color.setHex(0x475569);
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
        }
      });
      ringLight.color.set(lastHex);
      ringLight.intensity = activeCount > 0 ? 1.5 + (activeCount / 12) * 3.5 : 0;
    },
    dispose: () => disposeObject3D(root),
  };
}

function buildMiniPianoLesson(): JuniorLessonRig {
  const root = new THREE.Group();

  const esp = createEsp32Model();
  esp.position.set(0.15, 0, -1.45);
  root.add(esp);

  const bb = createBreadboardModel();
  bb.position.set(-0.95, 0, 0.72);
  root.add(bb);

  // 4 Chunky Colored 3D Tactile Piano Keys
  const keyCaps: { cap: THREE.Mesh; mat: THREE.MeshStandardMaterial; baseColor: string }[] = [];
  PIANO_NOTES.forEach((note, idx) => {
    const keyGroup = new THREE.Group();
    const kx = -1.9 + idx * 0.63;
    keyGroup.position.set(kx, 0.24, 0.85);

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.12, 0.62),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 }),
    );
    base.position.y = 0.06;
    addOutline(base, 0x0f172a, 0.55);
    keyGroup.add(base);

    const capMat = new THREE.MeshStandardMaterial({
      color: note.color,
      emissive: note.color,
      emissiveIntensity: 0.08,
      roughness: 0.35,
    });
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.52), capMat);
    cap.position.y = 0.21;
    cap.castShadow = true;
    addOutline(cap, 0x0f172a, 0.65);
    keyGroup.add(cap);

    tagRecursive(keyGroup, "clickId", `piano-${idx}`);
    tagRecursive(keyGroup, "calloutId", "keys");
    root.add(keyGroup);
    keyCaps.push({ cap, mat: capMat, baseColor: note.color });

    // Colored Dupont wire from ESP32 to each key
    root.add(
      createDupontWire(
        [-0.75 + idx * 0.34, 0.24, -0.89],
        [kx, 0.24, 0.36],
        new THREE.Color(note.color).getHex(),
        0.78 + idx * 0.08,
      ),
    );
  });

  // 3D Piezo Buzzer + Soundwave Rings on right
  const buzzerGroup = new THREE.Group();
  buzzerGroup.position.set(2.25, 0, 0.72);

  const housing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.66, 0.42, 28),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45 }),
  );
  housing.position.y = 0.21;
  housing.castShadow = true;
  addOutline(housing, 0x09090b, 0.65);
  buzzerGroup.add(housing);

  const hole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.04, 16),
    new THREE.MeshStandardMaterial({ color: 0xd4a24c, metalness: 0.78, roughness: 0.28 }),
  );
  hole.position.y = 0.42;
  buzzerGroup.add(hole);

  const waveRing1Mat = new THREE.MeshBasicMaterial({
    color: 0x0ea5e9,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
  });
  const waveRing1 = new THREE.Mesh(new THREE.RingGeometry(0.65, 0.76, 32), waveRing1Mat);
  waveRing1.rotation.x = -Math.PI / 2;
  waveRing1.position.y = 0.56;
  buzzerGroup.add(waveRing1);

  const waveRing2Mat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
  });
  const waveRing2 = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.04, 32), waveRing2Mat);
  waveRing2.rotation.x = -Math.PI / 2;
  waveRing2.position.y = 0.72;
  buzzerGroup.add(waveRing2);

  tagRecursive(buzzerGroup, "calloutId", "buzzer");
  root.add(buzzerGroup);

  root.add(createDupontWire([0.65, 0.24, -0.89], [1.72, 0.16, 0.68], 0x8b5cf6, 0.9));

  return {
    root,
    update(state) {
      keyCaps.forEach((k, idx) => {
        const pressed = state.activePianoKey === idx;
        k.cap.position.y = pressed ? 0.13 : 0.21;
        k.mat.emissiveIntensity = pressed ? 0.9 : 0.06;
      });
      const activeNote = state.activePianoKey !== null ? PIANO_NOTES[state.activePianoKey] : null;
      const p = state.soundPulse;
      if (p > 0.02) {
        const hex = activeNote ? activeNote.color : "#0ea5e9";
        waveRing1Mat.color.set(hex);
        waveRing2Mat.color.set(hex);
        waveRing1Mat.opacity = p * 0.85;
        waveRing2Mat.opacity = p * 0.5;
        const s1 = 0.85 + (1 - p) * 0.55;
        const s2 = 0.9 + (1 - p) * 0.75;
        waveRing1.scale.set(s1, s1, 1);
        waveRing2.scale.set(s2, s2, 1);
      } else {
        waveRing1Mat.opacity = 0;
        waveRing2Mat.opacity = 0;
      }
    },
    dispose: () => disposeObject3D(root),
  };
}

function buildSirenLesson(): JuniorLessonRig {
  const root = new THREE.Group();

  const esp = createEsp32Model();
  esp.position.set(0.15, 0, -1.45);
  root.add(esp);

  const bb = createBreadboardModel();
  bb.position.set(-0.95, 0, 0.72);
  root.add(bb);

  // Tactile Arming Toggle Switch on breadboard
  const swGroup = new THREE.Group();
  swGroup.position.set(-0.95, 0.24, 0.72);
  const swBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.24, 0.44),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 }),
  );
  swBody.position.y = 0.12;
  addOutline(swBody, 0x0f172a, 0.6);
  swGroup.add(swBody);

  const leverPivot = new THREE.Group();
  leverPivot.position.y = 0.24;
  const lever = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.045, 0.42, 12),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.75, roughness: 0.22 }),
  );
  lever.position.y = 0.21;
  leverPivot.add(lever);
  const tip = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 }),
  );
  tip.position.y = 0.42;
  leverPivot.add(tip);
  swGroup.add(leverPivot);

  tagRecursive(swGroup, "clickId", "siren-toggle");
  tagRecursive(swGroup, "calloutId", "switch");
  root.add(swGroup);

  // Dual Red & Blue Emergency Beacons + Siren Speaker
  const makeBeacon = (x: number, z: number, colorHex: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.42, 0.22, 20),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }),
    );
    pedestal.position.y = 0.11;
    addOutline(pedestal, 0x09090b, 0.6);
    g.add(pedestal);

    const domeMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.08,
      roughness: 0.22,
      transparent: true,
      opacity: 0.92,
    });
    const dome = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.36, 10, 20), domeMat);
    dome.position.y = 0.56;
    dome.castShadow = true;
    g.add(dome);

    const light = new THREE.PointLight(colorHex, 0, 5.5, 1.5);
    light.position.set(0, 0.72, 0);
    g.add(light);

    tagRecursive(g, "calloutId", "beacons");
    return { g, domeMat, light };
  };

  const redBeacon = makeBeacon(1.85, 0.32, 0xef4444);
  const blueBeacon = makeBeacon(2.75, 1.05, 0x3b82f6);
  root.add(redBeacon.g, blueBeacon.g);

  // Piezo siren cylinder between them
  const sirenPod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.4, 0.28, 20),
    new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.5 }),
  );
  sirenPod.position.set(1.85, 0.14, 1.18);
  addOutline(sirenPod, 0x09090b, 0.6);
  root.add(sirenPod);

  root.add(createDupontWire([-0.5, 0.24, -0.89], [-0.95, 0.24, 0.42], 0x10b981, 0.85));
  root.add(createDupontWire([0.2, 0.24, -0.89], [1.65, 0.16, 0.32], 0xef4444, 0.92));
  root.add(createDupontWire([0.55, 0.24, -0.89], [2.45, 0.16, 1.05], 0x3b82f6, 1.02));
  root.add(createDupontWire([0.85, 0.24, -0.89], [1.62, 0.16, 1.18], 0xf59e0b, 0.78));

  return {
    root,
    update(state) {
      leverPivot.rotation.z = state.sirenArmed ? -0.45 : 0.45;
      redBeacon.domeMat.emissiveIntensity = state.sirenRedOn ? 2.4 : 0.08;
      redBeacon.light.intensity = state.sirenRedOn ? 5.5 : 0;
      blueBeacon.domeMat.emissiveIntensity = state.sirenBlueOn ? 2.4 : 0.08;
      blueBeacon.light.intensity = state.sirenBlueOn ? 5.5 : 0;
    },
    dispose: () => disposeObject3D(root),
  };
}

function drawPhoneScreen(
  ctx: CanvasRenderingContext2D,
  lampOn: boolean,
  host: string,
): void {
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, 256, 420);

  // Status bar
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(0, 0, 256, 46);
  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 18px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`http://${host}`, 128, 30);

  // Title
  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText("ESP32 LAMP", 128, 108);

  // Status text
  ctx.fillStyle = lampOn ? "#fbbf24" : "#94a3b8";
  ctx.font = "bold 20px monospace";
  ctx.fillText(lampOn ? "STATUS: ON" : "STATUS: OFF", 128, 146);

  // Big clickable /toggle button
  ctx.fillStyle = lampOn ? "#f97316" : "#0ea5e9";
  ctx.beginPath();
  ctx.roundRect(32, 194, 192, 92, 18);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px sans-serif";
  ctx.fillText(lampOn ? "TURN OFF" : "TURN ON", 128, 248);

  ctx.fillStyle = "#64748b";
  ctx.font = "15px monospace";
  ctx.fillText("GET /toggle -> 200 OK", 128, 344);
  ctx.fillText("TAP SCREEN!", 128, 378);
}

function buildWifiSwitchLesson(): JuniorLessonRig {
  const root = new THREE.Group();

  const esp = createEsp32Model();
  esp.position.set(0.05, 0, -1.35);
  root.add(esp);

  // 3D Miniature Smartphone angled toward viewer on left
  const phoneGroup = new THREE.Group();
  phoneGroup.position.set(-1.95, 0.56, 0.85);
  phoneGroup.rotation.set(-0.55, 0.42, 0.14);

  const chassis = new THREE.Mesh(
    new THREE.BoxGeometry(1.18, 1.92, 0.13),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.38, metalness: 0.35 }),
  );
  chassis.castShadow = true;
  addOutline(chassis, 0x09090b, 0.65);
  phoneGroup.add(chassis);

  const screenCanvas = document.createElement("canvas");
  screenCanvas.width = 256;
  screenCanvas.height = 420;
  const screenCtx = screenCanvas.getContext("2d")!;
  drawPhoneScreen(screenCtx, false, "192.168.4.1");
  const screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;

  const screenMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.04, 1.72),
    new THREE.MeshBasicMaterial({ map: screenTex }),
  );
  screenMesh.position.z = 0.072;
  phoneGroup.add(screenMesh);

  tagRecursive(phoneGroup, "clickId", "wifi-toggle");
  tagRecursive(phoneGroup, "calloutId", "phone");
  root.add(phoneGroup);

  // 3D Cyan Wi-Fi Radio Arcs between phone and ESP32 antenna
  const wifiArcs: THREE.MeshBasicMaterial[] = [];
  for (let i = 0; i < 3; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    wifiArcs.push(mat);
    const arc = new THREE.Mesh(
      new THREE.RingGeometry(0.28 + i * 0.26, 0.34 + i * 0.26, 24, 1, -Math.PI * 0.35, Math.PI * 0.7),
      mat,
    );
    arc.position.set(-0.78 + i * 0.24, 0.95 + i * 0.08, -0.35 - i * 0.18);
    arc.rotation.y = Math.PI * 0.22;
    root.add(arc);
  }

  // Smart Table Lamp controlled over Wi-Fi
  const lamp = createTableLampProp();
  lamp.group.position.set(2.2, 0, 0.18);
  tagRecursive(lamp.group, "calloutId", "bulb");
  root.add(lamp.group);

  root.add(createDupontWire([0.35, 0.24, -0.78], [1.72, 0.14, 0.18], 0xf59e0b, 0.78));
  root.add(createDupontWire([0.75, 0.24, -0.78], [1.72, 0.14, 0.42], 0x1f2937, 0.68));

  let lastLamp: boolean | null = null;
  let lastHost = "";

  return {
    root,
    update(state) {
      lamp.setLit(state.wifiLampOn);
      if (lastLamp !== state.wifiLampOn || lastHost !== state.wifiHost) {
        lastLamp = state.wifiLampOn;
        lastHost = state.wifiHost;
        drawPhoneScreen(screenCtx, state.wifiLampOn, state.wifiHost);
        screenTex.needsUpdate = true;
      }
      wifiArcs.forEach((mat, i) => {
        const wave = state.wifiPulse > 0.05 ? 0.35 + state.wifiPulse * (0.65 - i * 0.12) : 0.22;
        mat.opacity = wave;
      });
    },
    dispose: () => disposeObject3D(root),
  };
}

function buildRobotGateLesson(): JuniorLessonRig {
  const root = new THREE.Group();

  const esp = createEsp32Model();
  esp.position.set(0.15, 0, -1.55);
  root.add(esp);

  const bb = createBreadboardModel();
  bb.position.set(-1.05, 0, 0.32);
  root.add(bb);

  // HC-SR04 Ultrasonic Sonar Module mounted vertically at front of breadboard
  const sonarGroup = new THREE.Group();
  sonarGroup.position.set(-0.62, 0.24, 0.86);

  const sonarPcb = new THREE.Mesh(
    new THREE.BoxGeometry(1.12, 0.56, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.45 }),
  );
  sonarPcb.position.y = 0.34;
  sonarPcb.castShadow = true;
  addOutline(sonarPcb, 0x1e3a8a, 0.65);
  sonarGroup.add(sonarPcb);

  const canMat = new THREE.MeshStandardMaterial({
    color: 0xdbe2ea,
    metalness: 0.78,
    roughness: 0.24,
  });
  const meshMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.55,
    roughness: 0.45,
  });
  for (const xOff of [-0.31, 0.31]) {
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.26, 20), canMat);
    can.rotation.x = Math.PI / 2;
    can.position.set(xOff, 0.34, 0.14);
    can.castShadow = true;
    addOutline(can, 0x334155, 0.5);
    sonarGroup.add(can);

    const grille = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.03, 16), meshMat);
    grille.rotation.x = Math.PI / 2;
    grille.position.set(xOff, 0.34, 0.27);
    sonarGroup.add(grille);
  }

  // Translucent cyan sonar ping arcs radiating toward rover
  const sonarArcs: THREE.MeshBasicMaterial[] = [];
  for (let i = 0; i < 2; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    sonarArcs.push(mat);
    const arc = new THREE.Mesh(
      new THREE.RingGeometry(0.28 + i * 0.26, 0.33 + i * 0.26, 24, 1, -Math.PI * 0.35, Math.PI * 0.7),
      mat,
    );
    arc.rotation.x = -Math.PI / 2;
    arc.rotation.z = -Math.PI / 2;
    arc.position.set(0, 0.34, 0.36 + i * 0.22);
    sonarGroup.add(arc);
  }

  tagRecursive(sonarGroup, "calloutId", "sonar");
  root.add(sonarGroup);

  // SG90 Blue Micro Servo + Red/White Striped Barrier Gate on right side
  const gateGroup = new THREE.Group();
  gateGroup.position.set(1.65, 0, 0.58);

  const gatePedestal = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 0.44, 0.62),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.55 }),
  );
  gatePedestal.position.y = 0.22;
  gatePedestal.castShadow = true;
  addOutline(gatePedestal, 0x0f172a, 0.6);
  gateGroup.add(gatePedestal);

  const servoBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.52, 0.28),
    new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.38 }),
  );
  servoBody.position.set(0, 0.68, 0);
  servoBody.castShadow = true;
  addOutline(servoBody, 0x1e3a8a, 0.65);
  gateGroup.add(servoBody);

  // Servo status LED on pedestal
  const gateLedMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xef4444,
    emissiveIntensity: 1.2,
  });
  const gateLed = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), gateLedMat);
  gateLed.position.set(0, 0.48, 0.32);
  gateGroup.add(gateLed);

  // Rotating Servo Horn & Striped Barrier Boom
  const gatePivot = new THREE.Group();
  gatePivot.position.set(0, 0.86, 0.18);

  const horn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 0.08, 16),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 }),
  );
  horn.rotation.x = Math.PI / 2;
  gatePivot.add(horn);

  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
  for (let seg = 0; seg < 5; seg++) {
    const segMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.11, 0.06),
      seg % 2 === 0 ? redMat : whiteMat,
    );
    segMesh.position.set(-0.2 - seg * 0.32, 0, 0.03);
    segMesh.castShadow = true;
    addOutline(segMesh, 0x1e293b, 0.45);
    gatePivot.add(segMesh);
  }
  gateGroup.add(gatePivot);

  tagRecursive(gateGroup, "calloutId", "servo");
  root.add(gateGroup);

  // Road lane marker strip under gate & rover
  const laneMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 2.9),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.88 }),
  );
  laneMesh.rotation.x = -Math.PI / 2;
  laneMesh.position.set(0.65, 0.008, 1.38);
  root.add(laneMesh);

  // Clickable 3D Mini Toy Rover Car approaching along +Z
  const roverGroup = new THREE.Group();
  roverGroup.position.set(0.65, 0, 2.05);

  const chassis = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 0.24, 1.06),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.42 }),
  );
  chassis.position.y = 0.22;
  chassis.castShadow = true;
  addOutline(chassis, 0x78350f, 0.6);
  roverGroup.add(chassis);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.24, 0.56),
    new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.35 }),
  );
  cabin.position.set(0, 0.44, 0.06);
  cabin.castShadow = true;
  addOutline(cabin, 0x78350f, 0.5);
  roverGroup.add(cabin);

  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
  for (const [wx, wz] of [
    [-0.4, -0.32],
    [0.4, -0.32],
    [-0.4, 0.32],
    [0.4, 0.32],
  ]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 16), wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.14, wz);
    addOutline(wheel, 0x09090b, 0.55);
    roverGroup.add(wheel);
  }

  // Twin warm headlights facing the barrier (-Z)
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfacc15,
    emissiveIntensity: 1.4,
  });
  for (const hx of [-0.22, 0.22]) {
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), headlightMat);
    hl.position.set(hx, 0.24, -0.53);
    roverGroup.add(hl);
  }

  tagRecursive(roverGroup, "clickId", "rover-step");
  tagRecursive(roverGroup, "calloutId", "rover");
  root.add(roverGroup);

  // Curving Dupont wires connecting ESP32 to HC-SR04 & SG90 Servo
  root.add(createDupontWire([-0.68, 0.24, -0.98], [-0.82, 0.24, 0.72], 0x06b6d4, 0.9));
  root.add(createDupontWire([-0.34, 0.24, -0.98], [-0.42, 0.24, 0.72], 0x8b5cf6, 0.98));
  root.add(createDupontWire([0.52, 0.24, -0.98], [1.45, 0.32, 0.42], 0xf97316, 0.95));
  root.add(createDupontWire([0.85, 0.24, -0.98], [1.58, 0.28, 0.34], 0xef4444, 0.78));

  return {
    root,
    update(state) {
      // Map roverDistanceCm (5..80 cm) to Z position (1.15 near gate -> 2.65 far)
      const norm = THREE.MathUtils.clamp((state.roverDistanceCm - 5) / 75, 0, 1);
      roverGroup.position.z = 1.15 + norm * 1.5;

      // Lift servo arm smoothly (negative Z swings left-pointing arm UP)
      gatePivot.rotation.z = -THREE.MathUtils.degToRad(state.gateAngleDeg);

      const ledHex = state.gateOpen ? 0x10b981 : 0xef4444;
      gateLedMat.color.setHex(ledHex);
      gateLedMat.emissive.setHex(ledHex);

      sonarArcs.forEach((mat, i) => {
        mat.opacity = state.gateOpen ? 0.78 - i * 0.22 : 0.2;
        mat.color.setHex(state.gateOpen ? 0x10b981 : 0x06b6d4);
      });
    },
    dispose: () => disposeObject3D(root),
  };
}

function buildSmartFanLesson(): JuniorLessonRig {
  const root = new THREE.Group();

  const esp = createEsp32Model();
  esp.position.set(0.1, 0, -1.55);
  root.add(esp);

  const bb = createBreadboardModel();
  bb.position.set(-1.15, 0, 0.58);
  root.add(bb);

  // White Slatted DHT22 Climate Sensor on breadboard
  const dhtGroup = new THREE.Group();
  dhtGroup.position.set(-1.05, 0.24, 0.58);

  const dhtBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.76, 0.32),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 }),
  );
  dhtBody.position.y = 0.44;
  dhtBody.castShadow = true;
  addOutline(dhtBody, 0x475569, 0.55);
  dhtGroup.add(dhtBody);

  const slatMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.6 });
  for (let row = 0; row < 4; row++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.055, 0.04), slatMat);
    slat.position.set(0, 0.28 + row * 0.11, 0.16);
    dhtGroup.add(slat);
  }
  tagRecursive(dhtGroup, "calloutId", "dht22");
  root.add(dhtGroup);

  // Cute Terracotta Potted Greenhouse Plant in center-front
  const plantGroup = new THREE.Group();
  plantGroup.position.set(0.58, 0, 1.05);

  const potMat = new THREE.MeshStandardMaterial({ color: 0xc26946, roughness: 0.72 });
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.32, 0.58, 22), potMat);
  pot.position.y = 0.29;
  pot.castShadow = true;
  addOutline(pot, 0x5c2c16, 0.5);
  plantGroup.add(pot);

  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.39, 0.39, 0.06, 20),
    new THREE.MeshStandardMaterial({ color: 0x452c1e, roughness: 0.95 }),
  );
  soil.position.y = 0.56;
  plantGroup.add(soil);

  const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.55 });
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.06, 0.56, 10),
    new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 }),
  );
  stem.position.y = 0.82;
  plantGroup.add(stem);

  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), leafMat);
    leaf.scale.set(1.25, 0.32, 0.72);
    leaf.position.set(Math.cos(ang) * 0.26, 0.92 + (i % 2) * 0.16, Math.sin(ang) * 0.26);
    leaf.rotation.y = -ang;
    leaf.rotation.z = 0.28;
    leaf.castShadow = true;
    addOutline(leaf, 0x14532d, 0.45);
    plantGroup.add(leaf);
  }
  tagRecursive(plantGroup, "calloutId", "plant");
  root.add(plantGroup);

  // 3D PWM Cooling Fan on Right angled toward the Potted Plant
  const fanGroup = new THREE.Group();
  fanGroup.position.set(2.25, 0, 0.58);
  fanGroup.rotation.y = -0.58;

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.6, 0.18, 24),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }),
  );
  base.position.y = 0.09;
  base.castShadow = true;
  addOutline(base, 0x09090b, 0.6);
  fanGroup.add(base);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.14, 0.85, 14),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45 }),
  );
  neck.position.y = 0.58;
  fanGroup.add(neck);

  // Circular Fan Shroud + Comfort LED Ring
  const shroud = new THREE.Mesh(
    new THREE.TorusGeometry(0.74, 0.08, 12, 32),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42 }),
  );
  shroud.position.set(0, 1.18, 0);
  shroud.castShadow = true;
  fanGroup.add(shroud);

  const statusRingMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x10b981,
    emissiveIntensity: 0.85,
    roughness: 0.3,
  });
  const statusRing = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.032, 8, 32), statusRingMat);
  statusRing.position.set(0, 1.18, 0.07);
  fanGroup.add(statusRing);

  // 4-Blade Rotating Fan Rotor
  const rotorPivot = new THREE.Group();
  rotorPivot.position.set(0, 1.18, 0.02);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.16, 18),
    new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.35 }),
  );
  hub.rotation.x = Math.PI / 2;
  addOutline(hub, 0x0369a1, 0.6);
  rotorPivot.add(hub);

  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.35 });
  for (let b = 0; b < 4; b++) {
    const bladeHolder = new THREE.Group();
    bladeHolder.rotation.z = (b * Math.PI) / 2;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.52, 0.03), bladeMat);
    blade.position.y = 0.36;
    blade.rotation.y = 0.32;
    blade.castShadow = true;
    addOutline(blade, 0x0369a1, 0.45);
    bladeHolder.add(blade);
    rotorPivot.add(bladeHolder);
  }
  fanGroup.add(rotorPivot);

  tagRecursive(fanGroup, "clickId", "fan-boost");
  tagRecursive(fanGroup, "calloutId", "fan");
  root.add(fanGroup);

  // Dupont wires to DHT22 & PWM Fan
  root.add(createDupontWire([-0.62, 0.24, -0.98], [-1.05, 0.24, 0.22], 0x10b981, 0.9));
  root.add(createDupontWire([0.42, 0.24, -0.98], [1.92, 0.14, 0.32], 0x0ea5e9, 0.88));
  root.add(createDupontWire([0.85, 0.24, -0.98], [2.15, 0.14, 0.22], 0xef4444, 0.72));

  return {
    root,
    update(state) {
      rotorPivot.rotation.z = state.fanSpinAngle;
      if (state.fanMode === "turbo") {
        statusRingMat.color.setHex(0xf97316);
        statusRingMat.emissive.setHex(0xf97316);
        statusRingMat.emissiveIntensity = 1.9;
        bladeMat.color.setHex(0xfb923c);
      } else if (state.fanMode === "eco") {
        statusRingMat.color.setHex(0x06b6d4);
        statusRingMat.emissive.setHex(0x06b6d4);
        statusRingMat.emissiveIntensity = 1.3;
        bladeMat.color.setHex(0x38bdf8);
      } else {
        statusRingMat.color.setHex(0x10b981);
        statusRingMat.emissive.setHex(0x10b981);
        statusRingMat.emissiveIntensity = 0.55;
        bladeMat.color.setHex(0x94a3b8);
      }
      // Subtle leaf tint warmth when greenhouse gets hot
      leafMat.color.setHex(state.roomTempC >= 33 ? 0x84cc16 : 0x22c55e);
    },
    dispose: () => disposeObject3D(root),
  };
}

export function buildJuniorLessonRig(lessonId: JuniorLessonId): JuniorLessonRig {
  switch (lessonId) {
    case "table-lamp":
      return buildTableLampLesson();
    case "mood-lamp":
      return buildMoodLampLesson();
    case "fill-ring":
      return buildFillRingLesson();
    case "mini-piano":
      return buildMiniPianoLesson();
    case "siren":
      return buildSirenLesson();
    case "wifi-switch":
      return buildWifiSwitchLesson();
    case "robot-gate":
      return buildRobotGateLesson();
    case "smart-fan":
      return buildSmartFanLesson();
  }
}
