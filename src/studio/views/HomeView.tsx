import { useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Award,
  Box,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircuitBoard,
  Cpu,
  Layers,
  Package,
  Radio,
  Sparkles,
  Wrench,
} from "lucide-react";
import { ConfettiBurst, type ConfettiBurstEvent } from "../components/ConfettiBurst";
import { InteractiveEspPlayground } from "../components/InteractiveEspPlayground";
import { PROJECT_IDEAS } from "../data/ideas";
import { LABS } from "../data/labs";
import { localizeIdea, localizeLab } from "../data/ro-overrides";
import type { Translations } from "../i18n";
import {
  computeLearnerProgress,
  getIdeasForAudience,
  getRecommendedLabsForAudience,
} from "../logic/learning-engine";
import type { AudienceMode, Lang, ViewId } from "../types";

interface HomeViewProps {
  t: Translations;
  lang: Lang;
  audienceMode: AudienceMode;
  setAudienceMode: (mode: AudienceMode) => void;
  completedLabs: string[];
  savedIdeaIds: string[];
  playgroundRuns: number;
  solvedQuizIds: string[];
  onRunPlayground: () => void;
  onSolveQuiz: (quizId: string) => void;
  onNavigate: (view: ViewId) => void;
  onOpenLabId: (labId: string) => void;
  onOpenIdeaId: (ideaId: string) => void;
}

interface QuizQuestion {
  id: string;
  question: { en: string; ro: string };
  options: { en: string[]; ro: string[] };
  correctIndex: number;
  hint: { en: string; ro: string };
}

const LIGHTNING_QUIZ: QuizQuestion[] = [
  {
    id: "q-voltage",
    question: {
      en: "What voltage do ESP32-S3 and Flipper Zero GPIO logic pins use?",
      ro: "Ce tensiune logică folosesc pinii GPIO pe ESP32-S3 și Flipper Zero?",
    },
    options: {
      en: ["3.3 V logic", "12 V automotive", "9 V battery direct", "24 V industrial"],
      ro: ["Logică de 3.3 V", "12 V auto", "9 V direct din baterie", "24 V industrial"],
    },
    correctIndex: 0,
    hint: {
      en: "Both ESP32 and STM32WB55 operate at 3.3V — applying 5V+ directly to a 3.3V-only module like MFRC522 or CC1101 can damage it.",
      ro: "Atât ESP32 cât și STM32WB55 lucrează la 3.3V — aplicarea a 5V direct pe module precum MFRC522 sau CC1101 le poate defecta.",
    },
  },
  {
    id: "q-rgb",
    question: {
      en: "Which GPIO drives the onboard WS2812 RGB LED on ESP32-S3-DevKitC-1 v1.1?",
      ro: "Care pin GPIO controlează LED-ul RGB WS2812 de pe ESP32-S3-DevKitC-1 v1.1?",
    },
    options: {
      en: ["GPIO48", "GPIO35", "GPIO0", "GPIO1"],
      ro: ["GPIO48", "GPIO35", "GPIO0", "GPIO1"],
    },
    correctIndex: 0,
    hint: {
      en: "Look at the RGB LED hotspot on the interactive workbench above — GPIO48 sends the RMT color signal!",
      ro: "Verifică zona LED RGB de pe bancul interactiv de mai sus — GPIO48 trimite semnalul de culoare prin RMT!",
    },
  },
  {
    id: "q-flipper-wifi",
    question: {
      en: "Why do makers connect an ESP32 board to Flipper Zero's UART pins (13 & 14)?",
      ro: "De ce conectează makerii o placă ESP32 la pinii UART (13 și 14) ai Flipper Zero?",
    },
    options: {
      en: [
        "Flipper Zero has no built-in Wi-Fi, so ESP32 adds Wi-Fi / Marauder / GhostESP",
        "To charge Flipper's battery faster",
        "To add a 125 kHz RFID antenna",
        "To replace Flipper's LCD screen",
      ],
      ro: [
        "Flipper Zero nu are Wi-Fi integrat, iar ESP32 adaugă Wi-Fi / Marauder / GhostESP",
        "Pentru încărcare rapidă a bateriei",
        "Pentru a adăuga o antenă RFID 125 kHz",
        "Pentru a înlocui ecranul LCD",
      ],
    },
    correctIndex: 0,
    hint: {
      en: "Flipper has Sub-GHz, NFC, RFID, IR, and BLE built in — adding an ESP32 over UART brings 2.4 GHz Wi-Fi capabilities.",
      ro: "Flipper are deja Sub-GHz, NFC, RFID, IR și BLE — conectarea unui ESP32 pe UART aduce conectivitate Wi-Fi 2.4 GHz.",
    },
  },
  {
    id: "q-i2c",
    question: {
      en: "How many signal wires does an I2C OLED display or BME280 sensor need (besides power & GND)?",
      ro: "De câte fire de semnal are nevoie un ecran OLED sau un senzor BME280 pe I2C (pe lângă alimentare și GND)?",
    },
    options: {
      en: ["2 wires (SDA + SCL)", "8 parallel wires", "1 analog wire", "6 SPI wires"],
      ro: ["2 fire (SDA + SCL)", "8 fire paralele", "1 fir analogic", "6 fire SPI"],
    },
    correctIndex: 0,
    hint: {
      en: "I2C uses just two shared lines: Serial Data (SDA) and Serial Clock (SCL), so multiple sensors share the same bus!",
      ro: "Magistrala I2C folosește doar două fire partajate: SDA (date) și SCL (ceas), permițând mai multor senzori să stea pe aceiași pini!",
    },
  },
  {
    id: "q-psram",
    question: {
      en: "Why should you avoid using GPIO35, 36, and 37 on ESP32-S3 N8R8 / N16R8 boards?",
      ro: "De ce trebuie să eviți pinii GPIO35, 36 și 37 pe plăcile ESP32-S3 N8R8 / N16R8?",
    },
    options: {
      en: [
        "They are internally connected to Octal PSRAM memory",
        "They output 12V AC",
        "They are only for audio speakers",
        "They disable the USB-C port",
      ],
      ro: [
        "Sunt conectați intern la memoria Octal PSRAM",
        "Scot tensiune de 12V AC",
        "Sunt doar pentru difuzoare audio",
        "Dezactivează portul USB-C",
      ],
    },
    correctIndex: 0,
    hint: {
      en: "The 'R8' in N8R8 stands for 8 MB Octal PSRAM, which claims GPIO35–37 internally.",
      ro: "Notația „R8” din N8R8 înseamnă 8 MB Octal PSRAM, care ocupă intern pinii GPIO35–37.",
    },
  },
];

