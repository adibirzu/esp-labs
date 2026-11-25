import test from "node:test";
import assert from "node:assert/strict";
import {
  clearLogicHistory,
  computeChannelMetrics,
  createInitialLogicState,
  GPIO_CHANNELS,
  HISTORY_LENGTH,
  setButtonState,
  setLogicPreset,
  stepLogicAnalyzer,
  toggleGpioOutput,
} from "./logic-analyzer";

test("initial logic analyzer state configures 6 ESP32-S3 GPIO channels with pull-up on GPIO0 and pull-down on GPIO15", () => {
  const state = createInitialLogicState();
  assert.equal(GPIO_CHANNELS.length, 6);
  assert.equal(state.levels[0], 1, "GPIO0 BOOT has internal pull-up HIGH when idle");
  assert.equal(state.levels[15], 0, "GPIO15 BTN2 has pull-down LOW when idle");
  assert.equal(state.history[4].length, HISTORY_LENGTH);
});

test("toggleGpioOutput flips LED output state, appends waveform sample, and increments edgeCount", () => {
  const s0 = createInitialLogicState();
  const prev = s0.levels[4];
  const s1 = toggleGpioOutput(s0, 4);
  assert.equal(s1.levels[4], prev === 1 ? 0 : 1);
  assert.equal(s1.history[4][HISTORY_LENGTH - 1], s1.levels[4]);
  assert.equal(s1.edgeCount, 1);
});

test("setButtonState models Active-LOW GPIO0 and Active-HIGH GPIO15 plus combinational logic gate mode", () => {
  let state = setLogicPreset(createInitialLogicState(), "button-mirror");
  // Idle: neither pressed -> AND=0, XOR=0, !BOOT=0
  assert.equal(state.levels[0], 1);
  assert.equal(state.levels[15], 0);
  assert.equal(state.levels[4], 0);
  assert.equal(state.levels[8], 0);
  assert.equal(state.levels[18], 0);

  // Press BOOT (GPIO0 -> LOW=0, !BOOT=1, XOR=1, AND=0)
  state = setButtonState(state, 0, true);
  assert.equal(state.levels[0], 0);
  assert.equal(state.levels[4], 1);
  assert.equal(state.levels[18], 1);
  assert.equal(state.levels[8], 0);

  // Also press BTN2 (GPIO15 -> HIGH=1, AND=1, XOR=0)
  state = setButtonState(state, 15, true);
  assert.equal(state.levels[15], 1);
  assert.equal(state.levels[5], 1);
  assert.equal(state.levels[8], 1);
  assert.equal(state.levels[18], 0);
});

test("clock-divider and i2c-burst presets generate deterministic multi-channel transitions", () => {
  let state = setLogicPreset(createInitialLogicState(), "clock-divider");
  for (let i = 0; i < 16; i += 1) {
    state = stepLogicAnalyzer(state);
  }
  const m4 = computeChannelMetrics(state.history[4]);
  const m5 = computeChannelMetrics(state.history[5]);
  assert.ok(m4.transitions > m5.transitions, "GPIO4 clock divides faster than GPIO5");

  let i2c = clearLogicHistory(setLogicPreset(createInitialLogicState(), "i2c-burst"));
  for (let i = 0; i < 16; i += 1) {
    i2c = stepLogicAnalyzer(i2c);
  }
  const sdaMetrics = computeChannelMetrics(i2c.history[8]);
  assert.ok(sdaMetrics.transitions >= 4, "I2C SDA should transition during burst");
  assert.ok(sdaMetrics.voltageLabel === "3.3V" || sdaMetrics.voltageLabel === "0.0V");
});
