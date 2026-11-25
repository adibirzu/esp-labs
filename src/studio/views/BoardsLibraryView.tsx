import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  CheckSquare,
  Cpu,
  ExternalLink,
  LayoutGrid,
  Lightbulb,
  Maximize2,
  Radio,
  Ruler,
  Search,
  ShieldCheck,
  Sliders,
} from "lucide-react";
import { AdultEngineeringTable } from "../components/AdultEngineeringTable";
import { BoardTeardownDrilldown } from "../components/BoardTeardownDrilldown";
import { RealBoardsSideBySide } from "../components/RealBoardsSideBySide";
import {
  OFFICIAL_DOC_PORTALS,
  OFFICIAL_ESP_BOARDS,
  type OfficialDocResource,
} from "../data/boards";
import {
  ESPRESSIF_SCHEMATIC_CHECKLIST,
  OFFICIAL_REFERENCE_SOURCES,
  pickCopy,
} from "../data/official-sources";
import { localizeBoard, localizeDocPortal } from "../data/ro-overrides";
import type { Translations } from "../i18n";
import {
  buildBoardComparison,
  computeBoardFootprintMetrics,
  filterBoards,
} from "../logic/library-filter";
import type { CpuArch, Lang, RadioCapability } from "../types";

interface BoardsLibraryViewProps {
  t: Translations;
  lang: Lang;
  selectedBoardId: string;
  onSelectBoard: (boardId: string) => void;
  onOpenIdeasForBoard: (boardId: string) => void;
  onOpenPinout: () => void;
  onOpenBench3D?: () => void;
}

const ACCENT_STROKE: Record<string, { stroke: string; fill: string; text: string }> = {
  cyan: { stroke: "#06b6d4", fill: "rgba(6,182,212,0.14)", text: "#22d3ee" },
  emerald: { stroke: "#10b981", fill: "rgba(16,185,129,0.14)", text: "#34d399" },
  violet: { stroke: "#8b5cf6", fill: "rgba(139,92,246,0.14)", text: "#a78bfa" },
  amber: { stroke: "#f59e0b", fill: "rgba(245,158,11,0.14)", text: "#fbbf24" },
  sky: { stroke: "#0ea5e9", fill: "rgba(14,165,233,0.14)", text: "#38bdf8" },
  rose: { stroke: "#f43f5e", fill: "rgba(244,63,94,0.14)", text: "#fb7185" },
  indigo: { stroke: "#6366f1", fill: "rgba(99,102,241,0.14)", text: "#818cf8" },
  teal: { stroke: "#14b8a6", fill: "rgba(20,184,166,0.14)", text: "#2dd4bf" },
};

