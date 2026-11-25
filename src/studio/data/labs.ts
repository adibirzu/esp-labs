import { Bluetooth, Cpu, CreditCard, Monitor, Volume2, Wifi } from "lucide-react";
import type { LabItem, TrackId } from "../types";

export interface TrackMeta {
  id: TrackId;
  name: string;
  color: string;
  icon: typeof Cpu;
  desc: string;
}

export const TRACKS: TrackMeta[] = [
  { id: "intro", name: "Intro", color: "emerald", icon: Cpu, desc: "GPIO, RGB LED, UART & Boot Strapping" },
  { id: "display", name: "Display (OLED)", color: "cyan", icon: Monitor, desc: "I2C Bus & 128×64 SSD1306 Graphics" },
  { id: "wifi", name: "WiFi", color: "sky", icon: Wifi, desc: "802.11n Station, SoftAP & Telemetry" },
  { id: "ble", name: "BLE (B1–B8)", color: "violet", icon: Bluetooth, desc: "BLE 5.0 Advertising, GATT & Notify" },
  { id: "rfid", name: "RFID (R1–R8)", color: "amber", icon: CreditCard, desc: "SPI Bus, MFRC522 & Access Control" },
  { id: "sound", name: "Sound (S1–S8)", color: "rose", icon: Volume2, desc: "I2S Audio, MAX98357A & DSP Synth" },
];

const BLE_LABS: LabItem[] = [
  ["B1", "BLE 5.0 Advertising Packet", "Broadcast custom manufacturer data and device name over 2.4GHz BLE advertising channels 37/38/39."],
  ["B2", "Scan Response & TX Power", "Extend payload with Scan Response packets and tune radio TX power from -12 dBm to +9 dBm."],
  ["B3", "GATT Server & Service Table", "Register a custom 128-bit GATT Service and expose Read/Write characteristics."],
  ["B4", "Characteristic Read & Write", "Receive structured byte payloads from a smartphone BLE client to control hardware peripherals."],
  ["B5", "Real-Time Notify Telemetry", "Push periodic sensor frames using GATT Notifications without client polling overhead."],
  ["B6", "BLE Pairing & Bonding (SMP)", "Enable MITM protection, numeric comparison, and encrypted NVS key storage."],
  ["B7", "Ultra-Low Power Beacon", "Combine BLE advertising bursts with Light-Sleep to achieve multi-month coin-cell operation."],
  ["B8", "Multi-Client Telemetry Hub", "Manage concurrent BLE connections and stream live ESP32-S3 diagnostics."],
].map(([code, title, summary], idx) => ({
  id: `ble-${idx + 1}`,
  code,
  track: "ble" as const,
  simType: "ble" as const,
  tourId: "ble",
  duration: `${20 + idx * 5} min`,
  difficulty: idx < 3 ? "Beginner" : idx < 6 ? "Intermediate" : "Advanced",
  title,
  summary,
  wiring: [
    { from: "ESP32-S3 BLE Radio", to: "2.4GHz Antenna", signal: "BLE 5.0 LE", color: "violet" },
    { from: "ESP32-S3 GPIO48", to: "Connection LED", signal: "RMT", color: "emerald" },
  ],
  defaultLogs: [
    `I (402) ble_${code.toLowerCase()}: NimBLE host task started`,
    "I (418) gap: Device address: F4:12:FA:88:3C:11",
    "I (430) gatts: Service UUID 0xFFE0 registered (3 chars)",
  ],
}));

