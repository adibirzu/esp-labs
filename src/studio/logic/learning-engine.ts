import type { AudienceMode, LabItem, ProjectIdea } from "../types";

export interface LearnerBadge {
  id: string;
  unlocked: boolean;
  progress: number;
  target: number;
  titleRo: string;
  titleEn: string;
  descRo: string;
  descEn: string;
}

export interface LearnerProgressSummary {
  xp: number;
  level: number;
  levelTitleRo: string;
  levelTitleEn: string;
  nextLevelXp: number;
  levelProgressPct: number;
  badges: LearnerBadge[];
  unlockedCount: number;
}

const LEVELS = [
  { minXp: 0, ro: "Curios la Primul Click", en: "Curious Explorer" },
  { minXp: 150, ro: "Constructor Junior", en: "Junior Builder" },
  { minXp: 400, ro: "Maker Conectat", en: "Connected Maker" },
  { minXp: 800, ro: "Inginer Embedded", en: "Embedded Engineer" },
  { minXp: 1400, ro: "Maestru ESP32", en: "ESP32 Master" },
];

export function computeLearnerProgress(
  completedLabIds: string[],
  labs: LabItem[],
  savedIdeaIds: string[],
  playgroundRuns: number,
  solvedQuizIds: string[],
): LearnerProgressSummary {
  const completedSet = new Set(completedLabIds);
  const completedCount = labs.filter((l) => completedSet.has(l.id)).length;
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

  const countByTrack = (track: LabItem["track"]) =>
    labs.filter((l) => l.track === track && completedSet.has(l.id)).length;

  const introDone = countByTrack("intro");
  const displayDone = countByTrack("display");
  const wirelessDone = countByTrack("wifi") + countByTrack("ble");
  const rfidDone = countByTrack("rfid");
  const soundDone = countByTrack("sound");
  const iotDone = countByTrack("iot");

  const badges: LearnerBadge[] = [
    {
      id: "first-spark",
      unlocked: introDone >= 1 || playgroundRuns >= 1,
      progress: Math.min(1, introDone + (playgroundRuns > 0 ? 1 : 0)),
      target: 1,
      titleRo: "Prima Scânteie",
      titleEn: "First Spark",
      descRo: "Aprinde primul LED în simulator sau finalizează un lab Intro.",
      descEn: "Blink your first LED in the playground or finish an Intro lab.",
    },
    {
      id: "pixel-artist",
      unlocked: displayDone >= 1,
      progress: Math.min(2, displayDone),
      target: 1,
      titleRo: "Artist OLED",
      titleEn: "OLED Pixel Artist",
      descRo: "Finalizează cel puțin un laborator cu ecranul OLED SSD1306.",
      descEn: "Complete at least one SSD1306 OLED display lab.",
    },
    {
      id: "radio-pilot",
      unlocked: wirelessDone >= 2,
      progress: Math.min(2, wirelessDone),
      target: 2,
      titleRo: "Pilot Wireless",
      titleEn: "Wireless Pilot",
      descRo: "Finalizează 2 laboratoare Wi-Fi sau Bluetooth BLE 5.0.",
      descEn: "Complete 2 Wi-Fi or Bluetooth BLE 5.0 labs.",
    },
    {
      id: "sound-dj",
      unlocked: soundDone >= 1,
      progress: Math.min(1, soundDone),
      target: 1,
      titleRo: "Compozitor Chiptune",
      titleEn: "Chiptune Composer",
      descRo: "Creează sunete și melodii în traseul Audio I2S.",
      descEn: "Synthesize tones and melodies in the I2S Sound track.",
    },
    {
      id: "rfid-guardian",
      unlocked: rfidDone >= 1,
      progress: Math.min(1, rfidDone),
      target: 1,
      titleRo: "Gardian RFID",
      titleEn: "RFID Guardian",
      descRo: "Scanează și validează carduri MIFARE cu cititorul MFRC522.",
      descEn: "Scan and authenticate MIFARE cards with the MFRC522 reader.",
    },
    {
      id: "iot-architect",
      unlocked: iotDone >= 1 || solvedQuizIds.length >= 3,
      progress: Math.min(1, iotDone + (solvedQuizIds.length >= 3 ? 1 : 0)),
      target: 1,
      titleRo: "Arhitect IoT",
      titleEn: "IoT Architect",
      descRo: "Stăpânește Deep-Sleep / ESP-NOW sau rezolvă 3 provocări fulger.",
      descEn: "Master Deep-Sleep / ESP-NOW or solve 3 lightning challenges.",
    },
  ];

  return {
    xp,
    level: levelIdx + 1,
    levelTitleRo: LEVELS[levelIdx].ro,
    levelTitleEn: LEVELS[levelIdx].en,
    nextLevelXp: nextCeil,
    levelProgressPct,
    badges,
    unlockedCount: badges.filter((b) => b.unlocked).length,
  };
}

const KIDS_LAB_CODES = ["I1", "D1", "D2", "S1", "S3", "R1", "R4", "B1", "W1", "P1"];
const ADULTS_LAB_CODES = ["I2", "I4", "D3", "W2", "W3", "W4", "P2", "P3", "P4", "B5", "R7", "S6"];

export function getRecommendedLabsForAudience(labs: LabItem[], audience: AudienceMode): LabItem[] {
  const priority = audience === "kids" ? KIDS_LAB_CODES : ADULTS_LAB_CODES;
  const byCode = new Map(labs.map((l) => [l.code, l]));
  const picked: LabItem[] = [];
  for (const code of priority) {
    const found = byCode.get(code);
    if (found) picked.push(found);
  }
  return picked;
}

export function getIdeasForAudience(
  ideas: ProjectIdea[],
  audience: "all" | AudienceMode,
): ProjectIdea[] {
  if (audience === "all") return ideas;
  if (audience === "kids") {
    return ideas.filter(
      (i) =>
        i.difficulty === "Beginner" ||
        i.id === "idea-pocket-chiptune-synth" ||
        i.id === "idea-espnow-rover",
    );
  }
  return ideas.filter((i) => i.difficulty !== "Beginner" || i.id === "idea-solar-weather-station");
}
