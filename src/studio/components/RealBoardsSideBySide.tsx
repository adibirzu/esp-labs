import { Box, Check, Plus, X } from "lucide-react";
import esp32RealTopImg from "../../assets/images/esp32_s3_real_top_1795635835402.jpg";
import type { EspBoardSpec, Lang } from "../types";

interface RealBoardsSideBySideProps {
  lang: Lang;
  allBoards: EspBoardSpec[];
  selectedIds: string[];
  activeBoardId: string;
  onToggleBoard: (boardId: string) => void;
  onSelectBoard: (boardId: string) => void;
  onOpenBench3D?: () => void;
}

interface BoardVisualProfile {
  pcbHex: string;
  shieldLabel: string;
  shieldSub: string;
  dualUsb: boolean;
  microUsb?: boolean;
  isEvBoard?: boolean;
  hasRgbLed?: boolean;
  compactMini?: boolean;
}

const BOARD_PROFILES: Record<string, BoardVisualProfile> = {
  "esp32-s3-devkitc-1": {
    pcbHex: "#141920",
    shieldLabel: "ESP32-S3-WROOM-1",
    shieldSub: "N8R8 · Dual LX7",
    dualUsb: true,
    hasRgbLed: true,
  },
  "esp32-c3-devkitm-1": {
    pcbHex: "#141b24",
    shieldLabel: "ESP32-C3-MINI-1",
    shieldSub: "RISC-V · 160MHz",
    dualUsb: false,
    microUsb: true,
    hasRgbLed: true,
    compactMini: true,
  },
  "esp32-c6-devkitc-1": {
    pcbHex: "#121a22",
    shieldLabel: "ESP32-C6-WROOM-1",
    shieldSub: "Wi-Fi 6 · Thread",
    dualUsb: true,
    hasRgbLed: true,
  },
  "esp32-h2-devkitm-1": {
    pcbHex: "#151a24",
    shieldLabel: "ESP32-H2-MINI-1",
    shieldSub: "Zigbee · Matter",
    dualUsb: true,
    hasRgbLed: true,
    compactMini: true,
  },
  "esp32-s2-devkitc-1": {
    pcbHex: "#131922",
    shieldLabel: "ESP32-S2-SOLO",
    shieldSub: "USB-OTG · 240MHz",
    dualUsb: true,
    hasRgbLed: true,
  },
  "esp32-devkitc-v4": {
    pcbHex: "#151a1f",
    shieldLabel: "ESP-WROOM-32E",
    shieldSub: "BT Classic + Wi-Fi",
    dualUsb: false,
    microUsb: true,
    hasRgbLed: false,
  },
  "esp32-c5-devkitc-1": {
    pcbHex: "#141825",
    shieldLabel: "ESP32-C5-WROOM-1",
    shieldSub: "5 GHz + 2.4 GHz",
    dualUsb: true,
    hasRgbLed: true,
  },
  "esp32-p4-ev": {
    pcbHex: "#101c22",
    shieldLabel: "ESP32-P4 + C6",
    shieldSub: "400MHz · MIPI-CSI",
    dualUsb: true,
    isEvBoard: true,
    hasRgbLed: true,
  },
};

