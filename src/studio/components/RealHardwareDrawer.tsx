import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bluetooth,
  ExternalLink,
  Plug,
  Power,
  RefreshCw,
  Send,
  Terminal,
  Unplug,
  Usb,
  X,
} from "lucide-react";
import {
  detectBrowserHardwareSupport,
  ECOSYSTEM_HARDWARE_TOOLS,
  HARDWARE_PROFILES,
  parseHardwareTelemetryLine,
  type HardwareProfileId,
  type ParsedSerialTelemetry,
} from "../logic/hardware-bridge";
import type { Lang } from "../types";

interface RealHardwareDrawerProps {
  lang: Lang;
  onClose: () => void;
  onTelemetry: (telemetry: ParsedSerialTelemetry, rawLine: string) => void;
}

interface SerialPortLike {
  open: (opts: { baudRate: number }) => Promise<void>;
  close: () => Promise<void>;
  setSignals?: (signals: { dataTerminalReady?: boolean; requestToSend?: boolean }) => Promise<void>;
  readable?: ReadableStream<Uint8Array>;
  writable?: WritableStream<Uint8Array>;
}

interface BluetoothDeviceLike {
  name?: string;
  id: string;
  gatt?: {
    connected: boolean;
    connect: () => Promise<{
      getPrimaryServices: () => Promise<
        Array<{
          uuid: string;
          getCharacteristics: () => Promise<
            Array<{
              uuid: string;
              properties: { read?: boolean; write?: boolean; notify?: boolean };
              readValue: () => Promise<DataView>;
              writeValue?: (val: BufferSource) => Promise<void>;
            }>
          >;
        }>
      >;
    }>;
    disconnect: () => void;
  };
}

