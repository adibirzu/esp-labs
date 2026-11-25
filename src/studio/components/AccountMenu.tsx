import { useEffect, useRef, useState } from "react";
import { Cloud, LogIn, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../firebase/AuthContext";
import type { Lang } from "../types";

interface AccountMenuProps {
  lang: Lang;
  onOpenInventory: () => void;
}

export function AccountMenu({ lang, onOpenInventory }: AccountMenuProps) {
  const { user, authReady, signingIn, syncStatus, signInWithGoogle, signOutUser } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  if (!authReady) {
    return (
      <div className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900" />
    );
  }

  if (!user) {
    return (
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
            : lang === "ro"
              ? "Google SSO"
              : "Google SSO"}
        </span>
      </button>
    );
  }

  const initials = (user.displayName || user.email || "M")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:border-emerald-500 transition-colors cursor-pointer whitespace-nowrap"
        aria-expanded={open}
        aria-label={lang === "ro" ? "Contul meu Google" : "My Google Account"}
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
        <span className="hidden 2xl:inline max-w-24 truncate">
          {user.displayName?.split(" ")[0] ?? "Maker"}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-3 space-y-2.5 z-50">
          <div className="space-y-0.5 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="text-xs font-bold truncate">{user.displayName || "ESP Maker"}</div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
              {user.email}
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 pt-1">
              <Cloud className="w-3 h-3" />
              <span>
                {syncStatus === "syncing"
                  ? lang === "ro"
                    ? "Se sincronizează în cloud..."
                    : "Syncing to cloud..."
                  : lang === "ro"
                    ? "Inventar privat sincronizat"
                    : "Private vault synced"}
              </span>
            </div>
          </div>

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
        </div>
      )}
    </div>
  );
}
