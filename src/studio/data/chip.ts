import type { ChipBlock, MemoryRegion, PowerMode, RegisterDef } from "../types";

export const CHIP_BLOCKS: ChipBlock[] = [
  {
    id: "cpu",
    name: "Xtensa LX7 Dual-Core",
    category: "Compute",
    freq: "Up to 240 MHz",
    accent: "cyan",
    summary: "32-bit dual-core microprocessor with vector instructions (PIE) for neural networks and DSP acceleration.",
    specs: [
      "2× Xtensa LX7 cores (Core 0 PRO, Core 1 APP)",
      "Single-precision FPU + AI Vector SIMD",
      "600 DMIPS peak throughput",
    ],
    gotcha: "Wi-Fi and BLE tasks default to Core 0; pin timing-critical DSP or UI loops to Core 1.",
    labs: ["I1", "S2", "S6"],
  },
  {
    id: "radio",
    name: "Wi-Fi 4 & BLE 5.0 Radio",
    category: "Wireless",
    freq: "2.4 GHz ISM",
    accent: "violet",
    summary: "Integrated 2.4 GHz RF transceiver supporting 802.11 b/g/n and Bluetooth 5 (LE) with Long Range (Coded PHY).",
    specs: [
      "Wi-Fi HT40 up to 150 Mbps",
      "BLE 5.0 2M PHY & Coded PHY (Long Range)",
      "Up to +20 dBm Wi-Fi / +9 dBm BLE TX",
    ],
    gotcha: "ADC2 channels cannot be sampled while Wi-Fi is active. Always use ADC1 (GPIO1–10) for analog sensors.",
    labs: ["W1", "B1", "B3", "B5"],
  },
  {
    id: "gdma",
    name: "General DMA (GDMA)",
    category: "Data",
    freq: "5 TX / 5 RX Ch",
    accent: "emerald",
    summary: "Shared DMA engine allowing peripherals (SPI, I2S, AES, SHA, ADC) to stream directly to SRAM/PSRAM without CPU copies.",
    specs: [
      "5 independent TX and 5 RX channels",
      "Linked-list descriptor ring buffers",
      "Supports Internal SRAM & Octal PSRAM",
    ],
    gotcha: "DMA buffers must be 4-byte aligned (and cache-line aligned when placed in PSRAM).",
    labs: ["R1", "S1", "S2"],
  },
  {
    id: "spi",
    name: "SPI2 & SPI3 Controllers",
    category: "Bus",
    freq: "Up to 80 MHz",
    accent: "amber",
    summary: "General-purpose full-duplex SPI masters/slaves with IOMUX fast pins and arbitrary GPIO Matrix routing.",
    specs: [
      "SPI0/1 reserved for Flash & PSRAM",
      "SPI2 (FSPI) IOMUX on GPIO10–13",
      "Supports Quad/Octal & DMA bursts",
    ],
    gotcha: "Routing SPI through GPIO Matrix limits reliable clock speed to ~40 MHz vs 80 MHz on native IOMUX pins.",
    labs: ["R1", "R2", "R3"],
  },
  {
    id: "i2c",
    name: "I2C Controllers (×2)",
    category: "Bus",
    freq: "100k / 400k Hz",
    accent: "cyan",
    summary: "Two independent I2C interfaces supporting Master and Slave modes, 7-bit/10-bit addressing, and hardware command FIFOs.",
    specs: [
      "Standard (100 kHz) & Fast Mode (400 kHz)",
      "32-byte TX/RX hardware FIFOs",
      "Any free GPIO via GPIO Matrix",
    ],
    gotcha: "Internal GPIO pull-ups (~45 kΩ) are weak; use external 4.7 kΩ pull-ups for long wires or 400 kHz.",
    labs: ["D1"],
  },
  {
    id: "i2s",
    name: "I2S Audio Engines (×2)",
    category: "Audio",
    freq: "Up to 192 kHz",
    accent: "rose",
    summary: "Dedicated digital audio serial interfaces supporting Philips Standard, PDM, and TDM multi-channel formats.",
    specs: [
      "16 / 24 / 32-bit PCM word lengths",
      "Fractional APLL/PLL clock divider",
      "Zero-jitter GDMA circular streaming",
    ],
    gotcha: "Always mute or zero-fill DMA buffers before stopping I2S to avoid audible speaker pops.",
    labs: ["S1", "S2", "S5", "S8"],
  },
  {
    id: "rmt",
    name: "RMT (Remote Control)",
    category: "Timing",
    freq: "80 MHz Tick",
    accent: "emerald",
    summary: "8-channel pulse-train transceiver ideal for IR remotes and precisely timed protocols like WS2812 RGB LEDs.",
    specs: [
      "4 TX + 4 RX independent channels",
      "12.5 ns timing resolution",
      "Hardware symbol memory (48×32-bit/ch)",
    ],
    gotcha: "WS2812 LEDs expect GRB byte order, not RGB!",
    labs: ["I1"],
  },
  {
    id: "ledc",
    name: "LEDC PWM Controller",
    category: "Timing",
    freq: "8 Channels",
    accent: "amber",
    summary: "Hardware PWM generator with 4 independent timers, up to 14-bit duty resolution, and automatic hardware fading.",
    specs: [
      "8 PWM output channels",
      "Hardware linear fade interrupts",
      "Glitch-free duty updates",
    ],
    gotcha: "Higher PWM frequencies reduce maximum bit resolution (e.g. 40 MHz max at 1-bit, ~5 kHz at 13-bit).",
    labs: ["I1"],
  },
  {
    id: "adc",
    name: "SAR ADC (×2 12-bit)",
    category: "Analog",
    freq: "20 Channels",
    accent: "sky",
    summary: "Two 12-bit Successive Approximation ADCs with factory eFuse calibration curves and DMA continuous sampling.",
    specs: [
      "ADC1: GPIO1–10 (10 ch)",
      "ADC2: GPIO11–20 (10 ch)",
      "Attenuation up to ~3.1V full-scale",
    ],
    gotcha: "Use esp_adc_cal / adc_cali_curve_fitting — raw ADC readings are non-linear near 0V and 3.3V.",
    labs: ["W1"],
  },
  {
    id: "crypto",
    name: "Hardware Crypto Engine",
    category: "Security",
    freq: "AES / SHA / RSA",
    accent: "violet",
    summary: "Dedicated cryptographic accelerators for TLS, Secure Boot v2, Flash Encryption, and HMAC key derivation.",
    specs: [
      "AES-128/256 with GDMA",
      "SHA-1/256/512 & RSA-4096",
      "True Hardware RNG (TRNG)",
    ],
    gotcha: "Hardware RNG requires RF subsystem (Wi-Fi/BLE) or SAR ADC enabled for true physical entropy.",
    labs: ["B6", "R5"],
  },
  {
    id: "ulp",
    name: "ULP RISC-V Coprocessor",
    category: "Low Power",
    freq: "17.5 MHz",
    accent: "emerald",
    summary: "Ultra-Low-Power 32-bit RISC-V core that runs during Deep-Sleep (~7 µA) to poll sensors and wake the main CPUs.",
    specs: [
      "Runs from 16 KB RTC Slow/Fast SRAM",
      "Accesses RTC GPIOs, ADC & I2C",
      "Wakes main LX7 cores on threshold",
    ],
    gotcha: "Only GPIO0–21 are RTC-capable and accessible by the ULP coprocessor during Deep-Sleep.",
    labs: ["B7"],
  },
];

