import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import {
  Cable,
  Camera,
  ChevronDown,
  ChevronUp,
  Cloud,
  Move,
  RotateCcw,
  RotateCw,
  Sparkles,
  Usb,
  Volume2,
  Zap,
} from "lucide-react";
import {
  BENCH_BOARDS,
  BENCH_WIRE_CONNECTIONS,
  clampBoardPoseToBench,
  getDefaultBenchLayout,
  mergeSavedBenchLayout,
  type BenchBoardId,
  type WiringPresetId,
} from "../logic/bench-3d";
import {
  createBreadboard830Model,
  createEsdWorkbenchMat,
  createEsp32S3Board,
  createFlipperZeroModel,
  createJumperWireMesh,
  createMax98357AudioModel,
  createMfrc522Model,
  createOledSsd1306Model,
  type AudioRigHandles,
  type Esp32RigHandles,
  type FlipperRigHandles,
  type OledRigHandles,
  type RfidRigHandles,
} from "../three/board-models";
import { RealHardwareDrawer } from "../components/RealHardwareDrawer";
import type { BenchLayoutMap } from "../firebase/payload-validators";
import type { ParsedSerialTelemetry } from "../logic/hardware-bridge";
import type { Lang } from "../types";

interface Workbench3DViewProps {
  lang: Lang;
  savedLayout?: BenchLayoutMap | null;
  isSignedIn: boolean;
  onSaveLayout?: (layout: BenchLayoutMap) => Promise<void>;
}

type GizmoMode = "orbit" | "translate" | "rotate";
type DockTab = "move" | "interact" | "camera" | "wiring";
type CameraPreset = "overview" | "esp32" | "flipper" | "top";

const RGB_CYCLE = [
  { hex: "#06b6d4", name: "Cyan" },
  { hex: "#10b981", name: "Emerald" },
  { hex: "#f59e0b", name: "Amber" },
  { hex: "#f43f5e", name: "Coral" },
  { hex: "#a855f7", name: "Violet" },
];

const FLIPPER_MODES = [
  { title: "GPIO UART BRIDGE", status: "115200 8N1 READY", sub: "Pin13 TX <-> ESP32 RX" },
  { title: "SUB-GHZ 433.92", status: "CC1101 RX ACTIVE", sub: "RSSI -54 dBm · AM650" },
  { title: "NFC 13.56 MHz", status: "ST25R3916 POLLING", sub: "ISO-14443A · MIFARE" },
  { title: "BADUSB USB-HID", status: "DUCKYSCRIPT READY", sub: "USB-C / BLE 5.4 HID" },
];

const CAMERA_PRESETS: Record<CameraPreset, { pos: [number, number, number]; target: [number, number, number] }> = {
  overview: { pos: [0.5, 13.8, 16.5], target: [-0.8, 0.4, 0.8] },
  esp32: { pos: [-3.2, 6.2, 6.4], target: [-3.2, 0.4, 0.4] },
  flipper: { pos: [5.4, 7.6, 8.2], target: [4.4, 0.9, 0.3] },
  top: { pos: [-0.6, 20.5, 0.2], target: [-0.6, 0, 0.6] },
};

function playQuickChirp(freqHz: number, durationSec = 0.14) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freqHz, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationSec);
    setTimeout(() => {
      void ctx.close();
    }, Math.round(durationSec * 1000) + 80);
  } catch {
    // Ignore autoplay restrictions
  }
}

