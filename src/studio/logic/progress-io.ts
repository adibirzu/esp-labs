import type { LabItem } from "../types";

export interface ProgressBackupPayload {
  app: "ESP-Labs Studio";
  version: 1;
  exportedAt: string;
  completedLabs: string[];
  completedLabCodes: string[];
}

export type ParseProgressResult =
  | {
      ok: true;
      completedLabs: string[];
      ignoredCount: number;
    }
  | {
      ok: false;
      reason: "invalid-json" | "invalid-schema";
    };

export function createProgressBackup(
  completedLabIds: string[],
  validLabs: Pick<LabItem, "id" | "code">[],
  now: Date = new Date(),
): ProgressBackupPayload {
  const labById = new Map(validLabs.map((l) => [l.id, l]));
  const uniqueIds: string[] = [];
  const codes: string[] = [];
  const seen = new Set<string>();

  for (const id of completedLabIds) {
    const lab = labById.get(id);
    if (lab && !seen.has(lab.id)) {
      seen.add(lab.id);
      uniqueIds.push(lab.id);
      codes.push(lab.code);
    }
  }

  return {
    app: "ESP-Labs Studio",
    version: 1,
    exportedAt: now.toISOString(),
    completedLabs: uniqueIds,
    completedLabCodes: codes,
  };
}

export function serializeProgressBackup(
  completedLabIds: string[],
  validLabs: Pick<LabItem, "id" | "code">[],
  now: Date = new Date(),
): string {
  return JSON.stringify(createProgressBackup(completedLabIds, validLabs, now), null, 2);
}

export function parseProgressBackup(
  rawText: string,
  validLabs: Pick<LabItem, "id" | "code">[],
): ParseProgressResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { ok: false, reason: "invalid-json" };
  }

  let candidateEntries: unknown[];

  if (Array.isArray(parsed)) {
    candidateEntries = parsed;
  } else if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.completedLabs)) {
      candidateEntries = obj.completedLabs;
    } else if (Array.isArray(obj.completedLabCodes)) {
      candidateEntries = obj.completedLabCodes;
    } else {
      return { ok: false, reason: "invalid-schema" };
    }
  } else {
    return { ok: false, reason: "invalid-schema" };
  }

  const byId = new Map(validLabs.map((l) => [l.id, l.id]));
  const byCode = new Map(validLabs.map((l) => [l.code.toLowerCase(), l.id]));

  const restored: string[] = [];
  const seen = new Set<string>();
  let ignoredCount = 0;

  for (const entry of candidateEntries) {
    if (typeof entry !== "string") {
      ignoredCount++;
      continue;
    }
    const trimmed = entry.trim();
    const matchedId = byId.get(trimmed) ?? byCode.get(trimmed.toLowerCase());
    if (!matchedId) {
      ignoredCount++;
      continue;
    }
    if (!seen.has(matchedId)) {
      seen.add(matchedId);
      restored.push(matchedId);
    }
  }

  return {
    ok: true,
    completedLabs: restored,
    ignoredCount,
  };
}
