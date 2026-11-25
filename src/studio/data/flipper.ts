import type { Lang } from "../types";

export interface BilingualText {
  en: string;
  ro: string;
}

export interface FlipperGpioPin {
  pin: number;
  name: string;
  alt: string;
  kind: "power" | "gnd" | "spi" | "uart" | "i2c" | "gpio" | "onewire";
  voltage: string;
  notes: BilingualText;
}

export type FlipperBoardCategory = "official" | "reddit-top" | "multi-board" | "diy-esp32";

export interface FlipperExtensionBoard {
  id: string;
  name: string;
  maker: string;
  category: FlipperBoardCategory;
  chips: string[];
  priceBand: string;
  redditBuzz: BilingualText;
  summary: BilingualText;
  capabilities: { en: string[]; ro: string[] };
  tradeoffs: BilingualText;
  gpioUsed: string;
  requiredPartIds: string[];
  url: string;
}

export interface FlipperGuideStep {
  title: BilingualText;
  detail: BilingualText;
  codeOrCmd?: string;
}

export interface FlipperStepGuide {
  id: string;
  title: BilingualText;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  summary: BilingualText;
  wiring?: { from: string; to: string; signal: string }[];
  requiredPartIds: string[];
  steps: FlipperGuideStep[];
  safetyNote: BilingualText;
}

export type FlipperResourceKind = "video" | "article" | "official" | "github";

export interface FlipperResource {
  id: string;
  title: string;
  creator: string;
  kind: FlipperResourceKind;
  url: string;
  summary: BilingualText;
  topics: string[];
}

export interface FlipperSubsystem {
  id: string;
  name: BilingualText;
  chip: string;
  freqOrSpec: string;
  summary: BilingualText;
  espParallel: BilingualText;
}

export const FLIPPER_SPECS: { label: BilingualText; value: string }[] = [
  { label: { en: "Main MCU", ro: "Microcontroler Principal" }, value: "STM32WB55RG (Cortex-M4 64 MHz + M0+ 32 MHz)" },
  { label: { en: "Memory", ro: "Memorie Internă" }, value: "1024 KB Flash · 256 KB SRAM" },
  { label: { en: "Display", ro: "Ecran" }, value: '1.4" Monochrome LCD 128×64 (ST7567, SPI)' },
  { label: { en: "Sub-1 GHz RF", ro: "Radio Sub-1 GHz" }, value: "TI CC1101 (315 / 433 / 868 / 915 MHz)" },
  { label: { en: "NFC & LF RFID", ro: "NFC & RFID 125 kHz" }, value: "ST25R3916 (13.56 MHz) + 125 kHz AM/OOK" },
  { label: { en: "GPIO Header", ro: "Conector GPIO" }, value: "18 pins · 3.3V logic · 51Ω ESD · 5V & 3.3V (1.2A)" },
  { label: { en: "Storage & Size", ro: "Stocare & Dimensiuni" }, value: "MicroSD (≤256 GB) · 100.3 × 25.6 × 40.1 mm · 102 g" },
  { label: { en: "Bluetooth & IR", ro: "Bluetooth & Infraroșu" }, value: "BLE 5.4 · IR 38 kHz TX/RX · iButton 1-Wire · USB-C HID" },
];

export const FLIPPER_SUBSYSTEMS: FlipperSubsystem[] = [
  {
    id: "subghz",
    name: { en: "Sub-1 GHz Transceiver", ro: "Transceiver Radio Sub-1 GHz" },
    chip: "TI CC1101",
    freqOrSpec: "315 / 433 / 868 / 915 MHz",
    summary: {
      en: "Analyzes ISM-band remotes, weather stations, IoT telemetry sensors, and barrier controls. External CC1101 + SMA GPIO boards dramatically expand RX sensitivity and range.",
      ro: "Analizează telecomenzi în banda ISM, stații meteo, senzori IoT și porți automate. Plăcile externe CC1101 cu antenă SMA extind dramatic sensibilitatea și raza de recepție.",
    },
    espParallel: {
      en: "Wire a CC1101 SPI module to ESP32-S3 SPI2 to build your own Sub-GHz weather decoder.",
      ro: "Conectează un modul SPI CC1101 la ESP32-S3 SPI2 pentru a construi propriul decodor meteo Sub-GHz.",
    },
  },
  {
    id: "nfc-rfid",
    name: { en: "Dual-Band NFC & 125 kHz RFID", ro: "NFC 13.56 MHz & RFID 125 kHz" },
    chip: "ST25R3916 + LF Front-End",
    freqOrSpec: "13.56 MHz & 125 kHz",
    summary: {
      en: "Reads, inspects, and emulates ISO-14443A/B, MIFARE Classic/Ultralight/DESFire, FeliCa, and legacy EM4100/HID Prox 125 kHz badges.",
      ro: "Citește, inspectează și emulează carduri ISO-14443A/B, MIFARE Classic/Ultralight/DESFire, FeliCa și badge-uri clasice EM4100/HID Prox de 125 kHz.",
    },
    espParallel: {
      en: "Practice 13.56 MHz ISO-14443A tag reading right here in Labs R1–R8 using MFRC522.",
      ro: "Exersează citirea tag-urilor 13.56 MHz ISO-14443A direct în Laboratoarele R1–R8 cu MFRC522.",
    },
  },
  {
    id: "infrared",
    name: { en: "Infrared & Universal Remote", ro: "Infraroșu & Telecomandă Universală" },
    chip: "TSOP-75338 + IR LEDs",
    freqOrSpec: "38 kHz Carrier (NEC, RC5, Sony)",
    summary: {
      en: "Learns raw IR pulses from TVs, projectors, AC units, and speakers. Pairs with UberGuidoZ IRDB community libraries or external high-power IR Blaster GPIO hats.",
      ro: "Învață impulsuri IR brute de la televizoare, proiectoare, aparate AC și sisteme audio. Se combină cu baza UberGuidoZ IRDB sau module externe IR Blaster pe GPIO.",
    },
    espParallel: {
      en: "ESP32-S3 RMT peripheral decodes and transmits microsecond-accurate IR frames in hardware.",
      ro: "Perifericul RMT de pe ESP32-S3 decodează și transmite cadre IR cu precizie de microsecunde direct hardware.",
    },
  },
  {
    id: "gpio-bridge",
    name: { en: "GPIO Hardware Hacking & Bridges", ro: "GPIO, Depanare & Punți Hardware" },
    chip: "18-Pin ESD-Protected Header",
    freqOrSpec: "UART · SPI · I2C · SWD · 1-Wire",
    summary: {
      en: "Turns Flipper Zero into a pocket USB-to-UART adapter, SPI flash dumper, I2C sensor scanner, 1-Wire iButton emulator, or host controller for ESP32 & RP2040 boards.",
      ro: "Transformă Flipper Zero într-un adaptor USB-UART de buzunar, cititor flash SPI, scanner senzori I2C, emulator iButton 1-Wire sau gazdă pentru plăci ESP32 și RP2040.",
    },
    espParallel: {
      en: "Flipper Zero has no native Wi-Fi — connecting an ESP32-S2/S3 via UART Pins 13/14 is the #1 community extension.",
      ro: "Flipper Zero nu are Wi-Fi nativ — conectarea unui ESP32-S2/S3 pe pinii UART 13/14 este extensia #1 a comunității.",
    },
  },
  {
    id: "badusb-ble",
    name: { en: "BadUSB HID & Bluetooth LE", ro: "BadUSB HID & Bluetooth LE" },
    chip: "USB-C + Cortex-M0+ BLE 5.4",
    freqOrSpec: "USB HID & BLE GATT",
    summary: {
      en: "Automates repetitive keyboard macros over USB-C or Bluetooth HID (Rubber Ducky syntax) for IT provisioning, classroom demos, and authorized security audits.",
      ro: "Automatizează secvențe de taste prin USB-C sau Bluetooth HID (sintaxă DuckyScript) pentru administrare IT, demonstrații educaționale și audituri autorizate.",
    },
    espParallel: {
      en: "ESP32-S3 has native USB-OTG HID + BLE 5.0 — build custom macro pads and GATT tools in Labs B1–B8.",
      ro: "ESP32-S3 dispune de USB-OTG HID nativ + BLE 5.0 — construiește tastaturi macro și instrumente GATT în Laboratoarele B1–B8.",
    },
  },
];

