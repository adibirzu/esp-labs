import * as THREE from "three";

export interface DynamicDisplayHandle {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
}

export interface Esp32RigHandles {
  group: THREE.Group;
  rgbMesh: THREE.Mesh;
  rgbLight: THREE.PointLight;
  bootCap: THREE.Mesh;
  rstCap: THREE.Mesh;
  setRgbColor: (hex: string, on: boolean) => void;
}

export interface FlipperRigHandles {
  group: THREE.Group;
  screen: DynamicDisplayHandle;
  okCap: THREE.Mesh;
  backCap: THREE.Mesh;
  drawScreen: (mode: string, statusLine: string, subLine: string) => void;
}

export interface OledRigHandles {
  group: THREE.Group;
  screen: DynamicDisplayHandle;
  drawOled: (title: string, line1: string, line2: string, accentHex?: string) => void;
}

export interface RfidRigHandles {
  group: THREE.Group;
  cardGroup: THREE.Group;
  ledMesh: THREE.Mesh;
}

export interface AudioRigHandles {
  group: THREE.Group;
  coneMesh: THREE.Mesh;
}

function makeRoundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  s.moveTo(-hw + r, -hh);
  s.lineTo(hw - r, -hh);
  s.quadraticCurveTo(hw, -hh, hw, -hh + r);
  s.lineTo(hw, hh - r);
  s.quadraticCurveTo(hw, hh, hw - r, hh);
  s.lineTo(-hw + r, hh);
  s.quadraticCurveTo(-hw, hh, -hw, hh - r);
  s.lineTo(-hw, -hh + r);
  s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  return s;
}

function createContactShadow(w: number, d: number): THREE.Mesh {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
    grad.addColorStop(0, "rgba(2, 6, 23, 0.55)");
    grad.addColorStop(0.65, "rgba(2, 6, 23, 0.22)");
    grad.addColorStop(1, "rgba(2, 6, 23, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.PlaneGeometry(w * 1.18, d * 1.18);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.012;
  return mesh;
}

function tagInteractive(obj: THREE.Object3D, boardId: string, action?: string) {
  obj.userData.boardId = boardId;
  if (action) obj.userData.action = action;
  obj.traverse((child) => {
    child.userData.boardId = boardId;
    if (action && !child.userData.action) {
      child.userData.action = action;
    }
  });
}

export function createEsdWorkbenchMat(maxAnisotropy: number): THREE.Mesh {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#111b2b";
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle micro-grain
    ctx.fillStyle = "rgba(255,255,255,0.018)";
    for (let i = 0; i < 2400; i++) {
      const x = (i * 97) % 1024;
      const y = (i * 223) % 1024;
      ctx.fillRect(x, y, 2, 2);
    }

    // 10mm minor grid
    ctx.strokeStyle = "rgba(56, 189, 248, 0.11)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 1024; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 1024);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(1024, i);
      ctx.stroke();
    }

    // 50mm major grid
    ctx.strokeStyle = "rgba(56, 189, 248, 0.24)";
    ctx.lineWidth = 2;
    for (let i = 0; i <= 1024; i += 160) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 1024);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(1024, i);
      ctx.stroke();
    }

    // Technical ESD mat corner legend
    ctx.fillStyle = "rgba(148, 163, 184, 0.45)";
    ctx.font = "bold 20px monospace";
    ctx.fillText("ESP-LABS ESD-SAFE WORKBENCH MAT  ·  10mm METRIC GRID", 36, 988);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.5, 1.1);
  tex.anisotropy = maxAnisotropy;

  const geo = new THREE.BoxGeometry(38, 0.24, 26);
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    color: 0xffffff,
    roughness: 0.78,
    metalness: 0.06,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = -0.12;
  mesh.receiveShadow = true;
  mesh.name = "esd-mat";
  return mesh;
}

/**
 * 1. Realistic ESP32-S3-DevKitC-1 (62.74 x 25.40 mm -> 6.27 x 2.54 units)
 */
