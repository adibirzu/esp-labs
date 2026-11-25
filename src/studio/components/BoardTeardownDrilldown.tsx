import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Layers,
  Package,
  Ruler,
  Search,
  SlidersHorizontal,
  Wrench,
} from "lucide-react";
import type { TeardownSubsystem } from "../data/hardware-teardown";
import {
  computeBomSummary,
  exportTeardownCsv,
  filterTeardownBom,
  getBoardTeardown,
  getMetricScrewSpec,
  METRIC_SCREW_TABLE,
  type MetricScrewStandard,
} from "../logic/teardown-engine";
import type { EspBoardSpec, Lang } from "../types";

interface BoardTeardownDrilldownProps {
  board: EspBoardSpec;
  lang: Lang;
  compact?: boolean;
}

const SUBSYSTEM_META: Record<
  TeardownSubsystem,
  { en: string; ro: string; colorClass: string }
> = {
  "silicon-rf": { en: "Silicon & RF", ro: "Siliciu & RF", colorClass: "text-cyan-600 dark:text-cyan-400" },
  "power-ldo": { en: "Power & LDO", ro: "Alimentare LDO", colorClass: "text-emerald-600 dark:text-emerald-400" },
  "usb-bridge": { en: "USB & Bridge", ro: "USB & Punte", colorClass: "text-violet-600 dark:text-violet-400" },
  "headers-ui": { en: "UI & Connectors", ro: "Conectori & UI", colorClass: "text-amber-600 dark:text-amber-400" },
  "passives-esd": { en: "ESD & Passives", ro: "ESD & Pasive", colorClass: "text-sky-600 dark:text-sky-400" },
  "mechanical-screws": { en: "Screws & Mount", ro: "Șuruburi & Prindere", colorClass: "text-rose-600 dark:text-rose-400" },
};

const STACK_LAYERS = [
  {
    id: "screws-top",
    code: "L1",
    color: "#f43f5e",
    en: "Top Fasteners: Pan/Hex Screws + PA66 Nylon Insulating Washers",
    ro: "Fixare Superioară: Șuruburi Inox + Șaibe Izolatoare Nailon PA66",
    detailEn: "DIN 7985 M2.5×4mm (0.28 N·m) or ISO 7380 M3×6mm (0.55 N·m on EV). Nylon washer prevents copper-plane shorts.",
    detailRo: "DIN 7985 M2.5×4mm (0.28 N·m) sau ISO 7380 M3×6mm (0.55 N·m pe EV). Șaiba din nailon previne scurtcircuitele pe masca PCB.",
  },
  {
    id: "rf-shield",
    code: "L2",
    color: "#94a3b8",
    en: "0.20 mm CuNiZn EMI RF Shield Can + Tactile RST/BOOT Actuators",
    ro: "Capac Ecranare EMI/RF 0.20 mm CuNiZn + Micro-Butoane RST/BOOT",
    detailEn: "Laser-etched nickel-silver can soldered to 16 perimeter GND pads; tactile domes rated 160 gf / 100k cycles.",
    detailRo: "Capac metalic gravat laser lipit pe 16 pad-uri GND perimetrale; butoane tactile 160 gf / 100k cicluri.",
  },
  {
    id: "silicon-smd",
    code: "L3",
    color: "#06b6d4",
    en: "Active Silicon (QFN SoC, LDO, USB Bridge, 40 MHz XTAL) & 0402 Passives",
    ro: "Siliciu Activ (SoC QFN, LDO, Punte USB, Cristal 40 MHz) & Pasive 0402",
    detailEn: "Reflowed with RoHS SAC305 paste at 245 °C; QFN thermal ground slug stitched via 3×3 or 5×5 Ø0.30 mm vias.",
    detailRo: "Lipit prin reflow cu pastă SAC305 la 245 °C; pad-ul termic central QFN conectat prin matrice de vias Ø0.30 mm.",
  },
  {
    id: "pcb-fr4",
    code: "L4",
    color: "#10b981",
    en: "Multi-Layer FR-4 TG150/170 PCB (1.60 mm) + ENIG Gold Pads + 50 Ω Antenna",
    ro: "Placă PCB Multi-Strat FR-4 TG150/170 (1.60 mm) + ENIG Aur + Antenă 50 Ω",
    detailEn: "1 oz outer copper, inner solid GND & 3.3V planes, 90 Ω USB differential traces, Ø1.00 mm PTH header barrels.",
    detailRo: "Cupru exterior 1 oz, planuri interne continue GND și 3.3V, trasee USB diferențiale 90 Ω, găuri metalizate Ø1.00 mm.",
  },
  {
    id: "standoffs",
    code: "L5",
    color: "#f59e0b",
    en: "2.54 mm Gold-Flash Pin Headers & Nickel-Plated Brass Hex Standoffs",
    ro: "Barete Pini Aurite 2.54 mm & Distanțiere Hexagonale din Alamă",
    detailEn: "0.64 mm square posts + C36000 brass standoffs (8–12 mm height) giving clearance for Dupont wires & ribbons.",
    detailRo: "Pini pătrați 0.64 mm + distanțiere din alamă C36000 (8–12 mm înălțime) pentru acces liber la fire și panglici.",
  },
  {
    id: "base-nuts",
    code: "L6",
    color: "#8b5cf6",
    en: "Enclosure Baseplate, Carrier Sled & DIN 934 Stainless Lock Nuts",
    ro: "Placă de Bază Carcasă, Suport Șină DIN & Piulițe Blocare Inox DIN 934",
    detailEn: "5.0 mm / 5.5 mm hex lock nuts anchor the full assembly to acrylic, aluminum, or 3D-printed enclosures.",
    detailRo: "Piulițele hexagonale de 5.0 mm / 5.5 mm ancorează întregul ansamblu pe carcase din acril, aluminiu sau printate 3D.",
  },
] as const;

