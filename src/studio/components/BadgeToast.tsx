import { useEffect } from "react";
import {
  Award,
  Code2,
  Compass,
  Crown,
  Monitor,
  Music,
  Shield,
  Sparkles,
  Wifi,
  Wrench,
  X,
} from "lucide-react";
import type { BadgeIconId, BadgeTier, DigitalBadge } from "../logic/badges";
import type { Lang } from "../types";

interface BadgeToastProps {
  badge: DigitalBadge | null;
  lang: Lang;
  onDismiss: () => void;
  onOpenAccount: () => void;
}

export function renderBadgeIcon(icon: BadgeIconId, className = "w-4 h-4") {
  switch (icon) {
    case "sparkles":
      return <Sparkles className={className} />;
    case "wrench":
      return <Wrench className={className} />;
    case "code":
      return <Code2 className={className} />;
    case "monitor":
      return <Monitor className={className} />;
    case "wifi":
      return <Wifi className={className} />;
    case "music":
      return <Music className={className} />;
    case "shield":
      return <Shield className={className} />;
    case "compass":
      return <Compass className={className} />;
    case "crown":
      return <Crown className={className} />;
    default:
      return <Award className={className} />;
  }
}

export function tierAccentClasses(tier: BadgeTier): {
  ring: string;
  bg: string;
  text: string;
  labelEn: string;
  labelRo: string;
} {
  switch (tier) {
    case "bronze":
      return {
        ring: "border-amber-600/50",
        bg: "bg-amber-600/15",
        text: "text-amber-700 dark:text-amber-400",
        labelEn: "Bronze",
        labelRo: "Bronz",
      };
    case "silver":
      return {
        ring: "border-slate-400/60",
        bg: "bg-slate-400/15",
        text: "text-slate-700 dark:text-slate-200",
        labelEn: "Silver",
        labelRo: "Argint",
      };
    case "gold":
      return {
        ring: "border-amber-400/70",
        bg: "bg-amber-400/20",
        text: "text-amber-700 dark:text-amber-300",
        labelEn: "Gold",
        labelRo: "Aur",
      };
    case "platinum":
      return {
        ring: "border-cyan-400/70",
        bg: "bg-cyan-500/20",
        text: "text-cyan-700 dark:text-cyan-300",
        labelEn: "Platinum",
        labelRo: "Platină",
      };
  }
}

export function BadgeToast({ badge, lang, onDismiss, onOpenAccount }: BadgeToastProps) {
  useEffect(() => {
    if (!badge) return;
    const timer = window.setTimeout(onDismiss, 5200);
    return () => window.clearTimeout(timer);
  }, [badge, onDismiss]);

  if (!badge) return null;

  const tier = tierAccentClasses(badge.tier);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 w-80 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-4 space-y-2.5"
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${tier.ring} ${tier.bg} ${tier.text}`}
          >
            {renderBadgeIcon(badge.icon, "w-5 h-5")}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {lang === "ro" ? "Insignă Digitală Deblocată!" : "Digital Badge Unlocked!"}
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {lang === "ro" ? badge.titleRo : badge.titleEn}
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {lang === "ro" ? tier.labelRo : tier.labelEn} · +{badge.xpReward} XP
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={lang === "ro" ? "Închide notificarea" : "Dismiss notification"}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
        {lang === "ro" ? badge.descRo : badge.descEn}
      </p>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            onDismiss();
            onOpenAccount();
          }}
          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
        >
          {lang === "ro" ? "Vezi în Cont" : "View in Account"}
        </button>
      </div>
    </div>
  );
}
