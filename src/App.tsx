import { useCallback, useEffect, useMemo, useState } from "react";
import { Code2, Cpu, Globe, Layers, Moon, Package, Sliders, Sun } from "lucide-react";
import { Breadcrumbs, type BreadcrumbItem } from "./studio/components/Breadcrumbs";
import { GlobalSearch, type SearchResultAction } from "./studio/components/GlobalSearch";
import { CHIP_BLOCKS, REGISTERS } from "./studio/data/chip";
import { CODE_TOURS } from "./studio/data/code";
import { KIT_PARTS } from "./studio/data/kit";
import { LABS, TRACKS } from "./studio/data/labs";
import { ALL_PINS, RIGHT_PINS } from "./studio/data/pinout";
import { I18N } from "./studio/i18n";
import type { Lang, TrackId, ViewId } from "./studio/types";
import { ChipAtlasView } from "./studio/views/ChipAtlasView";
import { CodeToursView } from "./studio/views/CodeToursView";
import { KitView } from "./studio/views/KitView";
import { LabsView } from "./studio/views/LabsView";
import { PinoutView } from "./studio/views/PinoutView";

export default function App() {
  const [view, setView] = useState<ViewId>("labs");
  const [activeTrack, setActiveTrack] = useState<"all" | TrackId>("all");
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  const [activeTourId, setActiveTourId] = useState<string>(CODE_TOURS[0].id);
  const [targetRegId, setTargetRegId] = useState<string | null>(null);
  const [targetBlockId, setTargetBlockId] = useState<string | null>(null);
  const [activeChipFocus, setActiveChipFocus] = useState<
    { kind: "block"; id: string } | { kind: "register"; id: string }
  >({ kind: "block", id: CHIP_BLOCKS[0].id });
  const [targetPinId, setTargetPinId] = useState<string | null>(null);
  const [activePinLabel, setActivePinLabel] = useState<string>(RIGHT_PINS[13].label);
  const [targetKitPartId, setTargetKitPartId] = useState<string | null>(null);
  const [focusNonce, setFocusNonce] = useState(0);

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("esp_labs_studio_theme");
      return saved ? saved === "dark" : true;
    } catch {
      return true;
    }
  });

  const [lang, setLang] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem("esp_labs_studio_lang");
      return saved === "ro" ? "ro" : "en";
    } catch {
      return "en";
    }
  });

  const [completedLabs, setCompletedLabs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("esp_labs_studio_completed");
      return saved ? (JSON.parse(saved) as string[]) : ["intro-1", "display-1"];
    } catch {
      return ["intro-1", "display-1"];
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    try {
      localStorage.setItem("esp_labs_studio_theme", isDark ? "dark" : "light");
    } catch {
      // Ignore storage errors
    }
  }, [isDark]);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem("esp_labs_studio_lang", lang);
    } catch {
      // Ignore storage errors
    }
  }, [lang]);

  useEffect(() => {
    try {
      localStorage.setItem("esp_labs_studio_completed", JSON.stringify(completedLabs));
    } catch {
      // Ignore storage errors
    }
  }, [completedLabs]);

  const toggleComplete = useCallback((id: string) => {
    setCompletedLabs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const resetProgress = useCallback(() => {
    setCompletedLabs([]);
  }, []);

  const openLabByCode = useCallback((code: string) => {
    const found = LABS.find((l) => l.code === code);
    if (found) {
      setActiveTrack(found.track);
      setSelectedLabId(found.id);
      setView("labs");
    }
  }, []);

  const openCodeTour = useCallback((tourId: string) => {
    setActiveTourId(tourId);
    setView("code");
  }, []);

  const handleGlobalSearchSelect = useCallback((action: SearchResultAction) => {
    setFocusNonce((n) => n + 1);
    if (action.kind === "lab") {
      const found = LABS.find((l) => l.id === action.id);
      if (found) setActiveTrack(found.track);
      setSelectedLabId(action.id);
      setView("labs");
    } else if (action.kind === "register") {
      setTargetBlockId(null);
      setTargetRegId(action.id);
      setActiveChipFocus({ kind: "register", id: action.id });
      setView("chip");
    } else if (action.kind === "block") {
      setTargetRegId(null);
      setTargetBlockId(action.id);
      setActiveChipFocus({ kind: "block", id: action.id });
      setView("chip");
    } else if (action.kind === "pin") {
      const pin = ALL_PINS.find((p) => p.id === action.id);
      if (pin) setActivePinLabel(pin.label);
      setTargetPinId(action.id);
      setView("pinout");
    } else if (action.kind === "kit") {
      setTargetKitPartId(action.id);
      setView("kit");
    }
  }, []);

  const t = I18N[lang];

  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    const root: BreadcrumbItem = {
      label: t.appTitle,
      onClick: () => {
        setView("labs");
        setSelectedLabId(null);
        setActiveTrack("all");
      },
    };

    if (view === "labs") {
      const lab = selectedLabId ? LABS.find((l) => l.id === selectedLabId) : null;
      const trackId = lab ? lab.track : activeTrack !== "all" ? activeTrack : null;
      const track = trackId ? TRACKS.find((tr) => tr.id === trackId) : null;

      const items: BreadcrumbItem[] = [
        root,
        {
          label: t.nav.labs,
          onClick:
            lab || track
              ? () => {
                  setSelectedLabId(null);
                  setActiveTrack("all");
                }
              : undefined,
        },
      ];
      if (track) {
        items.push({
          label: track.name,
          onClick: lab
            ? () => {
                setSelectedLabId(null);
                setActiveTrack(track.id);
              }
            : undefined,
        });
      }
      if (lab) {
        items.push({
          label: `${lab.code}: ${lab.title}`,
        });
      }
      return items;
    }

    if (view === "pinout") {
      return [
        root,
        { label: t.nav.pinout, onClick: () => setView("pinout") },
        { label: activePinLabel, mono: true },
      ];
    }

    if (view === "chip") {
      if (activeChipFocus.kind === "register") {
        const reg = REGISTERS.find((r) => r.id === activeChipFocus.id);
        return [
          root,
          {
            label: t.nav.chip,
            onClick: () => {
              setActiveChipFocus({ kind: "block", id: CHIP_BLOCKS[0].id });
              setTargetRegId(null);
              setTargetBlockId(CHIP_BLOCKS[0].id);
              setFocusNonce((n) => n + 1);
            },
          },
          { label: t.registersCrumb },
          { label: reg ? `${reg.id} (${reg.address})` : activeChipFocus.id, mono: true },
        ];
      }
      const block = CHIP_BLOCKS.find((b) => b.id === activeChipFocus.id);
      return [
        root,
        { label: t.nav.chip },
        ...(block ? [{ label: block.name }] : []),
      ];
    }

    if (view === "code") {
      const tour = CODE_TOURS.find((ct) => ct.id === activeTourId) ?? CODE_TOURS[0];
      return [
        root,
        { label: t.nav.code },
        { label: tour.title },
        { label: tour.file, mono: true },
      ];
    }

    // view === "kit"
    const part = targetKitPartId ? KIT_PARTS.find((p) => p.id === targetKitPartId) : null;
    return [
      root,
      {
        label: t.nav.kit,
        onClick: part ? () => setTargetKitPartId(null) : undefined,
      },
      ...(part ? [{ label: part.name }] : []),
    ];
  }, [
    t,
    view,
    selectedLabId,
    activeTrack,
    activePinLabel,
    activeChipFocus,
    activeTourId,
    targetKitPartId,
  ]);

  const navItems: { id: ViewId; label: string; icon: typeof Cpu }[] = [
    { id: "labs", label: t.nav.labs, icon: Cpu },
    { id: "pinout", label: t.nav.pinout, icon: Sliders },
    { id: "chip", label: t.nav.chip, icon: Layers },
    { id: "code", label: t.nav.code, icon: Code2 },
    { id: "kit", label: t.nav.kit, icon: Package },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#080c14] dark:text-slate-100 transition-colors duration-150">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#080c14]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-3 sm:gap-5">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => {
              setView("labs");
              setSelectedLabId(null);
              setActiveTrack("all");
            }}
            className="flex items-center gap-2.5 text-left cursor-pointer shrink-0 whitespace-nowrap"
          >
            <span className="w-8 h-8 rounded-lg bg-cyan-600 dark:bg-cyan-500 flex items-center justify-center text-white dark:text-slate-950">
              <Cpu className="w-4 h-4" />
            </span>
            <span
              className="font-bold text-base tracking-tight hidden sm:inline"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t.appTitle}
            </span>
          </button>

          {/* Zone 2: Navigation */}
          <nav
            aria-label="Primary"
            className="flex items-center gap-1 overflow-x-auto py-1 min-w-0"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/70"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Global Search + Language & Theme Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <GlobalSearch t={t} onSelect={handleGlobalSearchSelect} />
            <button
              type="button"
              onClick={() => setLang((l) => (l === "en" ? "ro" : "en"))}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-cyan-500 transition-colors cursor-pointer whitespace-nowrap"
              title="Switch Language (EN / RO)"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-500" />
              {lang.toUpperCase()}
            </button>
            <button
              type="button"
              onClick={() => setIsDark((d) => !d)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-amber-300 hover:border-cyan-500 transition-colors cursor-pointer"
              title="Toggle Dark / Light Theme"
              aria-label="Toggle Dark or Light Theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Breadcrumb Navigation Trail */}
      <Breadcrumbs ariaLabel={t.breadcrumbAria} items={breadcrumbs} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {view === "labs" && (
          <LabsView
            t={t}
            completedLabs={completedLabs}
            toggleComplete={toggleComplete}
            resetProgress={resetProgress}
            activeTrack={activeTrack}
            setActiveTrack={setActiveTrack}
            selectedLabId={selectedLabId}
            setSelectedLabId={setSelectedLabId}
            onOpenCodeTour={openCodeTour}
          />
        )}
        {view === "pinout" && (
          <PinoutView
            t={t}
            initialPinId={targetPinId}
            focusNonce={focusNonce}
            onPinChange={(pin) => setActivePinLabel(pin.label)}
          />
        )}
        {view === "chip" && (
          <ChipAtlasView
            t={t}
            onOpenLabCode={openLabByCode}
            initialRegId={targetRegId}
            initialBlockId={targetBlockId}
            focusNonce={focusNonce}
            onBlockChange={(id) => setActiveChipFocus({ kind: "block", id })}
            onRegChange={(id) => setActiveChipFocus({ kind: "register", id })}
          />
        )}
        {view === "code" && (
          <CodeToursView
            t={t}
            initialTourId={activeTourId}
            onTourChange={(id) => setActiveTourId(id)}
          />
        )}
        {view === "kit" && (
          <KitView
            t={t}
            onOpenLabCode={openLabByCode}
            highlightedPartId={targetKitPartId}
            focusNonce={focusNonce}
          />
        )}
      </main>
    </div>
  );
}