export const FLIPPER_GPIO_PINS: FlipperGpioPin[] = [
  { pin: 1, name: "5V", alt: "VBUS / Boost 5V", kind: "power", voltage: "5.0 V (SW toggle)", notes: { en: "5V output from USB or internal boost converter (disabled on battery by default; enable in GPIO → 5V on GPIO).", ro: "Ieșire 5V din USB sau convertor boost intern (oprită implicit pe baterie; se activează din GPIO → 5V on GPIO)." } },
  { pin: 2, name: "PA7", alt: "SPI_MOSI / ADC", kind: "spi", voltage: "3.3 V logic", notes: { en: "Primary SPI Master-Out-Slave-In line used by external CC1101, NRF24L01+, and SPI flash modules.", ro: "Linie principală SPI MOSI folosită de modulele externe CC1101, NRF24L01+ și memorii SPI flash." } },
  { pin: 3, name: "PA6", alt: "SPI_MISO", kind: "spi", voltage: "3.3 V logic", notes: { en: "SPI Master-In-Slave-Out data return line with 51Ω series protection resistor.", ro: "Linie de recepție SPI MISO protejată cu rezistor serie de 51Ω și protecție ESD." } },
  { pin: 4, name: "PA4", alt: "SPI_CS / DAC", kind: "spi", voltage: "3.3 V logic", notes: { en: "Default Chip Select (CS) for external SPI boards like CC1101 or NRF24.", ro: "Pin implicit Chip Select (CS) pentru plăcile externe SPI precum CC1101 sau NRF24." } },
  { pin: 5, name: "PB3", alt: "SPI_SCK", kind: "spi", voltage: "3.3 V logic", notes: { en: "Shared SPI clock line for external radio transceivers and SPI displays.", ro: "Linie de ceas SPI partajată pentru transceivere radio externe și ecrane SPI." } },
  { pin: 6, name: "PB2", alt: "GPIO / CC1101 GDO0", kind: "gpio", voltage: "3.3 V logic", notes: { en: "General-purpose I/O commonly assigned as GDO0 interrupt/data pin on external CC1101 hats.", ro: "Pin I/O general folosit frecvent ca GDO0 (întrerupere/date) pe modulele externe CC1101." } },
  { pin: 7, name: "PC3", alt: "GPIO / NRF CE / ADC", kind: "gpio", voltage: "3.3 V logic", notes: { en: "General-purpose GPIO or ADC input; widely wired to Chip Enable (CE) on NRF24L01+ boards.", ro: "Pin GPIO sau intrare ADC; conectat uzual la Chip Enable (CE) pe plăcile NRF24L01+." } },
  { pin: 8, name: "GND", alt: "Ground", kind: "gnd", voltage: "0 V", notes: { en: "Top-row system ground reference.", ro: "Masă (GND) de referință pe rândul superior." } },
  { pin: 9, name: "3V3", alt: "Regulated 3.3V", kind: "power", voltage: "3.3 V (≤1.2 A)", notes: { en: "Main regulated 3.3V rail powering ESP32, CC1101, GPS, and sensors (briefly cycles on microSD remount).", ro: "Linie principală stabilizată 3.3V pentru ESP32, CC1101, GPS și senzori (se resetează scurt la montarea microSD)." } },
  { pin: 10, name: "SWC", alt: "PA14 / SWCLK", kind: "gpio", voltage: "3.3 V logic", notes: { en: "ARM SWD debug clock line used by the official Wi-Fi Devboard running Black Magic Probe.", ro: "Linie de ceas depanare ARM SWD folosită de placa oficială Wi-Fi Devboard cu Black Magic Probe." } },
  { pin: 11, name: "GND", alt: "Ground", kind: "gnd", voltage: "0 V", notes: { en: "Common ground pin adjacent to UART pins — ideal for DIY ESP32 jumper harnesses.", ro: "Pin de masă (GND) lângă pinii UART — ideal pentru cablarea DIY cu plăci ESP32." } },
  { pin: 12, name: "SIO", alt: "PA13 / SWDIO", kind: "gpio", voltage: "3.3 V logic", notes: { en: "ARM SWD bidirectional debug data line for live breakpoints and firmware recovery.", ro: "Linie bidirecțională de depanare ARM SWD pentru breakpoint-uri live și recuperare firmware." } },
  { pin: 13, name: "TX", alt: "PB6 / USART_TX", kind: "uart", voltage: "3.3 V logic", notes: { en: "Primary UART Transmit pin — connect directly to RX on ESP32 Marauder / GhostESP or GPS modules.", ro: "Pin principal UART Transmit — conectează-l la RX pe ESP32 Marauder / GhostESP sau module GPS." } },
  { pin: 14, name: "RX", alt: "PB7 / USART_RX", kind: "uart", voltage: "3.3 V logic", notes: { en: "Primary UART Receive pin — connect directly to TX on ESP32 Wi-Fi boards or NMEA GPS receivers.", ro: "Pin principal UART Receive — conectează-l la TX pe plăci Wi-Fi ESP32 sau receptoare GPS NMEA." } },
  { pin: 15, name: "C1", alt: "PC1 / I2C_SDA", kind: "i2c", voltage: "3.3 V logic", notes: { en: "I2C Data (SDA) line for BMP280, SSD1306, LM75A, and DigiLab sensor experiments.", ro: "Linie de date I2C (SDA) pentru senzori BMP280, LM75A, ecrane SSD1306 și experimente DigiLab." } },
  { pin: 16, name: "C0", alt: "PC0 / I2C_SCL", kind: "i2c", voltage: "3.3 V logic", notes: { en: "I2C Clock (SCL) line paired with Pin 15 (PC1). Add 4.7kΩ pull-ups if your sensor lacks them.", ro: "Linie de ceas I2C (SCL) în pereche cu Pin 15 (PC1). Adaugă rezistențe pull-up de 4.7kΩ dacă senzorul nu are." } },
  { pin: 17, name: "1W", alt: "iButton / 1-Wire", kind: "onewire", voltage: "3.3 V logic", notes: { en: "Dedicated 1-Wire bus shared with rear pogo pads for DS1990A iButton and DS18B20 temperature probes.", ro: "Magistrală dedicată 1-Wire partajată cu pad-urile din spate pentru chei DS1990A și senzori DS18B20." } },
  { pin: 18, name: "GND", alt: "Ground", kind: "gnd", voltage: "0 V", notes: { en: "Right-edge system ground pin.", ro: "Pin de masă (GND) la marginea dreaptă." } },
];

