export type GpioPinId = 4 | 5 | 8 | 18 | 15 | 0;
export type LogicLevel = 0 | 1;

export type SignalGeneratorPreset =
  | "manual"
  | "clock-divider"
  | "i2c-burst"
  | "pwm-sweep"
  | "button-mirror";

export interface GpioChannelConfig {
  pin: GpioPinId;
  label: string;
  shortName: string;
  role: "led" | "button";
  direction: "OUTPUT" | "INPUT_PULLUP" | "INPUT_PULLDOWN";
  color: string;
  descriptionEn: string;
  descriptionRo: string;
}

export interface LogicAnalyzerState {
  levels: Record<GpioPinId, LogicLevel>;
  buttonPressed: Record<0 | 15, boolean>;
  history: Record<GpioPinId, LogicLevel[]>;
  sampleTick: number;
  running: boolean;
  preset: SignalGeneratorPreset;
  edgeCount: number;
}

export interface ChannelMetrics {
  dutyPercent: number;
  transitions: number;
  voltageLabel: string;
}

export const HISTORY_LENGTH = 44;

export const GPIO_CHANNELS: GpioChannelConfig[] = [
  {
    pin: 4,
    label: "GPIO4",
    shortName: "LED1 · RED",
    role: "led",
    direction: "OUTPUT",
    color: "#ef4444",
    descriptionEn: "Red 5mm Breadboard LED (Output / CLK ÷1 / !BOOT)",
    descriptionRo: "LED Roșu 5mm pe Breadboard (Ieșire / CLK ÷1 / !BOOT)",
  },
  {
    pin: 5,
    label: "GPIO5",
    shortName: "LED2 · GRN",
    role: "led",
    direction: "OUTPUT",
    color: "#10b981",
    descriptionEn: "Green 5mm Breadboard LED (Output / CLK ÷2 / I2C SCL)",
    descriptionRo: "LED Verde 5mm pe Breadboard (Ieșire / CLK ÷2 / I2C SCL)",
  },
  {
    pin: 8,
    label: "GPIO8",
    shortName: "LED3 · CYN",
    role: "led",
    direction: "OUTPUT",
    color: "#06b6d4",
    descriptionEn: "Cyan 5mm Breadboard LED (Output / I2C SDA / AND Gate)",
    descriptionRo: "LED Cyan 5mm pe Breadboard (Ieșire / I2C SDA / Poartă AND)",
  },
  {
    pin: 18,
    label: "GPIO18",
    shortName: "LED4 · AMB",
    role: "led",
    direction: "OUTPUT",
    color: "#f59e0b",
    descriptionEn: "Amber 5mm Breadboard LED (Output / PWM / XOR Gate)",
    descriptionRo: "LED Chihlimbar 5mm pe Breadboard (Ieșire / PWM / Poartă XOR)",
  },
  {
    pin: 0,
    label: "GPIO0",
    shortName: "BTN1 · BOOT",
    role: "button",
    direction: "INPUT_PULLUP",
    color: "#38bdf8",
    descriptionEn: "Active-LOW Pull-Up Pushbutton (HIGH=3.3V idle, LOW=0V pressed)",
    descriptionRo: "Buton Active-LOW cu Pull-Up (HIGH=3.3V liber, LOW=0V apăsat)",
  },
  {
    pin: 15,
    label: "GPIO15",
    shortName: "BTN2 · IN",
    role: "button",
    direction: "INPUT_PULLDOWN",
    color: "#a855f7",
    descriptionEn: "Active-HIGH Pull-Down Pushbutton (LOW=0V idle, HIGH=3.3V pressed)",
    descriptionRo: "Buton Active-HIGH cu Pull-Down (LOW=0V liber, HIGH=3.3V apăsat)",
  },
];

function createFilledHistory(level: LogicLevel): LogicLevel[] {
  return Array.from({ length: HISTORY_LENGTH }, () => level);
}

