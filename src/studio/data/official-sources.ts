import type { Lang } from "../types";

export interface BilingualCopy {
  en: string;
  ro: string;
}

export interface OfficialReferenceSource {
  id: string;
  category: "espressif-hw" | "espressif-sdk" | "flipper" | "community";
  title: BilingualCopy;
  publisher: string;
  url: string;
  usedFor: BilingualCopy;
}

export interface SchematicChecklistItem {
  id: string;
  section: BilingualCopy;
  requirement: BilingualCopy;
  specValues: string;
  commonPitfall: BilingualCopy;
  sourceUrl: string;
}

export const OFFICIAL_REFERENCE_SOURCES: OfficialReferenceSource[] = [
  {
    id: "esp-hw-schematic-checklist",
    category: "espressif-hw",
    title: {
      en: "ESP Hardware Design Guidelines — Schematic Checklist (ESP32)",
      ro: "Ghid Proiectare Hardware Espressif — Lista de Verificare Schemă (ESP32)",
    },
    publisher: "Espressif Systems",
    url: "https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32/schematic-checklist.html",
    usedFor: {
      en: "Power supply decoupling (≥500 mA), CHIP_PU RC delay, strapping pins, 40 MHz crystal, RF Pi-matching network, and UART/GPIO design rules.",
      ro: "Decuplare alimentare (≥500 mA), întârziere RC pe CHIP_PU, pini strapping, cristal 40 MHz, rețea RF Pi-matching și reguli UART/GPIO.",
    },
  },
  {
    id: "esp32s3-hw-schematic-checklist",
    category: "espressif-hw",
    title: {
      en: "ESP32-S3 Hardware Design Guidelines — Schematic Checklist",
      ro: "Ghid Hardware ESP32-S3 — Lista de Verificare Schemă Electrică",
    },
    publisher: "Espressif Systems",
    url: "https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32s3/schematic-checklist.html",
    usedFor: {
      en: "ESP32-S3 strapping pins (GPIO0, GPIO3, GPIO45, GPIO46), Octal PSRAM GPIO35–37 reservation, and native USB-OTG D-/D+ ESD guidelines.",
      ro: "Pini strapping ESP32-S3 (GPIO0, GPIO3, GPIO45, GPIO46), rezervarea GPIO35–37 pentru Octal PSRAM și protecția ESD USB-OTG D-/D+.",
    },
  },
  {
    id: "esp32s3-devkitc1-ug",
    category: "espressif-hw",
    title: {
      en: "ESP32-S3-DevKitC-1 Official User Guide & Pinout",
      ro: "Ghid Oficial Utilizare și Pinout ESP32-S3-DevKitC-1",
    },
    publisher: "Espressif Systems",
    url: "https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32s3/esp32-s3-devkitc-1/user_guide.html",
    usedFor: {
      en: "Exact 62.74 × 25.40 mm board dimensions, 44-pin header layout, GPIO48 RGB WS2812 LED, dual USB-C ports, and electrical schematics.",
      ro: "Dimensiunile exacte 62.74 × 25.40 mm, conectorii de 44 pini, LED-ul RGB WS2812 pe GPIO48, porturile dual USB-C și schema electrică.",
    },
  },
  {
    id: "esp32s3-datasheet-trm",
    category: "espressif-hw",
    title: {
      en: "ESP32-S3 Series Datasheet & Technical Reference Manual (TRM)",
      ro: "Fișa Tehnică ESP32-S3 și Manualul de Referință Tehnică (TRM)",
    },
    publisher: "Espressif Systems",
    url: "https://www.espressif.com/sites/default/files/documentation/esp32-s3_technical_reference_manual_en.pdf",
    usedFor: {
      en: "32-bit peripheral register bit-fields (GPIO_OUT_REG, GPIO_ENABLE_REG, LEDC_CH0_CONF0_REG), SRAM/Flash memory map, and sleep current profiles.",
      ro: "Biții registrelor pe 32 biți (GPIO_OUT_REG, GPIO_ENABLE_REG, LEDC_CH0_CONF0_REG), harta memoriei SRAM/Flash și profilele de consum.",
    },
  },
  {
    id: "esp-dev-kits-portal",
    category: "espressif-hw",
    title: {
      en: "Espressif Official Development Kits Portal (C3, C5, C6, H2, S2, S3, P4)",
      ro: "Portal Oficial Plăci Dezvoltare Espressif (C3, C5, C6, H2, S2, S3, P4)",
    },
    publisher: "Espressif Systems",
    url: "https://docs.espressif.com/projects/esp-dev-kits/en/latest/index.html",
    usedFor: {
      en: "Verified mechanical sizes (mm), CPU architectures (Xtensa vs RISC-V), wireless radios (Wi-Fi 6, 5 GHz, Thread/Zigbee), and breadboard widths.",
      ro: "Dimensiuni mecanice verificate (mm), arhitecturi CPU (Xtensa vs RISC-V), standarde radio (Wi-Fi 6, 5 GHz, Thread/Zigbee) și lățimi pe breadboard.",
    },
  },
  {
    id: "esp-idf-guide",
    category: "espressif-sdk",
    title: {
      en: "ESP-IDF Official Programming Guide & API Reference",
      ro: "Ghid Oficial Programare ESP-IDF & Referință API C",
    },
    publisher: "Espressif Systems",
    url: "https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/index.html",
    usedFor: {
      en: "C firmware guided tours, FreeRTOS tasks, I2C/SPI/I2S/RMT/GDMA drivers, NimBLE GATT, and Wi-Fi station/ESP-NOW code patterns.",
      ro: "Tururi ghidate de cod C, task-uri FreeRTOS, drivere I2C/SPI/I2S/RMT/GDMA, NimBLE GATT și exemple Wi-Fi/ESP-NOW.",
    },
  },
  {
    id: "esp-web-tools",
    category: "espressif-sdk",
    title: {
      en: "ESP Launchpad & esptool-js (Web Serial Flashing)",
      ro: "ESP Launchpad & esptool-js (Scriere Firmware prin Web Serial)",
    },
    publisher: "Espressif Systems / Open Source",
    url: "https://espressif.github.io/esp-launchpad/",
    usedFor: {
      en: "Browser-based USB-C firmware flashing and direct serial monitoring with real ESP32 boards.",
      ro: "Scrierea firmware-ului prin USB-C direct din browser și monitorizarea serială a plăcilor fizice ESP32.",
    },
  },
  {
    id: "flipper-official-docs",
    category: "flipper",
    title: {
      en: "Flipper Zero Official Documentation — GPIO, Hardware & Schematics",
      ro: "Documentație Oficială Flipper Zero — GPIO, Hardware & Scheme",
    },
    publisher: "Flipper Devices Inc.",
    url: "https://docs.flipper.net/gpio-and-modules",
    usedFor: {
      en: "STM32WB55RG architecture, CC1101 Sub-GHz, ST25R3916 NFC, 18-pin 3.3V ESD-protected GPIO pinout, Wi-Fi Devboard & Video Game Module RP2040.",
      ro: "Arhitectura STM32WB55RG, radio CC1101, NFC ST25R3916, conectorul GPIO 18 pini 3.3V cu protecție ESD, Wi-Fi Devboard & Video Game Module RP2040.",
    },
  },
  {
    id: "flipper-lab",
    category: "flipper",
    title: {
      en: "Flipper Lab & qFlipper (Web Serial CLI & App Hub)",
      ro: "Flipper Lab & qFlipper (CLI Web Serial & Hub Aplicații)",
    },
    publisher: "Flipper Devices Inc.",
    url: "https://lab.flipper.net/",
    usedFor: {
      en: "Official browser-based Flipper Zero CLI bridge, screen mirror, and microSD app management.",
      ro: "Punte CLI oficială în browser pentru Flipper Zero, oglindire ecran și administrare aplicații pe microSD.",
    },
  },
  {
    id: "reddit-flipper-community",
    category: "community",
    title: {
      en: "r/flipperzero, Rabbit Labs, JCMK Marauder & UberGuidoZ IRDB",
      ro: "Comunitatea r/flipperzero, Rabbit Labs, JCMK Marauder & UberGuidoZ IRDB",
    },
    publisher: "Open Hardware Community",
    url: "https://github.com/UberGuidoZ/Flipper",
    usedFor: {
      en: "Community board consensus, DIY ESP32-S3 UART companion wiring, GhostESP / Marauder workflows, and IR/GPIO libraries.",
      ro: "Consensul comunității pentru plăcile de extensie, cablarea DIY ESP32-S3 UART, fluxurile GhostESP / Marauder și bibliotecile IR/GPIO.",
    },
  },
];

