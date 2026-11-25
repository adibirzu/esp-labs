import { Fragment, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Cpu,
  Download,
  Filter,
  GitCompareArrows,
  Layers,
  Package,
  Wrench,
  Zap,
} from "lucide-react";
import {
  computeBomSummary,
  exportTeardownCsv,
  getBoardTeardown,
} from "../logic/teardown-engine";
import type { BoardComparisonSummary } from "../logic/library-filter";
import type { EspBoardSpec, Lang } from "../types";

interface AdultEngineeringTableProps {
  lang: Lang;
  comparison: BoardComparisonSummary;
  onSelectBoard: (boardId: string) => void;
  onToggleCompare: (boardId: string) => void;
  onInspectTeardown?: (boardId: string) => void;
  title: string;
  hint: string;
  emptyPrompt: string;
  selectedLabel: string;
}

type DomainTab = "all" | "silicon" | "power" | "pcb" | "screws" | "bom";

interface SpecRowDef {
  id: string;
  domain: Exclude<DomainTab, "all">;
  label: { en: string; ro: string };
  getValue: (b: EspBoardSpec) => string;
  isHighlight?: (b: EspBoardSpec) => boolean;
  drilldownNote: { en: string; ro: string };
  getDetailPerBoard: (b: EspBoardSpec) => string;
}