function appendSample(
  prevHistory: Record<GpioPinId, LogicLevel[]>,
  nextLevels: Record<GpioPinId, LogicLevel>,
): { history: Record<GpioPinId, LogicLevel[]>; newEdges: number } {
  const nextHistory = {} as Record<GpioPinId, LogicLevel[]>;
  let newEdges = 0;
  for (const ch of GPIO_CHANNELS) {
    const arr = prevHistory[ch.pin];
    const lastVal = arr[arr.length - 1];
    const nextVal = nextLevels[ch.pin];
    if (lastVal !== nextVal) newEdges += 1;
    nextHistory[ch.pin] = [...arr.slice(1), nextVal];
  }
  return { history: nextHistory, newEdges };
}

function applyCombinationalLogic(
  levels: Record<GpioPinId, LogicLevel>,
  buttonPressed: Record<0 | 15, boolean>,
): Record<GpioPinId, LogicLevel> {
  const btn0Active: LogicLevel = buttonPressed[0] ? 1 : 0;
  const btn15Active: LogicLevel = buttonPressed[15] ? 1 : 0;
  return {
    ...levels,
    0: buttonPressed[0] ? 0 : 1, // Active-LOW pull-up
    15: btn15Active, // Active-HIGH pull-down
    4: btn0Active, // !GPIO0
    5: btn15Active, // Follower GPIO15
    8: btn0Active && btn15Active ? 1 : 0, // AND
    18: btn0Active !== btn15Active ? 1 : 0, // XOR
  };
}

export function createInitialLogicState(): LogicAnalyzerState {
  const levels: Record<GpioPinId, LogicLevel> = {
    4: 1,
    5: 0,
    8: 1,
    18: 0,
    0: 1, // Pull-up HIGH when unpressed
    15: 0, // Pull-down LOW when unpressed
  };
  return {
    levels,
    buttonPressed: { 0: false, 15: false },
    history: {
      4: createFilledHistory(levels[4]),
      5: createFilledHistory(levels[5]),
      8: createFilledHistory(levels[8]),
      18: createFilledHistory(levels[18]),
      0: createFilledHistory(levels[0]),
      15: createFilledHistory(levels[15]),
    },
    sampleTick: 0,
    running: true,
    preset: "manual",
    edgeCount: 0,
  };
}

export function toggleGpioOutput(
  state: LogicAnalyzerState,
  pin: 4 | 5 | 8 | 18,
): LogicAnalyzerState {
  const toggled: LogicLevel = state.levels[pin] === 1 ? 0 : 1;
  const nextLevels: Record<GpioPinId, LogicLevel> = {
    ...state.levels,
    [pin]: toggled,
  };
  const { history, newEdges } = appendSample(state.history, nextLevels);
  return {
    ...state,
    preset: "manual",
    levels: nextLevels,
    history,
    sampleTick: state.sampleTick + 1,
    edgeCount: state.edgeCount + newEdges,
  };
}

export function setButtonState(
  state: LogicAnalyzerState,
  pin: 0 | 15,
  pressed: boolean,
): LogicAnalyzerState {
  const nextPressed: Record<0 | 15, boolean> = {
    ...state.buttonPressed,
    [pin]: pressed,
  };
  let nextLevels: Record<GpioPinId, LogicLevel> = {
    ...state.levels,
    0: nextPressed[0] ? 0 : 1,
    15: nextPressed[15] ? 1 : 0,
  };
  if (state.preset === "button-mirror") {
    nextLevels = applyCombinationalLogic(nextLevels, nextPressed);
  }
  const { history, newEdges } = appendSample(state.history, nextLevels);
  return {
    ...state,
    buttonPressed: nextPressed,
    levels: nextLevels,
    history,
    sampleTick: state.sampleTick + 1,
    edgeCount: state.edgeCount + newEdges,
  };
}

// 16-step I2C Start -> Address 0x3C -> ACK -> Data -> Stop bit sequence
const I2C_SCL_PATTERN: LogicLevel[] = [1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1];
const I2C_SDA_PATTERN: LogicLevel[] = [1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 1];

