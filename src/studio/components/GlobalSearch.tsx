import { useEffect, useMemo, useRef, useState } from "react";
import { Cpu, Database, Layers, Package, Search, Sliders, X } from "lucide-react";
import { CHIP_BLOCKS, REGISTERS } from "../data/chip";
import { KIT_PARTS } from "../data/kit";
import { LABS } from "../data/labs";
import { ALL_PINS } from "../data/pinout";
import type { Translations } from "../i18n";

export type SearchResultAction =
  | { kind: "lab"; id: string }
  | { kind: "register"; id: string }
  | { kind: "kit"; id: string }
  | { kind: "block"; id: string }
  | { kind: "pin"; id: string };

interface SearchResultItem {
  key: string;
  action: SearchResultAction;
  code: string;
  title: string;
  subtitle: string;
  group: "labs" | "registers" | "hardware" | "blocks" | "pins";
}

interface GlobalSearchProps {
  t: Translations;
  onSelect: (action: SearchResultAction) => void;
}

const GROUP_ICONS = {
  labs: Cpu,
  registers: Database,
  hardware: Package,
  blocks: Layers,
  pins: Sliders,
} as const;

export function GlobalSearch({ t, onSelect }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useMemo<SearchResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const matches: SearchResultItem[] = [];

    // 1. Labs
    for (const lab of LABS) {
      const hay = `${lab.code} ${lab.title} ${lab.summary} ${lab.track} ${lab.wiring
        .map((w) => `${w.from} ${w.to} ${w.signal}`)
        .join(" ")}`.toLowerCase();
      if (hay.includes(q)) {
        matches.push({
          key: `lab:${lab.id}`,
          action: { kind: "lab", id: lab.id },
          code: lab.code,
          title: lab.title,
          subtitle: `${lab.track.toUpperCase()} · ${lab.duration}`,
          group: "labs",
        });
      }
    }

    // 2. Registers & Addresses
    for (const reg of REGISTERS) {
      const fieldsHay = reg.fields.map((f) => `${f.name} ${f.group}`).join(" ");
      const hay = `${reg.id} ${reg.address} ${reg.desc} ${fieldsHay}`.toLowerCase();
      if (hay.includes(q)) {
        matches.push({
          key: `reg:${reg.id}`,
          action: { kind: "register", id: reg.id },
          code: reg.address,
          title: reg.id,
          subtitle: reg.desc,
          group: "registers",
        });
      }
    }

    // 3. Hardware Kit Components
    for (const part of KIT_PARTS) {
      const hay = `${part.name} ${part.category} ${part.iface} ${part.pins} ${part.voltage} ${part.specs.join(" ")}`.toLowerCase();
      if (hay.includes(q)) {
        matches.push({
          key: `kit:${part.id}`,
          action: { kind: "kit", id: part.id },
          code: part.category,
          title: part.name,
          subtitle: `${part.iface} · ${part.voltage}`,
          group: "hardware",
        });
      }
    }

    // 4. Chip Peripheral Blocks
    for (const block of CHIP_BLOCKS) {
      const hay = `${block.name} ${block.category} ${block.freq} ${block.summary} ${block.specs.join(" ")}`.toLowerCase();
      if (hay.includes(q)) {
        matches.push({
          key: `block:${block.id}`,
          action: { kind: "block", id: block.id },
          code: block.category,
          title: block.name,
          subtitle: `${block.freq} · ${block.summary}`,
          group: "blocks",
        });
      }
    }

    // 5. Board Pins (by GPIO, ADC, Touch, Strapping, PSRAM)
    for (const pin of ALL_PINS) {
      const hay = `${pin.label} ${pin.types.join(" ")} ${pin.adc ?? ""} ${pin.touch ?? ""} ${pin.strapping ?? ""} ${pin.notes}`.toLowerCase();
      if (hay.includes(q)) {
        matches.push({
          key: `pin:${pin.id}`,
          action: { kind: "pin", id: pin.id },
          code: pin.label,
          title: `${pin.label}${pin.adc ? ` (${pin.adc})` : ""}`,
          subtitle: pin.notes,
          group: "pins",
        });
      }
    }

    return matches.slice(0, 14);
  }, [query]);

  // Clamp activeIndex whenever results change
  const safeActiveIndex = results.length > 0 ? Math.min(activeIndex, results.length - 1) : 0;

  // Global keyboard shortcut: Cmd/Ctrl+K or '/' focuses search
  useEffect(() => {
    const onGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
        return;
      }
      if (
        e.key === "/" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onGlobalKey);
    return () => window.removeEventListener("keydown", onGlobalKey);
  }, []);

  // Click-outside close
  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const handleChoose = (item: SearchResultItem) => {
    onSelect(item.action);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const groupLabels: Record<SearchResultItem["group"], string> = {
    labs: t.searchGroups.labs,
    registers: t.searchGroups.registers,
    hardware: t.searchGroups.hardware,
    blocks: t.searchGroups.blocks,
    pins: t.searchGroups.pins,
  };

  // Group results preserving overall flat index for keyboard nav
  const grouped = useMemo(() => {
    const order: SearchResultItem["group"][] = [
      "labs",
      "registers",
      "hardware",
      "blocks",
      "pins",
    ];
    return order
      .map((g) => ({
        group: g,
        items: results
          .map((item, flatIdx) => ({ item, flatIdx }))
          .filter((entry) => entry.item.group === g),
      }))
      .filter((section) => section.items.length > 0);
  }, [results]);

  return (
    <div ref={containerRef} className="relative w-44 sm:w-56 lg:w-64 shrink-0">
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              inputRef.current?.blur();
            } else if (e.key === "ArrowDown" && results.length > 0) {
              e.preventDefault();
              setActiveIndex((idx) => (idx + 1) % results.length);
            } else if (e.key === "ArrowUp" && results.length > 0) {
              e.preventDefault();
              setActiveIndex((idx) => (idx - 1 + results.length) % results.length);
            } else if (e.key === "Enter" && results[safeActiveIndex]) {
              e.preventDefault();
              handleChoose(results[safeActiveIndex]);
            }
          }}
          placeholder={t.headerSearchPlaceholder}
          aria-label={t.headerSearchPlaceholder}
          className="w-full pl-8 pr-11 py-1.5 rounded-lg text-xs bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:bg-white dark:focus:bg-slate-950 transition-colors"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label={t.clear}
            className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="pointer-events-none hidden sm:inline-block absolute right-2 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 border border-slate-300 dark:border-slate-700">
            /
          </kbd>
        )}
      </div>

      {/* Results Dropdown */}
      {open && query.trim().length > 0 && (
        <div
          role="listbox"
          className="workbench-scroll absolute right-0 mt-2 w-[min(92vw,26rem)] max-h-96 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] shadow-xl z-50"
        >
          {results.length === 0 ? (
            <div className="p-4 text-xs text-slate-500 dark:text-slate-400 text-center">
              {t.searchNoResults}
            </div>
          ) : (
            <div className="py-1.5">
              {grouped.map((section) => {
                const Icon = GROUP_ICONS[section.group];
                return (
                  <div key={section.group} className="mb-1 last:mb-0">
                    <div className="px-3 py-1 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Icon className="w-3 h-3 text-cyan-500" />
                      <span>{groupLabels[section.group]}</span>
                    </div>
                    {section.items.map(({ item, flatIdx }) => {
                      const isActive = flatIdx === safeActiveIndex;
                      return (
                        <button
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          key={item.key}
                          onMouseEnter={() => setActiveIndex(flatIdx)}
                          onClick={() => handleChoose(item)}
                          className={`w-full px-3 py-2 text-left flex items-start justify-between gap-3 transition-colors cursor-pointer ${
                            isActive
                              ? "bg-cyan-500/15 text-slate-900 dark:text-white"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate">{item.title}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {item.subtitle}
                            </div>
                          </div>
                          <span className="font-mono text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 shrink-0 tabular-nums">
                            {item.code}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