export function BoardTeardownDrilldown({
  board,
  lang,
  compact = false,
}: BoardTeardownDrilldownProps) {
  const teardown = useMemo(() => getBoardTeardown(board.id), [board.id]);
  const summary = useMemo(() => computeBomSummary(teardown), [teardown]);

  const [activeTab, setActiveTab] = useState<"bom" | "screws" | "stackup" | "calculator">("bom");
  const [subsystemFilter, setSubsystemFilter] = useState<"all" | TeardownSubsystem>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedBomIds, setExpandedBomIds] = useState<string[]>([
    teardown.bom[0]?.id ?? "",
    teardown.bom[teardown.bom.length - 1]?.id ?? "",
  ]);
  const [selectedFastenerId, setSelectedFastenerId] = useState<string>(teardown.fasteners[0]?.id ?? "");
  const [explodePct, setExplodePct] = useState<number>(65);
  const [activeLayerIdx, setActiveLayerIdx] = useState<number>(0);
  const [calcScrewSize, setCalcScrewSize] = useState<MetricScrewStandard["size"]>(
    board.formFactor === "ev-board" ? "M3.0" : "M2.5",
  );

  const filteredBom = useMemo(
    () => filterTeardownBom(teardown.bom, searchQuery, subsystemFilter),
    [teardown.bom, searchQuery, subsystemFilter],
  );

  const selectedFastener =
    teardown.fasteners.find((f) => f.id === selectedFastenerId) ?? teardown.fasteners[0];
  const calcScrew = getMetricScrewSpec(calcScrewSize);

  const toggleBomRow = (id: string) => {
    setExpandedBomIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleDownloadCsv = () => {
    const csv = exportTeardownCsv(board.name, teardown);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${board.id}-screw-level-bom.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const layerGap = (explodePct / 100) * 26;

  return (
    <section
      id="screw-teardown-panel"
      aria-label={lang === "ro" ? "Analiză Hardware până la Nivel de Șurub" : "Screw-Level Hardware Teardown"}
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/75 p-5 space-y-5"
    >
      {/* Header + Mechanical KPI Strip */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-mono font-semibold text-cyan-600 dark:text-cyan-400">
            {board.name} · {teardown.mechanical.pcbLayers}-Layer {teardown.mechanical.fr4Grade} ·{" "}
            {teardown.mechanical.primaryScrewIso}
          </div>
          <h2 className={compact ? "text-base font-bold tracking-tight" : "text-lg font-bold tracking-tight"}>
            {lang === "ro"
              ? "Deconstrucție Inginerească & BOM până la Nivel de Șurub"
              : "Engineering Teardown & Screw-Level BOM Drill-Down"}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl">
            {lang === "ro"
              ? "Explorează fiecare subsistem, designator (U1, U2, J2, MH1), șurub ISO/DIN, pas de filet, gaură de trecere, cuplu de strângere (N·m) și profil de lipire SAC305."
              : "Drill down from assembly to designator (U1, U2, J2, MH1), ISO/DIN screw thread pitch, clearance drill Ø, torque limit (N·m), brass standoffs, and SAC305 solder profile."}
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadCsv}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          {lang === "ro" ? "Descarcă BOM + Șuruburi (CSV)" : "Download Screw & BOM CSV"}
        </button>
      </div>

      {/* 4 Quantitative Engineering Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {lang === "ro" ? "Șurub Principal & Cuplu" : "Primary Screw & Torque"}
          </div>
          <div className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
            {teardown.mechanical.primaryScrewIso}
          </div>
          <div className="text-[10px] font-mono text-slate-500 tabular-nums mt-0.5">
            Pitch {teardown.mechanical.primaryScrewPitchMm} mm · Max {teardown.mechanical.maxTorqueNm}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {lang === "ro" ? "PCB Stackup & Lipire" : "PCB Stackup & Solder"}
          </div>
          <div className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {teardown.mechanical.pcbLayers}L · {teardown.mechanical.pcbThicknessMm}
          </div>
          <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
            {teardown.mechanical.surfaceFinish}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {lang === "ro" ? "Total Piese & Elemente Fixare" : "BOM & Fastener Pieces"}
          </div>
          <div className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 mt-1 tabular-nums">
            {teardown.mechanical.smdPartCount} SMD · {summary.fastenerPieceCount} {lang === "ro" ? "fixări" : "fasteners"}
          </div>
          <div className="text-[10px] font-mono text-slate-500 tabular-nums mt-0.5">
            {summary.subPartDetailCount} {lang === "ro" ? "micro-detalii inspectabile" : "micro sub-part nodes"}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {lang === "ro" ? "Cost BOM Estimat (1 / 100 buc)" : "Est. BOM Cost (1 / 100 pcs)"}
          </div>
          <div className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            ${summary.estimatedUnitBomUsd.toFixed(2)} / ${summary.estimated100QtyBomUsd.toFixed(2)}
          </div>
          <div className="text-[10px] font-mono text-slate-500 tabular-nums mt-0.5">
            {teardown.mechanical.massGrams} g · {teardown.mechanical.driverBit}
          </div>
        </div>
      </div>

      {/* Mode Switch Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-3">
        {(
          [
            {
              id: "bom",
              icon: Package,
              en: `Component BOM Tree (${teardown.bom.length})`,
              ro: `Arbore BOM Componente (${teardown.bom.length})`,
            },
            {
              id: "screws",
              icon: Wrench,
              en: `Screws, Standoffs & Washers (${teardown.fasteners.length})`,
              ro: `Șuruburi, Distanțiere & Șaibe (${teardown.fasteners.length})`,
            },
            {
              id: "stackup",
              icon: Layers,
              en: "Exploded 6-Layer Stackup",
              ro: "Vedere Explodată 6 Straturi",
            },
            {
              id: "calculator",
              icon: Ruler,
              en: "ISO Screw & PCB Drill Calc",
              ro: "Calculator Șurub ISO & Gaură PCB",
            },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? "bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 border-cyan-600 dark:border-cyan-400"
                  : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-cyan-500"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab[lang]}
            </button>
          );
        })}
      </div>

      {/* TAB 1: 4-LEVEL COMPONENT BOM TREE */}
      {activeTab === "bom" && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSubsystemFilter("all")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                  subsystemFilter === "all"
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 border-slate-900 dark:border-slate-100"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-cyan-500"
                }`}
              >
                {lang === "ro" ? "Toate" : "All"}
              </button>
              {(Object.keys(SUBSYSTEM_META) as TeardownSubsystem[]).map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSubsystemFilter(sub)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    subsystemFilter === sub
                      ? "bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300 font-semibold"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400"
                  }`}
                >
                  {SUBSYSTEM_META[sub][lang]}
                </button>
              ))}
            </div>

            <div className="relative sm:w-64 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === "ro"
                    ? "Caută MPN, DIN 7985, LDO, QFN..."
                    : "Search MPN, DIN 7985, LDO, QFN..."
                }
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
            {filteredBom.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                {lang === "ro"
                  ? "Nicio piesă nu corespunde filtrului curent."
                  : "No BOM components match the current search filter."}
              </div>
            ) : (
              filteredBom.map((item) => {
                const expanded = expandedBomIds.includes(item.id);
                const subMeta = SUBSYSTEM_META[item.subsystem];
                return (
                  <div key={item.id} className="bg-white dark:bg-slate-900/50">
                    <button
                      type="button"
                      onClick={() => toggleBomRow(item.id)}
                      aria-expanded={expanded}
                      className="w-full text-left px-4 py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        {expanded ? (
                          <ChevronDown className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {item.designator}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className={`font-semibold ${subMeta.colorClass}`}>
                              {subMeta[lang]}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-500 dark:text-slate-400">{item.mpn}</span>
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                            {item.name[lang]}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-[11px] font-mono tabular-nums shrink-0 pl-6 sm:pl-0">
                        <span className="text-slate-500 dark:text-slate-400 hidden md:inline">
                          {item.packageType}
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">
                          ×{item.qty}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          ${(item.unitCostUsd * item.qty).toFixed(2)}
                        </span>
                      </div>
                    </button>

                    {expanded && (
                      <div className="px-4 pb-4 pt-1 pl-10 bg-slate-50/80 dark:bg-slate-950/70 space-y-3 border-t border-slate-200/70 dark:border-slate-800/70">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <p className="leading-relaxed max-w-3xl">{item.datasheetNote[lang]}</p>
                          <div className="font-mono text-[11px] text-cyan-700 dark:text-cyan-300">
                            {item.manufacturer} · {item.solderOrMount}
                          </div>
                        </div>

                        {/* Level 3: Micro Sub-Parts & Screw / Solder Tolerances */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                          {item.subParts.map((sp) => (
                            <div
                              key={sp.id}
                              className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1"
                            >
                              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                {sp.label[lang]}
                              </div>
                              <div className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400">
                                {sp.spec}
                              </div>
                              <div className="text-[10.5px] font-mono text-amber-600 dark:text-amber-400">
                                {lang === "ro" ? "Toleranță / Limită:" : "Tolerance / Limit:"} {sp.tolerance}
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug pt-0.5">
                                {sp.detail[lang]}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SCREWS, STANDOFFS, WASHERS & FASTENER INSPECTOR */}
      {activeTab === "screws" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-7 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-500">
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">{lang === "ro" ? "Element Fixare" : "Fastener"}</th>
                  <th className="py-2.5 px-3">{lang === "ro" ? "Filet / Pas" : "Thread / Pitch"}</th>
                  <th className="py-2.5 px-3">{lang === "ro" ? "Cuplu" : "Torque"}</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/80">
                {teardown.fasteners.map((f) => {
                  const active = selectedFastener?.id === f.id;
                  return (
                    <tr
                      key={f.id}
                      onClick={() => setSelectedFastenerId(f.id)}
                      className={`cursor-pointer transition-colors ${
                        active
                          ? "bg-cyan-500/10 text-slate-900 dark:text-white"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                        {f.code}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {f.name[lang]}
                        </div>
                        <div className="text-[10.5px] font-mono text-slate-500">{f.isoStandard}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {f.threadSpec}
                        {f.pitchMm > 0 && <div className="text-[10px] text-slate-500">P = {f.pitchMm} mm</div>}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-amber-600 dark:text-amber-400">
                        {f.torqueNm}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right font-bold">
                        ×{f.qty}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Screw Mechanical Blueprint Card */}
          {selectedFastener && (
            <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/75 p-4 space-y-3.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                    {selectedFastener.code} · {selectedFastener.isoStandard}
                  </div>
                  <h3 className="text-sm font-bold mt-0.5">{selectedFastener.name[lang]}</h3>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  ${(selectedFastener.unitCostUsd * selectedFastener.qty).toFixed(2)}
                </span>
              </div>

              {/* Clean Technical Orthographic Screw / Fastener SVG */}
              <div className="rounded-lg bg-[#070c16] border border-slate-800 p-3">
                <svg
                  viewBox="0 0 320 96"
                  className="w-full h-24 select-none"
                  role="img"
                  aria-label={`${selectedFastener.threadSpec} orthographic dimensional callout`}
                >
                  {/* Dimension lines */}
                  <line x1="26" y1="22" x2="294" y2="22" stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />
                  <line x1="26" y1="74" x2="294" y2="74" stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />
                  {selectedFastener.kind === "washer" ? (
                    <g>
                      <circle cx="96" cy="48" r="24" fill="#334155" stroke="#38bdf8" strokeWidth="1.8" />
                      <circle cx="96" cy="48" r="11" fill="#070c16" stroke="#94a3b8" strokeWidth="1.5" />
                      <rect x="176" y="42" width="66" height="12" rx="2" fill="#334155" stroke="#38bdf8" strokeWidth="1.6" />
                      <text x="160" y="16" textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontFamily="IBM Plex Mono, monospace">
                        {selectedFastener.headOrOdMm} · {selectedFastener.clearanceDrillMm}
                      </text>
                    </g>
                  ) : selectedFastener.kind === "standoff" ? (
                    <g>
                      <polygon
                        points="70,26 106,26 118,48 106,70 70,70 58,48"
                        fill="#b45309"
                        fillOpacity="0.45"
                        stroke="#fbbf24"
                        strokeWidth="1.8"
                      />
                      <circle cx="88" cy="48" r="9" fill="#070c16" stroke="#fbbf24" strokeWidth="1.4" />
                      <rect x="150" y="34" width="110" height="28" rx="3" fill="#b45309" fillOpacity="0.35" stroke="#fbbf24" strokeWidth="1.8" />
                      <line x1="150" y1="42" x2="260" y2="42" stroke="#fbbf24" strokeOpacity="0.4" />
                      <line x1="150" y1="54" x2="260" y2="54" stroke="#fbbf24" strokeOpacity="0.4" />
                      <text x="160" y="16" textAnchor="middle" fill="#fbbf24" fontSize="9.5" fontFamily="IBM Plex Mono, monospace">
                        {selectedFastener.headOrOdMm} · {selectedFastener.threadSpec}
                      </text>
                    </g>
                  ) : (
                    /* Pan/Button Head Machine Screw Profile */
                    <g>
                      {/* Screw Head */}
                      <path
                        d="M 74 28 Q 52 28 52 48 Q 52 68 74 68 L 84 68 L 84 28 Z"
                        fill="#475569"
                        stroke="#e2e8f0"
                        strokeWidth="1.8"
                      />
                      {/* Threaded Shank */}
                      <rect x="84" y="38" width="150" height="20" rx="2" fill="#334155" stroke="#94a3b8" strokeWidth="1.6" />
                      {/* Pitch Thread Ridges */}
                      {Array.from({ length: 14 }).map((_, i) => (
                        <line
                          key={i}
                          x1={94 + i * 10}
                          y1="38"
                          x2={98 + i * 10}
                          y2="58"
                          stroke="#38bdf8"
                          strokeWidth="1.4"
                        />
                      ))}
                      <text x="160" y="16" textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontFamily="IBM Plex Mono, monospace">
                        {selectedFastener.threadSpec} · P={selectedFastener.pitchMm} mm · {selectedFastener.torqueNm}
                      </text>
                    </g>
                  )}
                  <text x="160" y="88" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="IBM Plex Mono, monospace">
                    {selectedFastener.clearanceDrillMm} · {selectedFastener.driveTool}
                  </text>
                </svg>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                <div className="py-1.5 flex justify-between gap-2">
                  <span className="text-slate-500">{lang === "ro" ? "Cap / Profil" : "Head / OD"}</span>
                  <span className="font-mono font-semibold tabular-nums">{selectedFastener.headOrOdMm}</span>
                </div>
                <div className="py-1.5 flex justify-between gap-2">
                  <span className="text-slate-500">{lang === "ro" ? "Gaură Trecere PCB" : "PCB Clearance Drill"}</span>
                  <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-400 tabular-nums">
                    {selectedFastener.clearanceDrillMm}
                  </span>
                </div>
                <div className="py-1.5 flex justify-between gap-2">
                  <span className="text-slate-500">{lang === "ro" ? "Cheie / Bit" : "Driver Tool"}</span>
                  <span className="font-mono font-semibold">{selectedFastener.driveTool}</span>
                </div>
                <div className="py-1.5 flex justify-between gap-2">
                  <span className="text-slate-500">{lang === "ro" ? "Material" : "Material"}</span>
                  <span className="font-medium text-right">{selectedFastener.material[lang]}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                {selectedFastener.notes[lang]}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EXPLODED 6-LAYER MECHANICAL STACKUP */}
      {activeTab === "stackup" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-[#060b14] p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                <span>{lang === "ro" ? "Separare Explodată Straturi" : "Exploded Layer Separation"}</span>
              </div>
              <div className="flex items-center gap-2 w-48">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={explodePct}
                  onChange={(e) => setExplodePct(Number(e.target.value))}
                  aria-label={lang === "ro" ? "Factor explozie straturi PCB" : "Exploded PCB stackup separation"}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <span className="font-mono text-xs text-cyan-400 tabular-nums w-10 text-right">
                  {explodePct}%
                </span>
              </div>
            </div>

            <svg
              viewBox="0 0 540 270"
              className="w-full h-auto select-none"
              role="img"
              aria-label="Interactive exploded 6-layer mechanical PCB and screw stackup diagram"
            >
              {STACK_LAYERS.map((layer, idx) => {
                const baseY = 26 + idx * (16 + layerGap * 0.72);
                const active = activeLayerIdx === idx;
                return (
                  <g
                    key={layer.id}
                    onClick={() => setActiveLayerIdx(idx)}
                    className="cursor-pointer"
                  >
                    {/* Isometric Slab Plate */}
                    <polygon
                      points={`120,${baseY} 360,${baseY - 12} 430,${baseY + 8} 190,${baseY + 20}`}
                      fill={layer.color}
                      fillOpacity={active ? 0.34 : 0.14}
                      stroke={layer.color}
                      strokeWidth={active ? 2.2 : 1.1}
                    />
                    {/* Corner M2.5/M3 Fastener Axis Guide Lines */}
                    {idx < STACK_LAYERS.length - 1 && explodePct > 15 && (
                      <>
                        <line
                          x1="150"
                          y1={baseY + 12}
                          x2="150"
                          y2={baseY + 16 + layerGap * 0.72}
                          stroke="#f43f5e"
                          strokeOpacity="0.45"
                          strokeDasharray="2 3"
                        />
                        <line
                          x1="392"
                          y1={baseY + 2}
                          x2="392"
                          y2={baseY + 8 + layerGap * 0.72}
                          stroke="#f43f5e"
                          strokeOpacity="0.45"
                          strokeDasharray="2 3"
                        />
                      </>
                    )}
                    {/* Layer Tag on Left */}
                    <line
                      x1="64"
                      y1={baseY + 6}
                      x2="120"
                      y2={baseY + 6}
                      stroke={active ? layer.color : "#334155"}
                      strokeWidth={active ? 1.5 : 1}
                    />
                    <text
                      x="18"
                      y={baseY + 9}
                      fill={active ? "#ffffff" : "#94a3b8"}
                      fontSize="10.5"
                      fontWeight="700"
                      fontFamily="IBM Plex Mono, monospace"
                    >
                      {layer.code}
                    </text>
                    <text
                      x="442"
                      y={baseY + 9}
                      fill={active ? "#f8fafc" : "#64748b"}
                      fontSize="9.5"
                      fontFamily="IBM Plex Mono, monospace"
                    >
                      {layer.id === "screws-top"
                        ? teardown.mechanical.primaryScrewIso.split(" ")[0]
                        : layer.id === "pcb-fr4"
                          ? `${teardown.mechanical.pcbLayers}L FR-4`
                          : layer.id === "standoffs"
                            ? "Brass Hex"
                            : layer.code}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="lg:col-span-5 space-y-2">
            {STACK_LAYERS.map((layer, idx) => {
              const active = activeLayerIdx === idx;
              return (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => setActiveLayerIdx(idx)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                    active
                      ? "bg-cyan-500/10 border-cyan-500"
                      : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span
                      className="font-mono px-1.5 py-0.5 rounded text-[10px] text-white"
                      style={{ backgroundColor: layer.color }}
                    >
                      {layer.code}
                    </span>
                    <span className="text-slate-900 dark:text-slate-100">{layer[lang]}</span>
                  </div>
                  {active && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                      {lang === "ro" ? layer.detailRo : layer.detailEn}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: ISO 273 METRIC SCREW & PCB HOLE CALCULATOR */}
      {activeTab === "calculator" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {lang === "ro"
                ? "Selectează dimensiunea metrică ISO (M2.0 – M4.0) pentru diametrele exacte de găurire PCB, tarodare, inel cupru keep-out și cuplul sigur pe FR-4."
                : "Select an ISO metric screw thread (M2.0 – M4.0) for exact ISO 273 PCB clearance drills, tap drill Ø, copper pad keep-out, and safe FR-4 torque."}
            </p>
            <div className="flex items-center gap-1.5">
              {METRIC_SCREW_TABLE.map((row) => (
                <button
                  key={row.size}
                  type="button"
                  onClick={() => setCalcScrewSize(row.size)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                    calcScrewSize === row.size
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-rose-500"
                  }`}
                >
                  {row.size}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70">
              <div className="text-[11px] font-sans text-slate-500">
                {lang === "ro" ? "Filet & Pas (ISO)" : "Thread & Pitch"}
              </div>
              <div className="text-base font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-1">
                {calcScrew.size} × {calcScrew.coarsePitchMm.toFixed(2)} mm
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {lang === "ro" ? "Diametru cap:" : "Pan Head:"} Ø {calcScrew.panHeadDiameterMm.toFixed(1)} mm
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70">
              <div className="text-[11px] font-sans text-slate-500">
                {lang === "ro" ? "Găuri Trecere (ISO 273)" : "Clearance Holes (ISO 273)"}
              </div>
              <div className="text-sm font-bold text-cyan-600 dark:text-cyan-400 tabular-nums mt-1">
                Ø {calcScrew.closeClearanceMm.toFixed(1)} / {calcScrew.normalClearanceMm.toFixed(1)} / {calcScrew.looseClearanceMm.toFixed(1)} mm
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {lang === "ro" ? "Strâns / Normal / Larg" : "Close / Normal / Loose"}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70">
              <div className="text-[11px] font-sans text-slate-500">
                {lang === "ro" ? "Burghiu Tarod & Keep-Out" : "Tap Drill & PCB Keep-Out"}
              </div>
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                Ø {calcScrew.tapDrillMm.toFixed(2)} mm · KO {calcScrew.pcbPadKeepoutMm.toFixed(1)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {lang === "ro" ? "Zonă liberă cupru fără trasee" : "Trace-free courtyard diameter"}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70">
              <div className="text-[11px] font-sans text-slate-500">
                {lang === "ro" ? "Cuplu Max FR-4 & Cheie" : "Safe FR-4 Torque & Bit"}
              </div>
              <div className="text-base font-bold text-amber-600 dark:text-amber-400 tabular-nums mt-1">
                {calcScrew.fr4MaxTorqueNm.toFixed(2)} N·m
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {calcScrew.recommendedDriver}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
