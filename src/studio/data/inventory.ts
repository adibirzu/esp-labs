import type { BilingualText } from "./flipper";

export type InventoryCategory =
  | "boards"
  | "wireless"
  | "display-audio"
  | "sensors"
  | "power-proto";

export interface InventoryPart {
  id: string;
  name: BilingualText;
  category: InventoryCategory;
  voltage: string;
  bus: string;
  approxPriceUsd: number;
  notes: BilingualText;
  relatedLabCodes: string[];
}

export interface InventoryPreset {
  id: string;
  name: BilingualText;
  description: BilingualText;
  partIds: string[];
}

export const INVENTORY_PARTS: InventoryPart[] = [
  // Boards & Microcontrollers
  {
    id: "esp32-s3-devkit",
    name: { en: "ESP32-S3-DevKitC-1 (Dual-Core + RGB LED)", ro: "Placă ESP32-S3-DevKitC-1 (Dual-Core + LED RGB)" },
    category: "boards",
    voltage: "5V USB / 3.3V",
    bus: "USB-OTG · Wi-Fi · BLE 5.0 · 45 GPIO",
    approxPriceUsd: 10,
    notes: { en: "Primary studio board for all 40 labs & DIY Flipper companion builds.", ro: "Placa principală a studioului pentru toate laboratoarele și extensii DIY Flipper." },
    relatedLabCodes: ["I1", "W1", "B1", "R1", "S1"],
  },
  {
    id: "esp32-c6-devkit",
    name: { en: "ESP32-C6-DevKitC-1 (Wi-Fi 6 + Thread/Zigbee)", ro: "Placă ESP32-C6-DevKitC-1 (Wi-Fi 6 + Thread/Zigbee)" },
    category: "boards",
    voltage: "5V USB / 3.3V",
    bus: "Wi-Fi 6 · BLE 5.3 · IEEE 802.15.4",
    approxPriceUsd: 9,
    notes: { en: "Ideal for Matter smart-home sensors, Zigbee bridges, and low-power nodes.", ro: "Ideală pentru senzori Matter smart-home, punți Zigbee și noduri cu consum redus." },
    relatedLabCodes: ["T1", "T4", "T5"],
  },
  {
    id: "esp32-c3-devkit",
    name: { en: "ESP32-C3-DevKitM-1 (Compact RISC-V)", ro: "Placă ESP32-C3-DevKitM-1 (Compactă RISC-V)" },
    category: "boards",
    voltage: "5V USB / 3.3V",
    bus: "Wi-Fi 4 · BLE 5.0 · 15 GPIO",
    approxPriceUsd: 6,
    notes: { en: "Tiny footprint for battery-powered badges and ultra-compact sensors.", ro: "Dimensiune foarte mică pentru badge-uri pe baterie și senzori compacți." },
    relatedLabCodes: ["T1", "T3", "T5"],
  },
  {
    id: "esp32-s2-devboard",
    name: { en: "Flipper Official Wi-Fi Devboard (ESP32-S2)", ro: "Placă Oficială Wi-Fi Flipper (ESP32-S2)" },
    category: "boards",
    voltage: "3.3V / 5V USB-C",
    bus: "UART · SWD Black Magic · Wi-Fi 2.4 GHz",
    approxPriceUsd: 29,
    notes: { en: "Plug-and-play Black Magic debugger and Marauder Wi-Fi board for Flipper Zero.", ro: "Depanator Black Magic plug-and-play și placă Wi-Fi Marauder pentru Flipper Zero." },
    relatedLabCodes: ["W1", "W2"],
  },
  {
    id: "flipper-zero",
    name: { en: "Flipper Zero Multi-Tool", ro: "Flipper Zero (Dispozitiv Multi-Tool)" },
    category: "boards",
    voltage: "Internal LiPo · 3.3V/5V GPIO",
    bus: "Sub-GHz · NFC · RFID · IR · BLE · 18-Pin GPIO",
    approxPriceUsd: 169,
    notes: { en: "STM32WB55 pocket hardware lab supporting GPIO extensions, Sub-GHz, NFC, IR & BadUSB.", ro: "Laborator hardware de buzunar cu STM32WB55, extensii GPIO, Sub-GHz, NFC, IR și BadUSB." },
    relatedLabCodes: ["R1", "B1"],
  },
  {
    id: "flipper-vgm",
    name: { en: "Flipper Video Game Module (RP2040 + HDMI + IMU)", ro: "Modul Video Game Flipper (RP2040 + HDMI + IMU)" },
    category: "boards",
    voltage: "3.3V / USB-C",
    bus: "DVI-D HDMI · 6-Axis IMU · 14-Pin GPIO",
    approxPriceUsd: 49,
    notes: { en: "Adds TV/projector mirroring, tilt controls, and standalone Raspberry Pi Pico mode.", ro: "Adaugă oglindire TV/proiector, control prin înclinare și mod independent Raspberry Pi Pico." },
    relatedLabCodes: ["D1"],
  },

  // RF & Wireless Modules
  {
    id: "mfrc522-rfid",
    name: { en: "MFRC522 RFID Reader + 13.56 MHz Tags", ro: "Cititor RFID MFRC522 + Carduri 13.56 MHz" },
    category: "wireless",
    voltage: "3.3V ONLY",
    bus: "SPI (10 MHz) · 13.56 MHz ISO-14443A",
    approxPriceUsd: 4,
    notes: { en: "Powers RFID access vaults, classroom attendance checkers, and Labs R1–R8.", ro: "Alimentează seifuri RFID, sisteme de prezență și Laboratoarele R1–R8." },
    relatedLabCodes: ["R1", "R2", "R5", "R8"],
  },
  {
    id: "cc1101-module",
    name: { en: "TI CC1101 Sub-GHz RF Module + SMA Antenna", ro: "Modul Radio Sub-GHz TI CC1101 + Antenă SMA" },
    category: "wireless",
    voltage: "3.3V ONLY",
    bus: "SPI (433 / 868 / 915 MHz)",
    approxPriceUsd: 6,
    notes: { en: "Triples Flipper Zero Sub-GHz reception range or connects to ESP32 SPI.", ro: "Triplează raza de recepție Sub-GHz pe Flipper Zero sau se leagă la ESP32 prin SPI." },
    relatedLabCodes: ["T1", "T4"],
  },
  {
    id: "nrf24-module",
    name: { en: "NRF24L01+ 2.4 GHz RF Transceiver", ro: "Transceiver 2.4 GHz NRF24L01+" },
    category: "wireless",
    voltage: "3.3V ONLY",
    bus: "SPI (2.4 GHz ISM)",
    approxPriceUsd: 3,
    notes: { en: "Used in Flipper multi-boards and ultra-low-latency RC / sensor links.", ro: "Folosit pe plăci multi-radio Flipper și legături radio rapide pentru roboți sau senzori." },
    relatedLabCodes: ["W1"],
  },
  {
    id: "gps-module",
    name: { en: "GPS / GNSS Module (NEO-6M / ATGM336H)", ro: "Modul GPS / GNSS (NEO-6M / ATGM336H)" },
    category: "wireless",
    voltage: "3.3V–5V",
    bus: "UART NMEA (9600 baud)",
    approxPriceUsd: 9,
    notes: { en: "Adds live coordinates and UTC time to ESP32 trackers or Flipper wardriving boards.", ro: "Adaugă coordonate GPS și oră UTC la trackere ESP32 sau extensii Flipper." },
    relatedLabCodes: ["T2", "T6"],
  },
  {
    id: "ir-blaster",
    name: { en: "940 nm IR Blaster LED Array + Receiver", ro: "Modul IR Blaster 940 nm + Receptor Infraroșu" },
    category: "wireless",
    voltage: "3.3V / 5V",
    bus: "GPIO PWM / RMT (38 kHz)",
    approxPriceUsd: 4,
    notes: { en: "Extends Flipper IR range to 20 m or builds an ESP32 Wi-Fi universal AC/TV controller.", ro: "Extinde raza IR pe Flipper la 20 m sau construiește o telecomandă Wi-Fi ESP32." },
    relatedLabCodes: ["I1", "W2"],
  },

  // Displays & Audio
  {
    id: "ssd1306-oled",
    name: { en: "SSD1306 0.96\" OLED Display (128×64 I2C)", ro: "Ecran OLED SSD1306 0.96\" (128×64 I2C)" },
    category: "display-audio",
    voltage: "3.3V–5V",
    bus: "I2C (0x3C · 400 kHz)",
    approxPriceUsd: 4,
    notes: { en: "Crisp monochrome telemetry screen for Labs D1–D4, weather nodes, and audio visualizers.", ro: "Ecran monocrom clar pentru Laboratoarele D1–D4, stații meteo și vizualizatoare audio." },
    relatedLabCodes: ["D1", "D2", "D3", "D4"],
  },
  {
    id: "max98357a-amp",
    name: { en: "MAX98357A I2S Class-D Amp + 3W Speaker", ro: "Amplificator I2S MAX98357A + Difuzor 3W" },
    category: "display-audio",
    voltage: "3.3V–5V",
    bus: "I2S Digital Audio (BCLK, LRC, DIN)",
    approxPriceUsd: 5,
    notes: { en: "Pure digital audio output for chiptune synths, drum machines, and Labs S1–S8.", ro: "Ieșire audio digitală clară pentru sintetizatoare, mini-pian și Laboratoarele S1–S8." },
    relatedLabCodes: ["S1", "S2", "S4", "S6", "S8"],
  },
  {
    id: "inmp441-mic",
    name: { en: "INMP441 I2S Digital MEMS Microphone", ro: "Microfon Digital I2S MEMS INMP441" },
    category: "display-audio",
    voltage: "3.3V",
    bus: "I2S Input (24-bit)",
    approxPriceUsd: 4,
    notes: { en: "Enables clap switches, FFT spectrum analyzers, and voice-command wake words.", ro: "Permite comutatoare la aplauze, analizor FFT și detecție vocală." },
    relatedLabCodes: ["S5", "S7"],
  },
  {
    id: "ws2812b-strip",
    name: { en: "WS2812B / NeoPixel Addressable RGB LED Strip", ro: "Bandă LED RGB Adresabilă WS2812B / NeoPixel" },
    category: "display-audio",
    voltage: "5V (3.3V data)",
    bus: "Single-Wire RMT",
    approxPriceUsd: 6,
    notes: { en: "Build ambient music visualizers, Pomodoro desk lamps, and interactive kids games.", ro: "Ideală pentru lămpi inteligente, vizualizator muzical și jocuri vizuale pentru copii." },
    relatedLabCodes: ["I1", "I2", "W2"],
  },

  // Sensors & Input
  {
    id: "bme280-sensor",
    name: { en: "BME280 / BMP280 Temp, Humidity & Pressure Sensor", ro: "Senzor Mediu BME280 / BMP280 (Temp, Umiditate, Presiune)" },
    category: "sensors",
    voltage: "3.3V",
    bus: "I2C (0x76 / 0x77)",
    approxPriceUsd: 4,
    notes: { en: "Works natively on both ESP32 I2C labs and Flipper Zero DigiLab/I2C Tools.", ro: "Funcționează nativ atât pe laboratoarele ESP32 I2C, cât și pe Flipper Zero I2C Tools." },
    relatedLabCodes: ["T1", "T2", "T4", "T5"],
  },
  {
    id: "pir-reed-sensor",
    name: { en: "PIR Motion Sensor / Magnetic Door Reed Switch", ro: "Senzor Mișcare PIR / Contact Magnetic Ușă" },
    category: "sensors",
    voltage: "3.3V–5V",
    bus: "Digital GPIO / Wake Interrupt",
    approxPriceUsd: 3,
    notes: { en: "Triggers Deep-Sleep wakeups for fridge alarms, smart security alerts, and automation.", ro: "Trezește ESP32 din Deep-Sleep pentru alarme de frigider, uși și automatizări." },
    relatedLabCodes: ["I2", "T2", "T6"],
  },
  {
    id: "rotary-buttons",
    name: { en: "Rotary Encoder + Tactile Push Buttons", ro: "Encoder Rotativ + Butoane Tactile" },
    category: "sensors",
    voltage: "3.3V",
    bus: "GPIO Pull-Up / PCNT",
    approxPriceUsd: 3,
    notes: { en: "Physical dials for synth pitch/cutoff, OLED menu navigation, and macro pads.", ro: "Control fizic pentru frecvența sintetizatorului, meniuri OLED și tastaturi macro." },
    relatedLabCodes: ["I2", "D3", "S4"],
  },
  {
    id: "servo-relay",
    name: { en: "SG90 Micro Servo / 3.3V Relay Module", ro: "Micro Servo SG90 / Modul Releu 3.3V" },
    category: "sensors",
    voltage: "5V power / 3.3V PWM",
    bus: "LEDC PWM / Digital GPIO",
    approxPriceUsd: 4,
    notes: { en: "Turns RFID vaults and smart-home ideas into real moving locks, blinds, or plant waterers.", ro: "Transformă seifurile RFID și proiectele smart-home în încuietori, jaluzele sau irigare automată." },
    relatedLabCodes: ["R5", "R8", "W2"],
  },

  // Power & Prototyping
  {
    id: "breadboard-wires",
    name: { en: "830-Point Breadboard + Dupont Jumper Wires", ro: "Breadboard 830 Puncte + Fire Jumper Dupont" },
    category: "power-proto",
    voltage: "Passive",
    bus: "Solderless Prototyping",
    approxPriceUsd: 5,
    notes: { en: "Essential solderless workbench for wiring ESP32 labs and Flipper GPIO experiments safely.", ro: "Esențial pentru prototipare rapidă fără lipire la laboratoarele ESP32 și GPIO Flipper." },
    relatedLabCodes: ["I1", "D1", "R1", "S1"],
  },
  {
    id: "lipo-battery",
    name: { en: "3.7V LiPo Battery (1000–2000 mAh) + TP4056 Charger", ro: "Baterie LiPo 3.7V (1000–2000 mAh) + Încărcător TP4056" },
    category: "power-proto",
    voltage: "3.0V–4.2V",
    bus: "ADC Voltage Divider + Deep Sleep",
    approxPriceUsd: 7,
    notes: { en: "Unlocks portable BLE badges, solar balcony weather nodes, and low-power Lab T2.", ro: "Deblochează badge-uri portabile BLE, stații meteo solare și Laboratorul T2." },
    relatedLabCodes: ["T2", "T5", "T6"],
  },
  {
    id: "microsd-module",
    name: { en: "SPI MicroSD Card Breakout Module", ro: "Modul Cititor Card MicroSD (SPI)" },
    category: "power-proto",
    voltage: "3.3V–5V",
    bus: "SPI (FAT32 Logging)",
    approxPriceUsd: 3,
    notes: { en: "Stores long-term sensor CSV logs, WAV audio samples, or ESP32 Marauder PCAP captures.", ro: "Salvează log-uri CSV de senzori, sample-uri audio WAV sau capturi PCAP Marauder." },
    relatedLabCodes: ["S6", "T6"],
  },
];

