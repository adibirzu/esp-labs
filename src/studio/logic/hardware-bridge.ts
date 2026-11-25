export type HardwareProfileId =
  | "esp32-s3"
  | "flipper-zero"
  | "marauder-ghost"
  | "micropython";

export interface QuickDeviceCommand {
  id: string;
  label: string;
  command: string;
  descEn: string;
  descRo: string;
}

export interface HardwareProfileSpec {
  id: HardwareProfileId;
  name: string;
  defaultBaud: number;
  lineEnding: "\r\n" | "\n";
  commands: QuickDeviceCommand[];
}

export const HARDWARE_PROFILES: HardwareProfileSpec[] = [
  {
    id: "esp32-s3",
    name: "ESP32-S3 / ESP-IDF UART",
    defaultBaud: 115200,
    lineEnding: "\r\n",
    commands: [
      { id: "help", label: "help", command: "help", descEn: "List firmware CLI commands", descRo: "Listează comenzile firmware CLI" },
      { id: "info", label: "chip_info", command: "chip_info", descEn: "Query SoC & PSRAM status", descRo: "Interoghează SoC & PSRAM" },
      { id: "led", label: "rgb cyan", command: "rgb #06b6d4", descEn: "Set GPIO48 WS2812 to Cyan", descRo: "Setează LED GPIO48 pe Cyan" },
      { id: "i2c", label: "i2c_scan", command: "i2c_scan", descEn: "Scan I2C bus (OLED 0x3C)", descRo: "Scanează magistrala I2C (OLED 0x3C)" },
    ],
  },
  {
    id: "flipper-zero",
    name: "Flipper Zero USB-C CLI",
    defaultBaud: 230400,
    lineEnding: "\r\n",
    commands: [
      { id: "f-info", label: "device_info", command: "device_info", descEn: "Hardware model, UID & firmware", descRo: "Model hardware, UID & firmware" },
      { id: "f-pow", label: "power info", command: "power info", descEn: "Battery %, voltage & temp", descRo: "Baterie %, tensiune & temp" },
      { id: "f-led", label: "led b 255", command: "led b 255", descEn: "Light Flipper LED blue", descRo: "Aprinde LED-ul Flipper albastru" },
      { id: "f-gpio", label: "gpio mode PA7 1", command: "gpio mode PA7 1", descEn: "Set Pin 2 (PA7) as output", descRo: "Setează Pin 2 (PA7) ca ieșire" },
    ],
  },
  {
    id: "marauder-ghost",
    name: "ESP32 Marauder / GhostESP",
    defaultBaud: 115200,
    lineEnding: "\n",
    commands: [
      { id: "m-help", label: "help", command: "help", descEn: "Show Marauder/Ghost commands", descRo: "Afișează comenzile Marauder/Ghost" },
      { id: "m-scan", label: "scanap", command: "scanap", descEn: "Passive 2.4 GHz AP scan", descRo: "Scanare pasivă AP 2.4 GHz" },
      { id: "m-list", label: "list -a", command: "list -a", descEn: "Print discovered APs", descRo: "Afișează rețelele descoperite" },
      { id: "m-stop", label: "stopscan", command: "stopscan", descEn: "Stop active RF scan", descRo: "Oprește scanarea RF activă" },
    ],
  },
  {
    id: "micropython",
    name: "MicroPython REPL",
    defaultBaud: 115200,
    lineEnding: "\r\n",
    commands: [
      { id: "py-sys", label: "sys.implementation", command: "import sys; print(sys.implementation)", descEn: "Print MicroPython version", descRo: "Afișează versiunea MicroPython" },
      { id: "py-mem", label: "gc.mem_free()", command: "import gc; print('Free RAM:', gc.mem_free())", descEn: "Check free heap bytes", descRo: "Verifică memoria RAM liberă" },
      { id: "py-pin", label: "Pin(48).value(1)", command: "from machine import Pin; Pin(48, Pin.OUT).value(1)", descEn: "Drive GPIO48 HIGH", descRo: "Comandă GPIO48 HIGH" },
    ],
  },
];

