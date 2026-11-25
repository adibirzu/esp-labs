import { Cable, Pause, Play, RotateCcw, StepForward } from "lucide-react";
import {
  computeChannelMetrics,
  GPIO_CHANNELS,
  type GpioPinId,
  type LogicAnalyzerState,
  type LogicLevel,
  type SignalGeneratorPreset,
} from "../logic/logic-analyzer";
import type { Lang } from "../types";

interface LogicAnalyzerPanelProps {
  lang: Lang;
  state: LogicAnalyzerState;
  isLogicWiresActive: boolean;
  onToggleOutput: (pin: 4 | 5 | 8 | 18) => void;
  onButtonChange: (pin: 0 | 15, pressed: boolean) => void;
  onPresetChange: (preset: SignalGeneratorPreset) => void;
  onToggleRun: () => void;
  onStepOnce: () => void;
  onClearHistory: () => void;
  onToggleLogicWires: () => void;
}

function buildStepWaveformPath(
  samples: LogicLevel[],
  width: number,
  topY: number,
  bottomY: number,
): string {
  if (samples.length === 0) return "";
  const stepX = width / Math.max(1, samples.length - 1);
  let d = `M 0 ${samples[0] === 1 ? topY : bottomY}`;
  for (let i = 1; i < samples.length; i += 1) {
    const x = +(i * stepX).toFixed(2);
    const prevY = samples[i - 1] === 1 ? topY : bottomY;
    const nextY = samples[i] === 1 ? topY : bottomY;
    d += ` L ${x} ${prevY}`;
    if (nextY !== prevY) {
      d += ` L ${x} ${nextY}`;
    }
  }
  return d;
}

