import type { AudienceMode, LabItem, ProjectIdea } from "../types";
import { evaluateDigitalBadges, type DigitalBadge } from "./badges";

export type LearnerBadge = DigitalBadge;

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

export function computeLearnerProgress(
  completedLabIds: string[],
  labs: LabItem[],
  savedIdeaIds: string[],
  playgroundRuns: number,
  solvedQuizIds: string[],
  ownedPartsCount = 0,
  persistedBadgeIds: string[] = [],
): LearnerProgressSummary {
  const summary = evaluateDigitalBadges({
    completedLabIds,
    labs,
    savedIdeaIds,
    playgroundRuns,
    solvedQuizIds,
    ownedPartsCount,
    persistedBadgeIds,
  });

  return {
    xp: summary.xp,
    level: summary.level,
    levelTitleRo: summary.levelTitleRo,
    levelTitleEn: summary.levelTitleEn,
    nextLevelXp: summary.nextLevelXp,
    levelProgressPct: summary.levelProgressPct,
    badges: summary.badges,
    unlockedCount: summary.unlockedCount,
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