export function createEsp32S3Board(maxAnisotropy: number): Esp32RigHandles {
  const group = new THREE.Group();
  group.name = "esp32-s3";
  group.add(createContactShadow(2.7, 6.4));

  // PCB Silkscreen texture
  const pcbCanvas = document.createElement("canvas");
  pcbCanvas.width = 512;
  pcbCanvas.height = 1024;
  const pctx = pcbCanvas.getContext("2d");
  if (pctx) {
    pctx.fillStyle = "#12161f";
    pctx.fillRect(0, 0, 512, 1024);
    // Copper trace lines under dark solder mask
    pctx.strokeStyle = "#1e293b";
    pctx.lineWidth = 3;
    for (let i = 0; i < 18; i++) {
      pctx.beginPath();
      pctx.moveTo(64, 180 + i * 40);
      pctx.lineTo(140, 180 + i * 40);
      pctx.lineTo(170, 210 + i * 34);
      pctx.stroke();
      pctx.beginPath();
      pctx.moveTo(448, 180 + i * 40);
      pctx.lineTo(372, 180 + i * 40);
      pctx.lineTo(342, 210 + i * 34);
      pctx.stroke();
    }
    // Silkscreen labels
    pctx.fillStyle = "#e2e8f0";
    pctx.font = "bold 22px monospace";
    pctx.textAlign = "center";
    pctx.fillText("ESP32-S3-DevKitC-1", 256, 515);
    pctx.font = "bold 17px monospace";
    pctx.fillStyle = "#94a3b8";
    pctx.fillText("RGB 48", 165, 595);
    pctx.fillText("3.3V LDO", 335, 595);
    pctx.fillText("RST", 170, 745);
    pctx.fillText("BOOT", 342, 745);
    pctx.fillText("UART", 176, 940);
    pctx.fillText("USB", 336, 940);

    // Pin silkscreen markings left & right
    pctx.font = "bold 13px monospace";
    pctx.fillStyle = "#cbd5e1";
    const leftPins = ["3V3", "3V3", "RST", "G4", "G5", "G6", "G7", "G15", "G16", "G17", "G18", "G8", "G3", "G46", "G9", "G10", "G11", "G12", "G13", "G14", "5V", "GND"];
    const rightPins = ["GND", "TX", "RX", "G1", "G2", "G42", "G41", "G40", "G39", "G38", "G37", "G36", "G35", "G0", "G45", "G48", "G47", "G21", "G20", "G19", "GND", "GND"];
    leftPins.forEach((lbl, idx) => {
      pctx.textAlign = "left";
      pctx.fillText(lbl, 44, 152 + idx * 38.5);
      pctx.textAlign = "right";
      pctx.fillText(rightPins[idx], 468, 152 + idx * 38.5);
    });
  }
  const pcbTex = new THREE.CanvasTexture(pcbCanvas);
  pcbTex.colorSpace = THREE.SRGBColorSpace;
  pcbTex.anisotropy = maxAnisotropy;

  // Main FR-4 PCB body
  const pcbMat = new THREE.MeshStandardMaterial({
    map: pcbTex,
    color: 0xffffff,
    roughness: 0.45,
    metalness: 0.12,
  });
  const pcbSideMat = new THREE.MeshStandardMaterial({
    color: 0x161b24,
    roughness: 0.65,
    metalness: 0.08,
  });
  const pcbMesh = new THREE.Mesh(
    new THREE.BoxGeometry(2.54, 0.16, 6.27),
    [pcbSideMat, pcbSideMat, pcbMat, pcbSideMat, pcbSideMat, pcbSideMat],
  );
  pcbMesh.position.y = 0.24;
  pcbMesh.castShadow = true;
  pcbMesh.receiveShadow = true;
  group.add(pcbMesh);

  // PCB Meander Antenna Sub-board at top edge (-Z)
  const antCanvas = document.createElement("canvas");
  antCanvas.width = 256;
  antCanvas.height = 128;
  const actx = antCanvas.getContext("2d");
  if (actx) {
    actx.fillStyle = "#171c26";
    actx.fillRect(0, 0, 256, 128);
    actx.strokeStyle = "#d4a849";
    actx.lineWidth = 10;
    actx.beginPath();
    actx.moveTo(28, 112);
    actx.lineTo(28, 28);
    actx.lineTo(74, 28);
    actx.lineTo(74, 88);
    actx.lineTo(124, 88);
    actx.lineTo(124, 28);
    actx.lineTo(176, 28);
    actx.lineTo(176, 88);
    actx.lineTo(226, 88);
    actx.lineTo(226, 24);
    actx.stroke();
  }
  const antTex = new THREE.CanvasTexture(antCanvas);
  antTex.colorSpace = THREE.SRGBColorSpace;
  antTex.anisotropy = maxAnisotropy;
  const antMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.78, 0.1, 0.68),
    new THREE.MeshStandardMaterial({ map: antTex, color: 0xffffff, roughness: 0.48, metalness: 0.35 }),
  );
  antMesh.position.set(0, 0.36, -2.74);
  antMesh.castShadow = true;
  group.add(antMesh);

  // Metallic ESP32-S3-WROOM-1 RF Shield Can
  const shieldCanvas = document.createElement("canvas");
  shieldCanvas.width = 256;
  shieldCanvas.height = 256;
  const sctx = shieldCanvas.getContext("2d");
  if (sctx) {
    sctx.fillStyle = "#c8cfd8";
    sctx.fillRect(0, 0, 256, 256);
    // Brushed aluminum horizontal streaks
    sctx.fillStyle = "rgba(255,255,255,0.08)";
    for (let y = 0; y < 256; y += 3) {
      sctx.fillRect(0, y, 256, 1);
    }
    sctx.strokeStyle = "#475569";
    sctx.lineWidth = 3;
    sctx.strokeRect(86, 42, 84, 52);
    sctx.fillStyle = "#334155";
    sctx.font = "bold 26px sans-serif";
    sctx.textAlign = "center";
    sctx.fillText("ESP", 128, 78);
    sctx.font = "bold 17px monospace";
    sctx.fillText("ESP32-S3-WROOM-1", 128, 134);
    sctx.font = "13px monospace";
    sctx.fillText("N16R8 · 240 MHz", 128, 162);
    sctx.fillText("Wi-Fi 4 · BLE 5.0", 128, 186);
  }
  const shieldTex = new THREE.CanvasTexture(shieldCanvas);
  shieldTex.colorSpace = THREE.SRGBColorSpace;
  shieldTex.anisotropy = maxAnisotropy;
  const shieldMat = new THREE.MeshStandardMaterial({
    map: shieldTex,
    color: 0xffffff,
    metalness: 0.88,
    roughness: 0.24,
  });
  const shieldSideMat = new THREE.MeshStandardMaterial({
    color: 0xb4bcc8,
    metalness: 0.9,
    roughness: 0.25,
  });
  const shieldMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.78, 0.32, 1.88),
    [shieldSideMat, shieldSideMat, shieldMat, shieldSideMat, shieldSideMat, shieldSideMat],
  );
  shieldMesh.position.set(0, 0.48, -1.44);
  shieldMesh.castShadow = true;
  group.add(shieldMesh);

  // Dual Metallic USB-C Ports at bottom edge (+Z)
  const usbMat = new THREE.MeshStandardMaterial({
    color: 0xd0d7e2,
    metalness: 0.92,
    roughness: 0.2,
  });
  const usbDarkMat = new THREE.MeshStandardMaterial({ color: 0x0b0f17, roughness: 0.8 });
  for (const xPos of [-0.52, 0.52]) {
    const port = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.28, 0.72), usbMat);
    port.position.set(xPos, 0.46, 2.9);
    port.castShadow = true;
    group.add(port);
    const cavity = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.14, 0.08), usbDarkMat);
    cavity.position.set(xPos, 0.46, 3.24);
    group.add(cavity);
  }

  // 44-Pin Gold-Plated Headers (InstancedMesh for crisp performance)
  const shroudMat = new THREE.MeshStandardMaterial({ color: 0x1e2430, roughness: 0.78 });
  for (const side of [-1.14, 1.14]) {
    const shroud = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 5.45), shroudMat);
    shroud.position.set(side, 0.1, 0.12);
    group.add(shroud);
  }
  const pinGeo = new THREE.BoxGeometry(0.065, 0.42, 0.065);
  const pinMat = new THREE.MeshStandardMaterial({
    color: 0xf0c24b,
    metalness: 0.94,
    roughness: 0.18,
  });
  const pinInst = new THREE.InstancedMesh(pinGeo, pinMat, 44);
  const dummy = new THREE.Object3D();
  let pIdx = 0;
  for (const side of [-1.14, 1.14]) {
    for (let i = 0; i < 22; i++) {
      dummy.position.set(side, 0.22, -2.42 + i * 0.242);
      dummy.updateMatrix();
      pinInst.setMatrixAt(pIdx++, dummy.matrix);
    }
  }
  pinInst.instanceMatrix.needsUpdate = true;
  pinInst.computeBoundingSphere();
  group.add(pinInst);

  // AMS1117 3.3V LDO Regulator + CP2102N Bridge IC
  const icMat = new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.48, metalness: 0.15 });
  const ldo = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.18, 0.4), icMat);
  ldo.position.set(0.42, 0.41, 0.48);
  group.add(ldo);
  const cp2102 = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.12, 0.52), icMat);
  cp2102.position.set(0, 0.38, 2.02);
  group.add(cp2102);

  // Live Clickable WS2812 RGB LED (GPIO48)
  const ledBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.1, 0.36),
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.35 }),
  );
  ledBase.position.set(-0.46, 0.37, 0.48);
  group.add(ledBase);

  const rgbMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x06b6d4,
    emissiveIntensity: 1.8,
    roughness: 0.2,
  });
  const rgbMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16), rgbMat);
  rgbMesh.position.set(-0.46, 0.44, 0.48);
  tagInteractive(rgbMesh, "esp32-s3", "esp-rgb");
  group.add(rgbMesh);

  const rgbLight = new THREE.PointLight(0x06b6d4, 1.4, 3.2);
  rgbLight.position.set(-0.46, 0.72, 0.48);
  group.add(rgbLight);

  // Clickable Tactile RST & BOOT Buttons
  const btnFrameMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.85, roughness: 0.28 });
  const btnCapMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.55 });

  const rstFrame = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.36), btnFrameMat);
  rstFrame.position.set(-0.46, 0.38, 1.24);
  group.add(rstFrame);
  const rstCap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.12, 16), btnCapMat.clone());
  rstCap.position.set(-0.46, 0.48, 1.24);
  tagInteractive(rstCap, "esp32-s3", "esp-rst");
  group.add(rstCap);

  const bootFrame = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.36), btnFrameMat);
  bootFrame.position.set(0.46, 0.38, 1.24);
  group.add(bootFrame);
  const bootCap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.12, 16), btnCapMat.clone());
  bootCap.position.set(0.46, 0.48, 1.24);
  tagInteractive(bootCap, "esp32-s3", "esp-boot");
  group.add(bootCap);

  tagInteractive(group, "esp32-s3");
  // Preserve sub-part action tags
  rgbMesh.userData.action = "esp-rgb";
  rstCap.userData.action = "esp-rst";
  bootCap.userData.action = "esp-boot";

  const setRgbColor = (hex: string, on: boolean) => {
    const col = new THREE.Color(hex);
    rgbMat.color.copy(on ? col : new THREE.Color(0x334155));
    rgbMat.emissive.copy(col);
    rgbMat.emissiveIntensity = on ? 2.1 : 0.05;
    rgbLight.color.copy(col);
    rgbLight.intensity = on ? 1.5 : 0;
  };

  return { group, rgbMesh, rgbLight, bootCap, rstCap, setRgbColor };
}

