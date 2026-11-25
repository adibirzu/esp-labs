import { Bluetooth, Cpu, CreditCard, Monitor, Radio, Volume2, Wifi } from "lucide-react";
import type { LabItem, TrackId } from "../types";

export interface TrackMeta {
  id: TrackId;
  name: string;
  color: string;
  icon: typeof Cpu;
  desc: string;
}

export const TRACKS: TrackMeta[] = [
  { id: "intro", name: "Intro (I1–I4)", color: "emerald", icon: Cpu, desc: "GPIO, RGB LED, Timers, Touch & Deep-Sleep" },
  { id: "display", name: "Display (D1–D4)", color: "cyan", icon: Monitor, desc: "I2C Bus, 128×64 OLED, Bitmaps & Live Charts" },
  { id: "wifi", name: "WiFi (W1–W4)", color: "sky", icon: Wifi, desc: "802.11n/ax Station, Web UI, MQTT & OTA" },
  { id: "iot", name: "IoT & Power (P1–P4)", color: "teal", icon: Radio, desc: "ADC1 LiPo, ESP-NOW Mesh, ULP & Matter/Thread" },
  { id: "ble", name: "BLE (B1–B8)", color: "violet", icon: Bluetooth, desc: "BLE 5.0 Advertising, GATT & Notify" },
  { id: "rfid", name: "RFID (R1–R8)", color: "amber", icon: CreditCard, desc: "SPI Bus, MFRC522 & Access Control" },
  { id: "sound", name: "Sound (S1–S8)", color: "rose", icon: Volume2, desc: "I2S Audio, MAX98357A & DSP Synth" },
];

const INTRO_LABS: LabItem[] = [
  {
    id: "intro-1",
    code: "I1",
    track: "intro",
    simType: "intro",
    tourId: "blink",
    boardId: "esp32-s3-devkitc-1",
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
    id: "intro-2",
    code: "I2",
    track: "intro",
    simType: "intro",
    tourId: "blink",
    boardId: "esp32-s3-devkitc-1",
    duration: "20 min",
    difficulty: "Beginner",
    title: "Hardware GPTimer & GPIO Interrupts (ISR)",
    summary:
      "Replace blocking vTaskDelay loops with microsecond-accurate GPTimer alarms and IRAM-safe debounced GPIO0 button interrupts.",
    wiring: [
      { from: "ESP32-S3 GPIO0", to: "BOOT Tactile Switch", signal: "EXTI_FALL", color: "amber" },
      { from: "ESP32-S3 GPIO48", to: "Status WS2812 LED", signal: "RMT", color: "emerald" },
    ],
    defaultLogs: [
      "I (290) gptimer: Timer group 0 initialized @ 1 MHz resolution",
      "I (298) gpio_isr: Installed ISR service (IRAM_ATTR) on GPIO0",
      "I (310) app: Press Hold BOOT in simulator to observe edge events",
    ],
  },
  {
    id: "intro-3",
    code: "I3",
    track: "intro",
    simType: "intro",
    tourId: "blink",
    boardId: "esp32-s2-devkitc-1",
    duration: "25 min",
    difficulty: "Intermediate",
    title: "Capacitive Touch Slider & LEDC PWM Dimmer",
    summary:
      "Read ESP32-S3/S2 built-in 14-channel capacitive touch pads with noise filtering to smoothly dim an LED via 13-bit LEDC PWM.",
    wiring: [
      { from: "ESP32-S3 GPIO1", to: "Touch Pad T1 (Copper)", signal: "TOUCH1", color: "violet" },
      { from: "ESP32-S3 GPIO2", to: "Touch Pad T2 (Copper)", signal: "TOUCH2", color: "violet" },
      { from: "ESP32-S3 GPIO14", to: "External LED + 220Ω", signal: "LEDC_CH0", color: "cyan" },
    ],
    defaultLogs: [
      "I (330) touch_pad: Denoise enabled, baseline calibrated (T1=28400, T2=29120)",
      "I (342) ledc: Timer0 5 kHz 13-bit PWM bound to GPIO14",
      "I (360) touch: Waiting for finger capacitance delta > 12%",
    ],
  },
  {
    id: "intro-4",
    code: "I4",
    track: "intro",
    simType: "iot",
    boardId: "esp32-c3-devkitm-1",
    duration: "25 min",
    difficulty: "Intermediate",
    title: "Deep-Sleep, RTC Fast Memory & Wake Stubs",
    summary:
      "Drop current consumption to ~7 µA with esp_deep_sleep_start(), preserve boot counters in RTC_DATA_ATTR, and wake via timer or EXT0.",
    wiring: [
      { from: "ESP32-S3 GPIO0", to: "EXT0 Wake Button", signal: "RTC_GPIO0", color: "amber" },
      { from: "J5 Current Header", to: "Multimeter / PPK2", signal: "3.3V_MEAS", color: "rose" },
    ],
    defaultLogs: [
      "I (112) sleep: Wakeup cause: ESP_SLEEP_WAKEUP_TIMER (boot_count=14)",
      "I (120) rtc_mem: Retained 24-byte telemetry struct across reset",
      "I (134) sleep: Ready to enter Deep-Sleep (7 µA target)",
    ],
  },
];