export const FLIPPER_BOARDS: FlipperExtensionBoard[] = [
  {
    id: "fz-wifi-devboard",
    name: "Official Wi-Fi Developer Board",
    maker: "Flipper Devices",
    category: "official",
    chips: ["ESP32-S2-WROVER", "USB-C"],
    priceBand: "~$29",
    redditBuzz: {
      en: "Best starter Wi-Fi & SWD debugger board; ubiquitous tutorials on r/flipperzero (note: ESP32-S2 has Wi-Fi only, no BLE).",
      ro: "Cea mai bună placă de start pentru Wi-Fi și depanare SWD; mii de tutoriale pe r/flipperzero (notă: ESP32-S2 are doar Wi-Fi, fără BLE).",
    },
    summary: {
      en: "Official Espressif ESP32-S2 expansion board pre-flashed with Black Magic Probe for wireless/wired SWD debugging, and widely flashed with ESP32 Marauder or GhostESP for Wi-Fi lab analysis.",
      ro: "Placa oficială de extensie cu ESP32-S2 preîncărcată cu Black Magic Probe pentru depanare SWD și foarte populară cu firmware ESP32 Marauder sau GhostESP pentru analiza rețelelor Wi-Fi.",
    },
    capabilities: {
      en: [
        "Black Magic Probe & CMSIS-DAP wireless debugging over Wi-Fi",
        "2.4 GHz 802.11 b/g/n Wi-Fi scanning & authorized lab packet capture",
        "Native USB-C web flashing with dedicated BOOT & RESET buttons",
      ],
      ro: [
        "Depanare wireless Black Magic Probe & CMSIS-DAP prin Wi-Fi",
        "Scanare Wi-Fi 2.4 GHz 802.11 b/g/n și captură de pachete în laborator",
        "Scriere firmware direct din browser prin USB-C, cu butoane BOOT și RESET",
      ],
    },
    tradeoffs: {
      en: "No onboard microSD slot on stock board (PCAP saves require Flipper SD bridge or an SD mod); ESP32-S2 lacks Bluetooth.",
      ro: "Nu include slot microSD pe placa standard (salvarea PCAP folosește cardul Flipper sau un mod SD); ESP32-S2 nu are Bluetooth.",
    },
    gpioUsed: "Pins 9 (3V3), 10/12 (SWD), 11 (GND), 13/14 (UART)",
    requiredPartIds: ["flipper-zero", "esp32-s2-devboard"],
    url: "https://docs.flipper.net/development/hardware/wifi-developer-board",
  },
  {
    id: "fz-video-game-module",
    name: "Official Video Game Module",
    maker: "Flipper Devices",
    category: "official",
    chips: ["RP2040 Dual-Core 133 MHz", "TDK ICM-42688-P 6-Axis IMU", "HDMI / DVI-D"],
    priceBand: "~$49",
    redditBuzz: {
      en: "Praised on Reddit for crisp 640×480 classroom/demo HDMI mirroring, tilt-controlled Air Mouse, and doubling as a standalone Raspberry Pi Pico.",
      ro: "Lăudat pe Reddit pentru oglindirea clară 640×480 pe HDMI la prezentări, funcția Air Mouse cu giroscop și modul independent Raspberry Pi Pico.",
    },
    summary: {
      en: "Official RP2040 expansion adding full-size HDMI (640×480 DVI-D @ 60 Hz), a 6-axis gyroscope/accelerometer for motion games & Air Mouse, plus a 14-pin RP2040 GPIO breakout.",
      ro: "Modulul oficial bazat pe RP2040 care adaugă ieșire HDMI completă (640×480 DVI-D @ 60 Hz), giroscop/accelerometru pe 6 axe pentru jocuri cu mișcare și Air Mouse, plus 14 pini GPIO.",
    },
    capabilities: {
      en: [
        "640×480 DVI-D @ 60 Hz video mirror over HDMI for TVs & projectors",
        "ICM-42688-P 6-axis IMU for tilt games (Air Arkanoid) and USB/BLE Air Mouse",
        "Standalone Raspberry Pi Pico mode via USB-C UF2 bootloader + 11 free GPIOs",
      ],
      ro: [
        "Oglindire video 640×480 DVI-D @ 60 Hz prin HDMI pe TV sau proiector",
        "Senzor IMU 6 axe ICM-42688-P pentru jocuri cu înclinare și Air Mouse",
        "Funcționează independent ca Raspberry Pi Pico prin UF2 USB-C + 11 pini GPIO liberi",
      ],
    },
    tradeoffs: {
      en: "Outputs DVI-D video only over HDMI (no HDMI audio); requires extra power when driving external sensors from its breakout header.",
      ro: "Transmite doar semnal video DVI-D prin HDMI (fără audio HDMI); necesită atenție la consum când alimentezi senzori externi.",
    },
    gpioUsed: "Full 18-pin top header passthrough + 14-pin RP2040 breakout",
    requiredPartIds: ["flipper-zero", "flipper-vgm"],
    url: "https://docs.flipper.net/video-game-module",
  },
  {
    id: "fz-rabbit-labs",
    name: "Rabbit Labs Deluxe CC1101 & Ghost ESP",
    maker: "Rabbit Labs (Community / Tindie)",
    category: "reddit-top",
    chips: ["TI CC1101 + SMA", "ESP32-S3 / C5 options"],
    priceBand: "$35–$65",
    redditBuzz: {
      en: "Consistently #1 most-recommended community maker on r/flipperzero for clean PCB layout, tuned SMA antennas, and reliable soldering.",
      ro: "Constant pe locul #1 în recomandările r/flipperzero pentru calitatea PCB-ului, antene SMA acordate și lipituri impecabile.",
    },
    summary: {
      en: "Community gold-standard GPIO boards: dedicated external CC1101 modules for 3×–5× better Sub-GHz reception and compact ESP32-S3 boards running GhostESP or Marauder.",
      ro: "Standardul de aur al comunității: module externe CC1101 dedicate pentru recepție Sub-GHz de 3×–5× mai bună și plăci compacte ESP32-S3 compatibile GhostESP sau Marauder.",
    },
    capabilities: {
      en: [
        "External tuned SMA antenna dramatically outperforms Flipper's internal Sub-GHz coil",
        "Single-purpose modularity — swap radios without bulky stacks",
        "Open community pinouts compatible with Momentum, Unleashed, and Official apps",
      ],
      ro: [
        "Antena externă SMA depășește clar antena internă Sub-GHz a Flipper Zero",
        "Modularitate dedicată — schimbi modulul fără plăci voluminoase",
        "Pinout deschis compatibil cu aplicațiile din firmware-ul Oficial, Momentum și Unleashed",
      ],
    },
    tradeoffs: {
      en: "Single-radio boards require swapping hats if you switch between Sub-GHz and Wi-Fi; drops sell out quickly.",
      ro: "Plăcile cu un singur modul radio necesită schimbare fizică între Sub-GHz și Wi-Fi; stocurile se epuizează rapid.",
    },
    gpioUsed: "SPI (Pins 2–7, 9, 11) for CC1101 · UART (Pins 9, 11, 13, 14) for ESP32",
    requiredPartIds: ["flipper-zero", "cc1101-module"],
    url: "https://www.reddit.com/r/flipperzero/",
  },
  {
    id: "fz-jcmk-pro",
    name: "Just Call Me KoKo WiFi Dev Board Pro",
    maker: "Just Call Me KoKo (JCMK)",
    category: "reddit-top",
    chips: ["ESP32-WROOM / S3", "MicroSD Slot", "External SMA", "GPS Header"],
    priceBand: "$55–$75",
    redditBuzz: {
      en: "Built by the creator of ESP32 Marauder himself; Reddit loves the flush rear-mounted pins and onboard microSD for zero-drop PCAP logging.",
      ro: "Creată chiar de autorul ESP32 Marauder; pe Reddit este apreciată pentru montarea plată pe spatele Flipper-ului și slotul microSD dedicat pentru PCAP.",
    },
    summary: {
      en: "Purpose-built Wi-Fi & Bluetooth auditing board with onboard microSD storage, external 2.4 GHz antenna connector, optional GPS add-on, and low-profile flush mounting.",
      ro: "Placă dedicată de analiză Wi-Fi și Bluetooth cu slot microSD integrat, conector de antenă externă 2.4 GHz, suport GPS și montare compactă pe spatele dispozitivului.",
    },
    capabilities: {
      en: [
        "Onboard microSD writes PCAP logs directly at high speed without UART bottlenecks",
        "Supports both Wi-Fi and BLE scanning (unlike stock ESP32-S2 devboard)",
        "Bottom-mounted right-angle pins sit flush against Flipper's back shell",
      ],
      ro: [
        "Slotul microSD intern salvează capturi PCAP direct, fără limitări UART",
        "Suportă atât scanare Wi-Fi cât și BLE (spre deosebire de placa oficială ESP32-S2)",
        "Pinii montați la 90° permit așezarea plată, compactă, în buzunar",
      ],
    },
    tradeoffs: {
      en: "Higher price than DIY boards; requires 3D-printed case if carried loosely to protect the SMA connector.",
      ro: "Preț mai mare decât variantele DIY; recomandată o carcasă printată 3D pentru protecția conectorului SMA.",
    },
    gpioUsed: "Pins 9 (3V3), 11 (GND), 13 (TX), 14 (RX) + optional GPS UART",
    requiredPartIds: ["flipper-zero", "esp32-s3-devkit", "microsd-module"],
    url: "https://github.com/justcallmekoko/ESP32Marauder",
  },
  {
    id: "fz-multi-3in1",
    name: "All-in-One 3-in-1 / Mayhem / Feberis Pro",
    maker: "Community Multi-Board Ecosystem (Mayhem / Awok / Feberis)",
    category: "multi-board",
    chips: ["ESP32 / ESP32-S3", "CC1101", "NRF24L01+", "Optional GPS + SD"],
    priceBand: "$65–$120",
    redditBuzz: {
      en: "Most debated topic on r/flipperzero: ultimate convenience with 3–4 radios + DIP switches, vs. higher bulk and shared failure points.",
      ro: "Cel mai dezbătut subiect pe r/flipperzero: confort maxim cu 3–4 module radio + comutatoare DIP, versus dimensiune mai mare și cost ridicat.",
    },
    summary: {
      en: "Combines ESP32 Wi-Fi/BLE, external CC1101 Sub-GHz, and NRF24L01+ 2.4 GHz (plus optional GNSS GPS for wardriving) on a single switched PCB with dedicated SMA ports.",
      ro: "Combină ESP32 Wi-Fi/BLE, modul extern CC1101 Sub-GHz și NRF24L01+ 2.4 GHz (plus GPS opțional pentru wardriving) pe un singur PCB cu comutatoare hardware și porturi SMA.",
    },
    capabilities: {
      en: [
        "Hardware DIP/slide switch selects ESP32, CC1101, or NRF24 without unplugging",
        "Supports Mayhem, Marauder, GhostESP, Sub-GHz external, and NRF24 apps",
        "GPS + SD variants enable standalone Wi-Fi/BLE geolocation mapping",
      ],
      ro: [
        "Comutatoarele hardware selectează rapid ESP32, CC1101 sau NRF24 fără demontare",
        "Compatibilă cu Mayhem, Marauder, GhostESP, Sub-GHz extern și aplicații NRF24",
        "Variantele cu GPS + SD permit cartografierea rețelelor Wi-Fi/BLE",
      ],
    },
    tradeoffs: {
      en: "Reddit warning: bulky in pockets, draws higher current from Flipper battery, and avoid cheap unshielded clones with poorly matched antennas.",
      ro: "Avertisment Reddit: voluminoasă în buzunar, consum mai mare din bateria Flipper; evită clonele ieftine fără ecranare sau cu antene neacordate.",
    },
    gpioUsed: "SPI (CC1101/NRF24) + UART (ESP32/GPS) via hardware mux/switches",
    requiredPartIds: ["flipper-zero", "esp32-s3-devkit", "cc1101-module", "nrf24-module", "gps-module"],
    url: "https://github.com/eried/flipperzero-mayhem",
  },
  {
    id: "fz-digilab-ir",
    name: "Lab401 DigiLab I2C & High-Power IR Blaster",
    maker: "Lab401 & Community",
    category: "reddit-top",
    chips: ["BMP280 / LM75A I2C", "Multi-LED 940 nm IR Array + MOSFET"],
    priceBand: "$18–$35",
    redditBuzz: {
      en: "Great for learners & classrooms: read real barometric/temperature sensors over Flipper I2C or test multi-angle IR coverage across a room.",
      ro: "Excelent pentru începători și școli: citește senzori reali de temperatură/presiune pe I2C sau testează semnale IR cu acoperire largă în întreaga cameră.",
    },
    summary: {
      en: "Hardware learning & utility hats that tap Flipper's I2C bus (PC1/PC0) for environmental sensors or drive high-current 940 nm IR LEDs via 5V GPIO for long-range remote emulation.",
      ro: "Extensii educative și practice care folosesc magistrala I2C (PC1/PC0) pentru senzori de mediu sau alimentează LED-uri IR 940 nm de mare putere din linia 5V pentru distanțe mari.",
    },
    capabilities: {
      en: [
        "Plug-and-play I2C exploration (BMP280, BME280, LM75A, SSD1306)",
        "Wide-angle 940 nm IR Blaster extends remote range up to 15–25 meters",
        "Ideal entry project for learning GPIO logic levels and MOSFET switching",
      ],
      ro: [
        "Explorare rapidă I2C (BMP280, BME280, LM75A, SSD1306)",
        "IR Blaster 940 nm cu unghi larg extinde raza telecomenzii la 15–25 metri",
        "Proiect ideal pentru învățarea nivelurilor logice GPIO și a tranzistoarelor MOSFET",
      ],
    },
    tradeoffs: {
      en: "High-power IR blasters require enabling '5V on GPIO' in Flipper settings before transmitting.",
      ro: "Modulele IR Blaster de putere necesită activarea opțiunii „5V on GPIO” în setările Flipper înainte de transmisie.",
    },
    gpioUsed: "Pins 1 (5V), 15 (PC1 SDA), 16 (PC0 SCL), 11/18 (GND)",
    requiredPartIds: ["flipper-zero", "bme280-sensor", "ir-blaster"],
    url: "https://lab401.com/blogs/academy",
  },
  {
    id: "fz-diy-esp32",
    name: "DIY Budget ESP32-S3 / S2 Companion Board",
    maker: "Build It Yourself (4 Jumper Wires + Perfboard)",
    category: "diy-esp32",
    chips: ["ESP32-S3-DevKitC-1 or ESP32-C3/S2", "Optional CC1101"],
    priceBand: "$5–$12",
    redditBuzz: {
      en: "Top DIY tip on r/flipperzero: any generic $6 ESP32-S3 DevKit + 4 jumper wires gives you Marauder/GhostESP in 10 minutes while teaching real UART wiring!",
      ro: "Cel mai bun sfat DIY pe r/flipperzero: orice placă ESP32-S3 de ~30 RON + 4 fire jumper îți oferă Marauder/GhostESP în 10 minute și te învață cablarea UART reală!",
    },
    summary: {
      en: "Skip expensive pre-built boards by wiring your existing ESP32-S3-DevKitC-1 directly to Flipper Zero's UART header (Pins 9, 11, 13, 14) and flashing GhostESP or Marauder from the browser.",
      ro: "Economisește buget conectând placa ta ESP32-S3-DevKitC-1 direct la conectorul UART al Flipper Zero (Pinii 9, 11, 13, 14) și scriind GhostESP sau Marauder din browser.",
    },
    capabilities: {
      en: [
        "Costs ~$6–$10 using standard ESP32-S3 or ESP32-S2 boards you already own",
        "Zero soldering needed on a breadboard, or solder onto an Official Protoboard",
        "Re-flash back to your own ESP-IDF / Arduino labs anytime over USB-C",
      ],
      ro: [
        "Costă doar ~30–50 RON folosind plăcile ESP32-S3 sau ESP32-S2 pe care le ai deja",
        "Nu necesită lipire pe breadboard, sau se poate monta permanent pe Protoboard",
        "O poți rescrie oricând înapoi pentru laboratoarele tale ESP-IDF sau Arduino prin USB-C",
      ],
    },
    tradeoffs: {
      en: "Double-check TX↔RX crossover and never feed 5V into 3.3V logic pins; add a 100µF decoupling capacitor if ESP32 browns out during Wi-Fi TX bursts.",
      ro: "Verifică încrucișarea TX↔RX și nu aplica 5V pe pinii logici de 3.3V; adaugă un condensator de 100µF dacă ESP32 se resetează la rafale Wi-Fi.",
    },
    gpioUsed: "Pin 9 (3V3) · Pin 11 (GND) · Pin 13 (TX→ESP RX) · Pin 14 (RX→ESP TX)",
    requiredPartIds: ["flipper-zero", "esp32-s3-devkit", "breadboard-wires"],
    url: "https://github.com/Master-YCK/DIY-Flipper-DevBoard",
  },
];