export const REGISTERS: RegisterDef[] = [
  {
    id: "GPIO_OUT_REG",
    address: "0x60004004",
    desc: "Direct output level register for GPIO0–GPIO31. Writing 1 drives the pin HIGH (if enabled in GPIO_ENABLE_REG).",
    defaultVal: 0x00000110,
    fields: Array.from({ length: 32 }, (_, i) => ({
      bit: i,
      name: `GPIO${i}`,
      group: i === 0 ? "STRAP" : i >= 8 && i <= 13 ? "BUS" : "GPIO",
      desc: `Output level for GPIO${i} (0 = LOW, 1 = HIGH).`,
    })),
  },
  {
    id: "GPIO_ENABLE_REG",
    address: "0x60004020",
    desc: "Output driver enable register for GPIO0–GPIO31. Setting bit N to 1 configures GPION as an output.",
    defaultVal: 0x00001f70,
    fields: Array.from({ length: 32 }, (_, i) => ({
      bit: i,
      name: `OE${i}`,
      group: "OE",
      desc: `Output Enable for GPIO${i} (0 = Input/Hi-Z, 1 = Output Driver Active).`,
    })),
  },
  {
    id: "LEDC_CH0_CONF0_REG",
    address: "0x60019000",
    desc: "Configuration register 0 for LEDC PWM Channel 0 (timer binding, output enable, idle level, overflow counter).",
    defaultVal: 0x00000005,
    fields: Array.from({ length: 32 }, (_, i) => {
      if (i <= 1) return { bit: i, name: `TMR${i}`, group: "TIMER_SEL", desc: "TIMER_SEL[1:0]: Selects PWM timer (0–3) for Channel 0." };
      if (i === 2) return { bit: i, name: "OUT_EN", group: "CTRL", desc: "SIG_OUT_EN: Enables PWM signal output on Channel 0." };
      if (i === 3) return { bit: i, name: "IDLE", group: "CTRL", desc: "IDLE_LV: Output level when PWM is disabled (0 = LOW, 1 = HIGH)." };
      if (i === 4) return { bit: i, name: "UP", group: "CTRL", desc: "PARA_UP: Write 1 to latch updated duty/timer config." };
      if (i >= 5 && i <= 14) return { bit: i, name: `OVF${i - 5}`, group: "OVF_NUM", desc: "OVF_NUM[9:0]: Number of timer overflows before interrupt." };
      if (i === 15) return { bit: i, name: "OVF_EN", group: "CTRL", desc: "OVF_CNT_EN: Enable overflow counter interrupt." };
      if (i === 16) return { bit: i, name: "OVF_RST", group: "CTRL", desc: "OVF_CNT_RESET: Reset overflow counter." };
      return { bit: i, name: "RES", group: "RESERVED", desc: "Reserved bit (keep 0)." };
    }),
  },
];

