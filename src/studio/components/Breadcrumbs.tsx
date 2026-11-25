import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  mono?: boolean;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  ariaLabel: string;
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ ariaLabel, items }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-[#0a0f1a]/80">
      <nav
        aria-label={ariaLabel}
        className="max-w-7xl mx-auto px-4 sm:px-6 h-10 flex items-center overflow-x-auto"
      >
        <ol className="flex items-center gap-1.5 text-xs whitespace-nowrap">
          {items.map((item, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === items.length - 1;

            return (
              <li key={`${item.label}-${idx}`} className="flex items-center gap-1.5 min-w-0">
                {!isFirst && (
                  <ChevronRight
                    className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0"
                    aria-hidden="true"
                  />
                )}
                {!isLast && item.onClick ? (
                  <button
                    type="button"
                    onClick={item.onClick}
                    className={`flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors cursor-pointer ${
                      item.mono ? "font-mono" : "font-medium"
                    }`}
                  >
                    {isFirst && <Home className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                    <span>{item.label}</span>
                  </button>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={`flex items-center gap-1.5 ${
                      isLast
                        ? "text-slate-900 dark:text-slate-100 font-semibold"
                        : "text-slate-500 dark:text-slate-400 font-medium"
                    } ${item.mono ? "font-mono" : ""}`}
                  >
                    {isFirst && <Home className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                    <span className="truncate max-w-[260px] sm:max-w-[380px]">{item.label}</span>
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