export function Workbench3DView({
  lang,
  savedLayout,
  isSignedIn,
  onSaveLayout,
}: Workbench3DViewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<BenchBoardId>("esp32-s3");
  const [gizmoMode, setGizmoMode] = useState<GizmoMode>("orbit");
  const [wiringPreset, setWiringPreset] = useState<WiringPresetId>("flipper-uart");
  const [dockTab, setDockTab] = useState<DockTab>("move");
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [showHardwareBridge, setShowHardwareBridge] = useState(false);
  const [statusFeed, setStatusFeed] = useState<string>(
    lang === "ro"
      ? "Apasă pe orice placă pentru selecție sau pe butoanele fizice (BOOT, RST, RGB, OK, Card RFID, Difuzor)."
      : "Click any board to select, or click real components (BOOT, RST, RGB LED, Flipper OK, RFID Card, Speaker).",
  );
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [rgbIndex, setRgbIndex] = useState(0);
  const [flipperModeIdx, setFlipperModeIdx] = useState(0);

  // Refs bridging React UI -> stable Three.js scene without re-mounting WebGL
  const selectedBoardRef = useRef<BenchBoardId>(selectedBoard);
  const gizmoModeRef = useRef<GizmoMode>(gizmoMode);
  const wiringPresetRef = useRef<WiringPresetId>(wiringPreset);
  const langRef = useRef<Lang>(lang);
  const rgbIndexRef = useRef(rgbIndex);
  const flipperModeRef = useRef(flipperModeIdx);

  const sceneApiRef = useRef<{
    selectBoard: (id: BenchBoardId) => void;
    setGizmo: (mode: GizmoMode) => void;
    setCameraPreset: (preset: CameraPreset) => void;
    rebuildWires: (preset: WiringPresetId) => void;
    triggerAction: (action: string) => void;
    snapSelectedToMat: () => void;
    resetLayout: () => void;
    getCurrentLayout: () => BenchLayoutMap;
    applyTelemetry: (tel: ParsedSerialTelemetry, rawLine: string) => void;
  } | null>(null);

  useEffect(() => {
    selectedBoardRef.current = selectedBoard;
  }, [selectedBoard]);
  useEffect(() => {
    gizmoModeRef.current = gizmoMode;
  }, [gizmoMode]);
  useEffect(() => {
    wiringPresetRef.current = wiringPreset;
  }, [wiringPreset]);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  // Initialize Three.js WebGL scene ONCE
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement("canvas").getContext("webgl2");
      if (!gl) return true;
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = Math.max(320, container.clientWidth);
    const height = Math.max(420, container.clientHeight);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1220);
    scene.fog = new THREE.Fog(0x0b1220, 26, 62);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 120);
    camera.position.set(...CAMERA_PRESETS.overview.pos);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Mandatory studio environment map for crisp metallic shields & gold headers
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    // Balanced warm/cool studio 3-point lighting rig
    const hemiLight = new THREE.HemisphereLight(0xbce3ff, 0x1e293b, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e0, 1.85);
    keyLight.position.set(10, 18, 12);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -16;
    keyLight.shadow.camera.right = 16;
    keyLight.shadow.camera.top = 14;
    keyLight.shadow.camera.bottom = -14;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.55);
    rimLight.position.set(-14, 9, -10);
    scene.add(rimLight);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    // Grounded ESD Workbench Mat
    const esdMat = createEsdWorkbenchMat(maxAniso);
    scene.add(esdMat);

    // Subtle selection highlight ring on the mat
    const selRingGeo = new THREE.RingGeometry(1.5, 1.72, 48);
    selRingGeo.rotateX(-Math.PI / 2);
    const selRing = new THREE.Mesh(
      selRingGeo,
      new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.78,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    selRing.position.y = 0.025;
    scene.add(selRing);

    // Build all 6 realistic composite hardware models
    const espRig: Esp32RigHandles = createEsp32S3Board(maxAniso);
    const flipperRig: FlipperRigHandles = createFlipperZeroModel(maxAniso);
    const oledRig: OledRigHandles = createOledSsd1306Model(maxAniso);
    const rfidRig: RfidRigHandles = createMfrc522Model(maxAniso);
    const audioRig: AudioRigHandles = createMax98357AudioModel(maxAniso);
    const breadboardGroup = createBreadboard830Model(maxAniso);

    const boardGroups: Record<BenchBoardId, THREE.Group> = {
      "esp32-s3": espRig.group,
      "flipper-zero": flipperRig.group,
      "ssd1306-oled": oledRig.group,
      "mfrc522-rfid": rfidRig.group,
      "max98357a-audio": audioRig.group,
      "breadboard-830": breadboardGroup,
    };

    const initialLayout = mergeSavedBenchLayout(savedLayout);
    for (const meta of BENCH_BOARDS) {
      const grp = boardGroups[meta.id];
      const pose = initialLayout[meta.id];
      grp.position.set(pose.x, pose.y, pose.z);
      grp.rotation.set(0, pose.rotY, 0);
      scene.add(grp);
    }

    // Dynamic 3D Jumper Wires container
    const wiresGroup = new THREE.Group();
    wiresGroup.name = "jumper-wires";
    scene.add(wiresGroup);

    // Scratch vectors (zero GC inside render loop)
    const _vStart = new THREE.Vector3();
    const _vEnd = new THREE.Vector3();
    const _camGoalPos = new THREE.Vector3(...CAMERA_PRESETS.overview.pos);
    const _camGoalTarget = new THREE.Vector3(...CAMERA_PRESETS.overview.target);
    let camAnimating = false;
    let rfidPulseT = 0;
    let audioPulseT = 0;
    let lastTime = performance.now();

    // OrbitControls & TransformControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minDistance = 4;
    controls.maxDistance = 36;
    controls.target.set(...CAMERA_PRESETS.overview.target);
    controls.update();

    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.setSize(0.75);
    const gizmoHelper = transformControls.getHelper();
    scene.add(gizmoHelper);

    const updateSelectionRing = (id: BenchBoardId) => {
      const grp = boardGroups[id];
      const meta = BENCH_BOARDS.find((b) => b.id === id);
      const radius = meta ? Math.max(meta.footprintHalfX, meta.footprintHalfZ) * 0.72 : 2;
      selRing.position.set(grp.position.x, 0.028, grp.position.z);
      selRing.scale.set(radius / 1.6, 1, radius / 1.6);
    };

    const rebuildWires = (preset: WiringPresetId) => {
      while (wiresGroup.children.length > 0) {
        const child = wiresGroup.children.pop() as THREE.Mesh;
        child.geometry?.dispose();
        if (child.material && !Array.isArray(child.material)) child.material.dispose();
      }
      if (preset === "none") return;
      const active = BENCH_WIRE_CONNECTIONS.filter((w) => w.preset === preset);
      for (const w of active) {
        const fromGrp = boardGroups[w.fromBoard];
        const toGrp = boardGroups[w.toBoard];
        fromGrp.updateMatrixWorld(true);
        toGrp.updateMatrixWorld(true);
        _vStart.set(...w.fromOffset).applyMatrix4(fromGrp.matrixWorld);
        _vEnd.set(...w.toOffset).applyMatrix4(toGrp.matrixWorld);
        wiresGroup.add(createJumperWireMesh(_vStart, _vEnd, w.color));
      }
    };

    rebuildWires(wiringPresetRef.current);
    updateSelectionRing(selectedBoardRef.current);

    // Coalesced On-Demand Renderer with software-WebGL fence pacing
    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function requestRender() {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        const now = performance.now();
        const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
        lastTime = now;

        let needsMoreFrames = false;

        if (camAnimating) {
          const factor = 1 - Math.exp(-7 * dt);
          camera.position.lerp(_camGoalPos, factor);
          controls.target.lerp(_camGoalTarget, factor);
          if (
            camera.position.distanceTo(_camGoalPos) < 0.04 &&
            controls.target.distanceTo(_camGoalTarget) < 0.04
          ) {
            camera.position.copy(_camGoalPos);
            controls.target.copy(_camGoalTarget);
            camAnimating = false;
          } else {
            needsMoreFrames = true;
          }
        }

        if (rfidPulseT > 0) {
          rfidPulseT = Math.max(0, rfidPulseT - dt * 1.8);
          const wave = Math.sin(rfidPulseT * Math.PI);
          rfidRig.cardGroup.position.set(-1.6 + wave * 1.6, 0.42 + wave * 0.45, -1.8 + wave * 1.2);
          if (rfidPulseT > 0) needsMoreFrames = true;
        }

        if (audioPulseT > 0) {
          audioPulseT = Math.max(0, audioPulseT - dt * 2.5);
          const vib = Math.sin(audioPulseT * Math.PI * 8) * 0.06 * audioPulseT;
          audioRig.coneMesh.position.y = 0.56 + vib;
          if (audioPulseT > 0) needsMoreFrames = true;
        }

        controls.update();
        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (renderDirty || needsMoreFrames) requestRender();
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    controls.addEventListener("start", () => {
      camAnimating = false;
    });
    controls.addEventListener("change", requestRender);

    transformControls.addEventListener("dragging-changed", (event) => {
      controls.enabled = !event.value;
      requestRender();
    });
    transformControls.addEventListener("objectChange", () => {
      const activeId = selectedBoardRef.current;
      const grp = boardGroups[activeId];
      const clamped = clampBoardPoseToBench({
        x: grp.position.x,
        y: grp.position.y,
        z: grp.position.z,
        rotY: grp.rotation.y,
      });
      grp.position.set(clamped.x, clamped.y, clamped.z);
      updateSelectionRing(activeId);
      rebuildWires(wiringPresetRef.current);
      requestRender();
    });

    const attachGizmo = (mode: GizmoMode, boardId: BenchBoardId) => {
      if (mode === "orbit") {
        transformControls.detach();
      } else {
        transformControls.setMode(mode);
        transformControls.attach(boardGroups[boardId]);
      }
      requestRender();
    };

    const triggerAction = (action: string) => {
      const isRo = langRef.current === "ro";
      if (action === "esp-rgb") {
        const nextIdx = (rgbIndexRef.current + 1) % RGB_CYCLE.length;
        rgbIndexRef.current = nextIdx;
        setRgbIndex(nextIdx);
        const c = RGB_CYCLE[nextIdx];
        espRig.setRgbColor(c.hex, true);
        oledRig.drawOled("GPIO48 WS2812", `RGB: ${c.name.toUpperCase()}`, `HEX ${c.hex}`, c.hex);
        setStatusFeed(
          isRo
            ? `ESP32-S3 RGB LED GPIO48 -> ${c.name} (${c.hex})`
            : `ESP32-S3 RGB LED GPIO48 -> ${c.name} (${c.hex})`,
        );
        requestRender();
      } else if (action === "esp-boot") {
        espRig.bootCap.position.y = 0.43;
        setTimeout(() => {
          espRig.bootCap.position.y = 0.48;
          requestRender();
        }, 160);
        playQuickChirp(880, 0.08);
        oledRig.drawOled("ESP32-S3 BOOT", "GPIO0 = LOW", "Download / Mode Btn", "#f59e0b");
        setStatusFeed(
          isRo
            ? "Buton BOOT (GPIO0) apăsat -> Nivel logic LOW detectat."
            : "BOOT button (GPIO0) pressed -> Logic LOW detected.",
        );
        requestRender();
      } else if (action === "esp-rst") {
        espRig.rstCap.position.y = 0.43;
        setTimeout(() => {
          espRig.rstCap.position.y = 0.48;
          requestRender();
        }, 160);
        espRig.setRgbColor("#06b6d4", false);
        setTimeout(() => {
          espRig.setRgbColor(RGB_CYCLE[rgbIndexRef.current].hex, true);
          requestRender();
        }, 260);
        oledRig.drawOled("ESP-IDF v5.3", "RST: POWERON_RESET", "Dual-Core 240 MHz OK", "#38bdf8");
        setStatusFeed(
          isRo
            ? "Buton RST apăsat -> ESP32-S3 repornit curat (ESP-IDF boot OK)."
            : "RST button pressed -> ESP32-S3 rebooted cleanly (ESP-IDF boot OK).",
        );
        requestRender();
      } else if (action === "flipper-ok" || action === "flipper-back") {
        const cap = action === "flipper-ok" ? flipperRig.okCap : flipperRig.backCap;
        const origY = action === "flipper-ok" ? 1.76 : 1.72;
        cap.position.y = origY - 0.06;
        setTimeout(() => {
          cap.position.y = origY;
          requestRender();
        }, 150);
        const delta = action === "flipper-ok" ? 1 : -1;
        const nextIdx = (flipperModeRef.current + delta + FLIPPER_MODES.length) % FLIPPER_MODES.length;
        flipperModeRef.current = nextIdx;
        setFlipperModeIdx(nextIdx);
        const m = FLIPPER_MODES[nextIdx];
        flipperRig.drawScreen(m.title, m.status, m.sub);
        playQuickChirp(action === "flipper-ok" ? 1120 : 660, 0.07);
        setStatusFeed(`Flipper Zero -> ${m.title}: ${m.status}`);
        requestRender();
      } else if (action === "rfid-tap") {
        rfidPulseT = 1.0;
        espRig.setRgbColor("#10b981", true);
        oledRig.drawOled("MFRC522 13.56MHz", "UID 04:A2:B9:1C", "ACCESS GRANTED!", "#10b981");
        flipperRig.drawScreen("NFC DETECTED", "MIFARE Classic 1K", "UID: 04 A2 B9 1C");
        playQuickChirp(1320, 0.12);
        setStatusFeed(
          isRo
            ? "Card MIFARE apropiat de antena MFRC522 -> UID 04:A2:B9:1C validat!"
            : "MIFARE Card tapped on MFRC522 coil -> UID 04:A2:B9:1C granted!",
        );
        requestRender();
      } else if (action === "audio-play") {
        audioPulseT = 1.0;
        playQuickChirp(523.25, 0.14);
        setTimeout(() => playQuickChirp(659.25, 0.14), 110);
        setTimeout(() => playQuickChirp(783.99, 0.18), 220);
        oledRig.drawOled("MAX98357A I2S", "PCM 44.1kHz 16-bit", "C5-E5-G5 Chiptune", "#a855f7");
        setStatusFeed(
          isRo
            ? "Amplificator I2S MAX98357A -> Acord Chiptune (C5-E5-G5) redat pe difuzorul 3W."
            : "MAX98357A I2S Amp -> Chiptune chord (C5-E5-G5) played on 3W speaker.",
        );
        requestRender();
      }
    };

    // Raycasting for direct 3D board selection & sub-component clicking
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const interactableGroups = Object.values(boardGroups);
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 6) return; // Ignore orbit/gizmo drags
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(interactableGroups, true);
      if (hits.length === 0) return;

      const hitObj = hits[0].object;
      const action = hitObj.userData.action as string | undefined;
      const boardId = hitObj.userData.boardId as BenchBoardId | undefined;
      if (boardId) {
        selectedBoardRef.current = boardId;
        setSelectedBoard(boardId);
        updateSelectionRing(boardId);
        if (gizmoModeRef.current !== "orbit") {
          attachGizmo(gizmoModeRef.current, boardId);
        }
      }
      if (action) {
        triggerAction(action);
      } else if (boardId) {
        const meta = BENCH_BOARDS.find((b) => b.id === boardId);
        if (meta) {
          setStatusFeed(
            langRef.current === "ro"
              ? `Selectat: ${meta.name} (${meta.sizeMm}). Alege „Mută 3D” sau „Rotește 3D” pentru repoziționare.`
              : `Selected: ${meta.name} (${meta.sizeMm}). Choose Move 3D or Rotate 3D to reposition.`,
          );
        }
        requestRender();
      }
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    const onResize = () => {
      if (!container || disposed) return;
      const w = Math.max(320, container.clientWidth);
      const h = Math.max(420, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    window.addEventListener("resize", onResize);

    // Expose imperative bridge API to React dock controls
    sceneApiRef.current = {
      selectBoard: (id) => {
        selectedBoardRef.current = id;
        setSelectedBoard(id);
        updateSelectionRing(id);
        attachGizmo(gizmoModeRef.current, id);
      },
      setGizmo: (mode) => {
        gizmoModeRef.current = mode;
        setGizmoMode(mode);
        attachGizmo(mode, selectedBoardRef.current);
      },
      setCameraPreset: (preset) => {
        const cfg = CAMERA_PRESETS[preset];
        _camGoalPos.set(...cfg.pos);
        _camGoalTarget.set(...cfg.target);
        camAnimating = true;
        requestRender();
      },
      rebuildWires: (preset) => {
        wiringPresetRef.current = preset;
        setWiringPreset(preset);
        rebuildWires(preset);
        requestRender();
      },
      triggerAction,
      snapSelectedToMat: () => {
        const grp = boardGroups[selectedBoardRef.current];
        grp.position.y = 0;
        grp.rotation.x = 0;
        grp.rotation.z = 0;
        updateSelectionRing(selectedBoardRef.current);
        rebuildWires(wiringPresetRef.current);
        requestRender();
      },
      resetLayout: () => {
        const def = getDefaultBenchLayout();
        for (const meta of BENCH_BOARDS) {
          const p = def[meta.id];
          boardGroups[meta.id].position.set(p.x, p.y, p.z);
          boardGroups[meta.id].rotation.set(0, p.rotY, 0);
        }
        updateSelectionRing(selectedBoardRef.current);
        rebuildWires(wiringPresetRef.current);
        requestRender();
      },
      getCurrentLayout: () => {
        const out: BenchLayoutMap = {};
        for (const meta of BENCH_BOARDS) {
          const g = boardGroups[meta.id];
          out[meta.id] = clampBoardPoseToBench({
            x: g.position.x,
            y: g.position.y,
            z: g.position.z,
            rotY: g.rotation.y,
          });
        }
        return out;
      },
      applyTelemetry: (tel, rawLine) => {
        if (tel.rgbHex) espRig.setRgbColor(tel.rgbHex, true);
        if (tel.rfidUid) {
          rfidPulseT = 1.0;
          oledRig.drawOled("LIVE HW RFID", `UID ${tel.rfidUid}`, "Serial Bridge", "#10b981");
        } else if (tel.oledText) {
          oledRig.drawOled("LIVE HW SERIAL", tel.oledText.slice(0, 22), rawLine.slice(22, 46), "#38bdf8");
        }
        if (tel.flipperMode) {
          flipperRig.drawScreen(tel.flipperMode, "USB-C BRIDGE LIVE", rawLine.slice(0, 24));
        }
        requestRender();
      },
    };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    requestRender();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      transformControls.dispose();
      controls.dispose();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [savedLayout]);

  const handleSaveCloudLayout = useCallback(async () => {
    if (!sceneApiRef.current || !onSaveLayout) return;
    const layout = sceneApiRef.current.getCurrentLayout();
    await onSaveLayout(layout);
    setSaveNotice(
      lang === "ro"
        ? "Aranjamentul 3D a fost salvat securizat în contul tău!"
        : "3D bench layout securely saved to your account!",
    );
    setTimeout(() => setSaveNotice(null), 3500);
  }, [lang, onSaveLayout]);

  const handleTelemetry = useCallback((tel: ParsedSerialTelemetry, rawLine: string) => {
    sceneApiRef.current?.applyTelemetry(tel, rawLine);
    setStatusFeed(`HW Live -> ${rawLine}`);
  }, []);

  const activeBoardMeta = BENCH_BOARDS.find((b) => b.id === selectedBoard) ?? BENCH_BOARDS[0];

  return (
    <div className="space-y-4">
      {/* Minimal Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1
            className="text-xl sm:text-2xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {lang === "ro"
              ? "Banc de Lucru Hardware 3D Interactiv & Conexiune Plăci Reale"
              : "Interactive 3D Hardware Workbench & Real Device Bridge"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {lang === "ro"
              ? "Plăci reproduse la scară reală (mm) pe care le poți muta și roti în 3D, testa prin click direct sau conecta prin USB-C / BLE."
              : "True-scale (mm) 3D hardware boards you can freely move and rotate in 3D space, click directly, or bridge via USB-C / BLE."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowHardwareBridge((s) => !s)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            showHardwareBridge
              ? "bg-emerald-600 text-white"
              : "bg-cyan-600 hover:bg-cyan-500 text-white"
          }`}
        >
          <Usb className="w-4 h-4" />
          <span>
            {lang === "ro"
              ? "Conectează Hardware Real (USB / BLE)"
              : "Connect Real Hardware (USB / BLE)"}
          </span>
        </button>
      </div>

      {/* Collapsible Real Physical Hardware Bridge Drawer (Above 3D canvas so viewport stays unobstructed) */}
      {showHardwareBridge && (
        <RealHardwareDrawer
          lang={lang}
          onClose={() => setShowHardwareBridge(false)}
          onTelemetry={handleTelemetry}
        />
      )}

      {/* Unobstructed 3D WebGL Viewport with Collapsible Bottom Control Dock */}
      <div className="relative rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#0b1220] overflow-hidden h-[560px] sm:h-[640px]">
        {/* Isolated empty mount div for Three.js WebGL canvas */}
        <div
          ref={mountRef}
          data-testid="workbench-3d-canvas"
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />

        {/* Minimal Top-Left Spec Bar (solid surface, zero backdrop-blur over WebGL) */}
        <div className="absolute top-3 left-3 max-w-md rounded-xl border border-slate-700 bg-slate-950/95 px-3.5 py-2 text-slate-100 pointer-events-none">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-cyan-400">{activeBoardMeta.name}</span>
            <span className="text-[11px] font-mono text-slate-400">
              {activeBoardMeta.sizeMm}
            </span>
          </div>
          <div className="text-[11px] text-slate-300 truncate">{statusFeed}</div>
          {saveNotice && (
            <div className="text-[11px] font-semibold text-emerald-400 pt-0.5">{saveNotice}</div>
          )}
        </div>

        {/* Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[min(940px,95%)] flex flex-col items-center">
          <button
            type="button"
            onClick={() => setDockCollapsed((c) => !c)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-t-lg border border-b-0 border-slate-700 bg-slate-950 text-[11px] font-semibold text-slate-200 hover:text-cyan-300 cursor-pointer"
          >
            {dockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>
              {dockCollapsed
                ? lang === "ro"
                  ? "Afișează Controalele 3D"
                  : "Show 3D Controls"
                : lang === "ro"
                  ? "Ascunde Controalele (Mod Zen)"
                  : "Hide Controls (Zen Mode)"}
            </span>
          </button>

          {!dockCollapsed && (
            <div className="w-full rounded-2xl border border-slate-700 bg-slate-950/95 p-3 text-slate-100 space-y-2.5 shadow-2xl">
              {/* Dock Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex flex-wrap items-center gap-1">
                  {[
                    { id: "move" as const, icon: Move, label: lang === "ro" ? "Plăci & Mutare 3D" : "Boards & 3D Move" },
                    { id: "interact" as const, icon: Zap, label: lang === "ro" ? "Interacțiune Live" : "Live Interact" },
                    { id: "wiring" as const, icon: Cable, label: lang === "ro" ? "Cablare 3D" : "3D Wiring" },
                    { id: "camera" as const, icon: Camera, label: lang === "ro" ? "Cameră" : "Camera" },
                  ].map((tabItem) => {
                    const Icon = tabItem.icon;
                    const active = dockTab === tabItem.id;
                    return (
                      <button
                        key={tabItem.id}
                        type="button"
                        onClick={() => setDockTab(tabItem.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          active
                            ? "bg-cyan-600 text-white"
                            : "text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tabItem.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Transform Gizmo Mode Quick Switch */}
                <div className="flex items-center gap-1">
                  {(
                    [
                      { id: "orbit" as const, label: "Orbit" },
                      { id: "translate" as const, label: lang === "ro" ? "Mută 3D" : "Move 3D" },
                      { id: "rotate" as const, label: lang === "ro" ? "Rotește 3D" : "Rotate 3D" },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => sceneApiRef.current?.setGizmo(m.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border transition-colors ${
                        gizmoMode === m.id
                          ? "bg-amber-500/20 border-amber-500 text-amber-300"
                          : "border-slate-700 text-slate-300 hover:border-cyan-500"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab 1: Select Board & 3D Transform Actions */}
              {dockTab === "move" && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {BENCH_BOARDS.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => sceneApiRef.current?.selectBoard(b.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                          selectedBoard === b.id
                            ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                            : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600"
                        }`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => sceneApiRef.current?.snapSelectedToMat()}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-cyan-500 text-[11px] font-semibold cursor-pointer"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>{lang === "ro" ? "Așază pe Mat (Y=0)" : "Snap to Mat"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => sceneApiRef.current?.resetLayout()}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-cyan-500 text-[11px] font-semibold cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{lang === "ro" ? "Resetează" : "Reset"}</span>
                    </button>
                    {isSignedIn && onSaveLayout && (
                      <button
                        type="button"
                        onClick={() => void handleSaveCloudLayout()}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold cursor-pointer"
                      >
                        <Cloud className="w-3 h-3" />
                        <span>{lang === "ro" ? "Salvează în Cont" : "Save to Account"}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Direct Component Interactions */}
              {dockTab === "interact" && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => sceneApiRef.current?.triggerAction("esp-rgb")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 text-xs font-semibold cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>ESP32 RGB LED ({RGB_CYCLE[rgbIndex].name})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => sceneApiRef.current?.triggerAction("esp-boot")}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-500 text-xs font-semibold cursor-pointer"
                  >
                    ESP32 BOOT (GPIO0)
                  </button>
                  <button
                    type="button"
                    onClick={() => sceneApiRef.current?.triggerAction("esp-rst")}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-rose-500 text-xs font-semibold cursor-pointer"
                  >
                    ESP32 RST
                  </button>
                  <button
                    type="button"
                    onClick={() => sceneApiRef.current?.triggerAction("flipper-ok")}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Flipper OK ({FLIPPER_MODES[flipperModeIdx].title})
                  </button>
                  <button
                    type="button"
                    onClick={() => sceneApiRef.current?.triggerAction("rfid-tap")}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    {lang === "ro" ? "Apropie Card RFID" : "Tap RFID Card"}
                  </button>
                  <button
                    type="button"
                    onClick={() => sceneApiRef.current?.triggerAction("audio-play")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{lang === "ro" ? "Test Difuzor I2S" : "Play I2S Speaker"}</span>
                  </button>
                </div>
              )}

              {/* Tab 3: Physical 3D Jumper Wiring Presets */}
              {dockTab === "wiring" && (
                <div className="flex flex-wrap items-center gap-2">
                  {(
                    [
                      { id: "flipper-uart" as const, label: "Flipper Zero <-> ESP32 UART (4 fire)" },
                      { id: "oled-i2c" as const, label: "ESP32 <-> OLED SSD1306 I2C (4 fire)" },
                      { id: "rfid-spi" as const, label: "ESP32 <-> MFRC522 SPI2 (4 fire)" },
                      { id: "audio-i2s" as const, label: "ESP32 <-> MAX98357A I2S (3 fire)" },
                      { id: "none" as const, label: lang === "ro" ? "Fără fire" : "Clear Wires" },
                    ] as const
                  ).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => sceneApiRef.current?.rebuildWires(preset.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                        wiringPreset === preset.id
                          ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                          : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Tab 4: Smooth Camera Presets */}
              {dockTab === "camera" && (
                <div className="flex flex-wrap items-center gap-2">
                  {(
                    [
                      { id: "overview" as const, label: lang === "ro" ? "Vedere Generală Banc" : "Full Bench Overview" },
                      { id: "esp32" as const, label: "Focus ESP32-S3-DevKitC-1" },
                      { id: "flipper" as const, label: "Focus Flipper Zero" },
                      { id: "top" as const, label: lang === "ro" ? "Vedere de Sus (Ortografic)" : "Top-Down Plan View" },
                    ] as const
                  ).map((cam) => (
                    <button
                      key={cam.id}
                      type="button"
                      onClick={() => sceneApiRef.current?.setCameraPreset(cam.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 text-xs font-semibold cursor-pointer"
                    >
                      {cam.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
