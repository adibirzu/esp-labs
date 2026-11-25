import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Circle,
  Code2,
  Pause,
  Play,
  RotateCcw,
  Search,
  Terminal,
  Wrench,
} from "lucide-react";
import { LogicAnalyzerCanvas } from "../components/LogicAnalyzerCanvas";
import {
  BleSimulator,
  DisplaySimulator,
  RfidSimulator,
  SoundSimulator,
  WifiIntroSimulator,
} from "../components/Simulators";
import { LABS, TRACKS } from "../data/labs";
import type { Translations } from "../i18n";
import type { TrackId } from "../types";

interface LabsViewProps {
  t: Translations;
  completedLabs: string[];
  toggleComplete: (id: string) => void;
  resetProgress: () => void;
  activeTrack: "all" | TrackId;
  setActiveTrack: (track: "all" | TrackId) => void;
  selectedLabId: string | null;
  setSelectedLabId: (id: string | null) => void;
  onOpenCodeTour: (tourId: string) => void;
}

interface LogLine {
  id: number;
  time: string;
  msg: string;
}

export function LabsView({
  t,
  completedLabs,
  toggleComplete,
  resetProgress,
  activeTrack,
  setActiveTrack,
  selectedLabId,
  setSelectedLabId,
  onOpenCodeTour,
}: LabsViewProps) {
  const [query, setQuery] = useState("");
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [serialInput, setSerialInput] = useState("");
  const [analyzerRunning, setAnalyzerRunning] = useState(true);
  const [analyzerSpeed, setAnalyzerSpeed] = useState(1);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  const [checkedWires, setCheckedWires] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("esp_labs_studio_wiring");
      return saved ? (JSON.parse(saved) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("esp_labs_studio_wiring", JSON.stringify(checkedWires));
    } catch {
      // Ignore quota errors
    }
  }, [checkedWires]);

  const selectedLab = useMemo(
    () => LABS.find((l) => l.id === selectedLabId) ?? null,
    [selectedLabId],
  );

  useEffect(() => {
    if (selectedLab) {
      setLogs(
        selectedLab.defaultLogs.map((msg, i) => ({
          id: i,
          time: `00:00.${300 + i * 45}`,
          msg,
        })),
      );
    }
  }, [selectedLab]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const appendLog = useCallback((msg: string) => {
    const now = new Date();
    const ts = `${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.${String(now.getMilliseconds()).padStart(3, "0")}`;
    setLogs((prev) => [
      ...prev.slice(-40),
      { id: Date.now() + Math.random(), time: ts, msg: `[ESP-IDF] ${msg}` },
    ]);
  }, []);

  const runSerialCmd = (raw: string) => {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;
    if (cmd === "clear") {
      setLogs([]);
      return;
    }
    appendLog(`> ${cmd}`);
    if (cmd === "help") {
      appendLog("Commands: help, heap, info, pins, scan, reboot, clear");
    } else if (cmd === "heap") {
      appendLog("Free SRAM: 342,120 bytes | Free Octal PSRAM: 8,388,608 bytes");
    } else if (cmd === "info") {
      appendLog("ESP32-S3-WROOM-1 (N16R8) · Dual Xtensa LX7 @ 240 MHz · IDF v5.3.1");
    } else if (cmd === "pins" && selectedLab) {
      appendLog(
        `Lab ${selectedLab.code} wiring: ${selectedLab.wiring.map((w) => `${w.from}->${w.to}`).join(" | ")}`,
      );
    } else if (cmd === "scan") {
      appendLog("I2C0 scan: ACK at 0x3C (SSD1306) | SPI2: MFRC522 rev 0x92");
    } else if (cmd === "reboot") {
      appendLog("rst:0x3 (RTC_SW_SYS_RST), boot:0x8 (SPI_FAST_FLASH_BOOT)");
    } else {
      appendLog(`Unknown command "${cmd}". Type "help".`);
    }
  };

  if (selectedLab) {
    const isDone = completedLabs.includes(selectedLab.id);
    const checkedCount = selectedLab.wiring.filter(
      (_, idx) => checkedWires[`${selectedLab.id}-${idx}`],
    ).length;

    return (
      <div className="space-y-5">
        {/* Lab Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedLabId(null)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.backToLabs}
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              <strong className="text-cyan-600 dark:text-cyan-400">{selectedLab.code}</strong> ·{" "}
              {selectedLab.duration} · {selectedLab.difficulty}
            </span>
            {selectedLab.tourId && (
              <button
                type="button"
                onClick={() => onOpenCodeTour(selectedLab.tourId!)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:border-cyan-500 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Code2 className="w-3.5 h-3.5 text-cyan-500" />
                {t.openCodeTour}
              </button>
            )}
            <button
              type="button"
              onClick={() => toggleComplete(selectedLab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                isDone
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40"
                  : "bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 hover:bg-cyan-500 dark:hover:bg-cyan-400"
              }`}
            >
              {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              {isDone ? t.completedBadge : t.markComplete}
            </button>
          </div>
        </div>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Brief & Interactive Wiring Checklist */}
          <div className="lg:col-span-4 space-y-5">
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70">
              <h2 className="text-lg font-bold tracking-tight mb-2">{selectedLab.title}</h2>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {selectedLab.summary}
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-cyan-500" />
                  {t.wiringChecklist}
                </h3>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                  {checkedCount}/{selectedLab.wiring.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.wiringHint}</p>

              <div className="space-y-2">
                {selectedLab.wiring.map((w, i) => {
                  const key = `${selectedLab.id}-${i}`;
                  const checked = Boolean(checkedWires[key]);
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() =>
                        setCheckedWires((prev) => ({ ...prev, [key]: !prev[key] }))
                      }
                      className={`w-full text-left p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        checked
                          ? "bg-emerald-500/10 border-emerald-500/40"
                          : "bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 hover:border-cyan-500/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {checked ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span className="text-cyan-600 dark:text-cyan-400 truncate">{w.from}</span>
                        <span className="text-slate-400">→</span>
                        <span className="truncate text-slate-800 dark:text-slate-200">{w.to}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-300 shrink-0">
                        {w.signal}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Hardware Simulator, 4-Ch Logic Analyzer, Serial Monitor */}
          <div className="lg:col-span-8 space-y-5">
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">{t.virtualSim}</h3>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  ESP32-S3-WROOM-1 · N16R8
                </span>
              </div>
              {selectedLab.simType === "sound" && <SoundSimulator onLog={appendLog} />}
              {selectedLab.simType === "display" && <DisplaySimulator onLog={appendLog} />}
              {selectedLab.simType === "rfid" && <RfidSimulator onLog={appendLog} />}
              {selectedLab.simType === "ble" && <BleSimulator onLog={appendLog} />}
              {(selectedLab.simType === "wifi" || selectedLab.simType === "intro") && (
                <WifiIntroSimulator simType={selectedLab.simType} onLog={appendLog} />
              )}
            </div>

            {/* 4-Channel Logic Analyzer */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-violet-500" />
                  {t.logicAnalyzer}
                </span>
                <div className="flex items-center gap-1.5">
                  {[0.5, 1, 2].map((sp) => (
                    <button
                      type="button"
                      key={sp}
                      onClick={() => setAnalyzerSpeed(sp)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono border cursor-pointer ${
                        analyzerSpeed === sp
                          ? "bg-violet-500/15 border-violet-500 text-violet-600 dark:text-violet-300"
                          : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {sp}×
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAnalyzerRunning((r) => !r)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-cyan-500 cursor-pointer"
                  >
                    {analyzerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    {analyzerRunning ? "Freeze" : "Run"}
                  </button>
                </div>
              </div>
              <LogicAnalyzerCanvas
                simType={selectedLab.simType}
                active={analyzerRunning}
                speed={analyzerSpeed}
              />
            </div>

            {/* UART0 Serial Monitor */}
            <div className="rounded-xl border border-slate-800 bg-[#060a12] overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-slate-900 border-b border-slate-800">
                <span className="text-xs font-mono text-cyan-400 flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5" />
                  {t.serialMonitor}
                </span>
                <div className="flex items-center gap-1.5">
                  {["help", "heap", "pins", "scan"].map((cmd) => (
                    <button
                      type="button"
                      key={cmd}
                      onClick={() => runSerialCmd(cmd)}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    >
                      {cmd}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setLogs([])}
                    className="ml-1 text-xs font-mono text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {t.clear}
                  </button>
                </div>
              </div>
              <div
                ref={logContainerRef}
                className="workbench-scroll p-3 h-40 overflow-y-auto font-mono text-xs space-y-1"
              >
                {logs.map((l) => (
                  <div key={l.id} className="leading-relaxed">
                    <span className="text-slate-500 mr-2 tabular-nums">[{l.time}]</span>
                    <span className="text-emerald-300/95">{l.msg}</span>
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runSerialCmd(serialInput);
                  setSerialInput("");
                }}
                className="flex border-t border-slate-800"
              >
                <input
                  type="text"
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value)}
                  placeholder="Type UART command (help, heap, info, pins, scan, reboot)..."
                  className="flex-1 bg-transparent px-3 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-mono text-cyan-400 hover:bg-slate-900 cursor-pointer"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Course & Tracks Browser View
  const filteredLabs = LABS.filter((lab) => {
    const matchesTrack = activeTrack === "all" || lab.track === activeTrack;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      lab.code.toLowerCase().includes(q) ||
      lab.title.toLowerCase().includes(q) ||
      lab.summary.toLowerCase().includes(q) ||
      lab.wiring.some((w) => w.signal.toLowerCase().includes(q));
    return matchesTrack && matchesQuery;
  });

  const pct = Math.round((completedLabs.length / LABS.length) * 100);

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{t.progress}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 tabular-nums">
              {completedLabs.length} / {LABS.length} {t.completed} · {t.acrossTracks}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {completedLabs.length > 0 && (
              <button
                type="button"
                onClick={resetProgress}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-rose-500 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t.resetProgress}
              </button>
            )}
            <div className="font-mono text-2xl font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
              {pct}%
            </div>
          </div>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-cyan-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Filter Bar + Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTrack("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
              activeTrack === "all"
                ? "bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 border-cyan-600 dark:border-cyan-400"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
            }`}
          >
            {t.filterAll} ({LABS.length})
          </button>
          {TRACKS.map((tr) => {
            const Icon = tr.icon;
            const trackLabs = LABS.filter((l) => l.track === tr.id);
            const trackDone = trackLabs.filter((l) => completedLabs.includes(l.id)).length;
            return (
              <button
                type="button"
                key={tr.id}
                onClick={() => setActiveTrack(tr.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                  activeTrack === tr.id
                    ? "bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tr.name}</span>
                <span className="font-mono text-[11px] opacity-75 tabular-nums">
                  {trackDone}/{trackLabs.length}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative md:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchLabs}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Labs Grid */}
      {filteredLabs.length === 0 ? (
        <div className="p-10 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-sm text-slate-500 dark:text-slate-400">
          {t.noLabsFound}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredLabs.map((lab) => {
            const done = completedLabs.includes(lab.id);
            return (
              <div
                key={lab.id}
                onClick={() => setSelectedLabId(lab.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedLabId(lab.id);
                  }
                }}
                className="group p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-cyan-500 transition-colors cursor-pointer flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-cyan-600 dark:text-cyan-400">{lab.code}</span>
                      <span aria-hidden="true">·</span>
                      <span>{lab.duration}</span>
                      <span aria-hidden="true">·</span>
                      <span>{lab.difficulty}</span>
                    </div>
                    {done && (
                      <CheckCircle2
                        className="w-4 h-4 text-emerald-500 shrink-0"
                        aria-label={t.completedBadge}
                      />
                    )}
                  </div>
                  <h3 className="font-bold text-base mb-1.5 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    {lab.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {lab.summary}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-500 dark:text-slate-400">
                    {lab.wiring.length} wires
                  </span>
                  <span className="font-semibold text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                    {t.openLab}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
