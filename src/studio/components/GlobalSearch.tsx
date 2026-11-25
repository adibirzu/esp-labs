import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircuitBoard,
  Cpu,
  Database,
  Layers,
  Lightbulb,
  Package,
  Radio,
  Search,
  Sliders,
  X,
} from "lucide-react";
import { OFFICIAL_ESP_BOARDS } from "../data/boards";
import { CHIP_BLOCKS, REGISTERS } from "../data/chip";
import { FLIPPER_BOARDS, FLIPPER_GUIDES, pickText } from "../data/flipper";
import { PROJECT_IDEAS } from "../data/ideas";
import { KIT_PARTS } from "../data/kit";
import { LABS } from "../data/labs";
import { ALL_PINS } from "../data/pinout";
import {
  localizeBoard,
  localizeChipBlock,
  localizeIdea,
  localizeKitPart,
  localizeLab,
  localizePin,
  localizeRegister,
} from "../data/ro-overrides";
import type { Translations } from "../i18n";
import type { Lang } from "../types";

export type SearchResultAction =
  | { kind: "board"; id: string }
  | { kind: "flipper-board"; id: string }
  | { kind: "flipper-guide"; id: string }
  | { kind: "lab"; id: string }
  | { kind: "idea"; id: string }
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
  group: "boards" | "flipper" | "labs" | "ideas" | "registers" | "hardware" | "blocks" | "pins";
}

interface GlobalSearchProps {
  t: Translations;
  lang: Lang;
  onSelect: (action: SearchResultAction) => void;
}

const GROUP_ICONS = {
  boards: CircuitBoard,
  flipper: Radio,
  labs: Cpu,
  ideas: Lightbulb,
  registers: Database,
  hardware: Package,
  blocks: Layers,
  pins: Sliders,
} as const;

