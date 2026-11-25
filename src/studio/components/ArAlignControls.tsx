import {
  FlipHorizontal2,
  Grid,
  Lock,
  RefreshCw,
  RotateCcw,
  SwitchCamera,
  Unlock,
} from "lucide-react";
import {
  formatRealScaleReadout,
  type ArAlignmentState,
  type ArPresetId,
} from "../logic/ar-alignment";
import type { Lang } from "../types";

interface ArAlignControlsProps {
  lang: Lang;
  alignment: ArAlignmentState;
  hasLiveCamera: boolean;
  onChange: (patch: Partial<ArAlignmentState>) => void;
  onPreset: (preset: ArPresetId) => void;
  onReset: () => void;
  onSwitchCamera: () => void;
}

export function ArAlignControls({
  lang,
  alignment,
  hasLiveCamera,
  onChange,
  onPreset,
  onReset,
  onSwitchCamera,
}: ArAlignControlsProps) {
  const isRo = lang === "ro";
  const readout = formatRealScaleReadout(alignment.deskScale);

  return (
    <div className="space-y-2.5">
      {/* Row 1: Quick Desk Angle Presets + Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              {
                id: "seated-45" as const,
                label: isRo ? "Birou 45°" : "Seated 45°",
              },
              {
                id: "overhead-desk" as const,
                label: isRo ? "De Sus (Top-Down)" : "Overhead Desk",
              },
              {
                id: "close-pin-match" as const,
                label: isRo ? "Aliniere Pini (X-Ray)" : "Pin Match (X-Ray)",
              },
            ] as const
          ).map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onPreset(preset.id)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-emerald-400 text-[11px] font-semibold text-slate-200 cursor-pointer transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange({ lockDeskAlignment: !alignment.lockDeskAlignment })}
            aria-pressed={alignment.lockDeskAlignment}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors ${
              alignment.lockDeskAlignment
                ? "bg-amber-500/20 border-amber-500 text-amber-300"
                : "border-slate-700 text-slate-300 hover:border-cyan-500"
            }`}
          >
            {alignment.lockDeskAlignment ? (
              <Lock className="w-3 h-3" />
            ) : (
              <Unlock className="w-3 h-3" />
            )}
            <span>{isRo ? "Blochează Plan" : "Lock Plane"}</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ showCalibrationGrid: !alignment.showCalibrationGrid })}
            aria-pressed={alignment.showCalibrationGrid}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors ${
              alignment.showCalibrationGrid
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                : "border-slate-700 text-slate-300 hover:border-cyan-500"
            }`}
          >
            <Grid className="w-3 h-3" />
            <span>{isRo ? "Grilă mm" : "mm Grid"}</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ mirrorVideo: !alignment.mirrorVideo })}
            aria-pressed={alignment.mirrorVideo}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors ${
              alignment.mirrorVideo
                ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                : "border-slate-700 text-slate-300 hover:border-cyan-500"
            }`}
          >
            <FlipHorizontal2 className="w-3 h-3" />
            <span>{isRo ? "Oglindă" : "Mirror"}</span>
          </button>

          {hasLiveCamera && (
            <button
              type="button"
              onClick={onSwitchCamera}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700 hover:border-cyan-500 text-[11px] font-semibold text-slate-200 cursor-pointer"
            >
              <SwitchCamera className="w-3 h-3" />
              <span>
                {alignment.facingMode === "environment"
                  ? isRo
                    ? "Cameră Față"
                    : "Front Cam"
                  : isRo
                    ? "Cameră Spate"
                    : "Rear Cam"}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700 hover:border-cyan-500 text-[11px] font-semibold text-slate-300 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{isRo ? "Reset AR" : "Reset AR"}</span>
          </button>
        </div>
      </div>

      {/* Row 2: Precision Desk Calibration Sliders */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        <label className="flex flex-col gap-1 text-[11px] text-slate-300">
          <div className="flex items-center justify-between font-mono">
            <span>{isRo ? "Scară Reală" : "Real Scale"}</span>
            <span className="text-emerald-400">{readout.scalePercent}%</span>
          </div>
          <input
            type="range"
            min={0.45}
            max={2.2}
            step={0.05}
            value={alignment.deskScale}
            onChange={(e) => onChange({ deskScale: Number(e.target.value) })}
            className="accent-emerald-400 cursor-pointer"
          />
        </label>

        <label className="flex flex-col gap-1 text-[11px] text-slate-300">
          <div className="flex items-center justify-between font-mono">
            <span>{isRo ? "Înclinare Birou" : "Desk Tilt"}</span>
            <span className="text-cyan-400">{alignment.deskTiltDeg}°</span>
          </div>
          <input
            type="range"
            min={12}
            max={85}
            step={1}
            value={alignment.deskTiltDeg}
            onChange={(e) => onChange({ deskTiltDeg: Number(e.target.value) })}
            className="accent-cyan-400 cursor-pointer"
          />
        </label>

        <label className="flex flex-col gap-1 text-[11px] text-slate-300">
          <div className="flex items-center justify-between font-mono">
            <span>{isRo ? "Rotație Birou" : "Desk Yaw"}</span>
            <span className="text-cyan-400">{alignment.deskYawDeg}°</span>
          </div>
          <input
            type="range"
            min={-180}
            max={180}
            step={2}
            value={alignment.deskYawDeg}
            onChange={(e) => onChange({ deskYawDeg: Number(e.target.value) })}
            className="accent-cyan-400 cursor-pointer"
          />
        </label>

        <label className="flex flex-col gap-1 text-[11px] text-slate-300">
          <div className="flex items-center justify-between font-mono">
            <span>{isRo ? "Opacitate X-Ray" : "X-Ray Opacity"}</span>
            <span className="text-amber-400">{Math.round(alignment.modelOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.25}
            max={1}
            step={0.05}
            value={alignment.modelOpacity}
            onChange={(e) => onChange({ modelOpacity: Number(e.target.value) })}
            className="accent-amber-400 cursor-pointer"
          />
        </label>
      </div>

      {/* Row 3: Fine X / Z Shift + Real Scale Metric Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-0.5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-1.5 font-mono">
            <span>{isRo ? "Shift X" : "Shift X"}</span>
            <input
              type="range"
              min={-10}
              max={10}
              step={0.25}
              value={alignment.offsetX}
              onChange={(e) => onChange({ offsetX: Number(e.target.value) })}
              className="w-20 accent-cyan-400 cursor-pointer"
            />
          </label>
          <label className="inline-flex items-center gap-1.5 font-mono">
            <span>{isRo ? "Shift Z" : "Shift Z"}</span>
            <input
              type="range"
              min={-10}
              max={10}
              step={0.25}
              value={alignment.offsetZ}
              onChange={(e) => onChange({ offsetZ: Number(e.target.value) })}
              className="w-20 accent-cyan-400 cursor-pointer"
            />
          </label>
          <label className="inline-flex items-center gap-1.5 font-mono">
            <span>FOV</span>
            <input
              type="range"
              min={32}
              max={72}
              step={1}
              value={alignment.cameraFov}
              onChange={(e) => onChange({ cameraFov: Number(e.target.value) })}
              className="w-16 accent-slate-300 cursor-pointer"
            />
            <span>{alignment.cameraFov}°</span>
          </label>
        </div>

        <div className="inline-flex items-center gap-2 font-mono text-[10px] text-slate-400">
          <RefreshCw className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>{readout.esp32Label}</span>
          <span>·</span>
          <span>{readout.gridCellLabel}</span>
        </div>
      </div>
    </div>
  );
}
