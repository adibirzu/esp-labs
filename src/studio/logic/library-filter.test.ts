import assert from "node:assert/strict";
import test from "node:test";
import { OFFICIAL_ESP_BOARDS } from "../data/boards.ts";
import { PROJECT_IDEAS } from "../data/ideas.ts";
import {
  buildBoardComparison,
  computeBoardFootprintMetrics,
  filterBoards,
  filterIdeas,
} from "./library-filter.ts";

test("filterBoards filters by architecture, wireless capability, PSRAM, and query", () => {
  const riscv = filterBoards(OFFICIAL_ESP_BOARDS, {
    query: "",
    arch: "RISC-V",
    radio: "all",
    psramOnly: false,
  });
  assert.ok(riscv.length >= 4);
  assert.ok(riscv.every((b) => b.arch === "RISC-V"));

  const wifi5ghz = filterBoards(OFFICIAL_ESP_BOARDS, {
    query: "",
    arch: "all",
    radio: "wifi5ghz",
    psramOnly: false,
  });
  assert.deepEqual(
    wifi5ghz.map((b) => b.id),
    ["esp32-c5-devkitc-1"],
  );

  const usbOtgWithPsram = filterBoards(OFFICIAL_ESP_BOARDS, {
    query: "",
    arch: "all",
    radio: "usb-otg",
    psramOnly: true,
  });
  assert.ok(usbOtgWithPsram.some((b) => b.id === "esp32-s3-devkitc-1"));
  assert.ok(usbOtgWithPsram.some((b) => b.id === "esp32-s2-devkitc-1"));
  assert.ok(usbOtgWithPsram.every((b) => b.hasUsbOtg && b.hasPsram));

  const bySizeQuery = filterBoards(OFFICIAL_ESP_BOARDS, {
    query: "38.91",
    arch: "all",
    radio: "all",
    psramOnly: false,
  });
  assert.deepEqual(
    bySizeQuery.map((b) => b.id),
    ["esp32-c3-devkitm-1"],
  );
});

test("computeBoardFootprintMetrics calculates exact areas and breadboard compatibility", () => {
  const breadboardOnly = computeBoardFootprintMetrics(OFFICIAL_ESP_BOARDS, false);
  assert.ok(breadboardOnly.every((m) => m.formFactor === "devkit-breadboard"));
  assert.equal(breadboardOnly.some((m) => m.id === "esp32-p4-ev"), false);

  const c3 = breadboardOnly.find((m) => m.id === "esp32-c3-devkitm-1");
  assert.ok(c3);
  assert.equal(c3.areaMm2, 988.3);
  assert.equal(c3.areaCm2, 9.88);
  assert.equal(c3.breadboardNote, "Standard (2 rows free)");

  const classic = breadboardOnly.find((m) => m.id === "esp32-devkitc-v4");
  assert.ok(classic);
  assert.equal(classic.breadboardNote, "Wide (1 row free)");

  const withEv = computeBoardFootprintMetrics(OFFICIAL_ESP_BOARDS, true);
  const p4 = withEv.find((m) => m.id === "esp32-p4-ev");
  assert.ok(p4);
  assert.equal(p4.areaCm2, 89.6);
  assert.equal(p4.breadboardNote, "Bench / EV Board");
});

test("buildBoardComparison identifies best-in-class metrics across up to 4 boards", () => {
  const cmp = buildBoardComparison(OFFICIAL_ESP_BOARDS, [
    "esp32-s3-devkitc-1",
    "esp32-c3-devkitm-1",
    "esp32-p4-ev",
    "esp32-c6-devkitc-1",
    "esp32-h2-devkitm-1", // should be truncated to max 4
  ]);
  assert.equal(cmp.boards.length, 4);
  assert.equal(cmp.smallestFootprintId, "esp32-c3-devkitm-1");
  assert.equal(cmp.lowestSleepId, "esp32-c3-devkitm-1");
  assert.equal(cmp.fastestClockId, "esp32-p4-ev");
  assert.equal(cmp.mostGpiosId, "esp32-p4-ev");
});

test("filterIdeas filters by difficulty, board recommendation, saved state, and query", () => {
  const c6Ideas = filterIdeas(PROJECT_IDEAS, {
    query: "",
    difficulty: "all",
    category: "all",
    boardId: "esp32-c6-devkitc-1",
    savedOnly: false,
    savedIds: [],
  });
  assert.ok(c6Ideas.length >= 2);
  assert.ok(
    c6Ideas.every(
      (i) =>
        i.recommendedBoardId === "esp32-c6-devkitc-1" ||
        i.altBoardIds.includes("esp32-c6-devkitc-1"),
    ),
  );

  const savedMatter = filterIdeas(PROJECT_IDEAS, {
    query: "matter",
    difficulty: "Intermediate",
    category: "Smart Home",
    boardId: "all",
    savedOnly: true,
    savedIds: ["idea-matter-thread-sensor"],
  });
  assert.deepEqual(
    savedMatter.map((i) => i.id),
    ["idea-matter-thread-sensor"],
  );
});