export function AdultEngineeringTable({
  lang,
  comparison,
  onSelectBoard,
  onToggleCompare,
  onInspectTeardown,
  title,
  hint,
  emptyPrompt,
  selectedLabel,
}: AdultEngineeringTableProps) {
  const [domain, setDomain] = useState<DomainTab>("all");
  const [diffsOnly, setDiffsOnly] = useState(false);
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([
    "screw-iso",
    "pcb-stackup",
  ]);

  const rows: SpecRowDef[] = useMemo(
    () => [
      // SILICON & COMPUTE
      {
        id: "arch-cpu",
        domain: "silicon",
        label: { en: "CPU Core & ISA", ro: "Procesor & Arhitectură" },
        getValue: (b) => `${b.arch} · ${b.cores}C · ${b.maxFreqMhz} MHz`,
        isHighlight: (b) => b.id === comparison.fastestClockId,
        drilldownNote: {
          en: "Includes main HP core topology, vector/SIMD extensions, and silicon package outline.",
          ro: "Include topologia nucleelor HP, extensiile vectoriale SIMD și capsula fizică a siliciului.",
        },
        getDetailPerBoard: (b) => {
          const td = getBoardTeardown(b.id);
          return `${b.cpu} · Crystal: ${td.mechanical.crystalSpec}`;
        },
      },
      {
        id: "mem-flash",
        domain: "silicon",
        label: { en: "SRAM / PSRAM / Flash", ro: "SRAM / PSRAM / Flash" },
        getValue: (b) => `${b.sramKb} KB · ${b.hasPsram ? "PSRAM" : "No PSRAM"}`,
        drilldownNote: {
          en: "Check Octal PSRAM GPIO reservations (GPIO35–37 on S3 N8R8/N16R8) before PCB routing.",
          ro: "Verifică pinii rezervați de Octal PSRAM (GPIO35–37 pe S3 N8R8/N16R8) înainte de rutare PCB.",
        },
        getDetailPerBoard: (b) => `${b.psramSpec} · ${b.flashSpec}`,
      },
      {
        id: "gpio-bus",
        domain: "silicon",
        label: { en: "Exposed GPIO & RF", ro: "GPIO Expus & Radio RF" },
        getValue: (b) => `${b.gpios} GPIO (${b.pinCount} pin)`,
        isHighlight: (b) => b.id === comparison.mostGpiosId,
        drilldownNote: {
          en: "Total usable header I/O count and integrated wireless protocol certifications.",
          ro: "Numărul total de pini utili pe barete și protocoalele radio certificate.",
        },
        getDetailPerBoard: (b) => b.wirelessLabels.join(" · "),
      },

      // POWER & ELECTRICAL
      {
        id: "ldo-rail",
        domain: "power",
        label: { en: "3.3V Regulator & Max Current", ro: "Regulator 3.3V & Curent Max" },
        getValue: (b) => {
          const td = getBoardTeardown(b.id);
          return `${td.mechanical.ldoMaxCurrentMa} mA · ${td.mechanical.ldoModel.split(" ")[0]}`;
        },
        drilldownNote: {
          en: "Linear LDO or synchronous buck converter stepping 5V VBUS to 3.3V ±2%. Ensure ≥500 mA budget for Wi-Fi TX bursts.",
          ro: "Regulator LDO liniar sau convertor buck sincron 5V → 3.3V ±2%. Asigură minim 500 mA pentru vârfurile Wi-Fi TX.",
        },
        getDetailPerBoard: (b) => {
          const td = getBoardTeardown(b.id);
          return `${td.mechanical.ldoModel} · RθJA ${td.mechanical.thermalRjaCw} °C/W`;
        },
      },
      {
        id: "deep-sleep",
        domain: "power",
        label: { en: "Deep-Sleep Current", ro: "Curent Deep-Sleep" },
        getValue: (b) => `~${b.deepSleepUa} µA`,
        isHighlight: (b) => b.id === comparison.lowestSleepId,
        drilldownNote: {
          en: "Measured directly on the 3.3V rail (J5 shunt on C6/H2). On DevKits, USB-UART bridge quiescent current adds ~100–300 µA unless bypassed.",
          ro: "Măsurat direct pe linia 3.3V (jumper J5 pe C6/H2). Pe DevKit, puntea USB-UART consumă suplimentar ~100–300 µA dacă nu este ocolită.",
        },
        getDetailPerBoard: (b) => {
          const td = getBoardTeardown(b.id);
          return `USB Bridge: ${td.mechanical.usbBridgeIc} · ESD: ${td.mechanical.esdProtectionIc}`;
        },
      },

      // PCB & STACKUP
      {
        id: "pcb-dims",
        domain: "pcb",
        label: { en: "PCB Dimensions & Mass", ro: "Dimensiuni PCB & Masă" },
        getValue: (b) => {
          const td = getBoardTeardown(b.id);
          return `${b.lengthMm.toFixed(2)}×${b.widthMm.toFixed(1)} mm · ${td.mechanical.massGrams} g`;
        },
        isHighlight: (b) => b.id === comparison.smallestFootprintId,
        drilldownNote: {
          en: "Official Espressif mechanical outline tolerances and assembled mass including headers & RF shield.",
          ro: "Toleranțe mecanice oficiale Espressif și masă asamblată incluzând baretele de pini și capacul RF.",
        },
        getDetailPerBoard: (b) => {
          const td = getBoardTeardown(b.id);
          return `Tol: ${td.mechanical.dimensionalTolMm} · RF Keep-Out: ${td.mechanical.rfKeepoutMm}`;
        },
      },
      {
        id: "pcb-stackup",
        domain: "pcb",
        label: { en: "PCB Stackup, Copper & Finish", ro: "Stackup PCB, Cupru & Finisaj" },
        getValue: (b) => {
          const td = getBoardTeardown(b.id);
          return `${td.mechanical.pcbLayers}L · ${td.mechanical.pcbThicknessMm.split(" ")[0]} mm · ${td.mechanical.surfaceFinish.split(" ")[0]}`;
        },
        drilldownNote: {
          en: "Substrate FR-4 glass-transition rating (TG), copper thickness, pad plating, and RoHS SAC305 reflow peak profile.",
          ro: "Substrat FR-4 cu temperatură TG, grosime cupru, finisaj pad-uri și profil termic lipire SAC305 RoHS.",
        },
        getDetailPerBoard: (b) => {
          const td = getBoardTeardown(b.id);
          return `${td.mechanical.fr4Grade} · ${td.mechanical.copperWeightOz} · ${td.mechanical.solderAlloy} @ ${td.mechanical.reflowPeakC}°C`;
        },
      },
      {
        id: "header-geometry",
        domain: "pcb",
        label: { en: "Header Row Span & PTH Drill", ro: "Distanță Rânduri & Gaură PTH" },
        getValue: (b) => {
          const td = getBoardTeardown(b.id);
          return `${td.mechanical.headerRowSpanMm} mm span · ${b.pinPitchMm} mm pitch`;
        },
        drilldownNote: {
          en: "22.86 mm (0.9 in) leaves 2 breadboard rows exposed; 25.40 mm (1.0 in on DevKitC V4) leaves only 1 row exposed.",
          ro: "22.86 mm lasă 2 rânduri libere pe breadboard; 25.40 mm (pe DevKitC V4) lasă un singur rând liber.",
        },
        getDetailPerBoard: (b) => {
          const td = getBoardTeardown(b.id);
          return td.mechanical.headerDrillMm;
        },
      },

      // SCREWS, FASTENERS & MOUNTING (DRILL DOWN TO SCREW LEVEL!)
      {
        id: "screw-iso",
        domain: "screws",
        label: { en: "Primary Mounting Screw (ISO)", ro: "Șurub Prindere Principal (ISO)" },
        getValue: (b) => getBoardTeardown(b.id).mechanical.primaryScrewIso,
        drilldownNote: {
          en: "Exact ISO/DIN screw thread, pitch, stainless A2-70 grade, and mounting topology for enclosure or DIN-rail integration.",
          ro: "Standardul exact ISO/DIN al șurubului, pasul filetului, inox A2-70 și metoda de prindere în carcasă sau pe șină DIN.",
        },
        getDetailPerBoard: (b) => {
          const td = getBoardTeardown(b.id);
          return `Pitch ${td.mechanical.primaryScrewPitchMm} mm · ${td.mechanical.mountingMethod[lang]}`;
        },
      },
      {
        id: "screw-drill-torque",
        domain: "screws",
        label: { en: "Clearance Drill & Max Torque", ro: "Gaură Trecere & Cuplu Max" },
        getValue: (b) => {
          const td = getBoardTeardown(b.id);
          return `${td.mechanical.primaryClearanceDrillMm.split("/")[0].trim()} · ${td.mechanical.maxTorqueNm}`;
        },
        drilldownNote: {
          en: "ISO 273 clearance drill diameter and safe maximum tightening torque on 1.6 mm FR-4 PCB without delaminating copper pads.",
          ro: "Diametrul găurii de trecere ISO 273 și cuplul maxim sigur pe PCB FR-4 de 1.6 mm fără delaminarea cuprului.",
        },
        getDetailPerBoard: (b) => {
          const td = getBoardTeardown(b.id);
          return `Hole: ${td.mechanical.mountingHolesSpec} · Tool: ${td.mechanical.driverBit}`;
        },
      },
      {
        id: "standoff-washer",
        domain: "screws",
        label: { en: "Brass Standoff & Nylon Washer", ro: "Distanțier Alamă & Șaibă Nailon" },
        getValue: (b) => getBoardTeardown(b.id).mechanical.recommendedStandoff,
        drilldownNote: {
          en: "Always pair metal screws with PA66 Nylon insulating washers under screw heads to prevent solder-mask shorts.",
          ro: "Asociază mereu șuruburile metalice cu șaibe izolatoare din nailon PA66 pentru a preveni scurtcircuitele pe masca de lipire.",
        },
        getDetailPerBoard: (b) => {
          const td = getBoardTeardown(b.id);
          return `Washer: ${td.mechanical.recommendedWasher}`;
        },
      },

      // BOM & UNIT COST
      {
        id: "bom-parts-cost",
        domain: "bom",
        label: { en: "SMD Count & Est. BOM Cost", ro: "Nr. Piese SMD & Cost BOM Est." },
        getValue: (b) => {
          const td = getBoardTeardown(b.id);
          const sum = computeBomSummary(td);
          return `${td.mechanical.smdPartCount} SMD · ~$${sum.estimatedUnitBomUsd.toFixed(2)}`;
        },
        drilldownNote: {
          en: "Estimated component + fastener BOM cost at 1-piece prototype vs 100-piece reel/tray assembly.",
          ro: "Cost estimat al componentelor și șuruburilor pentru 1 bucată prototip față de lot de 100 bucăți.",
        },
        getDetailPerBoard: (b) => {
          const td = getBoardTeardown(b.id);
          const sum = computeBomSummary(td);
          return `1 pc: $${sum.estimatedUnitBomUsd.toFixed(2)} · 100 pcs: $${sum.estimated100QtyBomUsd.toFixed(2)} · ${sum.fastenerPieceCount} fasteners`;
        },
      },
    ],
    [comparison, lang],
  );

  const visibleRows = useMemo(() => {
    return rows.filter((row) => {
      if (domain !== "all" && row.domain !== domain) return false;
      if (diffsOnly && comparison.boards.length > 1) {
        const vals = new Set(comparison.boards.map((b) => row.getValue(b)));
        if (vals.size <= 1) return false;
      }
      return true;
    });
  }, [rows, domain, diffsOnly, comparison.boards]);

  const toggleRow = (id: string) => {
    setExpandedRowIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const allExpanded = visibleRows.length > 0 && visibleRows.every((r) => expandedRowIds.includes(r.id));

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedRowIds([]);
    } else {
      setExpandedRowIds(visibleRows.map((r) => r.id));
    }
  };

  const handleExportComparisonCsv = () => {
    if (comparison.boards.length === 0) return;
    const chunks = comparison.boards.map((b) => exportTeardownCsv(b.name, getBoardTeardown(b.id)));
    const merged = [chunks[0], ...chunks.slice(1).map((c) => c.split("\n").slice(1).join("\n"))].join("\n");
    const blob = new Blob([merged], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `esp32-engineering-screw-bom-${comparison.boards.length}boards.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const domainTabs: { id: DomainTab; label: { en: string; ro: string }; icon: typeof Cpu }[] = [
    { id: "all", label: { en: "All Specs", ro: "Toate Spec." }, icon: Layers },
    { id: "silicon", label: { en: "Silicon", ro: "Siliciu" }, icon: Cpu },
    { id: "power", label: { en: "Power & ESD", ro: "Alimentare" }, icon: Zap },
    { id: "pcb", label: { en: "PCB Stackup", ro: "PCB Stackup" }, icon: Layers },
    { id: "screws", label: { en: "Screws & Mount", ro: "Șuruburi & Prindere" }, icon: Wrench },
    { id: "bom", label: { en: "BOM & Cost", ro: "BOM & Cost" }, icon: Package },
  ];

  return (
    <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2">
            <GitCompareArrows className="w-4 h-4 text-cyan-500" />
            {title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{hint}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
            {comparison.boards.length} / 4 {selectedLabel}
          </span>
          <button
            type="button"
            onClick={() => setDiffsOnly((d) => !d)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
              diffsOnly
                ? "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300"
                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-cyan-500"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {lang === "ro" ? "Doar Diferențe" : "Differences Only"}
          </button>
          <button
            type="button"
            onClick={toggleExpandAll}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-cyan-500 transition-colors cursor-pointer whitespace-nowrap"
          >
            {allExpanded
              ? lang === "ro"
                ? "Restrânge Detalii"
                : "Collapse Details"
              : lang === "ro"
                ? "Extinde Tot (Nivel Șurub)"
                : "Expand All (Screw Level)"}
          </button>
          <button
            type="button"
            onClick={handleExportComparisonCsv}
            disabled={comparison.boards.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-cyan-600 hover:bg-cyan-600 dark:hover:bg-cyan-500 text-white transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            {lang === "ro" ? "Export BOM CSV" : "Export BOM CSV"}
          </button>
        </div>
      </div>

      {/* Domain Filter Segmented Controls */}
      <div className="flex flex-wrap items-center gap-1.5 pb-1">
        {domainTabs.map((tab) => {
          const Icon = tab.icon;
          const active = domain === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setDomain(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? "bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 border-cyan-600 dark:border-cyan-400"
                  : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-cyan-500"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label[lang]}
            </button>
          );
        })}
      </div>

      {comparison.boards.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
          {emptyPrompt}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-3.5 font-mono text-slate-500 dark:text-slate-400 min-w-[210px]">
                  {lang === "ro" ? "Parametru Ingineresc (Click pt. Detalii)" : "Engineering Spec (Click to Drill Down)"}
                </th>
                {comparison.boards.map((b) => (
                  <th key={b.id} className="py-3 px-3 font-bold text-sm min-w-[195px]">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <button
                          type="button"
                          onClick={() => onSelectBoard(b.id)}
                          className="hover:text-cyan-600 dark:hover:text-cyan-400 cursor-pointer text-left block"
                        >
                          {b.name}
                        </button>
                        {onInspectTeardown && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectBoard(b.id);
                              onInspectTeardown(b.id);
                            }}
                            className="text-[10px] font-mono font-medium text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                          >
                            {lang === "ro" ? "Deschide Teardown Șuruburi ↓" : "Inspect Screw Teardown ↓"}
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleCompare(b.id)}
                        aria-label={`Remove ${b.name}`}
                        className="text-xs font-mono text-slate-400 hover:text-rose-500 cursor-pointer px-1"
                      >
                        ×
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/80">
              {visibleRows.map((row) => {
                const isExpanded = expandedRowIds.includes(row.id);
                return (
                  <Fragment key={row.id}>
                    <tr
                      onClick={() => toggleRow(row.id)}
                      className={`transition-colors cursor-pointer ${
                        isExpanded
                          ? "bg-cyan-500/5 dark:bg-cyan-500/10"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <td className="py-2.5 px-3.5 font-medium text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span>{row.label[lang]}</span>
                        </div>
                      </td>
                      {comparison.boards.map((b) => {
                        const highlight = row.isHighlight?.(b) ?? false;
                        return (
                          <td
                            key={b.id}
                            className={`py-2.5 px-3 font-mono tabular-nums ${
                              highlight
                                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                : "text-slate-700 dark:text-slate-200"
                            }`}
                          >
                            {row.getValue(b)}
                          </td>
                        );
                      })}
                    </tr>

                    {isExpanded && (
                      <tr className="bg-slate-50/90 dark:bg-slate-950/80">
                        <td className="py-2.5 pl-9 pr-3 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {row.drilldownNote[lang]}
                        </td>
                        {comparison.boards.map((b) => (
                          <td
                            key={`${row.id}-${b.id}-detail`}
                            className="py-2.5 px-3 font-mono text-[11px] text-cyan-700 dark:text-cyan-300 leading-relaxed"
                          >
                            {row.getDetailPerBoard(b)}
                          </td>
                        ))}
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
