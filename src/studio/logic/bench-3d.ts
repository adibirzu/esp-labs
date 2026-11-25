import type { BenchBoardPose, BenchLayoutMap } from "../firebase/payload-validators";

export type BenchBoardId =
  | "esp32-s3"
  | "flipper-zero"
  | "ssd1306-oled"
  | "mfrc522-rfid"
  | "max98357a-audio"
  | "breadboard-830";

export type WiringPresetId = "none" | "oled-i2c" | "rfid-spi" | "flipper-uart" | "audio-i2s";

export interface BenchBoardMeta {
  id: BenchBoardId;
  name: string;
  sizeMm: string;
  categoryRo: string;
  categoryEn: string;
  defaultPose: BenchBoardPose;
  footprintHalfX: number;
  footprintHalfZ: number;
}

// World scale: 1 Three.js unit = 10 mm (1 cm)
export const BENCH_BOARDS: BenchBoardMeta[] = [
  {
    id: "esp32-s3",
    name: "ESP32-S3-DevKitC-1",
    sizeMm: "62.7 × 25.4 mm",
    categoryRo: "Microcontroler Principal",
    categoryEn: "Primary MCU",
    defaultPose: { x: -2.1, y: 0, z: -2.4, rotY: 0 },
    footprintHalfX: 1.4,
    footprintHalfZ: 3.2,
  },
  {
    id: "flipper-zero",
    name: "Flipper Zero",
    sizeMm: "100.3 × 40.1 mm",
    categoryRo: "Multi-Tool RF / GPIO",
    categoryEn: "RF / GPIO Multi-Tool",
    defaultPose: { x: 7.4, y: 0, z: -0.6, rotY: -0.08 },
    footprintHalfX: 2.1,
    footprintHalfZ: 5.1,
  },
  {
    id: "ssd1306-oled",
    name: 'OLED SSD1306 0.96"',
    sizeMm: "27.0 × 27.0 mm",
    categoryRo: "Afișaj I2C 128×64",
    categoryEn: "I2C 128×64 Display",
    defaultPose: { x: 1.6, y: 0, z: -3.2, rotY: 0 },
    footprintHalfX: 1.4,
    footprintHalfZ: 1.4,
  },
  {
    id: "mfrc522-rfid",
    name: "MFRC522 RFID 13.56 MHz",
    sizeMm: "60.0 × 40.0 mm",
    categoryRo: "Cititor NFC / RFID SPI",
    categoryEn: "SPI NFC / RFID Reader",
    defaultPose: { x: -6.8, y: 0, z: -2.4, rotY: 0.05 },
    footprintHalfX: 2.1,
    footprintHalfZ: 3.1,
  },
  {
    id: "max98357a-audio",
    name: "MAX98357A + Speaker 3W",
    sizeMm: "40.0 × 28.0 mm",
    categoryRo: "Amplificator Audio I2S",
    categoryEn: "I2S Audio Amp",
    defaultPose: { x: 1.7, y: 0, z: 0.1, rotY: 0 },
    footprintHalfX: 2.0,
    footprintHalfZ: 1.5,
  },
  {
    id: "breadboard-830",
    name: "Breadboard 830 Puncte",
    sizeMm: "165.0 × 55.0 mm",
    categoryRo: "Placă Prototipare",
    categoryEn: "Solderless Breadboard",
    defaultPose: { x: -3.6, y: 0, z: 5.2, rotY: 0 },
    footprintHalfX: 8.3,
    footprintHalfZ: 2.8,
  },
];

export interface WireConnectionSpec {
  id: string;
  preset: Exclude<WiringPresetId, "none">;
  fromBoard: BenchBoardId;
  fromOffset: [number, number, number];
  toBoard: BenchBoardId;
  toOffset: [number, number, number];
  color: string;
  label: string;
}