const RFID_LABS: LabItem[] = [
  ["R1", "SPI2 Bus & MFRC522 Wiring", "Configure full-duplex SPI2 at 4 MHz and read the MFRC522 VersionReg (0x92)."],
  ["R2", "13.56 MHz Field & Tag Detection", "Activate the RF antenna driver and poll REQA/WUPA for ISO14443-A cards."],
  ["R3", "Anti-Collision & UID Extraction", "Decode 4-byte and 7-byte card UIDs and display hex identifiers over UART."],
  ["R4", "Access Control Whitelist", "Validate scanned UIDs against an authorized list and drive Grant/Deny feedback."],
  ["R5", "MIFARE Classic Sector Auth", "Authenticate sector trailers using Crypto1 Key A / Key B credentials."],
  ["R6", "Reading & Writing Data Blocks", "Store and retrieve structured 16-byte user records safely inside card blocks."],
  ["R7", "Smart Door Lock State Machine", "Build a timed latch controller with anti-bruteforce lockout and OLED prompts."],
  ["R8", "Access Audit Log in NVS", "Persist timestamped entry events to non-volatile flash and export over serial."],
].map(([code, title, summary], idx) => ({
  id: `rfid-${idx + 1}`,
  code,
  track: "rfid" as const,
  simType: "rfid" as const,
  tourId: "rfid",
  duration: `${20 + idx * 5} min`,
  difficulty: idx < 3 ? "Beginner" : idx < 6 ? "Intermediate" : "Advanced",
  title,
  summary,
  wiring: [
    { from: "ESP32-S3 GPIO12", to: "MFRC522 SCK", signal: "SPI2_CLK", color: "cyan" },
    { from: "ESP32-S3 GPIO11", to: "MFRC522 MOSI", signal: "SPI2_MOSI", color: "emerald" },
    { from: "ESP32-S3 GPIO13", to: "MFRC522 MISO", signal: "SPI2_MISO", color: "violet" },
    { from: "ESP32-S3 GPIO10", to: "MFRC522 SDA/CS", signal: "SPI2_CS0", color: "amber" },
    { from: "ESP32-S3 GPIO9", to: "MFRC522 RST", signal: "GPIO_OUT", color: "rose" },
  ],
  defaultLogs: [
    `I (380) rfid_${code.toLowerCase()}: SPI2 bus init @ 4MHz (DMA ch1)`,
    "I (395) mfrc522: Firmware version 0x92 (v2.0) detected",
    "I (401) mfrc522: RF Antenna Gain set to 48dB — Waiting for tag...",
  ],
}));

const SOUND_LABS: LabItem[] = [
  ["S1", "I2S Bus & MAX98357A Class-D Amp", "Wire BCLK, LRC, and DIN to the MAX98357A amplifier and stream 16-bit PCM frames via GDMA."],
  ["S2", "Pure Sine Wave LUT Synthesizer", "Generate phase-accumulated sine waves at 44.1 kHz with zero CPU jitter."],
  ["S3", "Chiptune Waveforms (Square/Saw/Tri)", "Synthesize classic retro waveforms and inspect harmonic spectra on the oscilloscope."],
  ["S4", "ADSR Amplitude Envelopes", "Shape percussive and pad notes using Attack, Decay, Sustain, and Release stages."],
  ["S5", "Step Sequencer & Musical Scale", "Play equal-temperament melodies using timer-driven note tables."],
  ["S6", "Polyphonic Mixing & Clipping Guard", "Mix multiple oscillator voices in fixed-point Q15 math without overflow distortion."],
  ["S7", "Real-Time Audio Level Meter", "Compute RMS amplitude per DMA buffer and drive an OLED/LED VU bar."],
  ["S8", "Interactive UI Sound FX Engine", "Trigger non-blocking chime, error, and laser SFX from RFID and BLE events."],
].map(([code, title, summary], idx) => ({
  id: `sound-${idx + 1}`,
  code,
  track: "sound" as const,
  simType: "sound" as const,
  tourId: "sound",
  duration: `${20 + idx * 5} min`,
  difficulty: idx < 3 ? "Beginner" : idx < 6 ? "Intermediate" : "Advanced",
  title,
  summary,
  wiring: [
    { from: "ESP32-S3 5V", to: "MAX98357A VIN", signal: "5V PWR", color: "amber" },
    { from: "ESP32-S3 GPIO4", to: "MAX98357A BCLK", signal: "I2S_BCLK", color: "cyan" },
    { from: "ESP32-S3 GPIO5", to: "MAX98357A LRC", signal: "I2S_WS", color: "violet" },
    { from: "ESP32-S3 GPIO6", to: "MAX98357A DIN", signal: "I2S_DOUT", color: "emerald" },
  ],
  defaultLogs: [
    `I (412) sound_${code.toLowerCase()}: I2S_NUM_0 TX std mode 44100Hz 16-bit`,
    "I (420) gdma: Allocated 6 x 256-frame DMA ring buffers",
    "I (425) synth: Audio engine armed (muted by default for safety)",
  ],
}));

