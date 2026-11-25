import { FLIPPER_BOARDS, FLIPPER_GUIDES, pickText } from "../data/flipper";
import {
  IDEA_REQUIRED_PARTS,
  INVENTORY_PARTS,
  TRACK_REQUIRED_PARTS,
  type InventoryPart,
} from "../data/inventory";
import { PROJECT_IDEAS } from "../data/ideas";
import { LABS } from "../data/labs";
import { localizeIdea, localizeLab } from "../data/ro-overrides";
import type { Lang } from "../types";

export type RecommendationKind = "idea" | "flipper-guide" | "flipper-board" | "lab";

export interface InventoryRecommendation {
  id: string;
  targetId: string;
  kind: RecommendationKind;
  title: string;
  subtitle: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  requiredPartIds: string[];
  ownedPartIds: string[];
  missingPartIds: string[];
  matchPercent: number;
  status: "ready" | "almost" | "partial";
  labCode?: string;
}

export interface UpgradeImpactItem {
  part: InventoryPart;
  unlocksReadyCount: number;
  helpsCount: number;
  unlockedTitles: string[];
}

export interface InventoryMatchReport {
  ready: InventoryRecommendation[];
  almostReady: InventoryRecommendation[];
  upgradeImpact: UpgradeImpactItem[];
  ownedCount: number;
  totalCatalogCount: number;
}

const KNOWN_PART_IDS = new Set(INVENTORY_PARTS.map((p) => p.id));

/**
 * Normalizes board compatibility: owning ANY ESP32 board (S3, C6, C3, S2) satisfies
 * generic ESP32 board requirements for beginner labs/ideas when exact SoC isn't strictly unique.
 */
function hasPartOrCompatible(ownedSet: Set<string>, reqId: string): boolean {
  if (ownedSet.has(reqId)) return true;
  if (reqId === "esp32-c3-devkit" && (ownedSet.has("esp32-s3-devkit") || ownedSet.has("esp32-c6-devkit"))) {
    return true;
  }
  return false;
}

function evaluateItem(
  ownedSet: Set<string>,
  requiredPartIds: string[],
): {
  ownedPartIds: string[];
  missingPartIds: string[];
  matchPercent: number;
  status: "ready" | "almost" | "partial";
} {
  const uniqueReq = Array.from(new Set(requiredPartIds.filter((id) => KNOWN_PART_IDS.has(id))));
  if (uniqueReq.length === 0) {
    return { ownedPartIds: [], missingPartIds: [], matchPercent: 100, status: "ready" };
  }
  const ownedPartIds = uniqueReq.filter((id) => hasPartOrCompatible(ownedSet, id));
  const missingPartIds = uniqueReq.filter((id) => !hasPartOrCompatible(ownedSet, id));
  const matchPercent = Math.round((ownedPartIds.length / uniqueReq.length) * 100);
  const status: "ready" | "almost" | "partial" =
    missingPartIds.length === 0
      ? "ready"
      : missingPartIds.length <= 2 && ownedPartIds.length > 0
        ? "almost"
        : "partial";

  return { ownedPartIds, missingPartIds, matchPercent, status };
}

export function buildInventoryRecommendations(
  ownedQuantities: Record<string, number>,
  lang: Lang,
): InventoryMatchReport {
  const ownedSet = new Set(
    Object.entries(ownedQuantities)
      .filter(([id, qty]) => KNOWN_PART_IDS.has(id) && qty > 0)
      .map(([id]) => id),
  );

  const allItems: InventoryRecommendation[] = [];

  // 1. Project Ideas
  for (const rawIdea of PROJECT_IDEAS) {
    const idea = localizeIdea(rawIdea, lang);
    const req = IDEA_REQUIRED_PARTS[rawIdea.id] ?? ["esp32-s3-devkit"];
    const res = evaluateItem(ownedSet, req);
    allItems.push({
      id: `idea:${rawIdea.id}`,
      targetId: rawIdea.id,
      kind: "idea",
      title: idea.title,
      subtitle: idea.summary,
      difficulty: rawIdea.difficulty,
      requiredPartIds: req,
      ...res,
    });
  }

  // 2. Flipper Zero Step-by-Step Guides
  for (const guide of FLIPPER_GUIDES) {
    const res = evaluateItem(ownedSet, guide.requiredPartIds);
    allItems.push({
      id: `flipper-guide:${guide.id}`,
      targetId: guide.id,
      kind: "flipper-guide",
      title: pickText(guide.title, lang),
      subtitle: pickText(guide.summary, lang),
      difficulty: guide.difficulty,
      requiredPartIds: guide.requiredPartIds,
      ...res,
    });
  }

  // 3. Flipper Zero Boards / Builds
  for (const board of FLIPPER_BOARDS) {
    const res = evaluateItem(ownedSet, board.requiredPartIds);
    allItems.push({
      id: `flipper-board:${board.id}`,
      targetId: board.id,
      kind: "flipper-board",
      title: board.name,
      subtitle: pickText(board.summary, lang),
      requiredPartIds: board.requiredPartIds,
      ...res,
    });
  }

  // 4. Representative Starter & Capstone Labs (1-2 per track so recommendations stay crisp & actionable)
  const featuredLabCodes = ["I1", "I2", "D1", "D4", "W1", "B1", "R1", "R5", "S1", "S6", "T1", "T2"];
  for (const code of featuredLabCodes) {
    const rawLab = LABS.find((l) => l.code === code);
    if (!rawLab) continue;
    const lab = localizeLab(rawLab, lang);
    const req = TRACK_REQUIRED_PARTS[rawLab.track] ?? ["esp32-s3-devkit"];
    const res = evaluateItem(ownedSet, req);
    allItems.push({
      id: `lab:${rawLab.id}`,
      targetId: rawLab.id,
      kind: "lab",
      title: `${rawLab.code}: ${lab.title}`,
      subtitle: lab.summary,
      difficulty: rawLab.difficulty,
      requiredPartIds: req,
      labCode: rawLab.code,
      ...res,
    });
  }

  const ready = allItems
    .filter((item) => item.status === "ready")
    .sort((a, b) => b.requiredPartIds.length - a.requiredPartIds.length);

  const almostReady = allItems
    .filter((item) => item.status === "almost")
    .sort((a, b) => a.missingPartIds.length - b.missingPartIds.length || b.matchPercent - a.matchPercent);

  // Compute Smart Upgrade Impact: which single unowned part unlocks the most new "ready" builds?
  const unownedParts = INVENTORY_PARTS.filter((part) => !ownedSet.has(part.id));
  const upgradeImpact: UpgradeImpactItem[] = unownedParts
    .map((part) => {
      const unlockedTitles: string[] = [];
      let helpsCount = 0;
      for (const item of allItems) {
        if (item.status === "ready") continue;
        if (item.missingPartIds.includes(part.id)) {
          helpsCount += 1;
          if (item.missingPartIds.length === 1) {
            unlockedTitles.push(item.title);
          }
        }
      }
      return {
        part,
        unlocksReadyCount: unlockedTitles.length,
        helpsCount,
        unlockedTitles: unlockedTitles.slice(0, 4),
      };
    })
    .filter((entry) => entry.helpsCount > 0)
    .sort(
      (a, b) =>
        b.unlocksReadyCount - a.unlocksReadyCount ||
        b.helpsCount - a.helpsCount ||
        a.part.approxPriceUsd - b.part.approxPriceUsd,
    )
    .slice(0, 6);

  return {
    ready,
    almostReady,
    upgradeImpact,
    ownedCount: ownedSet.size,
    totalCatalogCount: INVENTORY_PARTS.length,
  };
}