export const INVENTORY_PRESETS: InventoryPreset[] = [
  {
    id: "preset-esp-starter",
    name: { en: "ESP32 Studio Starter Kit", ro: "Kit Start ESP32 Studio" },
    description: {
      en: "ESP32-S3, OLED, MFRC522 RFID, MAX98357A Audio & Breadboard",
      ro: "ESP32-S3, OLED, RFID MFRC522, Audio MAX98357A și Breadboard",
    },
    partIds: [
      "esp32-s3-devkit",
      "ssd1306-oled",
      "mfrc522-rfid",
      "max98357a-amp",
      "breadboard-wires",
      "rotary-buttons",
    ],
  },
  {
    id: "preset-flipper-hacker",
    name: { en: "Flipper Zero + ESP32 Lab Pack", ro: "Pachet Flipper Zero + ESP32" },
    description: {
      en: "Flipper Zero, ESP32-S3, CC1101, BME280 Sensor & Breadboard",
      ro: "Flipper Zero, ESP32-S3, CC1101, Senzor BME280 și Breadboard",
    },
    partIds: [
      "flipper-zero",
      "esp32-s3-devkit",
      "cc1101-module",
      "bme280-sensor",
      "breadboard-wires",
    ],
  },
  {
    id: "preset-smart-home",
    name: { en: "Smart Home & Solar IoT Kit", ro: "Kit Casă Inteligentă & Solar" },
    description: {
      en: "ESP32-C6, BME280, PIR/Reed, Servo/Relay, OLED & LiPo Battery",
      ro: "ESP32-C6, BME280, PIR/Contact Ușă, Servo/Releu, OLED și Baterie LiPo",
    },
    partIds: [
      "esp32-c6-devkit",
      "bme280-sensor",
      "pir-reed-sensor",
      "servo-relay",
      "ssd1306-oled",
      "lipo-battery",
      "breadboard-wires",
    ],
  },
  {
    id: "preset-full-bench",
    name: { en: "Full Maker Bench (All 22 Parts)", ro: "Banc Complet Maker (Toate 22 Piese)" },
    description: {
      en: "Select every board, radio, display, and sensor in the catalog",
      ro: "Selectează toate plăcile, modulele radio, ecranele și senzorii din catalog",
    },
    partIds: INVENTORY_PARTS.map((p) => p.id),
  },
];