export const MEMORY_REGIONS: MemoryRegion[] = [
  {
    name: "Internal ROM",
    size: "384 KB",
    range: "0x4000_0000 – 0x4005_FFFF",
    type: "Read-Only",
    color: "bg-slate-500",
    width: "14%",
    desc: "Immutable 1st-stage bootloader, USB-CDC/JTAG ROM drivers, and standard math/crypto routines.",
  },
  {
    name: "Internal SRAM",
    size: "512 KB",
    range: "0x3FC8_8000 – 0x3FCE_FFFF",
    type: "IRAM / DRAM",
    color: "bg-cyan-500",
    width: "24%",
    desc: "Fast single-cycle memory split between Instruction RAM (IRAM), Data RAM (DRAM), and DMA buffers.",
  },
  {
    name: "RTC Fast & Slow SRAM",
    size: "16 KB",
    range: "0x600F_E000 – 0x600F_FFFF",
    type: "Retention",
    color: "bg-emerald-500",
    width: "10%",
    desc: "Retained during Deep-Sleep. Holds ULP RISC-V code and RTC_DATA_ATTR variables.",
  },
  {
    name: "External Octal PSRAM",
    size: "8 MB",
    range: "0x3C00_0000 – 0x3DFF_FFFF",
    type: "Cached XIP",
    color: "bg-violet-500",
    width: "24%",
    desc: "High-capacity external RAM mapped via 32 KB/64 KB L1 Cache. Ideal for framebuffers & audio samples.",
  },
  {
    name: "External QSPI Flash",
    size: "16 MB",
    range: "0x4200_0000 – 0x42FF_FFFF",
    type: "Non-Volatile",
    color: "bg-amber-500",
    width: "28%",
    desc: "Stores application firmware (XIP), NVS key-value storage, SPIFFS/LittleFS, and OTA partitions.",
  },
];

export const POWER_MODES: PowerMode[] = [
  { id: "active", name: "Active (Wi-Fi / BLE TX)", currentMa: 95, desc: "Dual-core 240 MHz + RF transceiver active" },
  { id: "modem", name: "Modem-Sleep", currentMa: 25, desc: "CPU active, Wi-Fi/BLE radio powered down between beacons" },
  { id: "light", name: "Light-Sleep", currentMa: 0.24, desc: "240 µA — CPU paused, SRAM & GPIO state retained" },
  { id: "deep", name: "Deep-Sleep (ULP)", currentMa: 0.007, desc: "7 µA — Only RTC & ULP RISC-V powered" },
];

export const POWER_PRESETS = [
  { label: "ULP Weather Node", batteryMah: 1200, sleepModeId: "deep", dutyCycle: 0.5 },
  { label: "BLE Beacon", batteryMah: 600, sleepModeId: "light", dutyCycle: 2 },
  { label: "Wi-Fi Sensor", batteryMah: 2000, sleepModeId: "modem", dutyCycle: 15 },
  { label: "Always-On Audio", batteryMah: 2500, sleepModeId: "active", dutyCycle: 100 },
] as const;