export function stepLogicAnalyzer(state: LogicAnalyzerState): LogicAnalyzerState {
  const nextTick = state.sampleTick + 1;
  let nextLevels: Record<GpioPinId, LogicLevel> = {
    ...state.levels,
    0: state.buttonPressed[0] ? 0 : 1,
    15: state.buttonPressed[15] ? 1 : 0,
  };

  if (state.preset === "clock-divider") {
    nextLevels[4] = (nextTick & 1) ? 1 : 0;
    nextLevels[5] = ((nextTick >> 1) & 1) ? 1 : 0;
    nextLevels[8] = ((nextTick >> 2) & 1) ? 1 : 0;
    nextLevels[18] = ((nextTick >> 3) & 1) ? 1 : 0;
  } else if (state.preset === "i2c-burst") {
    const idx = nextTick % I2C_SCL_PATTERN.length;
    nextLevels[5] = I2C_SCL_PATTERN[idx];
    nextLevels[8] = I2C_SDA_PATTERN[idx];
    nextLevels[4] = idx >= 1 && idx <= 14 ? 1 : 0; // Active transaction LED
    nextLevels[18] = idx === 11 ? 1 : 0; // ACK pulse
  } else if (state.preset === "pwm-sweep") {
    const phase = nextTick % 8;
    // Duty cycle sweeps 25% -> 50% -> 75% every 8 ticks
    const step = Math.floor(nextTick / 8) % 3;
    const dutyTicks = step === 0 ? 2 : step === 1 ? 4 : 6;
    nextLevels[4] = phase < dutyTicks ? 1 : 0;
    nextLevels[18] = phase < 8 - dutyTicks ? 1 : 0;
    nextLevels[5] = phase < 4 ? 1 : 0; // 50% reference clock
    nextLevels[8] = phase === 0 ? 1 : 0; // Frame sync pulse
  } else if (state.preset === "button-mirror") {
    nextLevels = applyCombinationalLogic(nextLevels, state.buttonPressed);
  }

  const { history, newEdges } = appendSample(state.history, nextLevels);
  return {
    ...state,
    levels: nextLevels,
    history,
    sampleTick: nextTick,
    edgeCount: state.edgeCount + newEdges,
  };
}

export function setLogicPreset(
  state: LogicAnalyzerState,
  preset: SignalGeneratorPreset,
): LogicAnalyzerState {
  const base: LogicAnalyzerState = {
    ...state,
    preset,
    running: preset === "manual" ? state.running : true,
  };
  if (preset === "button-mirror") {
    const nextLevels = applyCombinationalLogic(base.levels, base.buttonPressed);
    const { history, newEdges } = appendSample(base.history, nextLevels);
    return {
      ...base,
      levels: nextLevels,
      history,
      sampleTick: base.sampleTick + 1,
      edgeCount: base.edgeCount + newEdges,
    };
  }
  return base;
}

export function clearLogicHistory(state: LogicAnalyzerState): LogicAnalyzerState {
  return {
    ...state,
    history: {
      4: createFilledHistory(state.levels[4]),
      5: createFilledHistory(state.levels[5]),
      8: createFilledHistory(state.levels[8]),
      18: createFilledHistory(state.levels[18]),
      0: createFilledHistory(state.levels[0]),
      15: createFilledHistory(state.levels[15]),
    },
    edgeCount: 0,
  };
}

export function computeChannelMetrics(samples: LogicLevel[]): ChannelMetrics {
  if (samples.length === 0) {
    return { dutyPercent: 0, transitions: 0, voltageLabel: "0.0V" };
  }
  let highCount = 0;
  let transitions = 0;
  for (let i = 0; i < samples.length; i += 1) {
    if (samples[i] === 1) highCount += 1;
    if (i > 0 && samples[i] !== samples[i - 1]) transitions += 1;
  }
  const latest = samples[samples.length - 1];
  return {
    dutyPercent: Math.round((highCount / samples.length) * 100),
    transitions,
    voltageLabel: latest === 1 ? "3.3V" : "0.0V",
  };
}