export const FLIPPER_GUIDES: FlipperStepGuide[] = [
  {
    id: "guide-diy-esp32-uart",
    title: {
      en: "Build a $8 DIY ESP32-S3 Wi-Fi Companion Board (UART Bridge)",
      ro: "Construiește o Placă DIY Wi-Fi ESP32-S3 (Punte UART ~35 RON)",
    },
    difficulty: "Beginner",
    duration: "20 min",
    summary: {
      en: "Connect your ESP32-S3-DevKitC-1 to Flipper Zero using 4 jumper wires, flash open-source GhostESP / Marauder or custom ESP-IDF firmware, and control Wi-Fi scans from Flipper's screen.",
      ro: "Conectează ESP32-S3-DevKitC-1 la Flipper Zero cu 4 fire jumper, instalează firmware open-source GhostESP / Marauder sau ESP-IDF propriu și controlează scanările Wi-Fi de pe ecranul Flipper.",
    },
    wiring: [
      { from: "Flipper Pin 9 (3V3)", to: "ESP32-S3 3V3", signal: "3.3V Power (≤1.2A)" },
      { from: "Flipper Pin 11 (GND)", to: "ESP32-S3 GND", signal: "Common Ground" },
      { from: "Flipper Pin 13 (TX)", to: "ESP32-S3 RX (GPIO44)", signal: "UART TX → RX (115200)" },
      { from: "Flipper Pin 14 (RX)", to: "ESP32-S3 TX (GPIO43)", signal: "UART RX ← TX (115200)" },
    ],
    requiredPartIds: ["flipper-zero", "esp32-s3-devkit", "breadboard-wires"],
    steps: [
      {
        title: { en: "1. Flash ESP32 Firmware via USB-C First", ro: "1. Scrie Firmware-ul pe ESP32 prin USB-C" },
        detail: {
          en: "Before wiring to Flipper, connect your ESP32-S3 to your computer via USB-C. Hold BOOT, tap RESET, and flash GhostESP, ESP32 Marauder, or your custom UART CLI firmware.",
          ro: "Înainte de cablare, conectează ESP32-S3 la PC prin USB-C. Ține apăsat BOOT, apasă RESET și scrie GhostESP, ESP32 Marauder sau firmware-ul tău CLI UART.",
        },
        codeOrCmd: "esptool.py --chip esp32s3 --baud 921600 write_flash 0x0 firmware.bin",
      },
      {
        title: { en: "2. Wire TX/RX Crossover with Power Off", ro: "2. Conectează Firele TX/RX (Încrucișat) fără Alimentare" },
        detail: {
          en: "Unplug USB from ESP32-S3. Connect Flipper Pin 13 (TX) to ESP32 RX, Pin 14 (RX) to ESP32 TX, Pin 11 to GND, and Pin 9 to 3V3. Verify no loose strands touch Pin 1 (5V).",
          ro: "Deconectează USB de la ESP32-S3. Leagă Pin 13 Flipper (TX) la RX pe ESP32, Pin 14 (RX) la TX, Pin 11 la GND și Pin 9 la 3V3. Asigură-te că niciun fir nu atinge Pin 1 (5V).",
        },
      },
      {
        title: { en: "3. Verify Link in Flipper UART Terminal", ro: "3. Verifică Conexiunea în Terminalul UART Flipper" },
        detail: {
          en: "On Flipper Zero, open Apps → GPIO → UART Terminal (115200 baud) or the Wi-Fi Marauder / GhostESP app. Press RESET on ESP32 and confirm the boot banner prints cleanly.",
          ro: "Pe Flipper Zero, deschide Apps → GPIO → UART Terminal (115200 baud) sau aplicația Wi-Fi Marauder / GhostESP. Apasă RESET pe ESP32 și verifică mesajul de pornire.",
        },
        codeOrCmd: "help  # Expected: list of scanap / sniff / info commands",
      },
      {
        title: { en: "4. Run a Passive Access Point Scan", ro: "4. Rulează o Scanare Pasivă de Rețele Proprii" },
        detail: {
          en: "Select Scan → Scan APs to list nearby 2.4 GHz SSIDs, channels, and RSSI levels in real time on your Flipper display.",
          ro: "Selectează Scan → Scan APs pentru a lista rețelele 2.4 GHz din apropiere, canalele și nivelul RSSI în timp real pe ecranul Flipper.",
        },
      },
    ],
    safetyNote: {
      en: "Authorized lab use only: only run active tests on Wi-Fi networks you own or have written permission to audit.",
      ro: "Doar pentru laborator autorizat: rulează teste active exclusiv pe rețelele Wi-Fi proprii sau pentru care ai acord scris.",
    },
  },
  {
    id: "guide-cc1101-external",
    title: {
      en: "External CC1101 Sub-GHz Antenna Module Wiring & Range Boost",
      ro: "Cablare Modul Extern CC1101 Sub-GHz & Creșterea Razei RF",
    },
    difficulty: "Intermediate",
    duration: "25 min",
    summary: {
      en: "Wire an 8-pin TI CC1101 transceiver with an external 433 MHz SMA antenna to Flipper Zero's SPI bus to triple Sub-GHz weather-station and remote-control reception range.",
      ro: "Conectează un transceiver TI CC1101 cu antenă externă SMA de 433 MHz la magistrala SPI a Flipper Zero pentru a tripla raza de recepție a stațiilor meteo și telecomenzilor.",
    },
    wiring: [
      { from: "Flipper Pin 2 (PA7 / MOSI)", to: "CC1101 SI (MOSI)", signal: "SPI Data Out" },
      { from: "Flipper Pin 3 (PA6 / MISO)", to: "CC1101 SO (MISO)", signal: "SPI Data In" },
      { from: "Flipper Pin 4 (PA4 / CS)", to: "CC1101 CSN", signal: "SPI Chip Select" },
      { from: "Flipper Pin 5 (PB3 / SCK)", to: "CC1101 SCLK", signal: "SPI Clock" },
      { from: "Flipper Pin 6 (PB2)", to: "CC1101 GDO0", signal: "Packet Data / IRQ" },
      { from: "Flipper Pin 9 (3V3) & Pin 8/11 (GND)", to: "CC1101 VCC & GND", signal: "3.3V Regulated Power" },
    ],
    requiredPartIds: ["flipper-zero", "cc1101-module", "breadboard-wires"],
    steps: [
      {
        title: { en: "1. Match Your Antenna to Your Local ISM Band", ro: "1. Alege Antena Potrivită Benzii ISM Locale" },
        detail: {
          en: "Attach a tuned 433 MHz (Europe/Romania ISM) or 315/915 MHz SMA antenna BEFORE powering the CC1101. Never transmit without an antenna attached.",
          ro: "Montează o antenă SMA acordată pe 433 MHz (banda ISM Europa/România) sau 868 MHz ÎNAINTE de alimentare. Nu transmite niciodată fără antenă montată.",
        },
      },
      {
        title: { en: "2. Wire SPI Lines + GDO0", ro: "2. Conectează Liniile SPI și GDO0" },
        detail: {
          en: "Keep jumper wires short (<10 cm) to prevent SPI ringing at 8 MHz. Double-check VCC goes strictly to Pin 9 (3.3V), as CC1101 is NOT 5V tolerant.",
          ro: "Folosește fire scurte (<10 cm) pentru a evita reflexiile SPI. Verifică strict ca VCC să fie pe Pin 9 (3.3V), deoarece cipul CC1101 NU suportă 5V.",
        },
      },
      {
        title: { en: "3. Switch Radio Source to External in Flipper", ro: "3. Comută Sursa Radio pe Extern în Flipper" },
        detail: {
          en: "Open Sub-GHz → Radio Settings → Module → External. Flipper immediately probes SPI and confirms the external CC1101 chip.",
          ro: "Deschide Sub-GHz → Radio Settings → Module → External. Flipper detectează automat cipul CC1101 extern pe SPI.",
        },
      },
      {
        title: { en: "4. Compare RSSI on a 433.92 MHz Weather Sensor", ro: "4. Compară RSSI-ul unui Senzor Meteo 433.92 MHz" },
        detail: {
          en: "Open Sub-GHz → Frequency Analyzer or Weather Station app and compare RSSI dBm readings between Internal and External antennas.",
          ro: "Deschide Sub-GHz → Frequency Analyzer sau aplicația Weather Station și compară valorile RSSI (dBm) între antena internă și cea externă.",
        },
      },
    ],
    safetyNote: {
      en: "Respect local RF regulations (ANCOM / ETSI in Europe, FCC in US); keep testing passive or within legal ISM power/duty-cycle limits.",
      ro: "Respectă reglementările radio locale (ANCOM / ETSI în Europa); folosește recepția pasivă sau limitele legale de putere în banda ISM.",
    },
  },
  {
    id: "guide-vgm-hdmi-imu",
    title: {
      en: "Video Game Module: HDMI Classroom Mirroring & RP2040 IMU Apps",
      ro: "Modulul Video Game: Proiecție HDMI & Aplicații cu Giroscop RP2040",
    },
    difficulty: "Beginner",
    duration: "15 min",
    summary: {
      en: "Set up the official RP2040 Video Game Module to mirror Flipper Zero onto a big TV/projector at 640×480@60Hz, test the 6-axis Air Mouse, and flash custom Pico UF2 firmware.",
      ro: "Configurează modulul oficial RP2040 pentru a oglindi Flipper Zero pe un TV/proiector la 640×480@60Hz, testează Air Mouse-ul pe 6 axe și scrie firmware custom Pico UF2.",
    },
    requiredPartIds: ["flipper-zero", "flipper-vgm"],
    steps: [
      {
        title: { en: "1. Seat the Module & Update Firmware", ro: "1. Montează Modulul și Actualizează Firmware-ul" },
        detail: {
          en: "Snap the Video Game Module firmly onto Flipper's 18-pin header. Update Flipper firmware via lab.flipper.net so the VGM driver is current.",
          ro: "Fixează ferm modulul pe cei 18 pini GPIO ai Flipper Zero. Actualizează firmware-ul prin lab.flipper.net pentru suport complet VGM.",
        },
      },
      {
        title: { en: "2. Connect HDMI for Zero-Lag 640×480 Mirroring", ro: "2. Conectează Cablul HDMI pentru Oglindire 640×480" },
        detail: {
          en: "Plug a standard HDMI cable into any monitor or classroom projector. Flipper's 128×64 UI automatically scales 4× cleanly onto the big screen.",
          ro: "Conectează un cablu HDMI la orice monitor sau proiector. Interfața 128×64 a Flipper se scalează automat 4× fără neclaritate.",
        },
      },
      {
        title: { en: "3. Calibrate the 6-Axis IMU (Air Mouse & Games)", ro: "3. Calibrează Senzorul IMU 6 Axe (Air Mouse & Jocuri)" },
        detail: {
          en: "Launch Apps → Games → Air Arkanoid or Apps → USB → Air Mouse to steer cursors and paddles by tilting Flipper in mid-air.",
          ro: "Deschide Apps → Games → Air Arkanoid sau Apps → USB → Air Mouse pentru a controla cursorul sau jocul prin înclinarea Flipper-ului.",
        },
      },
      {
        title: { en: "4. Standalone Raspberry Pi Pico Mode (Optional)", ro: "4. Mod Independent Raspberry Pi Pico (Opțional)" },
        detail: {
          en: "Detach VGM, hold BOOT while plugging USB-C into your PC — it mounts as RPI-RP2 drive ready for MicroPython or C/C++ Pico SDK UF2 files!",
          ro: "Detașează modulul, ține apăsat BOOT când conectezi USB-C la PC — apare ca unitate RPI-RP2 gata pentru MicroPython sau Pico SDK UF2!",
        },
      },
    ],
    safetyNote: {
      en: "Avoid hot-plugging external circuits onto the 14-pin RP2040 breakout while powered from Flipper battery.",
      ro: "Evită conectarea circuitelor externe pe pinii RP2040 în timp ce modulul este alimentat din bateria Flipper.",
    },
  },
  {
    id: "guide-i2c-sensors",
    title: {
      en: "Read Live I2C Sensors (BMP280 / BME280) Directly on Flipper GPIO",
      ro: "Citire Senzori I2C (BMP280 / BME280) Direct pe GPIO Flipper",
    },
    difficulty: "Beginner",
    duration: "15 min",
    summary: {
      en: "Inspired by Lab401's DigiLab tutorial: wire an I2C temperature/pressure sensor to Pins 15 & 16, scan bus addresses, and chart live climate telemetry on Flipper's LCD.",
      ro: "Inspirat de ghidul Lab401 DigiLab: conectează un senzor I2C de temperatură și presiune la pinii 15 și 16, scanează adresele magistralei și citește date live pe ecran.",
    },
    wiring: [
      { from: "Flipper Pin 9 (3V3)", to: "BME280 VCC", signal: "3.3V Power" },
      { from: "Flipper Pin 11 (GND)", to: "BME280 GND", signal: "Ground" },
      { from: "Flipper Pin 15 (PC1)", to: "BME280 SDA", signal: "I2C Data" },
      { from: "Flipper Pin 16 (PC0)", to: "BME280 SCL", signal: "I2C Clock" },
    ],
    requiredPartIds: ["flipper-zero", "bme280-sensor", "breadboard-wires"],
    steps: [
      {
        title: { en: "1. Wire the 4-Pin I2C Bus", ro: "1. Cablarea celor 4 Fire I2C" },
        detail: {
          en: "Connect VCC→Pin 9, GND→Pin 11, SDA→Pin 15 (PC1), and SCL→Pin 16 (PC0). Most breakout boards already include 4.7kΩ/10kΩ pull-ups.",
          ro: "Conectează VCC→Pin 9, GND→Pin 11, SDA→Pin 15 (PC1) și SCL→Pin 16 (PC0). Majoritatea modulelor includ deja rezistențe pull-up.",
        },
      },
      {
        title: { en: "2. Run I2C Tools Scanner App", ro: "2. Rulează Aplicația I2C Tools Scanner" },
        detail: {
          en: "Open Apps → GPIO → I2C Tools → Scan. Confirm address 0x76 or 0x77 responds immediately.",
          ro: "Deschide Apps → GPIO → I2C Tools → Scan. Confirmă că adresa 0x76 sau 0x77 răspunde instantaneu.",
        },
        codeOrCmd: "I2C Scan -> Found device at 0x76 (BME280 / BMP280)",
      },
      {
        title: { en: "3. Log Temperature, Humidity & Pressure", ro: "3. Citește Temperatura, Umiditatea și Presiunea" },
        detail: {
          en: "Open the Weather / Sensor Reader app on Flipper to display real-time Celsius, hPa barometric pressure, and altitude.",
          ro: "Deschide aplicația Weather / Sensor Reader pe Flipper pentru a urmări în timp real temperatura (°C), presiunea (hPa) și altitudinea estimată.",
        },
      },
    ],
    safetyNote: {
      en: "Always verify your breakout sensor runs at 3.3V logic before connecting to Flipper Pin 15/16.",
      ro: "Verifică întotdeauna că senzorul funcționează la nivel logic de 3.3V înainte de conectarea la pinii 15/16.",
    },
  },
  {
    id: "guide-sd-irdb-firmware",
    title: {
      en: "MicroSD Architecture, Safe Firmware & UberGuidoZ IRDB Setup",
      ro: "Organizare MicroSD, Firmware Sigur & Baza de Date UberGuidoZ IRDB",
    },
    difficulty: "Beginner",
    duration: "15 min",
    summary: {
      en: "Set up a rock-solid MicroSD structure, learn how Official vs Momentum/Unleashed firmwares work, and organize community IRDB remote libraries safely via Flipper Lab.",
      ro: "Configurează corect structura cardului MicroSD, înțelege diferențele dintre firmware-ul Oficial și Momentum/Unleashed și organizează bibliotecile IRDB prin Flipper Lab.",
    },
    requiredPartIds: ["flipper-zero"],
    steps: [
      {
        title: { en: "1. Format a Name-Brand MicroSD (≤64 GB) inside Flipper", ro: "1. Formatează Cardul MicroSD Direct în Flipper" },
        detail: {
          en: "Insert a reliable Class-10 / A1 card (16–64 GB recommended for fastest indexing) and run Settings → Storage → Format SD Card.",
          ro: "Introdu un card de calitate (16–64 GB recomandat pentru indexare rapidă) și rulează Settings → Storage → Format SD Card.",
        },
      },
      {
        title: { en: "2. Connect to lab.flipper.net via WebUSB", ro: "2. Conectează-te la lab.flipper.net prin WebUSB" },
        detail: {
          en: "Use Chrome/Edge to open lab.flipper.net, update official firmware cleanly, and install verified community apps from the official Flipper App Catalog.",
          ro: "Folosește Chrome/Edge pentru a deschide lab.flipper.net, actualizează firmware-ul și instalează aplicații verificate din catalogul oficial Flipper.",
        },
      },
      {
        title: { en: "3. Curate Only the IRDB Folders You Need", ro: "3. Copiază Doar Folderele IRDB de Care Ai Nevoie" },
        detail: {
          en: "Instead of dumping 50,000 raw files (which slows menu scrolling), copy specific TV, AC, and projector folders from UberGuidoZ/Flipper-IRDB into /infrared/.",
          ro: "În loc să copiezi zeci de mii de fișiere care încetinesc meniul, copiază doar folderele de TV, AC și proiectoare din UberGuidoZ/Flipper-IRDB în /infrared/.",
        },
      },
    ],
    safetyNote: {
      en: "Always keep a backup of /ext/nfc, /ext/subghz, and /ext/infrared before switching firmware branches.",
      ro: "Păstrează mereu un backup al folderelor /ext/nfc, /ext/subghz și /ext/infrared înainte de a schimba firmware-ul.",
    },
  },
];

