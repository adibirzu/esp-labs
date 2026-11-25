import test from "node:test";
import assert from "node:assert/strict";
import { buildInventoryRecommendations } from "./inventory-matcher";
import { FLIPPER_BOARDS, FLIPPER_GPIO_PINS, FLIPPER_GUIDES, FLIPPER_RESOURCES } from "../data/flipper";
import { INVENTORY_PARTS } from "../data/inventory";

test("empty inventory returns zero ready builds and suggests high-impact starter parts", () => {
  const report = buildInventoryRecommendations({}, "ro");
  assert.equal(report.ownedCount, 0);
  assert.equal(report.ready.length, 0);
  assert.ok(report.upgradeImpact.length > 0, "should suggest high-impact parts to acquire");
});

test("ESP32-S3 + breadboard + OLED unlocks Display labs and surfaces RFID/Audio almost-ready items", () => {
  const report = buildInventoryRecommendations(
    {
      "esp32-s3-devkit": 1,
      "ssd1306-oled": 1,
      "breadboard-wires": 1,
    },
    "en",
  );
  assert.equal(report.ownedCount, 3);
  assert.ok(
    report.ready.some((r) => r.kind === "lab" && r.labCode === "D1"),
    "Display Lab D1 should be ready",
  );
  assert.ok(
    report.almostReady.some((r) => r.kind === "idea" && r.missingPartIds.length <= 2),
    "Should surface almost-ready project ideas",
  );
  assert.ok(
    report.upgradeImpact.some((u) => u.unlocksReadyCount > 0),
    "At least one missing part should immediately unlock a new project/lab",
  );
});

test("Flipper Zero + ESP32-S3 + breadboard unlocks DIY ESP32 Flipper companion guide", () => {
  const report = buildInventoryRecommendations(
    {
      "flipper-zero": 1,
      "esp32-s3-devkit": 1,
      "breadboard-wires": 1,
    },
    "ro",
  );
  assert.ok(
    report.ready.some((r) => r.kind === "flipper-guide" && r.targetId === "guide-diy-esp32-uart"),
    "DIY ESP32 UART Flipper guide should be Ready to Build",
  );
  assert.ok(
    report.ready.some((r) => r.kind === "flipper-board" && r.targetId === "fz-diy-esp32"),
    "DIY ESP32 Flipper board should be Ready",
  );
  assert.ok(
    report.almostReady.some((r) => r.kind === "flipper-guide" && r.targetId === "guide-cc1101-external"),
    "CC1101 external guide should be Almost Ready (only missing CC1101)",
  );
});

test("Flipper Zero dataset completeness and 18-pin GPIO integrity", () => {
  assert.equal(FLIPPER_GPIO_PINS.length, 18);
  assert.ok(FLIPPER_BOARDS.length >= 7);
  assert.ok(FLIPPER_GUIDES.length >= 5);
  assert.ok(FLIPPER_RESOURCES.length >= 8);
  for (const part of INVENTORY_PARTS) {
    assert.ok(part.name.ro.length > 0 && part.name.en.length > 0);
  }
});
