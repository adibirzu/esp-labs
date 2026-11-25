import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  Box,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  GitBranch,
  Hand,
  Lightbulb,
  Play,
  RotateCcw,
  RotateCw,
  Sliders,
  Sparkles,
  Square,
  Star,
  Volume2,
  VolumeX,
  Wand2,
  Wifi,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  CAP_COVERED_POS,
  CAP_OPEN_POS,
  JUNIOR_LESSONS,
  JUNIOR_MISSIONS,
  LDR_SENSOR_POS,
  MOOD_PALETTE,
  PIANO_NOTES,
  capPosFromCover01,
  clamp,
  computeLdrReading,
  computeRadarGateState,
  computeRingLedColors,
  computeSirenPhase,
  computeSmartFanState,
  getJuniorLesson,
  parseEditableCodeParams,
  type JuniorLessonId,
  type Point2D,
} from "../logic/junior-circuits";
import {
  buildJuniorLessonRig,
  createDraftingFloor,
  type JuniorLessonRig,
  type JuniorSceneState,
} from "../three/junior-scenes";
import type { Lang } from "../types";

interface JuniorExplorerStudioProps {
  lang: Lang;
  onRunSketch?: () => void;
  onOpenBench3D?: () => void;
}

type InfoTab = "overview" | "pinout" | "example" | "specs";

const DEFAULT_CAM_POS = new THREE.Vector3(6.05, 5.35, 7.25);
const DEFAULT_CAM_TARGET = new THREE.Vector3(0.25, 0.38, 0.22);