const DISPLAY_LABS: LabItem[] = [
  {
    id: "display-1",
    code: "D1",
    track: "display",
    simType: "display",
    tourId: "oled",
    boardId: "esp32-s3-devkitc-1",
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
    id: "display-2",
    code: "D2",
    track: "display",
    simType: "display",
    tourId: "oled",
    boardId: "esp32-s3-devkitc-1",
    duration: "25 min",
    difficulty: "Beginner",
    title: "1-Bit Sprite Bitmaps & Custom Pixel Fonts",
    summary:
      "Pack monochrome 16×16 icons into PROGMEM byte arrays, blit sprites with XOR inversion, and render crisp proportional UI headers.",
    wiring: [
      { from: "ESP32-S3 GPIO8", to: "OLED SDA", signal: "I2C0_SDA", color: "cyan" },
      { from: "ESP32-S3 GPIO9", to: "OLED SCL", signal: "I2C0_SCL", color: "violet" },
      { from: "ESP32-S3 3V3/GND", to: "OLED Power", signal: "3.3V", color: "amber" },
    ],
    defaultLogs: [
      "I (390) gfx: Loaded 8x8 bitmap font + 12 icons (1.4 KB flash)",
      "I (404) ssd1306: Page-addressing flush completed in 2.6 ms",
      "I (415) gfx: Switch to Custom Text or Animation mode in OLED sim",
    ],
  },
  {
    id: "display-3",
    code: "D3",
    track: "display",
    simType: "display",
    tourId: "oled",
    boardId: "esp32-s3-devkitc-1",
    duration: "30 min",
    difficulty: "Intermediate",
    title: "Real-Time Ring-Buffer Telemetry Chart Plotter",
    summary:
      "Stream live RSSI, ADC voltage, or audio RMS samples into a 128-point circular buffer and render flicker-free 30 FPS scrolling graphs.",
    wiring: [
      { from: "ESP32-S3 GPIO8", to: "OLED SDA", signal: "I2C0_SDA", color: "cyan" },
      { from: "ESP32-S3 GPIO9", to: "OLED SCL", signal: "I2C0_SCL", color: "violet" },
      { from: "ESP32-S3 GPIO4", to: "Analog Sensor Out", signal: "ADC1_CH3", color: "emerald" },
    ],
    defaultLogs: [
      "I (418) plotter: Circular history buffer [128] allocated in DRAM",
      "I (432) i2c: Fast-mode 400 kHz burst TX (1024B/frame -> 38 FPS max)",
      "I (445) plotter: Auto-scaling Y-axis enabled",
    ],
  },
  {
    id: "display-4",
    code: "D4",
    track: "display",
    simType: "display",
    tourId: "oled",
    boardId: "esp32-s2-devkitc-1",
    duration: "35 min",
    difficulty: "Intermediate",
    title: "Rotary Encoder Menu State Machine on OLED",
    summary:
      "Decode quadrature rotary encoder ticks with the hardware PCNT pulse counter and navigate multi-screen settings with inverted selection bars.",
    wiring: [
      { from: "ESP32-S3 GPIO15", to: "Encoder CLK (A)", signal: "PCNT_CH0", color: "emerald" },
      { from: "ESP32-S3 GPIO16", to: "Encoder DT (B)", signal: "PCNT_CH1", color: "amber" },
      { from: "ESP32-S3 GPIO17", to: "Encoder SW", signal: "INPUT_PU", color: "rose" },
      { from: "ESP32-S3 GPIO8/9", to: "OLED SDA/SCL", signal: "I2C0", color: "cyan" },
    ],
    defaultLogs: [
      "I (402) pcnt: Quadrature unit 0 armed (glitch filter = 1000 ns)",
      "I (412) ui_menu: Mounted 4 screens (Status, WiFi, Contrast, Sleep)",
      "I (420) ssd1306: Contrast register 0x81 synced with NVS",
    ],
  },
];

