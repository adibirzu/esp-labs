import {
  BOARD_TEARDOWNS,
  type BoardTeardownRecord,
  type BomComponentItem,
  type TeardownSubsystem,
} from "../data/hardware-teardown";

export interface BomSummaryMetrics {
  uniqueLineItems: number;
  totalComponentQty: number;
  fastenerPieceCount: number;
  estimatedUnitBomUsd: number;
  estimated100QtyBomUsd: number;
  subPartDetailCount: number;
}

export interface MetricScrewStandard {
  size: "M2.0" | "M2.5" | "M3.0" | "M3.5" | "M4.0";
  majorDiameterMm: number;
  coarsePitchMm: number;
  closeClearanceMm: number;
  normalClearanceMm: number;
  looseClearanceMm: number;
  tapDrillMm: number;
  panHeadDiameterMm: number;
  pcbPadKeepoutMm: number;
  recommendedDriver: string;
  fr4MaxTorqueNm: number;
}

export const METRIC_SCREW_TABLE: MetricScrewStandard[] = [
  {
    size: "M2.0",
    majorDiameterMm: 2.0,
    coarsePitchMm: 0.4,
    closeClearanceMm: 2.2,
    normalClearanceMm: 2.4,
    looseClearanceMm: 2.6,
    tapDrillMm: 1.6,
    panHeadDiameterMm: 4.0,
    pcbPadKeepoutMm: 5.0,
    recommendedDriver: "PH0 / Hex 1.3 mm",
    fr4MaxTorqueNm: 0.16,
  },
  {
    size: "M2.5",
    majorDiameterMm: 2.5,
    coarsePitchMm: 0.45,
    closeClearanceMm: 2.7,
    normalClearanceMm: 2.9,
    looseClearanceMm: 3.1,
    tapDrillMm: 2.05,
    panHeadDiameterMm: 5.0,
    pcbPadKeepoutMm: 6.2,
    recommendedDriver: "PH1 / Hex 1.5 mm",
    fr4MaxTorqueNm: 0.28,
  },
  {
    size: "M3.0",
    majorDiameterMm: 3.0,
    coarsePitchMm: 0.5,
    closeClearanceMm: 3.2,
    normalClearanceMm: 3.4,
    looseClearanceMm: 3.6,
    tapDrillMm: 2.5,
    panHeadDiameterMm: 5.7,
    pcbPadKeepoutMm: 7.2,
    recommendedDriver: "PH1 / Hex 2.0 mm",
    fr4MaxTorqueNm: 0.55,
  },
  {
    size: "M3.5",
    majorDiameterMm: 3.5,
    coarsePitchMm: 0.6,
    closeClearanceMm: 3.7,
    normalClearanceMm: 3.9,
    looseClearanceMm: 4.2,
    tapDrillMm: 2.9,
    panHeadDiameterMm: 7.0,
    pcbPadKeepoutMm: 8.4,
    recommendedDriver: "PH2 / Hex 2.5 mm",
    fr4MaxTorqueNm: 0.78,
  },
  {
    size: "M4.0",
    majorDiameterMm: 4.0,
    coarsePitchMm: 0.7,
    closeClearanceMm: 4.3,
    normalClearanceMm: 4.5,
    looseClearanceMm: 4.8,
    tapDrillMm: 3.3,
    panHeadDiameterMm: 8.0,
    pcbPadKeepoutMm: 9.6,
    recommendedDriver: "PH2 / Hex 2.5 mm",
    fr4MaxTorqueNm: 1.15,
  },
];

export function getBoardTeardown(boardId: string): BoardTeardownRecord {
  return BOARD_TEARDOWNS[boardId] ?? BOARD_TEARDOWNS["esp32-s3-devkitc-1"];
}

export function getMetricScrewSpec(size: MetricScrewStandard["size"]): MetricScrewStandard {
  return METRIC_SCREW_TABLE.find((row) => row.size === size) ?? METRIC_SCREW_TABLE[1];
}

export function computeBomSummary(record: BoardTeardownRecord): BomSummaryMetrics {
  const uniqueLineItems = record.bom.length;
  const totalComponentQty = record.bom.reduce((sum, item) => sum + item.qty, 0);
  const fastenerPieceCount = record.fasteners.reduce((sum, item) => sum + item.qty, 0);
  const rawBomCost = record.bom.reduce((sum, item) => sum + item.unitCostUsd * item.qty, 0);
  const estimatedUnitBomUsd = Number(rawBomCost.toFixed(2));
  // Typical volume discount at 100+ reel/tray procurement (~24%)
  const estimated100QtyBomUsd = Number((rawBomCost * 0.76).toFixed(2));
  const subPartDetailCount = record.bom.reduce((sum, item) => sum + item.subParts.length, 0);

  return {
    uniqueLineItems,
    totalComponentQty,
    fastenerPieceCount,
    estimatedUnitBomUsd,
    estimated100QtyBomUsd,
    subPartDetailCount,
  };
}

export function filterTeardownBom(
  bom: BomComponentItem[],
  query: string,
  subsystem: "all" | TeardownSubsystem,
): BomComponentItem[] {
  const q = query.trim().toLowerCase();
  return bom.filter((item) => {
    if (subsystem !== "all" && item.subsystem !== subsystem) return false;
    if (!q) return true;
    const haystack = [
      item.designator,
      item.mpn,
      item.manufacturer,
      item.packageType,
      item.name.en,
      item.name.ro,
      item.solderOrMount,
      ...item.subParts.flatMap((sp) => [sp.label.en, sp.label.ro, sp.spec, sp.tolerance]),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportTeardownCsv(boardName: string, record: BoardTeardownRecord): string {
  const lines: string[] = [];
  lines.push(
    [
      "Board",
      "Section",
      "Code/Designator",
      "Part Name",
      "MPN / ISO Standard",
      "Package / Thread",
      "Mount / Torque / Drill",
      "Qty",
      "Unit Cost (USD)",
    ]
      .map(escapeCsvCell)
      .join(","),
  );

  for (const item of record.bom) {
    lines.push(
      [
        boardName,
        `BOM:${item.subsystem}`,
        item.designator,
        item.name.en,
        item.mpn,
        item.packageType,
        item.solderOrMount,
        item.qty,
        item.unitCostUsd.toFixed(2),
      ]
        .map(escapeCsvCell)
        .join(","),
    );
  }

  for (const f of record.fasteners) {
    lines.push(
      [
        boardName,
        `FASTENER:${f.kind}`,
        f.code,
        f.name.en,
        f.isoStandard,
        `${f.threadSpec} (Pitch ${f.pitchMm} mm)`,
        `${f.clearanceDrillMm} | ${f.torqueNm} | ${f.driveTool}`,
        f.qty,
        f.unitCostUsd.toFixed(2),
      ]
        .map(escapeCsvCell)
        .join(","),
    );
  }

  return lines.join("\n");
}