export const BENCH_WIRE_CONNECTIONS: WireConnectionSpec[] = [
  // OLED I2C (ESP32-S3 -> SSD1306)
  {
    id: "oled-3v3",
    preset: "oled-i2c",
    fromBoard: "esp32-s3",
    fromOffset: [-1.15, 0.55, -2.1],
    toBoard: "ssd1306-oled",
    toOffset: [-0.4, 0.35, -1.15],
    color: "#ef4444",
    label: "3V3 -> VCC",
  },
  {
    id: "oled-gnd",
    preset: "oled-i2c",
    fromBoard: "esp32-s3",
    fromOffset: [1.15, 0.55, -2.1],
    toBoard: "ssd1306-oled",
    toOffset: [-0.15, 0.35, -1.15],
    color: "#334155",
    label: "GND -> GND",
  },
  {
    id: "oled-sda",
    preset: "oled-i2c",
    fromBoard: "esp32-s3",
    fromOffset: [-1.15, 0.55, -0.3],
    toBoard: "ssd1306-oled",
    toOffset: [0.4, 0.35, -1.15],
    color: "#06b6d4",
    label: "GPIO8 -> SDA",
  },
  {
    id: "oled-scl",
    preset: "oled-i2c",
    fromBoard: "esp32-s3",
    fromOffset: [-1.15, 0.55, 0.05],
    toBoard: "ssd1306-oled",
    toOffset: [0.15, 0.35, -1.15],
    color: "#f59e0b",
    label: "GPIO9 -> SCL",
  },

  // Flipper Zero UART Bridge (Flipper 18-Pin -> ESP32-S3)
  {
    id: "flip-3v3",
    preset: "flipper-uart",
    fromBoard: "flipper-zero",
    fromOffset: [0.0, 1.45, -4.8],
    toBoard: "esp32-s3",
    toOffset: [-1.15, 0.55, -2.1],
    color: "#ef4444",
    label: "Pin 9 (3V3) -> 3V3",
  },
  {
    id: "flip-gnd",
    preset: "flipper-uart",
    fromBoard: "flipper-zero",
    fromOffset: [0.45, 1.45, -4.8],
    toBoard: "esp32-s3",
    toOffset: [1.15, 0.55, -2.1],
    color: "#334155",
    label: "Pin 11 (GND) -> GND",
  },
  {
    id: "flip-tx",
    preset: "flipper-uart",
    fromBoard: "flipper-zero",
    fromOffset: [0.9, 1.45, -4.8],
    toBoard: "esp32-s3",
    toOffset: [1.15, 0.55, 1.4],
    color: "#06b6d4",
    label: "Pin 13 (TX) -> RX (GPIO44)",
  },
  {
    id: "flip-rx",
    preset: "flipper-uart",
    fromBoard: "flipper-zero",
    fromOffset: [1.15, 1.45, -4.8],
    toBoard: "esp32-s3",
    toOffset: [1.15, 0.55, 1.1],
    color: "#f59e0b",
    label: "Pin 14 (RX) -> TX (GPIO43)",
  },

  // RFID SPI2 (ESP32-S3 -> MFRC522)
  {
    id: "rfid-3v3",
    preset: "rfid-spi",
    fromBoard: "esp32-s3",
    fromOffset: [-1.15, 0.55, -2.1],
    toBoard: "mfrc522-rfid",
    toOffset: [0.9, 0.35, 2.75],
    color: "#ef4444",
    label: "3V3 -> 3.3V (ONLY)",
  },
  {
    id: "rfid-sck",
    preset: "rfid-spi",
    fromBoard: "esp32-s3",
    fromOffset: [-1.15, 0.55, 0.8],
    toBoard: "mfrc522-rfid",
    toOffset: [-0.3, 0.35, 2.75],
    color: "#8b5cf6",
    label: "GPIO12 -> SCK",
  },
  {
    id: "rfid-mosi",
    preset: "rfid-spi",
    fromBoard: "esp32-s3",
    fromOffset: [-1.15, 0.55, 0.45],
    toBoard: "mfrc522-rfid",
    toOffset: [0.0, 0.35, 2.75],
    color: "#10b981",
    label: "GPIO11 -> MOSI",
  },
  {
    id: "rfid-miso",
    preset: "rfid-spi",
    fromBoard: "esp32-s3",
    fromOffset: [-1.15, 0.55, 1.15],
    toBoard: "mfrc522-rfid",
    toOffset: [0.3, 0.35, 2.75],
    color: "#06b6d4",
    label: "GPIO13 -> MISO",
  },

  // Audio I2S (ESP32-S3 -> MAX98357A)
  {
    id: "i2s-bclk",
    preset: "audio-i2s",
    fromBoard: "esp32-s3",
    fromOffset: [-1.15, 0.55, -1.3],
    toBoard: "max98357a-audio",
    toOffset: [-0.3, 0.35, -1.2],
    color: "#8b5cf6",
    label: "GPIO4 -> BCLK",
  },
  {
    id: "i2s-lrc",
    preset: "audio-i2s",
    fromBoard: "esp32-s3",
    fromOffset: [-1.15, 0.55, -0.95],
    toBoard: "max98357a-audio",
    toOffset: [0.0, 0.35, -1.2],
    color: "#10b981",
    label: "GPIO5 -> LRC",
  },
  {
    id: "i2s-din",
    preset: "audio-i2s",
    fromBoard: "esp32-s3",
    fromOffset: [-1.15, 0.55, -0.6],
    toBoard: "max98357a-audio",
    toOffset: [0.3, 0.35, -1.2],
    color: "#f59e0b",
    label: "GPIO6 -> DIN",
  },
];

export function getDefaultBenchLayout(): BenchLayoutMap {
  const layout: BenchLayoutMap = {};
  for (const b of BENCH_BOARDS) {
    layout[b.id] = { ...b.defaultPose };
  }
  return layout;
}

export function clampBoardPoseToBench(pose: BenchBoardPose): BenchBoardPose {
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  return {
    x: Math.round(clamp(pose.x, -16, 16) * 100) / 100,
    y: Math.round(clamp(pose.y, 0, 8) * 100) / 100,
    z: Math.round(clamp(pose.z, -11, 11) * 100) / 100,
    rotY: Math.round(pose.rotY * 1000) / 1000,
  };
}

export function mergeSavedBenchLayout(saved?: BenchLayoutMap | null): BenchLayoutMap {
  const defaults = getDefaultBenchLayout();
  if (!saved) return defaults;
  for (const b of BENCH_BOARDS) {
    const custom = saved[b.id];
    if (custom && typeof custom.x === "number" && typeof custom.z === "number") {
      defaults[b.id] = clampBoardPoseToBench(custom);
    }
  }
  return defaults;
}