export function RealHardwareDrawer({
  lang,
  onClose,
  onTelemetry,
}: RealHardwareDrawerProps) {
  const caps = detectBrowserHardwareSupport();
  const [tab, setTab] = useState<"serial" | "ble" | "tools">("serial");
  const [profileId, setProfileId] = useState<HardwareProfileId>("esp32-s3");
  const [baudRate, setBaudRate] = useState(115200);
  const [serialConnected, setSerialConnected] = useState(false);
  const [serialStatus, setSerialStatus] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([
    lang === "ro"
      ? "[BRIDGE] Pregătit pentru conectare USB-C Web Serial (ESP32-S3 / Flipper Zero)."
      : "[BRIDGE] Ready for USB-C Web Serial connection (ESP32-S3 / Flipper Zero).",
  ]);
  const [cmdInput, setCmdInput] = useState("");

  // Web Bluetooth state
  const [bleDeviceName, setBleDeviceName] = useState<string | null>(null);
  const [bleServices, setBleServices] = useState<string[]>([]);
  const [bleStatus, setBleStatus] = useState<string>("");
  const bleDeviceRef = useRef<BluetoothDeviceLike | null>(null);

  // Serial refs
  const portRef = useRef<SerialPortLike | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null);
  const keepReadingRef = useRef(false);

  const profile = HARDWARE_PROFILES.find((p) => p.id === profileId) ?? HARDWARE_PROFILES[0];

  const appendLog = useCallback(
    (line: string, mirror = false) => {
      setLogs((prev) => [...prev.slice(-60), line]);
      if (mirror) {
        onTelemetry(parseHardwareTelemetryLine(line), line);
      }
    },
    [onTelemetry],
  );

  const disconnectSerial = useCallback(async () => {
    keepReadingRef.current = false;
    try {
      await readerRef.current?.cancel();
    } catch {
      // ignore cancel errors
    }
    try {
      writerRef.current?.releaseLock();
    } catch {
      // ignore
    }
    try {
      await portRef.current?.close();
    } catch {
      // ignore
    }
    readerRef.current = null;
    writerRef.current = null;
    portRef.current = null;
    setSerialConnected(false);
    setSerialStatus(lang === "ro" ? "Deconectat" : "Disconnected");
  }, [lang]);

  useEffect(() => {
    return () => {
      void disconnectSerial();
      if (bleDeviceRef.current?.gatt?.connected) {
        bleDeviceRef.current.gatt.disconnect();
      }
    };
  }, [disconnectSerial]);

  const connectSerial = async () => {
    const nav = navigator as Navigator & {
      serial?: { requestPort: () => Promise<SerialPortLike> };
    };
    if (!nav.serial) {
      setSerialStatus(
        lang === "ro"
          ? "Web Serial necesită Chrome / Edge / Brave pe desktop."
          : "Web Serial requires desktop Chrome / Edge / Brave.",
      );
      return;
    }
    try {
      const port = await nav.serial.requestPort();
      await port.open({ baudRate });
      portRef.current = port;
      keepReadingRef.current = true;
      setSerialConnected(true);
      setSerialStatus(`${profile.name} @ ${baudRate} baud`);
      appendLog(`[USB] Connected @ ${baudRate} baud (${profile.name})`);

      if (port.writable) {
        writerRef.current = port.writable.getWriter();
      }
      if (port.readable) {
        const decoder = new TextDecoderStream();
        void port.readable.pipeTo(decoder.writable as unknown as WritableStream<Uint8Array>);
        const reader = decoder.readable.getReader();
        readerRef.current = reader;
        let buffer = "";
        while (keepReadingRef.current) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            buffer += value;
            const parts = buffer.split(/\r?\n/);
            buffer = parts.pop() ?? "";
            for (const line of parts) {
              if (line.trim()) appendLog(`<< ${line}`, true);
            }
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSerialStatus(msg);
      appendLog(`[ERR] ${msg}`);
    }
  };

  const sendSerialCommand = async (rawCmd: string) => {
    const cmd = rawCmd.trim();
    if (!cmd) return;
    if (!serialConnected || !writerRef.current) {
      // Virtual loopback preview so users can see the protocol & 3D mirroring immediately
      appendLog(`>> ${cmd} (loopback)`);
      const syntheticReply =
        cmd.startsWith("rgb")
          ? `OK ${cmd} applied to GPIO48`
          : cmd === "device_info"
            ? "Flipper Zero STM32WB55 · SubGHz CC1101 · NFC ST25R3916"
            : cmd === "scanap"
              ? "Found 3 APs (2.4 GHz) · RSSI -48 dBm"
              : `ACK: ${cmd}`;
      appendLog(`<< ${syntheticReply}`, true);
      return;
    }
    try {
      const encoded = new TextEncoder().encode(cmd + profile.lineEnding);
      await writerRef.current.write(encoded);
      appendLog(`>> ${cmd}`);
    } catch (err) {
      appendLog(`[ERR] ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const pulseResetOrBoot = async (bootloader: boolean) => {
    const port = portRef.current;
    if (!port?.setSignals) {
      appendLog(
        bootloader
          ? "[HW] Bootloader DTR/RTS pulse requires active USB-C Web Serial port."
          : "[HW] Hardware RST pulse requires active USB-C Web Serial port.",
      );
      return;
    }
    try {
      if (bootloader) {
        await port.setSignals({ dataTerminalReady: false, requestToSend: true });
        await new Promise((r) => setTimeout(r, 120));
        await port.setSignals({ dataTerminalReady: true, requestToSend: false });
        await new Promise((r) => setTimeout(r, 120));
        await port.setSignals({ dataTerminalReady: false, requestToSend: false });
        appendLog("[HW] Sent ESP32 Bootloader sequence (GPIO0=LOW, EN pulse)");
      } else {
        await port.setSignals({ dataTerminalReady: false, requestToSend: true });
        await new Promise((r) => setTimeout(r, 100));
        await port.setSignals({ dataTerminalReady: false, requestToSend: false });
        appendLog("[HW] Sent Hardware Reset pulse (EN/RST)");
      }
    } catch (err) {
      appendLog(`[ERR] ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const connectBluetooth = async () => {
    const nav = navigator as Navigator & {
      bluetooth?: {
        requestDevice: (opts: Record<string, unknown>) => Promise<BluetoothDeviceLike>;
      };
    };
    if (!nav.bluetooth) {
      setBleStatus(
        lang === "ro"
          ? "Web Bluetooth necesită Chrome / Edge pe desktop sau Android."
          : "Web Bluetooth requires Chrome / Edge on desktop or Android.",
      );
      return;
    }
    try {
      setBleStatus(lang === "ro" ? "Se scanează dispozitive BLE..." : "Scanning for BLE devices...");
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          "battery_service",
          "device_information",
          "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
        ],
      });
      bleDeviceRef.current = device;
      setBleDeviceName(device.name || device.id);
      const server = await device.gatt?.connect();
      if (server) {
        const services = await server.getPrimaryServices();
        setBleServices(services.map((s) => s.uuid));
        setBleStatus(
          lang === "ro"
            ? `Conectat la ${device.name || device.id} (${services.length} servicii GATT)`
            : `Connected to ${device.name || device.id} (${services.length} GATT services)`,
        );
        appendLog(`[BLE] Connected: ${device.name || device.id}`, true);
      }
    } catch (err) {
      setBleStatus(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950 text-slate-100 shadow-2xl p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Usb className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold">
            {lang === "ro"
              ? "Conectare Componente Fizice Reale (Web Serial USB-C & Web Bluetooth)"
              : "Real Physical Hardware Bridge (Web Serial USB-C & Web Bluetooth)"}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg border border-slate-700 hover:border-cyan-500 text-slate-300 cursor-pointer"
          aria-label={lang === "ro" ? "Închide panoul hardware" : "Close hardware panel"}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Honest Environment & Browser Support Notice */}
      {(!caps.webSerialSupported || caps.inCrossOriginIframe) && (
        <div className="p-3 rounded-xl border border-amber-500/35 bg-amber-500/10 text-xs text-amber-200 leading-relaxed">
          {caps.inCrossOriginIframe
            ? lang === "ro"
              ? "Notă browser: dacă rulezi aplicația în iframe preview, Chrome poate bloca dialogul USB/BLE. Deschide URL-ul aplicației într-un tab separat Chrome/Edge pentru conexiune directă la placa fizică ESP32 sau Flipper Zero (poți testa comenzile și aici în modul loopback)."
              : "Browser note: inside an embedded iframe preview, Chrome may restrict USB/BLE permissions. Open the app URL in a top-level Chrome/Edge tab for direct physical USB-C/BLE access (you can still test commands here in loopback mode)."
            : lang === "ro"
              ? "Web Serial / Web Bluetooth sunt suportate în Chrome, Edge și Brave pe desktop. Poți testa protocolul aici în modul loopback sau folosi instrumentele oficiale din tabul „Unelte Oficiale”."
              : "Web Serial / Web Bluetooth require desktop Chrome, Edge, or Brave. You can test commands here in loopback mode or launch official tools in the Ecosystem Tools tab."}
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {[
          { id: "serial" as const, label: "USB-C Web Serial", icon: Terminal },
          { id: "ble" as const, label: "Web Bluetooth GATT", icon: Bluetooth },
          {
            id: "tools" as const,
            label: lang === "ro" ? "Unelte Oficiale (ESP / Flipper)" : "Official Tools (ESP / Flipper)",
            icon: ExternalLink,
          },
        ].map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                active
                  ? "bg-cyan-600 text-white"
                  : "bg-slate-900 border border-slate-800 text-slate-300 hover:border-cyan-500"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {tab === "serial" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px] text-slate-400 space-y-1">
                <span>{lang === "ro" ? "Profil Dispozitiv" : "Device Profile"}</span>
                <select
                  value={profileId}
                  onChange={(e) => {
                    const nextId = e.target.value as HardwareProfileId;
                    setProfileId(nextId);
                    const found = HARDWARE_PROFILES.find((p) => p.id === nextId);
                    if (found) setBaudRate(found.defaultBaud);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100"
                >
                  {HARDWARE_PROFILES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-[11px] text-slate-400 space-y-1">
                <span>Baud Rate</span>
                <select
                  value={baudRate}
                  onChange={(e) => setBaudRate(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100"
                >
                  {[9600, 115200, 230400, 460800, 921600].map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              {!serialConnected ? (
                <button
                  type="button"
                  onClick={() => void connectSerial()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                >
                  <Plug className="w-3.5 h-3.5" />
                  <span>{lang === "ro" ? "Conectează Port USB-C" : "Connect USB-C Port"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void disconnectSerial()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
                >
                  <Unplug className="w-3.5 h-3.5" />
                  <span>{lang === "ro" ? "Deconectează" : "Disconnect"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => void pulseResetOrBoot(false)}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg border border-slate-700 hover:border-cyan-500 text-xs font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>RST</span>
              </button>
              <button
                type="button"
                onClick={() => void pulseResetOrBoot(true)}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg border border-slate-700 hover:border-amber-500 text-xs font-semibold cursor-pointer"
              >
                <Power className="w-3.5 h-3.5" />
                <span>BOOT</span>
              </button>
            </div>

            {serialStatus && (
              <div className="text-[11px] font-mono text-cyan-300">{serialStatus}</div>
            )}

            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-400">
                {lang === "ro"
                  ? "Comenzi Rapide (se oglindesc live pe OLED & LED 3D):"
                  : "Quick Commands (mirrored live to 3D OLED & RGB LED):"}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {profile.commands.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => void sendSerialCommand(c.command)}
                    className="text-left p-2 rounded-lg border border-slate-800 bg-slate-900 hover:border-cyan-500 transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-mono font-bold text-cyan-300">{c.label}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {lang === "ro" ? c.descRo : c.descEn}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col space-y-2">
            <div className="h-44 overflow-y-auto rounded-xl border border-slate-800 bg-black/80 p-3 font-mono text-[11px] text-emerald-300 space-y-1">
              {logs.map((line, i) => (
                <div key={i} className="break-all">
                  {line}
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendSerialCommand(cmdInput);
                setCmdInput("");
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={cmdInput}
                onChange={(e) => setCmdInput(e.target.value)}
                placeholder={
                  lang === "ro"
                    ? "Trimite comandă UART (ex: device_info, rgb #10b981, help)..."
                    : "Send UART command (e.g. device_info, rgb #10b981, help)..."
                }
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{lang === "ro" ? "Trimite" : "Send"}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === "ble" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void connectBluetooth()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
            >
              <Bluetooth className="w-4 h-4" />
              <span>
                {lang === "ro"
                  ? "Scanează & Conectează Dispozitiv BLE 5.0"
                  : "Scan & Connect BLE 5.0 Device"}
              </span>
            </button>
            {bleDeviceName && (
              <span className="text-xs font-mono text-emerald-400">
                {bleDeviceName}
              </span>
            )}
          </div>
          {bleStatus && <div className="text-xs font-mono text-slate-300">{bleStatus}</div>}
          {bleServices.length > 0 && (
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">
                {lang === "ro" ? "Servicii GATT Descoperite:" : "Discovered GATT Services:"}
              </div>
              {bleServices.map((uuid) => (
                <div key={uuid} className="text-xs font-mono text-cyan-300">
                  {uuid}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "tools" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ECOSYSTEM_HARDWARE_TOOLS.map((tool) => (
            <a
              key={tool.id}
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl border border-slate-800 bg-slate-900 hover:border-cyan-500 transition-colors flex flex-col justify-between space-y-2"
            >
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-100 flex items-center justify-between gap-2">
                  <span>{tool.name}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {lang === "ro" ? tool.descRo : tool.descEn}
                </p>
              </div>
              <span className="text-[11px] font-mono text-cyan-400">
                {lang === "ro" ? "Deschide unealta oficială →" : "Launch official tool →"}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
