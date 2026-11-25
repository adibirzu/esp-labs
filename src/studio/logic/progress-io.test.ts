import assert from "node:assert/strict";
import test from "node:test";
import { LABS } from "../data/labs.ts";
import {
  createProgressBackup,
  parseProgressBackup,
  serializeProgressBackup,
} from "./progress-io.ts";

test("createProgressBackup exports deduplicated valid lab IDs and matching codes", () => {
  const backup = createProgressBackup(
    ["intro-1", "intro-1", "iot-2", "non-existent"],
    LABS,
    new Date("2026-11-25T18:00:00.000Z"),
  );
  assert.equal(backup.app, "ESP-Labs Studio");
  assert.equal(backup.version, 1);
  assert.equal(backup.exportedAt, "2026-11-25T18:00:00.000Z");
  assert.deepEqual(backup.completedLabs, ["intro-1", "iot-2"]);
  assert.deepEqual(backup.completedLabCodes, ["I1", "P2"]);
});

test("parseProgressBackup round-trips exported JSON and supports lab codes or plain arrays", () => {
  const json = serializeProgressBackup(["intro-1", "display-1", "ble-3"], LABS);
  const res = parseProgressBackup(json, LABS);
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.deepEqual(res.completedLabs, ["intro-1", "display-1", "ble-3"]);
    assert.equal(res.ignoredCount, 0);
  }

  const byCodes = parseProgressBackup(JSON.stringify(["i1", "P2", "R4", "unknown-id"]), LABS);
  assert.equal(byCodes.ok, true);
  if (byCodes.ok) {
    assert.deepEqual(byCodes.completedLabs, ["intro-1", "iot-2", "rfid-4"]);
    assert.equal(byCodes.ignoredCount, 1);
  }
});

test("parseProgressBackup rejects malformed JSON or missing completedLabs field", () => {
  const badJson = parseProgressBackup("{not valid json", LABS);
  assert.deepEqual(badJson, { ok: false, reason: "invalid-json" });

  const badSchema = parseProgressBackup(JSON.stringify({ foo: "bar" }), LABS);
  assert.deepEqual(badSchema, { ok: false, reason: "invalid-schema" });
});
