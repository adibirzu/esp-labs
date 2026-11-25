import { useEffect, useRef } from "react";
import { KIT_PARTS } from "../data/kit";
import type { Translations } from "../i18n";

interface KitViewProps {
  t: Translations;
  onOpenLabCode: (code: string) => void;
  highlightedPartId?: string | null;
  focusNonce?: number;
}

export function KitView({ t, onOpenLabCode, highlightedPartId, focusNonce }: KitViewProps) {
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (highlightedPartId && cardRefs.current[highlightedPartId]) {
      cardRefs.current[highlightedPartId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightedPartId, focusNonce]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{t.kitTitle}</h1>
        <p className="text-sm mt-1 text-slate-600 dark:text-slate-400">{t.kitSub}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {KIT_PARTS.map((part) => {
          const isHighlighted = highlightedPartId === part.id;
          return (
          <div
            key={part.id}
            ref={(el) => {
              cardRefs.current[part.id] = el;
            }}
            className={`p-5 rounded-xl border bg-white dark:bg-slate-900/70 flex flex-col justify-between space-y-4 transition-colors ${
              isHighlighted
                ? "border-cyan-500 ring-2 ring-cyan-500/30"
                : "border-slate-200 dark:border-slate-800"
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
                  {part.category}
                </span>
                <span className="text-amber-600 dark:text-amber-400">{part.voltage}</span>
              </div>

              <h2 className="text-base font-bold">{part.name}</h2>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-1.5">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Interface:</span>
                  <span className="text-cyan-700 dark:text-cyan-300 text-right">{part.iface}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Pins:</span>
                  <span className="text-emerald-700 dark:text-emerald-300 text-right">
                    {part.pins}
                  </span>
                </div>
              </div>

              <ul className="space-y-1">
                {part.specs.map((s, i) => (
                  <li key={i} className="text-xs text-slate-600 dark:text-slate-400">
                    – {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                {t.usedInLabs}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {part.labs.map((code) => (
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
          );
        })}
      </div>
    </div>
  );
}