export const ESPRESSIF_SCHEMATIC_CHECKLIST: SchematicChecklistItem[] = [
  {
    id: "chk-power",
    section: { en: "1. Power Supply & Decoupling", ro: "1. Alimentare 3.3V & Decuplare" },
    requirement: {
      en: "Supply 3.0V–3.6V rated ≥ 500 mA (1 A recommended for Wi-Fi TX peaks). Place 10 µF + 0.1 µF decoupling caps right next to VDD3P3 pins.",
      ro: "Alimentare 3.0V–3.6V de minim 500 mA (recomandat 1 A pentru vârfurile Wi-Fi TX). Plasează condensatori 10 µF + 0.1 µF chiar lângă pinii VDD3P3.",
    },
    specValues: "3.3 V · ≥ 500 mA · 10 µF + 0.1 µF",
    commonPitfall: {
      en: "Thin USB cables or weak 250 mA LDOs cause Brownout Detector resets as soon as Wi-Fi initializes.",
      ro: "Cablurile USB subțiri sau regulatoarele slabe (<250 mA) provoacă resetări Brownout imediat la pornirea Wi-Fi.",
    },
    sourceUrl: "https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32/schematic-checklist.html#power-supply",
  },
  {
    id: "chk-reset",
    section: { en: "2. CHIP_PU / EN Reset RC Delay", ro: "2. Întârziere RC pe Reset (CHIP_PU / EN)" },
    requirement: {
      en: "Never leave CHIP_PU (EN) floating. Add a 10 kΩ pull-up resistor to 3.3V and a 1 µF capacitor to GND for reliable power-on reset.",
      ro: "Nu lăsa niciodată pinul CHIP_PU (EN) în aer. Adaugă rezistor pull-up 10 kΩ la 3.3V și condensator 1 µF la GND pentru pornire sigură.",
    },
    specValues: "R = 10 kΩ · C = 1 µF (≥ 50 µs)",
    commonPitfall: {
      en: "Omitting the 1 µF cap causes intermittent boot failures or esptool auto-reset timeouts.",
      ro: "Lipsa condensatorului de 1 µF duce la porniri aleatorii sau eșecuri la auto-reset cu esptool.",
    },
    sourceUrl: "https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32/schematic-checklist.html#chip-power-up-and-reset",
  },
  {
    id: "chk-strapping",
    section: { en: "3. Strapping Pins at Boot", ro: "3. Pini Strapping la Pornire" },
    requirement: {
      en: "Keep GPIO0 HIGH for SPI Boot (LOW = Download Mode). On ESP32-S3, avoid external pull-ups on GPIO45 (VDD_SPI) and GPIO46.",
      ro: "Menține GPIO0 HIGH pentru boot normal (LOW = mod Download). Pe ESP32-S3, evită pull-up extern pe GPIO45 (VDD_SPI) și GPIO46.",
    },
    specValues: "GPIO0 · GPIO3 · GPIO45 · GPIO46",
    commonPitfall: {
      en: "Connecting a low-impedance sensor or LED to GPIO0/GPIO45 traps the chip in bootloader mode or sets Flash voltage to 1.8V.",
      ro: "Conectarea unui senzor sau LED pe GPIO0/GPIO45 blochează cipul în bootloader sau comută tensiunea Flash la 1.8V.",
    },
    sourceUrl: "https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32s3/schematic-checklist.html#strapping-pins",
  },
  {
    id: "chk-octal-psram",
    section: { en: "4. Flash & Octal PSRAM Reservation", ro: "4. Rezervare Flash & Octal PSRAM" },
    requirement: {
      en: "On N16R8 / N8R8 modules (Octal SPI PSRAM), GPIO35, GPIO36, and GPIO37 are internally occupied — do not wire peripherals to them.",
      ro: "Pe modulele N16R8 / N8R8 (Octal SPI PSRAM), pinii GPIO35, GPIO36 și GPIO37 sunt ocupați intern — nu conecta periferice la ei.",
    },
    specValues: "GPIO26–32 (Flash) · GPIO35–37 (Octal PSRAM)",
    commonPitfall: {
      en: "Wiring an OLED or SPI sensor to GPIO35–37 crashes PSRAM heap allocation immediately.",
      ro: "Cablarea unui OLED sau senzor SPI pe GPIO35–37 blochează instant memoria PSRAM.",
    },
    sourceUrl: "https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32s3/schematic-checklist.html#flash-and-psram",
  },
  {
    id: "chk-crystal",
    section: { en: "5. 40 MHz Main Crystal Oscillator", ro: "5. Oscilator Cristal Principal 40 MHz" },
    requirement: {
      en: "Use a 40 MHz crystal with ±10 ppm accuracy and matched load capacitors (C1/C2), surrounded by a continuous ground guard ring.",
      ro: "Folosește cristal de 40 MHz cu toleranță ±10 ppm și condensatori de sarcină egali (C1/C2), protejat de un inel continuu de masă (GND).",
    },
    specValues: "40 MHz · ±10 ppm · GND guard ring",
    commonPitfall: {
      en: "Routing digital traces under the crystal causes Wi-Fi frequency drift and packet loss.",
      ro: "Rutarea traseelor digitale sub cristal cauzează deviație de frecvență Wi-Fi și pierderi de pachete.",
    },
    sourceUrl: "https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32/schematic-checklist.html#clock-source",
  },
  {
    id: "chk-rf",
    section: { en: "6. RF 50 Ω Antenna & Pi-Matching", ro: "6. Antenă RF 50 Ω & Rețea Pi-Matching" },
    requirement: {
      en: "Maintain 50 Ω controlled impedance to the antenna with a CLC Pi-matching network and a full copper keep-out zone beneath PCB antennas.",
      ro: "Menține impedanță controlată de 50 Ω până la antenă printr-o rețea CLC (Pi) și zonă complet liberă de cupru sub antenele PCB.",
    },
    specValues: "Z0 = 50 Ω · CLC Pi Network · Keep-Out",
    commonPitfall: {
      en: "Placing copper ground plane or metal enclosures under the PCB meander antenna kills 2.4 GHz range by 15–20 dB.",
      ro: "Planul de masă sau carcasa metalică sub antena PCB scade semnalul 2.4 GHz cu 15–20 dB.",
    },
    sourceUrl: "https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32/schematic-checklist.html#rf",
  },
  {
    id: "chk-uart-usb",
    section: { en: "7. UART0 & USB-OTG ESD Protection", ro: "7. UART0 & Protecție ESD USB-OTG" },
    requirement: {
      en: "Add a 499 Ω series resistor on U0TXD to damp RF harmonics; place low-capacitance ESD diodes on USB D-/D+ (GPIO19/GPIO20).",
      ro: "Adaugă un rezistor serie de 499 Ω pe U0TXD pentru atenuarea armonicilor RF și diode ESD de capacitate mică pe USB D-/D+ (GPIO19/20).",
    },
    specValues: "U0TXD 499 Ω · USB GPIO19/20 ESD",
    commonPitfall: {
      en: "Forgetting 5.1 kΩ CC1/CC2 pull-downs on USB-C prevents USB-C-to-USB-C laptop ports from powering the board.",
      ro: "Lipsa rezistorilor de 5.1 kΩ pe pinii CC1/CC2 ai USB-C împiedică alimentarea de la laptopuri cu cablu USB-C la USB-C.",
    },
    sourceUrl: "https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32s3/schematic-checklist.html#uart",
  },
  {
    id: "chk-adc-i2c",
    section: { en: "8. ADC1 vs ADC2 & I2C Pull-Ups", ro: "8. ADC1 vs ADC2 & Pull-Up I2C" },
    requirement: {
      en: "Use ADC1 (GPIO1–10 on S3) for battery/sensor reads while Wi-Fi is active; add 4.7 kΩ pull-ups to 3.3V on I2C SDA/SCL lines.",
      ro: "Folosește ADC1 (GPIO1–10 pe S3) pentru citiri analogice cu Wi-Fi activ; adaugă pull-up 4.7 kΩ la 3.3V pe liniile I2C SDA/SCL.",
    },
    specValues: "ADC1 (Wi-Fi safe) · I2C 4.7 kΩ + 0.1 µF filter",
    commonPitfall: {
      en: "ADC2 shares hardware with the Wi-Fi radio and returns errors whenever Wi-Fi is enabled.",
      ro: "ADC2 împarte hardware-ul cu modulul Wi-Fi și returnează erori cât timp Wi-Fi este activ.",
    },
    sourceUrl: "https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32/schematic-checklist.html#adc",
  },
];

export function pickCopy(copy: BilingualCopy, lang: Lang): string {
  return lang === "ro" ? copy.ro : copy.en;
}