export function LogicAnalyzerPanel({
  lang,
  state,
  isLogicWiresActive,
  onToggleOutput,
  onButtonChange,
  onPresetChange,
  onToggleRun,
  onStepOnce,
  onClearHistory,
  onToggleLogicWires,
}: LogicAnalyzerPanelProps) {
  const isRo = lang === "ro";
  const ledChannels = GPIO_CHANNELS.filter((c) => c.role === "led") as (
    (typeof GPIO_CHANNELS)[number] & { pin: 4 | 5 | 8 | 18 }
  )[];
  const buttonChannels = GPIO_CHANNELS.filter((c) => c.role === "button") as (
    (typeof GPIO_CHANNELS)[number] & { pin: 0 | 15 }
  )[];

  const presets: { id: SignalGeneratorPreset; label: string }[] = [
    { id: "manual", label: isRo ? "Manual" : "Manual" },
    { id: "button-mirror", label: isRo ? "Porți Logice (Butoane)" : "Logic Gates (Btns)" },
    { id: "clock-divider", label: "CLK ÷1/2/4/8" },
    { id: "i2c-burst", label: "I2C Burst" },
    { id: "pwm-sweep", label: "PWM Sweep" },
  ];

  const svgWidth = 380;
  const rowHeight = 22;
  const svgHeight = GPIO_CHANNELS.length * rowHeight;

  return (
    <div className="space-y-2.5" data-testid="logic-analyzer-panel">
      {/* Toolbar: Signal Presets + Clock Run/Pause/Step + 3D GPIO Wires */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPresetChange(p.id)}
              aria-pressed={state.preset === p.id}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition-colors ${
                state.preset === p.id
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleRun}
            aria-pressed={state.running}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
              state.running
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            {state.running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{state.running ? (isRo ? "Pauză" : "Pause") : isRo ? "Pornește" : "Run"}</span>
          </button>

          <button
            type="button"
            onClick={onStepOnce}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-700 hover:border-cyan-500 text-[11px] font-semibold text-slate-200 cursor-pointer"
          >
            <StepForward className="w-3 h-3" />
            <span>{isRo ? "Pas" : "Step"}</span>
          </button>

          <button
            type="button"
            onClick={onToggleLogicWires}
            aria-pressed={isLogicWiresActive}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer ${
              isLogicWiresActive
                ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                : "border-slate-700 text-slate-300 hover:border-cyan-500"
            }`}
          >
            <Cable className="w-3 h-3" />
            <span>{isRo ? "Fire GPIO" : "GPIO Wires"}</span>
          </button>

          <button
            type="button"
            onClick={onClearHistory}
            aria-label={isRo ? "Curăță graficul logic" : "Clear logic trace"}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-700 hover:border-slate-500 text-[11px] font-semibold text-slate-300 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Split: Interactive Virtual Board LEDs & Buttons | Live 6-Channel Timing Trace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch">
        {/* Left: Virtual LEDs & Pushbuttons mirroring the 3D Breadboard */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/90 p-2.5">
          {/* 4 Output LEDs */}
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1.5">
              <span>{isRo ? "LED-uri Virtuale (Ieșiri GPIO)" : "Virtual Board LEDs (GPIO Outputs)"}</span>
              <span className="text-cyan-400">
                {isRo ? `Tranziții: ${state.edgeCount}` : `Edges: ${state.edgeCount}`}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {ledChannels.map((ch) => {
                const isHigh = state.levels[ch.pin] === 1;
                return (
                  <button
                    key={ch.pin}
                    type="button"
                    onClick={() => onToggleOutput(ch.pin)}
                    aria-pressed={isHigh}
                    title={isRo ? ch.descriptionRo : ch.descriptionEn}
                    className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
                      isHigh
                        ? "bg-slate-800 border-slate-500 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 border"
                        style={{
                          backgroundColor: isHigh ? ch.color : "#1e293b",
                          borderColor: ch.color,
                          boxShadow: isHigh ? `0 0 8px ${ch.color}` : "none",
                        }}
                      />
                      <span className="text-[11px] font-mono font-bold truncate">{ch.label}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isHigh ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {isHigh ? "HIGH" : "LOW"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2 Tactile Input Pushbuttons */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1.5">
              {isRo
                ? "Butoane Virtuale (Apasă / Ține Apăsat sau Click pe Placă)"
                : "Virtual Board Buttons (Press & Hold or Click 3D Board)"}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {buttonChannels.map((ch) => {
                const pressed = state.buttonPressed[ch.pin];
                const level = state.levels[ch.pin];
                return (
                  <button
                    key={ch.pin}
                    type="button"
                    onPointerDown={() => onButtonChange(ch.pin, true)}
                    onPointerUp={() => onButtonChange(ch.pin, false)}
                    onPointerLeave={() => {
                      if (pressed) onButtonChange(ch.pin, false);
                    }}
                    onClick={(e) => {
                      // Keyboard activation (Enter/Space) toggles latch for 350ms
                      if (e.detail === 0) {
                        onButtonChange(ch.pin, !pressed);
                      }
                    }}
                    aria-pressed={pressed}
                    title={isRo ? ch.descriptionRo : ch.descriptionEn}
                    className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg border text-left transition-colors cursor-pointer select-none ${
                      pressed
                        ? "bg-amber-500/20 border-amber-400 text-amber-200"
                        : "bg-slate-950 border-slate-700 text-slate-200 hover:border-cyan-500"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] font-mono font-bold truncate">{ch.shortName}</div>
                      <div className="text-[9px] font-mono text-slate-400">
                        {ch.pin === 0 ? "PULL-UP" : "PULL-DN"}
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: level === 1 ? "rgba(56,189,248,0.18)" : "rgba(30,41,59,0.9)",
                        color: level === 1 ? ch.color : "#94a3b8",
                      }}
                    >
                      {level === 1 ? "3.3V" : "0.0V"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Real-Time 6-Channel Digital Signal Timing Diagram */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-950 p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
            <span>
              {isRo
                ? "ANALIZOR STARE LOGICĂ · 6 CANALE TIMP REAL (3.3V CMOS)"
                : "REAL-TIME 6-CHANNEL LOGIC STATE TRACE (3.3V CMOS)"}
            </span>
            <span className="text-emerald-400">
              {state.running ? "LIVE 5 Hz" : isRo ? "ÎNGHEȚAT" : "HOLD"} · T={state.sampleTick}
            </span>
          </div>

          <div className="flex items-stretch gap-2">
            {/* Channel Labels + Duty / Voltage Readout */}
            <div className="w-[106px] shrink-0 flex flex-col justify-between">
              {GPIO_CHANNELS.map((ch) => {
                const metrics = computeChannelMetrics(state.history[ch.pin as GpioPinId]);
                const level = state.levels[ch.pin as GpioPinId];
                return (
                  <div
                    key={ch.pin}
                    className="h-[22px] flex items-center justify-between text-[10px] font-mono leading-none"
                  >
                    <span className="font-bold" style={{ color: ch.color }}>
                      {ch.label}
                    </span>
                    <span className="text-slate-400">
                      {level === 1 ? "1" : "0"} · {metrics.dutyPercent}%
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Digital Square-Wave Timing SVG */}
            <div className="flex-1 overflow-hidden rounded-lg border border-slate-800 bg-[#070d19]">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                preserveAspectRatio="none"
                className="w-full h-[132px] block"
                role="img"
                aria-label={
                  isRo
                    ? "Grafic timp real al semnalelor digitale GPIO"
                    : "Real-time GPIO digital signal timing waveform"
                }
              >
                {/* Vertical time division grid */}
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <line
                    key={i}
                    x1={(svgWidth / 8) * i}
                    y1={0}
                    x2={(svgWidth / 8) * i}
                    y2={svgHeight}
                    stroke="#1e293b"
                    strokeWidth="0.8"
                    strokeDasharray="2 3"
                  />
                ))}

                {/* Per-channel row divider + crisp 90-degree digital waveform */}
                {GPIO_CHANNELS.map((ch, idx) => {
                  const rowTop = idx * rowHeight;
                  const highY = rowTop + 4.5;
                  const lowY = rowTop + rowHeight - 4.5;
                  const pathD = buildStepWaveformPath(
                    state.history[ch.pin],
                    svgWidth,
                    highY,
                    lowY,
                  );
                  return (
                    <g key={ch.pin}>
                      {idx > 0 && (
                        <line
                          x1={0}
                          y1={rowTop}
                          x2={svgWidth}
                          y2={rowTop}
                          stroke="#111c30"
                          strokeWidth="1"
                        />
                      )}
                      <path
                        d={pathD}
                        fill="none"
                        stroke={ch.color}
                        strokeWidth="1.9"
                        strokeLinejoin="miter"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
