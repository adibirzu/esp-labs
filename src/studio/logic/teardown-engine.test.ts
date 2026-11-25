import test from "node:test";
import assert from "node:assert/strict";
import { OFFICIAL_ESP_BOARDS } from "../data/boards";
import { BOARD_TEARDOWNS } from "../data/hardware-teardown";
import {
  computeBomSummary,
  exportTeardownCsv,
  filterTeardownBom,
  getBoardTeardown,
  getMetricScrewSpec,
  METRIC_SCREW_TABLE,
} from "./teardown-engine";

test("every official ESP32 board has complete screw-level mechanical and BOM teardown data", () => {
  for (const board of OFFICIAL_ESP_BOARDS) {
    const td = BOARD_TEARDOWNS[board.id];
    assert.ok(td, `Missing teardown record for ${board.id}`);
    assert.ok(td.fasteners.length >= 4, `${board.id} should list individual screws/standoffs/washers`);
    assert.ok(td.bom.length >= 5, `${board.id} should list multi-subsystem BOM items`);
    assert.ok(td.mechanical.primaryScrewIso.length > 0);
    assert.ok(td.mechanical.maxTorqueNm.includes("N·m"));
    for (const item of td.bom) {
      assert.ok(item.subParts.length >= 1, `${board.id} ${item.designator} must have sub-part drill-downs`);
    }
  }
});

test("computeBomSummary calculates exact quantities, fastener counts, and volume discount pricing", () => {
  const s3 = getBoardTeardown("esp32-s3-devkitc-1");
  const summary = computeBomSummary(s3);

  assert.equal(summary.uniqueLineItems, s3.bom.length);
  assert.ok(summary.fastenerPieceCount >= 18);
  assert.ok(summary.estimatedUnitBomUsd > 10);
  assert.ok(summary.estimated100QtyBomUsd < summary.estimatedUnitBomUsd);
  assert.ok(summary.subPartDetailCount >= 10);
});

test("filterTeardownBom filters by subsystem and micro sub-part search query (e.g. DIN 7985 / torque)", () => {
  const p4 = getBoardTeardown("esp32-p4-ev");
  const mechOnly = filterTeardownBom(p4.bom, "", "mechanical-screws");
  assert.equal(mechOnly.length, 1);
  assert.equal(mechOnly[0].designator, "MH1–MH4 + THM1");

  const screwSearch = filterTeardownBom(p4.bom, "ISO 7380", "all");
  assert.equal(screwSearch.length, 1);
  assert.equal(screwSearch[0].id, "p4-mh-kit");
});

test("ISO metric screw table returns accurate M2.5 and M3.0 drill clearances and FR-4 torque limits", () => {
  assert.equal(METRIC_SCREW_TABLE.length, 5);
  const m25 = getMetricScrewSpec("M2.5");
  assert.equal(m25.coarsePitchMm, 0.45);
  assert.equal(m25.closeClearanceMm, 2.7);
  assert.equal(m25.fr4MaxTorqueNm, 0.28);

  const m3 = getMetricScrewSpec("M3.0");
  assert.equal(m3.coarsePitchMm, 0.5);
  assert.equal(m3.closeClearanceMm, 3.2);
  assert.equal(m3.fr4MaxTorqueNm, 0.55);
});

test("exportTeardownCsv produces valid RFC-4180 CSV containing both BOM and screw fastener rows", () => {
  const s3 = getBoardTeardown("esp32-s3-devkitc-1");
  const csv = exportTeardownCsv("ESP32-S3-DevKitC-1", s3);
  const rows = csv.split("\n");
  assert.ok(rows[0].includes("Code/Designator"));
  assert.ok(rows.some((r) => r.includes("FASTENER:screw") && r.includes("DIN 7985")));
  assert.ok(rows.some((r) => r.includes("BOM:silicon-rf") && r.includes("ESP32-S3-WROOM-1")));
});