const WIFI_LABS: LabItem[] = [
  {
    id: "wifi-1",
    code: "W1",
    track: "wifi",
    simType: "wifi",
    tourId: "blink",
    boardId: "esp32-s3-devkitc-1",
    duration: "30 min",
    difficulty: "Beginner",
    title: "Wi-Fi Station, RSSI & HTTP Control",
    summary:
      "Initialize NVS flash and LwIP stack, connect to a 2.4 GHz access point, monitor RSSI, and toggle GPIO remotely.",
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
  {
    id: "wifi-2",
    code: "W2",
    track: "wifi",
    simType: "wifi",
    tourId: "blink",
    boardId: "esp32-s3-devkitc-1",
    duration: "35 min",
    difficulty: "Intermediate",
    title: "Embedded HTTP REST & WebSocket Dashboard",
    summary:
      "Serve a gzipped control page directly from Flash via esp_http_server and push live JSON telemetry frames over WebSockets.",
    wiring: [
      { from: "ESP32-S3 RF", to: "Local LAN / SoftAP", signal: "HTTP + WS", color: "sky" },
      { from: "ESP32-S3 GPIO48", to: "Web-Controlled RGB", signal: "RMT", color: "emerald" },
    ],
    defaultLogs: [
      "I (710) httpd: Started HTTP server on port 80 (max_open_sockets=7)",
      "I (725) httpd: Registered GET /, POST /api/led, WS /ws/telemetry",
      "I (740) mdns: Hostname registered -> http://esp32-lab.local",
    ],
  },
  {
    id: "wifi-3",
    code: "W3",
    track: "wifi",
    simType: "wifi",
    boardId: "esp32-c6-devkitc-1",
    duration: "35 min",
    difficulty: "Intermediate",
    title: "MQTT over TLS & Wi-Fi 6 Target Wake Time (TWT)",
    summary:
      "Publish signed sensor payloads to an MQTT broker with esp_mqtt_client and negotiate 802.11ax TWT sleep windows on ESP32-C6/C5.",
    wiring: [
      { from: "ESP32-C6 / S3 RF", to: "Wi-Fi 6 / 4 AP", signal: "MQTT TLS:8883", color: "violet" },
      { from: "Flash Cert Bundle", to: "mbedTLS Engine", signal: "HW_AES_SHA", color: "amber" },
    ],
    defaultLogs: [
      "I (820) mqtt: Connecting mqtts://broker.local:8883 (CA verified)",
      "I (950) mqtt: Connected! Subscribed to esp32/cmd/# (QoS 1)",
      "I (980) wifi_twt: Negotiated wake interval = 1024 ms (power save)",
    ],
  },
  {
    id: "wifi-4",
    code: "W4",
    track: "wifi",
    simType: "wifi",
    boardId: "esp32-c5-devkitc-1",
    duration: "40 min",
    difficulty: "Advanced",
    title: "Dual-Partition HTTPS OTA Firmware Updates",
    summary:
      "Configure ota_0 and ota_1 flash partitions, download signed firmware over HTTPS, verify SHA-256, and enable automatic rollback on boot failure.",
    wiring: [
      { from: "Internal SPI Flash", to: "ota_0 / ota_1 Slots", signal: "QIO 80MHz", color: "cyan" },
      { from: "Dual-Band RF", to: "OTA HTTPS Server", signal: "TLS 1.3", color: "sky" },
    ],
    defaultLogs: [
      "I (410) ota: Running partition: ota_0 @ 0x010000 (v1.2.0)",
      "I (435) ota: Rollback guard armed -> call esp_ota_mark_app_valid_cancel_rollback()",
      "I (460) ota: Waiting for remote firmware manifest...",
    ],
  },
];

const IOT_LABS: LabItem[] = [
  {
    id: "iot-1",
    code: "P1",
    track: "iot",
    simType: "iot",
    boardId: "esp32-s3-devkitc-1",
    duration: "25 min",
    difficulty: "Beginner",
    title: "ADC1 Calibration & LiPo Battery Fuel Gauge",
    summary:
      "Use factory eFuse curve-fitting calibration on ADC1 (safe alongside Wi-Fi!) to read a 1:1 resistor divider and compute remaining LiPo %.",
    wiring: [
      { from: "LiPo VBAT+", to: "100 kΩ + 100 kΩ Divider", signal: "0–2.1V", color: "amber" },
      { from: "Divider Midpoint", to: "ESP32-S3 GPIO4 (ADC1_CH3)", signal: "ADC1_12B", color: "cyan" },
      { from: "Divider GND", to: "ESP32-S3 GND + 100nF Cap", signal: "GND", color: "slate" },
    ],
    defaultLogs: [
      "I (310) adc_cal: Curve fitting calibration loaded from eFuse (12 dB atten)",
      "I (322) battery: Raw=2318 -> V_pin=1.96V -> V_bat=3.92V (74% SoC)",
      "I (340) note: Always prefer ADC1 over ADC2 when Wi-Fi radio is enabled",
    ],
  },
  {
    id: "iot-2",
    code: "P2",
    track: "iot",
    simType: "iot",
    boardId: "esp32-c3-devkitm-1",
    duration: "30 min",
    difficulty: "Intermediate",
    title: "ESP-NOW Sub-5ms Peer-to-Peer Wireless Mesh",
    summary:
      "Send encrypted 250-byte telemetry frames directly between ESP32 boards without a Wi-Fi router, cutting wake-to-TX time under 15 ms.",
    wiring: [
      { from: "Node A (ESP32-C3)", to: "2.4 GHz Peer Link", signal: "ESP-NOW", color: "emerald" },
      { from: "Node B (ESP32-S3)", to: "Gateway Receiver", signal: "AES-CCMP", color: "cyan" },
    ],
    defaultLogs: [
      "I (265) espnow: Initialized on Ch 1 (PMK + LMK encryption enabled)",
      "I (278) espnow: Peer registered MAC=DC:54:75:C1:A2:08",
      "I (290) espnow: Ready — click 'Send ESP-NOW Burst' in simulator",
    ],
  },
  {
    id: "iot-3",
    code: "P3",
    track: "iot",
    simType: "iot",
    boardId: "esp32-c6-devkitc-1",
    duration: "35 min",
    difficulty: "Intermediate",
    title: "ULP / LP-Core Autonomous Weather Logger",
    summary:
      "Offload periodic I2C temperature/humidity threshold checks to the ultra-low-power RISC-V co-processor so the main CPU sleeps 99.8% of the time.",
    wiring: [
      { from: "LP_I2C_SDA (GPIO6)", to: "SHT40 / BME280 SDA", signal: "LP_I2C", color: "cyan" },
      { from: "LP_I2C_SCL (GPIO7)", to: "SHT40 / BME280 SCL", signal: "LP_I2C", color: "violet" },
      { from: "ESP32-C6 3V3", to: "Sensor VDD", signal: "3.3V", color: "amber" },
    ],
    defaultLogs: [
      "I (190) ulp_riscv: Loaded 1.8 KB LP-Core binary into RTC_SLOW_MEM",
      "I (205) lp_i2c: Polling sensor every 60s @ ~22 µA average",
      "I (218) ulp: HP wakeup threshold set -> Temp > 30.0 °C or Δ > 0.5 °C",
    ],
  },
  {
    id: "iot-4",
    code: "P4",
    track: "iot",
    simType: "iot",
    boardId: "esp32-h2-devkitm-1",
    duration: "40 min",
    difficulty: "Advanced",
    title: "IEEE 802.15.4 Thread / Zigbee & Matter Endpoint",
    summary:
      "Commission a low-power ESP32-C6 or ESP32-H2 sensor onto a Thread 1.3 or Zigbee 3.0 mesh network and report live attributes to a home hub.",
    wiring: [
      { from: "ESP32-H2 / C6 RF", to: "802.15.4 Mesh (Ch 15)", signal: "Thread 1.3", color: "violet" },
      { from: "ESP32-H2 GPIO8", to: "Commissioning RGB LED", signal: "RMT", color: "emerald" },
    ],
    defaultLogs: [
      "I (440) openthread: Joined Thread PAN 0x1A4F as Sleepy End Device (SED)",
      "I (468) matter: Cluster 0x0402 (Temperature) + 0x0405 (Humidity) live",
      "I (490) matter: Ready for hub attribute reporting",
    ],
  },
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
  boardId: idx === 6 ? "esp32-c3-devkitm-1" : "esp32-s3-devkitc-1",
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
  boardId: "esp32-s3-devkitc-1",
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
  boardId: "esp32-s3-devkitc-1",
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
  ...INTRO_LABS,
  ...DISPLAY_LABS,
  ...WIFI_LABS,
  ...IOT_LABS,
  ...BLE_LABS,
  ...RFID_LABS,
  ...SOUND_LABS,
];
