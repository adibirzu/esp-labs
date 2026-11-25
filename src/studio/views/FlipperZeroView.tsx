import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Cpu,
  ExternalLink,
  GitBranch,
  Package,
  PlayCircle,
  Radio,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import {
  FLIPPER_BOARDS,
  FLIPPER_GPIO_PINS,
  FLIPPER_GUIDES,
  FLIPPER_RESOURCES,
  FLIPPER_SPECS,
  FLIPPER_SUBSYSTEMS,
  pickText,
  type FlipperBoardCategory,
  type FlipperResourceKind,
} from "../data/flipper";
import type { Translations } from "../i18n";
import type { Lang } from "../types";

interface FlipperZeroViewProps {
  t: Translations;
  lang: Lang;
  initialGuideId?: string | null;
  initialBoardId?: string | null;
  focusNonce?: number;
  onOpenInventory: () => void;
}

type FlipperTab = "overview" | "boards" | "guides" | "resources";

const PIN_COLOR_BY_KIND: Record<string, string> = {
  power: "bg-rose-500 text-white",
  gnd: "bg-slate-700 text-slate-100",
  spi: "bg-violet-600 text-white",
  uart: "bg-cyan-600 text-white",
  i2c: "bg-emerald-600 text-white",
  onewire: "bg-amber-600 text-white",
  gpio: "bg-sky-600 text-white",
};