export const LABS: LabItem[] = [
  {
    id: "intro-1",
    code: "I1",
    track: "intro",
    simType: "intro",
    tourId: "blink",
    duration: "15 min",
    difficulty: "Beginner",
    title: "Hello ESP32-S3 & Onboard RGB LED",
    summary:
      "Drive the WS2812 addressable RGB LED on GPIO48 using the RMT peripheral and read the BOOT button on GPIO0.",
    wiring: [
      { from: "ESP32-S3 GPIO48", to: "Onboard WS2812 DIN", signal: "RMT", color: "emerald" },
      { from: "ESP32-S3 GPIO0", to: "Onboard BOOT Switch", signal: "INPUT_PU", color: "amber" },
      { from: "USB-UART Port", to: "Host PC Serial", signal: "115200 8N1", color: "cyan" },
    ],
    defaultLogs: [
      "I (312) boot: ESP-IDF v5.3.1 on ESP32-S3 (rev 0.2)",
      "I (340) rmt_led: WS2812 strip initialized on GPIO48",
      "I (345) gpio: GPIO0 configured as INPUT_PULLUP (BOOT button)",
    ],
  },
  {
    id: "display-1",
    code: "D1",
    track: "display",
    simType: "display",
    tourId: "oled",
    duration: "25 min",
    difficulty: "Beginner",
    title: 'SSD1306 0.96" OLED over I2C',
    summary:
      "Scan the I2C bus (0x3C), initialize the SSD1306 charge pump, and render live pixel buffers and telemetry.",
    wiring: [
      { from: "ESP32-S3 3V3", to: "OLED VCC", signal: "3.3V", color: "amber" },
      { from: "ESP32-S3 GND", to: "OLED GND", signal: "GND", color: "slate" },
      { from: "ESP32-S3 GPIO8", to: "OLED SDA", signal: "I2C0_SDA", color: "cyan" },
      { from: "ESP32-S3 GPIO9", to: "OLED SCL", signal: "I2C0_SCL", color: "violet" },
    ],
    defaultLogs: [
      "I (410) i2c: Master bus init SDA=GPIO8 SCL=GPIO9 @ 400kHz",
      "I (422) ssd1306: Found device at 0x3C (ACK)",
      "I (435) ssd1306: Framebuffer 128x64 (1024 bytes) ready",
    ],
  },
  {
    id: "wifi-1",
    code: "W1",
    track: "wifi",
    simType: "wifi",
    tourId: "blink",
    duration: "30 min",
    difficulty: "Intermediate",
    title: "Wi-Fi Station, RSSI & HTTP Control",
    summary:
      "Initialize NVS flash and LwIP stack, connect to a 2.4GHz access point, monitor RSSI, and toggle GPIO remotely.",
    wiring: [
      { from: "ESP32-S3 PCB Antenna", to: "2.4GHz RF Link", signal: "802.11 b/g/n", color: "cyan" },
      { from: "ESP32-S3 GPIO48", to: "Status RGB LED", signal: "RMT", color: "emerald" },
    ],
    defaultLogs: [
      "I (510) nvs: NVS partition initialized",
      "I (620) wifi: mode : sta (dc:54:75:c1:a2:08)",
      "I (1290) wifi_sta: Got IP: 192.168.1.42 | RSSI: -52 dBm",
    ],
  },
  ...BLE_LABS,
  ...RFID_LABS,
  ...SOUND_LABS,
];
