import { useEffect, useRef, useState } from "react";
import {
  Lock,
  Music,
  Radio,
  RefreshCw,
  Send,
  Unlock,
  Volume2,
  VolumeX,
  Wifi,
} from "lucide-react";
import type { SimType } from "../types";

interface SimProps {
  onLog: (msg: string) => void;
}

type OscillatorWave = "sine" | "square" | "sawtooth" | "triangle";

// ============================================================================
// 1. SOUND SIMULATOR (WEB AUDIO API SYNTH + LIVE OSCILLOSCOPE)
// ============================================================================
export function SoundSimulator({ onLog }: SimProps) {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [waveform, setWaveform] = useState<OscillatorWave>("sine");
  const [freq, setFreq] = useState(440);
  const [volume, setVolume] = useState(0.2);
  const [playingArp, setPlayingArp] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const arpTimerRef = useRef<number | null>(null);

  const stopAudio = () => {
    try {
      if (oscRef.current) oscRef.current.stop();
      if (audioCtxRef.current) void audioCtxRef.current.close();
    } catch {
      // Ignore audio teardown errors
    }
    audioCtxRef.current = null;
    oscRef.current = null;
    gainRef.current = null;
    analyserRef.current = null;
  };

  const toggleAudio = () => {
    try {
      if (!audioEnabled) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;

        osc.type = waveform;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(volume, ctx.currentTime);

        osc.connect(gain);
        gain.connect(analyser);
        analyser.connect(ctx.destination);
        osc.start();

        audioCtxRef.current = ctx;
        oscRef.current = osc;
        gainRef.current = gain;
        analyserRef.current = analyser;
        setAudioEnabled(true);
        onLog(`I2S TX unmuted: ${waveform.toUpperCase()} @ ${freq} Hz (Web Audio API)`);
      } else {
        stopAudio();
        setAudioEnabled(false);
        onLog("I2S TX muted (GDMA buffer zero-filled)");
      }
    } catch {
      onLog("WARN: Web Audio API blocked or unavailable in this browser context");
    }
  };

  useEffect(() => {
    if (oscRef.current && audioCtxRef.current) {
      oscRef.current.type = waveform;
      oscRef.current.frequency.setTargetAtTime(freq, audioCtxRef.current.currentTime, 0.02);
    }
    if (gainRef.current && audioCtxRef.current) {
      gainRef.current.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.02);
    }
  }, [waveform, freq, volume]);

  useEffect(() => {
    return () => {
      if (arpTimerRef.current) window.clearInterval(arpTimerRef.current);
      stopAudio();
    };
  }, []);

  const toggleArpeggio = () => {
    if (playingArp) {
      if (arpTimerRef.current) window.clearInterval(arpTimerRef.current);
      arpTimerRef.current = null;
      setPlayingArp(false);
      onLog("Step sequencer stopped");
      return;
    }
    const sequence = [262, 330, 392, 523, 392, 330];
    let step = 0;
    setPlayingArp(true);
    setFreq(sequence[0]);
    onLog("Step sequencer started: C-Major arpeggio (180 ms/step)");
    arpTimerRef.current = window.setInterval(() => {
      step = (step + 1) % sequence.length;
      setFreq(sequence[step]);
    }, 180);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let phase = 0;

    const render = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const w = Math.max(240, parent.clientWidth);
        if (canvas.width !== w || canvas.height !== 148) {
          canvas.width = w;
          canvas.height = 148;
        }
      }
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = "#060a12";
      ctx.fillRect(0, 0, w, h);

      // Subtle oscilloscope reticle
      ctx.strokeStyle = "rgba(34,211,238,0.12)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      ctx.strokeStyle = audioEnabled ? "#fb7185" : "#22d3ee";
      ctx.lineWidth = 2.1;
      ctx.beginPath();

      if (audioEnabled && analyserRef.current) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteTimeDomainData(dataArray);
        const sliceWidth = w / bufferLength;
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * h) / 2;
          if (i === 0) ctx.moveTo(0, y);
          else ctx.lineTo(i * sliceWidth, y);
        }
      } else {
        phase += 0.05;
        const cycles = (freq / 220) * 2.2;
        const amp = h * 0.34 * Math.max(0.2, volume * 2.2);
        for (let x = 0; x < w; x++) {
          const t = (x / w) * cycles * Math.PI * 2 + phase;
          let sample: number;
          if (waveform === "sine") sample = Math.sin(t);
          else if (waveform === "square") sample = Math.sin(t) >= 0 ? 1 : -1;
          else if (waveform === "sawtooth")
            sample = 2 * (t / (2 * Math.PI) - Math.floor(0.5 + t / (2 * Math.PI)));
          else sample = (2 / Math.PI) * Math.asin(Math.sin(t));
          const y = h / 2 - sample * amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [audioEnabled, waveform, freq, volume]);

  const notes = [
    { label: "C4", hz: 262 },
    { label: "D4", hz: 294 },
    { label: "E4", hz: 330 },
    { label: "F4", hz: 349 },
    { label: "G4", hz: 392 },
    { label: "A4", hz: 440 },
    { label: "B4", hz: 494 },
    { label: "C5", hz: 523 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-rose-600 dark:text-rose-400">I2S0 · 44.1 kHz · 16-bit PCM</span>
          <span>/</span>
          <span className="tabular-nums text-slate-900 dark:text-slate-200">{freq} Hz</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleArpeggio}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
              playingArp
                ? "bg-cyan-500/15 border-cyan-500 text-cyan-600 dark:text-cyan-300"
                : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-cyan-500"
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            {playingArp ? "Stop Sequence" : "Play Sequence"}
          </button>
          <button
            type="button"
            onClick={toggleAudio}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              audioEnabled
                ? "bg-rose-600 text-white hover:bg-rose-700"
                : "bg-emerald-600 text-white hover:bg-emerald-500"
            }`}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            {audioEnabled ? "Mute Speaker" : "Enable Live Audio"}
          </button>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-slate-800 relative bg-[#060a12]">
        <canvas ref={canvasRef} className="w-full h-[148px] block" />
        <div className="absolute top-2 left-3 text-[10px] font-mono text-cyan-400/90 tracking-wide">
          Oscilloscope · {audioEnabled ? "Live Web Audio" : "Synthesized Preview (Muted)"}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">
            Waveform
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(["sine", "square", "sawtooth", "triangle"] as const).map((w) => (
              <button
                type="button"
                key={w}
                onClick={() => {
                  setWaveform(w);
                  onLog(`Synth waveform -> ${w.toUpperCase()}`);
                }}
                className={`py-1.5 rounded-lg text-xs font-mono capitalize border transition-colors cursor-pointer ${
                  waveform === w
                    ? "bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300 font-semibold"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5">
            <span>Frequency</span>
            <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-400 tabular-nums">
              {freq} Hz
            </span>
          </div>
          <input
            type="range"
            min="110"
            max="1760"
            value={freq}
            onChange={(e) => setFreq(Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <div className="flex gap-1 mt-2 flex-wrap">
            {notes.map((n) => (
              <button
                type="button"
                key={n.label}
                onClick={() => {
                  setFreq(n.hz);
                  onLog(`Note trigger: ${n.label} (${n.hz} Hz)`);
                }}
                className={`px-2 py-0.5 rounded text-xs font-mono border transition-colors cursor-pointer ${
                  freq === n.hz
                    ? "bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300"
                    : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-cyan-500"
                }`}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
          <span>MAX98357A Gain / Volume</span>
          <span className="font-mono tabular-nums">{Math.round(volume * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.02"
          max="0.5"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full accent-rose-500"
        />
      </div>
    </div>
  );
}

// ============================================================================
// 2. DISPLAY SIMULATOR (128x64 SSD1306 OLED PIXEL CANVAS)
// ============================================================================
export function DisplaySimulator({ onLog }: SimProps) {
  const [mode, setMode] = useState<"telemetry" | "text" | "graphics">("telemetry");
  const [power, setPower] = useState(true);
  const [inverted, setInverted] = useState(false);
  const [contrast, setContrast] = useState(220);
  const [customText, setCustomText] = useState("HELLO ESP32-S3!");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let tick = 0;
    let bx = 24;
    let by = 24;
    let vx = 1.6;
    let vy = 1.2;

    const draw = () => {
      tick++;
      const scale = 3;
      const alpha = Math.max(0.25, contrast / 255);
      const pixelColor = `rgba(56, 189, 248, ${alpha.toFixed(2)})`;

      ctx.fillStyle = !power ? "#05070c" : inverted ? pixelColor : "#060c18";
      ctx.fillRect(0, 0, 128 * scale, 64 * scale);

      if (power) {
        const fg = inverted ? "#060c18" : pixelColor;
        ctx.fillStyle = fg;
        ctx.strokeStyle = fg;

        if (mode === "telemetry") {
          ctx.fillRect(0, 0, 128 * scale, 12 * scale);
          ctx.fillStyle = inverted ? pixelColor : "#060c18";
          ctx.font = 'bold 20px "IBM Plex Mono", ui-monospace, monospace';
          ctx.fillText("ESP32-S3  I2C:0x3C", 10, 26);

          ctx.fillStyle = fg;
          ctx.font = '18px "IBM Plex Mono", ui-monospace, monospace';
          ctx.fillText("HEAP: 342 KB  CPU:240M", 10, 64);
          ctx.fillText("RSSI: -52 dBm  OK", 10, 96);

          for (let i = 0; i < 12; i++) {
            const barH = 18 + Math.sin(tick * 0.08 + i * 0.6) * 16 + 18;
            ctx.fillRect(14 + i * 30, 178 - barH, 20, barH);
          }
        } else if (mode === "text") {
          ctx.lineWidth = 2;
          ctx.strokeRect(6, 6, 372, 180);
          ctx.font = 'bold 26px "IBM Plex Mono", ui-monospace, monospace';
          ctx.fillText(customText.slice(0, 16) || " ", 18, 92);
          ctx.font = '16px "IBM Plex Mono", ui-monospace, monospace';
          ctx.fillText("SSD1306 128x64 OLED", 18, 140);
          ctx.fillText(`FRAME #${tick}`, 18, 168);
        } else {
          bx += vx;
          by += vy;
          if (bx < 4 || bx > 106) vx *= -1;
          if (by < 4 || by > 46) vy *= -1;
          ctx.lineWidth = 2;
          ctx.strokeRect(bx * scale, by * scale, 18 * scale, 14 * scale);
          ctx.font = 'bold 18px "IBM Plex Mono", ui-monospace, monospace';
          ctx.fillText("S3", (bx + 3) * scale, (by + 10) * scale);

          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let x = 0; x < 128; x++) {
            const y = 32 + Math.sin(x * 0.14 + tick * 0.12) * 16;
            if (x === 0) ctx.moveTo(x * scale, y * scale);
            else ctx.lineTo(x * scale, y * scale);
          }
          ctx.stroke();
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [mode, power, inverted, customText, contrast]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center">
        <div className="p-3 rounded-xl bg-[#070b14] border-2 border-slate-700 max-w-full">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1.5 px-1">
            <span>GND VCC SCL SDA</span>
            <span>SSD1306 0.96&quot; · 128×64</span>
          </div>
          <canvas
            ref={canvasRef}
            width={384}
            height={192}
            className="w-full max-w-[384px] h-auto rounded border border-cyan-500/30 block"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {(
          [
            ["telemetry", "Telemetry"],
            ["text", "Custom Text"],
            ["graphics", "Animation"],
          ] as const
        ).map(([id, label]) => (
          <button
            type="button"
            key={id}
            onClick={() => {
              setMode(id);
              onLog(`OLED mode -> ${label}`);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              mode === id
                ? "bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300"
                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setInverted((v) => {
              onLog(`SSD1306 CMD 0x${!v ? "A7 (INVERT)" : "A6 (NORMAL)"}`);
              return !v;
            });
          }}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-cyan-500 cursor-pointer"
        >
          Invert Pixels
        </button>
        <button
          type="button"
          onClick={() => {
            setPower((v) => {
              onLog(`SSD1306 Display ${!v ? "ON (0xAF)" : "OFF (0xAE)"}`);
              return !v;
            });
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
            power
              ? "border-emerald-500/50 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10"
              : "border-rose-500/50 text-rose-600 dark:text-rose-400"
          }`}
        >
          {power ? "Display ON" : "Display OFF"}
        </button>
      </div>

      <div className="max-w-md mx-auto space-y-3">
        <div>
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
            <span>Contrast Register (0x81)</span>
            <span className="font-mono tabular-nums">0x{contrast.toString(16).toUpperCase().padStart(2, "0")}</span>
          </div>
          <input
            type="range"
            min="40"
            max="255"
            value={contrast}
            onChange={(e) => setContrast(Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
        </div>

        {mode === "text" && (
          <input
            type="text"
            maxLength={16}
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Type text for OLED (max 16 chars)..."
            className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-cyan-300 font-mono text-sm focus:outline-none focus:border-cyan-500"
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 3. RFID SIMULATOR (MFRC522 13.56MHz + EDITABLE WHITELIST + SECTOR HEX DUMP)
// ============================================================================
interface RfidTag {
  id: string;
  name: string;
  uid: string;
  type: string;
  sak: string;
  sectorHex: string;
}

const RFID_TAGS: RfidTag[] = [
  {
    id: "auth",
    name: "Authorized Card",
    uid: "04:A3:2B:9F",
    type: "MIFARE Classic 1K",
    sak: "0x08",
    sectorHex: "45 53 50 33 32 2D 4C 41 42 53 20 55 53 45 52 31",
  },
  {
    id: "admin",
    name: "Admin Keyfob",
    uid: "DE:AD:BE:EF",
    type: "MIFARE DESFire EV2",
    sak: "0x20",
    sectorHex: "41 44 4D 49 4E 5F 4B 45 59 5F 56 32 00 00 FF 07",
  },
  {
    id: "unknown",
    name: "Guest / Unknown Tag",
    uid: "7F:12:4C:08",
    type: "NTAG215",
    sak: "0x00",
    sectorHex: "01 03 A0 0C 34 03 00 FE 00 00 00 00 00 00 00 00",
  },
];

export function RfidSimulator({ onLog }: SimProps) {
  const [lastTag, setLastTag] = useState<RfidTag | null>(null);
  const [scanning, setScanning] = useState(false);
  const [whitelist, setWhitelist] = useState<string[]>(["04:A3:2B:9F", "DE:AD:BE:EF"]);

  const tapTag = (tag: RfidTag) => {
    setScanning(true);
    onLog("SPI2 TX -> REQA (0x26) | Tag detected in 13.56 MHz field");
    window.setTimeout(() => {
      const granted = whitelist.includes(tag.uid);
      setLastTag(tag);
      setScanning(false);
      onLog(
        `MFRC522 UID: [${tag.uid}] SAK=${tag.sak} -> ${
          granted ? "ACCESS GRANTED (GPIO48=GREEN)" : "ACCESS DENIED (GPIO48=RED)"
        }`,
      );
    }, 240);
  };

  const toggleWhitelist = (uid: string) => {
    setWhitelist((prev) => {
      const exists = prev.includes(uid);
      const next = exists ? prev.filter((x) => x !== uid) : [...prev, uid];
      onLog(`NVS Whitelist: ${exists ? "REVOKED" : "AUTHORIZED"} UID [${uid}]`);
      return next;
    });
  };

  const lastGranted = lastTag ? whitelist.includes(lastTag.uid) : false;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        <div
          className={`p-5 rounded-xl border text-center flex flex-col justify-center transition-colors ${
            scanning
              ? "border-amber-500 bg-amber-500/10"
              : lastTag
                ? lastGranted
                  ? "border-emerald-500/60 bg-emerald-500/10"
                  : "border-rose-500/60 bg-rose-500/10"
                : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60"
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Radio className={`w-5 h-5 ${scanning ? "text-amber-500" : "text-cyan-500"}`} />
            <span className="font-mono text-sm font-semibold">MFRC522 13.56 MHz Reader</span>
          </div>
          {lastTag ? (
            <div className="space-y-2 mt-2">
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold ${
                  lastGranted
                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                    : "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                }`}
              >
                {lastGranted ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                {lastGranted ? "ACCESS GRANTED" : "ACCESS DENIED"}
              </div>
              <div className="font-mono text-lg font-bold tracking-widest text-amber-600 dark:text-amber-300 tabular-nums">
                {lastTag.uid}
              </div>
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {lastTag.type} · SAK {lastTag.sak}
              </div>
              <div className="mt-2 p-2 rounded-lg bg-[#060a12] border border-slate-800 text-[10px] font-mono text-cyan-300 break-all">
                <div className="text-slate-500 mb-0.5">Sector 1 Block 4 (16B):</div>
                {lastTag.sectorHex}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Tap a virtual NFC/RFID tag on the right to simulate an SPI2 read transaction and inspect sector data.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Virtual Tags (Tap to Scan or Toggle Whitelist)
          </div>
          {RFID_TAGS.map((tag) => {
            const isAllowed = whitelist.includes(tag.uid);
            return (
              <div
                key={tag.id}
                className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{tag.name}</div>
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {tag.uid} · {tag.type}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleWhitelist(tag.uid)}
                    className={`px-2 py-1 rounded-md text-[11px] font-mono font-medium border cursor-pointer ${
                      isAllowed
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                    }`}
                    title="Toggle NVS Access Whitelist"
                  >
                    {isAllowed ? "Allowed" : "Blocked"}
                  </button>
                  <button
                    type="button"
                    onClick={() => tapTag(tag)}
                    className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer"
                  >
                    Tap
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. BLE 5.0 GATT EXPLORER SIMULATOR
// ============================================================================
export function BleSimulator({ onLog }: SimProps) {
  const [advertising, setAdvertising] = useState(true);
  const [connected, setConnected] = useState(true);
  const [txPower, setTxPower] = useState(3);
  const [charVal, setCharVal] = useState("TEMP:24.8C");
  const [ledChar, setLedChar] = useState("0x01");
  const [packets, setPackets] = useState(14);

  const rssi = -58 + txPower * 2;

  const toggleAdv = () => {
    setAdvertising((v) => {
      onLog(`BLE GAP Advertising ${!v ? "STARTED (Ch 37/38/39)" : "STOPPED"}`);
      return !v;
    });
  };

  const toggleConnect = () => {
    setConnected((c) => {
      onLog(
        !c
          ? "BLE GAP: Client connected (conn_id=0, MTU=247, PHY=2M)"
          : "BLE GAP: Client disconnected (reason=0x13)",
      );
      return !c;
    });
  };

  const sendNotify = () => {
    if (!connected) {
      onLog("WARN: Cannot send GATTS NOTIFY — no BLE central connected");
      return;
    }
    setPackets((p) => p + 1);
    onLog(`GATTS NOTIFY -> UUID 0xFFE1 payload="${charVal}" (${charVal.length} bytes)`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${advertising ? "bg-violet-500" : "bg-slate-500"}`}
            aria-hidden="true"
          />
          <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
            {advertising ? "Advertising: ESP-Labs-S3" : "Radio Idle"} ·{" "}
            {connected ? "Central Connected" : "Disconnected"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleConnect}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-violet-500 cursor-pointer"
          >
            {connected ? "Disconnect Client" : "Simulate Connect"}
          </button>
          <button
            type="button"
            onClick={toggleAdv}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              advertising
                ? "bg-violet-600 text-white hover:bg-violet-700"
                : "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300"
            }`}
          >
            {advertising ? "Stop Advertising" : "Start Advertising"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Primary GATT Service</div>
          <div className="font-mono text-sm text-violet-600 dark:text-violet-300 font-bold">0xFFE0</div>
          <div className="text-[11px] font-mono text-slate-500">3 Characteristics</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Estimated RSSI</div>
          <div className="font-mono text-sm text-cyan-600 dark:text-cyan-300 font-bold tabular-nums">
            {rssi} dBm
          </div>
          <div className="text-[11px] font-mono text-slate-500 tabular-nums">
            TX: {txPower > 0 ? `+${txPower}` : txPower} dBm
          </div>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">GATT Notifications</div>
          <div className="font-mono text-sm text-emerald-600 dark:text-emerald-300 font-bold tabular-nums">
            {packets} frames
          </div>
          <div className="text-[11px] font-mono text-slate-500">MTU: 247 bytes</div>
        </div>
      </div>

      {/* GATT Characteristics Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs font-mono">
        <div className="grid grid-cols-12 px-3 py-2 bg-slate-100 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-800">
          <span className="col-span-3">UUID</span>
          <span className="col-span-4">Properties</span>
          <span className="col-span-5 text-right">Value / Action</span>
        </div>
        <div className="grid grid-cols-12 items-center px-3 py-2 border-b border-slate-200/70 dark:border-slate-800/70">
          <span className="col-span-3 text-violet-600 dark:text-violet-300 font-semibold">0xFFE1</span>
          <span className="col-span-4 text-slate-500">READ · NOTIFY</span>
          <span className="col-span-5 text-right text-emerald-600 dark:text-emerald-300 truncate">
            {charVal}
          </span>
        </div>
        <div className="grid grid-cols-12 items-center px-3 py-2">
          <span className="col-span-3 text-violet-600 dark:text-violet-300 font-semibold">0xFFE2</span>
          <span className="col-span-4 text-slate-500">READ · WRITE</span>
          <div className="col-span-5 flex justify-end items-center gap-2">
            <span className="text-cyan-600 dark:text-cyan-300">{ledChar}</span>
            <button
              type="button"
              onClick={() => {
                const next = ledChar === "0x01" ? "0x00" : "0x01";
                setLedChar(next);
                onLog(`GATTS WRITE <- UUID 0xFFE2 val=${next} (GPIO48 ${next === "0x01" ? "ON" : "OFF"})`);
              }}
              className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-violet-500/20 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              Toggle
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
          <span>RF TX Power</span>
          <span className="font-mono text-violet-600 dark:text-violet-300 tabular-nums">
            {txPower > 0 ? `+${txPower}` : txPower} dBm
          </span>
        </div>
        <input
          type="range"
          min="-12"
          max="9"
          step="3"
          value={txPower}
          onChange={(e) => setTxPower(Number(e.target.value))}
          className="w-full accent-violet-500"
        />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={charVal}
          onChange={(e) => setCharVal(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-violet-500"
        />
        <button
          type="button"
          onClick={sendNotify}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
        >
          <Send className="w-3.5 h-3.5" />
          Notify 0xFFE1
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// 5. INTRO & WIFI SIMULATOR (GPIO48 RGB LED, BOOT BUTTON, 802.11n TELEMETRY)
// ============================================================================
export function WifiIntroSimulator({ onLog }: SimProps & { simType: SimType }) {
  const [ledColor, setLedColor] = useState("#22d3ee");
  const [blinking, setBlinking] = useState(false);
  const [blinkOn, setBlinkOn] = useState(true);
  const [bootPressed, setBootPressed] = useState(false);
  const [wifiMode, setWifiMode] = useState<"STA" | "SoftAP">("STA");
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    if (!blinking) {
      setBlinkOn(true);
      return;
    }
    const id = window.setInterval(() => setBlinkOn((v) => !v), 500);
    return () => window.clearInterval(id);
  }, [blinking]);

  const colors = [
    { name: "Cyan", hex: "#22d3ee" },
    { name: "Emerald", hex: "#34d399" },
    { name: "Amber", hex: "#fbbf24" },
    { name: "Violet", hex: "#a78bfa" },
    { name: "Off", hex: "#1e293b" },
  ];

  const scanNetworks = () => {
    onLog("wifi_scan: Found 3 APs -> ESP-Labs-Net (-52dBm Ch6), Bench-2G (-68dBm Ch1), IoT-Guest (-79dBm Ch11)");
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Onboard RGB LED & BOOT Button */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-slate-600 dark:text-slate-400">GPIO48 WS2812 RGB</span>
          <button
            type="button"
            onClick={() => {
              setBlinking((b) => {
                onLog(`GPIO48 blink task ${!b ? "STARTED (500 ms)" : "STOPPED"}`);
                return !b;
              });
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-mono border cursor-pointer ${
              blinking
                ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/40"
                : "bg-slate-200/70 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400"
            }`}
          >
            {blinking ? "Blinking" : "Solid"}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full border-2 border-slate-300 dark:border-slate-700 transition-all duration-150 shrink-0"
            style={{
              backgroundColor: blinkOn ? ledColor : "#0f172a",
              boxShadow: blinkOn && ledColor !== "#1e293b" ? `0 0 22px ${ledColor}` : "none",
            }}
          />
          <div className="flex flex-wrap gap-1.5">
            {colors.map((c) => (
              <button
                type="button"
                key={c.name}
                onClick={() => {
                  setLedColor(c.hex);
                  onLog(`RMT WS2812 -> ${c.name} (${c.hex})`);
                }}
                className={`px-2 py-1 rounded text-[11px] font-medium border cursor-pointer ${
                  ledColor === c.hex
                    ? "border-cyan-500 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
            GPIO0 BOOT: {bootPressed ? "LOW (0)" : "HIGH (1)"}
          </span>
          <button
            type="button"
            onMouseDown={() => {
              setBootPressed(true);
              onLog("GPIO0 ISR: Falling edge (BOOT pressed)");
            }}
            onMouseUp={() => {
              if (bootPressed) onLog("GPIO0 ISR: Rising edge (BOOT released)");
              setBootPressed(false);
            }}
            onMouseLeave={() => setBootPressed(false)}
            onTouchStart={() => {
              setBootPressed(true);
              onLog("GPIO0 ISR: Falling edge (BOOT pressed)");
            }}
            onTouchEnd={() => setBootPressed(false)}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold cursor-pointer select-none border ${
              bootPressed
                ? "bg-amber-500 border-amber-500 text-slate-950"
                : "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-300 border-amber-500/50"
            }`}
          >
            Hold BOOT
          </button>
        </div>
      </div>

      {/* Wi-Fi Telemetry */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-sky-500" />
            802.11n Wi-Fi ({wifiMode})
          </span>
          <div className="flex gap-1">
            {(["STA", "SoftAP"] as const).map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => {
                  setWifiMode(m);
                  onLog(`esp_wifi_set_mode(WIFI_MODE_${m.toUpperCase()})`);
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border cursor-pointer ${
                  wifiMode === m
                    ? "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40"
                    : "border-transparent bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="font-mono text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-500">SSID:</span>
            <span>{wifiMode === "STA" ? "ESP-Labs-Net" : "ESP32-S3-AP"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">IPv4:</span>
            <span className="text-cyan-600 dark:text-cyan-300 tabular-nums">
              {connected ? (wifiMode === "STA" ? "192.168.1.42" : "192.168.4.1") : "0.0.0.0"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">RSSI:</span>
            <span className={connected ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}>
              {connected ? "-52 dBm (Nominal)" : "Disconnected"}
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setConnected((c) => {
                onLog(`Wi-Fi ${!c ? "CONNECTED -> 192.168.1.42" : "DISCONNECTED"}`);
                return !c;
              });
            }}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 cursor-pointer"
          >
            {connected ? "Disconnect" : "Reconnect"}
          </button>
          <button
            type="button"
            onClick={scanNetworks}
            className="px-2.5 py-1.5 rounded-lg text-xs font-mono border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-sky-500 cursor-pointer"
            title="Scan 2.4GHz Wi-Fi APs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onLog("ICMP Ping 192.168.1.1: 64 bytes ttl=64 time=4.2 ms")}
            className="px-3 py-1.5 rounded-lg text-xs font-mono border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-sky-500 cursor-pointer"
          >
            Ping
          </button>
        </div>
      </div>
    </div>
  );
}