export function FlipperZeroView({
  t,
  lang,
  initialGuideId,
  initialBoardId,
  focusNonce,
  onOpenInventory,
}: FlipperZeroViewProps) {
  const [tab, setTab] = useState<FlipperTab>("overview");
  const [selectedPinNum, setSelectedPinNum] = useState<number>(13); // Pin 13 TX default
  const [boardCategory, setBoardCategory] = useState<"all" | FlipperBoardCategory>("all");
  const [resourceFilter, setResourceFilter] = useState<"all" | FlipperResourceKind>("all");
  const [activeGuideId, setActiveGuideId] = useState<string>(FLIPPER_GUIDES[0].id);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("esp_labs_flipper_steps");
      return saved ? (JSON.parse(saved) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("esp_labs_flipper_steps", JSON.stringify(checkedSteps));
    } catch {
      // ignore storage errors
    }
  }, [checkedSteps]);

  useEffect(() => {
    if (initialGuideId) {
      setActiveGuideId(initialGuideId);
      setTab("guides");
    } else if (initialBoardId) {
      setBoardCategory("all");
      setTab("boards");
    }
  }, [initialGuideId, initialBoardId, focusNonce]);

  const selectedPin =
    FLIPPER_GPIO_PINS.find((p) => p.pin === selectedPinNum) ?? FLIPPER_GPIO_PINS[12];

  const filteredBoards = useMemo(
    () =>
      boardCategory === "all"
        ? FLIPPER_BOARDS
        : FLIPPER_BOARDS.filter((b) => b.category === boardCategory),
    [boardCategory],
  );

  const filteredResources = useMemo(
    () =>
      resourceFilter === "all"
        ? FLIPPER_RESOURCES
        : FLIPPER_RESOURCES.filter((r) => r.kind === resourceFilter),
    [resourceFilter],
  );

  const activeGuide =
    FLIPPER_GUIDES.find((g) => g.id === activeGuideId) ?? FLIPPER_GUIDES[0];

  const toggleStep = (guideId: string, stepIdx: number) => {
    const key = `${guideId}:${stepIdx}`;
    setCheckedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getGuideDoneCount = (guideId: string, total: number) => {
    let count = 0;
    for (let i = 0; i < total; i++) {
      if (checkedSteps[`${guideId}:${i}`]) count += 1;
    }
    return count;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1.5 max-w-3xl">
          <div className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400">
            STM32WB55RG · Sub-1 GHz · NFC · 125 kHz RFID · IR · BLE 5.4 · 18-Pin GPIO
          </div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t.flipper.title}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {t.flipper.sub}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenInventory}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start lg:self-center"
        >
          <Package className="w-4 h-4" />
          <span>{t.flipper.checkInventoryCta}</span>
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {(
          [
            { id: "overview", label: t.flipper.tabOverview, icon: Cpu },
            { id: "boards", label: t.flipper.tabBoards, icon: Radio },
            { id: "guides", label: t.flipper.tabGuides, icon: Wrench },
            { id: "resources", label: t.flipper.tabResources, icon: BookOpen },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                active
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-amber-500" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Hardware Specs + Interactive 18-Pin GPIO Explorer */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Interactive 18-Pin Top GPIO Header */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold tracking-tight">{t.flipper.gpioTitle}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t.flipper.gpioHint}
              </p>
            </div>

            {/* Interactive 18-Pin Strip */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 overflow-x-auto">
              <div className="min-w-[740px] space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                  <span>← {lang === "ro" ? "Partea stângă (Ecran)" : "Left edge (Display side)"}</span>
                  <span className="text-amber-400">Flipper Zero 18-Pin Header · 3.3V Logic · 51Ω ESD</span>
                  <span>{lang === "ro" ? "Partea dreaptă (Buton Back)" : "Right edge (D-Pad side)"} →</span>
                </div>
                <div className="grid grid-cols-18 gap-1.5">
                  {FLIPPER_GPIO_PINS.map((pin) => {
                    const active = selectedPinNum === pin.pin;
                    return (
                      <button
                        type="button"
                        key={pin.pin}
                        onClick={() => setSelectedPinNum(pin.pin)}
                        aria-label={`Pin ${pin.pin} ${pin.name}`}
                        className={`flex flex-col items-center justify-between py-2 px-1 rounded-lg border transition-all cursor-pointer ${
                          active
                            ? "border-amber-400 ring-2 ring-amber-400/50 -translate-y-0.5"
                            : "border-slate-700 hover:border-slate-500"
                        } ${PIN_COLOR_BY_KIND[pin.kind]}`}
                      >
                        <span className="text-[10px] font-mono opacity-80 tabular-nums">
                          {pin.pin}
                        </span>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-300/90 my-1 border border-slate-900" />
                        <span className="text-[10px] font-mono font-bold tracking-tight">
                          {pin.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Selected Pin Inspector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-xs text-slate-500">Pin #{selectedPin.pin}</div>
                <div className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400">
                  {selectedPin.name} · {selectedPin.alt}
                </div>
                <div className="text-xs font-mono text-slate-600 dark:text-slate-400 mt-1">
                  {selectedPin.voltage}
                </div>
              </div>
              <div className="md:col-span-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex items-center">
                {pickText(selectedPin.notes, lang)}
              </div>
            </div>
          </section>

          {/* Hardware Specs Table + Subsystems */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 space-y-3">
              <h2 className="text-base font-bold">{t.flipper.specsTitle}</h2>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {FLIPPER_SPECS.map((row, idx) => (
                  <div key={idx} className="py-2.5 flex flex-col gap-0.5">
                    <span className="text-xs text-slate-500">{pickText(row.label, lang)}</span>
                    <span className="text-xs font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 space-y-3">
              <h2 className="text-base font-bold">{t.flipper.subsystemsTitle}</h2>
              <div className="grid grid-cols-1 gap-3">
                {FLIPPER_SUBSYSTEMS.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 space-y-2"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-sm font-bold">{pickText(sub.name, lang)}</h3>
                      <span className="text-xs font-mono text-amber-600 dark:text-amber-400">
                        {sub.chip} · {sub.freqOrSpec}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {pickText(sub.summary, lang)}
                    </p>
                    <div className="text-xs text-cyan-700 dark:text-cyan-300 pt-1">
                      <span className="font-semibold">{t.flipper.espParallelLabel}: </span>
                      {pickText(sub.espParallel, lang)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Official & Most-Discussed Reddit GPIO Boards */}
      {tab === "boards" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: "all", label: t.flipper.boardsFilterAll },
                { id: "official", label: t.flipper.boardsFilterOfficial },
                { id: "reddit-top", label: t.flipper.boardsFilterReddit },
                { id: "multi-board", label: t.flipper.boardsFilterMulti },
                { id: "diy-esp32", label: t.flipper.boardsFilterDiy },
              ] as const
            ).map((btn) => (
              <button
                type="button"
                key={btn.id}
                onClick={() => setBoardCategory(btn.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  boardCategory === btn.id
                    ? "bg-amber-600 text-white"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-500"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredBoards.map((board) => {
              const highlighted = initialBoardId === board.id;
              return (
                <article
                  key={board.id}
                  className={`p-5 rounded-xl border bg-white dark:bg-slate-900/70 flex flex-col justify-between space-y-4 ${
                    highlighted
                      ? "border-amber-500 ring-2 ring-amber-500/30"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {board.maker}
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                        {board.priceBand}
                      </span>
                    </div>

                    <h3 className="text-base font-bold leading-snug">{board.name}</h3>

                    <div className="text-xs font-mono text-cyan-700 dark:text-cyan-300">
                      {board.chips.join(" · ")}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {pickText(board.summary, lang)}
                    </p>

                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                        {t.flipper.redditConsensus}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {pickText(board.redditBuzz, lang)}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-semibold">{t.flipper.capabilitiesLabel}</div>
                      <ul className="space-y-1">
                        {board.capabilities[lang].map((cap, idx) => (
                          <li key={idx} className="text-xs text-slate-600 dark:text-slate-400">
                            – {cap}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {t.flipper.tradeoffsLabel}:{" "}
                      </span>
                      {pickText(board.tradeoffs, lang)}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-slate-500 truncate max-w-[65%]">
                      {board.gpioUsed}
                    </span>
                    <a
                      href={board.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-cyan-600 dark:text-cyan-400 hover:underline whitespace-nowrap"
                    >
                      <span>{t.flipper.visitDocs}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Step-by-Step Build & Lab Guides */}
      {tab === "guides" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Guide Sidebar */}
          <div className="lg:col-span-4 space-y-2.5">
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.flipper.guidesHint}</p>
            {FLIPPER_GUIDES.map((guide) => {
              const active = guide.id === activeGuide.id;
              const done = getGuideDoneCount(guide.id, guide.steps.length);
              return (
                <button
                  type="button"
                  key={guide.id}
                  onClick={() => setActiveGuideId(guide.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer space-y-1.5 ${
                    active
                      ? "bg-amber-500/10 border-amber-500 text-slate-900 dark:text-slate-100"
                      : "bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-amber-500/60"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                    <span>
                      {t.difficulties[guide.difficulty]} · {guide.duration}
                    </span>
                    <span className="tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                      {done}/{guide.steps.length}
                    </span>
                  </div>
                  <div className="text-sm font-bold leading-snug">
                    {pickText(guide.title, lang)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Guide Detail */}
          <div className="lg:col-span-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                <span>
                  {t.difficulties[activeGuide.difficulty]} · {activeGuide.duration}
                </span>
                <span className="tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                  {getGuideDoneCount(activeGuide.id, activeGuide.steps.length)}/{activeGuide.steps.length}{" "}
                  {t.flipper.stepsCompleted}
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight">
                {pickText(activeGuide.title, lang)}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {pickText(activeGuide.summary, lang)}
              </p>
            </div>

            {activeGuide.wiring && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.flipper.wiringTableLabel}
                </h3>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                  <table className="w-full text-xs font-mono text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950/70 text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Flipper Zero</th>
                        <th className="px-3 py-2">{lang === "ro" ? "Modul Extern" : "External Module"}</th>
                        <th className="px-3 py-2">{lang === "ro" ? "Semnal" : "Signal"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {activeGuide.wiring.map((w, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 font-semibold text-amber-600 dark:text-amber-400">
                            {w.from}
                          </td>
                          <td className="px-3 py-2 text-cyan-700 dark:text-cyan-300">{w.to}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{w.signal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Checkable Steps */}
            <div className="space-y-3">
              {activeGuide.steps.map((step, idx) => {
                const key = `${activeGuide.id}:${idx}`;
                const done = !!checkedSteps[key];
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-colors space-y-2 ${
                      done
                        ? "bg-emerald-500/10 border-emerald-500/40"
                        : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleStep(activeGuide.id, idx)}
                      className="w-full flex items-start gap-3 text-left cursor-pointer"
                    >
                      <CheckCircle2
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          done ? "text-emerald-500" : "text-slate-400"
                        }`}
                      />
                      <div className="space-y-1 flex-1">
                        <div className={`text-sm font-bold ${done ? "line-through opacity-75" : ""}`}>
                          {pickText(step.title, lang)}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {pickText(step.detail, lang)}
                        </p>
                      </div>
                    </button>
                    {step.codeOrCmd && (
                      <pre className="ml-7 p-2.5 rounded-lg bg-slate-950 text-emerald-300 font-mono text-[11px] overflow-x-auto border border-slate-800">
                        {step.codeOrCmd}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Safety & Compliance Note */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-700 dark:text-amber-300">
                  {t.flipper.safetyNoteLabel}:{" "}
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  {pickText(activeGuide.safetyNote, lang)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Curated Articles, Official Docs, GitHub Repos & Best Videos */}
      {tab === "resources" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: "all", label: t.flipper.resourcesFilterAll },
                { id: "video", label: t.flipper.resourcesFilterVideo },
                { id: "article", label: t.flipper.resourcesFilterArticle },
                { id: "official", label: t.flipper.resourcesFilterOfficial },
                { id: "github", label: t.flipper.resourcesFilterGithub },
              ] as const
            ).map((btn) => (
              <button
                type="button"
                key={btn.id}
                onClick={() => setResourceFilter(btn.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  resourceFilter === btn.id
                    ? "bg-amber-600 text-white"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-500"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredResources.map((res) => {
              const Icon =
                res.kind === "video"
                  ? PlayCircle
                  : res.kind === "github"
                    ? GitBranch
                    : BookOpen;
              return (
                <div
                  key={res.id}
                  className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                        <Icon className="w-3.5 h-3.5" />
                        {res.creator}
                      </span>
                      <span className="font-mono">{res.topics.join(" · ")}</span>
                    </div>
                    <h3 className="text-sm font-bold leading-snug">{res.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {pickText(res.summary, lang)}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
                    >
                      <span>{t.flipper.openResource}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