/** Explicit required part mappings for every Project Idea ID in PROJECT_IDEAS */
export const IDEA_REQUIRED_PARTS: Record<string, string[]> = {
  "idea-smart-rfid-vault": ["esp32-s3-devkit", "mfrc522-rfid", "ssd1306-oled", "servo-relay", "breadboard-wires"],
  "idea-chiptune-pocket-synth": ["esp32-s3-devkit", "max98357a-amp", "ssd1306-oled", "rotary-buttons", "breadboard-wires"],
  "idea-solar-balcony-weather": ["esp32-c6-devkit", "bme280-sensor", "lipo-battery", "breadboard-wires"],
  "idea-ble-presence-beacon": ["esp32-c3-devkit", "lipo-battery", "ws2812b-strip"],
  "idea-espnow-doorbell-intercom": ["esp32-s3-devkit", "max98357a-amp", "inmp441-mic", "rotary-buttons"],
  "idea-matter-desk-air-monitor": ["esp32-c6-devkit", "bme280-sensor", "ssd1306-oled", "ws2812b-strip"],
  "idea-wifi-captive-dashboard": ["esp32-s3-devkit", "bme280-sensor", "ssd1306-oled"],
  "idea-rfid-classroom-attendance": ["esp32-s3-devkit", "mfrc522-rfid", "ssd1306-oled", "microsd-module"],
  "idea-sound-reactive-lamp": ["esp32-s3-devkit", "inmp441-mic", "ws2812b-strip", "breadboard-wires"],
  "idea-fridge-door-guardian": ["esp32-c3-devkit", "pir-reed-sensor", "lipo-battery", "max98357a-amp"],
};

/** Fallback part requirements by Lab track */
export const TRACK_REQUIRED_PARTS: Record<string, string[]> = {
  intro: ["esp32-s3-devkit"],
  display: ["esp32-s3-devkit", "ssd1306-oled", "breadboard-wires"],
  wifi: ["esp32-s3-devkit"],
  ble: ["esp32-s3-devkit"],
  rfid: ["esp32-s3-devkit", "mfrc522-rfid", "breadboard-wires"],
  sound: ["esp32-s3-devkit", "max98357a-amp", "breadboard-wires"],
  iot: ["esp32-c6-devkit", "bme280-sensor", "lipo-battery"],
};
