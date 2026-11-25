import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Check,
  Copy,
  Cpu,
  GitBranch,
  Play,
  RotateCcw,
  RotateCw,
  Sparkles,
  Square,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import esp32RealTopImg from "../../assets/images/esp32_s3_real_top_1795635835402.jpg";
import { OFFICIAL_ESP_BOARDS } from "../data/boards";
import type { Translations } from "../i18n";
import type { AudienceMode, Lang } from "../types";
import { BoardTeardownDrilldown } from "./BoardTeardownDrilldown";
import { JuniorExplorerStudio } from "./JuniorExplorerStudio";

interface InteractiveEspPlaygroundProps {
  t: Translations;
  lang: Lang;
  audienceMode: AudienceMode;
  onRunSketch?: () => void;
  onOpenBench3D?: () => void;
}

type HotspotId = "gpio" | "module" | "antenna" | "usbc" | "power" | "rgb" | "boot";
type SketchId = "blink" | "fridge" | "piano" | "wifi";

interface HotspotInfo {
  id: HotspotId;
  x: number;
  y: number;
  photoX: number; // percentage on real overhead macro photo
  photoY: number; // percentage on real overhead macro photo
  pcbRef: string;
  label: { en: string; ro: string };
  pinRef: string;
  kidsDesc: { en: string; ro: string };
  adultsDesc: { en: string; ro: string };
  specs: { en: string[]; ro: string[] };
}

