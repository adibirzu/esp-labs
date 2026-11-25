import type { LabItem, TrackId, ViewId } from "../types";

export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";

export type BadgeIconId =
  | "sparkles"
  | "wrench"
  | "code"
  | "monitor"
  | "wifi"
  | "music"
  | "shield"
  | "compass"
  | "crown";

export interface DigitalBadge {
  id: string;
  tier: BadgeTier;
  icon: BadgeIconId;
  unlocked: boolean;
  progress: number;
  target: number;
  progressPct: number;
  xpReward: number;
  titleEn: string;
  titleRo: string;
  descEn: string;
  descRo: string;
  criteriaEn: string;
  criteriaRo: string;
  actionView: ViewId;
  actionTrack?: TrackId;
}

export interface BadgeEvaluationInput {
  completedLabIds: string[];
  labs: LabItem[];
  savedIdeaIds: string[];
  playgroundRuns: number;
  solvedQuizIds: string[];
  ownedPartsCount?: number;
  persistedBadgeIds?: string[];
}

export interface DigitalBadgeSummary {
  xp: number;
  level: number;
  levelTitleEn: string;
  levelTitleRo: string;
  nextLevelXp: number;
  levelProgressPct: number;
  badges: DigitalBadge[];
  unlockedCount: number;
  unlockedIds: string[];
  nextRecommendedBadge: DigitalBadge | null;
}

const LEVELS = [
  { minXp: 0, en: "Curious Explorer", ro: "Curios la Primul Click" },
  { minXp: 150, en: "Junior Builder", ro: "Constructor Junior" },
  { minXp: 400, en: "Connected Maker", ro: "Maker Conectat" },
  { minXp: 800, en: "Embedded Engineer", ro: "Inginer Embedded" },
  { minXp: 1400, en: "ESP32 Master", ro: "Maestru ESP32" },
];

function pct(progress: number, target: number): number {
  if (target <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((progress / target) * 100)));
}

