import { useMemo, useState } from "react";
import {
  Bookmark,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Code2,
  Cpu,
  Lightbulb,
  Search,
  Wrench,
} from "lucide-react";
import { OFFICIAL_ESP_BOARDS } from "../data/boards";
import { PROJECT_IDEAS } from "../data/ideas";
import { localizeIdea } from "../data/ro-overrides";
import type { Translations } from "../i18n";
import { filterIdeas } from "../logic/library-filter";
import type { Lang, ProjectIdea } from "../types";

interface IdeasViewProps {
  t: Translations;
  lang: Lang;
  boardFilter: "all" | string;
  setBoardFilter: (boardId: "all" | string) => void;
  savedIds: string[];
  toggleSaved: (ideaId: string) => void;
  highlightedIdeaId: string | null;
  onOpenBoard: (boardId: string) => void;
  onOpenLabCode: (code: string) => void;
  onOpenCodeTour: (tourId: string) => void;
}

const CATEGORIES: ("all" | ProjectIdea["category"])[] = [
  "all",
  "Smart Home",
  "Audio & Synth",
  "Security & RFID",
  "Low Power & Solar",
  "Wireless & Mesh",
  "HMI & Vision",
];

const DIFFICULTIES: ("all" | ProjectIdea["difficulty"])[] = [
  "all",
  "Beginner",
  "Intermediate",
  "Advanced",
];

export function IdeasView({
  t,
  lang,
  boardFilter,
  setBoardFilter,
  savedIds,
  toggleSaved,
  highlightedIdeaId,
  onOpenBoard,
  onOpenLabCode,
  onOpenCodeTour,
}: IdeasViewProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | ProjectIdea["category"]>("all");
  const [difficulty, setDifficulty] = useState<"all" | ProjectIdea["difficulty"]>("all");
  const [savedOnly, setSavedOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(
    highlightedIdeaId ?? PROJECT_IDEAS[0].id,
  );

  const localizedIdeas = useMemo(
    () => PROJECT_IDEAS.map((idea) => localizeIdea(idea, lang)),
    [lang],
  );

  const filtered = useMemo(
    () =>
      filterIdeas(localizedIdeas, {
        query,
        difficulty,
        category,
        boardId: boardFilter,
        savedOnly,
        savedIds,
      }),
    [localizedIdeas, query, difficulty, category, boardFilter, savedOnly, savedIds],
  );

  const boardById = useMemo(() => {
    const map = new Map(OFFICIAL_ESP_BOARDS.map((b) => [b.id, b]));
    return map;
  }, []);

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              {t.ideasTitle}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 max-w-3xl">
              {t.ideasSub}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSavedOnly((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                savedOnly
                  ? "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300"
                  : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-500"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              {t.savedIdeas} ({savedIds.length})
            </button>
          </div>
        </div>

        {/* Filter Row 1: Category Pills & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                  category === cat
                    ? "bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 border-cyan-600 dark:border-cyan-400"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                }`}
              >
                {cat === "all" ? t.filterAll : t.ideaCategories[cat]}
              </button>
            ))}
          </div>

          <div className="relative lg:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchIdeasPlaceholder}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Filter Row 2: Difficulty + Recommended Board Dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/70 dark:border-slate-800/80">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">
              {t.difficultyLabel}:
            </span>
            {DIFFICULTIES.map((diff) => (
              <button
                type="button"
                key={diff}
                onClick={() => setDifficulty(diff)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                  difficulty === diff
                    ? "bg-violet-500/15 border-violet-500 text-violet-700 dark:text-violet-300 font-semibold"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400"
                }`}
              >
                {diff === "all" ? t.filterAll : t.difficulties[diff]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="idea-board-filter"
              className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap"
            >
              {t.targetBoardLabel}:
            </label>
            <select
              id="idea-board-filter"
              value={boardFilter}
              onChange={(e) => setBoardFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">{t.allBoardsOption}</option>
              {OFFICIAL_ESP_BOARDS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.lengthMm}×{b.widthMm} mm)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ideas Grid */}
      {filtered.length === 0 ? (
        <div className="p-10 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-sm text-slate-500 dark:text-slate-400">
          {t.noIdeasFound}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((idea) => {
            const recBoard = boardById.get(idea.recommendedBoardId);
            const isSaved = savedIds.includes(idea.id);
            const isExpanded = expandedId === idea.id || highlightedIdeaId === idea.id;

            return (
              <article
                key={idea.id}
                className={`p-5 rounded-xl border transition-colors flex flex-col justify-between gap-4 ${
                  highlightedIdeaId === idea.id
                    ? "bg-cyan-500/5 border-cyan-500"
                    : "bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="space-y-3">
                  {/* Top Metadata + Save Button */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                        {t.ideaCategories[idea.category]}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{t.difficulties[idea.difficulty]}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {idea.buildTime}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSaved(idea.id)}
                      aria-label={isSaved ? t.removeBookmark : t.addBookmark}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                        isSaved
                          ? "bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-300"
                          : "border-slate-200 dark:border-slate-800 text-slate-400 hover:text-amber-500"
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
                    </button>
                  </div>

                  <div>
                    <h2 className="text-base font-bold tracking-tight">{idea.title}</h2>
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 mt-1.5">
                      {idea.summary}
                    </p>
                  </div>

                  {/* Recommended Board Callout */}
                  {recBoard && (
                    <button
                      type="button"
                      onClick={() => onOpenBoard(recBoard.id)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 hover:border-cyan-500 transition-colors flex items-center justify-between gap-2 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Cpu className="w-4 h-4 text-cyan-500 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate">
                            {recBoard.name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                            {recBoard.lengthMm.toFixed(2)} × {recBoard.widthMm.toFixed(2)} mm ·{" "}
                            {recBoard.arch} {recBoard.maxFreqMhz} MHz
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 flex items-center gap-0.5 shrink-0">
                        {t.viewBoardSpecs}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  )}

                  {/* Buses & Parts Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        {t.hardwareBusesLabel}
                      </div>
                      <div className="font-mono text-[11px] text-slate-800 dark:text-slate-200 leading-relaxed">
                        {idea.buses.join(" · ")}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                        <Wrench className="w-3 h-3" />
                        {t.keyPartsLabel}
                      </div>
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                        {idea.parts.slice(0, 3).join(", ")}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Build Blueprint */}
                  <div className="border-t border-slate-200/70 dark:border-slate-800/80 pt-2.5">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : idea.id)}
                      className="flex items-center justify-between w-full text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 cursor-pointer"
                    >
                      <span>{t.buildBlueprint} ({idea.steps.length} {t.stepsLabel})</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    {isExpanded && (
                      <ol className="mt-2.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400 list-decimal list-inside">
                        {idea.steps.map((step, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {step}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </div>

                {/* Footer Jump Links: Related Labs & Code Tour */}
                <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t.relatedLabsLabel}:
                    </span>
                    {idea.relatedLabCodes.map((code) => (
                      <button
                        type="button"
                        key={code}
                        onClick={() => onOpenLabCode(code)}
                        className="px-2 py-0.5 rounded font-mono text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-cyan-500/15 hover:text-cyan-700 dark:hover:text-cyan-300 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                  {idea.tourId && (
                    <button
                      type="button"
                      onClick={() => onOpenCodeTour(idea.tourId!)}
                      className="flex items-center gap-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      {t.openCodeTour}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
