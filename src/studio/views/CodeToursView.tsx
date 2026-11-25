import { useEffect, useState } from "react";
import { BookOpen, Check, ChevronLeft, ChevronRight, Compass, Copy } from "lucide-react";
import { CODE_TOURS, GLOSSARY } from "../data/code";
import type { Translations } from "../i18n";

interface CodeToursViewProps {
  t: Translations;
  initialTourId?: string | null;
  onTourChange?: (tourId: string) => void;
}

const C_KEYWORDS = new Set([
  "#include",
  "#define",
  "void",
  "int",
  "static",
  "while",
  "for",
  "return",
  "int16_t",
  "size_t",
  "const",
]);

function renderCodeLine(line: string, onTokenClick: (key: string) => void) {
  const commentIdx = line.indexOf("//");
  const codePart = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
  const commentPart = commentIdx >= 0 ? line.slice(commentIdx) : "";

  const tokens = codePart.split(
    /(\b[A-Za-z_][A-Za-z0-9_]*\b|"[^"]*"|\b0x[0-9A-Fa-f]+\b|\b\d+\b)/g,
  );

  return (
    <>
      {tokens.map((tok, i) => {
        if (!tok) return null;
        if (GLOSSARY[tok]) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onTokenClick(tok)}
              className="underline decoration-dotted decoration-cyan-400 underline-offset-4 text-cyan-300 hover:bg-cyan-500/20 rounded px-0.5 transition-colors font-semibold cursor-pointer"
              title="Click for ESP-IDF Glossary"
            >
              {tok}
            </button>
          );
        }
        if (tok.startsWith('"')) {
          return (
            <span key={i} className="text-emerald-400">
              {tok}
            </span>
          );
        }
        if (tok.startsWith("#") || C_KEYWORDS.has(tok)) {
          return (
            <span key={i} className="text-violet-400 font-medium">
              {tok}
            </span>
          );
        }
        if (/^(0x[0-9A-Fa-f]+|\d+)$/.test(tok)) {
          return (
            <span key={i} className="text-amber-300">
              {tok}
            </span>
          );
        }
        if (/^[A-Z][A-Z0-9_]{2,}$/.test(tok)) {
          return (
            <span key={i} className="text-sky-300">
              {tok}
            </span>
          );
        }
        return <span key={i}>{tok}</span>;
      })}
      {commentPart && <span className="text-slate-500 italic">{commentPart}</span>}
    </>
  );
}

export function CodeToursView({ t, initialTourId, onTourChange }: CodeToursViewProps) {
  const [tourId, setTourId] = useState(initialTourId || CODE_TOURS[0].id);
  const [stepIdx, setStepIdx] = useState(0);
  const [glossaryKey, setGlossaryKey] = useState("gpio_config_t");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialTourId && CODE_TOURS.some((ct) => ct.id === initialTourId)) {
      setTourId(initialTourId);
      setStepIdx(0);
    }
  }, [initialTourId]);

  const tour = CODE_TOURS.find((x) => x.id === tourId) ?? CODE_TOURS[0];
  const step = tour.steps[stepIdx] ?? tour.steps[0];
  const lines = tour.code.split("\n");
  const glossaryItem = glossaryKey ? GLOSSARY[glossaryKey] : null;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") setStepIdx((s) => Math.max(0, s - 1));
      if (e.key === "ArrowRight") setStepIdx((s) => Math.min(tour.steps.length - 1, s + 1));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tour.steps.length]);

  const selectTour = (id: string) => {
    setTourId(id);
    setStepIdx(0);
    onTourChange?.(id);
  };

  const copyCode = () => {
    void navigator.clipboard?.writeText(tour.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="space-y-5">
      {/* Tour Selector */}
      <div className="flex flex-wrap gap-2">
        {CODE_TOURS.map((ct) => (
          <button
            type="button"
            key={ct.id}
            onClick={() => selectTour(ct.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
              tourId === ct.id
                ? "bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 border-cyan-600 dark:border-cyan-400"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
            }`}
          >
            {ct.title}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Syntax-Highlighted Code Panel */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-[#060a12] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
            <span className="font-mono text-xs text-cyan-400">{tour.file}</span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-slate-400">ESP-IDF v5.x (C)</span>
              <button
                type="button"
                onClick={copyCode}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? t.copied : "Copy"}
              </button>
            </div>
          </div>

          <div className="workbench-scroll p-3 overflow-x-auto font-mono text-xs leading-6 text-slate-200">
            {lines.map((line, i) => {
              const lineNum = i + 1;
              const inRange = lineNum >= step.lines[0] && lineNum <= step.lines[1];
              return (
                <div
                  key={i}
                  className={`flex px-2 rounded transition-colors ${
                    inRange ? "bg-cyan-500/15 text-white" : "opacity-80"
                  }`}
                >
                  <span
                    className={`w-8 shrink-0 select-none text-right pr-3 tabular-nums ${
                      inRange ? "text-cyan-400 font-semibold" : "text-slate-600"
                    }`}
                  >
                    {lineNum}
                  </span>
                  <span className="whitespace-pre">{renderCodeLine(line, setGlossaryKey)}</span>
                </div>
              );
            })}
          </div>

          <div className="px-4 py-2 bg-slate-900/80 border-t border-slate-800 text-[11px] text-slate-400">
            {t.glossaryHint}
          </div>
        </div>

        {/* Right Side: Step-by-Step Tour + API Glossary */}
        <div className="lg:col-span-5 space-y-5">
          {/* Guided Tour Stepper */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                <Compass className="w-4 h-4" />
                {t.guidedTour}
              </span>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {t.step} {stepIdx + 1} / {tour.steps.length}
              </span>
            </div>

            <div>
              <div className="text-xs font-mono text-amber-600 dark:text-amber-400 mb-1 tabular-nums">
                Lines {step.lines[0]}–{step.lines[1]}
              </div>
              <h2 className="text-base font-bold mb-2">{step.title}</h2>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {step.text}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStepIdx((s) => Math.max(0, s - 1))}
                disabled={stepIdx === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:border-cyan-500 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                {t.prev}
              </button>
              <div className="flex gap-1.5">
                {tour.steps.map((_, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setStepIdx(i)}
                    aria-label={`Go to step ${i + 1}`}
                    className={`w-2.5 h-2.5 rounded-full cursor-pointer ${
                      i === stepIdx ? "bg-cyan-500" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setStepIdx((s) => Math.min(tour.steps.length - 1, s + 1))}
                disabled={stepIdx === tour.steps.length - 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 disabled:opacity-40 hover:bg-cyan-500 dark:hover:bg-cyan-400 cursor-pointer"
              >
                {t.next}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* API Glossary Inspector */}
          {glossaryItem && (
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-2 text-violet-600 dark:text-violet-400">
                  <BookOpen className="w-4 h-4" />
                  ESP-IDF API Glossary
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {glossaryItem.category}
                </span>
              </div>
              <div className="font-mono text-sm font-bold text-cyan-700 dark:text-cyan-300">
                {glossaryItem.title}
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {glossaryItem.desc}
              </p>
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300">
                <span className="font-semibold">Pro Tip: </span>
                {glossaryItem.tip}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