export const FLIPPER_RESOURCES: FlipperResource[] = [
  {
    id: "res-official-docs",
    title: "Official Flipper Zero Documentation & GPIO Schematics",
    creator: "Flipper Devices",
    kind: "official",
    url: "https://docs.flipper.net/",
    summary: {
      en: "The authoritative reference for STM32WB55 specs, 18-pin GPIO electrical protection, Wi-Fi Devboard, Video Game Module, and recovery guides.",
      ro: "Sursa oficială de adevăr pentru specificațiile STM32WB55, protecția pinilor GPIO, Wi-Fi Devboard, Video Game Module și recuperare firmware.",
    },
    topics: ["GPIO", "Hardware", "Official", "VGM"],
  },
  {
    id: "res-flipper-lab",
    title: "Flipper Lab — Browser Firmware Updater & App Catalog",
    creator: "Flipper Devices",
    kind: "official",
    url: "https://lab.flipper.net/",
    summary: {
      en: "Zero-install WebUSB dashboard to update firmware, browse official FAP apps, manage MicroSD files, and capture screen recordings.",
      ro: "Platformă WebUSB direct în browser pentru actualizare firmware, catalog oficial de aplicații FAP și gestionare fișiere MicroSD.",
    },
    topics: ["WebUSB", "Apps", "Firmware"],
  },
  {
    id: "res-talking-sasquach",
    title: "Flipper Zero Master Guide & GPIO Board Reviews (YouTube)",
    creator: "Talking Sasquatch",
    kind: "video",
    url: "https://www.youtube.com/@TalkingSasquach",
    summary: {
      en: "The community's most trusted video educator: beginner unboxing, Momentum vs Official firmware walkthroughs, Rabbit Labs/JCMK board tests, and Sub-GHz/RFID deep dives.",
      ro: "Cel mai apreciat creator video din comunitate: ghid complet de start, comparații firmware Momentum vs Oficial, recenzii plăci Rabbit Labs/JCMK și tutoriale Sub-GHz/RFID.",
    },
    topics: ["Video", "Beginner", "GPIO Boards", "Firmware"],
  },
  {
    id: "res-lab401-academy",
    title: "Lab401 Academy — I2C Sensors, Magic Cards & Hardware Tutorials",
    creator: "Lab401",
    kind: "article",
    url: "https://lab401.com/blogs/academy",
    summary: {
      en: "Hands-on engineering articles showing how to wire BMP280/LM75A I2C sensors, decode RFID/NFC protocols, and debug embedded targets with Flipper.",
      ro: "Articole tehnice practice despre conectarea senzorilor I2C (BMP280/LM75A), decodarea protocoalelor RFID/NFC și depanarea plăcilor embedded cu Flipper.",
    },
    topics: ["I2C", "RFID", "Engineering", "Article"],
  },
  {
    id: "res-awesome-flipper",
    title: "awesome-flipperzero — Master Community Directory",
    creator: "djsime1 / Community",
    kind: "github",
    url: "https://github.com/djsime1/awesome-flipperzero",
    summary: {
      en: "Curated master index of open-source FAP plugins, GPIO PCB schematics, 3D-printable cases, firmware comparisons, and developer SDK tutorials.",
      ro: "Directorul principal curat al comunității: aplicații open-source FAP, scheme PCB GPIO, carcase printabile 3D și resurse SDK.",
    },
    topics: ["GitHub", "Directory", "PCB", "Plugins"],
  },
  {
    id: "res-uberguidoz",
    title: "UberGuidoZ Flipper Playground & Universal IRDB",
    creator: "UberGuidoZ",
    kind: "github",
    url: "https://github.com/UberGuidoZ/Flipper",
    summary: {
      en: "The legendary open community archive for structured IRDB remote files, GPIO wiring pinout diagrams, BadUSB educational scripts, and Sub-GHz notes.",
      ro: "Arhiva open-source legendară cu biblioteci IRDB organizate, diagrame de cablare GPIO, scripturi educaționale BadUSB și note Sub-GHz.",
    },
    topics: ["IRDB", "GPIO", "GitHub"],
  },
  {
    id: "res-esp32-marauder",
    title: "ESP32 Marauder Wiki & Hardware Build Guide",
    creator: "Just Call Me KoKo",
    kind: "github",
    url: "https://github.com/justcallmekoko/ESP32Marauder/wiki",
    summary: {
      en: "Complete technical wiki for flashing ESP32-S2/S3 boards, wiring SD cards and GPS modules, and running Flipper Zero companion Wi-Fi/BLE tools.",
      ro: "Documentație completă pentru scrierea plăcilor ESP32-S2/S3, adăugarea cardurilor SD și modulelor GPS și conectarea cu Flipper Zero.",
    },
    topics: ["ESP32", "Marauder", "Wi-Fi", "GPS"],
  },
  {
    id: "res-ghost-esp",
    title: "GhostESP & Mayhem — Modern Open-Source ESP32 Companion Firmwares",
    creator: "GhostESP / eried",
    kind: "github",
    url: "https://github.com/Spooks4576/Ghost_ESP",
    summary: {
      en: "Active community firmwares turning generic ESP32-S3, C3, and C6 boards into versatile Flipper Zero wireless research companions with serial CLI & WebUI.",
      ro: "Firmware-uri moderne open-source care transformă plăcile ESP32-S3, C3 și C6 în extensii versatile pentru Flipper Zero cu CLI serial și WebUI.",
    },
    topics: ["ESP32-S3", "GhostESP", "Mayhem"],
  },
  {
    id: "res-reddit-flipperzero",
    title: "r/flipperzero Community Wiki & GPIO Board Megathreads",
    creator: "Reddit r/flipperzero",
    kind: "article",
    url: "https://www.reddit.com/r/flipperzero/",
    summary: {
      en: "Real user benchmarks comparing Rabbit Labs, JCMK, multi-boards, and $8 DIY AliExpress builds — plus troubleshooting tips for 3.3V power drops.",
      ro: "Comparații reale ale utilizatorilor între Rabbit Labs, JCMK, plăci 3-in-1 și construcții DIY de 35 RON — plus soluții pentru căderile de tensiune 3.3V.",
    },
    topics: ["Reddit", "Reviews", "Community"],
  },
  {
    id: "res-diy-devboard",
    title: "DIY Flipper ESP32 DevBoard — Wiring & 3D Case Guide",
    creator: "Master-YCK / Makers",
    kind: "video",
    url: "https://www.youtube.com/results?search_query=DIY+ESP32+Flipper+Zero+WiFi+board+wiring+guide",
    summary: {
      en: "Video walkthroughs demonstrating step-by-step breadboard and perfboard wiring of standard ESP32-S2/S3 modules onto Flipper's 18-pin header.",
      ro: "Tutoriale video pas cu pas pentru conectarea pe breadboard sau perfboard a modulelor ESP32-S2/S3 standard la cei 18 pini ai Flipper Zero.",
    },
    topics: ["Video", "DIY", "ESP32", "Soldering"],
  },
];

export function pickText(text: BilingualText, lang: Lang): string {
  return lang === "ro" ? text.ro : text.en;
}