const HOTSPOTS: HotspotInfo[] = [
  {
    id: "antenna",
    x: 240,
    y: 46,
    photoX: 50,
    photoY: 13,
    pcbRef: "ANT1 · 2.4GHz Meander",
    label: { en: "2.4 GHz Antenna", ro: "Antenă 2.4 GHz" },
    pinRef: "PCB Meander RF",
    kidsDesc: {
      en: "The tiny copper zig-zag at the top lets your ESP32 talk over Wi-Fi and Bluetooth without any cables!",
      ro: "Zig-zagul de cupru din vârf lasă placa ESP32 să comunice prin Wi-Fi și Bluetooth fără niciun cablu!",
    },
    adultsDesc: {
      en: "Integrated 2.4 GHz PCB meander antenna serving 802.11 b/g/n Wi-Fi 4 and Bluetooth 5.0 LE (up to +20 dBm TX).",
      ro: "Antenă PCB integrată la 2.4 GHz pentru Wi-Fi 4 (802.11 b/g/n) și Bluetooth 5.0 LE (putere TX până la +20 dBm).",
    },
    specs: {
      en: ["Band: 2.400–2.4835 GHz", "Wi-Fi 4 + BLE 5.0 Long Range", "Keep metal & hands clear of top edge"],
      ro: ["Bandă: 2.400–2.4835 GHz", "Wi-Fi 4 + BLE 5.0 Long Range", "Evită obiectele metalice lângă marginea de sus"],
    },
  },
  {
    id: "module",
    x: 240,
    y: 122,
    photoX: 50,
    photoY: 31,
    pcbRef: "U1 · ESP32-S3-WROOM-1",
    label: { en: "ESP32-S3-WROOM-1", ro: "Modul ESP32-S3" },
    pinRef: "Dual-Core 240 MHz",
    kidsDesc: {
      en: "The brain inside the silver shield! It has two fast processors, memory for your code, and AI math instructions.",
      ro: "Creierul din interiorul capacului argintiu! Are două procesoare rapide, memorie pentru codul tău și instrucțiuni pentru sunet și senzori.",
    },
    adultsDesc: {
      en: "Dual-core Xtensa LX7 @ 240 MHz with SIMD vector instructions, 512 KB SRAM, 8–16 MB Quad Flash, and optional 8 MB Octal PSRAM.",
      ro: "Dual-core Xtensa LX7 la 240 MHz cu instrucțiuni vectoriale SIMD, 512 KB SRAM, 8–16 MB Flash și până la 8 MB Octal PSRAM.",
    },
    specs: {
      en: ["CPU: 2× Xtensa LX7 @ 240 MHz", "RAM: 512 KB SRAM + 8 MB PSRAM", "ULP RISC-V coprocessor for µA sleep"],
      ro: ["CPU: 2× Xtensa LX7 la 240 MHz", "RAM: 512 KB SRAM + 8 MB PSRAM", "Coprocesor ULP RISC-V pentru consum µA"],
    },
  },
  {
    id: "gpio",
    x: 112,
    y: 175,
    photoX: 28,
    photoY: 47,
    pcbRef: "J1 / J3 · 2×22 Gold Headers",
    label: { en: "GPIO Headers (44 Pins)", ro: "Pini GPIO (44 Pini)" },
    pinRef: "I2C · SPI · I2S · ADC",
    kidsDesc: {
      en: "Metal legs where you plug in screens, buttons, buzzers, and RFID readers—just like electronic LEGO bricks.",
      ro: "Piciorușele metalice unde conectezi ecrane, butoane, difuzoare și cititoare RFID — exact ca niște piese LEGO electronice.",
    },
    adultsDesc: {
      en: "45 programmable 3.3V GPIOs routed via the GPIO Matrix: route I2C, SPI2/3, I2S, UART, or PWM to almost any free pin (avoid GPIO35–37 on Octal PSRAM).",
      ro: "45 pini GPIO programabili la 3.3V prin GPIO Matrix: poți mapa I2C, SPI2/3, I2S, UART sau PWM pe aproape orice pin liber (evită GPIO35–37 pe Octal PSRAM).",
    },
    specs: {
      en: ["Logic Level: Strictly 3.3V", "20× 12-bit ADC + 14× Capacitive Touch", "Avoid GPIO35–37 on N8R8 / N16R8"],
      ro: ["Nivel Logic: Strict 3.3V", "20× ADC 12-biți + 14× Senzori Tactili", "Evită GPIO35–37 pe N8R8 / N16R8"],
    },
  },
  {
    id: "rgb",
    x: 288,
    y: 204,
    photoX: 41,
    photoY: 53.5,
    pcbRef: "U3 · WS2812B SMD RGB",
    label: { en: "Addressable RGB LED", ro: "LED RGB Adresabil" },
    pinRef: "GPIO48 (WS2812)",
    kidsDesc: {
      en: "A tiny magic light that mixes Red, Green, and Blue into 16 million colors using just one wire!",
      ro: "Un mic beculeț magic care combină Roșu, Verde și Albastru în 16 milioane de culori printr-un singur fir!",
    },
    adultsDesc: {
      en: "Onboard WS2812B-compatible smart RGB LED wired to GPIO48 (some v1.0 boards use GPIO38), driven cleanly via the hardware RMT peripheral.",
      ro: "LED RGB adresabil tip WS2812B integrat pe GPIO48 (GPIO38 pe revizia v1.0), controlat precis prin perifericul hardware RMT.",
    },
    specs: {
      en: ["Pin: GPIO48 (RMT TX channel)", "24-bit GRB color timing @ 800 kHz", "Great for instant visual diagnostics"],
      ro: ["Pin: GPIO48 (canal RMT TX)", "Codare 24-biți GRB la 800 kHz", "Ideal pentru diagnostic vizual instant"],
    },
  },
  {
    id: "power",
    x: 368,
    y: 175,
    photoX: 58.5,
    photoY: 54.5,
    pcbRef: "U2 · AMS1117-3.3 LDO",
    label: { en: "3.3V Regulator & Power", ro: "Alimentare 3V3 · GND" },
    pinRef: "5V → 3.3V LDO",
    kidsDesc: {
      en: "Turns 5V power from your computer into a safe, gentle 3.3V so sensors and microchips stay cool and happy.",
      ro: "Transformă tensiunea de 5V de la calculator într-un 3.3V sigur, ca senzorii și microcipurile să nu se încălzească.",
    },
    adultsDesc: {
      en: "AMS1117 / SGM2212 LDO regulates 5V VBUS down to 3.3V (up to ~500 mA continuous). Always share a common GND wire with external modules.",
      ro: "Regulatorul LDO coboară 5V VBUS la 3.3V (până la ~500 mA continuu). Conectează întotdeauna o masă comună (GND) cu modulele externe.",
    },
    specs: {
      en: ["Input: 5V via USB-C or 5VIN pin", "Regulated Rail: 3.3V ±2%", "Max GPIO sink/source: 12–40 mA"],
      ro: ["Intrare: 5V prin USB-C sau pin 5VIN", "Linie Stabilizată: 3.3V ±2%", "Curent max GPIO: 12–40 mA"],
    },
  },
  {
    id: "boot",
    x: 194,
    y: 244,
    photoX: 60.5,
    photoY: 65,
    pcbRef: "SW2 · BOOT (IO0) / SW1 · RST",
    label: { en: "BOOT Button (GPIO0)", ro: "Buton BOOT (GPIO0)" },
    pinRef: "GPIO0 Active-Low",
    kidsDesc: {
      en: "A built-in button you can press inside your games or hold while plugging in to load brand-new firmware.",
      ro: "Un buton gata montat pe placă pe care îl poți apăsa în jocuri sau la încărcarea unui program nou.",
    },
    adultsDesc: {
      en: "Hardware strapping pin GPIO0 with pull-up resistor. Holding low during RESET enters ROM USB download bootloader; free as user button at runtime.",
      ro: "Pin de strapping GPIO0 cu rezistor pull-up. Ținut apăsat la RESET intră în bootloader-ul USB; disponibil ca buton utilizator în rulare.",
    },
    specs: {
      en: ["Active-Low (0 = Pressed)", "Bootloader entry when held at RST", "Internal pull-up enabled by default"],
      ro: ["Activ pe 0 logic (0 = Apăsat)", "Intrare bootloader la pornire", "Pull-up intern activ implicit"],
    },
  },
  {
    id: "usbc",
    x: 240,
    y: 286,
    photoX: 50,
    photoY: 87.5,
    pcbRef: "J2 / J4 · UART + USB/JTAG",
    label: { en: "Dual USB-C Ports", ro: "Porturi USB-C (Native & UART)" },
    pinRef: "GPIO19/20 + UART0",
    kidsDesc: {
      en: "Plug one cable into your laptop to send code, power the board, and read messages on the Serial Monitor.",
      ro: "Conectează un singur cablu la laptop pentru a trimite cod, a alimenta placa și a citi mesaje în Monitorul Serial.",
    },
    adultsDesc: {
      en: "Dual USB-C: UART bridge (CP2102N) for flashing/logs plus native Full-Speed USB-OTG (GPIO19/20) for USB HID keyboards, MIDI, and JTAG debugging.",
      ro: "Porturi USB-C duble: punte UART (CP2102N) pentru programare/loguri + USB-OTG nativ (GPIO19/20) pentru tastaturi HID, MIDI și depanare JTAG.",
    },
    specs: {
      en: ["UART0: 115200 8N1 Serial Monitor", "Native USB: HID, CDC, MSC, JTAG", "ESD-protected 5V VBUS input"],
      ro: ["UART0: Monitor Serial 115200 8N1", "USB Nativ: HID, CDC, MSC, JTAG", "Intrare 5V VBUS cu protecție ESD"],
    },
  },
];