export function HomeView({
  t,
  lang,
  audienceMode,
  setAudienceMode,
  completedLabs,
  savedIdeaIds,
  playgroundRuns,
  solvedQuizIds,
  onRunPlayground,
  onSolveQuiz,
  onNavigate,
  onOpenLabId,
  onOpenIdeaId,
}: HomeViewProps) {
  const [quizIdx, setQuizIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [confettiBurst, setConfettiBurst] = useState<ConfettiBurstEvent | null>(null);
  const [ideaFilter, setIdeaFilter] = useState<"all" | "kids" | "adults">("all");
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const learner = useMemo(
    () =>
      computeLearnerProgress(
        completedLabs,
        LABS,
        savedIdeaIds,
        playgroundRuns,
        solvedQuizIds,
      ),
    [completedLabs, savedIdeaIds, playgroundRuns, solvedQuizIds],
  );

  const recommendedLabs = useMemo(
    () => getRecommendedLabsForAudience(LABS, audienceMode),
    [audienceMode],
  );

  const showcasedIdeas = useMemo(() => {
    if (ideaFilter === "all") return PROJECT_IDEAS.slice(0, 6);
    return getIdeasForAudience(PROJECT_IDEAS, ideaFilter).slice(0, 6);
  }, [ideaFilter]);

  const currentQuestion = LIGHTNING_QUIZ[quizIdx];
  const alreadySolved = solvedQuizIds.includes(currentQuestion.id);

  const handleSelectQuizAnswer = (optIdx: number) => {
    setSelectedOption(optIdx);
    if (optIdx === currentQuestion.correctIndex) {
      if (!alreadySolved) {
        onSolveQuiz(currentQuestion.id);
      }
      setConfettiBurst({
        id: Date.now() + Math.random(),
        x: Math.round(window.innerWidth * 0.65),
        y: Math.round(window.innerHeight * 0.45),
      });
    }
  };

  const handleNextQuestion = () => {
    setQuizIdx((prev) => (prev + 1) % LIGHTNING_QUIZ.length);
    setSelectedOption(null);
  };

  const scrollCarousel = (dir: -1 | 1) => {
    carouselRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <div className="space-y-10">
      <ConfettiBurst burst={confettiBurst} />

      {/* 1. Hero Section + Flexible Kids / Adults Learning Switcher */}
      <section
        className={`rounded-2xl border p-6 sm:p-8 space-y-6 transition-colors ${
          audienceMode === "kids"
            ? "border-sky-300 dark:border-sky-800/80 bg-gradient-to-br from-white via-sky-50/50 to-amber-50/40 dark:from-slate-900/90 dark:via-[#0b1628] dark:to-slate-900/80"
            : "border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0a0f18]"
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div
              className={`text-xs font-mono font-semibold ${
                audienceMode === "kids"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-cyan-600 dark:text-cyan-400"
              }`}
            >
              {audienceMode === "kids"
                ? lang === "ro"
                  ? "Mod Explorator Junior · Stil learn-esp32 · Misiuni Interactive"
                  : "Junior Explorer Mode · learn-esp32 Style · Interactive Missions"
                : lang === "ro"
                  ? "Mod Inginer · Foto Macro Real + Banc 3D + Espressif Schematic Checklist"
                  : "Engineer Mode · Real Macro Hardware + 3D Bench + Espressif Checklist"}
            </div>
            <h1
              className="text-3xl sm:text-4xl font-bold tracking-tight text-balance leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t.home.heroTitle}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              {t.home.heroSub}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onNavigate("bench3d")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                <Box className="w-4 h-4" />
                <span>{lang === "ro" ? "Deschide Banc 3D" : "Open 3D Bench"}</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenLabId("intro-1")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-500 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>{t.home.ctaStartLabs}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate("flipper")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-500 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                <Radio className="w-4 h-4 text-amber-500" />
                <span>{t.nav.flipper}</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("kit")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-500 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                <Package className="w-4 h-4 text-emerald-500" />
                <span>{t.nav.kit}</span>
              </button>
            </div>
          </div>

          {/* Learning Mode Switcher Card */}
          <div className="lg:col-span-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {t.home.modeLabel}
              </span>
              <span className="font-mono tabular-nums">
                {completedLabs.length}/{LABS.length} {t.completed}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setAudienceMode("kids")}
                className={`text-left px-3.5 py-2.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  audienceMode === "kids"
                    ? "bg-amber-500 text-slate-950 border-amber-500"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-500"
                }`}
              >
                {t.home.modeKids}
              </button>
              <button
                type="button"
                onClick={() => setAudienceMode("adults")}
                className={`text-left px-3.5 py-2.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  audienceMode === "adults"
                    ? "bg-cyan-600 text-white border-cyan-600"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-cyan-500"
                }`}
              >
                {t.home.modeAdults}
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {audienceMode === "kids" ? t.home.modeKidsHint : t.home.modeAdultsHint}
            </p>
          </div>
        </div>
      </section>

      {/* 2. Interactive ESP32-S3 Workbench (Kids = Illustrated learn-esp32 | Adults = Real Photo Deconstructed) */}
      <InteractiveEspPlayground
        t={t}
        lang={lang}
        audienceMode={audienceMode}
        onRunSketch={onRunPlayground}
        onOpenBench3D={() => onNavigate("bench3d")}
      />

      {/* 3. Missions, XP, Badges & Lightning Quiz (Engagement for Kids & Adults) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Level, XP & 6 Unlockable Badges */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                {t.home.badgesTitle}
              </h2>
              <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
                {t.home.levelLabel} {learner.level} · {learner.xp} {t.home.xpLabel}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {lang === "ro" ? learner.levelTitleRo : learner.levelTitleEn}
                </span>
                <span className="font-mono tabular-nums">
                  {learner.unlockedCount}/{learner.badges.length} {t.home.unlockedBadges}
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(8, learner.levelProgressPct)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {learner.badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-3 rounded-xl border text-xs space-y-1 transition-colors ${
                  badge.unlocked
                    ? "bg-emerald-500/10 border-emerald-500/40 text-slate-900 dark:text-slate-100"
                    : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 opacity-90"
                }`}
              >
                <div className="flex items-center justify-between gap-1 font-semibold">
                  <span className="truncate">{lang === "ro" ? badge.titleRo : badge.titleEn}</span>
                  {badge.unlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                </div>
                <p className="text-[11px] leading-snug opacity-90">
                  {lang === "ro" ? badge.descRo : badge.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Interactive Lightning Hardware Challenge Quiz */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-500" />
                {t.home.quizTitle}
              </h2>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                {quizIdx + 1} / {LIGHTNING_QUIZ.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.home.quizSub}</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold leading-snug">{currentQuestion.question[lang]}</p>
            <div className="grid grid-cols-1 gap-2">
              {currentQuestion.options[lang].map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isRight = idx === currentQuestion.correctIndex;
                let style =
                  "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 hover:border-cyan-500";
                if (selectedOption !== null) {
                  if (isRight) {
                    style = "border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 font-semibold";
                  } else if (isSelected) {
                    style = "border-rose-500 bg-rose-500/15 text-rose-800 dark:text-rose-200";
                  }
                }
                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => handleSelectQuizAnswer(idx)}
                    className={`text-left px-3.5 py-2.5 rounded-lg border text-xs transition-colors cursor-pointer ${style}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {selectedOption !== null && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div
                  className={`font-semibold ${
                    selectedOption === currentQuestion.correctIndex
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {selectedOption === currentQuestion.correctIndex
                    ? t.home.quizCorrect
                    : t.home.quizWrong}
                </div>
                <p className="text-slate-600 dark:text-slate-400">{currentQuestion.hint[lang]}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              {solvedQuizIds.length}/{LIGHTNING_QUIZ.length} {t.completed}
            </span>
            <button
              type="button"
              onClick={handleNextQuestion}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-cyan-600 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>{t.home.quizNext}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. Inside ESP-Labs Studio — Asymmetric Bento Showcase */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{t.home.pillarsTitle}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t.home.pillarsSub}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <button
            type="button"
            onClick={() => onNavigate("labs")}
            className="md:col-span-3 text-left p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-cyan-500 transition-colors cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between text-xs font-mono text-cyan-600 dark:text-cyan-400">
              <span>01 · {t.nav.labs}</span>
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold">
              {lang === "ro"
                ? "40 Laboratoare & Simulatoare Hardware Live"
                : "40 Hands-On Labs & Live Hardware Simulators"}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === "ro"
                ? "Osciloscop audio Web Audio, ecran OLED 128×64, tag-uri RFID MFRC522, BLE 5.0 GATT, analizor logic pe 4 canale și monitor serial UART."
                : "Web Audio synth & oscilloscope, 128×64 OLED canvas, MFRC522 RFID tags, BLE 5.0 GATT, 4-channel logic analyzer, and interactive UART monitor."}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("flipper")}
            className="md:col-span-3 text-left p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-amber-500 transition-colors cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between text-xs font-mono text-amber-600 dark:text-amber-400">
              <span>02 · {t.nav.flipper}</span>
              <Radio className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold">
              {lang === "ro"
                ? "Flipper Zero, Plăci GPIO Reddit & Ghiduri DIY"
                : "Flipper Zero, Reddit GPIO Boards & Step-by-Step Guides"}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === "ro"
                ? "Explorator 18 pini GPIO, Wi-Fi Devboard, Video Game Module RP2040, Rabbit Labs, JCMK, plăci 3-în-1 și ghiduri pas cu pas + video."
                : "Interactive 18-pin GPIO explorer, Wi-Fi Devboard, RP2040 Video Game Module, Rabbit Labs, JCMK, 3-in-1 boards, DIY ESP32 builds & top videos."}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("kit")}
            className="md:col-span-2 text-left p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-emerald-500 transition-colors cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between text-xs font-mono text-emerald-600 dark:text-emerald-400">
              <span>03 · {t.nav.kit}</span>
              <Package className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold">
              {lang === "ro"
                ? "Inventar Avansat & Recomandări"
                : "Smart Inventory & Project Matcher"}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {lang === "ro"
                ? "Spune-ne ce piese ai acasă și afli imediat ce poți construi și ce piesă lipsă are cel mai mare impact."
                : "Check off your parts to see ready-to-build projects and highest-impact upgrade parts."}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("boards")}
            className="md:col-span-2 text-left p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-cyan-500 transition-colors cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between text-xs font-mono text-cyan-600 dark:text-cyan-400">
              <span>04 · {t.nav.boards}</span>
              <CircuitBoard className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold">
              {lang === "ro"
                ? "8 Plăci Espressif la Scară (mm)"
                : "8 Official Espressif Boards (mm)"}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {lang === "ro"
                ? "Dimensiuni exacte, comparație paralelă și linkuri directe la fișe tehnice și TRM."
                : "To-scale footprints, side-by-side comparisons, and direct official datasheets."}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("chip")}
            className="md:col-span-2 text-left p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-cyan-500 transition-colors cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between text-xs font-mono text-violet-600 dark:text-violet-400">
              <span>05 · {t.nav.pinout} & {t.nav.chip}</span>
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold">
              {lang === "ro"
                ? "Pinout 44-Pini, Registre & Cod C"
                : "44-Pin Checker, 32-Bit Regs & C Tours"}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {lang === "ro"
                ? "Detectare automată conflicte GPIO, explorator de biți pe registre și calculator autonomie LiPo."
                : "Automatic GPIO collision detection, clickable register bits, and LiPo battery math."}
            </p>
          </button>
        </div>
      </section>

      {/* 5. Featured Project Ideas for Home & Classroom */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight">{t.home.ideasShowcaseTitle}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {t.home.ideasShowcaseSub}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80">
              {(
                [
                  { id: "all", label: t.home.audienceAll },
                  { id: "kids", label: t.home.audienceKids },
                  { id: "adults", label: t.home.audienceAdults },
                ] as const
              ).map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setIdeaFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    ideaFilter === tab.id
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onNavigate("ideas")}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer whitespace-nowrap"
            >
              {t.home.viewAllIdeas}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {showcasedIdeas.map((rawIdea) => {
            const idea = localizeIdea(rawIdea, lang);
            return (
              <div
                key={idea.id}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                      {t.ideaCategories[rawIdea.category]}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{t.difficulties[rawIdea.difficulty]}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{rawIdea.buildTime}</span>
                  </div>
                  <h3 className="text-base font-bold leading-snug">{idea.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {idea.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-slate-500 truncate">
                    {idea.buses.slice(0, 2).join(" · ")}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenIdeaId(idea.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer whitespace-nowrap"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    {t.buildBlueprint}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Quick-Start Lessons Horizontal Carousel (learn-esp32 bottom strip style) */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight">{t.home.quickLessonsTitle}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {t.home.quickLessonsSub}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollCarousel(-1)}
              aria-label={t.home.scrollLeft}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-cyan-500 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel(1)}
              aria-label={t.home.scrollRight}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-cyan-500 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={carouselRef}
          className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
        >
          {recommendedLabs.map((rawLab) => {
            const lab = localizeLab(rawLab, lang);
            const done = completedLabs.includes(rawLab.id);
            return (
              <button
                type="button"
                key={rawLab.id}
                onClick={() => onOpenLabId(rawLab.id)}
                className="snap-start shrink-0 w-72 text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-cyan-500 transition-colors cursor-pointer flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">{rawLab.code}</span>
                    <span className="text-slate-500">
                      {t.difficulties[rawLab.difficulty]} · {rawLab.duration}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold leading-snug">{lab.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {lab.summary}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className={done ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-500"}>
                    {done ? t.completedBadge : `${rawLab.wiring.length} ${t.wiresLabel}`}
                  </span>
                  <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                    {t.openLab} →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