/**
 * 2. Realistic Flipper Zero (100.3 x 40.1 x 25.6 mm -> 4.01 wide x 1.7 tall x 10.03 long)
 */
export function createFlipperZeroModel(maxAnisotropy: number): FlipperRigHandles {
  const group = new THREE.Group();
  group.name = "flipper-zero";
  group.add(createContactShadow(4.2, 10.2));

  // Extruded beveled white polycarbonate shell
  const bodyShape = makeRoundedRectShape(3.96, 9.9, 0.56);
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 1.38,
    bevelEnabled: true,
    bevelThickness: 0.14,
    bevelSize: 0.12,
    bevelSegments: 4,
  });
  bodyGeo.rotateX(-Math.PI / 2);
  const whiteShellMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.36,
    metalness: 0.04,
  });
  const bodyMesh = new THREE.Mesh(bodyGeo, whiteShellMat);
  bodyMesh.position.y = 0.16;
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Signature Flipper Orange base rim accent
  const orangeMat = new THREE.MeshStandardMaterial({
    color: 0xff7a00,
    roughness: 0.34,
    metalness: 0.06,
  });
  const orangeRim = new THREE.Mesh(new THREE.BoxGeometry(3.75, 0.24, 9.65), orangeMat);
  orangeRim.position.y = 0.22;
  group.add(orangeRim);

  // Recessed Dark Bezel around the 1.4" Orange Monochrome LCD
  const bezelMesh = new THREE.Mesh(
    new THREE.BoxGeometry(3.26, 0.12, 3.65),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.12 }),
  );
  bezelMesh.position.set(0, 1.66, -2.05);
  group.add(bezelMesh);

  // Dynamic 1.4" Backlit Orange 128x64 LCD CanvasTexture
  const screenCanvas = document.createElement("canvas");
  screenCanvas.width = 256;
  screenCanvas.height = 160;
  const sctx = screenCanvas.getContext("2d")!;
  const screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.anisotropy = maxAnisotropy;

  const drawScreen = (mode: string, statusLine: string, subLine: string) => {
    sctx.fillStyle = "#ff8c1a";
    sctx.fillRect(0, 0, 256, 160);
    // Subtle LCD pixel grid
    sctx.strokeStyle = "rgba(255,255,255,0.12)";
    sctx.lineWidth = 1;
    for (let y = 0; y < 160; y += 8) {
      sctx.beginPath();
      sctx.moveTo(0, y);
      sctx.lineTo(256, y);
      sctx.stroke();
    }
    // Top status bar
    sctx.fillStyle = "#181007";
    sctx.fillRect(8, 8, 240, 24);
    sctx.fillStyle = "#ff9d2e";
    sctx.font = "bold 14px monospace";
    sctx.fillText("FLIPPER ZERO", 16, 25);
    sctx.fillText("94% [===]", 170, 25);

    // Main title & live readout
    sctx.fillStyle = "#181007";
    sctx.font = "bold 20px monospace";
    sctx.fillText(mode.slice(0, 18), 14, 66);
    sctx.fillRect(14, 76, 228, 3);
    sctx.font = "bold 15px monospace";
    sctx.fillText(statusLine.slice(0, 24), 14, 104);
    sctx.font = "13px monospace";
    sctx.fillText(subLine.slice(0, 28), 14, 130);
    sctx.strokeStyle = "#181007";
    sctx.lineWidth = 3;
    sctx.strokeRect(4, 4, 248, 152);
    screenTex.needsUpdate = true;
  };
  drawScreen("GPIO UART BRIDGE", "115200 8N1 READY", "Pin13 TX <-> ESP32 RX");

  const screenGeo = new THREE.PlaneGeometry(2.88, 2.2);
  screenGeo.rotateX(-Math.PI / 2);
  const screenMesh = new THREE.Mesh(
    screenGeo,
    new THREE.MeshStandardMaterial({
      map: screenTex,
      emissive: 0xff7a00,
      emissiveMap: screenTex,
      emissiveIntensity: 0.75,
      roughness: 0.18,
    }),
  );
  screenMesh.position.set(0, 1.73, -2.05);
  group.add(screenMesh);

  // Iconic 5-Way D-Pad Ring + Clickable Orange OK Button + Back Button
  const dpadBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.18, 1.24, 0.16, 32),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.42 }),
  );
  dpadBase.position.set(-0.35, 1.68, 2.15);
  group.add(dpadBase);

  const okCap = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.48, 0.24, 24), orangeMat.clone());
  okCap.position.set(-0.35, 1.76, 2.15);
  tagInteractive(okCap, "flipper-zero", "flipper-ok");
  group.add(okCap);

  const backCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.4, 0.2, 24),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35 }),
  );
  backCap.position.set(1.18, 1.72, 3.35);
  tagInteractive(backCap, "flipper-zero", "flipper-back");
  group.add(backCap);

  // Dark Red-Tinted Infrared Transceiver Window on the side
  const irWindow = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.72, 2.4),
    new THREE.MeshStandardMaterial({ color: 0x2b0a14, roughness: 0.12, metalness: 0.2 }),
  );
  irWindow.position.set(-2.04, 0.9, -1.2);
  group.add(irWindow);

  // Top 18-Pin Recessed 3.3V GPIO Female Header (-Z edge)
  const gpioBar = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.34, 0.56),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 }),
  );
  gpioBar.position.set(0, 1.48, -4.75);
  group.add(gpioBar);

  const gpioPinInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.08, 0.12, 0.14),
    new THREE.MeshStandardMaterial({ color: 0xf0c24b, metalness: 0.92, roughness: 0.2 }),
    18,
  );
  const d = new THREE.Object3D();
  for (let i = 0; i < 18; i++) {
    d.position.set(-1.44 + i * 0.17, 1.66, -4.75);
    d.updateMatrix();
    gpioPinInst.setMatrixAt(i, d.matrix);
  }
  gpioPinInst.instanceMatrix.needsUpdate = true;
  gpioPinInst.computeBoundingSphere();
  group.add(gpioPinInst);

  tagInteractive(group, "flipper-zero");
  okCap.userData.action = "flipper-ok";
  backCap.userData.action = "flipper-back";

  return {
    group,
    screen: { canvas: screenCanvas, ctx: sctx, texture: screenTex },
    okCap,
    backCap,
    drawScreen,
  };
}

