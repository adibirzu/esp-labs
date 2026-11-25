import { useEffect, useRef, useState } from "react";
import { Battery, Database, HardDrive, Layers, RotateCcw } from "lucide-react";
import {
  CHIP_BLOCKS,
  MEMORY_REGIONS,
  POWER_MODES,
  POWER_PRESETS,
  REGISTERS,
} from "../data/chip";
import {
  localizeChipBlock,
  localizeMemoryRegion,
  localizePowerMode,
  localizePowerPresetLabel,
  localizeRegister,
} from "../data/ro-overrides";
import type { Translations } from "../i18n";
import type { Lang, RegisterField } from "../types";

interface ChipAtlasViewProps {
  t: Translations;
  lang: Lang;
  onOpenLabCode: (code: string) => void;
  initialRegId?: string | null;
  initialBlockId?: string | null;
  focusNonce?: number;
  onBlockChange?: (blockId: string) => void;
  onRegChange?: (regId: string) => void;
}

function formatBinaryNibbles(val: number): string {
  const bin = (val >>> 0).toString(2).padStart(32, "0");
  return bin.replace(/(.{4})(?=.)/g, "$1 ");
}

export function ChipAtlasView({
  t,
  lang,
  onOpenLabCode,
  initialRegId,
  initialBlockId,
  focusNonce,
  onBlockChange,
  onRegChange,
}: ChipAtlasViewProps) {
  const [blockFilter, setBlockFilter] = useState("All");
  const [selectedBlockId, setSelectedBlockId] = useState(
    () => CHIP_BLOCKS.find((b) => b.id === initialBlockId)?.id ?? CHIP_BLOCKS[0].id,
  );
  const [selectedRegId, setSelectedRegId] = useState(initialRegId || REGISTERS[0].id);
  const [regValues, setRegValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(REGISTERS.map((r) => [r.id, r.defaultVal])),
  );
  const [hoveredBit, setHoveredBit] = useState<RegisterField | null>(null);
  const [activeMemRegion, setActiveMemRegion] = useState<string | null>(null);
  const registerSectionRef = useRef<HTMLElement | null>(null);
  const atlasSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (initialRegId && REGISTERS.some((r) => r.id === initialRegId)) {
      setSelectedRegId(initialRegId);
      registerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [initialRegId, focusNonce]);

  useEffect(() => {
    if (initialBlockId) {
      const found = CHIP_BLOCKS.find((b) => b.id === initialBlockId);
      if (found) {
        setBlockFilter("All");
        setSelectedBlockId(found.id);
        atlasSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [initialBlockId, focusNonce]);

  // Power Calculator State
  const [batteryMah, setBatteryMah] = useState(1200);
  const [sleepModeId, setSleepModeId] = useState("deep");
  const [dutyCycle, setDutyCycle] = useState(5);

  const categories = [
    "All",
    "Compute",
    "Wireless",
    "Bus",
    "Audio",
    "Timing",
    "Analog",
    "Security",
    "Low Power",
    "Data",
  ] as const;

  const filteredBlocks = (
    blockFilter === "All"
      ? CHIP_BLOCKS
      : CHIP_BLOCKS.filter((b) => b.category === blockFilter)
  ).map((b) => localizeChipBlock(b, lang));

  const selectedBlock = localizeChipBlock(
    CHIP_BLOCKS.find((b) => b.id === selectedBlockId) ?? CHIP_BLOCKS[0],
    lang,
  );

  const activeReg = localizeRegister(
    REGISTERS.find((r) => r.id === selectedRegId) ?? REGISTERS[0],
    lang,
  );
  const regVal = (regValues[activeReg.id] ?? activeReg.defaultVal) >>> 0;

  const toggleBit = (bit: number) => {
    setRegValues((prev) => ({
      ...prev,
      [activeReg.id]: (((prev[activeReg.id] ?? 0) >>> 0) ^ (1 << bit)) >>> 0,
    }));
  };

  const sleepMode = POWER_MODES.find((m) => m.id === sleepModeId) ?? POWER_MODES[3];
  const avgCurrentMa =
    (dutyCycle / 100) * 95 + ((100 - dutyCycle) / 100) * sleepMode.currentMa;
  const runtimeHours = batteryMah / Math.max(avgCurrentMa, 0.001);
  const runtimeLabel =
    runtimeHours >= 720
      ? `${(runtimeHours / 720).toFixed(1)} ${t.unitMonths}`
      : runtimeHours >= 48
        ? `${(runtimeHours / 24).toFixed(1)} ${t.unitDays}`
        : `${runtimeHours.toFixed(1)} ${t.unitHours}`;

  return (
    <div className="space-y-8">
      {/* Section 1: Peripheral Block Atlas */}
      <section ref={atlasSectionRef} className="space-y-4 scroll-mt-20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-500" />
            {t.chipBlocks}
          </h1>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setBlockFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                  blockFilter === cat
                    ? "bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 border-cyan-600 dark:border-cyan-400 font-semibold"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400"
                }`}
              >
                {cat === "All" ? t.filterAll : t.chipCategories[cat]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredBlocks.map((b) => (
              <button
                type="button"
                key={b.id}
                onClick={() => {
                  setSelectedBlockId(b.id);
                  onBlockChange?.(b.id);
                }}
                className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                  selectedBlock.id === b.id
                    ? "border-cyan-500 bg-cyan-500/10"
                    : "bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-cyan-500/60"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                  <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
                    {t.chipCategories[b.category as keyof typeof t.chipCategories] ?? b.category}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">{b.freq}</span>
                </div>
                <div className="font-bold text-sm mb-1">{b.name}</div>
                <p className="text-xs line-clamp-2 text-slate-600 dark:text-slate-400">{b.summary}</p>
              </button>
            ))}
          </div>

          {/* Selected Block Inspector */}
          <div className="lg:col-span-5 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 space-y-4">
            <div>
              <div className="text-xs font-mono text-cyan-600 dark:text-cyan-400">
                {t.chipCategories[selectedBlock.category as keyof typeof t.chipCategories] ??
                  selectedBlock.category}{" "}
                · {selectedBlock.freq}
              </div>
              <h2 className="text-xl font-bold mt-1">{selectedBlock.name}</h2>
              <p className="text-sm mt-1.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedBlock.summary}
              </p>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                {t.keySpecs}
              </div>
              <ul className="space-y-1.5">
                {selectedBlock.specs.map((s, i) => (
                  <li key={i} className="text-xs font-mono text-slate-700 dark:text-slate-300">
                    – {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300">
              <span className="font-semibold">{t.hardwareGotcha}: </span>
              {selectedBlock.gotcha}
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">{t.usedInLabs}:</span>
              {selectedBlock.labs.map((code) => (
                <button
                  type="button"
                  key={code}
                  onClick={() => onOpenLabCode(code)}
                  className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-700 dark:text-cyan-300 font-mono text-xs font-bold transition-colors cursor-pointer"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: 32-Bit Interactive Register Bit-Field Explorer */}
      <section
        ref={registerSectionRef}
        className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 space-y-4 scroll-mt-20"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-500" />
              {t.registerExplorer}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activeReg.desc}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {REGISTERS.map((r) => (
              <button
                type="button"
                key={r.id}
                onClick={() => {
                  setSelectedRegId(r.id);
                  onRegChange?.(r.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-colors cursor-pointer ${
                  activeReg.id === r.id
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400"
                }`}
              >
                {r.id}
              </button>
            ))}
          </div>
        </div>

        {/* Live Readouts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3 rounded-lg bg-[#060a12] border border-slate-800">
            <div className="text-slate-400">{t.regAddress}</div>
            <div className="text-amber-300 text-sm font-bold tabular-nums">{activeReg.address}</div>
          </div>
          <div className="p-3 rounded-lg bg-[#060a12] border border-slate-800">
            <div className="text-slate-400">{t.regHex}</div>
            <div className="text-cyan-300 text-sm font-bold tabular-nums">
              0x{regVal.toString(16).toUpperCase().padStart(8, "0")}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#060a12] border border-slate-800">
            <div className="text-slate-400">{t.regDecimal}</div>
            <div className="text-emerald-300 text-sm font-bold tabular-nums">{regVal}</div>
          </div>
          <div className="p-3 rounded-lg bg-[#060a12] border border-slate-800">
            <div className="text-slate-400">{t.regBinary}</div>
            <div className="text-slate-200 text-[11px] font-medium tabular-nums truncate" title={formatBinaryNibbles(regVal)}>
              {formatBinaryNibbles(regVal)}
            </div>
          </div>
        </div>

        {/* 32 Clickable Bits (31 down to 0) */}
        <div className="grid grid-cols-8 md:grid-cols-16 gap-1.5">
          {Array.from({ length: 32 }, (_, i) => 31 - i).map((bit) => {
            const isSet = ((regVal >>> bit) & 1) === 1;
            const field = activeReg.fields[bit];
            const isReserved = field.group === "RESERVED";
            return (
              <button
                type="button"
                key={bit}
                disabled={isReserved}
                onClick={() => !isReserved && toggleBit(bit)}
                onMouseEnter={() => setHoveredBit(field)}
                onMouseLeave={() => setHoveredBit(null)}
                className={`p-1.5 rounded-lg border text-center font-mono transition-colors ${
                  isReserved
                    ? "opacity-35 border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 cursor-not-allowed"
                    : isSet
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-800 dark:text-emerald-200 cursor-pointer"
                      : "bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-cyan-500 cursor-pointer"
                }`}
              >
                <div className="text-[9px] text-slate-500 tabular-nums">{bit}</div>
                <div className="text-sm font-bold tabular-nums">{isSet ? "1" : "0"}</div>
                <div className="text-[8px] truncate text-cyan-600 dark:text-cyan-400">
                  {field.name}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 pt-1">
          <span>
            {hoveredBit
              ? `Bit ${hoveredBit.bit} (${hoveredBit.name}): ${hoveredBit.desc}`
              : t.regHint}
          </span>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() =>
                setRegValues((p) => ({ ...p, [activeReg.id]: activeReg.defaultVal }))
              }
              className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              {t.resetDefault}
            </button>
            <button
              type="button"
              onClick={() => setRegValues((p) => ({ ...p, [activeReg.id]: 0 }))}
              className="text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
            >
              {t.clearAllBits}
            </button>
          </div>
        </div>
      </section>

      {/* Section 3: Memory Map & LiPo Power Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Visual Memory Architecture Map */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 space-y-4">
          <h3 className="text-base font-bold flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-violet-500" />
            {t.memoryMap}
          </h3>
          <div className="flex h-7 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-800">
            {MEMORY_REGIONS.map((rawM) => {
              const m = localizeMemoryRegion(rawM, lang);
              return (
                <button
                  type="button"
                  key={rawM.name}
                  onMouseEnter={() => setActiveMemRegion(rawM.name)}
                  onMouseLeave={() => setActiveMemRegion(null)}
                  onClick={() =>
                    setActiveMemRegion((cur) => (cur === rawM.name ? null : rawM.name))
                  }
                  className={`${m.color} transition-opacity cursor-pointer ${
                    activeMemRegion && activeMemRegion !== rawM.name ? "opacity-45" : "opacity-100"
                  }`}
                  style={{ width: m.width }}
                  title={`${m.name} (${m.size})`}
                  aria-label={`${m.name} ${m.size}`}
                />
              );
            })}
          </div>

          <div className="space-y-2">
            {MEMORY_REGIONS.map((rawM) => {
              const m = localizeMemoryRegion(rawM, lang);
              const highlighted = activeMemRegion === rawM.name;
              return (
                <div
                  key={rawM.name}
                  onMouseEnter={() => setActiveMemRegion(rawM.name)}
                  onMouseLeave={() => setActiveMemRegion(null)}
                  className={`p-3 rounded-lg border text-xs transition-colors ${
                    highlighted
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono mb-1">
                    <span className="font-bold flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-sm ${m.color}`} />
                      {m.name} · {m.size}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                      {m.range}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">{m.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive LiPo Power Mode & Battery Life Calculator */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Battery className="w-5 h-5 text-emerald-500" />
                {t.powerCalc}
              </h3>
            </div>

            {/* Quick IoT Workload Presets */}
            <div className="flex flex-wrap gap-1.5">
              {POWER_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => {
                    setBatteryMah(preset.batteryMah);
                    setSleepModeId(preset.sleepModeId);
                    setDutyCycle(preset.dutyCycle);
                  }}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 hover:border-emerald-500 transition-colors cursor-pointer"
                >
                  {localizePowerPresetLabel(preset.label, lang)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {POWER_MODES.map((rawPm) => {
                const pm = localizePowerMode(rawPm, lang);
                return (
                  <button
                    type="button"
                    key={pm.id}
                    onClick={() => setSleepModeId(pm.id)}
                    className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                      sleepModeId === pm.id
                        ? "bg-emerald-500/15 border-emerald-500"
                        : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-400"
                    }`}
                  >
                    <div className="text-xs font-bold">{pm.name}</div>
                    <div className="font-mono text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                      {pm.currentMa >= 1
                        ? `~${pm.currentMa} mA`
                        : `~${Math.round(pm.currentMa * 1000)} µA`}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {pm.desc}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-400">{t.lipoCapacity}</span>
                  <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold tabular-nums">
                    {batteryMah} mAh
                  </span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="5000"
                  step="50"
                  value={batteryMah}
                  onChange={(e) => setBatteryMah(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-400">
                    {t.activeDutyCycle}
                  </span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-bold tabular-nums">
                    {dutyCycle}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="100"
                  step="0.5"
                  value={dutyCycle}
                  onChange={(e) => setDutyCycle(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#060a12] border border-slate-800 grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-[11px] font-mono text-slate-400">{t.avgCurrent}</div>
              <div className="text-xl font-mono font-bold text-amber-300 mt-1 tabular-nums">
                {avgCurrentMa >= 1
                  ? `${avgCurrentMa.toFixed(2)} mA`
                  : `${(avgCurrentMa * 1000).toFixed(0)} µA`}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-mono text-slate-400">{t.estimatedRuntime}</div>
              <div className="text-xl font-mono font-bold text-emerald-400 mt-1 tabular-nums">
                {runtimeLabel}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
