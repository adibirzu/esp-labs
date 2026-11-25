import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  CircuitBoard,
  Code2,
  Cpu,
  Globe,
  Home,
  Layers,
  Lightbulb,
  Moon,
  Package,
  Radio,
  Sliders,
  Sun,
} from "lucide-react";
import { AccountMenu } from "./studio/components/AccountMenu";
import { Breadcrumbs, type BreadcrumbItem } from "./studio/components/Breadcrumbs";
import { GlobalSearch, type SearchResultAction } from "./studio/components/GlobalSearch";
import { OFFICIAL_ESP_BOARDS } from "./studio/data/boards";
import { CHIP_BLOCKS, REGISTERS } from "./studio/data/chip";
import { CODE_TOURS } from "./studio/data/code";
import { FLIPPER_BOARDS, FLIPPER_GUIDES, pickText } from "./studio/data/flipper";
import { PROJECT_IDEAS } from "./studio/data/ideas";
import { KIT_PARTS } from "./studio/data/kit";
import { LABS, TRACKS } from "./studio/data/labs";
import { ALL_PINS, RIGHT_PINS } from "./studio/data/pinout";
import {
  localizeChipBlock,
  localizeCodeTour,
  localizeIdea,
  localizeKitPart,
  localizeLab,
  localizeTrack,
} from "./studio/data/ro-overrides";
import { useAuth } from "./studio/firebase/AuthContext";
import { I18N } from "./studio/i18n";
import type { AudienceMode, Lang, TrackId, ViewId } from "./studio/types";
import { BoardsLibraryView } from "./studio/views/BoardsLibraryView";
import { ChipAtlasView } from "./studio/views/ChipAtlasView";
import { CodeToursView } from "./studio/views/CodeToursView";
import { FlipperZeroView } from "./studio/views/FlipperZeroView";
import { HomeView } from "./studio/views/HomeView";
import { IdeasView } from "./studio/views/IdeasView";
import { KitView, type CustomInventoryItem } from "./studio/views/KitView";
import { LabsView } from "./studio/views/LabsView";
import { PinoutView } from "./studio/views/PinoutView";
import { Workbench3DView } from "./studio/views/Workbench3DView";

const DEFAULT_OWNED_PARTS: Record<string, number> = {
  "esp32-s3-devkit": 1,
  "ssd1306-oled": 1,
  "breadboard-wires": 1,
};