function JuniorSchematicSvg({
  lessonId,
  ldrAdc,
  lampOn,
  moodHex,
  litLeds,
  activeNote,
  sirenRed,
  sirenBlue,
  wifiLampOn,
  roverCm,
  gateOpen,
  gateAngleDeg,
  roomTempC,
  fanMode,
}: {
  lessonId: JuniorLessonId;
  ldrAdc: number;
  lampOn: boolean;
  moodHex: string;
  litLeds: number;
  activeNote: string | null;
  sirenRed: boolean;
  sirenBlue: boolean;
  wifiLampOn: boolean;
  roverCm: number;
  gateOpen: boolean;
  gateAngleDeg: number;
  roomTempC: number;
  fanMode: "off" | "eco" | "turbo";
}) {
  if (lessonId === "table-lamp") {
    return (
      <svg viewBox="0 0 260 112" className="w-full h-24 select-none" aria-label="Table Lamp LDR schematic">
        {/* 3V3 Rail */}
        <line x1="22" y1="16" x2="108" y2="16" stroke="#ef4444" strokeWidth="1.6" />
        <text x="16" y="19" fontSize="8" fontFamily="monospace" fill="#ef4444" fontWeight="700">3V3</text>
        {/* LDR */}
        <line x1="62" y1="16" x2="62" y2="34" stroke="#ef4444" strokeWidth="1.4" />
        <circle cx="62" cy="46" r="11" fill={lampOn ? "#1e293b" : "#fef3c7"} stroke="#f97316" strokeWidth="1.6" />
        <text x="62" y="49" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill={lampOn ? "#fde68a" : "#9a3412"} fontWeight="700">LDR</text>
        {/* Junction to GPIO34 */}
        <line x1="62" y1="57" x2="62" y2="74" stroke="#f59e0b" strokeWidth="1.5" />
        <circle cx="62" cy="66" r="2.6" fill="#f59e0b" />
        <line x1="62" y1="66" x2="124" y2="66" stroke="#f59e0b" strokeWidth="1.6" />
        {/* 10k to GND */}
        <rect x="55" y="74" width="14" height="20" rx="2" fill="none" stroke="#64748b" strokeWidth="1.4" />
        <text x="49" y="87" textAnchor="end" fontSize="7.5" fontFamily="monospace" fill="#64748b">10kΩ</text>
        <line x1="62" y1="94" x2="62" y2="104" stroke="#64748b" strokeWidth="1.4" />
        <line x1="54" y1="104" x2="70" y2="104" stroke="#64748b" strokeWidth="1.8" />
        {/* ESP32 Block */}
        <rect x="124" y="24" width="60" height="62" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
        <text x="154" y="48" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#f8fafc" fontWeight="700">ESP32</text>
        <text x="154" y="61" textAnchor="middle" fontSize="7.2" fontFamily="monospace" fill="#fbbf24">ADC:{ldrAdc}</text>
        <text x="154" y="74" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#38bdf8">IO34→IO26</text>
        {/* GPIO26 to Lamp */}
        <line x1="184" y1="52" x2="210" y2="52" stroke="#3b82f6" strokeWidth="1.6" />
        <rect x="200" y="46" width="18" height="12" rx="2" fill="#faf6ef" stroke="#3b82f6" strokeWidth="1.3" />
        <line x1="218" y1="52" x2="234" y2="52" stroke="#3b82f6" strokeWidth="1.5" />
        <circle cx="234" cy="68" r="13" fill={lampOn ? "#fbbf24" : "#334155"} stroke={lampOn ? "#f59e0b" : "#64748b"} strokeWidth="1.8" />
        <text x="234" y="71" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill={lampOn ? "#1e293b" : "#cbd5e1"} fontWeight="700">
          {lampOn ? "ON" : "OFF"}
        </text>
        <line x1="234" y1="81" x2="234" y2="104" stroke="#64748b" strokeWidth="1.4" />
        <line x1="226" y1="104" x2="242" y2="104" stroke="#64748b" strokeWidth="1.8" />
      </svg>
    );
  }

  if (lessonId === "mood-lamp") {
    return (
      <svg viewBox="0 0 260 112" className="w-full h-24 select-none" aria-label="Mood Lamp RGB schematic">
        <rect x="18" y="20" width="66" height="68" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
        <text x="51" y="50" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#f8fafc" fontWeight="700">ESP32</text>
        <text x="51" y="64" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill="#94a3b8">PWM 5kHz</text>
        {[
          { y: 34, pin: "IO12", col: "#ef4444" },
          { y: 54, pin: "IO13", col: "#10b981" },
          { y: 74, pin: "IO14", col: "#3b82f6" },
        ].map((ch) => (
          <g key={ch.pin}>
            <line x1="84" y1={ch.y} x2="184" y2={ch.y} stroke={ch.col} strokeWidth="1.8" />
            <rect x="118" y={ch.y - 5} width="26" height="10" rx="2" fill="#faf6ef" stroke={ch.col} strokeWidth="1.3" />
            <text x="98" y={ch.y - 3} fontSize="7" fontFamily="monospace" fill={ch.col}>{ch.pin}</text>
          </g>
        ))}
        <circle cx="212" cy="54" r="24" fill={moodHex} fillOpacity="0.88" stroke="#64748b" strokeWidth="1.6" />
        <text x="212" y="57" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#0f172a" fontWeight="700">RGB</text>
      </svg>
    );
  }

  if (lessonId === "fill-ring") {
    return (
      <svg viewBox="0 0 260 112" className="w-full h-24 select-none" aria-label="NeoPixel Ring schematic">
        <circle cx="42" cy="54" r="18" fill="none" stroke="#f59e0b" strokeWidth="2" />
        <text x="42" y="57" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#f59e0b" fontWeight="700">10kΩ</text>
        <line x1="60" y1="54" x2="96" y2="54" stroke="#f59e0b" strokeWidth="1.8" />
        <rect x="96" y="24" width="62" height="60" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
        <text x="127" y="50" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#f8fafc" fontWeight="700">ESP32</text>
        <text x="127" y="64" textAnchor="middle" fontSize="7.2" fontFamily="monospace" fill="#10b981">IO34→IO18</text>
        <line x1="158" y1="54" x2="192" y2="54" stroke="#10b981" strokeWidth="1.8" />
        <circle cx="218" cy="54" r="22" fill="none" stroke="#334155" strokeWidth="5" />
        <circle
          cx="218"
          cy="54"
          r="22"
          fill="none"
          stroke="#10b981"
          strokeWidth="5"
          strokeDasharray={`${(litLeds / 12) * 138} 138`}
          transform="rotate(-90 218 54)"
        />
        <text x="218" y="57" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#10b981" fontWeight="700">
          {litLeds}/12
        </text>
      </svg>
    );
  }

  if (lessonId === "mini-piano") {
    return (
      <svg viewBox="0 0 260 112" className="w-full h-24 select-none" aria-label="Mini Piano schematic">
        {PIANO_NOTES.map((n, i) => (
          <g key={n.note}>
            <rect
              x="16"
              y={14 + i * 22}
              width="38"
              height="16"
              rx="3"
              fill={activeNote === n.note ? n.color : "none"}
              stroke={n.color}
              strokeWidth="1.5"
            />
            <text x="35" y={25 + i * 22} textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill={activeNote === n.note ? "#fff" : n.color} fontWeight="700">
              {n.note}
            </text>
            <line x1="54" y1={22 + i * 22} x2="96" y2={22 + i * 22} stroke={n.color} strokeWidth="1.4" />
          </g>
        ))}
        <rect x="96" y="18" width="64" height="74" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
        <text x="128" y="50" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#f8fafc" fontWeight="700">ESP32</text>
        <text x="128" y="64" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill="#a78bfa">LEDC IO25</text>
        <line x1="160" y1="54" x2="196" y2="54" stroke="#8b5cf6" strokeWidth="1.8" />
        <circle cx="218" cy="54" r="20" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2" />
        <text x="218" y="57" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#e2e8f0" fontWeight="700">
          {activeNote ?? "PIEZO"}
        </text>
      </svg>
    );
  }

  if (lessonId === "siren") {
    return (
      <svg viewBox="0 0 260 112" className="w-full h-24 select-none" aria-label="Siren schematic">
        <rect x="24" y="22" width="66" height="66" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
        <text x="57" y="52" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#f8fafc" fontWeight="700">ESP32</text>
        <text x="57" y="66" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#94a3b8">IO26·27·25</text>
        <line x1="90" y1="34" x2="188" y2="34" stroke="#ef4444" strokeWidth="1.8" />
        <circle cx="206" cy="34" r="12" fill={sirenRed ? "#ef4444" : "#334155"} stroke="#ef4444" strokeWidth="1.6" />
        <line x1="90" y1="76" x2="188" y2="76" stroke="#3b82f6" strokeWidth="1.8" />
        <circle cx="206" cy="76" r="12" fill={sirenBlue ? "#3b82f6" : "#334155"} stroke="#3b82f6" strokeWidth="1.6" />
        <text x="206" y="37" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#fff">R</text>
        <text x="206" y="79" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#fff">B</text>
      </svg>
    );
  }

  if (lessonId === "robot-gate") {
    return (
      <svg viewBox="0 0 260 112" className="w-full h-24 select-none" aria-label="Robot Radar Gate schematic">
        <rect x="14" y="24" width="54" height="60" rx="6" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="1.5" />
        <circle cx="30" cy="48" r="8" fill="#dbe2ea" stroke="#1e3a8a" strokeWidth="1.2" />
        <circle cx="52" cy="48" r="8" fill="#dbe2ea" stroke="#1e3a8a" strokeWidth="1.2" />
        <text x="41" y="73" textAnchor="middle" fontSize="7.2" fontFamily="monospace" fill="#eff6ff" fontWeight="700">
          {roverCm}cm
        </text>
        <line x1="68" y1="42" x2="98" y2="42" stroke="#06b6d4" strokeWidth="1.6" />
        <line x1="68" y1="64" x2="98" y2="64" stroke="#8b5cf6" strokeWidth="1.6" />
        <rect x="98" y="22" width="64" height="64" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
        <text x="130" y="48" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#f8fafc" fontWeight="700">ESP32</text>
        <text x="130" y="62" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#38bdf8">IO5/18→13</text>
        <line x1="162" y1="54" x2="194" y2="54" stroke="#f97316" strokeWidth="1.8" />
        <rect x="194" y="34" width="52" height="40" rx="6" fill={gateOpen ? "#059669" : "#334155"} stroke="#f97316" strokeWidth="1.6" />
        <text x="220" y="51" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill="#ffffff" fontWeight="700">SG90</text>
        <text x="220" y="64" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill="#fde68a" fontWeight="700">
          {gateAngleDeg}°
        </text>
      </svg>
    );
  }

  if (lessonId === "smart-fan") {
    const fanColor = fanMode === "turbo" ? "#f97316" : fanMode === "eco" ? "#06b6d4" : "#10b981";
    return (
      <svg viewBox="0 0 260 112" className="w-full h-24 select-none" aria-label="Smart Plant Fan schematic">
        <rect x="16" y="22" width="52" height="64" rx="6" fill="#f8fafc" stroke="#10b981" strokeWidth="1.6" />
        <text x="42" y="46" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#0f172a" fontWeight="700">DHT22</text>
        <text x="42" y="64" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#059669" fontWeight="700">
          {roomTempC}°C
        </text>
        <line x1="68" y1="54" x2="98" y2="54" stroke="#10b981" strokeWidth="1.8" />
        <rect x="98" y="22" width="64" height="64" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
        <text x="130" y="48" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#f8fafc" fontWeight="700">ESP32</text>
        <text x="130" y="62" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#38bdf8">IO4→IO21</text>
        <line x1="162" y1="54" x2="196" y2="54" stroke="#0ea5e9" strokeWidth="1.8" />
        <circle cx="220" cy="54" r="22" fill="#1e293b" stroke={fanColor} strokeWidth="2.4" />
        <text x="220" y="57" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill="#f8fafc" fontWeight="700">
          {fanMode.toUpperCase()}
        </text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 260 112" className="w-full h-24 select-none" aria-label="Wi-Fi Web Switch schematic">
      <rect x="14" y="22" width="44" height="68" rx="6" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.6" />
      <text x="36" y="52" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill="#38bdf8" fontWeight="700">PHONE</text>
      <text x="36" y="66" textAnchor="middle" fontSize="6.5" fontFamily="monospace" fill="#94a3b8">/toggle</text>
      <path d="M 66 44 Q 82 54 66 64" fill="none" stroke="#06b6d4" strokeWidth="1.8" />
      <path d="M 76 38 Q 96 54 76 70" fill="none" stroke="#06b6d4" strokeWidth="1.8" />
      <rect x="104" y="24" width="64" height="62" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
      <text x="136" y="50" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#f8fafc" fontWeight="700">ESP32</text>
      <text x="136" y="64" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#38bdf8">HTTP 200</text>
      <line x1="168" y1="54" x2="204" y2="54" stroke="#f59e0b" strokeWidth="1.8" />
      <circle cx="222" cy="54" r="15" fill={wifiLampOn ? "#fbbf24" : "#334155"} stroke="#f59e0b" strokeWidth="1.8" />
      <text x="222" y="57" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill={wifiLampOn ? "#1e293b" : "#cbd5e1"} fontWeight="700">
        {wifiLampOn ? "ON" : "OFF"}
      </text>
    </svg>
  );
}

export function JuniorExplorerStudio({
  lang,
  onRunSketch,
  onOpenBench3D,
}: JuniorExplorerStudioProps) {
  const [lessonId, setLessonId] = useState<JuniorLessonId>("table-lamp");
  const [infoTab, setInfoTab] = useState<InfoTab>("overview");
  const [selectedCalloutId, setSelectedCalloutId] = useState<string>("cap");
  const [showSchematic, setShowSchematic] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<JuniorLessonId[]>([]);

  // Per-lesson editable code map
  const [codeByLesson, setCodeByLesson] = useState<Record<JuniorLessonId, string>>(() => {
    const map = {} as Record<JuniorLessonId, string>;
    for (const l of JUNIOR_LESSONS) {
      map[l.id] = l.defaultCode;
    }
    return map;
  });

  // Live hardware states
  const [isRunning, setIsRunning] = useState(true);
  const [capPos, setCapPos] = useState<Point2D>(CAP_OPEN_POS);
  const [isDraggingCap, setIsDraggingCap] = useState(false);

  const [moodHex, setMoodHex] = useState<string>("#ff9f43");
  const [moodOn, setMoodOn] = useState<boolean>(true);
  const [moodIntensity, setMoodIntensity] = useState<number>(0.85);

  const [potValue01, setPotValue01] = useState<number>(0.58);

  const [activePianoKey, setActivePianoKey] = useState<number | null>(null);
  const [soundPulse, setSoundPulse] = useState<number>(0);

  const [sirenArmed, setSirenArmed] = useState<boolean>(false);
  const [sirenStep, setSirenStep] = useState<number>(0);

  const [wifiLampOn, setWifiLampOn] = useState<boolean>(false);
  const [wifiPulse, setWifiPulse] = useState<number>(0);

  const [roverDistanceCm, setRoverDistanceCm] = useState<number>(46);
  const [roomTempC, setRoomTempC] = useState<number>(24);
  const [fanSpinAngle, setFanSpinAngle] = useState<number>(0);

  const [copied, setCopied] = useState(false);
  const [serialLog, setSerialLog] = useState<string[]>([
    lang === "ro"
      ? "[115200] ESP32 pornit · Trage capacul peste Senzorul de Lumină (GPIO 34)!"
      : "[115200] ESP32 booted · Drag the black Cap over the Light Sensor (GPIO 34)!",
  ]);

  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );

  // Refs for Three.js imperative control
  const mountRef = useRef<HTMLDivElement | null>(null);
  const lessonsStripRef = useRef<HTMLDivElement | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rigRef = useRef<JuniorLessonRig | null>(null);
  const floorRef = useRef<{ mesh: THREE.Mesh; setTheme: (d: boolean) => void } | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const requestRenderRef = useRef<() => void>(() => {});
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sceneStateRef = useRef<JuniorSceneState | null>(null);
  const draggingCapRef = useRef(false);

  const lesson = useMemo(() => getJuniorLesson(lessonId), [lessonId]);
  const activeCode = codeByLesson[lessonId];
  const codeParams = useMemo(() => parseEditableCodeParams(activeCode), [activeCode]);

  const ldrReading = useMemo(
    () => computeLdrReading(capPos, codeParams.threshold, LDR_SENSOR_POS),
    [capPos, codeParams.threshold],
  );
  const effectiveTableLampOn = isRunning && ldrReading.lampOn;

  const ringState = useMemo(
    () => computeRingLedColors(potValue01, codeParams.maxRingLeds, codeParams.ringMode),
    [potValue01, codeParams.maxRingLeds, codeParams.ringMode],
  );

  const sirenState = useMemo(() => {
    if (!sirenArmed) return { redOn: false, blueOn: false, freqHz: 0 };
    return computeSirenPhase(sirenStep, codeParams.sirenBaseFreq, codeParams.sirenSweepHz);
  }, [sirenArmed, sirenStep, codeParams.sirenBaseFreq, codeParams.sirenSweepHz]);

  const gateState = useMemo(
    () => computeRadarGateState(roverDistanceCm, codeParams.gateTriggerCm, codeParams.gateOpenAngle),
    [roverDistanceCm, codeParams.gateTriggerCm, codeParams.gateOpenAngle],
  );

  const fanState = useMemo(
    () => computeSmartFanState(roomTempC, codeParams.fanOnTempC, codeParams.fanTurboTempC),
    [roomTempC, codeParams.fanOnTempC, codeParams.fanTurboTempC],
  );

  const markCompleted = useCallback((id: JuniorLessonId) => {
    setCompletedLessons((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const pushSerial = useCallback((line: string) => {
    setSerialLog((prev) => [...prev.slice(-2), line]);
  }, []);

  const playTone = useCallback(
    (freq: number, durationSec = 0.2) => {
      if (!soundEnabled || freq <= 0) return;
      try {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) return;
        if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") void ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationSec);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + durationSec + 0.02);
      } catch {
        // Ignore audio restrictions in headless environments
      }
    },
    [soundEnabled],
  );

  const triggerPianoKey = useCallback(
    (idx: number) => {
      const note = PIANO_NOTES[idx];
      if (!note) return;
      setActivePianoKey(idx);
      setSoundPulse(1);
      playTone(note.freq, 0.24);
      markCompleted("mini-piano");
      pushSerial(
        lang === "ro"
          ? `[PIANO] ${note.pin} LOW -> Nota ${note.note} (${Math.round(note.freq)} Hz)`
          : `[PIANO] ${note.pin} LOW -> Note ${note.note} (${Math.round(note.freq)} Hz)`,
      );
      window.setTimeout(() => {
        setActivePianoKey((cur) => (cur === idx ? null : cur));
        setSoundPulse(0);
      }, 260);
    },
    [lang, markCompleted, playTone, pushSerial],
  );

  const triggerWifiToggle = useCallback(() => {
    setWifiLampOn((prev) => {
      const next = !prev;
      pushSerial(
        `[HTTP] GET http://${codeParams.wifiHost}/toggle -> 200 OK · LAMP ${next ? "ON" : "OFF"}`,
      );
      return next;
    });
    setWifiPulse(1);
    markCompleted("wifi-switch");
    window.setTimeout(() => setWifiPulse(0), 520);
  }, [codeParams.wifiHost, markCompleted, pushSerial]);

  // Keep latest sceneState in ref for Three.js updates
  const currentSceneState: JuniorSceneState = useMemo(
    () => ({
      lessonId,
      isDark: isDarkTheme,
      capPos,
      lampOn: effectiveTableLampOn,
      isDraggingCap,
      moodHex,
      moodIntensity,
      moodOn: isRunning && moodOn,
      potValue01,
      ringColors: isRunning ? ringState.colors : Array(12).fill(null),
      activePianoKey,
      soundPulse,
      sirenArmed,
      sirenRedOn: sirenState.redOn,
      sirenBlueOn: sirenState.blueOn,
      wifiLampOn,
      wifiPulse,
      wifiHost: codeParams.wifiHost,
      roverDistanceCm,
      gateAngleDeg: isRunning ? gateState.servoAngleDeg : 0,
      gateOpen: isRunning && gateState.gateOpen,
      roomTempC,
      fanMode: isRunning ? fanState.mode : "off",
      fanSpinAngle,
    }),
    [
      lessonId,
      isDarkTheme,
      capPos,
      effectiveTableLampOn,
      isDraggingCap,
      moodHex,
      moodIntensity,
      isRunning,
      moodOn,
      potValue01,
      ringState.colors,
      activePianoKey,
      soundPulse,
      sirenArmed,
      sirenState.redOn,
      sirenState.blueOn,
      wifiLampOn,
      wifiPulse,
      codeParams.wifiHost,
      roverDistanceCm,
      gateState.servoAngleDeg,
      gateState.gateOpen,
      roomTempC,
      fanState.mode,
      fanSpinAngle,
    ],
  );
  sceneStateRef.current = currentSceneState;

  // Watch global Tailwind dark mode class changes
  useEffect(() => {
    if (typeof document === "undefined") return;
    const syncTheme = () => {
      setIsDarkTheme(document.documentElement.classList.contains("dark"));
    };
    const obs = new MutationObserver(syncTheme);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Log & mark Table Lamp completed when lamp toggles ON via covering LDR
  const prevLampRef = useRef(false);
  useEffect(() => {
    if (lessonId !== "table-lamp") return;
    if (effectiveTableLampOn !== prevLampRef.current) {
      prevLampRef.current = effectiveTableLampOn;
      if (effectiveTableLampOn) {
        markCompleted("table-lamp");
        pushSerial(
          lang === "ro"
            ? `[ADC34] ${ldrReading.adc} (< ${codeParams.threshold}) -> GPIO26 HIGH · Lampă APRINSĂ!`
            : `[ADC34] ${ldrReading.adc} (< ${codeParams.threshold}) -> GPIO26 HIGH · Lamp ON!`,
        );
      } else {
        pushSerial(
          lang === "ro"
            ? `[ADC34] ${ldrReading.adc} (>= ${codeParams.threshold}) -> GPIO26 LOW · Lampă STINSĂ`
            : `[ADC34] ${ldrReading.adc} (>= ${codeParams.threshold}) -> GPIO26 LOW · Lamp OFF`,
        );
      }
    }
  }, [
    effectiveTableLampOn,
    lessonId,
    ldrReading.adc,
    codeParams.threshold,
    lang,
    markCompleted,
    pushSerial,
  ]);

  // Mood lamp gentle breathing tick when running
  useEffect(() => {
    if (lessonId !== "mood-lamp" || !isRunning || !moodOn) return;
    let phase = 0;
    const id = window.setInterval(() => {
      phase += 0.35;
      setMoodIntensity(0.5 + 0.5 * Math.sin(phase));
    }, Math.max(180, Math.round(codeParams.breatheMs / 10)));
    return () => window.clearInterval(id);
  }, [lessonId, isRunning, moodOn, codeParams.breatheMs]);

  // Siren alternating beacon + tone interval
  useEffect(() => {
    if (lessonId !== "siren" || !sirenArmed) return;
    const id = window.setInterval(() => {
      setSirenStep((s) => {
        const next = s + 1;
        const p = computeSirenPhase(next, codeParams.sirenBaseFreq, codeParams.sirenSweepHz);
        playTone(p.freqHz, Math.min(0.22, codeParams.sirenStepMs / 1200));
        return next;
      });
    }, codeParams.sirenStepMs);
    return () => window.clearInterval(id);
  }, [lessonId, sirenArmed, codeParams.sirenBaseFreq, codeParams.sirenSweepHz, codeParams.sirenStepMs, playTone]);

  // Lightweight Smart Plant Fan rotor rotation tick (only active during smart-fan when spinning)
  useEffect(() => {
    if (lessonId !== "smart-fan" || !isRunning || fanState.mode === "off") return;
    const stepRad = fanState.mode === "turbo" ? 0.65 : 0.34;
    const id = window.setInterval(() => {
      setFanSpinAngle((a) => (a + stepRad) % (Math.PI * 2));
    }, 120);
    return () => window.clearInterval(id);
  }, [lessonId, isRunning, fanState.mode]);

  // Sync rig updates to Three.js & request a single coalesced render
  useEffect(() => {
    if (rigRef.current) {
      rigRef.current.update(currentSceneState);
      requestRenderRef.current();
    }
  }, [currentSceneState]);

  // Sync theme background + floor texture
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(isDarkTheme ? "#0f172a" : "#faf6ef");
    }
    if (floorRef.current) {
      floorRef.current.setTheme(isDarkTheme);
    }
    requestRenderRef.current();
  }, [isDarkTheme]);

  // Swap active 3D lesson rig imperatively without remounting WebGL
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (rigRef.current) {
      scene.remove(rigRef.current.root);
      rigRef.current.dispose();
      rigRef.current = null;
    }
    const nextRig = buildJuniorLessonRig(lessonId);
    if (sceneStateRef.current) {
      nextRig.update(sceneStateRef.current);
    }
    scene.add(nextRig.root);
    rigRef.current = nextRig;
    requestRenderRef.current();

    const firstCallout = getJuniorLesson(lessonId).callouts[0];
    if (firstCallout) setSelectedCalloutId(firstCallout.id);
  }, [lessonId]);

  // Mount persistent Three.js WebGL stage once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = Math.max(container.clientWidth, 420);
    const height = Math.max(container.clientHeight, 420);

    // Software WebGL detection for smooth headless & low-end GPU rendering
    const probeCanvas = document.createElement("canvas");
    const gl = probeCanvas.getContext("webgl2") || probeCanvas.getContext("webgl");
    let rendererStr = "";
    if (gl) {
      const dbg = gl.getExtension("WEBGL_debug_renderer_info");
      if (dbg) rendererStr = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "");
    }
    const isSoftwareGl = /swiftshader|llvmpipe|mesa|softpipe/i.test(rendererStr);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: "high-performance",
      alpha: false,
    });
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDarkTheme ? "#0f172a" : "#faf6ef");
    sceneRef.current = scene;

    // Warm architectural studio environment
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.72;

    // Soft studio key + fill lights
    const hemi = new THREE.HemisphereLight(0xfff9ee, 0xcbd5e1, 0.95);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff5e4, 1.35);
    keyLight.position.set(6, 10, 7);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 26;
      keyLight.shadow.camera.left = -6;
      keyLight.shadow.camera.right = 6;
      keyLight.shadow.camera.top = 6;
      keyLight.shadow.camera.bottom = -6;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.45);
    fillLight.position.set(-6, 5, -5);
    scene.add(fillLight);

    // Warm architectural drafting paper grid floor
    const floor = createDraftingFloor(isDarkTheme);
    scene.add(floor.mesh);
    floorRef.current = floor;

    // Isometric-feel camera + OrbitControls
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.2, 60);
    camera.position.copy(DEFAULT_CAM_POS);
    camera.lookAt(DEFAULT_CAM_TARGET);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(DEFAULT_CAM_TARGET);
    controls.enableDamping = false;
    controls.minDistance = 4.2;
    controls.maxDistance = 15.5;
    controls.maxPolarAngle = Math.PI * 0.46;
    controls.minPolarAngle = 0.25;
    controls.update();
    controlsRef.current = controls;

    // Build initial rig (Table Lamp)
    const initialRig = buildJuniorLessonRig(lessonId);
    if (sceneStateRef.current) {
      initialRig.update(sceneStateRef.current);
    }
    scene.add(initialRig.root);
    rigRef.current = initialRig;

    // Coalesced on-demand renderer with WebGL fence polling on software GL
    let disposed = false;
    let dirty = true;
    let rafId = 0;

    const drawOnce = () => {
      rafId = 0;
      if (disposed || !dirty) return;
      dirty = false;
      renderer.render(scene, camera);
    };

    const requestRender = () => {
      if (disposed) return;
      dirty = true;
      if (!rafId) {
        rafId = window.requestAnimationFrame(drawOnce);
      }
    };
    requestRenderRef.current = requestRender;
    controls.addEventListener("change", requestRender);
    requestRender();

    // Interactive Pointer Raycasting: Drag "The Cap" OR Click 3D Props
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.24);
    const planeHit = new THREE.Vector3();
    let pointerDownPos = { x: 0, y: 0 };

    const setPointerFromEvent = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
      if (!rigRef.current) return;
      setPointerFromEvent(e);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(rigRef.current.root.children, true);
      const capHit = hits.find((h) => h.object.userData?.dragId === "cap");
      if (capHit) {
        draggingCapRef.current = true;
        setIsDraggingCap(true);
        setSelectedCalloutId("cap");
        controls.enabled = false;
        renderer.domElement.setPointerCapture(e.pointerId);
        renderer.domElement.style.cursor = "grabbing";
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!rigRef.current) return;
      setPointerFromEvent(e);
      raycaster.setFromCamera(pointer, camera);

      if (draggingCapRef.current) {
        if (raycaster.ray.intersectPlane(dragPlane, planeHit)) {
          const nx = clamp(planeHit.x, -3.1, 1.25);
          const nz = clamp(planeHit.z, -0.75, 2.35);
          // Magnetic snap gently onto LDR sensor when within 0.36 units
          const d = Math.hypot(nx - LDR_SENSOR_POS.x, nz - LDR_SENSOR_POS.z);
          if (d < 0.36) {
            setCapPos({ x: LDR_SENSOR_POS.x, z: LDR_SENSOR_POS.z });
          } else {
            setCapPos({ x: Number(nx.toFixed(3)), z: Number(nz.toFixed(3)) });
          }
        }
        return;
      }

      const hits = raycaster.intersectObjects(rigRef.current.root.children, true);
      const interactive = hits.find(
        (h) => h.object.userData?.dragId || h.object.userData?.clickId,
      );
      renderer.domElement.style.cursor = interactive
        ? interactive.object.userData?.dragId
          ? "grab"
          : "pointer"
        : "default";
    };

    const onPointerUp = (e: PointerEvent) => {
      if (draggingCapRef.current) {
        draggingCapRef.current = false;
        setIsDraggingCap(false);
        controls.enabled = true;
        renderer.domElement.releasePointerCapture(e.pointerId);
        renderer.domElement.style.cursor = "grab";
        return;
      }

      // Check for crisp click (< 6px drag distance) on interactive 3D props
      const distMoved = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (distMoved > 6 || !rigRef.current) return;

      setPointerFromEvent(e);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(rigRef.current.root.children, true);
      if (hits.length === 0) return;

      const clickHit = hits.find((h) => h.object.userData?.clickId);
      const calloutHit = hits.find((h) => h.object.userData?.calloutId);
      if (calloutHit?.object.userData?.calloutId) {
        setSelectedCalloutId(String(calloutHit.object.userData.calloutId));
      }

      const clickId = clickHit?.object.userData?.clickId as string | undefined;
      if (!clickId) return;

      if (clickId === "mood-toggle") {
        setMoodHex((cur) => {
          const idx = MOOD_PALETTE.findIndex((p) => p.hex.toLowerCase() === cur.toLowerCase());
          const next = MOOD_PALETTE[(idx + 1) % MOOD_PALETTE.length];
          return next.hex;
        });
        setMoodOn(true);
        markCompleted("mood-lamp");
      } else if (clickId === "pot-step") {
        setPotValue01((cur) => {
          const next = cur >= 0.95 ? 0 : Number(Math.min(1, cur + 0.25).toFixed(2));
          return next;
        });
        markCompleted("fill-ring");
      } else if (clickId.startsWith("piano-")) {
        const keyIdx = Number.parseInt(clickId.replace("piano-", ""), 10);
        if (Number.isFinite(keyIdx)) triggerPianoKey(keyIdx);
      } else if (clickId === "siren-toggle") {
        setSirenArmed((prev) => !prev);
        markCompleted("siren");
      } else if (clickId === "wifi-toggle") {
        triggerWifiToggle();
      } else if (clickId === "rover-step") {
        setRoverDistanceCm((cur) => (cur <= 22 ? 54 : 14));
        markCompleted("robot-gate");
      } else if (clickId === "fan-boost") {
        setRoomTempC((cur) => (cur < 28 ? 29 : cur < 33 ? 35 : 23));
        markCompleted("smart-fan");
      }
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    // ResizeObserver for crisp layout scaling
    const ro = new ResizeObserver(() => {
      if (disposed || !container) return;
      const w = Math.max(container.clientWidth, 320);
      const h = Math.max(container.clientHeight, 320);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    });
    ro.observe(container);

    return () => {
      disposed = true;
      if (rafId) window.cancelAnimationFrame(rafId);
      ro.disconnect();
      controls.removeEventListener("change", requestRender);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      controls.dispose();
      if (rigRef.current) {
        rigRef.current.dispose();
        rigRef.current = null;
      }
      floor.mesh.geometry.dispose();
      (floor.mesh.material as THREE.MeshStandardMaterial).map?.dispose();
      (floor.mesh.material as THREE.Material).dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Camera toolbar controls
  const rotateCamera = (angleRad: number) => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;
    const offset = cam.position.clone().sub(ctrl.target);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleRad);
    cam.position.copy(ctrl.target).add(offset);
    ctrl.update();
    requestRenderRef.current();
  };

  const zoomCamera = (factor: number) => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;
    const offset = cam.position.clone().sub(ctrl.target);
    const len = clamp(offset.length() * factor, 4.4, 14.5);
    offset.setLength(len);
    cam.position.copy(ctrl.target).add(offset);
    ctrl.update();
    requestRenderRef.current();
  };

  const resetCamera = () => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;
    cam.position.copy(DEFAULT_CAM_POS);
    ctrl.target.copy(DEFAULT_CAM_TARGET);
    ctrl.update();
    requestRenderRef.current();
  };

  // Run edited code button (orange ▶ button matching learn-esp32)
  const handleRunCode = () => {
    const parsed = parseEditableCodeParams(activeCode);
    setIsRunning(true);
    markCompleted(lessonId);
    onRunSketch?.();

    if (lessonId === "table-lamp") {
      pushSerial(
        lang === "ro"
          ? `[RUN] Cod aplicat! THRESHOLD = ${parsed.threshold} · ADC curent = ${ldrReading.adc}`
          : `[RUN] Code flashed! THRESHOLD = ${parsed.threshold} · Current ADC = ${ldrReading.adc}`,
      );
    } else if (lessonId === "mood-lamp") {
      setMoodHex(parsed.moodColorHex);
      setMoodOn(true);
      pushSerial(`[RUN] Mood Lamp -> ${parsed.moodColorHex} · cycle ${parsed.breatheMs} ms`);
    } else if (lessonId === "fill-ring") {
      const modeName = parsed.ringMode === 0 ? "Cyan" : parsed.ringMode === 2 ? "Amber" : "Rainbow";
      pushSerial(`[RUN] NeoPixel Ring -> MAX_LEDS=${parsed.maxRingLeds} · Mode=${modeName}`);
    } else if (lessonId === "mini-piano") {
      pushSerial(
        lang === "ro"
          ? `[RUN] Redare melodie C4-E4-G4-C5 (${parsed.pianoTempoMs} ms/notă)...`
          : `[RUN] Playing melody C4-E4-G4-C5 (${parsed.pianoTempoMs} ms/note)...`,
      );
      [0, 1, 2, 3].forEach((k, step) => {
        window.setTimeout(() => triggerPianoKey(k), step * parsed.pianoTempoMs);
      });
    } else if (lessonId === "siren") {
      setSirenArmed(true);
      pushSerial(
        `[RUN] Siren ARMED · ${parsed.sirenBaseFreq}/${parsed.sirenBaseFreq + parsed.sirenSweepHz} Hz`,
      );
    } else if (lessonId === "wifi-switch") {
      triggerWifiToggle();
    } else if (lessonId === "robot-gate") {
      const nextDist = roverDistanceCm > parsed.gateTriggerCm ? Math.max(12, parsed.gateTriggerCm - 10) : roverDistanceCm;
      setRoverDistanceCm(nextDist);
      const nextGate = computeRadarGateState(nextDist, parsed.gateTriggerCm, parsed.gateOpenAngle);
      pushSerial(
        `[SONAR] ${nextDist} cm (echo ${nextGate.echoUs} µs) -> SG90 ${nextGate.servoAngleDeg}° (${nextGate.gateOpen ? "OPEN" : "CLOSED"})`,
      );
    } else if (lessonId === "smart-fan") {
      const nextTemp = roomTempC < parsed.fanOnTempC ? parsed.fanOnTempC + 2 : roomTempC;
      setRoomTempC(nextTemp);
      const nextFan = computeSmartFanState(nextTemp, parsed.fanOnTempC, parsed.fanTurboTempC);
      pushSerial(
        `[DHT22] ${nextTemp}°C -> PWM ${nextFan.dutyPct}% (${nextFan.mode.toUpperCase()} · ${nextFan.rpm} RPM)`,
      );
    }
  };

  // 1-click kid-friendly Auto-Demo for the active lesson mission
  const handleDemoMission = () => {
    setIsRunning(true);
    markCompleted(lessonId);
    if (lessonId === "table-lamp") {
      const isCovered = ldrReading.coverage01 > 0.7;
      setCapPos(isCovered ? CAP_OPEN_POS : CAP_COVERED_POS);
    } else if (lessonId === "mood-lamp") {
      setMoodHex((cur) => {
        const idx = MOOD_PALETTE.findIndex((p) => p.hex.toLowerCase() === cur.toLowerCase());
        return MOOD_PALETTE[(idx + 1) % MOOD_PALETTE.length].hex;
      });
      setMoodOn(true);
    } else if (lessonId === "fill-ring") {
      setPotValue01((cur) => (cur >= 0.85 ? 0.35 : 0.92));
    } else if (lessonId === "mini-piano") {
      [0, 1, 2, 3].forEach((k, step) => {
        window.setTimeout(() => triggerPianoKey(k), step * 240);
      });
    } else if (lessonId === "siren") {
      setSirenArmed((v) => !v);
    } else if (lessonId === "wifi-switch") {
      triggerWifiToggle();
    } else if (lessonId === "robot-gate") {
      const next = roverDistanceCm <= codeParams.gateTriggerCm ? 56 : 14;
      setRoverDistanceCm(next);
      pushSerial(
        next <= codeParams.gateTriggerCm
          ? `[MISSION] Rover at ${next} cm -> Sonar OPENED Servo Gate (${codeParams.gateOpenAngle}°)!`
          : `[MISSION] Rover backed up to ${next} cm -> Servo Gate CLOSED (0°).`,
      );
    } else if (lessonId === "smart-fan") {
      const next = roomTempC < codeParams.fanOnTempC ? codeParams.fanTurboTempC + 2 : 22;
      setRoomTempC(next);
      pushSerial(
        next >= codeParams.fanOnTempC
          ? `[MISSION] Greenhouse warmed to ${next}°C -> Cooling Fan TURBO!`
          : `[MISSION] Greenhouse cooled to ${next}°C -> Fan resting.`,
      );
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(activeCode).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const handleResetCode = () => {
    setCodeByLesson((prev) => ({ ...prev, [lessonId]: lesson.defaultCode }));
  };

  const selectedCallout =
    lesson.callouts.find((c) => c.id === selectedCalloutId) ?? lesson.callouts[0];

  const coverSliderPct = Math.round(ldrReading.coverage01 * 100);

  return (
    <section
      aria-label={lang === "ro" ? "Explorator Junior Studio 3D" : "Junior Explorer 3D Studio"}
      className="rounded-2xl border border-[#e5dccb] dark:border-slate-700 bg-[#faf6ef] dark:bg-[#0b1220] overflow-hidden shadow-sm"
    >
      {/* Top Studio Header Bar */}
      <div className="px-5 py-3 border-b border-[#e5dccb] dark:border-slate-800 bg-[#f4ede0] dark:bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <Sparkles className="w-4 h-4 text-orange-600 dark:text-amber-400 shrink-0" />
          <h2 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {lang === "ro"
              ? `Explorator Junior 3D · ${lesson.number}. ${lesson.title.ro}`
              : `Junior Explorer 3D · ${lesson.number}. ${lesson.title.en}`}
          </h2>
          <span className="text-xs font-mono text-orange-700 dark:text-amber-400">
            #{lesson.hashSlug} · {lesson.shortTag[lang]}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border border-amber-400/60 bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 tabular-nums whitespace-nowrap"
            title={lang === "ro" ? "Stele Explorator Junior câștigate" : "Junior Explorer Stars earned"}
          >
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
            <span>
              {completedLessons.length}/{JUNIOR_LESSONS.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSoundEnabled((s) => !s)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[#d9ceb9] dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-orange-500 transition-colors cursor-pointer"
            aria-label={soundEnabled ? "Mute audio" : "Enable audio"}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {soundEnabled
                ? lang === "ro"
                  ? "Sunet ON"
                  : "Audio ON"
                : lang === "ro"
                  ? "Mut"
                  : "Muted"}
            </span>
          </button>
          {onOpenBench3D && (
            <button
              type="button"
              onClick={onOpenBench3D}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-cyan-600 hover:bg-orange-600 dark:hover:bg-cyan-500 text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              <Box className="w-3.5 h-3.5" />
              {lang === "ro" ? "Banc 3D Complet" : "Full 3D Bench"}
            </button>
          )}
        </div>
      </div>

      {/* Main Split Workspace: Left 3D Isometric Stage + Right 2-Card Inspector & Live Code */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* LEFT: 3D Isometric Illustrated Workbench Stage */}
        <div className="lg:col-span-7 xl:col-span-8 relative min-h-[520px] sm:min-h-[560px] border-b lg:border-b-0 lg:border-r border-[#e5dccb] dark:border-slate-800 bg-[#faf6ef] dark:bg-[#0f172a] select-none">
          {/* Dedicated Persistent WebGL Mount */}
          <div ref={mountRef} className="absolute inset-0 w-full h-full" />

          {/* Floating Top Callout Chips */}
          <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap pointer-events-auto">
              {lesson.callouts.map((c) => {
                const active = selectedCallout?.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCalloutId(c.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shadow-xs ${
                      active
                        ? "bg-orange-600 text-white border-orange-600"
                        : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-[#d9ceb9] dark:border-slate-700 hover:border-orange-500"
                    }`}
                  >
                    {c.label[lang]}
                    {c.pin && (
                      <span className={`ml-1.5 font-mono text-[10px] ${active ? "text-orange-100" : "text-slate-500 dark:text-slate-400"}`}>
                        {c.pin}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Lesson Live State Readout */}
            <div className="pointer-events-auto px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-[#d9ceb9] dark:border-slate-700 text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 shadow-xs">
              {lessonId === "table-lamp" && (
                <span>
                  ADC34: <strong className="text-orange-600 dark:text-amber-400">{ldrReading.adc}</strong> ·{" "}
                  <strong className={effectiveTableLampOn ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"}>
                    {effectiveTableLampOn
                      ? lang === "ro"
                        ? "LAMPĂ APRINSĂ"
                        : "LAMP ON"
                      : lang === "ro"
                        ? "LAMPĂ STINSĂ"
                        : "LAMP OFF"}
                  </strong>
                </span>
              )}
              {lessonId === "mood-lamp" && (
                <span>
                  PWM RGB: <strong style={{ color: moodHex }}>{moodHex.toUpperCase()}</strong>
                </span>
              )}
              {lessonId === "fill-ring" && (
                <span>
                  POT: <strong>{ringState.adc}</strong> →{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400">{ringState.litCount}/12 LEDs</strong>
                </span>
              )}
              {lessonId === "mini-piano" && (
                <span>
                  PIEZO:{" "}
                  <strong className="text-sky-600 dark:text-sky-400">
                    {activePianoKey !== null
                      ? `${PIANO_NOTES[activePianoKey].note} (${Math.round(PIANO_NOTES[activePianoKey].freq)} Hz)`
                      : lang === "ro"
                        ? "Apasă o clapă"
                        : "Tap a key"}
                  </strong>
                </span>
              )}
              {lessonId === "siren" && (
                <span>
                  SIREN:{" "}
                  <strong className={sirenArmed ? "text-rose-600 dark:text-rose-400" : "text-slate-500"}>
                    {sirenArmed ? `${sirenState.freqHz} Hz` : "STANDBY"}
                  </strong>
                </span>
              )}
              {lessonId === "wifi-switch" && (
                <span>
                  {codeParams.wifiHost} ·{" "}
                  <strong className={wifiLampOn ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"}>
                    {wifiLampOn ? "LAMP ON" : "LAMP OFF"}
                  </strong>
                </span>
              )}
              {lessonId === "robot-gate" && (
                <span className="tabular-nums">
                  SONAR: <strong>{roverDistanceCm} cm</strong> ·{" "}
                  <strong className={gateState.gateOpen ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-amber-400"}>
                    {gateState.gateOpen
                      ? `GATE ${gateState.servoAngleDeg}° OPEN`
                      : "GATE 0° CLOSED"}
                  </strong>
                </span>
              )}
              {lessonId === "smart-fan" && (
                <span className="tabular-nums">
                  DHT22: <strong>{roomTempC}°C</strong> ·{" "}
                  <strong
                    className={
                      fanState.mode === "turbo"
                        ? "text-orange-600 dark:text-amber-400"
                        : fanState.mode === "eco"
                          ? "text-cyan-600 dark:text-cyan-400"
                          : "text-emerald-600 dark:text-emerald-400"
                    }
                  >
                    FAN {fanState.mode.toUpperCase()} ({fanState.dutyPct}%)
                  </strong>
                </span>
              )}
            </div>
          </div>

          {/* Interactive Hint Banner Bottom-Left */}
          <div className="absolute bottom-14 left-3 z-10 max-w-xs pointer-events-auto">
            {lessonId === "table-lamp" ? (
              <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#d9ceb9] dark:border-slate-700 shadow-sm space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                  <span className="inline-flex items-center gap-1">
                    <Hand className="w-3.5 h-3.5 text-orange-600" />
                    {lang === "ro" ? "Trage Capacul în 3D peste LDR" : "Drag The Cap over LDR in 3D"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const isCovered = ldrReading.coverage01 > 0.7;
                      setCapPos(isCovered ? CAP_OPEN_POS : CAP_COVERED_POS);
                    }}
                    className="px-2 py-0.5 rounded-md bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-bold cursor-pointer whitespace-nowrap"
                  >
                    {ldrReading.coverage01 > 0.7
                      ? lang === "ro"
                        ? "Descoperă"
                        : "Uncover"
                      : lang === "ro"
                        ? "Acoperă Senzor"
                        : "Cover Sensor"}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={coverSliderPct}
                    onChange={(e) => setCapPos(capPosFromCover01(Number(e.target.value) / 100))}
                    aria-label={lang === "ro" ? "Acoperire capac peste senzor LDR" : "Cap coverage over LDR sensor"}
                    className="w-full accent-orange-600 h-1.5 cursor-pointer"
                  />
                  <span className="text-[10px] font-mono tabular-nums text-slate-600 dark:text-slate-300 w-8 text-right">
                    {coverSliderPct}%
                  </span>
                </div>
              </div>
            ) : (
              selectedCallout && (
                <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#d9ceb9] dark:border-slate-700 shadow-sm text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                  <span className="font-bold text-slate-900 dark:text-slate-100 mr-1">
                    {selectedCallout.label[lang]}:
                  </span>
                  {selectedCallout.detail[lang]}
                </div>
              )
            )}
          </div>

          {/* Collapsible SCHEMATIC Mini-Card Bottom-Right (signature learn-esp32 inset) */}
          {showSchematic && (
            <div className="hidden sm:block absolute bottom-14 right-3 z-10 w-56 rounded-xl bg-white dark:bg-slate-900 border border-[#d9ceb9] dark:border-slate-700 shadow-sm p-2">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                <span className="inline-flex items-center gap-1">
                  <GitBranch className="w-3 h-3 text-orange-600" />
                  {lang === "ro" ? "Schemă Live" : "Live Schematic"}
                </span>
                <button
                  type="button"
                  onClick={() => setShowSchematic(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  ×
                </button>
              </div>
              <JuniorSchematicSvg
                lessonId={lessonId}
                ldrAdc={ldrReading.adc}
                lampOn={effectiveTableLampOn}
                moodHex={moodHex}
                litLeds={ringState.litCount}
                activeNote={activePianoKey !== null ? PIANO_NOTES[activePianoKey].note : null}
                sirenRed={sirenState.redOn}
                sirenBlue={sirenState.blueOn}
                wifiLampOn={wifiLampOn}
                roverCm={roverDistanceCm}
                gateOpen={isRunning && gateState.gateOpen}
                gateAngleDeg={isRunning ? gateState.servoAngleDeg : 0}
                roomTempC={roomTempC}
                fanMode={isRunning ? fanState.mode : "off"}
              />
            </div>
          )}

          {/* Bottom-Center Compact Stage Camera Pill */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-2 py-1 rounded-xl bg-white dark:bg-slate-900 border border-[#d9ceb9] dark:border-slate-700 shadow-sm">
            <button
              type="button"
              onClick={() => rotateCamera(-Math.PI / 8)}
              title={lang === "ro" ? "Rotește Stânga" : "Rotate Left"}
              aria-label={lang === "ro" ? "Rotește Stânga" : "Rotate Left"}
              className="p-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => rotateCamera(Math.PI / 8)}
              title={lang === "ro" ? "Rotește Dreapta" : "Rotate Right"}
              aria-label={lang === "ro" ? "Rotește Dreapta" : "Rotate Right"}
              className="p-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
            <button
              type="button"
              onClick={() => zoomCamera(1.16)}
              title={lang === "ro" ? "Micșorează" : "Zoom Out"}
              aria-label={lang === "ro" ? "Micșorează" : "Zoom Out"}
              className="p-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => zoomCamera(0.86)}
              title={lang === "ro" ? "Mărește" : "Zoom In"}
              aria-label={lang === "ro" ? "Mărește" : "Zoom In"}
              className="p-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
            <button
              type="button"
              onClick={() => setShowSchematic((s) => !s)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                showSchematic
                  ? "bg-orange-600 text-white"
                  : "text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800"
              }`}
            >
              {lang === "ro" ? "Schemă" : "Schematic"}
            </button>
            <button
              type="button"
              onClick={resetCamera}
              className="px-2 py-1 rounded-lg text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-amber-400 cursor-pointer whitespace-nowrap"
            >
              {lang === "ro" ? "Reset" : "Reset"}
            </button>
          </div>
        </div>

        {/* RIGHT: 2-Card Inspector & "Try It Yourself" Live Code Column */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col divide-y divide-[#e5dccb] dark:divide-slate-800 bg-white dark:bg-slate-900">
          {/* Card 1: Overview | Pinout | Example | Specifications + Mission + Tactile Controls */}
          <div className="p-4 space-y-3">
            {/* Kid Explorer Mission Banner + 1-Click Demo Button */}
            <div className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300/70 dark:border-amber-500/30 flex items-center justify-between gap-2.5">
              <div className="flex items-start gap-2 min-w-0">
                <Star
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    completedLessons.includes(lessonId)
                      ? "fill-amber-500 text-amber-500"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                />
                <p className="text-[11.5px] font-medium text-amber-950 dark:text-amber-100 leading-snug">
                  {JUNIOR_MISSIONS[lessonId][lang]}
                </p>
              </div>
              <button
                type="button"
                onClick={handleDemoMission}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Wand2 className="w-3 h-3" />
                <span>{lang === "ro" ? "Demo" : "Try Mission"}</span>
              </button>
            </div>

            {/* 4 Clean Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
              {(
                [
                  { id: "overview", en: "Overview", ro: "Prezentare" },
                  { id: "pinout", en: "Pinout", ro: "Pini" },
                  { id: "example", en: "Example", ro: "Exemplu" },
                  { id: "specs", en: "Specifications", ro: "Specificații" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setInfoTab(tab.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    infoTab === tab.id
                      ? "bg-orange-600 text-white"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  {tab[lang]}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[126px] text-xs leading-relaxed text-slate-700 dark:text-slate-300 space-y-2">
              {infoTab === "overview" && (
                <>
                  <p>{lesson.overview[lang]}</p>
                  <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                    {lesson.howItWorks.map((step, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="font-mono font-bold text-orange-600 dark:text-amber-400">
                          {i + 1}.
                        </span>
                        <span>{step[lang]}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {infoTab === "pinout" && (
                <div className="space-y-1.5">
                  {lesson.pinout.map((row) => (
                    <div
                      key={row.pin}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[#faf6ef] dark:bg-slate-950/70 border border-[#ebe3d3] dark:border-slate-800"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: row.wireColor }}
                        />
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100 shrink-0">
                          {row.pin}
                        </span>
                        <span className="truncate text-slate-600 dark:text-slate-300">
                          {row.component[lang]}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        {row.role[lang]}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {infoTab === "example" && (
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-[#faf6ef] dark:bg-slate-950/70 border border-[#ebe3d3] dark:border-slate-800">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-orange-600" />
                      {lang === "ro" ? "Unde întâlnești acest circuit în viața reală" : "Real-World Applications"}
                    </div>
                    <p>{lesson.exampleUse[lang]}</p>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lesson.tryHint[lang]}
                  </p>
                </div>
              )}

              {infoTab === "specs" && (
                <div className="grid grid-cols-1 gap-1.5">
                  {lesson.specs.map((sp) => (
                    <div
                      key={sp.value}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#faf6ef] dark:bg-slate-950/70 border border-[#ebe3d3] dark:border-slate-800"
                    >
                      <span className="text-slate-600 dark:text-slate-400">{sp.label[lang]}</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {sp.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Lesson Tactile Controls Strip */}
            <div className="p-2.5 rounded-xl bg-[#faf6ef] dark:bg-slate-950/80 border border-[#e5dccb] dark:border-slate-800 space-y-2">
              {lessonId === "table-lamp" && (
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-[#ebe3d3] dark:border-slate-800">
                    <div className="text-[10px] text-slate-500">ADC34</div>
                    <div className="text-xs font-bold text-orange-600 dark:text-amber-400 tabular-nums">
                      {ldrReading.adc}
                    </div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-[#ebe3d3] dark:border-slate-800">
                    <div className="text-[10px] text-slate-500">VOLT</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {ldrReading.voltageV.toFixed(2)} V
                    </div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-[#ebe3d3] dark:border-slate-800">
                    <div className="text-[10px] text-slate-500">THRESHOLD</div>
                    <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
                      {codeParams.threshold}
                    </div>
                  </div>
                </div>
              )}

              {lessonId === "mood-lamp" && (
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {MOOD_PALETTE.map((swatch) => (
                      <button
                        key={swatch.id}
                        type="button"
                        onClick={() => {
                          setMoodHex(swatch.hex);
                          setMoodOn(true);
                          markCompleted("mood-lamp");
                        }}
                        title={swatch.label[lang]}
                        className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-transform ${
                          moodHex.toLowerCase() === swatch.hex.toLowerCase()
                            ? "border-slate-900 dark:border-white scale-110"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setMoodOn((v) => !v)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    {moodOn ? (lang === "ro" ? "Stinge" : "Turn Off") : lang === "ro" ? "Aprinde" : "Turn On"}
                  </button>
                </div>
              )}

              {lessonId === "fill-ring" && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                      <Sliders className="w-3 h-3 text-emerald-600" />
                      {lang === "ro" ? "Potențiometru (GPIO 34)" : "Potentiometer Dial (GPIO 34)"}
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {ringState.litCount} / {codeParams.maxRingLeds} LEDs
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(potValue01 * 100)}
                    onChange={(e) => {
                      setPotValue01(Number(e.target.value) / 100);
                      markCompleted("fill-ring");
                    }}
                    className="w-full accent-emerald-600 h-1.5 cursor-pointer"
                  />
                </div>
              )}

              {lessonId === "mini-piano" && (
                <div className="grid grid-cols-4 gap-1.5">
                  {PIANO_NOTES.map((n) => (
                    <button
                      key={n.note}
                      type="button"
                      onClick={() => triggerPianoKey(n.index)}
                      className="py-1.5 rounded-lg text-white text-xs font-bold shadow-xs transition-transform active:scale-95 cursor-pointer"
                      style={{ backgroundColor: n.color }}
                    >
                      {lang === "ro" ? n.labelRo : n.note}
                    </button>
                  ))}
                </div>
              )}

              {lessonId === "siren" && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {sirenArmed
                      ? lang === "ro"
                        ? "Girofar activ · GPIO 26 / 27"
                        : "Beacons active · GPIO 26 / 27"
                      : lang === "ro"
                        ? "Apasă comutatorul 3D sau butonul"
                        : "Click the 3D switch or arm button"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSirenArmed((v) => !v);
                      markCompleted("siren");
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      sirenArmed
                        ? "bg-rose-600 text-white"
                        : "bg-slate-900 dark:bg-slate-700 text-white"
                    }`}
                  >
                    {sirenArmed
                      ? lang === "ro"
                        ? "Oprește Sirena"
                        : "Disarm Siren"
                      : lang === "ro"
                        ? "Armează Sirena"
                        : "Arm Siren"}
                  </button>
                </div>
              )}

              {lessonId === "wifi-switch" && (
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-700 dark:text-slate-300">
                    <Wifi className="w-3.5 h-3.5 text-cyan-600" />
                    GET /{wifiLampOn ? "off" : "on"}
                  </span>
                  <button
                    type="button"
                    onClick={triggerWifiToggle}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer"
                  >
                    {lang === "ro" ? "Trimite /toggle Wi-Fi" : "Send /toggle Request"}
                  </button>
                </div>
              )}

              {lessonId === "robot-gate" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                    <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                      {lang === "ro" ? "Distanță Rover:" : "Rover Distance:"}{" "}
                      <strong className="text-orange-600 dark:text-amber-400">{roverDistanceCm} cm</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setRoverDistanceCm((cur) => (cur <= codeParams.gateTriggerCm ? 54 : 14));
                        markCompleted("robot-gate");
                      }}
                      className="px-2.5 py-0.5 rounded-md bg-orange-600 hover:bg-orange-500 text-white text-[10.5px] font-bold cursor-pointer whitespace-nowrap"
                    >
                      {roverDistanceCm <= codeParams.gateTriggerCm
                        ? lang === "ro"
                          ? "Înapoi (54 cm)"
                          : "Back Up (54 cm)"
                        : lang === "ro"
                          ? "Apropie Rover (14 cm)"
                          : "Drive Closer (14 cm)"}
                    </button>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={80}
                    value={roverDistanceCm}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setRoverDistanceCm(val);
                      if (val <= codeParams.gateTriggerCm) markCompleted("robot-gate");
                    }}
                    aria-label={lang === "ro" ? "Distanță mașinuță rover" : "Rover distance in cm"}
                    className="w-full accent-orange-600 h-1.5 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 tabular-nums">
                    <span>ECHO: {gateState.echoUs} µs</span>
                    <span>TRIGGER &le; {codeParams.gateTriggerCm} cm</span>
                    <span>SG90: {gateState.servoAngleDeg}°</span>
                  </div>
                </div>
              )}

              {lessonId === "smart-fan" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                    <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                      {lang === "ro" ? "Temperatură Seră:" : "Room Temp:"}{" "}
                      <strong className="text-emerald-600 dark:text-emerald-400">{roomTempC} °C</strong>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setRoomTempC(22)}
                        className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer whitespace-nowrap"
                      >
                        {lang === "ro" ? "Răcorește" : "Cool 22°C"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRoomTempC(35);
                          markCompleted("smart-fan");
                        }}
                        className="px-2 py-0.5 rounded-md bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-bold cursor-pointer whitespace-nowrap"
                      >
                        {lang === "ro" ? "Soare 35°C" : "Warm 35°C"}
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={16}
                    max={40}
                    value={roomTempC}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setRoomTempC(val);
                      if (val >= codeParams.fanOnTempC) markCompleted("smart-fan");
                    }}
                    aria-label={lang === "ro" ? "Temperatura camerei în grade Celsius" : "Room temperature in Celsius"}
                    className="w-full accent-emerald-600 h-1.5 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 tabular-nums">
                    <span>ON &ge; {codeParams.fanOnTempC}°C</span>
                    <span>TURBO &ge; {codeParams.fanTurboTempC}°C</span>
                    <span>{fanState.rpm} RPM ({fanState.dutyPct}%)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: TRY IT YOURSELF — Editable Live Code + Orange Run Button */}
          <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5 bg-[#fcfaf5] dark:bg-[#0c1322]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                {lang === "ro" ? "Încearcă Singur (Editează Codul)" : "Try It Yourself (Live Code)"}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleResetCode}
                  className="px-2 py-1 rounded-md text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                >
                  {lang === "ro" ? "Resetează" : "Reset"}
                </button>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border border-[#d9ceb9] dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-orange-500 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  {copied ? (lang === "ro" ? "Copiat" : "Copied") : lang === "ro" ? "Copiază" : "Copy"}
                </button>
              </div>
            </div>

            <textarea
              value={activeCode}
              onChange={(e) =>
                setCodeByLesson((prev) => ({ ...prev, [lessonId]: e.target.value }))
              }
              spellCheck={false}
              rows={8}
              aria-label={lang === "ro" ? "Editor cod ESP32" : "ESP32 live code editor"}
              className="w-full rounded-xl p-3 font-mono text-[11.5px] leading-relaxed bg-[#1c212b] text-[#e6edf3] border border-slate-700 focus:outline-none focus:border-orange-500 resize-none"
            />

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunCode}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {lang === "ro" ? "Rulează Codul" : "Run Code"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRunning(false);
                    setSirenArmed(false);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border border-[#d9ceb9] dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-rose-500 cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-current" />
                  {lang === "ro" ? "Stop" : "Stop"}
                </button>
              </div>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                {isRunning ? "ESP32 · RUNNING" : "ESP32 · PAUSED"}
              </span>
            </div>

            {/* Compact Live Serial Output */}
            <div className="rounded-lg bg-slate-950 text-emerald-300 font-mono text-[10.5px] px-2.5 py-2 space-y-0.5 border border-slate-800">
              {serialLog.map((line, i) => (
                <div key={i} className="truncate">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Horizontal LESSONS Carousel (signature learn-esp32 bottom bar) */}
      <div className="px-4 py-3 border-t border-[#e5dccb] dark:border-slate-800 bg-[#f4ede0] dark:bg-slate-950/90 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            <span>{lang === "ro" ? "Lecții Interactive 3D" : "Interactive 3D Lessons"}</span>
            <span className="text-orange-600 dark:text-amber-400">
              {completedLessons.length}/{JUNIOR_LESSONS.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => lessonsStripRef.current?.scrollBy({ left: -240, behavior: "smooth" })}
              aria-label={lang === "ro" ? "Lecții anterioare" : "Previous lessons"}
              className="p-1.5 rounded-lg border border-[#d9ceb9] dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-orange-500 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => lessonsStripRef.current?.scrollBy({ left: 240, behavior: "smooth" })}
              aria-label={lang === "ro" ? "Lecții următoare" : "Next lessons"}
              className="p-1.5 rounded-lg border border-[#d9ceb9] dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-orange-500 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div
          ref={lessonsStripRef}
          className="flex gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory"
        >
          {JUNIOR_LESSONS.map((item) => {
            const active = item.id === lessonId;
            const done = completedLessons.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setLessonId(item.id);
                  setIsRunning(true);
                  setInfoTab("overview");
                  if (item.id === "table-lamp") {
                    setCapPos(CAP_OPEN_POS);
                  }
                }}
                className={`snap-start shrink-0 w-48 text-left px-3 py-2.5 rounded-xl border transition-colors cursor-pointer space-y-1 ${
                  active
                    ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-[#d9ceb9] dark:border-slate-700 hover:border-orange-500"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                  <span className={active ? "text-orange-100" : "text-orange-600 dark:text-amber-400"}>
                    {item.number}. #{item.hashSlug}
                  </span>
                  {done && (
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${active ? "text-white" : "text-emerald-500"}`}
                    />
                  )}
                </div>
                <div className="text-xs font-bold leading-snug truncate">
                  {item.title[lang]}
                </div>
                <div
                  className={`text-[10.5px] truncate ${
                    active ? "text-orange-100" : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {item.shortTag[lang]}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