/**
 * 3. Realistic SSD1306 0.96" I2C OLED Display (27 x 27 mm)
 */
export function createOledSsd1306Model(maxAnisotropy: number): OledRigHandles {
  const group = new THREE.Group();
  group.name = "ssd1306-oled";
  group.add(createContactShadow(2.8, 2.8));

  const pcb = new THREE.Mesh(
    new THREE.BoxGeometry(2.7, 0.16, 2.7),
    new THREE.MeshStandardMaterial({ color: 0x0b3b75, roughness: 0.42, metalness: 0.14 }),
  );
  pcb.position.y = 0.2;
  pcb.castShadow = true;
  group.add(pcb);

  // 4 Corner Brass Mounting Rings
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.9, roughness: 0.25 });
  for (const sx of [-1.12, 1.12]) {
    for (const sz of [-1.12, 1.12]) {
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.18, 16), brassMat);
      hole.position.set(sx, 0.2, sz);
      group.add(hole);
    }
  }

  // 4-Pin I2C Header
  const headerBar = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.2, 0.26),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 }),
  );
  headerBar.position.set(0, 0.34, -1.16);
  group.add(headerBar);

  // Dark Glass OLED Panel
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(2.45, 0.12, 1.72),
    new THREE.MeshStandardMaterial({ color: 0x070a10, roughness: 0.14, metalness: 0.2 }),
  );
  glass.position.set(0, 0.34, 0.14);
  group.add(glass);

  // Live 128x64 Yellow + Cyan Dual-Zone OLED Canvas
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;

  const drawOled = (title: string, line1: string, line2: string, accentHex = "#38bdf8") => {
    ctx.fillStyle = "#04070d";
    ctx.fillRect(0, 0, 256, 128);
    // Yellow top header band (classic SSD1306 16px yellow / 48px cyan)
    ctx.fillStyle = "#facc15";
    ctx.font = "bold 18px monospace";
    ctx.fillText(title.slice(0, 22), 10, 24);
    ctx.fillRect(8, 32, 240, 2);

    ctx.fillStyle = accentHex;
    ctx.font = "bold 16px monospace";
    ctx.fillText(line1.slice(0, 24), 10, 66);
    ctx.font = "14px monospace";
    ctx.fillText(line2.slice(0, 26), 10, 98);
    tex.needsUpdate = true;
  };
  drawOled("SSD1306 I2C 0x3C", "ESP32-S3 READY", "GPIO8 SDA · GPIO9 SCL");

  const dispGeo = new THREE.PlaneGeometry(2.16, 1.18);
  dispGeo.rotateX(-Math.PI / 2);
  const dispMesh = new THREE.Mesh(
    dispGeo,
    new THREE.MeshStandardMaterial({
      map: tex,
      emissive: 0xffffff,
      emissiveMap: tex,
      emissiveIntensity: 1.05,
      roughness: 0.15,
    }),
  );
  dispMesh.position.set(0, 0.41, 0.14);
  group.add(dispMesh);

  tagInteractive(group, "ssd1306-oled");
  return { group, screen: { canvas, ctx, texture: tex }, drawOled };
}