function RealisticBoardHardwareGraphic({
  board,
  pxPerMm,
}: {
  board: EspBoardSpec;
  pxPerMm: number;
}) {
  const widthPx = Math.max(76, Math.round(board.widthMm * pxPerMm));
  const heightPx = Math.max(118, Math.round(board.lengthMm * pxPerMm));

  // For ESP32-S3-DevKitC-1, display the real overhead macro studio photograph cropped tightly to the PCB
  if (board.id === "esp32-s3-devkitc-1") {
    return (
      <div
        className="relative rounded-md overflow-hidden shadow-2xl border border-slate-600/80 bg-[#1a2026] shrink-0"
        style={{ width: `${widthPx}px`, height: `${heightPx}px` }}
      >
        <img
          src={esp32RealTopImg}
          alt={`${board.name} real physical hardware photograph`}
          className="w-full h-full object-cover scale-[1.24]"
          draggable={false}
        />
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/15 rounded-md" />
      </div>
    );
  }

  const profile = BOARD_PROFILES[board.id] ?? {
    pcbHex: "#141920",
    shieldLabel: board.moduleName,
    shieldSub: `${board.maxFreqMhz} MHz`,
    dualUsb: board.hasUsbOtg,
    hasRgbLed: true,
  };

  const pinsPerSide = Math.min(22, Math.max(12, Math.round(board.pinCount / 2)));

  return (
    <svg
      width={widthPx}
      height={heightPx}
      viewBox={`0 0 ${widthPx} ${heightPx}`}
      className="shrink-0 drop-shadow-2xl select-none"
      role="img"
      aria-label={`${board.name} realistic to-scale PCB (${board.lengthMm} by ${board.widthMm} mm)`}
    >
      <defs>
        <linearGradient id={`shield-${board.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d8e0e8" />
          <stop offset="50%" stopColor="#b2bdc9" />
          <stop offset="100%" stopColor="#8d99a7" />
        </linearGradient>
        <linearGradient id={`usb-${board.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cfd7df" />
          <stop offset="55%" stopColor="#8f9aa7" />
          <stop offset="100%" stopColor="#65707d" />
        </linearGradient>
      </defs>

      {/* Matte Black / Dark PCB Substrate */}
      <rect
        x={1}
        y={1}
        width={widthPx - 2}
        height={heightPx - 2}
        rx={5}
        fill={profile.pcbHex}
        stroke="#334155"
        strokeWidth={1.4}
      />

      {/* Subtle Copper Trace Geometry */}
      <path
        d={`M ${widthPx * 0.24} ${heightPx * 0.48} V ${heightPx * 0.84} M ${widthPx * 0.76} ${heightPx * 0.48} V ${heightPx * 0.84} M ${widthPx * 0.5} ${heightPx * 0.52} V ${heightPx * 0.88}`}
        stroke="#1e293b"
        strokeWidth={1.2}
        fill="none"
      />

      {/* PCB Meander Antenna Keep-Out Zone at Top (non-EV DevKits) */}
      {!profile.isEvBoard && (
        <g>
          <rect
            x={widthPx * 0.22}
            y={3}
            width={widthPx * 0.56}
            height={heightPx * 0.11}
            rx={2}
            fill="#0d1218"
            stroke="#2a3441"
            strokeWidth={0.8}
          />
          <path
            d={`M ${widthPx * 0.27} ${heightPx * 0.11} V ${heightPx * 0.055} H ${widthPx * 0.36} V ${heightPx * 0.11} H ${widthPx * 0.45} V ${heightPx * 0.055} H ${widthPx * 0.55} V ${heightPx * 0.11} H ${widthPx * 0.64} V ${heightPx * 0.055} H ${widthPx * 0.73} V ${heightPx * 0.11}`}
            stroke="#c59c44"
            strokeWidth={1.5}
            fill="none"
          />
        </g>
      )}

      {/* Gold-Plated Castellated / Through-Hole Pin Headers on Left & Right */}
      {!profile.isEvBoard ? (
        Array.from({ length: pinsPerSide }).map((_, i) => {
          const topMargin = heightPx * 0.15;
          const usableH = heightPx * 0.72;
          const cy = topMargin + (i / Math.max(1, pinsPerSide - 1)) * usableH;
          return (
            <g key={i}>
              <circle cx={6.5} cy={cy} r={2.5} fill="#d4a644" stroke="#7c5d1a" strokeWidth={0.6} />
              <circle cx={6.5} cy={cy} r={1.05} fill="#0c1118" />
              <circle
                cx={widthPx - 6.5}
                cy={cy}
                r={2.5}
                fill="#d4a644"
                stroke="#7c5d1a"
                strokeWidth={0.6}
              />
              <circle cx={widthPx - 6.5} cy={cy} r={1.05} fill="#0c1118" />
            </g>
          );
        })
      ) : (
        /* ESP32-P4 EV Board: Dual-Row 40-pin GPIO Header + MIPI DSI/CSI FFC Connectors + Ethernet RJ45 */
        <g>
          <rect x={10} y={10} width={widthPx - 20} height={14} rx={2} fill="#0f172a" stroke="#475569" />
          {Array.from({ length: 16 }).map((_, i) => (
            <circle
              key={i}
              cx={16 + i * ((widthPx - 32) / 15)}
              cy={17}
              r={1.7}
              fill="#d4a644"
            />
          ))}
          <rect
            x={10}
            y={heightPx * 0.24}
            width={24}
            height={36}
            rx={2}
            fill="#cbd5e1"
            stroke="#64748b"
          />
          <text
            x={22}
            y={heightPx * 0.24 + 21}
            textAnchor="middle"
            fill="#0f172a"
            fontSize="6"
            fontWeight="700"
            fontFamily="IBM Plex Mono, monospace"
          >
            RJ45
          </text>
          <rect
            x={widthPx - 32}
            y={heightPx * 0.26}
            width={22}
            height={14}
            rx={1.5}
            fill="#e2e8f0"
            stroke="#64748b"
          />
          <rect
            x={widthPx - 32}
            y={heightPx * 0.42}
            width={22}
            height={14}
            rx={1.5}
            fill="#e2e8f0"
            stroke="#64748b"
          />
        </g>
      )}

      {/* Brushed Metallic RF Shield Can */}
      <rect
        x={profile.isEvBoard ? widthPx * 0.28 : widthPx * 0.2}
        y={profile.isEvBoard ? heightPx * 0.28 : heightPx * 0.145}
        width={profile.isEvBoard ? widthPx * 0.44 : widthPx * 0.6}
        height={
          profile.isEvBoard
            ? heightPx * 0.3
            : profile.compactMini
              ? heightPx * 0.28
              : heightPx * 0.31
        }
        rx={2.5}
        fill={`url(#shield-${board.id})`}
        stroke="#64748b"
        strokeWidth={1}
      />

      {/* Laser-Etched Espressif Shield Markings */}
      <text
        x={widthPx * 0.5}
        y={profile.isEvBoard ? heightPx * 0.41 : heightPx * 0.28}
        textAnchor="middle"
        fill="#1e293b"
        fontSize={Math.max(6.5, Math.min(8.5, widthPx * 0.082))}
        fontWeight="700"
        fontFamily="IBM Plex Mono, monospace"
      >
        {board.soc}
      </text>
      <text
        x={widthPx * 0.5}
        y={profile.isEvBoard ? heightPx * 0.48 : heightPx * 0.35}
        textAnchor="middle"
        fill="#334155"
        fontSize={Math.max(5.5, Math.min(7, widthPx * 0.064))}
        fontFamily="IBM Plex Mono, monospace"
      >
        {profile.compactMini ? "MINI-1" : profile.isEvBoard ? "400 MHz EV" : "WROOM"}
      </text>

      {/* Mid-Board SMD Components: WS2812 RGB LED + AMS1117 3.3V LDO */}
      {profile.hasRgbLed && (
        <g>
          <rect
            x={widthPx * 0.25}
            y={heightPx * 0.52}
            width={10}
            height={10}
            rx={1.5}
            fill="#f8fafc"
            stroke="#94a3b8"
            strokeWidth={0.8}
          />
          <circle cx={widthPx * 0.25 + 5} cy={heightPx * 0.52 + 5} r={2.8} fill="#22d3ee" />
        </g>
      )}
      <rect
        x={widthPx * 0.52}
        y={heightPx * 0.51}
        width={widthPx * 0.24}
        height={13}
        rx={1.5}
        fill="#1e293b"
        stroke="#64748b"
        strokeWidth={0.8}
      />

      {/* Tactile RST & BOOT Micro-Switches */}
      <rect
        x={widthPx * 0.25}
        y={heightPx * 0.65}
        width={12}
        height={12}
        rx={1.5}
        fill="#334155"
        stroke="#94a3b8"
        strokeWidth={0.8}
      />
      <circle cx={widthPx * 0.25 + 6} cy={heightPx * 0.65 + 6} r={3} fill="#0f172a" />

      <rect
        x={widthPx * 0.75 - 12}
        y={heightPx * 0.65}
        width={12}
        height={12}
        rx={1.5}
        fill="#334155"
        stroke="#94a3b8"
        strokeWidth={0.8}
      />
      <circle cx={widthPx * 0.75 - 6} cy={heightPx * 0.65 + 6} r={3} fill="#0f172a" />

      {/* USB-UART Bridge QFN IC */}
      <rect
        x={widthPx * 0.5 - 8}
        y={heightPx * 0.76}
        width={16}
        height={14}
        rx={1.5}
        fill="#0f172a"
        stroke="#475569"
        strokeWidth={0.8}
      />

      {/* Bottom Metallic USB-C / Micro-USB Ports */}
      {profile.dualUsb ? (
        <g>
          <rect
            x={widthPx * 0.21}
            y={heightPx - 14}
            width={widthPx * 0.25}
            height={14}
            rx={2}
            fill={`url(#usb-${board.id})`}
            stroke="#475569"
            strokeWidth={0.9}
          />
          <rect
            x={widthPx * 0.54}
            y={heightPx - 14}
            width={widthPx * 0.25}
            height={14}
            rx={2}
            fill={`url(#usb-${board.id})`}
            stroke="#475569"
            strokeWidth={0.9}
          />
        </g>
      ) : (
        <rect
          x={widthPx * 0.36}
          y={heightPx - 13}
          width={widthPx * 0.28}
          height={13}
          rx={2}
          fill={`url(#usb-${board.id})`}
          stroke="#475569"
          strokeWidth={0.9}
        />
      )}
    </svg>
  );
}

export function RealBoardsSideBySide({
  lang,
  allBoards,
  selectedIds,
  activeBoardId,
  onToggleBoard,
  onSelectBoard,
  onOpenBench3D,
}: RealBoardsSideBySideProps) {
  const comparedBoards = selectedIds
    .map((id) => allBoards.find((b) => b.id === id))
    .filter((b): b is EspBoardSpec => Boolean(b))
    .slice(0, 4);

  const hasEvBoard = comparedBoards.some((b) => b.formFactor === "ev-board");
  // Proportional true mm -> px scale so all 4 boards sit accurately side-by-side at real relative scale
  const pxPerMm = hasEvBoard ? 2.15 : 3.55;

  return (
    <div className="space-y-4">
      {/* Quick Board Picker Strip (Max 4 boards side-by-side) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono text-slate-400 mr-1">
            {lang === "ro"
              ? `Alege până la 4 plăci (${comparedBoards.length}/4):`
              : `Pick up to 4 boards (${comparedBoards.length}/4):`}
          </span>
          {allBoards.map((board) => {
            const active = selectedIds.includes(board.id);
            return (
              <button
                key={board.id}
                type="button"
                onClick={() => onToggleBoard(board.id)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono border transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 font-semibold"
                    : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                }`}
              >
                {active ? <Check className="w-3 h-3 text-cyan-400" /> : <Plus className="w-3 h-3" />}
                <span>{board.soc}</span>
              </button>
            );
          })}
        </div>

        {onOpenBench3D && (
          <button
            type="button"
            onClick={onOpenBench3D}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <Box className="w-3.5 h-3.5" />
            {lang === "ro" ? "Inspectează în Banc 3D" : "Inspect in 3D Bench"}
          </button>
        )}
      </div>

      {/* ESD Caliper Stage Showing Up to 4 Real Physical Boards Side-by-Side at True mm Scale */}
      <div
        className="rounded-xl border border-slate-800 bg-[#060a12] p-5 overflow-x-auto"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      >
        {comparedBoards.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-slate-400">
            {lang === "ro"
              ? "Selectează 1–4 plăci ESP32 din bara de mai sus pentru comparație reală la scară."
              : "Select 1–4 ESP32 boards above to compare them physically side by side."}
          </div>
        ) : (
          <div className="flex items-end justify-around gap-6 min-w-[680px] pt-4 pb-2">
            {comparedBoards.map((board) => {
              const isSelected = board.id === activeBoardId;
              const areaCm2 = (
                Math.round(board.lengthMm * board.widthMm * 10) / 1000
              ).toFixed(1);

              return (
                <div
                  key={board.id}
                  onClick={() => onSelectBoard(board.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectBoard(board.id);
                    }
                  }}
                  className={`group relative flex flex-col items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-cyan-500/10 border-cyan-500/70"
                      : "bg-slate-950/60 border-slate-800/90 hover:border-slate-600"
                  }`}
                >
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleBoard(board.id);
                    }}
                    aria-label={
                      lang === "ro"
                        ? `Elimină ${board.name} din comparație`
                        : `Remove ${board.name} from comparison`
                    }
                    className="absolute top-2 right-2 p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Top Millimeter Width Caliper */}
                  <div className="text-[10px] font-mono text-cyan-400 tabular-nums pt-1">
                    ↔ {board.widthMm.toFixed(1)} mm
                  </div>

                  {/* Physical Scaled Board Visual + Height Caliper */}
                  <div className="flex items-center gap-2">
                    <div className="text-[10px] font-mono text-slate-500 tabular-nums [writing-mode:vertical-rl] rotate-180">
                      ↕ {board.lengthMm.toFixed(2)} mm
                    </div>
                    <RealisticBoardHardwareGraphic board={board} pxPerMm={pxPerMm} />
                  </div>

                  {/* Specs Footer */}
                  <div className="text-center space-y-0.5 pt-1 border-t border-slate-800/80 w-full min-w-[140px]">
                    <div className="text-xs font-bold text-slate-100 truncate">
                      {board.name}
                    </div>
                    <div className="text-[10px] font-mono text-cyan-300 tabular-nums">
                      {board.lengthMm.toFixed(2)} × {board.widthMm.toFixed(1)} mm · {areaCm2} cm²
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {board.arch} · {board.maxFreqMhz} MHz · {board.gpios} GPIO
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
          <span>
            {lang === "ro"
              ? `Scară proporțională reală: 1 mm = ${pxPerMm.toFixed(2)} px (aliniere la portul USB inferior)`
              : `True proportional physical scale: 1 mm = ${pxPerMm.toFixed(2)} px (aligned to bottom USB edge)`}
          </span>
          <span className="text-cyan-400">
            {lang === "ro"
              ? "Click pe orice placă pentru fișa completă Espressif"
              : "Click any board to inspect full Espressif specs"}
          </span>
        </div>
      </div>
    </div>
  );
}