const QUICK_PINOUT = [
  { pin: "GPIO48", role: { en: "Onboard WS2812 RGB LED", ro: "LED RGB integrat WS2812" }, color: "text-amber-500" },
  { pin: "GPIO0", role: { en: "BOOT Button (Active-Low)", ro: "Buton BOOT (Activ pe 0)" }, color: "text-cyan-500" },
  { pin: "GPIO8 / 9", role: { en: "I2C SDA / SCL (OLED & BME280)", ro: "I2C SDA / SCL (OLED & BME280)" }, color: "text-emerald-500" },
  { pin: "GPIO10–13", role: { en: "SPI2 Bus (MFRC522 / CC1101 / SD)", ro: "Magistrală SPI2 (RFID / CC1101 / SD)" }, color: "text-violet-500" },
  { pin: "GPIO4–6", role: { en: "I2S Digital Audio (MAX98357A)", ro: "Audio Digital I2S (MAX98357A)" }, color: "text-rose-500" },
  { pin: "GPIO43 / 44", role: { en: "UART0 TX / RX (Flipper Bridge)", ro: "UART0 TX / RX (Punte Flipper)" }, color: "text-sky-500" },
];

const LED_COLORS: { id: string; hex: string; label: { en: string; ro: string } }[] = [
  { id: "cyan", hex: "#06b6d4", label: { en: "Cyan", ro: "Cyan" } },
  { id: "emerald", hex: "#10b981", label: { en: "Emerald", ro: "Smarald" } },
  { id: "amber", hex: "#f59e0b", label: { en: "Amber", ro: "Chihlimbar" } },
  { id: "rose", hex: "#f43f5e", label: { en: "Coral", ro: "Coral" } },
];

export function InteractiveEspPlayground(props: InteractiveEspPlaygroundProps) {
  if (props.audienceMode === "kids") {
    return (
      <JuniorExplorerStudio
        lang={props.lang}
        onRunSketch={props.onRunSketch}
        onOpenBench3D={props.onOpenBench3D}
      />
    );
  }
  return <EngineerEspPlayground {...props} />;
}