/**
 * 4. Realistic MFRC522 13.56 MHz RFID Reader + Interactive MIFARE Keycard
 */
export function createMfrc522Model(maxAnisotropy: number): RfidRigHandles {
  const group = new THREE.Group();
  group.name = "mfrc522-rfid";
  group.add(createContactShadow(4.1, 6.1));

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#0c4a8c";
    ctx.fillRect(0, 0, 512, 768);
    // Etched spiral 13.56 MHz PCB coil antenna
    ctx.strokeStyle = "#d4a849";
    ctx.lineWidth = 8;
    for (let i = 0; i < 4; i++) {
      const pad = 42 + i * 24;
      ctx.strokeRect(pad, pad, 512 - pad * 2, 410 - pad * 2);
    }
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 26px monospace";
    ctx.textAlign = "center";
    ctx.fillText("RFID-RC522", 256, 250);
    ctx.font = "18px monospace";
    ctx.fillText("13.56 MHz · 3.3V ONLY", 256, 590);
    ctx.font = "15px monospace";
    ctx.fillText("SDA SCK MOSI MISO IRQ GND RST 3.3V", 256, 725);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;

  const sideMat = new THREE.MeshStandardMaterial({ color: 0x0a396b, roughness: 0.55 });
  const topMat = new THREE.MeshStandardMaterial({ map: tex, color: 0xffffff, roughness: 0.4, metalness: 0.25 });
  const pcb = new THREE.Mesh(
    new THREE.BoxGeometry(4.0, 0.16, 6.0),
    [sideMat, sideMat, topMat, sideMat, sideMat, sideMat],
  );
  pcb.position.y = 0.2;
  pcb.castShadow = true;
  group.add(pcb);

  // QFN-32 MFRC522 IC + 27.12 MHz Crystal
  const ic = new THREE.Mesh(
    new THREE.BoxGeometry(0.66, 0.14, 0.66),
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5 }),
  );
  ic.position.set(0, 0.34, 1.25);
  group.add(ic);

  const xtal = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.16, 0.95),
    new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.92, roughness: 0.2 }),
  );
  xtal.position.set(0.95, 0.36, 1.25);
  group.add(xtal);

  // Power LED
  const ledMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.08, 0.14),
    new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.4 }),
  );
  ledMesh.position.set(-1.15, 0.32, 1.9);
  group.add(ledMesh);

  // Clickable White MIFARE S50 Keycard (tap to scan!)
  const cardGroup = new THREE.Group();
  const cardCanvas = document.createElement("canvas");
  cardCanvas.width = 256;
  cardCanvas.height = 160;
  const cctx = cardCanvas.getContext("2d");
  if (cctx) {
    cctx.fillStyle = "#f8fafc";
    cctx.fillRect(0, 0, 256, 160);
    cctx.strokeStyle = "#0ea5e9";
    cctx.lineWidth = 4;
    cctx.strokeRect(10, 10, 236, 140);
    cctx.fillStyle = "#0f172a";
    cctx.font = "bold 20px sans-serif";
    cctx.fillText("MIFARE S50", 24, 52);
    cctx.fillStyle = "#0284c7";
    cctx.font = "bold 14px monospace";
    cctx.fillText("13.56 MHz · TAP CARD", 24, 90);
    cctx.fillStyle = "#64748b";
    cctx.font = "13px monospace";
    cctx.fillText("UID 04:A2:B9:1C", 24, 124);
  }
  const cardTex = new THREE.CanvasTexture(cardCanvas);
  cardTex.colorSpace = THREE.SRGBColorSpace;
  cardTex.anisotropy = maxAnisotropy;

  const cardMesh = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.08, 1.65),
    new THREE.MeshStandardMaterial({ map: cardTex, color: 0xffffff, roughness: 0.28 }),
  );
  cardMesh.castShadow = true;
  cardGroup.add(cardMesh);
  cardGroup.position.set(-1.6, 0.42, -1.8);
  cardGroup.rotation.y = 0.25;
  tagInteractive(cardGroup, "mfrc522-rfid", "rfid-tap");
  group.add(cardGroup);

  tagInteractive(group, "mfrc522-rfid");
  cardGroup.traverse((c) => {
    c.userData.action = "rfid-tap";
  });

  return { group, cardGroup, ledMesh };
}

