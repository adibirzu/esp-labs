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
  Download,
  ImagePlus,
  Move,
  RefreshCw,
  RotateCcw,
  RotateCw,
  ScanEye,
  Sparkles,
  Usb,
  Volume2,
  X,
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
  applyArPreset,
  clampArAlignment,
  computeArCameraPose,
  describeCameraError,
  getDefaultArAlignment,
  type ArAlignmentState,
  type ArFacingMode,
  type ArPresetId,
  type ArSessionStatus,
} from "../logic/ar-alignment";
import {
  createArDeskCalibrationGrid,
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
import { ArAlignControls } from "../components/ArAlignControls";
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
type DockTab = "move" | "interact" | "camera" | "wiring" | "ar";
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const deskPhotoImgRef = useRef<HTMLImageElement | null>(null);
  const deskPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [selectedBoard, setSelectedBoard] = useState<BenchBoardId>("esp32-s3");
  const [gizmoMode, setGizmoMode] = useState<GizmoMode>("orbit");
  const [wiringPreset, setWiringPreset] = useState<WiringPresetId>("flipper-uart");
  const [dockTab, setDockTab] = useState<DockTab>("move");
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [showHardwareBridge, setShowHardwareBridge] = useState(false);
  const [arStatus, setArStatus] = useState<ArSessionStatus>("off");
  const [arError, setArError] = useState<{ title: string; detail: string } | null>(null);
  const [arAlignment, setArAlignment] = useState<ArAlignmentState>(() => getDefaultArAlignment());
  const [deskPhotoUrl, setDeskPhotoUrl] = useState<string | null>(null);
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
  const arAlignmentRef = useRef<ArAlignmentState>(arAlignment);
  const arActiveRef = useRef(false);

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
    setArMode: (enabled: boolean, alignment: ArAlignmentState) => void;
    updateArAlignment: (alignment: ArAlignmentState) => void;
    renderNowForSnapshot: () => HTMLCanvasElement | null;
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
  useEffect(() => {
    arAlignmentRef.current = arAlignment;
  }, [arAlignment]);

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

    const studioBg = new THREE.Color(0x0b1220);
    const studioFog = new THREE.Fog(0x0b1220, 26, 62);

    const scene = new THREE.Scene();
    scene.background = studioBg;
    scene.fog = studioFog;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 120);
    camera.position.set(...CAMERA_PRESETS.overview.pos);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x0b1220, 1);
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

    // Grounded ESD Workbench Mat (hidden during AR Mode so real desk shows through)
    const esdMat = createEsdWorkbenchMat(maxAniso);
    scene.add(esdMat);

    // Translucent AR Desk Calibration Grid + Real-World Shadow Catcher Plane
    const arDeskOverlay = createArDeskCalibrationGrid(maxAniso);
    scene.add(arDeskOverlay.group);

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

    let gizmoDragging = false;
    transformControls.addEventListener("dragging-changed", (event) => {
      gizmoDragging = Boolean(event.value);
      controls.enabled = !gizmoDragging && !(arActiveRef.current && arAlignmentRef.current.lockDeskAlignment);
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

    const applyBoardOpacity = (opacity: number) => {
      const clamped = Math.max(0.25, Math.min(1, opacity));
      const useGhost = clamped < 0.99;
      for (const grp of Object.values(boardGroups)) {
        grp.traverse((obj) => {
          if (!(obj instanceof THREE.Mesh) || obj.userData.isContactShadow) return;
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const mat of mats) {
            if (!mat) continue;
            if (mat.userData.__origTransparent === undefined) {
              mat.userData.__origTransparent = mat.transparent;
              mat.userData.__origOpacity = mat.opacity;
            }
            const origT = Boolean(mat.userData.__origTransparent);
            const origO = typeof mat.userData.__origOpacity === "number" ? mat.userData.__origOpacity : 1;
            mat.transparent = useGhost ? true : origT;
            mat.opacity = useGhost ? origO * clamped : origO;
            mat.needsUpdate = true;
          }
        });
      }
    };

    const applyArAlignmentToScene = (alignment: ArAlignmentState, animateCamera: boolean) => {
      arDeskOverlay.gridPlane.visible = alignment.showCalibrationGrid;
      applyBoardOpacity(alignment.modelOpacity);
      camera.fov = alignment.cameraFov;
      camera.updateProjectionMatrix();
      controls.enabled = !gizmoDragging && !alignment.lockDeskAlignment;
      const pose = computeArCameraPose(alignment);
      if (animateCamera) {
        _camGoalPos.set(...pose.position);
        _camGoalTarget.set(...pose.target);
        camAnimating = true;
      } else {
        camAnimating = false;
        camera.position.set(...pose.position);
        controls.target.set(...pose.target);
        controls.update();
      }
      requestRender();
    };

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
      setArMode: (enabled, alignment) => {
        arActiveRef.current = enabled;
        if (enabled) {
          scene.background = null;
          scene.fog = null;
          renderer.setClearColor(0x000000, 0);
          esdMat.visible = false;
          arDeskOverlay.group.visible = true;
          applyArAlignmentToScene(alignment, false);
        } else {
          scene.background = studioBg;
          scene.fog = studioFog;
          renderer.setClearColor(0x0b1220, 1);
          esdMat.visible = true;
          arDeskOverlay.group.visible = false;
          applyBoardOpacity(1.0);
          camera.fov = 42;
          camera.updateProjectionMatrix();
          controls.enabled = !gizmoDragging;
          _camGoalPos.set(...CAMERA_PRESETS.overview.pos);
          _camGoalTarget.set(...CAMERA_PRESETS.overview.target);
          camAnimating = true;
          requestRender();
        }
      },
      updateArAlignment: (alignment) => {
        if (!arActiveRef.current) return;
        applyArAlignmentToScene(alignment, false);
      },
      renderNowForSnapshot: () => {
        if (disposed) return null;
        renderer.render(scene, camera);
        return renderer.domElement;
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

  const stopCameraTracks = useCallback(() => {
    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        track.stop();
      }
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const exitArMode = useCallback(() => {
    stopCameraTracks();
    setDeskPhotoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setArError(null);
    setArStatus("off");
    setDockTab((curr) => (curr === "ar" ? "move" : curr));
    sceneApiRef.current?.setArMode(false, arAlignmentRef.current);
    setStatusFeed(
      lang === "ro"
        ? "Mod AR închis — ai revenit pe bancul 3D ESD."
        : "Exited AR Mode — returned to the 3D ESD workbench.",
    );
  }, [lang, stopCameraTracks]);

  const startArCamera = useCallback(
    async (preferredFacing?: ArFacingMode) => {
      const targetFacing = preferredFacing ?? arAlignmentRef.current.facingMode;
      stopCameraTracks();
      setDeskPhotoUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setArError(null);
      setArStatus("requesting");

      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
        setArStatus("error");
        setArError(describeCameraError(new Error("MediaDevices unavailable"), lang));
        return;
      }

      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: targetFacing },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
            audio: false,
          });
        } catch (firstErr) {
          if (firstErr instanceof Error && firstErr.name === "OverconstrainedError") {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          } else {
            throw firstErr;
          }
        }

        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {
            // Autoplay muted stream may resolve asynchronously
          });
        }

        const nextAlignment = clampArAlignment(
          { facingMode: targetFacing, mirrorVideo: targetFacing === "user" },
          arAlignmentRef.current,
        );
        arAlignmentRef.current = nextAlignment;
        setArAlignment(nextAlignment);
        setArStatus("live-camera");
        setDockTab("ar");
        setDockCollapsed(false);
        sceneApiRef.current?.setArMode(true, nextAlignment);
        setStatusFeed(
          lang === "ro"
            ? "Mod AR activ! Aliniază grila de 100 mm cu biroul tău fizic și mută plăcile 3D peste montajul real."
            : "AR Mode live! Align the 100 mm calibration grid with your physical desk and position 3D boards over your setup.",
        );
      } catch (err) {
        stopCameraTracks();
        setArStatus("error");
        setArError(describeCameraError(err, lang));
      }
    },
    [lang, stopCameraTracks],
  );

  const handleToggleArMode = useCallback(() => {
    if (arStatus === "off") {
      void startArCamera();
    } else {
      exitArMode();
    }
  }, [arStatus, exitArMode, startArCamera]);

  const handleArAlignmentChange = useCallback((patch: Partial<ArAlignmentState>) => {
    setArAlignment((prev) => {
      const next = clampArAlignment(patch, prev);
      arAlignmentRef.current = next;
      sceneApiRef.current?.updateArAlignment(next);
      return next;
    });
  }, []);

  const handleArPreset = useCallback((preset: ArPresetId) => {
    setArAlignment((prev) => {
      const next = applyArPreset(preset, prev);
      arAlignmentRef.current = next;
      sceneApiRef.current?.updateArAlignment(next);
      return next;
    });
  }, []);

  const handleArReset = useCallback(() => {
    setArAlignment((prev) => {
      const next = clampArAlignment({ facingMode: prev.facingMode, mirrorVideo: prev.mirrorVideo }, getDefaultArAlignment());
      arAlignmentRef.current = next;
      sceneApiRef.current?.updateArAlignment(next);
      return next;
    });
  }, []);

  const handleSwitchCamera = useCallback(() => {
    const nextFacing: ArFacingMode =
      arAlignmentRef.current.facingMode === "environment" ? "user" : "environment";
    void startArCamera(nextFacing);
  }, [startArCamera]);

  const handleDeskPhotoFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      stopCameraTracks();
      const url = URL.createObjectURL(file);
      setDeskPhotoUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setArError(null);
      setArStatus("desk-photo");
      setDockTab("ar");
      setDockCollapsed(false);
      sceneApiRef.current?.setArMode(true, arAlignmentRef.current);
      setStatusFeed(
        lang === "ro"
          ? "Fotografie birou încărcată în Mod AR — ajustează Scara, Înclinarea și Opacitatea X-Ray pentru aliniere."
          : "Desk photo loaded in AR Mode — adjust Real Scale, Desk Tilt, and X-Ray Opacity to align virtual hardware.",
      );
    },
    [lang, stopCameraTracks],
  );

  const handleCaptureArSnapshot = useCallback(() => {
    const glCanvas = sceneApiRef.current?.renderNowForSnapshot();
    if (!glCanvas) return;
    const outW = glCanvas.width;
    const outH = glCanvas.height;
    const composite = document.createElement("canvas");
    composite.width = outW;
    composite.height = outH;
    const ctx = composite.getContext("2d");
    if (!ctx) return;

    const drawCovered = (source: HTMLVideoElement | HTMLImageElement, srcW: number, srcH: number) => {
      if (!srcW || !srcH) return;
      const scale = Math.max(outW / srcW, outH / srcH);
      const dw = srcW * scale;
      const dh = srcH * scale;
      const dx = (outW - dw) / 2;
      const dy = (outH - dh) / 2;
      ctx.save();
      if (arAlignmentRef.current.mirrorVideo) {
        ctx.translate(outW, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(source, dx, dy, dw, dh);
      ctx.restore();
    };

    if (arStatus === "live-camera" && videoRef.current && videoRef.current.videoWidth > 0) {
      drawCovered(videoRef.current, videoRef.current.videoWidth, videoRef.current.videoHeight);
    } else if (arStatus === "desk-photo" && deskPhotoImgRef.current && deskPhotoImgRef.current.naturalWidth > 0) {
      drawCovered(
        deskPhotoImgRef.current,
        deskPhotoImgRef.current.naturalWidth,
        deskPhotoImgRef.current.naturalHeight,
      );
    }

    ctx.drawImage(glCanvas, 0, 0, outW, outH);
    const link = document.createElement("a");
    link.download = `esp-labs-ar-workbench-${Date.now()}.png`;
    link.href = composite.toDataURL("image/png");
    link.click();
    setSaveNotice(
      lang === "ro"
        ? "Captură AR salvată (PNG)!"
        : "AR workbench snapshot saved (PNG)!",
    );
    setTimeout(() => setSaveNotice(null), 3000);
  }, [arStatus, lang]);

  // Clean up camera stream and blob URLs on unmount
  useEffect(() => {
    return () => {
      stopCameraTracks();
    };
  }, [stopCameraTracks]);

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
  const isArVisible = arStatus === "live-camera" || arStatus === "desk-photo";

  return (
    <div className="space-y-4">
      {/* Hidden file input for optional desk photo AR fallback */}
      <input
        ref={deskPhotoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleDeskPhotoFile}
        className="hidden"
        aria-label={lang === "ro" ? "Încarcă fotografie birou AR" : "Upload AR desk photo"}
      />

      {/* Minimal Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
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
              ? "Plăci reproduse la scară reală (mm) pe care le poți muta în 3D, suprapune AR peste biroul real sau conecta prin USB-C / BLE."
              : "True-scale (mm) 3D boards you can move in 3D, overlay in AR onto your real desk, or bridge via USB-C / BLE."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleArMode}
            aria-pressed={arStatus !== "off"}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              arStatus !== "off"
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            {arStatus !== "off" ? <X className="w-4 h-4" /> : <ScanEye className="w-4 h-4" />}
            <span>
              {arStatus !== "off"
                ? lang === "ro"
                  ? "Ieși din Mod AR"
                  : "Exit AR Mode"
                : lang === "ro"
                  ? "Mod AR"
                  : "AR Mode"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowHardwareBridge((s) => !s)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              showHardwareBridge
                ? "bg-emerald-700 text-white"
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
      </div>

      {/* Collapsible Real Physical Hardware Bridge Drawer (Above 3D canvas so viewport stays unobstructed) */}
      {showHardwareBridge && (
        <RealHardwareDrawer
          lang={lang}
          onClose={() => setShowHardwareBridge(false)}
          onTelemetry={handleTelemetry}
        />
      )}

      {/* Unobstructed 3D / AR WebGL Viewport with Collapsible Bottom Control Dock */}
      <div
        data-ar-mode={arStatus}
        className="relative rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#0b1220] overflow-hidden h-[560px] sm:h-[640px]"
      >
        {/* Live Camera Video Feed Layer (Behind transparent Three.js WebGL canvas) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          aria-label={lang === "ro" ? "Flux cameră AR birou real" : "AR live desk camera feed"}
          className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-200 ${
            arStatus === "live-camera" ? "opacity-100" : "opacity-0 pointer-events-none"
          } ${arAlignment.mirrorVideo ? "-scale-x-100" : ""}`}
        />

        {/* Optional Desk Reference Photo Layer (Fallback when device has no camera) */}
        {arStatus === "desk-photo" && deskPhotoUrl && (
          <img
            ref={deskPhotoImgRef}
            src={deskPhotoUrl}
            alt={lang === "ro" ? "Birou fizic pentru aliniere AR" : "Physical desk for AR alignment"}
            className={`absolute inset-0 w-full h-full object-cover z-0 ${
              arAlignment.mirrorVideo ? "-scale-x-100" : ""
            }`}
          />
        )}

        {/* Isolated empty mount div for Three.js WebGL canvas */}
        <div
          ref={mountRef}
          data-testid="workbench-3d-canvas"
          className="relative z-10 w-full h-full cursor-grab active:cursor-grabbing"
        />

        {/* Requesting Camera Permission Overlay */}
        {arStatus === "requesting" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/85 p-4">
            <div className="max-w-md w-full rounded-2xl border border-emerald-500/40 bg-slate-950 p-5 text-center space-y-3 text-slate-100 shadow-2xl">
              <ScanEye className="w-8 h-8 text-emerald-400 mx-auto" />
              <h2 className="text-base font-bold">
                {lang === "ro" ? "Se solicită accesul la cameră..." : "Requesting camera access..."}
              </h2>
              <p className="text-xs text-slate-300">
                {lang === "ro"
                  ? "Confirmă permisiunea camerei în browser pentru a suprapune componentele 3D peste biroul tău fizic."
                  : "Approve camera permission in your browser to overlay the 3D boards directly onto your physical desk."}
              </p>
              <button
                type="button"
                onClick={exitArMode}
                className="px-4 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 text-xs font-semibold text-slate-200 cursor-pointer"
              >
                {lang === "ro" ? "Anulează" : "Cancel"}
              </button>
            </div>
          </div>
        )}

        {/* Camera Permission Denied / No Camera Fallback Overlay */}
        {arStatus === "error" && arError && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/85 p-4">
            <div className="max-w-md w-full rounded-2xl border border-amber-500/40 bg-slate-950 p-5 space-y-3 text-slate-100 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ScanEye className="w-5 h-5 text-amber-400 shrink-0" />
                  <h2 className="text-sm font-bold text-amber-300">{arError.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={exitArMode}
                  aria-label={lang === "ro" ? "Închide Mod AR" : "Close AR Mode"}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{arError.detail}</p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => void startArCamera()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{lang === "ro" ? "Reîncearcă Camera" : "Retry Camera"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => deskPhotoInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer"
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                  <span>{lang === "ro" ? "Încarcă Foto Birou" : "Upload Desk Photo"}</span>
                </button>
                <button
                  type="button"
                  onClick={exitArMode}
                  className="px-3 py-2 rounded-lg border border-slate-700 hover:border-slate-500 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  {lang === "ro" ? "Înapoi la 3D" : "Back to 3D"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Minimal Top-Left Spec & AR Status Bar (solid surface, zero backdrop-blur over WebGL) */}
        <div className="absolute top-3 left-3 z-20 max-w-lg rounded-xl border border-slate-700 bg-slate-950/95 px-3.5 py-2 text-slate-100">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            {isArVisible && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-[10px] font-mono uppercase tracking-wide text-white">
                {arStatus === "live-camera" ? "AR LIVE" : "AR PHOTO"}
              </span>
            )}
            <span className="text-cyan-400">{activeBoardMeta.name}</span>
            <span className="text-[11px] font-mono text-slate-400">
              {activeBoardMeta.sizeMm}
            </span>
            {isArVisible && (
              <div className="ml-auto flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCaptureArSnapshot}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[10px] font-semibold text-slate-100 cursor-pointer"
                >
                  <Download className="w-3 h-3 text-emerald-400" />
                  <span>{lang === "ro" ? "Captură AR" : "AR Snapshot"}</span>
                </button>
              </div>
            )}
          </div>
          <div className="text-[11px] text-slate-300 truncate">{statusFeed}</div>
          {saveNotice && (
            <div className="text-[11px] font-semibold text-emerald-400 pt-0.5">{saveNotice}</div>
          )}
        </div>

        {/* Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[min(940px,95%)] flex flex-col items-center">
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
                    ...(isArVisible
                      ? [{ id: "ar" as const, icon: ScanEye, label: lang === "ro" ? "Aliniere AR" : "AR Align" }]
                      : []),
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
                            ? tabItem.id === "ar"
                              ? "bg-emerald-600 text-white"
                              : "bg-cyan-600 text-white"
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

              {/* Tab 0: AR Real-Desk Calibration Controls */}
              {dockTab === "ar" && isArVisible && (
                <ArAlignControls
                  lang={lang}
                  alignment={arAlignment}
                  hasLiveCamera={arStatus === "live-camera"}
                  onChange={handleArAlignmentChange}
                  onPreset={handleArPreset}
                  onReset={handleArReset}
                  onSwitchCamera={handleSwitchCamera}
                />
              )}

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