function EngineerEspPlayground({
  t,
  lang,
  audienceMode,
  onRunSketch,
  onOpenBench3D,
}: InteractiveEspPlaygroundProps) {
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotId>("rgb");
  const [infoTab, setInfoTab] = useState<"overview" | "pinout" | "specs">("overview");
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showSchematic, setShowSchematic] = useState(false);

  const [sketch, setSketch] = useState<SketchId>("blink");
  const [delayMs, setDelayMs] = useState(500);
  const [ledColorId, setLedColorId] = useState("cyan");
  const [isRunning, setIsRunning] = useState(false);
  const [pulsePhase, setPulsePhase] = useState(false);
  const [copied, setCopied] = useState(false);
  const [serialLines, setSerialLines] = useState<string[]>([
    lang === "ro"
      ? "[00:00.0] ESP32-S3 pregătit. Apasă „Rulează Codul” pentru simulare live."
      : "[00:00.0] ESP32-S3 ready. Click 'Run Sketch' to start live simulation.",
  ]);

  const tickRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const activeColor = LED_COLORS.find((c) => c.id === ledColorId) ?? LED_COLORS[0];
  const currentHotspot = HOTSPOTS.find((h) => h.id === selectedHotspot) ?? HOTSPOTS[0];

  const codeSnippet = useMemo(() => {
    if (sketch === "blink") {
      return `// GPIO48 RGB LED (${activeColor.label[lang]})
void app_main(void) {
  rgb_led_init(GPIO_NUM_48);
  while (1) {
    rgb_set_hex("${activeColor.hex}"); // ON
    vTaskDelay(pdMS_TO_TICKS(${delayMs}));
    rgb_set_hex("#000000");            // OFF
    vTaskDelay(pdMS_TO_TICKS(${delayMs}));
  }
}`;
    }
    if (sketch === "fridge") {
      return `// Smart Fridge Door Alert (GPIO0 Reed)
void app_main(void) {
  gpio_set_direction(GPIO_NUM_0, GPIO_MODE_INPUT);
  while (1) {
    if (gpio_get_level(GPIO_NUM_0) == 1) {
      ESP_LOGW("FRIDGE", "Door open > 20s!");
      rgb_set_hex("#f43f5e"); // Alert flash
    }
    vTaskDelay(pdMS_TO_TICKS(${delayMs}));
  }
}`;
    }
    if (sketch === "piano") {
      return `// Mini Chiptune Piano (I2S MAX98357A)
const int notes[] = { 262, 330, 392, 523 }; // C-E-G-C
void app_main(void) {
  i2s_synth_init(GPIO_NUM_4, GPIO_NUM_5, GPIO_NUM_6);
  for (int i = 0; i < 4; i++) {
    i2s_play_tone(notes[i], ${delayMs});
  }
}`;
    }
    return `// 2.4 GHz Wi-Fi Passive Scanner
void app_main(void) {
  esp_wifi_set_mode(WIFI_MODE_STA);
  esp_wifi_start();
  esp_wifi_scan_start(NULL, true);
  // Prints SSID + RSSI every ${delayMs} ms
}`;
  }, [sketch, delayMs, activeColor, lang]);

  // Play gentle Web Audio note when Mini Piano sketch runs
  const playChime = (freq: number) => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.19);
    } catch {
      // Ignore audio block in headless browsers
    }
  };

  useEffect(() => {
    if (!isRunning) {
      setPulsePhase(false);
      return;
    }
    const notes = [261.6, 329.6, 392.0, 523.3];
    const noteNames = ["C4 (262 Hz)", "E4 (330 Hz)", "G4 (392 Hz)", "C5 (523 Hz)"];
    const ssids = ["ESP-Labs-WiFi (-44 dBm)", "MakerBench_2G (-58 dBm)", "IoT_Sensors (-71 dBm)"];

    const interval = window.setInterval(() => {
      tickRef.current += 1;
      const step = tickRef.current;
      const on = step % 2 === 1;
      setPulsePhase(on);

      let line = "";
      const ts = `00:${String(Math.floor(step / 2) % 60).padStart(2, "0")}.${step % 2 ? "5" : "0"}`;
      if (sketch === "blink") {
        line =
          lang === "ro"
            ? `[${ts}] GPIO48 -> ${on ? `APRINS (${activeColor.label.ro})` : "STINS"} · pauză ${delayMs} ms`
            : `[${ts}] GPIO48 -> ${on ? `ON (${activeColor.label.en})` : "OFF"} · delay ${delayMs} ms`;
      } else if (sketch === "fridge") {
        line =
          lang === "ro"
            ? `[${ts}] Senzor Ușă: ${on ? "DESCHISĂ · Alertă LED Activă!" : "Monitorizare (3.29V)"}`
            : `[${ts}] Door Sensor: ${on ? "OPEN · LED Alert Active!" : "Monitoring (3.29V)"}`;
      } else if (sketch === "piano") {
        const idx = step % notes.length;
        playChime(notes[idx]);
        line =
          lang === "ro"
            ? `[${ts}] I2S Audio -> Nota ${noteNames[idx]} · durată ${delayMs} ms`
            : `[${ts}] I2S Audio -> Note ${noteNames[idx]} · ${delayMs} ms`;
      } else {
        const ssid = ssids[step % ssids.length];
        line =
          lang === "ro"
            ? `[${ts}] Wi-Fi Scan -> Găsit: ${ssid}`
            : `[${ts}] Wi-Fi Scan -> Found: ${ssid}`;
      }
      setSerialLines((prev) => [...prev.slice(-4), line]);
    }, Math.max(250, delayMs));

    return () => window.clearInterval(interval);
  }, [isRunning, sketch, delayMs, activeColor, lang]);

  const handleToggleRun = () => {
    if (!isRunning) {
      setIsRunning(true);
      onRunSketch?.();
      setSerialLines((prev) => [
        ...prev.slice(-3),
        lang === "ro"
          ? `[START] Compilare & rulare virtuală: ${sketch.toUpperCase()}...`
          : `[START] Virtual flash & run: ${sketch.toUpperCase()}...`,
      ]);
    } else {
      setIsRunning(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(codeSnippet).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const sketchOptions: { id: SketchId; label: { en: string; ro: string } }[] = [
    { id: "blink", label: { en: "Blink RGB LED", ro: "Blink LED RGB" } },
    { id: "fridge", label: { en: "Fridge Alarm", ro: "Alarmă Frigider" } },
    { id: "piano", label: { en: "Mini Piano", ro: "Mini Pian" } },
    { id: "wifi", label: { en: "Wi-Fi Scan", ro: "Scanare Wi-Fi" } },
  ];

  const ledFill =
    isRunning && pulsePhase
      ? sketch === "fridge"
        ? "#f43f5e"
        : activeColor.hex
      : selectedHotspot === "rgb"
        ? activeColor.hex
        : "#334155";

  const isKids = audienceMode === "kids";

  return (
    <section
      className={`rounded-2xl border overflow-hidden transition-colors ${
        isKids
          ? "border-sky-300 dark:border-sky-700/80 bg-white dark:bg-slate-900/80 shadow-sm"
          : "border-slate-300 dark:border-slate-700 bg-white dark:bg-[#090e17]"
      }`}
    >
      {/* Header Bar */}
      <div
        className={`px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 ${
          isKids
            ? "border-sky-200 dark:border-sky-800/70 bg-gradient-to-r from-sky-50 via-cyan-50/70 to-amber-50/60 dark:from-sky-950/50 dark:via-slate-900 dark:to-amber-950/30"
            : "border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80"
        }`}
      >
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            {isKids ? (
              <Sparkles className="w-4 h-4 text-amber-500" />
            ) : (
              <Cpu className="w-4 h-4 text-cyan-500" />
            )}
            <h2 className="text-base font-bold tracking-tight">
              {isKids
                ? lang === "ro"
                  ? "Banc Interactiv Explorator Junior (Stil Ilustrat)"
                  : "Junior Explorer Interactive Workbench (Illustrated)"
                : lang === "ro"
                  ? "Banc Inginer ESP32-S3 · Macro Foto Real + Deconstrucție Hardware"
                  : "Engineer Bench ESP32-S3 · Real Macro Photo + Deconstructed View"}
            </h2>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                isKids
                  ? "bg-amber-400/20 text-amber-700 dark:text-amber-300"
                  : "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300"
              }`}
            >
              {isKids
                ? lang === "ro"
                  ? "MOD COPII · learn-esp32"
                  : "KIDS STYLE · learn-esp32"
                : lang === "ro"
                  ? "MOD ADULȚI · FOTO REAL + BOM"
                  : "ADULTS STYLE · REAL PCB PHOTO"}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t.home.playgroundControlsHint}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {onOpenBench3D && (
            <button
              type="button"
              onClick={onOpenBench3D}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              <Box className="w-3.5 h-3.5" />
              {lang === "ro" ? "Deschide în Banc 3D" : "Open in 3D Bench"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setRotation((r) => r - 15)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:border-cyan-500 transition-colors cursor-pointer whitespace-nowrap"
            aria-label={t.home.rotateLeft}
            title={t.home.rotateLeft}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setRotation((r) => r + 15)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:border-cyan-500 transition-colors cursor-pointer whitespace-nowrap"
            aria-label={t.home.rotateRight}
            title={t.home.rotateRight}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.8, Number((z - 0.1).toFixed(2))))}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:border-cyan-500 transition-colors cursor-pointer whitespace-nowrap"
            aria-label={t.home.zoomOut}
            title={t.home.zoomOut}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.25, Number((z + 0.1).toFixed(2))))}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:border-cyan-500 transition-colors cursor-pointer whitespace-nowrap"
            aria-label={t.home.zoomIn}
            title={t.home.zoomIn}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowSchematic((s) => !s)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
              showSchematic
                ? "bg-cyan-600 text-white border-cyan-600"
                : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-cyan-500"
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            {t.home.schematicToggle}
          </button>
          <button
            type="button"
            onClick={() => {
              setRotation(0);
              setZoom(1);
            }}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors cursor-pointer whitespace-nowrap"
          >
            {t.home.resetView}
          </button>
        </div>
      </div>

      {/* Main 2-Zone Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left Interactive Stage (7 cols) */}
        <div
          className={`lg:col-span-7 relative min-h-[450px] p-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r overflow-hidden ${
            isKids
              ? "bg-sky-50/70 dark:bg-[#0d192b] border-sky-200 dark:border-sky-900/60"
              : "bg-[#0c1118] border-slate-200 dark:border-slate-800"
          }`}
          style={{
            backgroundImage: isKids
              ? "radial-gradient(circle, rgba(14,165,233,0.22) 1.5px, transparent 1.5px)"
              : "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)",
            backgroundSize: isKids ? "20px 20px" : "24px 24px",
          }}
        >
          {/* Quick Hotspot Selector Strip for keyboard/screen-reader accessibility */}
          <div className="flex items-center gap-1.5 flex-wrap z-10">
            {HOTSPOTS.map((spot, idx) => {
              const active = selectedHotspot === spot.id;
              return (
                <button
                  type="button"
                  key={spot.id}
                  onClick={() => {
                    setSelectedHotspot(spot.id);
                    setInfoTab("overview");
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? isKids
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : "bg-cyan-500 text-slate-950 font-bold"
                      : isKids
                        ? "bg-white/95 dark:bg-slate-900/90 border border-sky-200 dark:border-sky-800 text-slate-700 dark:text-slate-200 hover:border-amber-500"
                        : "bg-slate-900/90 border border-slate-700 text-slate-300 hover:border-cyan-400"
                  }`}
                >
                  <span className="font-mono opacity-75 mr-1">{idx + 1}.</span>
                  {spot.label[lang]}
                </button>
              );
            })}
          </div>

          {/* Interactive Board Stage: Kids = Playful Illustrated SVG | Adults = Real Studio Macro Photo + Deconstructed Hotspots */}
          <div className="flex-1 flex flex-col items-center justify-center py-4 gap-3">
            {isKids ? (
              <div
                className="transition-transform duration-200 ease-out"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                }}
              >
                <svg
                  viewBox="0 0 480 330"
                  className="w-full max-w-[440px] h-auto select-none drop-shadow-xl"
                  role="img"
                  aria-label="Interactive ESP32-S3-DevKitC-1 illustrated board diagram"
                >
                {/* Live Radio / Audio Waves when running */}
                {isRunning && sketch === "wifi" && (
                  <g stroke="#06b6d4" fill="none" strokeWidth="2" opacity={pulsePhase ? 0.9 : 0.35}>
                    <path d="M 210 26 A 38 38 0 0 1 270 26" />
                    <path d="M 194 14 A 58 58 0 0 1 286 14" />
                  </g>
                )}
                {isRunning && sketch === "piano" && (
                  <g stroke="#f59e0b" fill="none" strokeWidth="2" opacity={pulsePhase ? 0.9 : 0.35}>
                    <circle cx="288" cy="204" r="22" />
                    <circle cx="288" cy="204" r="34" strokeDasharray="4 4" />
                  </g>
                )}

                {/* PCB Main Body */}
                <rect
                  x="118"
                  y="32"
                  width="244"
                  height="266"
                  rx="14"
                  fill="#0f172a"
                  stroke="#334155"
                  strokeWidth="2.5"
                />
                {/* PCB Subtle Copper Traces */}
                <path
                  d="M150 90 H175 V150 M330 90 H305 V180 M240 165 V268 M288 204 H330"
                  stroke="#1e293b"
                  strokeWidth="2"
                  fill="none"
                />

                {/* Antenna Keep-Out Zone */}
                <rect
                  x="178"
                  y="36"
                  width="124"
                  height="32"
                  rx="4"
                  fill="#1e293b"
                  stroke={selectedHotspot === "antenna" ? "#06b6d4" : "#475569"}
                  strokeWidth={selectedHotspot === "antenna" ? "2" : "1"}
                  onClick={() => setSelectedHotspot("antenna")}
                  className="cursor-pointer"
                />
                <path
                  d="M196 58 V44 H210 V58 H224 V44 H238 V58 H252 V44 H266 V58 H280 V44"
                  stroke="#eab308"
                  strokeWidth="2.4"
                  fill="none"
                />

                {/* ESP32-S3-WROOM-1 Metal RF Shield */}
                <rect
                  x="174"
                  y="74"
                  width="132"
                  height="96"
                  rx="6"
                  fill="#cbd5e1"
                  stroke={selectedHotspot === "module" ? "#06b6d4" : "#94a3b8"}
                  strokeWidth={selectedHotspot === "module" ? "3" : "1.5"}
                  onClick={() => setSelectedHotspot("module")}
                  className="cursor-pointer"
                />
                <text
                  x="240"
                  y="112"
                  textAnchor="middle"
                  fill="#0f172a"
                  fontSize="12"
                  fontWeight="700"
                  fontFamily="IBM Plex Mono, monospace"
                >
                  ESP32-S3
                </text>
                <text
                  x="240"
                  y="130"
                  textAnchor="middle"
                  fill="#334155"
                  fontSize="9"
                  fontFamily="IBM Plex Mono, monospace"
                >
                  WROOM-1 · N8R8
                </text>
                <text
                  x="240"
                  y="146"
                  textAnchor="middle"
                  fill="#475569"
                  fontSize="8"
                  fontFamily="IBM Plex Mono, monospace"
                >
                  240 MHz · Wi-Fi + BLE
                </text>

                {/* Left & Right 22-pin GPIO Headers */}
                {Array.from({ length: 14 }).map((_, i) => {
                  const y = 62 + i * 16;
                  return (
                    <g key={i}>
                      <rect
                        x="126"
                        y={y}
                        width="16"
                        height="10"
                        rx="2"
                        fill="#1e293b"
                        stroke={selectedHotspot === "gpio" ? "#06b6d4" : "#475569"}
                        strokeWidth="1"
                        onClick={() => setSelectedHotspot("gpio")}
                        className="cursor-pointer"
                      />
                      <circle cx="134" cy={y + 5} r="2.6" fill="#eab308" />

                      <rect
                        x="338"
                        y={y}
                        width="16"
                        height="10"
                        rx="2"
                        fill="#1e293b"
                        stroke={selectedHotspot === "power" ? "#06b6d4" : "#475569"}
                        strokeWidth="1"
                        onClick={() => setSelectedHotspot("power")}
                        className="cursor-pointer"
                      />
                      <circle cx="346" cy={y + 5} r="2.6" fill="#eab308" />
                    </g>
                  );
                })}

                {/* Onboard RGB LED (GPIO48) */}
                <g onClick={() => setSelectedHotspot("rgb")} className="cursor-pointer">
                  <rect
                    x="274"
                    y="190"
                    width="28"
                    height="28"
                    rx="5"
                    fill="#1e293b"
                    stroke={selectedHotspot === "rgb" ? "#06b6d4" : "#64748b"}
                    strokeWidth="2"
                  />
                  <circle cx="288" cy="204" r="8" fill={ledFill} />
                  {isRunning && pulsePhase && (
                    <circle cx="288" cy="204" r="14" fill={ledFill} opacity="0.28" />
                  )}
                  <text
                    x="288"
                    y="230"
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="8"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    RGB GPIO48
                  </text>
                </g>

                {/* LDO 3.3V Regulator */}
                <g onClick={() => setSelectedHotspot("power")} className="cursor-pointer">
                  <rect
                    x="174"
                    y="192"
                    width="34"
                    height="24"
                    rx="3"
                    fill="#334155"
                    stroke={selectedHotspot === "power" ? "#06b6d4" : "#64748b"}
                    strokeWidth="1.5"
                  />
                  <text
                    x="191"
                    y="207"
                    textAnchor="middle"
                    fill="#e2e8f0"
                    fontSize="7.5"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    3.3V LDO
                  </text>
                </g>

                {/* BOOT & RST Buttons */}
                <g onClick={() => setSelectedHotspot("boot")} className="cursor-pointer">
                  <rect
                    x="178"
                    y="236"
                    width="32"
                    height="20"
                    rx="4"
                    fill="#334155"
                    stroke={selectedHotspot === "boot" ? "#06b6d4" : "#94a3b8"}
                    strokeWidth="1.5"
                  />
                  <circle cx="194" cy="246" r="5" fill="#cbd5e1" />
                  <text
                    x="194"
                    y="266"
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="8"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    BOOT
                  </text>
                </g>
                <g>
                  <rect x="270" y="236" width="32" height="20" rx="4" fill="#334155" stroke="#64748b" strokeWidth="1.2" />
                  <circle cx="286" cy="246" r="5" fill="#94a3b8" />
                  <text x="286" y="266" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="IBM Plex Mono, monospace">
                    RST
                  </text>
                </g>

                {/* Dual USB-C Ports */}
                <g onClick={() => setSelectedHotspot("usbc")} className="cursor-pointer">
                  <rect
                    x="182"
                    y="276"
                    width="44"
                    height="26"
                    rx="5"
                    fill="#94a3b8"
                    stroke={selectedHotspot === "usbc" ? "#06b6d4" : "#cbd5e1"}
                    strokeWidth="2"
                  />
                  <rect
                    x="254"
                    y="276"
                    width="44"
                    height="26"
                    rx="5"
                    fill="#94a3b8"
                    stroke={selectedHotspot === "usbc" ? "#06b6d4" : "#cbd5e1"}
                    strokeWidth="2"
                  />
                  <text x="204" y="292" textAnchor="middle" fill="#0f172a" fontSize="7.5" fontWeight="700" fontFamily="IBM Plex Mono, monospace">
                    USB
                  </text>
                  <text x="276" y="292" textAnchor="middle" fill="#0f172a" fontSize="7.5" fontWeight="700" fontFamily="IBM Plex Mono, monospace">
                    UART
                  </text>
                </g>

                {/* Interactive Numbered Hotspot Markers */}
                {HOTSPOTS.map((spot, idx) => {
                  const active = selectedHotspot === spot.id;
                  return (
                    <g
                      key={spot.id}
                      onClick={() => {
                        setSelectedHotspot(spot.id);
                        setInfoTab("overview");
                      }}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={spot.x}
                        cy={spot.y}
                        r={active ? 11 : 9}
                        fill={active ? "#06b6d4" : "#0f172a"}
                        stroke={active ? "#ffffff" : "#38bdf8"}
                        strokeWidth="2"
                      />
                      <text
                        x={spot.x}
                        y={spot.y + 3.5}
                        textAnchor="middle"
                        fill={active ? "#0f172a" : "#e0f2fe"}
                        fontSize="9.5"
                        fontWeight="700"
                        fontFamily="IBM Plex Mono, monospace"
                      >
                        {idx + 1}
                      </text>
                    </g>
                  );
                })}
                </svg>
              </div>
            ) : (
              /* ADULTS ENGINEER MODE: Real Studio Macro Photo + Matching Deconstructed Interactive Hotspots */
              <div className="w-full flex flex-col items-center gap-3">
                <div className="flex items-center justify-between w-full max-w-[440px] text-[11px] font-mono text-slate-400">
                  <span>ESP32-S3-DevKitC-1 · 62.74 × 25.40 mm</span>
                  <span className="text-cyan-400">{currentHotspot.pcbRef}</span>
                </div>

                <div
                  className="relative w-full max-w-[300px] rounded-xl overflow-hidden border border-slate-700 shadow-2xl transition-transform duration-200 ease-out select-none bg-[#1c2229]"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  }}
                >
                  <img
                    src={esp32RealTopImg}
                    alt="Real ESP32-S3-DevKitC-1 hardware macro photograph with interactive deconstructed hotspots"
                    className="w-full h-auto block"
                    draggable={false}
                  />

                  {/* Live WS2812 RGB LED physical optical glow directly over U3 */}
                  {(isRunning || selectedHotspot === "rgb") && (
                    <div
                      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-150"
                      style={{
                        left: "41%",
                        top: "53.5%",
                        width: isRunning && pulsePhase ? "34px" : "18px",
                        height: isRunning && pulsePhase ? "34px" : "18px",
                        background: `radial-gradient(circle, #ffffff 0%, ${ledFill} 42%, transparent 72%)`,
                        opacity: isRunning ? (pulsePhase ? 0.95 : 0.25) : 0.65,
                        boxShadow:
                          isRunning && pulsePhase ? `0 0 22px 6px ${ledFill}` : "none",
                      }}
                    />
                  )}

                  {/* Live RF Antenna Emission Indicator when Wi-Fi Scan runs */}
                  {isRunning && sketch === "wifi" && (
                    <div
                      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-cyan-400 transition-opacity duration-150"
                      style={{
                        left: "50%",
                        top: "13%",
                        width: "36%",
                        height: "10%",
                        opacity: pulsePhase ? 0.9 : 0.25,
                        boxShadow: pulsePhase ? "0 0 18px rgba(6,182,212,0.75)" : "none",
                      }}
                    />
                  )}

                  {/* Matching 7 Deconstructed Component Hotspots on Real Hardware */}
                  {HOTSPOTS.map((spot, idx) => {
                    const active = selectedHotspot === spot.id;
                    return (
                      <button
                        key={spot.id}
                        type="button"
                        onClick={() => {
                          setSelectedHotspot(spot.id);
                          setInfoTab("overview");
                        }}
                        title={`${spot.pcbRef} — ${spot.label[lang]}`}
                        aria-label={`${spot.label[lang]} (${spot.pcbRef})`}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center font-mono text-[10px] font-bold transition-all cursor-pointer ${
                          active
                            ? "w-7 h-7 bg-cyan-400 text-slate-950 ring-2 ring-white shadow-lg scale-110 z-20"
                            : "w-6 h-6 bg-slate-950/85 text-cyan-200 border border-cyan-400/80 hover:scale-110 hover:bg-cyan-500 hover:text-slate-950 z-10"
                        }`}
                        style={{
                          left: `${spot.photoX}%`,
                          top: `${spot.photoY}%`,
                        }}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Deconstructed Subsystem BOM Strip for Adults Mode */}
                <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-mono">
                  {HOTSPOTS.slice(0, 4).map((spot, idx) => {
                    const active = selectedHotspot === spot.id;
                    return (
                      <button
                        key={`bom-${spot.id}`}
                        type="button"
                        onClick={() => {
                          setSelectedHotspot(spot.id);
                          setInfoTab("overview");
                        }}
                        className={`text-left px-2 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                          active
                            ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                            : "bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-600"
                        }`}
                      >
                        <div className="font-bold text-slate-200 truncate">
                          0{idx + 1} · {spot.pcbRef.split(" · ")[0]}
                        </div>
                        <div className="truncate opacity-80">{spot.pinRef}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Toggleable Circuit Schematic Inset */}
          {showSchematic && (
            <div className="mt-2 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>{t.home.schematicTitle}</span>
                <span className="font-mono text-cyan-600 dark:text-cyan-400">5V → 3.3V · GPIO48 · GPIO0</span>
              </div>
              <svg viewBox="0 0 540 82" className="w-full h-16" aria-label={t.home.schematicTitle}>
                <rect x="8" y="18" width="90" height="44" rx="6" fill="none" stroke="#06b6d4" strokeWidth="1.5" />
                <text x="53" y="38" textAnchor="middle" fill="currentColor" fontSize="10" fontFamily="IBM Plex Mono, monospace">USB-C 5V</text>
                <text x="53" y="52" textAnchor="middle" fill="#64748b" fontSize="8.5" fontFamily="IBM Plex Mono, monospace">VBUS</text>
                <line x1="98" y1="40" x2="146" y2="40" stroke="#06b6d4" strokeWidth="1.5" />

                <rect x="146" y="18" width="102" height="44" rx="6" fill="none" stroke="#10b981" strokeWidth="1.5" />
                <text x="197" y="38" textAnchor="middle" fill="currentColor" fontSize="10" fontFamily="IBM Plex Mono, monospace">LDO 3.3V</text>
                <text x="197" y="52" textAnchor="middle" fill="#64748b" fontSize="8.5" fontFamily="IBM Plex Mono, monospace">500 mA max</text>
                <line x1="248" y1="40" x2="296" y2="40" stroke="#10b981" strokeWidth="1.5" />

                <rect x="296" y="14" width="112" height="52" rx="6" fill="none" stroke="#6366f1" strokeWidth="1.8" />
                <text x="352" y="36" textAnchor="middle" fill="currentColor" fontSize="10.5" fontWeight="700" fontFamily="IBM Plex Mono, monospace">ESP32-S3</text>
                <text x="352" y="52" textAnchor="middle" fill="#64748b" fontSize="8.5" fontFamily="IBM Plex Mono, monospace">GPIO48 / GPIO0</text>
                <line x1="408" y1="28" x2="444" y2="28" stroke="#f59e0b" strokeWidth="1.5" />
                <line x1="408" y1="54" x2="444" y2="54" stroke="#06b6d4" strokeWidth="1.5" />

                <rect x="444" y="12" width="88" height="26" rx="4" fill="none" stroke="#f59e0b" strokeWidth="1.4" />
                <text x="488" y="29" textAnchor="middle" fill="currentColor" fontSize="9" fontFamily="IBM Plex Mono, monospace">WS2812 RGB</text>
                <rect x="444" y="44" width="88" height="26" rx="4" fill="none" stroke="#06b6d4" strokeWidth="1.4" />
                <text x="488" y="61" textAnchor="middle" fill="currentColor" fontSize="9" fontFamily="IBM Plex Mono, monospace">BOOT → GND</text>
              </svg>
              <p className="text-xs text-slate-600 dark:text-slate-400">{t.home.schematicNote}</p>
            </div>
          )}
        </div>

        {/* Right Info + Try It Yourself Deck (5 cols) */}
        <div className="lg:col-span-5 p-5 flex flex-col justify-between gap-5">
          {/* Tabbed Inspector Card */}
          <div className="space-y-3">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80">
              {(
                [
                  { id: "overview", label: t.home.tabOverview },
                  { id: "pinout", label: t.home.tabPinout },
                  { id: "specs", label: t.home.tabSpecs },
                ] as const
              ).map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setInfoTab(tab.id)}
                  className={`flex-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    infoTab === tab.id
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {infoTab === "overview" && (
              <div className="space-y-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-sm font-bold">{currentHotspot.label[lang]}</h3>
                  <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400">
                    {currentHotspot.pinRef}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {audienceMode === "kids"
                    ? currentHotspot.kidsDesc[lang]
                    : currentHotspot.adultsDesc[lang]}
                </p>
                <ul className="space-y-1 pt-1">
                  {currentHotspot.specs[lang].map((line, i) => (
                    <li key={i} className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      – {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {infoTab === "pinout" && (
              <div className="space-y-1.5">
                {QUICK_PINOUT.map((row) => (
                  <div
                    key={row.pin}
                    className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0 text-xs"
                  >
                    <span className={`font-mono font-bold ${row.color}`}>{row.pin}</span>
                    <span className="text-slate-600 dark:text-slate-300 text-right">{row.role[lang]}</span>
                  </div>
                ))}
              </div>
            )}

            {infoTab === "specs" && (
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500">MCU</div>
                  <div className="font-mono font-semibold mt-0.5">2× LX7 @ 240 MHz</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500">Wireless</div>
                  <div className="font-mono font-semibold mt-0.5">Wi-Fi 4 + BLE 5.0</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500">Flash / PSRAM</div>
                  <div className="font-mono font-semibold mt-0.5">8–16 MB / 8 MB</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500">{t.boardSize}</div>
                  <div className="font-mono font-semibold mt-0.5 tabular-nums">62.74 × 25.40 mm</div>
                </div>
              </div>
            )}
          </div>

          {/* Try It Yourself Runnable Sketch Box */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold">{t.home.tryItTitle}</h3>
              <span
                className={`text-xs font-mono font-semibold ${
                  isRunning
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {isRunning ? t.home.runningStatus : t.home.stoppedStatus}
              </span>
            </div>

            {/* Sketch Selector */}
            <div className="flex flex-wrap gap-1.5">
              {sketchOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => {
                    setSketch(opt.id);
                    setIsRunning(false);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    sketch === opt.id
                      ? "bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 font-semibold"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {opt.label[lang]}
                </button>
              ))}
            </div>

            {/* Interactive Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <label className="flex items-center gap-2 font-mono text-slate-600 dark:text-slate-400">
                <span>
                  {t.home.sketchSpeedLabel}: <strong className="tabular-nums">{delayMs} ms</strong>
                </span>
                <input
                  type="range"
                  min={250}
                  max={1000}
                  step={50}
                  value={delayMs}
                  onChange={(e) => setDelayMs(Number(e.target.value))}
                  className="w-24 accent-cyan-500"
                />
              </label>

              {sketch === "blink" && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">{t.home.sketchColorLabel}:</span>
                  {LED_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setLedColorId(c.id)}
                      aria-label={c.label[lang]}
                      title={c.label[lang]}
                      className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                        ledColorId === c.id
                          ? "border-slate-900 dark:border-white scale-110"
                          : "border-transparent opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Code Box */}
            <div className="relative rounded-xl bg-slate-950 text-slate-100 p-3 font-mono text-[11px] leading-relaxed overflow-x-auto border border-slate-800">
              <button
                type="button"
                onClick={handleCopyCode}
                className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? t.copied : t.copy}
              </button>
              <pre className="pr-16">{codeSnippet}</pre>
            </div>

            {/* Run + Inline Serial Monitor */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleRun}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  isRunning
                    ? "bg-rose-600 hover:bg-rose-500 text-white"
                    : "bg-cyan-600 hover:bg-cyan-500 text-white"
                }`}
              >
                {isRunning ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isRunning ? t.home.stopSketch : t.home.runSketch}
              </button>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {t.home.serialTitle}
              </span>
            </div>

            <div
              className="rounded-lg bg-slate-950 text-emerald-300 font-mono text-[11px] p-2.5 space-y-1 min-h-[68px] border border-slate-800"
              aria-live="polite"
            >
              {serialLines.map((line, i) => (
                <div key={i} className="truncate">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Adult Engineer Mode: Integrated Screw-Level Mechanical & BOM Drill-Down */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-4 sm:p-5 bg-slate-50/50 dark:bg-[#070b13]">
        <BoardTeardownDrilldown board={OFFICIAL_ESP_BOARDS[0]} lang={lang} compact />
      </div>
    </section>
  );
}
