import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Cloud,
  Lock,
  LogIn,
  LogOut,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { useAuth } from "../firebase/AuthContext";
import type { DigitalBadge, DigitalBadgeSummary } from "../logic/badges";
import type { Lang } from "../types";
import { renderBadgeIcon, tierAccentClasses } from "./BadgeToast";

interface AccountMenuProps {
  lang: Lang;
  badgeSummary: DigitalBadgeSummary;
  onOpenInventory: () => void;
  onNavigateToBadgeGoal: (badge: DigitalBadge) => void;
  externalOpenNonce?: number;
}

export function AccountMenu({
  lang,
  badgeSummary,
  onOpenInventory,
  onNavigateToBadgeGoal,
  externalOpenNonce = 0,
}: AccountMenuProps) {
  const { user, authReady, signingIn, syncStatus, signInWithGoogle, signOutUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>(
    badgeSummary.badges[0]?.id ?? "esp-rookie",
  );
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (externalOpenNonce > 0) {
      setOpen(true);
    }
  }, [externalOpenNonce]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selectedBadge =
    badgeSummary.badges.find((b) => b.id === selectedBadgeId) ??
    badgeSummary.nextRecommendedBadge ??
    badgeSummary.badges[0];

  const initials = (user?.displayName || user?.email || "M")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div ref={menuRef} className="relative flex items-center gap-1.5">
      {/* Unified Badges + Account Trigger (works for both signed-in & guest explorers) */}
      {!user ? (
        <>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-mono font-bold hover:border-amber-500 transition-colors cursor-pointer whitespace-nowrap tabular-nums"
            aria-expanded={open}
            aria-label={lang === "ro" ? "Insigne Digitale & Cont" : "Digital Badges & Account"}
            title={lang === "ro" ? "Pașaport Insigne Digitale" : "Digital Badges Passport"}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              {badgeSummary.unlockedCount}/{badgeSummary.badges.length}
            </span>
          </button>

          {authReady && (
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              disabled={signingIn}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
              title={lang === "ro" ? "Conectare securizată cu Google SSO" : "Sign in securely with Google SSO"}
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">
                {signingIn
                  ? lang === "ro"
                    ? "Se conectează..."
                    : "Signing in..."
                  : "Google SSO"}
              </span>
            </button>
          )}
        </>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:border-emerald-500 transition-colors cursor-pointer whitespace-nowrap"
          aria-expanded={open}
          aria-label={lang === "ro" ? "Contul meu Google & Insigne" : "My Google Account & Badges"}
        >
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName ?? "User"}
              referrerPolicy="no-referrer"
              className="w-6 h-6 rounded-md object-cover"
            />
          ) : (
            <span className="w-6 h-6 rounded-md bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
              {initials}
            </span>
          )}
          <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-600 dark:text-amber-300 tabular-nums">
            <Trophy className="w-3 h-3" />
            {badgeSummary.unlockedCount}/{badgeSummary.badges.length}
          </span>
          <span className="hidden 2xl:inline max-w-24 truncate">
            {user.displayName?.split(" ")[0] ?? "Maker"}
          </span>
        </button>
      )}

      {/* Digital Badges Passport & Account Dropdown */}
      {open && (
        <div
          role="dialog"
          aria-label={lang === "ro" ? "Pașaport Insigne Digitale" : "Digital Badges Passport"}
          className="absolute right-0 top-full mt-2 w-80 sm:w-[360px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-3.5 space-y-3 z-50"
        >
          {/* Header: Account Identity / Cloud Sync */}
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {user
                  ? user.displayName || "ESP Maker"
                  : lang === "ro"
                    ? "Pașaport Maker (Local)"
                    : "Maker Passport (Local)"}
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                {user
                  ? user.email
                  : lang === "ro"
                    ? "Conectează Google SSO pentru sincronizare cloud"
                    : "Sign in with Google SSO to sync badges"}
              </div>
              {user && (
                <div className="inline-flex items-center gap-1 text-[10.5px] text-emerald-600 dark:text-emerald-400 pt-0.5">
                  <Cloud className="w-3 h-3" />
                  <span>
                    {syncStatus === "syncing"
                      ? lang === "ro"
                        ? "Se sincronizează în cloud..."
                        : "Syncing to cloud..."
                      : lang === "ro"
                        ? "Insigne & inventar sincronizate"
                        : "Badges & vault synced"}
                  </span>
                </div>
              )}
            </div>
            {!user && authReady && (
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                disabled={signingIn}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0"
              >
                <LogIn className="w-3 h-3" />
                <span>SSO</span>
              </button>
            )}
          </div>

          {/* Level & XP Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {lang === "ro"
                  ? `Nivel ${badgeSummary.level} · ${badgeSummary.levelTitleRo}`
                  : `Level ${badgeSummary.level} · ${badgeSummary.levelTitleEn}`}
              </span>
              <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
                {badgeSummary.xp} XP
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(8, badgeSummary.levelProgressPct)}%` }}
              />
            </div>
          </div>

          {/* Interactive 3x3 Digital Badges Medallion Grid */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span className="font-semibold uppercase tracking-wider">
                {lang === "ro" ? "Insigne Digitale" : "Digital Badges"}
              </span>
              <span className="tabular-nums font-bold text-amber-600 dark:text-amber-400">
                {badgeSummary.unlockedCount}/{badgeSummary.badges.length}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {badgeSummary.badges.map((badge) => {
                const active = selectedBadge?.id === badge.id;
                const tier = tierAccentClasses(badge.tier);
                return (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() => setSelectedBadgeId(badge.id)}
                    className={`p-2 rounded-xl border text-left transition-colors cursor-pointer flex flex-col items-center gap-1 text-center ${
                      active
                        ? "border-cyan-500 bg-cyan-500/10"
                        : badge.unlocked
                          ? `${tier.ring} ${tier.bg} hover:border-cyan-500/60`
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-slate-400 dark:hover:border-slate-600"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center relative ${
                        badge.unlocked
                          ? `${tier.text} bg-white/80 dark:bg-slate-900/90`
                          : "text-slate-400 dark:text-slate-500 bg-slate-200/70 dark:bg-slate-800"
                      }`}
                    >
                      {renderBadgeIcon(badge.icon, "w-3.5 h-3.5")}
                      {badge.unlocked ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 absolute -top-1 -right-1 bg-white dark:bg-slate-900 rounded-full" />
                      ) : (
                        <Lock className="w-2.5 h-2.5 text-slate-400 absolute -top-1 -right-1" />
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-semibold leading-tight line-clamp-2 ${
                        badge.unlocked
                          ? "text-slate-900 dark:text-slate-100"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {lang === "ro" ? badge.titleRo : badge.titleEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Badge Inspector Card */}
          {selectedBadge && (
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {lang === "ro" ? selectedBadge.titleRo : selectedBadge.titleEn}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold whitespace-nowrap ${
                    selectedBadge.unlocked
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {selectedBadge.unlocked
                    ? lang === "ro"
                      ? `DEBLOCAT · +${selectedBadge.xpReward} XP`
                      : `EARNED · +${selectedBadge.xpReward} XP`
                    : `${selectedBadge.progress}/${selectedBadge.target}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                {lang === "ro" ? selectedBadge.descRo : selectedBadge.descEn}
              </p>
              <div className="text-[10.5px] text-slate-500 dark:text-slate-400">
                <strong className="text-slate-700 dark:text-slate-200">
                  {lang === "ro" ? "Obiectiv:" : "Criteria:"}
                </strong>{" "}
                {lang === "ro" ? selectedBadge.criteriaRo : selectedBadge.criteriaEn}
              </div>
              {!selectedBadge.unlocked && (
                <div className="pt-1 flex items-center justify-between gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.max(6, selectedBadge.progressPct)}%` }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onNavigateToBadgeGoal(selectedBadge);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer whitespace-nowrap"
                  >
                    <span>{lang === "ro" ? "Mergi la Lab" : "Go to Goal"}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-1 border-t border-slate-200 dark:border-slate-800 space-y-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenInventory();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
              <span>{lang === "ro" ? "Deschide Inventarul Securizat" : "Open Secure Inventory"}</span>
            </button>

            {user && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void signOutUser();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-left text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{lang === "ro" ? "Deconectare" : "Sign Out"}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