export function evaluateDigitalBadges(input: BadgeEvaluationInput): DigitalBadgeSummary {
  const {
    completedLabIds,
    labs,
    savedIdeaIds,
    playgroundRuns,
    solvedQuizIds,
    ownedPartsCount = 0,
    persistedBadgeIds = [],
  } = input;

  const completedSet = new Set(completedLabIds);
  const persistedSet = new Set(persistedBadgeIds);
  const completedLabs = labs.filter((l) => completedSet.has(l.id));
  const completedCount = completedLabs.length;

  const countByTrack = (track: TrackId) =>
    completedLabs.filter((l) => l.track === track).length;

  const introDone = countByTrack("intro");
  const displayDone = countByTrack("display");
  const wirelessDone = countByTrack("wifi") + countByTrack("ble");
  const soundDone = countByTrack("sound");
  const rfidDone = countByTrack("rfid");
  const iotDone = countByTrack("iot");

  const distinctTracks = new Set(completedLabs.map((l) => l.track)).size;
  const intermediatePlusDone = completedLabs.filter(
    (l) => l.difficulty === "Intermediate" || l.difficulty === "Advanced",
  ).length;

  const makeBadge = (
    cfg: Omit<DigitalBadge, "unlocked" | "progress" | "progressPct"> & {
      rawUnlocked: boolean;
      rawProgress: number;
    },
  ): DigitalBadge => {
    const unlocked = cfg.rawUnlocked || persistedSet.has(cfg.id);
    const progress = unlocked ? cfg.target : Math.min(cfg.target, Math.max(0, cfg.rawProgress));
    return {
      id: cfg.id,
      tier: cfg.tier,
      icon: cfg.icon,
      unlocked,
      progress,
      target: cfg.target,
      progressPct: pct(progress, cfg.target),
      xpReward: cfg.xpReward,
      titleEn: cfg.titleEn,
      titleRo: cfg.titleRo,
      descEn: cfg.descEn,
      descRo: cfg.descRo,
      criteriaEn: cfg.criteriaEn,
      criteriaRo: cfg.criteriaRo,
      actionView: cfg.actionView,
      actionTrack: cfg.actionTrack,
    };
  };

  // Soldering Master: 4 labs across >= 3 tracks, OR own >= 5 parts + 3 labs
  const solderingUnlocked =
    (completedCount >= 4 && distinctTracks >= 3) ||
    (ownedPartsCount >= 5 && completedCount >= 3);
  const solderingProgress = Math.min(4, completedCount);

  // Code Whisperer: 3+ live playground code runs OR 3+ Intermediate/Advanced labs
  const codeWhispererUnlocked = playgroundRuns >= 3 || intermediatePlusDone >= 3;
  const codeWhispererProgress = Math.max(playgroundRuns, intermediatePlusDone);

  // ESP32 Grandmaster: 10+ labs + (IoT lab or 3 quizzes)
  const grandmasterUnlocked =
    completedCount >= 10 && (iotDone >= 1 || solvedQuizIds.length >= 3);

  const badges: DigitalBadge[] = [
    makeBadge({
      id: "esp-rookie",
      tier: "bronze",
      icon: "sparkles",
      rawUnlocked: introDone >= 1 || playgroundRuns >= 1,
      rawProgress: introDone + (playgroundRuns > 0 ? 1 : 0),
      target: 1,
      xpReward: 50,
      titleEn: "ESP Rookie",
      titleRo: "Începător ESP",
      descEn: "Powered up your first ESP32 circuit and took the first step into embedded hardware.",
      descRo: "Ai pornit primul circuit ESP32 și ai făcut primul pas în electronică embedded.",
      criteriaEn: "Complete 1 Intro lab or run a sketch in the Interactive Studio.",
      criteriaRo: "Finalizează 1 laborator Intro sau rulează un cod în Studioul Interactiv.",
      actionView: "labs",
      actionTrack: "intro",
    }),
    makeBadge({
      id: "soldering-master",
      tier: "gold",
      icon: "wrench",
      rawUnlocked: solderingUnlocked,
      rawProgress: solderingProgress,
      target: 4,
      xpReward: 150,
      titleEn: "Soldering Master",
      titleRo: "Maestru Lipituri",
      descEn: "Confidently wired multi-bus hardware builds across displays, sensors, and radios.",
      descRo: "Ai cablat cu precizie circuite pe magistrale multiple: ecrane, senzori și radio.",
      criteriaEn: "Complete 4 labs across 3+ tracks, or complete 3 labs with 5+ parts in Inventory.",
      criteriaRo: "Finalizează 4 lab-uri din 3+ categorii sau 3 lab-uri cu 5+ piese în Inventar.",
      actionView: "labs",
    }),
    makeBadge({
      id: "code-whisperer",
      tier: "gold",
      icon: "code",
      rawUnlocked: codeWhispererUnlocked,
      rawProgress: codeWhispererProgress,
      target: 3,
      xpReward: 120,
      titleEn: "Code Whisperer",
      titleRo: "Șoptitor de Cod",
      descEn: "Flashed live sketches and tamed firmware logic like a seasoned embedded developer.",
      descRo: "Ai rulat cod live și ai stăpânit logica firmware ca un programator embedded.",
      criteriaEn: "Run 3 live sketches in the 3D/Home Studio or finish 3 Intermediate/Advanced labs.",
      criteriaRo: "Rulează 3 coduri live în Studioul 3D sau finalizează 3 lab-uri Intermediare/Avansate.",
      actionView: "home",
    }),
    makeBadge({
      id: "oled-artisan",
      tier: "bronze",
      icon: "monitor",
      rawUnlocked: displayDone >= 1,
      rawProgress: displayDone,
      target: 1,
      xpReward: 60,
      titleEn: "OLED Pixel Artisan",
      titleRo: "Artist OLED",
      descEn: "Brought monochrome 128×64 pixels and I2C graphics to life on SSD1306.",
      descRo: "Ai adus la viață pixelii monocromi 128×64 și grafica I2C pe SSD1306.",
      criteriaEn: "Complete at least 1 OLED Display lab.",
      criteriaRo: "Finalizează cel puțin 1 laborator din traseul Ecrane OLED.",
      actionView: "labs",
      actionTrack: "display",
    }),
    makeBadge({
      id: "wireless-pilot",
      tier: "silver",
      icon: "wifi",
      rawUnlocked: wirelessDone >= 2,
      rawProgress: wirelessDone,
      target: 2,
      xpReward: 100,
      titleEn: "Wireless Pilot",
      titleRo: "Pilot Wireless",
      descEn: "Cut the wires by commanding Wi-Fi sockets and Bluetooth BLE 5.0 packets.",
      descRo: "Ai eliminat cablurile controlând conexiuni Wi-Fi și pachete Bluetooth BLE 5.0.",
      criteriaEn: "Complete 2 labs in Wi-Fi or Bluetooth BLE 5.0.",
      criteriaRo: "Finalizează 2 laboratoare din Wi-Fi sau Bluetooth BLE 5.0.",
      actionView: "labs",
      actionTrack: "wifi",
    }),
    makeBadge({
      id: "chiptune-composer",
      tier: "silver",
      icon: "music",
      rawUnlocked: soundDone >= 1,
      rawProgress: soundDone,
      target: 1,
      xpReward: 80,
      titleEn: "Chiptune Composer",
      titleRo: "Compozitor Chiptune",
      descEn: "Synthesized retro tones and digital PCM waveforms over I2S audio.",
      descRo: "Ai sintetizat tonuri retro și forme de undă PCM digitale prin audio I2S.",
      criteriaEn: "Complete at least 1 I2S Sound & Audio lab.",
      criteriaRo: "Finalizează cel puțin 1 laborator din traseul Sunet I2S.",
      actionView: "labs",
      actionTrack: "sound",
    }),
    makeBadge({
      id: "rfid-guardian",
      tier: "silver",
      icon: "shield",
      rawUnlocked: rfidDone >= 1,
      rawProgress: rfidDone,
      target: 1,
      xpReward: 80,
      titleEn: "RFID Guardian",
      titleRo: "Gardian RFID",
      descEn: "Authenticated 13.56 MHz MIFARE cards and tags over the SPI bus.",
      descRo: "Ai autentificat carduri și tag-uri MIFARE 13.56 MHz pe magistrala SPI.",
      criteriaEn: "Complete at least 1 MFRC522 RFID lab.",
      criteriaRo: "Finalizează cel puțin 1 laborator din traseul RFID MFRC522.",
      actionView: "labs",
      actionTrack: "rfid",
    }),
    makeBadge({
      id: "project-architect",
      tier: "silver",
      icon: "compass",
      rawUnlocked: savedIdeaIds.length >= 3,
      rawProgress: savedIdeaIds.length,
      target: 3,
      xpReward: 90,
      titleEn: "Project Architect",
      titleRo: "Arhitect de Proiecte",
      descEn: "Curated a full maker build queue of real-world ESP32 blueprints.",
      descRo: "Ai pregătit o colecție solidă de proiecte practice ESP32 gata de construit.",
      criteriaEn: "Save 3 project blueprints in Project Ideas.",
      criteriaRo: "Salvează 3 idei de proiecte în secțiunea Idei Proiecte.",
      actionView: "ideas",
    }),
    makeBadge({
      id: "esp32-grandmaster",
      tier: "platinum",
      icon: "crown",
      rawUnlocked: grandmasterUnlocked,
      rawProgress: completedCount,
      target: 10,
      xpReward: 250,
      titleEn: "ESP32 Grandmaster",
      titleRo: "Mare Maestru ESP32",
      descEn: "Elite hardware hacker who conquered labs, low-power IoT, and lightning quizzes.",
      descRo: "Maker de elită care a cucerit laboratoarele, IoT de consum redus și provocările fulger.",
      criteriaEn: "Complete 10+ labs and either 1 IoT lab or 3 Lightning Quiz challenges.",
      criteriaRo: "Finalizează 10+ lab-uri plus 1 lab IoT sau 3 provocări fulger.",
      actionView: "labs",
      actionTrack: "iot",
    }),
  ];

  const unlockedBadges = badges.filter((b) => b.unlocked);
  const xp =
    completedCount * 50 +
    Math.min(savedIdeaIds.length, 10) * 15 +
    Math.min(playgroundRuns, 10) * 20 +
    solvedQuizIds.length * 35;

  let levelIdx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].minXp) levelIdx = i;
  }

  const currentFloor = LEVELS[levelIdx].minXp;
  const nextCeil = LEVELS[levelIdx + 1]?.minXp ?? currentFloor + 400;
  const span = Math.max(1, nextCeil - currentFloor);
  const levelProgressPct =
    levelIdx === LEVELS.length - 1
      ? 100
      : Math.min(100, Math.round(((xp - currentFloor) / span) * 100));

  const nextRecommendedBadge =
    badges
      .filter((b) => !b.unlocked)
      .sort((a, b) => b.progressPct - a.progressPct)[0] ?? null;

  return {
    xp,
    level: levelIdx + 1,
    levelTitleEn: LEVELS[levelIdx].en,
    levelTitleRo: LEVELS[levelIdx].ro,
    nextLevelXp: nextCeil,
    levelProgressPct,
    badges,
    unlockedCount: unlockedBadges.length,
    unlockedIds: unlockedBadges.map((b) => b.id),
    nextRecommendedBadge,
  };
}

export function findNewlyUnlockedBadges(
  previousUnlockedIds: string[],
  currentBadges: DigitalBadge[],
): DigitalBadge[] {
  const prev = new Set(previousUnlockedIds);
  return currentBadges.filter((b) => b.unlocked && !prev.has(b.id));
}
