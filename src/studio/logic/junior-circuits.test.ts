import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CAP_COVERED_POS,
  CAP_OPEN_POS,
  JUNIOR_LESSONS,
  JUNIOR_MISSIONS,
  capPosFromCover01,
  computeLdrReading,
  computeRadarGateState,
  computeRingLedColors,
  computeSirenPhase,
  computeSmartFanState,
  parseEditableCodeParams,
} from "./junior-circuits";

describe("Junior Explorer 3D Circuit Simulation Engine", () => {
  it("provides all 8 localized interactive lessons with bilingual missions starting with Table Lamp (#light)", () => {
    assert.equal(JUNIOR_LESSONS.length, 8);
    assert.equal(JUNIOR_LESSONS[0].id, "table-lamp");
    assert.equal(JUNIOR_LESSONS[0].hashSlug, "light");
    assert.equal(JUNIOR_LESSONS[6].id, "robot-gate");
    assert.equal(JUNIOR_LESSONS[7].id, "smart-fan");
    for (const lesson of JUNIOR_LESSONS) {
      assert.ok(lesson.title.en.length > 0 && lesson.title.ro.length > 0);
      assert.ok(lesson.overview.en.length > 0 && lesson.overview.ro.length > 0);
      assert.ok(JUNIOR_MISSIONS[lesson.id].en.length > 0 && JUNIOR_MISSIONS[lesson.id].ro.length > 0);
      assert.ok(lesson.pinout.length >= 3);
      assert.ok(lesson.defaultCode.length > 20);
    }
  });

  it("reads bright daylight ADC when Cap is away and switches Table Lamp ON when Cap covers LDR", () => {
    const open = computeLdrReading(CAP_OPEN_POS, 1800);
    assert.ok(open.adc > 3200, `Expected bright ADC > 3200, got ${open.adc}`);
    assert.equal(open.lampOn, false);
    assert.ok(open.voltageV > 2.5);

    const covered = computeLdrReading(CAP_COVERED_POS, 1800);
    assert.ok(covered.adc < 300, `Expected dark ADC < 300, got ${covered.adc}`);
    assert.equal(covered.lampOn, true);
    assert.ok(covered.voltageV < 0.3);

    const halfwayPos = capPosFromCover01(0.55);
    const lowThresh = computeLdrReading(halfwayPos, 600);
    const highThresh = computeLdrReading(halfwayPos, 3200);
    assert.equal(lowThresh.lampOn, false);
    assert.equal(highThresh.lampOn, true);
  });

  it("parses and safely clamps user-edited code constants including servo gate and smart fan", () => {
    const custom = `
      const int THRESHOLD = 2450;
      const char* COLOR_HEX = "#22d3ee";
      const int BREATHE_MS = 1200;
      const int MAX_LEDS = 10;
      const int MODE = 2;
      const int TEMPO_MS = 220;
      const int BASE_FREQ = 820;
      const int SWEEP_HZ = 420;
      const int STEP_MS = 260;
      const char* HOST_IP = "192.168.1.42";
      const int TRIGGER_CM = 35;
      const int OPEN_ANGLE = 105;
      const int FAN_ON_C = 25;
      const int TURBO_C = 31;
    `;
    const params = parseEditableCodeParams(custom);
    assert.equal(params.threshold, 2450);
    assert.equal(params.moodColorHex, "#22d3ee");
    assert.equal(params.breatheMs, 1200);
    assert.equal(params.maxRingLeds, 10);
    assert.equal(params.ringMode, 2);
    assert.equal(params.pianoTempoMs, 220);
    assert.equal(params.sirenBaseFreq, 820);
    assert.equal(params.sirenSweepHz, 420);
    assert.equal(params.sirenStepMs, 260);
    assert.equal(params.wifiHost, "192.168.1.42");
    assert.equal(params.gateTriggerCm, 35);
    assert.equal(params.gateOpenAngle, 105);
    assert.equal(params.fanOnTempC, 25);
    assert.equal(params.fanTurboTempC, 31);

    const clamped = parseEditableCodeParams("THRESHOLD = 99999; MAX_LEDS = 99; MODE = 9; OPEN_ANGLE = 250;");
    assert.equal(clamped.threshold, 3500);
    assert.equal(clamped.maxRingLeds, 12);
    assert.equal(clamped.ringMode, 2);
    assert.equal(clamped.gateOpenAngle, 115);
  });

  it("maps potentiometer 0..1 cleanly to NeoPixel 12-LED ring colors", () => {
    const empty = computeRingLedColors(0, 12, 1);
    assert.equal(empty.litCount, 0);
    assert.equal(empty.colors.filter(Boolean).length, 0);

    const half = computeRingLedColors(0.5, 12, 0);
    assert.equal(half.litCount, 6);
    assert.equal(half.colors[0], "#06b6d4");
    assert.equal(half.colors[5], "#06b6d4");
    assert.equal(half.colors[6], null);

    const capped = computeRingLedColors(1, 8, 2);
    assert.equal(capped.litCount, 8);
    assert.equal(capped.colors[7], "#f59e0b");
    assert.equal(capped.colors[8], null);
  });

  it("alternates siren beacons and dual frequencies cleanly", () => {
    const step0 = computeSirenPhase(0, 640, 340);
    assert.equal(step0.redOn, true);
    assert.equal(step0.blueOn, false);
    assert.equal(step0.freqHz, 640);

    const step1 = computeSirenPhase(1, 640, 340);
    assert.equal(step1.redOn, false);
    assert.equal(step1.blueOn, true);
    assert.equal(step1.freqHz, 980);
  });

  it("opens the Robot Radar Gate when rover distance is within TRIGGER_CM", () => {
    const far = computeRadarGateState(55, 28, 90);
    assert.equal(far.gateOpen, false);
    assert.equal(far.servoAngleDeg, 0);
    assert.ok(far.echoUs > 3000);

    const near = computeRadarGateState(16, 28, 95);
    assert.equal(near.gateOpen, true);
    assert.equal(near.servoAngleDeg, 95);
  });

  it("steps Smart Plant Fan smoothly through off, eco, and turbo cooling stages", () => {
    assert.deepEqual(computeSmartFanState(23, 27, 32), { mode: "off", dutyPct: 0, rpm: 0 });
    assert.deepEqual(computeSmartFanState(29, 27, 32), { mode: "eco", dutyPct: 60, rpm: 1450 });
    assert.deepEqual(computeSmartFanState(34, 27, 32), { mode: "turbo", dutyPct: 100, rpm: 2400 });
  });
});
