import type { CpuArch, EspBoardSpec, ProjectIdea, RadioCapability } from "../types";

export interface BoardFilterCriteria {
  query: string;
  arch: "all" | CpuArch;
  radio: "all" | RadioCapability | "usb-otg";
  psramOnly: boolean;
}

export interface BoardFootprintMetric {
  id: string;
  name: string;
  soc: string;
  lengthMm: number;
  widthMm: number;
  areaMm2: number;
  areaCm2: number;
  relativeLengthPct: number;
  relativeWidthPct: number;
  breadboardNote: "Standard (2 rows free)" | "Wide (1 row free)" | "Bench / EV Board";
  accent: string;
  formFactor: EspBoardSpec["formFactor"];
}

export interface IdeaFilterCriteria {
  query: string;
  difficulty: "all" | ProjectIdea["difficulty"];
  category: "all" | ProjectIdea["category"];
  boardId: "all" | string;
  savedOnly: boolean;
  savedIds: string[];
}

export interface BoardComparisonSummary {
  boards: EspBoardSpec[];
  smallestFootprintId: string | null;
  fastestClockId: string | null;
  lowestSleepId: string | null;
  mostGpiosId: string | null;
}

export function filterBoards(
  boards: EspBoardSpec[],
  criteria: BoardFilterCriteria,
): EspBoardSpec[] {
  const q = criteria.query.trim().toLowerCase();

  return boards.filter((board) => {
    if (criteria.arch !== "all" && board.arch !== criteria.arch) {
      return false;
    }

    if (criteria.psramOnly && !board.hasPsram) {
      return false;
    }

    if (criteria.radio !== "all") {
      if (criteria.radio === "usb-otg") {
        if (!board.hasUsbOtg) return false;
      } else if (!board.radios.includes(criteria.radio)) {
        return false;
      }
    }

    if (!q) return true;

    const searchable = [
      board.name,
      board.soc,
      board.moduleName,
      board.cpu,
      board.arch,
      board.tagline,
      board.psramSpec,
      board.flashSpec,
      board.usb,
      `${board.lengthMm}x${board.widthMm}`,
      `${board.lengthMm} × ${board.widthMm}`,
      ...board.wirelessLabels,
      ...board.bestFor,
      ...board.peripherals,
    ]
      .join(" ")
      .toLowerCase();

    return searchable.includes(q);
  });
}

export function computeBoardFootprintMetrics(
  boards: EspBoardSpec[],
  includeEvBoards = false,
): BoardFootprintMetric[] {
  const scoped = includeEvBoards
    ? boards
    : boards.filter((b) => b.formFactor === "devkit-breadboard");

  if (scoped.length === 0) return [];

  const maxLength = Math.max(...scoped.map((b) => b.lengthMm));
  const maxWidth = Math.max(...scoped.map((b) => b.widthMm));

  return scoped.map((b) => {
    const areaMm2 = Math.round(b.lengthMm * b.widthMm * 10) / 10;
    const areaCm2 = Math.round((areaMm2 / 100) * 100) / 100;
    let breadboardNote: BoardFootprintMetric["breadboardNote"];
    if (b.formFactor === "ev-board") {
      breadboardNote = "Bench / EV Board";
    } else if (b.widthMm > 26) {
      breadboardNote = "Wide (1 row free)";
    } else {
      breadboardNote = "Standard (2 rows free)";
    }

    return {
      id: b.id,
      name: b.name,
      soc: b.soc,
      lengthMm: b.lengthMm,
      widthMm: b.widthMm,
      areaMm2,
      areaCm2,
      relativeLengthPct: Math.round((b.lengthMm / maxLength) * 1000) / 10,
      relativeWidthPct: Math.round((b.widthMm / maxWidth) * 1000) / 10,
      breadboardNote,
      accent: b.accent,
      formFactor: b.formFactor,
    };
  });
}

export function buildBoardComparison(
  allBoards: EspBoardSpec[],
  selectedIds: string[],
): BoardComparisonSummary {
  const boards = selectedIds
    .map((id) => allBoards.find((b) => b.id === id))
    .filter((b): b is EspBoardSpec => Boolean(b))
    .slice(0, 4);

  if (boards.length === 0) {
    return {
      boards: [],
      smallestFootprintId: null,
      fastestClockId: null,
      lowestSleepId: null,
      mostGpiosId: null,
    };
  }

  let smallest = boards[0];
  let fastest = boards[0];
  let lowestSleep = boards[0];
  let mostGpios = boards[0];

  for (const b of boards) {
    if (b.lengthMm * b.widthMm < smallest.lengthMm * smallest.widthMm) {
      smallest = b;
    }
    if (b.maxFreqMhz > fastest.maxFreqMhz) {
      fastest = b;
    }
    if (b.deepSleepUa < lowestSleep.deepSleepUa) {
      lowestSleep = b;
    }
    if (b.gpios > mostGpios.gpios) {
      mostGpios = b;
    }
  }

  return {
    boards,
    smallestFootprintId: smallest.id,
    fastestClockId: fastest.id,
    lowestSleepId: lowestSleep.id,
    mostGpiosId: mostGpios.id,
  };
}

export function filterIdeas(
  ideas: ProjectIdea[],
  criteria: IdeaFilterCriteria,
): ProjectIdea[] {
  const q = criteria.query.trim().toLowerCase();

  return ideas.filter((idea) => {
    if (criteria.difficulty !== "all" && idea.difficulty !== criteria.difficulty) {
      return false;
    }
    if (criteria.category !== "all" && idea.category !== criteria.category) {
      return false;
    }
    if (criteria.boardId !== "all") {
      const matchesBoard =
        idea.recommendedBoardId === criteria.boardId ||
        idea.altBoardIds.includes(criteria.boardId);
      if (!matchesBoard) return false;
    }
    if (criteria.savedOnly && !criteria.savedIds.includes(idea.id)) {
      return false;
    }
    if (!q) return true;

    const hay = [
      idea.title,
      idea.category,
      idea.difficulty,
      idea.summary,
      idea.recommendedBoardId,
      ...idea.altBoardIds,
      ...idea.buses,
      ...idea.parts,
      ...idea.relatedLabCodes,
    ]
      .join(" ")
      .toLowerCase();

    return hay.includes(q);
  });
}