/**
 * 5. Realistic MAX98357A I2S Amplifier + 3W Speaker Driver
 */
export function createMax98357AudioModel(maxAnisotropy: number): AudioRigHandles {
  const group = new THREE.Group();
  group.name = "max98357a-audio";
  group.add(createContactShadow(4.2, 2.8));

  // Purple MAX98357A PCB
  const ampPcb = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.16, 1.8),
    new THREE.MeshStandardMaterial({ color: 0x5b21b6, roughness: 0.42, metalness: 0.14 }),
  );
  ampPcb.position.set(-1.05, 0.2, 0);
  ampPcb.castShadow = true;
  group.add(ampPcb);

  // Green 2-Pin Speaker Terminal Block
  const term = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.45, 0.42),
    new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.55 }),
  );
  term.position.set(-0.55, 0.48, 0.55);
  group.add(term);

  // 3W Round Speaker Basket + Paper Cone + Metallic Dust Cap (Clickable to play I2S tone!)
  const spkX = 1.05;
  const basket = new THREE.Mesh(
    new THREE.CylinderGeometry(1.18, 0.85, 0.58, 32),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.72, roughness: 0.35 }),
  );
  basket.position.set(spkX, 0.34, 0);
  basket.castShadow = true;
  group.add(basket);

  const surround = new THREE.Mesh(
    new THREE.TorusGeometry(0.98, 0.12, 12, 32),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85 }),
  );
  surround.rotation.x = Math.PI / 2;
  surround.position.set(spkX, 0.64, 0);
  group.add(surround);

  const coneMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.86, 0.38, 0.22, 28),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.78 }),
  );
  coneMesh.position.set(spkX, 0.56, 0);
  group.add(coneMesh);

  const dustCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.45, roughness: 0.3 }),
  );
  dustCap.position.set(spkX, 0.54, 0);
  coneMesh.add(dustCap);

  // Speaker wire pair connecting PCB to speaker
  const wireCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.4, 0.48, 0.55),
    new THREE.Vector3(0.15, 0.78, 0.35),
    new THREE.Vector3(0.55, 0.38, 0.1),
  ]);
  const wireMesh = new THREE.Mesh(
    new THREE.TubeGeometry(wireCurve, 12, 0.045, 6, false),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 }),
  );
  group.add(wireMesh);

  // Avoid unused parameter warning
  void maxAnisotropy;
  tagInteractive(group, "max98357a-audio");
  basket.userData.action = "audio-play";
  coneMesh.userData.action = "audio-play";
  dustCap.userData.action = "audio-play";

  return { group, coneMesh };
}