export default function App() {
  const { user, vaultLoaded, cloudVault, saveInventoryVault, saveBenchLayout } = useAuth();
  const hydratedCloudUidRef = useRef<string | null>(null);
  const skipNextCloudSaveRef = useRef(false);

  const [view, setView] = useState<ViewId>("home");
  const [activeTrack, setActiveTrack] = useState<"all" | TrackId>("all");
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string>(OFFICIAL_ESP_BOARDS[0].id);
  const [ideaBoardFilter, setIdeaBoardFilter] = useState<"all" | string>("all");
  const [highlightedIdeaId, setHighlightedIdeaId] = useState<string | null>(null);
  const [activeTourId, setActiveTourId] = useState<string>(CODE_TOURS[0].id);
  const [targetRegId, setTargetRegId] = useState<string | null>(null);
  const [targetBlockId, setTargetBlockId] = useState<string | null>(null);
  const [activeChipFocus, setActiveChipFocus] = useState<
    { kind: "block"; id: string } | { kind: "register"; id: string }
  >({ kind: "block", id: CHIP_BLOCKS[0].id });
  const [targetPinId, setTargetPinId] = useState<string | null>(null);
  const [activePinLabel, setActivePinLabel] = useState<string>(RIGHT_PINS[13].label);
  const [targetKitPartId, setTargetKitPartId] = useState<string | null>(null);
  const [targetFlipperGuideId, setTargetFlipperGuideId] = useState<string | null>(null);
  const [targetFlipperBoardId, setTargetFlipperBoardId] = useState<string | null>(null);
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
      return saved === "en" ? "en" : "ro";
    } catch {
      return "ro";
    }
  });

  const [audienceMode, setAudienceMode] = useState<AudienceMode>(() => {
    try {
      const saved = localStorage.getItem("esp_labs_studio_audience");
      return saved === "adults" ? "adults" : "kids";
    } catch {
      return "kids";
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

  const [savedIdeaIds, setSavedIdeaIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("esp_labs_studio_saved_ideas");
      return saved ? (JSON.parse(saved) as string[]) : ["idea-smart-rfid-vault"];
    } catch {
      return ["idea-smart-rfid-vault"];
    }
  });

  const [playgroundRuns, setPlaygroundRuns] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("esp_labs_studio_playground_runs");
      return saved ? Number(saved) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [solvedQuizIds, setSolvedQuizIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("esp_labs_studio_solved_quiz");
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });

  const [ownedParts, setOwnedParts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("esp_labs_studio_inventory_owned");
      return saved ? (JSON.parse(saved) as Record<string, number>) : DEFAULT_OWNED_PARTS;
    } catch {
      return DEFAULT_OWNED_PARTS;
    }
  });

  const [customParts, setCustomParts] = useState<CustomInventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("esp_labs_studio_inventory_custom");
      return saved ? (JSON.parse(saved) as CustomInventoryItem[]) : [];
    } catch {
      return [];
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
      localStorage.setItem("esp_labs_studio_audience", audienceMode);
    } catch {
      // Ignore storage errors
    }
  }, [audienceMode]);

  useEffect(() => {
    try {
      localStorage.setItem("esp_labs_studio_completed", JSON.stringify(completedLabs));
    } catch {
      // Ignore storage errors
    }
  }, [completedLabs]);

  useEffect(() => {
    try {
      localStorage.setItem("esp_labs_studio_saved_ideas", JSON.stringify(savedIdeaIds));
    } catch {
      // Ignore storage errors
    }
  }, [savedIdeaIds]);

  useEffect(() => {
    try {
      localStorage.setItem("esp_labs_studio_playground_runs", String(playgroundRuns));
    } catch {
      // Ignore storage errors
    }
  }, [playgroundRuns]);

  useEffect(() => {
    try {
      localStorage.setItem("esp_labs_studio_solved_quiz", JSON.stringify(solvedQuizIds));
    } catch {
      // Ignore storage errors
    }
  }, [solvedQuizIds]);

  useEffect(() => {
    try {
      localStorage.setItem("esp_labs_studio_inventory_owned", JSON.stringify(ownedParts));
    } catch {
      // Ignore storage errors
    }
  }, [ownedParts]);

  useEffect(() => {
    try {
      localStorage.setItem("esp_labs_studio_inventory_custom", JSON.stringify(customParts));
    } catch {
      // Ignore storage errors
    }
  }, [customParts]);

  // Hydrate local state once per signed-in session when Firestore cloudVault arrives
  useEffect(() => {
    if (!user) {
      hydratedCloudUidRef.current = null;
      return;
    }
    if (!vaultLoaded) return;
    if (hydratedCloudUidRef.current === user.uid) return;
    hydratedCloudUidRef.current = user.uid;
    if (cloudVault) {
      skipNextCloudSaveRef.current = true;
      setOwnedParts(cloudVault.ownedParts);
      if (cloudVault.completedLabs.length > 0) {
        setCompletedLabs(cloudVault.completedLabs);
      }
      if (cloudVault.savedIdeaIds.length > 0) {
        setSavedIdeaIds(cloudVault.savedIdeaIds);
      }
    }
  }, [user, vaultLoaded, cloudVault]);

  // Debounced owner-only cloud vault save whenever authenticated user edits inventory/progress
  useEffect(() => {
    if (!user || !vaultLoaded || hydratedCloudUidRef.current !== user.uid) return;
    if (skipNextCloudSaveRef.current) {
      skipNextCloudSaveRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      void saveInventoryVault({
        ownedParts,
        customParts: customParts.map((c) => c.name),
        completedLabs,
        savedIdeaIds,
        benchLayout: cloudVault?.benchLayout ?? {},
      });
    }, 650);
    return () => window.clearTimeout(timer);
  }, [user, vaultLoaded, ownedParts, customParts, completedLabs, savedIdeaIds, cloudVault?.benchLayout, saveInventoryVault]);

  const toggleComplete = useCallback((id: string) => {
    setCompletedLabs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const toggleSavedIdea = useCallback((id: string) => {
    setSavedIdeaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const resetProgress = useCallback(() => {
    setCompletedLabs([]);
  }, []);

  const restoreProgress = useCallback((labIds: string[]) => {
    setCompletedLabs(labIds);
  }, []);

  const handleRunPlayground = useCallback(() => {
    setPlaygroundRuns((n) => n + 1);
  }, []);

  const handleSolveQuiz = useCallback((quizId: string) => {
    setSolvedQuizIds((prev) => (prev.includes(quizId) ? prev : [...prev, quizId]));
  }, []);

  const openLabById = useCallback((labId: string) => {
    const found = LABS.find((l) => l.id === labId);
    if (found) {
      setActiveTrack(found.track);
      setSelectedLabId(found.id);
      setView("labs");
    }
  }, []);

  const openLabByCode = useCallback((code: string) => {
    const found = LABS.find((l) => l.code === code);
    if (found) {
      setActiveTrack(found.track);
      setSelectedLabId(found.id);
      setView("labs");
    }
  }, []);

  const openIdeaById = useCallback((ideaId: string) => {
    setIdeaBoardFilter("all");
    setHighlightedIdeaId(ideaId);
    setView("ideas");
  }, []);

  const openFlipperGuide = useCallback((guideId: string) => {
    setTargetFlipperBoardId(null);
    setTargetFlipperGuideId(guideId);
    setFocusNonce((n) => n + 1);
    setView("flipper");
  }, []);

  const openFlipperBoard = useCallback((boardId: string) => {
    setTargetFlipperGuideId(null);
    setTargetFlipperBoardId(boardId);
    setFocusNonce((n) => n + 1);
    setView("flipper");
  }, []);

  const openCodeTour = useCallback((tourId: string) => {
    setActiveTourId(tourId);
    setView("code");
  }, []);

  const openBoardById = useCallback((boardId: string) => {
    setSelectedBoardId(boardId);
    setView("boards");
  }, []);

  const openIdeasForBoard = useCallback((boardId: string) => {
    setIdeaBoardFilter(boardId);
    setHighlightedIdeaId(null);
    setView("ideas");
  }, []);

  const handleGlobalSearchSelect = useCallback((action: SearchResultAction) => {
    setFocusNonce((n) => n + 1);
    if (action.kind === "board") {
      setSelectedBoardId(action.id);
      setView("boards");
    } else if (action.kind === "flipper-board") {
      setTargetFlipperGuideId(null);
      setTargetFlipperBoardId(action.id);
      setView("flipper");
    } else if (action.kind === "flipper-guide") {
      setTargetFlipperBoardId(null);
      setTargetFlipperGuideId(action.id);
      setView("flipper");
    } else if (action.kind === "idea") {
      setIdeaBoardFilter("all");
      setHighlightedIdeaId(action.id);
      setView("ideas");
    } else if (action.kind === "lab") {
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
        setView("home");
        setSelectedLabId(null);
        setActiveTrack("all");
      },
    };

    if (view === "home") {
      return [{ label: t.appTitle }, { label: t.nav.home }];
    }

    if (view === "bench3d") {
      return [
        root,
        { label: t.nav.bench3d },
        {
          label:
            lang === "ro"
              ? "ESP32-S3 · Flipper Zero · OLED · RFID · USB/BLE"
              : "ESP32-S3 · Flipper Zero · OLED · RFID · USB/BLE",
          mono: true,
        },
      ];
    }

    if (view === "flipper") {
      const guide = targetFlipperGuideId
        ? FLIPPER_GUIDES.find((g) => g.id === targetFlipperGuideId)
        : null;
      const fBoard = targetFlipperBoardId
        ? FLIPPER_BOARDS.find((b) => b.id === targetFlipperBoardId)
        : null;
      return [
        root,
        {
          label: t.nav.flipper,
          onClick:
            guide || fBoard
              ? () => {
                  setTargetFlipperGuideId(null);
                  setTargetFlipperBoardId(null);
                }
              : undefined,
        },
        ...(fBoard ? [{ label: fBoard.name }] : []),
        ...(guide ? [{ label: pickText(guide.title, lang) }] : []),
      ];
    }

    if (view === "labs") {
      const rawLab = selectedLabId ? LABS.find((l) => l.id === selectedLabId) : null;
      const lab = rawLab ? localizeLab(rawLab, lang) : null;
      const trackId = lab ? lab.track : activeTrack !== "all" ? activeTrack : null;
      const rawTrack = trackId ? TRACKS.find((tr) => tr.id === trackId) : null;
      const track = rawTrack ? localizeTrack(rawTrack, lang) : null;

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

    if (view === "boards") {
      const board = OFFICIAL_ESP_BOARDS.find((b) => b.id === selectedBoardId);
      return [
        root,
        { label: t.nav.boards },
        ...(board
          ? [
              {
                label: `${board.name} (${board.lengthMm.toFixed(2)} × ${board.widthMm.toFixed(2)} mm)`,
                mono: true,
              },
            ]
          : []),
      ];
    }

    if (view === "ideas") {
      const filteredBoard =
        ideaBoardFilter !== "all"
          ? OFFICIAL_ESP_BOARDS.find((b) => b.id === ideaBoardFilter)
          : null;
      const rawHighlighted = highlightedIdeaId
        ? PROJECT_IDEAS.find((i) => i.id === highlightedIdeaId)
        : null;
      const highlighted = rawHighlighted ? localizeIdea(rawHighlighted, lang) : null;

      const items: BreadcrumbItem[] = [
        root,
        {
          label: t.nav.ideas,
          onClick:
            filteredBoard || highlighted
              ? () => {
                  setIdeaBoardFilter("all");
                  setHighlightedIdeaId(null);
                }
              : undefined,
        },
      ];
      if (filteredBoard) {
        items.push({ label: filteredBoard.name, mono: true });
      }
      if (highlighted) {
        items.push({ label: highlighted.title });
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
      const rawBlock = CHIP_BLOCKS.find((b) => b.id === activeChipFocus.id);
      const block = rawBlock ? localizeChipBlock(rawBlock, lang) : null;
      return [
        root,
        { label: t.nav.chip },
        ...(block ? [{ label: block.name }] : []),
      ];
    }

    if (view === "code") {
      const rawTour = CODE_TOURS.find((ct) => ct.id === activeTourId) ?? CODE_TOURS[0];
      const tour = localizeCodeTour(rawTour, lang);
      return [
        root,
        { label: t.nav.code },
        { label: tour.title },
        { label: tour.file, mono: true },
      ];
    }

    // view === "kit"
    const rawPart = targetKitPartId ? KIT_PARTS.find((p) => p.id === targetKitPartId) : null;
    const part = rawPart ? localizeKitPart(rawPart, lang) : null;
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
    lang,
    view,
    selectedLabId,
    activeTrack,
    selectedBoardId,
    ideaBoardFilter,
    highlightedIdeaId,
    activePinLabel,
    activeChipFocus,
    activeTourId,
    targetKitPartId,
    targetFlipperGuideId,
    targetFlipperBoardId,
  ]);

  const navItems: { id: ViewId; label: string; icon: typeof Cpu }[] = [
    { id: "home", label: t.nav.home, icon: Home },
    { id: "bench3d", label: t.nav.bench3d, icon: Box },
    { id: "labs", label: t.nav.labs, icon: Cpu },
    { id: "flipper", label: t.nav.flipper, icon: Radio },
    { id: "boards", label: t.nav.boards, icon: CircuitBoard },
    { id: "ideas", label: t.nav.ideas, icon: Lightbulb },
    { id: "pinout", label: t.nav.pinout, icon: Sliders },
    { id: "chip", label: t.nav.chip, icon: Layers },
    { id: "code", label: t.nav.code, icon: Code2 },
    { id: "kit", label: t.nav.kit, icon: Package },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#080c14] dark:text-slate-100 transition-colors duration-150">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#080c14]/90 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-5 h-15 flex items-center justify-between gap-2">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => {
              setView("home");
              setSelectedLabId(null);
              setActiveTrack("all");
            }}
            className="flex items-center gap-2 text-left cursor-pointer shrink-0 whitespace-nowrap"
          >
            <span className="w-8 h-8 rounded-lg bg-cyan-600 dark:bg-cyan-500 flex items-center justify-center text-white dark:text-slate-950">
              <Cpu className="w-4 h-4" />
            </span>
            <span
              className="font-bold text-sm tracking-tight hidden 2xl:inline"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t.appTitle}
            </span>
          </button>

          {/* Zone 2: Desktop Navigation */}
          <nav
            aria-label={t.primaryNavAria}
            className="hidden lg:flex items-center gap-0.5 overflow-x-auto py-1 min-w-0"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/70"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Global Search + Google SSO Account + Language & Theme Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <GlobalSearch t={t} lang={lang} onSelect={handleGlobalSearchSelect} />
            <AccountMenu lang={lang} onOpenInventory={() => setView("kit")} />
            <button
              type="button"
              onClick={() => setLang((l) => (l === "ro" ? "en" : "ro"))}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-mono font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-cyan-500 transition-colors cursor-pointer whitespace-nowrap"
              title={t.switchLangTitle}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-500" />
              {lang.toUpperCase()}
            </button>
            <button
              type="button"
              onClick={() => setIsDark((d) => !d)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-amber-300 hover:border-cyan-500 transition-colors cursor-pointer"
              title={t.toggleThemeTitle}
              aria-label={t.toggleThemeTitle}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile/Tablet Navigation Strip */}
        <nav
          aria-label={t.primaryNavAria}
          className="lg:hidden border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 flex items-center gap-1 overflow-x-auto"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                type="button"
                key={`mob-${item.id}`}
                onClick={() => setView(item.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/70"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* Breadcrumb Navigation Trail */}
      <Breadcrumbs ariaLabel={t.breadcrumbAria} items={breadcrumbs} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {view === "home" && (
          <HomeView
            t={t}
            lang={lang}
            audienceMode={audienceMode}
            setAudienceMode={setAudienceMode}
            completedLabs={completedLabs}
            savedIdeaIds={savedIdeaIds}
            playgroundRuns={playgroundRuns}
            solvedQuizIds={solvedQuizIds}
            onRunPlayground={handleRunPlayground}
            onSolveQuiz={handleSolveQuiz}
            onNavigate={setView}
            onOpenLabId={openLabById}
            onOpenIdeaId={openIdeaById}
          />
        )}
        {view === "bench3d" && (
          <Workbench3DView
            lang={lang}
            savedLayout={cloudVault?.benchLayout}
            isSignedIn={Boolean(user)}
            onSaveLayout={saveBenchLayout}
          />
        )}
        {view === "labs" && (
          <LabsView
            t={t}
            lang={lang}
            completedLabs={completedLabs}
            toggleComplete={toggleComplete}
            resetProgress={resetProgress}
            restoreProgress={restoreProgress}
            activeTrack={activeTrack}
            setActiveTrack={setActiveTrack}
            selectedLabId={selectedLabId}
            setSelectedLabId={setSelectedLabId}
            onOpenCodeTour={openCodeTour}
            onOpenBoard={openBoardById}
          />
        )}
        {view === "flipper" && (
          <FlipperZeroView
            t={t}
            lang={lang}
            initialGuideId={targetFlipperGuideId}
            initialBoardId={targetFlipperBoardId}
            focusNonce={focusNonce}
            onOpenInventory={() => setView("kit")}
          />
        )}
        {view === "boards" && (
          <BoardsLibraryView
            t={t}
            lang={lang}
            selectedBoardId={selectedBoardId}
            onSelectBoard={setSelectedBoardId}
            onOpenIdeasForBoard={openIdeasForBoard}
            onOpenPinout={() => setView("pinout")}
            onOpenBench3D={() => setView("bench3d")}
          />
        )}
        {view === "ideas" && (
          <IdeasView
            t={t}
            lang={lang}
            boardFilter={ideaBoardFilter}
            setBoardFilter={(b) => {
              setIdeaBoardFilter(b);
              setHighlightedIdeaId(null);
            }}
            savedIds={savedIdeaIds}
            toggleSaved={toggleSavedIdea}
            highlightedIdeaId={highlightedIdeaId}
            onOpenBoard={openBoardById}
            onOpenLabCode={openLabByCode}
            onOpenCodeTour={openCodeTour}
          />
        )}
        {view === "pinout" && (
          <PinoutView
            t={t}
            lang={lang}
            initialPinId={targetPinId}
            focusNonce={focusNonce}
            onPinChange={(pin) => setActivePinLabel(pin.label)}
          />
        )}
        {view === "chip" && (
          <ChipAtlasView
            t={t}
            lang={lang}
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
            lang={lang}
            initialTourId={activeTourId}
            onTourChange={(id) => setActiveTourId(id)}
          />
        )}
        {view === "kit" && (
          <KitView
            t={t}
            lang={lang}
            ownedParts={ownedParts}
            setOwnedParts={setOwnedParts}
            customParts={customParts}
            setCustomParts={setCustomParts}
            onOpenLabCode={openLabByCode}
            onOpenIdeaId={openIdeaById}
            onOpenFlipperGuide={openFlipperGuide}
            onOpenFlipperBoard={openFlipperBoard}
            highlightedPartId={targetKitPartId}
            focusNonce={focusNonce}
          />
        )}
      </main>
    </div>
  );
}
