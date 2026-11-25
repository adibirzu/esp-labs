import { useEffect, useRef, useState } from "react";
import type { SimType } from "../types";

interface LogicAnalyzerCanvasProps {
  simType: SimType;
  active: boolean;
  speed: number;
}

interface ChannelDef {
  name: string;
  color: string;
  rate: number;
  pseudo?: boolean;
}

const CHANNEL_PRESETS: Record<string, ChannelDef[]> = {
  sound: [
    { name: "BCLK", color: "#22d3ee", rate: 8 },
    { name: "LRC", color: "#a78bfa", rate: 2 },
    { name: "DIN", color: "#34d399", rate: 5, pseudo: true },
    { name: "DMA", color: "#fbbf24", rate: 1 },
  ],
  rfid: [
    { name: "SCK", color: "#22d3ee", rate: 7 },
    { name: "MOSI", color: "#34d399", rate: 4, pseudo: true },
    { name: "MISO", color: "#a78bfa", rate: 4, pseudo: true },
    { name: "CS#", color: "#fbbf24", rate: 1 },
  ],
  display: [
    { name: "SCL", color: "#a78bfa", rate: 6 },
    { name: "SDA", color: "#22d3ee", rate: 3, pseudo: true },
    { name: "ACK", color: "#34d399", rate: 2 },
    { name: "FPS", color: "#fbbf24", rate: 1 },
  ],
  default: [
    { name: "CLK", color: "#22d3ee", rate: 5 },
    { name: "TX0", color: "#34d399", rate: 3, pseudo: true },
    { name: "RF", color: "#a78bfa", rate: 4, pseudo: true },
    { name: "PWM", color: "#fbbf24", rate: 2 },
  ],
};

export function LogicAnalyzerCanvas({ simType, active, speed }: LogicAnalyzerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef(0);
  const [cursorX, setCursorX] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const channels = CHANNEL_PRESETS[simType] ?? CHANNEL_PRESETS.default;
    let rafId = 0;

    const draw = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const w = Math.max(240, parent.clientWidth);
        const h = 120;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
      }

      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = "#060a12";
      ctx.fillRect(0, 0, w, h);

      // Vertical timing grid
      ctx.strokeStyle = "rgba(148,163,184,0.1)";
      ctx.lineWidth = 1;
      for (let x = 48; x < w; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Row dividers
      const rowH = h / 4;
      for (let r = 1; r < 4; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * rowH);
        ctx.lineTo(w, r * rowH);
        ctx.stroke();
      }

      if (active) {
        phaseRef.current += 0.06 * speed;
      }

      channels.forEach((ch, idx) => {
        const baseY = idx * rowH + rowH * 0.78;
        const highY = idx * rowH + rowH * 0.24;

        ctx.fillStyle = ch.color;
        ctx.font = '600 10px "IBM Plex Mono", ui-monospace, monospace';
        ctx.fillText(ch.name, 8, idx * rowH + rowH * 0.62);

        ctx.strokeStyle = ch.color;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        let prevBit = 0;
        for (let x = 48; x < w; x += 4) {
          const t = (x * 0.035 + phaseRef.current) * ch.rate;
          const bit = ch.pseudo
            ? Math.sin(t) * Math.cos(t * 0.63 + idx) > 0
              ? 1
              : 0
            : Math.floor(t) % 2 === 0
              ? 1
              : 0;
          const y = bit ? highY : baseY;
          if (x === 48) {
            ctx.moveTo(x, y);
          } else {
            if (bit !== prevBit) ctx.lineTo(x, prevBit ? highY : baseY);
            ctx.lineTo(x, y);
          }
          prevBit = bit;
        }
        ctx.stroke();
      });

      // Interactive measurement crosshair
      if (cursorX !== null && cursorX >= 48 && cursorX <= w) {
        ctx.strokeStyle = "rgba(226,232,240,0.45)";
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(cursorX, 0);
        ctx.lineTo(cursorX, h);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [simType, active, speed, cursorX]);

  const timeUs = cursorX !== null && cursorX >= 48 ? Math.round(((cursorX - 48) * 1.25) / speed) : null;

  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-[#060a12]">
      <canvas
        ref={canvasRef}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setCursorX(e.clientX - rect.left);
        }}
        onMouseLeave={() => setCursorX(null)}
        className="w-full h-[120px] block cursor-crosshair"
      />
      {timeUs !== null && (
        <div className="pointer-events-none absolute top-1.5 right-2 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-mono text-cyan-300 tabular-nums">
          Δt = +{timeUs} µs
        </div>
      )}
    </div>
  );
}