export function BoardsLibraryView({
  t,
  lang,
  selectedBoardId,
  onSelectBoard,
  onOpenIdeasForBoard,
  onOpenPinout,
  onOpenBench3D,
}: BoardsLibraryViewProps) {
  const [query, setQuery] = useState("");
  const [archFilter, setArchFilter] = useState<"all" | CpuArch>("all");
  const [radioFilter, setRadioFilter] = useState<"all" | RadioCapability | "usb-otg">("all");
  const [psramOnly, setPsramOnly] = useState(false);
  const [includeEvInScale, setIncludeEvInScale] = useState(false);
  const [visualizerMode, setVisualizerMode] = useState<"footprint" | "real4">("footprint");
  const [compareIds, setCompareIds] = useState<string[]>([
    "esp32-s3-devkitc-1",
    "esp32-c3-devkitm-1",
    "esp32-c6-devkitc-1",
    "esp32-devkitc-v4",
  ]);
  const [docCategory, setDocCategory] = useState<"all" | OfficialDocResource["category"]>("all");
  const [checkedChecklistIds, setCheckedChecklistIds] = useState<string[]>(["chk-power", "chk-reset"]);

  const toggleChecklistItem = (id: string) => {
    setCheckedChecklistIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const localizedBoards = useMemo(
    () => OFFICIAL_ESP_BOARDS.map((b) => localizeBoard(b, lang)),
    [lang],
  );

  const filteredBoards = useMemo(
    () =>
      filterBoards(localizedBoards, {
        query,
        arch: archFilter,
        radio: radioFilter,
        psramOnly,
      }),
    [localizedBoards, query, archFilter, radioFilter, psramOnly],
  );

  // If selected board is filtered out, keep inspector synced with a valid board
  const activeBoard = useMemo(
    () =>
      localizedBoards.find((b) => b.id === selectedBoardId) ??
      filteredBoards[0] ??
      localizedBoards[0],
    [localizedBoards, selectedBoardId, filteredBoards],
  );

  // Auto-enable EV scale if user explicitly selects the EV board
  useEffect(() => {
    if (activeBoard.formFactor === "ev-board") {
      setIncludeEvInScale(true);
    }
  }, [activeBoard.formFactor]);

  const footprints = useMemo(
    () => computeBoardFootprintMetrics(localizedBoards, includeEvInScale),
    [localizedBoards, includeEvInScale],
  );

  const comparison = useMemo(
    () => buildBoardComparison(localizedBoards, compareIds),
    [localizedBoards, compareIds],
  );

  const filteredDocs = useMemo(
    () =>
      (docCategory === "all"
        ? OFFICIAL_DOC_PORTALS
        : OFFICIAL_DOC_PORTALS.filter((d) => d.category === docCategory)
      ).map((d) => localizeDocPortal(d, lang)),
    [docCategory, lang],
  );

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  // Scale SVG geometry (mm -> px) with generous right margin for area + breadboard labels
  const maxAxisMm = includeEvInScale ? 120 : 70;
  const pxPerMm = includeEvInScale ? 4.4 : 7.4;
  const svgWidth = 940;
  const rowGap = 12;
  const topPad = 28;
  const leftLabelW = 148;

  let currentY = topPad;
  const footprintRows = footprints.map((fp) => {
    const boardMeta = OFFICIAL_ESP_BOARDS.find((b) => b.id === fp.id);
    const rectH = Math.max(28, Math.round(fp.widthMm * (includeEvInScale ? 0.95 : 1.38)));
    const y = currentY;
    currentY += rectH + rowGap;
    return {
      ...fp,
      pinCount: boardMeta?.pinCount ?? 30,
      y,
      rectW: Math.round(fp.lengthMm * pxPerMm),
      rectH,
    };
  });
  const svgHeight = currentY + 14;

  const activeAreaCm2 = (
    Math.round(activeBoard.lengthMm * activeBoard.widthMm * 10) / 1000
  ).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{t.boardsTitle}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 max-w-3xl">
              {t.boardsSub}
            </p>
          </div>
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
            {filteredBoards.length} / {OFFICIAL_ESP_BOARDS.length} {t.officialBoardsCount}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(["all", "Xtensa", "RISC-V"] as const).map((arch) => (
              <button
                type="button"
                key={arch}
                onClick={() => setArchFilter(arch)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                  archFilter === arch
                    ? "bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 border-cyan-600 dark:border-cyan-400"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                }`}
              >
                {arch === "all" ? t.allArch : arch}
              </button>
            ))}

            <span className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:inline-block" />

            {(
              [
                ["all", t.allRadios],
                ["wifi6", "Wi-Fi 6"],
                ["wifi5ghz", "5 GHz"],
                ["ble5", "BLE 5.0"],
                ["ieee802154", "Thread / Zigbee"],
                ["usb-otg", "USB-OTG"],
              ] as const
            ).map(([val, label]) => (
              <button
                type="button"
                key={val}
                onClick={() => setRadioFilter(val)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                  radioFilter === val
                    ? "bg-violet-500/15 border-violet-500 text-violet-700 dark:text-violet-300 font-semibold"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400"
                }`}
              >
                {label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPsramOnly((v) => !v)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-colors cursor-pointer whitespace-nowrap ${
                psramOnly
                  ? "bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400"
              }`}
            >
              PSRAM
            </button>
          </div>

          <div className="relative lg:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchBoardsPlaceholder}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Interactive To-Scale Physical PCB Size Visualizer + Real Boards Side-by-Side (Up to 4) */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Ruler className="w-4 h-4 text-cyan-500" />
              {t.sizeVisualizerTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {visualizerMode === "real4"
                ? lang === "ro"
                  ? "Compară vizual până la 4 plăci fizice una lângă alta la scară reală în milimetri."
                  : "Compare up to 4 realistic physical ESP32 boards side-by-side at true proportional millimeter scale."
                : t.sizeVisualizerHint}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Mode Toggle: Footprint Ruler vs Real Boards Side-by-Side (up to 4) */}
            <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setVisualizerMode("footprint")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  visualizerMode === "footprint"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Ruler className="w-3.5 h-3.5 text-cyan-500" />
                {lang === "ro" ? "Schemă mm" : "To-Scale Footprint"}
              </button>
              <button
                type="button"
                onClick={() => setVisualizerMode("real4")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  visualizerMode === "real4"
                    ? "bg-cyan-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                {lang === "ro"
                  ? "Plăci Reale Față-în-Față (până la 4)"
                  : "Real Boards Side-by-Side (up to 4)"}
              </button>
            </div>

            {visualizerMode === "footprint" && (
              <button
                type="button"
                onClick={() => setIncludeEvInScale((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors cursor-pointer whitespace-nowrap ${
                  includeEvInScale
                    ? "bg-teal-500/15 border-teal-500 text-teal-700 dark:text-teal-300"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-cyan-500"
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                {includeEvInScale ? t.hideEvBoard : t.includeEvBoard}
              </button>
            )}
          </div>
        </div>

        {visualizerMode === "real4" ? (
          <RealBoardsSideBySide
            lang={lang}
            allBoards={localizedBoards}
            selectedIds={compareIds}
            activeBoardId={activeBoard.id}
            onToggleBoard={toggleCompare}
            onSelectBoard={onSelectBoard}
            onOpenBench3D={onOpenBench3D}
          />
        ) : (
        <div className="rounded-xl border border-slate-800 bg-[#060a12] p-3 overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full min-w-[740px] h-auto select-none"
            role="img"
            aria-label="To-scale ESP32 development board physical footprint comparison in millimeters"
          >
            {/* Millimeter Ruler Grid */}
            {Array.from({ length: Math.floor(maxAxisMm / 10) + 1 }, (_, idx) => idx * 10).map(
              (mm) => {
                const x = leftLabelW + mm * pxPerMm;
                return (
                  <g key={mm}>
                    <line
                      x1={x}
                      y1={16}
                      x2={x}
                      y2={svgHeight - 6}
                      stroke="rgba(148,163,184,0.16)"
                      strokeWidth={mm % 20 === 0 ? 1 : 0.7}
                      strokeDasharray={mm === 0 ? undefined : "2 3"}
                    />
                    <text
                      x={x}
                      y={12}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="9.5"
                      fontFamily="IBM Plex Mono, monospace"
                    >
                      {mm} mm
                    </text>
                  </g>
                );
              },
            )}

            {/* Board Silhouettes */}
            {footprintRows.map((row) => {
              const selected = row.id === activeBoard.id;
              const palette = ACCENT_STROKE[row.accent] ?? ACCENT_STROKE.cyan;
              const barX = leftLabelW;
              const midY = row.y + row.rectH / 2;
              const antennaW = Math.min(24, row.rectW * 0.13);
              const headerCols = Math.min(22, Math.max(10, Math.round(row.pinCount / 2)));
              const usableHeaderSpan = Math.max(40, row.rectW - antennaW - 26);
              const headerStep = usableHeaderSpan / Math.max(1, headerCols - 1);

              return (
                <g
                  key={row.id}
                  onClick={() => onSelectBoard(row.id)}
                  className="cursor-pointer"
                >
                  {/* Board Label on Left */}
                  <text
                    x={6}
                    y={midY - 2}
                    fill={selected ? "#ffffff" : "#cbd5e1"}
                    fontSize="11"
                    fontWeight={selected ? "700" : "500"}
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    {row.soc}
                  </text>
                  <text
                    x={6}
                    y={midY + 11}
                    fill="#64748b"
                    fontSize="9.5"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    {row.lengthMm.toFixed(2)}×{row.widthMm.toFixed(1)} mm
                  </text>

                  {/* Scaled PCB Outline */}
                  <rect
                    x={barX}
                    y={row.y}
                    width={row.rectW}
                    height={row.rectH}
                    rx={4}
                    fill={selected ? palette.fill : "rgba(15,23,42,0.85)"}
                    stroke={selected ? palette.stroke : "#334155"}
                    strokeWidth={selected ? 2 : 1.2}
                  />

                  {/* RF Keep-out / PCB Antenna Zone on Right */}
                  <rect
                    x={barX + row.rectW - antennaW - 3}
                    y={row.y + 3}
                    width={antennaW}
                    height={row.rectH - 6}
                    rx={2}
                    fill="rgba(148,163,184,0.12)"
                    stroke="rgba(148,163,184,0.28)"
                    strokeWidth={0.75}
                  />

                  {/* USB Port Notch on Left Edge */}
                  <rect
                    x={barX - 3}
                    y={midY - 6}
                    width={7}
                    height={12}
                    rx={1.5}
                    fill="#94a3b8"
                  />

                  {/* Evenly Spaced Pin Header Dots along Top/Bottom */}
                  {row.formFactor === "devkit-breadboard" &&
                    Array.from({ length: headerCols }).map((_, i) => (
                      <g key={i}>
                        <circle
                          cx={barX + 12 + i * headerStep}
                          cy={row.y + 4.5}
                          r={1.35}
                          fill={selected ? palette.text : "#475569"}
                        />
                        <circle
                          cx={barX + 12 + i * headerStep}
                          cy={row.y + row.rectH - 4.5}
                          r={1.35}
                          fill={selected ? palette.text : "#475569"}
                        />
                      </g>
                    ))}

                  {/* Board Name Inside PCB */}
                  <text
                    x={barX + 14}
                    y={midY + 3.5}
                    fill={selected ? "#f8fafc" : "#94a3b8"}
                    fontSize="10.5"
                    fontWeight={selected ? "700" : "500"}
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    {row.name}
                  </text>

                  {/* Area & Breadboard Note on Right (never clipped) */}
                  <text
                    x={barX + row.rectW + 12}
                    y={midY + 3.5}
                    fill={selected ? palette.text : "#94a3b8"}
                    fontSize="10.5"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    {row.areaCm2.toFixed(1)} cm² ·{" "}
                    {t.breadboardNotes[row.breadboardNote as keyof typeof t.breadboardNotes] ??
                      row.breadboardNote}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        )}
      </div>

      {/* Main Split: Official Board Cards + Detailed Spec & Documentation Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Board Cards List */}
        <div className="lg:col-span-5 space-y-3">
          {filteredBoards.length === 0 ? (
            <div className="p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 text-center text-sm text-slate-500 dark:text-slate-400">
              {t.noBoardsFound}
            </div>
          ) : (
            filteredBoards.map((board) => {
              const isSelected = board.id === activeBoard.id;
              const isCompared = compareIds.includes(board.id);

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
                  className={`p-4 rounded-xl border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                    isSelected
                      ? "bg-cyan-500/10 border-cyan-500"
                      : "bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-cyan-500/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                        <span className="font-bold text-cyan-600 dark:text-cyan-400">
                          {board.soc}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{board.arch}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{board.maxFreqMhz} MHz</span>
                      </div>
                      <h3 className="font-bold text-base mt-0.5 truncate">{board.name}</h3>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompare(board.id);
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono border shrink-0 transition-colors cursor-pointer ${
                        isCompared
                          ? "bg-violet-500/15 border-violet-500 text-violet-700 dark:text-violet-300 font-semibold"
                          : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-violet-500"
                      }`}
                    >
                      {isCompared && <Check className="w-3 h-3" />}
                      {t.compareToggle}
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {board.tagline}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                    <span>
                      {board.lengthMm.toFixed(2)} × {board.widthMm.toFixed(2)} mm
                    </span>
                    <span className="truncate max-w-[210px] text-slate-700 dark:text-slate-300">
                      {board.wirelessLabels.slice(0, 2).join(" · ")}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Official Spec & Documentation Inspector */}
        <div className="lg:col-span-7 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 space-y-5 lg:sticky lg:top-28">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                {activeBoard.moduleName}
              </div>
              <h2 className="text-xl font-bold tracking-tight mt-0.5">{activeBoard.name}</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                {activeBoard.tagline}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeBoard.id === "esp32-s3-devkitc-1" && (
                <button
                  type="button"
                  onClick={onOpenPinout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:border-cyan-500 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Sliders className="w-3.5 h-3.5 text-cyan-500" />
                  {t.inspectPinout}
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenIdeasForBoard(activeBoard.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 hover:bg-cyan-500 dark:hover:bg-cyan-400 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                {t.ideasForBoard}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Physical Dimensions & Mechanical Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{t.boardSize}</div>
              <div className="font-mono text-sm font-bold text-cyan-600 dark:text-cyan-400 tabular-nums mt-0.5">
                {activeBoard.lengthMm.toFixed(2)}×{activeBoard.widthMm.toFixed(2)}
              </div>
              <div className="text-[10px] font-mono text-slate-500">mm ({activeAreaCm2} cm²)</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{t.moduleSize}</div>
              <div className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-1">
                {activeBoard.moduleSizeMm}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{t.cpuClock}</div>
              <div className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                {activeBoard.maxFreqMhz} MHz
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                {activeBoard.arch} · {activeBoard.cores}C
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Deep-Sleep</div>
              <div className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                ~{activeBoard.deepSleepUa} µA
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                {activeBoard.gpios} GPIO · {activeBoard.pinCount} {t.pinsLabel.toLowerCase()}
              </div>
            </div>
          </div>

          {/* Core Technical Specification Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200/70 dark:divide-slate-800/80 text-xs">
            <div className="grid grid-cols-12 px-3.5 py-2.5 gap-2">
              <span className="col-span-4 text-slate-500 dark:text-slate-400 font-medium">{t.processorLabel}</span>
              <span className="col-span-8 font-mono text-slate-900 dark:text-slate-100">{activeBoard.cpu}</span>
            </div>
            <div className="grid grid-cols-12 px-3.5 py-2.5 gap-2">
              <span className="col-span-4 text-slate-500 dark:text-slate-400 font-medium">SRAM / PSRAM</span>
              <span className="col-span-8 font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                {activeBoard.sramKb} KB SRAM · {activeBoard.psramSpec}
              </span>
            </div>
            <div className="grid grid-cols-12 px-3.5 py-2.5 gap-2">
              <span className="col-span-4 text-slate-500 dark:text-slate-400 font-medium">{t.flashStorageLabel}</span>
              <span className="col-span-8 font-mono text-slate-900 dark:text-slate-100">{activeBoard.flashSpec}</span>
            </div>
            <div className="grid grid-cols-12 px-3.5 py-2.5 gap-2">
              <span className="col-span-4 text-slate-500 dark:text-slate-400 font-medium">{t.wirelessRfLabel}</span>
              <span className="col-span-8 font-mono text-violet-700 dark:text-violet-300">
                {activeBoard.wirelessLabels.join(" · ")}
              </span>
            </div>
            <div className="grid grid-cols-12 px-3.5 py-2.5 gap-2">
              <span className="col-span-4 text-slate-500 dark:text-slate-400 font-medium">{t.usbInterfaceLabel}</span>
              <span className="col-span-8 font-mono text-slate-900 dark:text-slate-100">{activeBoard.usb}</span>
            </div>
            <div className="grid grid-cols-12 px-3.5 py-2.5 gap-2">
              <span className="col-span-4 text-slate-500 dark:text-slate-400 font-medium">{t.operatingTempLabel}</span>
              <span className="col-span-8 font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                {activeBoard.operatingTemp} · Pitch {activeBoard.pinPitchMm} mm
              </span>
            </div>
          </div>

          {/* Peripherals & Best For */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="text-xs font-semibold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Cpu className="w-3.5 h-3.5 text-cyan-500" />
                {t.keyPeripheralsLabel}
              </div>
              <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                {activeBoard.peripherals.map((item) => (
                  <li key={item} className="font-mono text-[11px]">
                    · {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-semibold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Radio className="w-3.5 h-3.5 text-emerald-500" />
                {t.idealAppsLabel}
              </div>
              <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                {activeBoard.bestFor.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Hardware Gotcha */}
          <div className="p-3.5 rounded-lg border border-amber-500/40 bg-amber-500/10 flex items-start gap-2.5 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-slate-800 dark:text-amber-100 leading-relaxed">
              <strong className="font-semibold">{t.hardwareNoteLabel}: </strong>
              {activeBoard.gotcha}
            </div>
          </div>

          {/* Official Espressif Documentation Links for this Board */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-cyan-500" />
              {t.officialDocsForBoard} ({activeBoard.soc})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeBoard.docs.map((doc) => (
                <a
                  key={doc.url}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 hover:border-cyan-500 transition-colors flex flex-col justify-between gap-1.5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                      <span>{t.docKinds[doc.kind]}</span>
                      <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                    </div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 mt-0.5">
                      {doc.title}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {doc.summary}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Deep Engineering Screw-Level Hardware Teardown & Exploded Stackup for Selected Board */}
      <BoardTeardownDrilldown board={activeBoard} lang={lang} />

      {/* Multi-Domain Adult Engineering Side-by-Side Board Comparator (Drill-Down to Screw Level) */}
      <AdultEngineeringTable
        lang={lang}
        comparison={comparison}
        onSelectBoard={onSelectBoard}
        onToggleCompare={toggleCompare}
        onInspectTeardown={() => {
          document
            .getElementById("screw-teardown-panel")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        title={t.boardComparatorTitle}
        hint={
          lang === "ro"
            ? "Compară până la 4 plăci pe 5 domenii inginerești — apasă pe orice rând pentru a deschide detaliile până la nivel de șurub, filet, gaură PCB, cuplu și BOM."
            : "Compare up to 4 boards across 5 engineering domains — click any row to drill down to screw ISO standards, thread pitch, PCB drill holes, torque, and BOM cost."
        }
        emptyPrompt={t.compareEmptyPrompt}
        selectedLabel={t.selectedOfThree}
      />

      {/* Official Espressif Documentation Library */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-500" />
              {t.docsHubTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.docsHubSub}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                "all",
                "Getting Started",
                "Hardware & PCB",
                "ESP-IDF & SDKs",
                "Wireless & Matter",
              ] as const
            ).map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setDocCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  docCategory === cat
                    ? "bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300 font-semibold"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400"
                }`}
              >
                {cat === "all" ? t.filterAll : t.docCategories[cat]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {filteredDocs.map((doc) => (
            <a
              key={doc.id}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:border-cyan-500 transition-colors flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                  <span>{t.docCategories[doc.category]}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                </div>
                <h3 className="text-sm font-bold mt-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  {doc.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {doc.summary}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800/80 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {doc.appliesTo}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Interactive Espressif Hardware Design Guidelines — Schematic Checklist */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              {lang === "ro"
                ? "Lista Oficială de Verificare Schemă Electrică Espressif (Schematic Checklist)"
                : "Official Espressif Hardware Design — Schematic Checklist"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-3xl">
              {lang === "ro"
                ? "Verifică punctele critice din ghidul oficial Espressif înainte de a alimenta placa sau de a comanda PCB-ul."
                : "Verify every critical electrical rule from Espressif's official hardware design guidelines before powering up or ordering a PCB."}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
              {checkedChecklistIds.length} / {ESPRESSIF_SCHEMATIC_CHECKLIST.length}{" "}
              {lang === "ro" ? "verificate" : "verified"}
            </span>
            <a
              href="https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32/schematic-checklist.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <span>{lang === "ro" ? "Deschide Ghidul Oficial" : "Open Official Checklist"}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ESPRESSIF_SCHEMATIC_CHECKLIST.map((item) => {
            const checked = checkedChecklistIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-colors flex flex-col justify-between gap-2.5 ${
                  checked
                    ? "bg-emerald-500/8 border-emerald-500/45"
                    : "bg-slate-50/70 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => toggleChecklistItem(item.id)}
                    aria-label={pickCopy(item.section, lang)}
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                      checked
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    }`}
                  >
                    {checked && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {pickCopy(item.section, lang)}
                      </h3>
                      <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                        {item.specValues}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {pickCopy(item.requirement, lang)}
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300/90 leading-snug">
                      <strong>{lang === "ro" ? "Capcană frecventă:" : "Common pitfall:"}</strong>{" "}
                      {pickCopy(item.commonPitfall, lang)}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    <span>docs.espressif.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Complete Data Provenance & Official Reference Sources Registry */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-cyan-500" />
              {lang === "ro"
                ? "Surse Oficiale de Date & Referințe Verificate (Espressif · Flipper · Comunitate)"
                : "Verified Official Data Sources & Reference Registry (Espressif · Flipper · Community)"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {lang === "ro"
                ? "Toate paginile oficiale din care au fost extrase dimensiunile (mm), pinout-urile, registrele pe 32 biți și ghidurile hardware."
                : "Every official engineering page referenced for millimeter PCB sizes, pinouts, 32-bit registers, and hardware design guides."}
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 tabular-nums">
            {OFFICIAL_REFERENCE_SOURCES.length} {lang === "ro" ? "surse" : "sources"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {OFFICIAL_REFERENCE_SOURCES.map((src) => (
            <a
              key={src.id}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:border-cyan-500 transition-colors flex flex-col justify-between gap-2"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                  <span>{src.publisher}</span>
                  <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100 shrink-0" />
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                  {pickCopy(src.title, lang)}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                  {pickCopy(src.usedFor, lang)}
                </p>
              </div>
              <div className="text-[10px] font-mono text-slate-500 truncate">
                {src.url}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
