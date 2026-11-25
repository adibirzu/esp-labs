/**
 * Defensive Payload Sanitization & Blueprint Synchronicity Validators.
 * Constants and patterns strictly mirror firebase-blueprint.json & firestore.rules.
 */

export const BLUEPRINT_LIMITS = {
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  ID_MAX_LEN: 128,
  EMAIL_MIN_LEN: 3,
  EMAIL_MAX_LEN: 254,
  DISPLAY_NAME_MAX_LEN: 120,
  PHOTO_URL_MAX_LEN: 512,
  OWNED_PARTS_MAX_KEYS: 60,
  CUSTOM_PARTS_MAX_ITEMS: 40,
  CUSTOM_PART_MAX_LEN: 80,
  COMPLETED_LABS_MAX_ITEMS: 60,
  SAVED_IDEAS_MAX_ITEMS: 40,
  BENCH_LAYOUT_MAX_BOARDS: 12,
  EARNED_BADGES_MAX_ITEMS: 20,
} as const;

export interface BenchBoardPose {
  x: number;
  y: number;
  z: number;
  rotY: number;
}

export type BenchLayoutMap = Record<string, BenchBoardPose>;

export interface SanitizedInventoryPayload {
  ownedParts: Record<string, number>;
  customParts: string[];
  completedLabs: string[];
  savedIdeaIds: string[];
  benchLayout: BenchLayoutMap;
  earnedBadgeIds: string[];
}

export function isValidFirebaseId(id: string): boolean {
  return (
    typeof id === "string" &&
    id.length >= 1 &&
    id.length <= BLUEPRINT_LIMITS.ID_MAX_LEN &&
    BLUEPRINT_LIMITS.ID_PATTERN.test(id)
  );
}

export function sanitizeOwnedParts(raw: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  let count = 0;
  for (const [key, val] of Object.entries(raw)) {
    if (count >= BLUEPRINT_LIMITS.OWNED_PARTS_MAX_KEYS) break;
    if (!isValidFirebaseId(key)) continue;
    const qty = Math.max(0, Math.min(999, Math.floor(Number(val) || 0)));
    if (qty > 0) {
      out[key] = qty;
      count += 1;
    }
  }
  return out;
}

export function sanitizeStringList(
  items: string[],
  maxItems: number,
  maxLen: number,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    if (out.length >= maxItems) break;
    if (typeof raw !== "string") continue;
    const clean = raw.trim().slice(0, maxLen);
    if (clean.length === 0 || seen.has(clean)) continue;
    seen.add(clean);
    out.push(clean);
  }
  return out;
}

export function sanitizeBenchLayout(raw: BenchLayoutMap): BenchLayoutMap {
  const out: BenchLayoutMap = {};
  let count = 0;
  for (const [id, pose] of Object.entries(raw)) {
    if (count >= BLUEPRINT_LIMITS.BENCH_LAYOUT_MAX_BOARDS) break;
    if (!isValidFirebaseId(id) || !pose || typeof pose !== "object") continue;
    const clamp = (n: number, min: number, max: number) =>
      Math.max(min, Math.min(max, Number.isFinite(n) ? Math.round(n * 1000) / 1000 : 0));
    out[id] = {
      x: clamp(pose.x, -25, 25),
      y: clamp(pose.y, 0, 12),
      z: clamp(pose.z, -20, 20),
      rotY: clamp(pose.rotY, -Math.PI * 2, Math.PI * 2),
    };
    count += 1;
  }
  return out;
}

export function sanitizeProfileStrings(input: {
  email: string;
  displayName: string;
  photoURL?: string | null;
}) {
  const email = (input.email || "").trim().slice(0, BLUEPRINT_LIMITS.EMAIL_MAX_LEN);
  const displayName =
    (input.displayName || "Maker").trim().slice(0, BLUEPRINT_LIMITS.DISPLAY_NAME_MAX_LEN) ||
    "Maker";
  const photoURL = input.photoURL
    ? input.photoURL.trim().slice(0, BLUEPRINT_LIMITS.PHOTO_URL_MAX_LEN)
    : "";
  return { email, displayName, photoURL };
}

export function sanitizeInventoryVault(input: {
  ownedParts: Record<string, number>;
  customParts: string[];
  completedLabs: string[];
  savedIdeaIds: string[];
  benchLayout?: BenchLayoutMap;
  earnedBadgeIds?: string[];
}): SanitizedInventoryPayload {
  return {
    ownedParts: sanitizeOwnedParts(input.ownedParts),
    customParts: sanitizeStringList(
      input.customParts,
      BLUEPRINT_LIMITS.CUSTOM_PARTS_MAX_ITEMS,
      BLUEPRINT_LIMITS.CUSTOM_PART_MAX_LEN,
    ),
    completedLabs: sanitizeStringList(
      input.completedLabs,
      BLUEPRINT_LIMITS.COMPLETED_LABS_MAX_ITEMS,
      BLUEPRINT_LIMITS.ID_MAX_LEN,
    ),
    savedIdeaIds: sanitizeStringList(
      input.savedIdeaIds,
      BLUEPRINT_LIMITS.SAVED_IDEAS_MAX_ITEMS,
      BLUEPRINT_LIMITS.ID_MAX_LEN,
    ),
    benchLayout: sanitizeBenchLayout(input.benchLayout ?? {}),
    earnedBadgeIds: sanitizeStringList(
      input.earnedBadgeIds ?? [],
      BLUEPRINT_LIMITS.EARNED_BADGES_MAX_ITEMS,
      BLUEPRINT_LIMITS.ID_MAX_LEN,
    ),
  };
}
