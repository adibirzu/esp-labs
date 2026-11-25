import test from "node:test";
import assert from "node:assert/strict";
import {
  BENCH_BOARDS,
  BENCH_WIRE_CONNECTIONS,
  clampBoardPoseToBench,
  getDefaultBenchLayout,
  mergeSavedBenchLayout,
} from "./bench-3d";
import {
  HARDWARE_PROFILES,
  parseHardwareTelemetryLine,
} from "./hardware-bridge";
import { buildNeonAndUpstashExport } from "./db-export";

test("default 3D bench layout includes all 6 realistic hardware boards grounded at y=0 with zero overlap", () => {
  const layout = getDefaultBenchLayout();
  assert.equal(Object.keys(layout).length, BENCH_BOARDS.length);
  for (const board of BENCH_BOARDS) {
    assert.equal(layout[board.id].y, 0);
  }
  for (let i = 0; i < BENCH_BOARDS.length; i += 1) {
    for (let j = i + 1; j < BENCH_BOARDS.length; j += 1) {
      const a = BENCH_BOARDS[i];
      const b = BENCH_BOARDS[j];
      const pa = layout[a.id];
      const pb = layout[b.id];
      const overlapX = Math.abs(pa.x - pb.x) < a.footprintHalfX + b.footprintHalfX;
      const overlapZ = Math.abs(pa.z - pb.z) < a.footprintHalfZ + b.footprintHalfZ;
      assert.equal(overlapX && overlapZ, false, `${a.id} overlaps ${b.id}`);
    }
  }
});

test("clampBoardPoseToBench keeps moved boards within the ESD mat volume and above floor", () => {
  const clamped = clampBoardPoseToBench({ x: 99, y: -3.5, z: -50, rotY: 1.57 });
  assert.equal(clamped.x, 16);
  assert.equal(clamped.y, 0);
  assert.equal(clamped.z, -11);
  assert.equal(clamped.rotY, 1.57);
});

test("mergeSavedBenchLayout overrides saved board poses while preserving defaults", () => {
  const defaults = getDefaultBenchLayout();
  const merged = mergeSavedBenchLayout({
    "esp32-s3": { x: 2.5, y: 1.2, z: -1.0, rotY: 0.5 },
  });
  assert.equal(merged["esp32-s3"].x, 2.5);
  assert.equal(merged["esp32-s3"].y, 1.2);
  assert.equal(merged["flipper-zero"].x, defaults["flipper-zero"].x);
});

test("wiring presets reference valid bench boards", () => {
  const validIds = new Set(BENCH_BOARDS.map((b) => b.id));
  assert.ok(BENCH_WIRE_CONNECTIONS.length >= 12);
  for (const w of BENCH_WIRE_CONNECTIONS) {
    assert.ok(validIds.has(w.fromBoard));
    assert.ok(validIds.has(w.toBoard));
  }
});

test("parseHardwareTelemetryLine extracts RGB hex, RFID UID, and Flipper mode", () => {
  assert.equal(parseHardwareTelemetryLine("LED set to #10b981").rgbHex, "#10b981");
  assert.equal(parseHardwareTelemetryLine("Card UID: 04 A2 B9 1C").rfidUid, "04:A2:B9:1C");
  assert.equal(parseHardwareTelemetryLine("Starting SubGHz rx 433.92").flipperMode, "Sub-GHz 433.92 MHz");
  assert.ok(HARDWARE_PROFILES.some((p) => p.id === "flipper-zero"));
});

test("buildNeonAndUpstashExport produces valid PostgreSQL DDL and Upstash Redis config", () => {
  const out = buildNeonAndUpstashExport({
    userId: "user_1",
    userEmail: "maker@example.com",
    ownedParts: { "esp32-s3-devkit": 2, "flipper-zero": 1 },
    customPhotoParts: [
      {
        id: "hw_1",
        ownerId: "user_1",
        name: "LoRa SX1262",
        category: "wireless",
        quantity: 1,
        voltage: "3.3V",
        interfaceSpec: "SPI",
        notes: "868 MHz EU",
      },
    ],
    benchLayout: getDefaultBenchLayout(),
  });
  assert.ok(out.sql.includes("CREATE TABLE IF NOT EXISTS custom_hardware_parts"));
  assert.ok(out.sql.includes("LoRa SX1262"));
  assert.ok(out.upstashConfig.includes("UPSTASH_REDIS_REST_URL"));
});