export function GlobalSearch({ t, lang, onSelect }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useMemo<SearchResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const matches: SearchResultItem[] = [];

    // 1. Official ESP32 Boards
    for (const rawBoard of OFFICIAL_ESP_BOARDS) {
      const board = localizeBoard(rawBoard, lang);
      const hay = `${rawBoard.name} ${rawBoard.soc} ${rawBoard.moduleName} ${rawBoard.arch} ${rawBoard.cpu} ${rawBoard.lengthMm}x${rawBoard.widthMm} ${rawBoard.wirelessLabels.join(" ")} ${rawBoard.tagline} ${board.tagline}`.toLowerCase();
      if (hay.includes(q)) {
        matches.push({
          key: `board:${board.id}`,
          action: { kind: "board", id: board.id },
          code: `${board.lengthMm}×${board.widthMm}mm`,
          title: board.name,
          subtitle: `${board.arch} ${board.maxFreqMhz} MHz · ${board.wirelessLabels[0]}`,
          group: "boards",
        });
      }
    }

    // 1b. Flipper Zero Boards & Guides
    for (const fb of FLIPPER_BOARDS) {
      const chipsText = fb.chips.join(" ");
      const hay = `flipper zero ${fb.name} ${fb.maker} ${chipsText} ${fb.category} ${fb.summary.en} ${fb.summary.ro} ${fb.redditBuzz.en} ${fb.redditBuzz.ro}`.toLowerCase();
      if (hay.includes(q)) {
        matches.push({
          key: `fboard:${fb.id}`,
          action: { kind: "flipper-board", id: fb.id },
          code: fb.priceBand,
          title: fb.name,
          subtitle: `${fb.maker} · ${fb.chips.slice(0, 2).join(" + ")}`,
          group: "flipper",
        });
      }
    }
    for (const fg of FLIPPER_GUIDES) {
      const stepsText = fg.steps.map((s) => `${s.title.en} ${s.title.ro}`).join(" ");
      const hay = `flipper zero ${fg.title.en} ${fg.title.ro} ${fg.summary.en} ${fg.summary.ro} ${fg.requiredPartIds.join(" ")} ${stepsText}`.toLowerCase();
      if (hay.includes(q)) {
        matches.push({
          key: `fguide:${fg.id}`,
          action: { kind: "flipper-guide", id: fg.id },
          code: t.difficulties[fg.difficulty],
          title: pickText(fg.title, lang),
          subtitle: `${fg.duration} · Flipper Zero`,
          group: "flipper",
        });
      }
    }

    // 2. Labs
    for (const rawLab of LABS) {
      const lab = localizeLab(rawLab, lang);
      const hay = `${rawLab.code} ${rawLab.title} ${rawLab.summary} ${lab.title} ${lab.summary} ${rawLab.track} ${rawLab.wiring
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

    // 3. Project Ideas
    for (const rawIdea of PROJECT_IDEAS) {
      const idea = localizeIdea(rawIdea, lang);
      const hay = `${rawIdea.title} ${idea.title} ${rawIdea.category} ${t.ideaCategories[rawIdea.category]} ${rawIdea.difficulty} ${rawIdea.summary} ${idea.summary} ${rawIdea.recommendedBoardId} ${rawIdea.buses.join(" ")} ${rawIdea.parts.join(" ")}`.toLowerCase();
      if (hay.includes(q)) {
        matches.push({
          key: `idea:${idea.id}`,
          action: { kind: "idea", id: idea.id },
          code: t.difficulties[idea.difficulty],
          title: idea.title,
          subtitle: `${t.ideaCategories[idea.category]} · ${idea.buildTime}`,
          group: "ideas",
        });
      }
    }

    // 4. Registers & Addresses
    for (const rawReg of REGISTERS) {
      const reg = localizeRegister(rawReg, lang);
      const fieldsHay = reg.fields.map((f) => `${f.name} ${f.group}`).join(" ");
      const hay = `${reg.id} ${reg.address} ${rawReg.desc} ${reg.desc} ${fieldsHay}`.toLowerCase();
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

    // 5. Hardware Kit Components
    for (const rawPart of KIT_PARTS) {
      const part = localizeKitPart(rawPart, lang);
      const hay = `${rawPart.name} ${part.name} ${rawPart.category} ${part.category} ${part.iface} ${part.pins} ${part.voltage} ${rawPart.specs.join(" ")} ${part.specs.join(" ")}`.toLowerCase();
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

    // 6. Chip Peripheral Blocks
    for (const rawBlock of CHIP_BLOCKS) {
      const block = localizeChipBlock(rawBlock, lang);
      const hay = `${rawBlock.name} ${block.name} ${rawBlock.category} ${block.freq} ${rawBlock.summary} ${block.summary} ${rawBlock.specs.join(" ")}`.toLowerCase();
      if (hay.includes(q)) {
        matches.push({
          key: `block:${block.id}`,
          action: { kind: "block", id: block.id },
          code: t.chipCategories[block.category as keyof typeof t.chipCategories] ?? block.category,
          title: block.name,
          subtitle: `${block.freq} · ${block.summary}`,
          group: "blocks",
        });
      }
    }

    // 7. Board Pins
    for (const rawPin of ALL_PINS) {
      const pin = localizePin(rawPin, lang);
      const hay = `${pin.label} ${pin.types.join(" ")} ${pin.adc ?? ""} ${pin.touch ?? ""} ${rawPin.strapping ?? ""} ${pin.strapping ?? ""} ${rawPin.notes} ${pin.notes}`.toLowerCase();
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

    return matches.slice(0, 16);
  }, [query, lang, t]);

  const safeActiveIndex = results.length > 0 ? Math.min(activeIndex, results.length - 1) : 0;

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
    boards: t.searchGroups.boards,
    flipper: t.searchGroups.flipper,
    labs: t.searchGroups.labs,
    ideas: t.searchGroups.ideas,
    registers: t.searchGroups.registers,
    hardware: t.searchGroups.hardware,
    blocks: t.searchGroups.blocks,
    pins: t.searchGroups.pins,
  };

  const grouped = useMemo(() => {
    const order: SearchResultItem["group"][] = [
      "boards",
      "flipper",
      "labs",
      "ideas",
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
    <div ref={containerRef} className="relative w-32 sm:w-36 xl:w-44 shrink-0">
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
          className="w-full pl-8 pr-9 py-1.5 rounded-lg text-xs bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:bg-white dark:focus:bg-slate-950 transition-colors"
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