export interface BrowserHardwareCapabilities {
  webSerialSupported: boolean;
  webBluetoothSupported: boolean;
  inCrossOriginIframe: boolean;
}

export function detectBrowserHardwareSupport(): BrowserHardwareCapabilities {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      webSerialSupported: false,
      webBluetoothSupported: false,
      inCrossOriginIframe: false,
    };
  }
  const nav = navigator as Navigator & { serial?: unknown; bluetooth?: unknown };
  let inIframe: boolean;
  try {
    inIframe = window.self !== window.top;
  } catch {
    inIframe = true;
  }
  return {
    webSerialSupported: Boolean(nav.serial),
    webBluetoothSupported: Boolean(nav.bluetooth),
    inCrossOriginIframe: inIframe,
  };
}

export interface ParsedSerialTelemetry {
  rgbHex?: string;
  oledText?: string;
  rfidUid?: string;
  flipperMode?: string;
}

/**
 * Pure parser that inspects real incoming UART/CLI lines and extracts
 * live signals to mirror onto the 3D workbench OLED / RGB LED / RFID card.
 */
export function parseHardwareTelemetryLine(line: string): ParsedSerialTelemetry {
  const result: ParsedSerialTelemetry = {};
  const hexMatch = line.match(/#([0-9a-fA-F]{6})\b/);
  if (hexMatch) {
    result.rgbHex = `#${hexMatch[1].toLowerCase()}`;
  } else if (/cyan/i.test(line)) {
    result.rgbHex = "#06b6d4";
  } else if (/emerald|green/i.test(line)) {
    result.rgbHex = "#10b981";
  } else if (/amber|orange/i.test(line)) {
    result.rgbHex = "#f59e0b";
  } else if (/coral|red/i.test(line)) {
    result.rgbHex = "#f43f5e";
  }

  const uidMatch = line.match(/UID[:\s]+([0-9A-Fa-f]{2}(?:[:\s-][0-9A-Fa-f]{2}){3,6})/);
  if (uidMatch) {
    result.rfidUid = uidMatch[1].replace(/[\s-]+/g, ":").toUpperCase();
  }

  if (/subghz/i.test(line)) result.flipperMode = "Sub-GHz 433.92 MHz";
  else if (/nfc|rfid/i.test(line)) result.flipperMode = "NFC 13.56 MHz";
  else if (/gpio|uart/i.test(line)) result.flipperMode = "GPIO UART Bridge";

  const trimmed = line.trim();
  if (trimmed.length > 0 && trimmed.length <= 64) {
    result.oledText = trimmed;
  }
  return result;
}

export const ECOSYSTEM_HARDWARE_TOOLS = [
  {
    id: "esp-launchpad",
    name: "Espressif Launchpad (Web Flasher)",
    url: "https://espressif.github.io/esp-launchpad/",
    descEn: "Flash official ESP-IDF / Matter / RainMaker firmware to ESP32-S3 via Chrome Web Serial.",
    descRo: "Scrie firmware oficial ESP-IDF / Matter pe ESP32-S3 direct din Chrome prin Web Serial.",
  },
  {
    id: "flipper-lab",
    name: "Flipper Lab (Official Web Serial Hub)",
    url: "https://lab.flipper.net/",
    descEn: "Connect Flipper Zero over USB-C for live screen mirror, CLI terminal, and FAP app installs.",
    descRo: "Conectează Flipper Zero prin USB-C pentru oglindire ecran, terminal CLI și instalare aplicații FAP.",
  },
  {
    id: "esp-web-tools",
    name: "ESP Web Tools (WLED / ESPHome / GhostESP)",
    url: "https://esphome.github.io/esp-web-tools/",
    descEn: "Open-source Web Serial flashing standard used by ESP32 Marauder, GhostESP, and ESPHome.",
    descRo: "Standard open-source Web Serial folosit de ESP32 Marauder, GhostESP și ESPHome.",
  },
];