/**
 * 6. Realistic 830-Point Solderless Breadboard (165 x 55 mm)
 */
export function createBreadboard830Model(maxAnisotropy: number): THREE.Group {
  const group = new THREE.Group();
  group.name = "breadboard-830";
  group.add(createContactShadow(16.6, 5.6));

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 384;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#f1f3f5";
    ctx.fillRect(0, 0, 1024, 384);

    // Top & bottom Red (+5V/3V3) and Blue (GND) rail lines
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(28, 22, 968, 5);
    ctx.fillRect(28, 356, 968, 5);
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(28, 62, 968, 5);
    ctx.fillRect(28, 316, 968, 5);

    // Center DIP channel shading
    ctx.fillStyle = "#dfe4ea";
    ctx.fillRect(16, 178, 992, 28);

    // Breadboard pin sockets
    ctx.fillStyle = "#1e293b";
    for (let col = 0; col < 63; col++) {
      const x = 36 + col * 15.2;
      // Top & bottom main 5-row blocks
      for (let r = 0; r < 5; r++) {
        ctx.fillRect(x, 86 + r * 17, 7, 7);
        ctx.fillRect(x, 222 + r * 17, 7, 7);
      }
      // Power rails (grouped by 5)
      if (col % 6 !== 5 && col < 60) {
        ctx.fillRect(x, 34, 7, 7);
        ctx.fillRect(x, 48, 7, 7);
        ctx.fillRect(x, 328, 7, 7);
        ctx.fillRect(x, 342, 7, 7);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;

  const sideMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.55 });
  const topMat = new THREE.MeshStandardMaterial({ map: tex, color: 0xffffff, roughness: 0.62 });
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(16.5, 0.72, 5.5),
    [sideMat, sideMat, topMat, sideMat, sideMat, sideMat],
  );
  body.position.y = 0.38;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  tagInteractive(group, "breadboard-830");
  return group;
}

/**
 * Creates a smooth physical 3D jumper wire catenary tube between two world points.
 */
export function createJumperWireMesh(
  start: THREE.Vector3,
  end: THREE.Vector3,
  colorHex: string,
): THREE.Mesh {
  const mid = start.clone().lerp(end, 0.5);
  const dist = start.distanceTo(end);
  mid.y = Math.max(start.y, end.y) + Math.min(2.4, 0.65 + dist * 0.16);
  const curve = new THREE.CatmullRomCurve3([start, mid, end]);
  const geo = new THREE.TubeGeometry(curve, 20, 0.055, 8, false);
  const mat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.45,
    metalness: 0.08,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}
