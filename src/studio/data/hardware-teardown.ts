export type TeardownSubsystem =
  | "silicon-rf"
  | "power-ldo"
  | "usb-bridge"
  | "mechanical-screws"
  | "headers-ui"
  | "passives-esd";

export interface LocalizedPair {
  en: string;
  ro: string;
}

export interface ScrewFastenerSpec {
  id: string;
  code: string; // e.g., SCR-01, WSH-01, STD-01, NUT-01, HDR-01
  kind: "screw" | "standoff" | "washer" | "nut" | "header" | "thermal";
  name: LocalizedPair;
  isoStandard: string;
  threadSpec: string; // e.g., "M2.5 × 4 mm"
  pitchMm: number; // e.g., 0.45
  headOrOdMm: string; // e.g., "Ø 4.7 mm × 2.0 mm H"
  driveTool: string; // e.g., "Phillips PH1 / Hex 1.5 mm"
  clearanceDrillMm: string; // e.g., "Ø 2.70 mm (Close) / Ø 2.90 mm (Normal)"
  torqueNm: string; // e.g., "0.28 N·m max"
  material: LocalizedPair;
  qty: number;
  unitCostUsd: number;
  notes: LocalizedPair;
}

export interface MicroSubPart {
  id: string;
  label: LocalizedPair;
  spec: string;
  tolerance: string;
  detail: LocalizedPair;
}

export interface BomComponentItem {
  id: string;
  designator: string; // e.g., U1, U2, J2, SW1, MH1-MH4
  subsystem: TeardownSubsystem;
  name: LocalizedPair;
  mpn: string;
  manufacturer: string;
  packageType: string; // e.g., "QFN-56 (7×7 mm)", "SOT-223", "0402 SMD", "M2.5 DIN 7985"
  qty: number;
  solderOrMount: string; // e.g., "SAC305 Reflow 245°C" or "Torque 0.28 N·m"
  unitCostUsd: number;
  datasheetNote: LocalizedPair;
  subParts: MicroSubPart[];
}

export interface BoardMechanicalProfile {
  pcbThicknessMm: string;
  pcbLayers: number;
  fr4Grade: string;
  copperWeightOz: string;
  surfaceFinish: string;
  solderAlloy: string;
  reflowPeakC: number;
  dimensionalTolMm: string;
  rfKeepoutMm: string;
  headerRowSpanMm: number;
  headerDrillMm: string;
  massGrams: number;
  ldoModel: string;
  ldoMaxCurrentMa: number;
  usbBridgeIc: string;
  crystalSpec: string;
  esdProtectionIc: string;
  thermalRjaCw: number;
  mountingMethod: LocalizedPair;
  mountingHolesSpec: string;
  primaryScrewIso: string;
  primaryScrewPitchMm: number;
  primaryClearanceDrillMm: string;
  recommendedStandoff: string;
  recommendedWasher: string;
  maxTorqueNm: string;
  driverBit: string;
  smdPartCount: number;
}

export interface BoardTeardownRecord {
  boardId: string;
  mechanical: BoardMechanicalProfile;
  fasteners: ScrewFastenerSpec[];
  bom: BomComponentItem[];
}

function makeStandardBreadboardFasteners(
  boardTag: string,
  pinCount: number,
  standoffHeightMm = 8,
): ScrewFastenerSpec[] {
  const pinsPerSide = Math.round(pinCount / 2);
  return [
    {
      id: `${boardTag}-scr-m25`,
      code: "SCR-01",
      kind: "screw",
      name: {
        en: "M2.5 × 4 mm Pan-Head Machine Screw (Enclosure / Carrier Mount)",
        ro: "Șurub Mecanic M2.5 × 4 mm Cap Bombat (Fixare Carcasă / Carrier)",
      },
      isoStandard: "DIN 7985 / ISO 7045",
      threadSpec: "M2.5 × 4.0 mm",
      pitchMm: 0.45,
      headOrOdMm: "Ø 5.0 mm × 2.0 mm H",
      driveTool: "Phillips PH1 (or Torx T8)",
      clearanceDrillMm: "Ø 2.70 mm (Close) / Ø 2.90 mm (Norm)",
      torqueNm: "0.28 N·m max",
      material: {
        en: "A2-70 (304) Stainless Steel · Passivated",
        ro: "Oțel Inoxidabil A2-70 (304) · Pasivizat",
      },
      qty: 4,
      unitCostUsd: 0.04,
      notes: {
        en: "Secures the DevKit carrier bracket or 3D-printed sled onto brass standoffs without stressing the 1.6 mm FR-4 laminate.",
        ro: "Fixează suportul DevKit sau șina 3D pe distanțierele din alamă fără a tensiona placa FR-4 de 1.6 mm.",
      },
    },
    {
      id: `${boardTag}-wsh-m25`,
      code: "WSH-01",
      kind: "washer",
      name: {
        en: "M2.5 Nylon 66 Insulating Flat Washer",
        ro: "Șaibă Izolatoare din Nailon 66 M2.5",
      },
      isoStandard: "DIN 125A (Nylon)",
      threadSpec: "M2.5 (ID 2.7 mm)",
      pitchMm: 0,
      headOrOdMm: "OD 6.0 mm × 0.5 mm T",
      driveTool: "Hand / Tweezers",
      clearanceDrillMm: "ID 2.70 ± 0.10 mm",
      torqueNm: "Seat under screw head",
      material: {
        en: "PA66 Nylon · UL94 V-2 Dielectric",
        ro: "Nailon PA66 · Dielectric UL94 V-2",
      },
      qty: 4,
      unitCostUsd: 0.02,
      notes: {
        en: "Prevents steel screw head from cutting through solder mask and shorting adjacent 3.3V / GND copper pours.",
        ro: "Previne zgârierea măștii de lipire de către capul șurubului și scurtcircuitarea planurilor de cupru 3.3V / GND.",
      },
    },
    {
      id: `${boardTag}-std-m25`,
      code: "STD-01",
      kind: "standoff",
      name: {
        en: `M2.5 × ${standoffHeightMm} mm Female-Female Hex Standoff`,
        ro: `Distanțier Hexagonal M2.5 × ${standoffHeightMm} mm Mamă-Mamă`,
      },
      isoStandard: "DIN 975 / Custom Hex 4.7 mm",
      threadSpec: `M2.5 × ${standoffHeightMm}.0 mm`,
      pitchMm: 0.45,
      headOrOdMm: `Hex 4.7 mm AF × ${standoffHeightMm}.0 mm L`,
      driveTool: "5.0 mm Nut Driver / Wrench",
      clearanceDrillMm: "Thread Depth 3.5 mm/side",
      torqueNm: "0.35 N·m max",
      material: {
        en: "C36000 Free-Machining Brass · Nickel Plated",
        ro: "Alamă C36000 · Placată cu Nichel",
      },
      qty: 4,
      unitCostUsd: 0.14,
      notes: {
        en: "Provides 8 mm underside clearance for 2.54 mm through-hole header pins and Dupont female housings.",
        ro: "Asigură spațiu liber de 8 mm sub placă pentru pinii header de 2.54 mm și conectorii Dupont.",
      },
    },
    {
      id: `${boardTag}-nut-m25`,
      code: "NUT-01",
      kind: "nut",
      name: {
        en: "M2.5 Hex Lock Nut (Baseplate Retention)",
        ro: "Piuliță Hexagonală M2.5 (Fixare Placă de Bază)",
      },
      isoStandard: "DIN 934 / ISO 4032",
      threadSpec: "M2.5 × 0.45 mm",
      pitchMm: 0.45,
      headOrOdMm: "Hex 5.0 mm AF × 2.0 mm H",
      driveTool: "5.0 mm Box Wrench",
      clearanceDrillMm: "Internal M2.5 6H Thread",
      torqueNm: "0.30 N·m",
      material: {
        en: "A2 Stainless Steel",
        ro: "Oțel Inoxidabil A2",
      },
      qty: 4,
      unitCostUsd: 0.03,
      notes: {
        en: "Locks standoffs to acrylic, aluminum, or DIN-rail enclosure baseplates.",
        ro: "Blochează distanțierele pe plăci de bază din acril, aluminiu sau suport șină DIN.",
      },
    },
    {
      id: `${boardTag}-hdr-254`,
      code: "HDR-01",
      kind: "header",
      name: {
        en: `2× ${pinsPerSide}-Pin 2.54 mm Breakaway Male Header Strips`,
        ro: `2× Barete Pini Tată ${pinsPerSide} Pini · Pas 2.54 mm`,
      },
      isoStandard: "IEC 60603 / 0.100 in Pitch",
      threadSpec: "0.64 × 0.64 mm Square Post",
      pitchMm: 2.54,
      headOrOdMm: "6.0 mm Mating / 3.0 mm Tail",
      driveTool: "Wave / Hand Solder 340°C",
      clearanceDrillMm: "PCB PTH Drill Ø 1.00 ± 0.05 mm",
      torqueNm: "Retention 12 N / pin",
      material: {
        en: "Phosphor Bronze · 1 µin Gold Flash + PBT UL94V-0",
        ro: "Bronz Fosforos · Placare Aur + Izolator PBT UL94V-0",
      },
      qty: 2,
      unitCostUsd: 0.18,
      notes: {
        en: "Primary mechanical + electrical interface for breadboards and carrier socket headers.",
        ro: "Interfața mecanică și electrică principală pentru breadboard și socluri mamă.",
      },
    },
  ];
}

function buildDevkitBom(opts: {
  boardTag: string;
  moduleMpn: string;
  moduleName: string;
  socDiePackage: string;
  crystalFreq: string;
  ldoMpn: string;
  ldoPkg: string;
  ldoCurrent: string;
  bridgeMpn: string;
  bridgePkg: string;
  usbPortSpec: string;
  usbCount: number;
  hasRgb: boolean;
  pinCount: number;
  moduleCost: number;
}): BomComponentItem[] {
  const pinsPerSide = Math.round(opts.pinCount / 2);
  const items: BomComponentItem[] = [
    {
      id: `${opts.boardTag}-u1`,
      designator: "U1",
      subsystem: "silicon-rf",
      name: {
        en: `${opts.moduleName} RF & MCU Module`,
        ro: `Modul RF & MCU ${opts.moduleName}`,
      },
      mpn: opts.moduleMpn,
      manufacturer: "Espressif Systems",
      packageType: "Castellated SMD Module (1.27 mm pitch)",
      qty: 1,
      solderOrMount: "SAC305 Reflow 245 °C · IPC-A-610 Class 2",
      unitCostUsd: opts.moduleCost,
      datasheetNote: {
        en: "Factory-shielded RF module integrating SoC die, SPI Flash, 40 MHz crystal, and impedance-matched 50 Ω PCB meander antenna.",
        ro: "Modul RF ecranat din fabrică ce integrează cipul SoC, memoria SPI Flash, cristalul de 40 MHz și antena PCB adaptată la 50 Ω.",
      },
      subParts: [
        {
          id: `${opts.boardTag}-u1-can`,
          label: { en: "EMI/RF Metal Shield Can", ro: "Capac Metalic Ecranare EMI/RF" },
          spec: "0.20 mm CuNiZn Nickel Silver · Laser Etched",
          tolerance: "±0.10 mm Z-height",
          detail: {
            en: "Soldered to 16 perimeter GND pads to suppress harmonic radiation below FCC/CE limits.",
            ro: "Lipit pe 16 pad-uri perimetrale GND pentru suprimarea armonicilor sub limitele FCC/CE.",
          },
        },
        {
          id: `${opts.boardTag}-u1-die`,
          label: { en: "Silicon SoC Package & Thermal Slug", ro: "Capsulă Siliciu SoC & Pad Termic" },
          spec: `${opts.socDiePackage} · 3×3 Thermal Via Array (Ø 0.30 mm)`,
          tolerance: "±0.05 mm coplanarity",
          detail: {
            en: "Exposed bottom EPAD conducts heat into inner Layer-2 solid GND plane; paste coverage target 60–75%.",
            ro: "Pad-ul termic inferior transferă căldura în planul GND de pe Stratul 2; acoperire pastă țintă 60–75%.",
          },
        },
        {
          id: `${opts.boardTag}-u1-xtal`,
          label: { en: "Reference Quartz Crystal", ro: "Cristal Cuarț de Referință" },
          spec: opts.crystalFreq,
          tolerance: "±10 ppm @ 25 °C",
          detail: {
            en: "Drives RF PLL synthesizer; guarded by grounded copper ring and matched load capacitors (12–18 pF).",
            ro: "Comandă sintetizatorul PLL RF; protejat de inel de masă și condensatoare de sarcină adaptate (12–18 pF).",
          },
        },
      ],
    },
    {
      id: `${opts.boardTag}-u2`,
      designator: "U2",
      subsystem: "power-ldo",
      name: {
        en: "3.3V Low-Dropout Linear Voltage Regulator",
        ro: "Regulator Liniar de Tensiune LDO 3.3V",
      },
      mpn: opts.ldoMpn,
      manufacturer: "SG Micro / AMS",
      packageType: opts.ldoPkg,
      qty: 1,
      solderOrMount: "SAC305 Reflow · Copper Heatsink Pour 85 mm²",
      unitCostUsd: 0.22,
      datasheetNote: {
        en: `Steps 5V VBUS down to clean 3.3V ±2% (${opts.ldoCurrent}) with 10 µF + 0.1 µF ceramic decoupling caps.`,
        ro: `Coboară 5V VBUS la 3.3V ±2% curat (${opts.ldoCurrent}) cu condensatoare ceramice de decuplare 10 µF + 0.1 µF.`,
      },
      subParts: [
        {
          id: `${opts.boardTag}-u2-tab`,
          label: { en: "VOUT Thermal Tab & Copper Pour", ro: "Tab Termic VOUT & Plan Cupru" },
          spec: "1 oz Cu poured + 4× Ø 0.3 mm stitched thermal vias",
          tolerance: "Tj max 125 °C",
          detail: {
            en: "At 350 mA Wi-Fi TX burst, dissipates (5.0V - 3.3V) × 0.35A = 0.60 W into the PCB plane.",
            ro: "La un impuls Wi-Fi de 350 mA disipă (5.0V - 3.3V) × 0.35A = 0.60 W în planul PCB.",
          },
        },
        {
          id: `${opts.boardTag}-u2-caps`,
          label: { en: "C1 / C2 Bulk & HF Decoupling", ro: "Condensatoare Decuplare C1 / C2" },
          spec: "22 µF 10V X5R (0805) + 100 nF 16V X7R (0402)",
          tolerance: "±10% capacitance",
          detail: {
            en: "Absorbs 300 mA RF TX current spikes so 3.3V rail never dips below the 2.44V brownout detector.",
            ro: "Absoarbe vârfurile de curent de 300 mA la transmisia RF pentru a evita resetarea brownout sub 2.44V.",
          },
        },
      ],
    },
    {
      id: `${opts.boardTag}-u3`,
      designator: "U3",
      subsystem: "usb-bridge",
      name: {
        en: "USB-to-UART Bridge + Auto-Reset Circuit",
        ro: "Punte USB-la-UART + Circuit Auto-Reset",
      },
      mpn: opts.bridgeMpn,
      manufacturer: "Silicon Labs / WCH",
      packageType: opts.bridgePkg,
      qty: 1,
      solderOrMount: "SAC305 Reflow · 0.50 mm Lead Pitch",
      unitCostUsd: 0.78,
      datasheetNote: {
        en: "Converts USB CDC serial to UART0 (115200–921600 bps) and toggles EN/BOOT via dual NPN auto-flash transistors (Q1/Q2).",
        ro: "Convertește USB CDC în UART0 (115200–921600 bps) și comandă EN/BOOT prin tranzistoarele NPN de auto-programare (Q1/Q2).",
      },
      subParts: [
        {
          id: `${opts.boardTag}-u3-auto`,
          label: { en: "Q1/Q2 S8050 Auto-Bootloader Pair", ro: "Pereche Auto-Bootloader Q1/Q2 S8050" },
          spec: "2× SOT-23 NPN + 2× 10 kΩ (0402) Base Resistors",
          tolerance: "hFE 120–350",
          detail: {
            en: "Translates DTR/RTS handshake from esptool into synchronized CHIP_PU reset + GPIO0/GPIO9 download-mode pulse.",
            ro: "Traduce semnalele DTR/RTS din esptool în secvența sincronizată CHIP_PU + intrare download-mode.",
          },
        },
      ],
    },
    {
      id: `${opts.boardTag}-j-usb`,
      designator: opts.usbCount > 1 ? "J2 / J4" : "J2",
      subsystem: "usb-bridge",
      name: {
        en: opts.usbPortSpec,
        ro: `Conector ${opts.usbPortSpec}`,
      },
      mpn: opts.usbPortSpec.includes("USB-C") ? "USB4105-GF-A (GCT)" : "10118194-0001LF (Amphenol)",
      manufacturer: opts.usbPortSpec.includes("USB-C") ? "GCT" : "Amphenol",
      packageType: opts.usbPortSpec.includes("USB-C")
        ? "16-Pin Mid-Mount SMD + 4× Through-Hole Shell Tabs"
        : "5-Pin Micro-USB B SMD + 4× Shell Tabs",
      qty: opts.usbCount,
      solderOrMount: "Paste-in-Hole Shell Tabs (Ø 0.85×1.90 mm slots)",
      unitCostUsd: 0.28,
      datasheetNote: {
        en: "Rated for 10,000 mating cycles; differential D+/D- routed at 90 Ω ±10% controlled impedance with 5.1 kΩ CC pull-downs.",
        ro: "Evaluat pentru 10.000 cicluri de conectare; liniile diferențiale D+/D- rutate la impedanță controlată 90 Ω ±10% cu rezistoare CC de 5.1 kΩ.",
      },
      subParts: [
        {
          id: `${opts.boardTag}-usb-shell`,
          label: { en: "4× Mechanical Retention Shell Legs", ro: "4× Piciorușe Mecanice Retenție Carcasă" },
          spec: "Plated Slotted Holes 0.85 × 1.90 mm · Full Fillet",
          tolerance: "35 N Shear Resistance",
          detail: {
            en: "Through-hole stainless shell legs absorb cable insertion torque so fine 0.5 mm SMT signal pads never peel.",
            ro: "Piciorușele metalice prin placă absorb cuplul cablului pentru ca pad-urile fine de 0.5 mm să nu se dezlipească.",
          },
        },
        {
          id: `${opts.boardTag}-usb-cc`,
          label: { en: "R1/R2 5.1 kΩ CC1/CC2 Pull-Downs", ro: "Rezistoare R1/R2 5.1 kΩ pe CC1/CC2" },
          spec: "2× 5.1 kΩ ±1% 0402 Thick Film",
          tolerance: "±1% (USB-C PD Spec)",
          detail: {
            en: "Mandatory for USB-C-to-USB-C cables so laptops and chargers supply 5V VBUS properly.",
            ro: "Obligatorii pentru cablurile USB-C la USB-C ca laptopul sau încărcătorul să livreze corect 5V VBUS.",
          },
        },
      ],
    },
    {
      id: `${opts.boardTag}-sw`,
      designator: "SW1 / SW2",
      subsystem: "headers-ui",
      name: {
        en: "Tactile RST (EN) & BOOT Micro-Switches",
        ro: "Micro-Întrerupătoare Tactile RST (EN) & BOOT",
      },
      mpn: "TS-1187A-B-A-B (5.1 × 5.1 × 1.5 mm)",
      manufacturer: "XKB Connectivity",
      packageType: "4-Lead Gull-Wing SMD Tactile Switch",
      qty: 2,
      solderOrMount: "SAC305 Reflow · 160 gf Actuation Force",
      unitCostUsd: 0.06,
      datasheetNote: {
        en: "Paired with 10 kΩ pull-up + 1 µF RC debounce capacitor on CHIP_PU for clean power-on reset timing.",
        ro: "Cuplate cu rezistor pull-up 10 kΩ + condensator RC 1 µF pe CHIP_PU pentru un reset curat la pornire.",
      },
      subParts: [
        {
          id: `${opts.boardTag}-sw-dome`,
          label: { en: "Stainless Snap-Dome Contact", ro: "Dom Elastic Contact Inox" },
          spec: "160 ± 30 gf · 0.25 mm travel · 100k cycles",
          tolerance: "< 100 mΩ contact resistance",
          detail: {
            en: "Momentary SPST normally-open dome pulling EN or BOOT pin to GND when pressed.",
            ro: "Contact momentan normal-deschis care trage pinul EN sau BOOT la GND la apăsare.",
          },
        },
      ],
    },
    {
      id: `${opts.boardTag}-esd`,
      designator: "D1–D4 / R-Pack",
      subsystem: "passives-esd",
      name: {
        en: "ESD TVS Diode Array, Schottky OR-ing & 0402 Passives",
        ro: "Diode Protecție ESD TVS, Schottky & Pasive 0402",
      },
      mpn: "LESD5D5.0CT1G + MBR120VLSFT1G + 0402 Kit",
      manufacturer: "LRC / ON Semiconductor",
      packageType: "SOD-523 / SOD-123 / 0402 SMD",
      qty: 26,
      solderOrMount: "High-Speed Pick-and-Place · SAC305",
      unitCostUsd: 0.34,
      datasheetNote: {
        en: "Clamps ±15 kV air-discharge static shocks on USB D+/D- and blocks reverse current between USB VBUS and 5VIN header.",
        ro: "Limitează descărcările electrostatice ±15 kV pe USB D+/D- și blochează curentul invers între USB VBUS și pinul 5VIN.",
      },
      subParts: [
        {
          id: `${opts.boardTag}-esd-schottky`,
          label: { en: "D1 Reverse-Current Schottky Diode", ro: "Diodă Schottky D1 Anti-Retur" },
          spec: "20V 1A · Vf = 0.34V @ 500 mA (SOD-123)",
          tolerance: "Max 1.0 A continuous",
          detail: {
            en: "Protects host PC USB port when the board is powered externally via the 5V pin header.",
            ro: "Protejează portul USB al PC-ului atunci când placa este alimentată extern pe pinul 5V.",
          },
        },
      ],
    },
    {
      id: `${opts.boardTag}-mech-kit`,
      designator: "J1 / J3 / MH-KIT",
      subsystem: "mechanical-screws",
      name: {
        en: `Pin Headers (${pinsPerSide}×2) + M2.5 Enclosure Standoff & Screw Kit`,
        ro: `Barete Pini (${pinsPerSide}×2) + Kit Distanțiere & Șuruburi M2.5`,
      },
      mpn: "DIN7985-M2.5×4-A2 + STD-M2.5×8-BR + PH2.54",
      manufacturer: "Würth Elektronik / Bossard",
      packageType: "M2.5 × 0.45 mm Metric + 2.54 mm PTH",
      qty: 18,
      solderOrMount: "Mechanical Torque 0.28 N·m + Wave Solder",
      unitCostUsd: 1.12,
      datasheetNote: {
        en: "Complete mechanical retention kit: 4× M2.5×4mm stainless screws, 4× PA66 nylon washers, 4× M2.5×8mm brass standoffs, 4× M2.5 nuts, 2× 2.54 mm gold-flash headers.",
        ro: "Kit complet de fixare mecanică: 4× șuruburi inox M2.5×4mm, 4× șaibe nailon PA66, 4× distanțiere alamă M2.5×8mm, 4× piulițe M2.5, 2× barete 2.54 mm aurite.",
      },
      subParts: [
        {
          id: `${opts.boardTag}-mech-screw`,
          label: { en: "SCR-01: M2.5 × 4 mm Pan-Head Screw", ro: "SCR-01: Șurub M2.5 × 4 mm Cap Bombat" },
          spec: "DIN 7985 · Pitch 0.45 mm · PH1 · A2 Stainless",
          tolerance: "Max 0.28 N·m (Clearance Ø 2.70 mm)",
          detail: {
            en: "Pair with 0.5 mm Nylon washer when clamping carrier boards or 3D-printed DIN brackets.",
            ro: "Se montează cu șaibă de nailon de 0.5 mm la fixarea pe plăci suport sau carcase 3D.",
          },
        },
        {
          id: `${opts.boardTag}-mech-standoff`,
          label: { en: "STD-01: M2.5 × 8 mm Hex Brass Standoff", ro: "STD-01: Distanțier Alamă Hex M2.5 × 8 mm" },
          spec: "Hex 4.7 mm AF · Nickel-Plated C36000 Brass",
          tolerance: "±0.10 mm length · 0.35 N·m",
          detail: {
            en: "Lifts bottom header solder tails safely above metal enclosures or ESD work mats.",
            ro: "Ridică terminalele lipite de pe spatele plăcii în siguranță deasupra carcaselor metalice.",
          },
        },
        {
          id: `${opts.boardTag}-mech-pth`,
          label: { en: "PTH Header Barrels (Ø 1.00 mm Drill)", ro: "Găuri Metalizate PTH Header (Ø 1.00 mm)" },
          spec: `2×${pinsPerSide} Plated Through-Holes · Ø 1.70 mm Annular Pad`,
          tolerance: "±0.05 mm drill · 25 µm Cu barrel",
          detail: {
            en: "Sized for 0.64 mm square male pins with capillary solder wicking across both PCB faces.",
            ro: "Dimensionate pentru pini pătrați de 0.64 mm cu capilaritate de lipire pe ambele fețe ale PCB-ului.",
          },
        },
      ],
    },
  ];

  if (opts.hasRgb) {
    items.splice(5, 0, {
      id: `${opts.boardTag}-led`,
      designator: "U4 / LED1",
      subsystem: "headers-ui",
      name: {
        en: "Addressable RGB LED (WS2812B / SK6812) + Power LED",
        ro: "LED RGB Adresabil (WS2812B / SK6812) + LED Alimentare",
      },
      mpn: "SK6812MINI-E / WS2812B-2020 + 0603 Red",
      manufacturer: "OPSCO / Worldsemi",
      packageType: "3535 / 2020 SMD 4-Pin",
      qty: 2,
      solderOrMount: "Moisture-Sensitive MSL-5a · Reflow ≤ 240 °C",
      unitCostUsd: 0.11,
      datasheetNote: {
        en: "Integrated constant-current RGB driver controlled over single-wire 800 kHz RMT protocol.",
        ro: "Driver RGB integrat cu curent constant, controlat printr-un singur fir RMT la 800 kHz.",
      },
      subParts: [
        {
          id: `${opts.boardTag}-led-lens`,
          label: { en: "Silicone Optical Diffuser & Bond Wires", ro: "Difuzor Optic Silicon & Fire Interne" },
          spec: "120° viewing angle · 12 mA/channel max",
          tolerance: "Bake 12h @ 60°C if exposed >48h",
          detail: {
            en: "Low-profile resin window; avoid ultrasonic cleaning after hand soldering.",
            ro: "Fereastră de rășină low-profile; evită spălarea cu ultrasunete după lipirea manuală.",
          },
        },
      ],
    });
  }

  return items;
}

export const BOARD_TEARDOWNS: Record<string, BoardTeardownRecord> = {
  "esp32-s3-devkitc-1": {
    boardId: "esp32-s3-devkitc-1",
    mechanical: {
      pcbThicknessMm: "1.60 ± 0.16 mm",
      pcbLayers: 4,
      fr4Grade: "FR-4 TG150 (RoHS Lead-Free)",
      copperWeightOz: "1 oz (35 µm) Outer / 0.5 oz Inner",
      surfaceFinish: "ENIG (Electroless Nickel Immersion Gold)",
      solderAlloy: "SAC305 (Sn96.5 / Ag3.0 / Cu0.5)",
      reflowPeakC: 245,
      dimensionalTolMm: "±0.20 mm outline · ±0.05 mm drill",
      rfKeepoutMm: "6.5 × 18.0 mm top copper-free zone",
      headerRowSpanMm: 22.86,
      headerDrillMm: "Ø 1.00 mm (Pad Ø 1.70 mm)",
      massGrams: 11.4,
      ldoModel: "SGM2212-3.3XKC3G (SOT-223)",
      ldoMaxCurrentMa: 800,
      usbBridgeIc: "CP2102N-A02-GQFN28",
      crystalSpec: "40 MHz ±10 ppm (2016 SMD)",
      esdProtectionIc: "LESD5D5.0CT1G (4× TVS)",
      thermalRjaCw: 42,
      mountingMethod: {
        en: "2×22-Pin 2.54 mm Breadboard + M2.5 Carrier Rail Kit",
        ro: "2×22 Pini 2.54 mm Breadboard + Kit Șină Suport M2.5",
      },
      mountingHolesSpec: "Header PTH 44× Ø 1.00 mm + Carrier 4× Ø 2.70 mm (M2.5)",
      primaryScrewIso: "M2.5 × 4 mm (DIN 7985)",
      primaryScrewPitchMm: 0.45,
      primaryClearanceDrillMm: "Ø 2.70 mm (Close) / Ø 2.90 mm (Norm)",
      recommendedStandoff: "M2.5 × 8 mm Hex Brass (4.7 mm AF)",
      recommendedWasher: "M2.5 PA66 Nylon (OD 6.0 × 0.5 mm)",
      maxTorqueNm: "0.28 N·m",
      driverBit: "Phillips PH1 / Hex 5.0 mm Nut",
      smdPartCount: 54,
    },
    fasteners: makeStandardBreadboardFasteners("s3", 44, 8),
    bom: buildDevkitBom({
      boardTag: "s3",
      moduleMpn: "ESP32-S3-WROOM-1-N8R8",
      moduleName: "ESP32-S3-WROOM-1",
      socDiePackage: "ESP32-S3 QFN-56 (7×7 mm)",
      crystalFreq: "40 MHz ±10 ppm · CL 12 pF (2016)",
      ldoMpn: "SGM2212-3.3XKC3G/TR",
      ldoPkg: "SOT-223-3",
      ldoCurrent: "800 mA max",
      bridgeMpn: "CP2102N-A02-GQFN28",
      bridgePkg: "QFN-28 (5×5 mm)",
      usbPortSpec: "Dual USB-C 16-Pin (Native OTG + UART)",
      usbCount: 2,
      hasRgb: true,
      pinCount: 44,
      moduleCost: 3.45,
    }),
  },

  "esp32-c3-devkitm-1": {
    boardId: "esp32-c3-devkitm-1",
    mechanical: {
      pcbThicknessMm: "1.60 ± 0.16 mm",
      pcbLayers: 2,
      fr4Grade: "FR-4 TG140 (RoHS)",
      copperWeightOz: "1 oz (35 µm)",
      surfaceFinish: "Lead-Free HASL / ENIG",
      solderAlloy: "SAC305 (Sn96.5 / Ag3.0 / Cu0.5)",
      reflowPeakC: 245,
      dimensionalTolMm: "±0.20 mm outline · ±0.05 mm drill",
      rfKeepoutMm: "5.2 × 13.2 mm top RF window",
      headerRowSpanMm: 22.86,
      headerDrillMm: "Ø 1.00 mm (Pad Ø 1.65 mm)",
      massGrams: 7.2,
      ldoModel: "AMS1117-3.3 (SOT-223)",
      ldoMaxCurrentMa: 800,
      usbBridgeIc: "CP2102N-A02-GQFN28",
      crystalSpec: "40 MHz ±10 ppm (2016 SMD)",
      esdProtectionIc: "LESD5D5.0CT1G (2× TVS)",
      thermalRjaCw: 51,
      mountingMethod: {
        en: "2×15-Pin 2.54 mm Ultra-Compact + M2.0/M2.5 Clip Sled",
        ro: "2×15 Pini 2.54 mm Ultra-Compact + Suport M2.0/M2.5",
      },
      mountingHolesSpec: "Header PTH 30× Ø 1.00 mm + Carrier 4× Ø 2.70 mm (M2.5)",
      primaryScrewIso: "M2.5 × 4 mm (DIN 7985)",
      primaryScrewPitchMm: 0.45,
      primaryClearanceDrillMm: "Ø 2.70 mm (Close) / Ø 2.90 mm (Norm)",
      recommendedStandoff: "M2.5 × 6 mm Hex Brass (4.7 mm AF)",
      recommendedWasher: "M2.5 PA66 Nylon (OD 6.0 × 0.5 mm)",
      maxTorqueNm: "0.26 N·m",
      driverBit: "Phillips PH1",
      smdPartCount: 38,
    },
    fasteners: makeStandardBreadboardFasteners("c3", 30, 6),
    bom: buildDevkitBom({
      boardTag: "c3",
      moduleMpn: "ESP32-C3-MINI-1-N4",
      moduleName: "ESP32-C3-MINI-1",
      socDiePackage: "ESP32-C3FH4 QFN-32 (5×5 mm)",
      crystalFreq: "40 MHz ±10 ppm · CL 10 pF (2016)",
      ldoMpn: "AMS1117-3.3",
      ldoPkg: "SOT-223-3",
      ldoCurrent: "800 mA max",
      bridgeMpn: "CP2102N-A02-GQFN28",
      bridgePkg: "QFN-28 (5×5 mm)",
      usbPortSpec: "Micro-USB B 5-Pin (UART Bridge)",
      usbCount: 1,
      hasRgb: true,
      pinCount: 30,
      moduleCost: 1.85,
    }),
  },

  "esp32-c6-devkitc-1": {
    boardId: "esp32-c6-devkitc-1",
    mechanical: {
      pcbThicknessMm: "1.60 ± 0.16 mm",
      pcbLayers: 4,
      fr4Grade: "FR-4 TG150 (Low-Loss 2.4 GHz)",
      copperWeightOz: "1 oz (35 µm) Outer / 0.5 oz Inner",
      surfaceFinish: "ENIG Immersion Gold",
      solderAlloy: "SAC305 (Sn96.5 / Ag3.0 / Cu0.5)",
      reflowPeakC: 245,
      dimensionalTolMm: "±0.15 mm outline · ±0.05 mm drill",
      rfKeepoutMm: "6.5 × 18.0 mm top RF keep-out",
      headerRowSpanMm: 22.86,
      headerDrillMm: "Ø 1.00 mm + J5 Current Shunt Jumper",
      massGrams: 10.6,
      ldoModel: "SGM2212-3.3XKC3G (SOT-223)",
      ldoMaxCurrentMa: 800,
      usbBridgeIc: "CP2102N-A02-GQFN28",
      crystalSpec: "40 MHz ±10 ppm + 32.768 kHz LP XTAL",
      esdProtectionIc: "LESD5D5.0CT1G (4× TVS)",
      thermalRjaCw: 44,
      mountingMethod: {
        en: "2×16-Pin 2.54 mm + J5 Ammeter Jumper + M2.5 Sled",
        ro: "2×16 Pini 2.54 mm + Jumper Ampermetru J5 + Suport M2.5",
      },
      mountingHolesSpec: "Header PTH 32× Ø 1.00 mm + 2-Pin J5 Shunt",
      primaryScrewIso: "M2.5 × 4 mm (DIN 7985)",
      primaryScrewPitchMm: 0.45,
      primaryClearanceDrillMm: "Ø 2.70 mm (Close) / Ø 2.90 mm (Norm)",
      recommendedStandoff: "M2.5 × 8 mm Hex Brass",
      recommendedWasher: "M2.5 PA66 Nylon (OD 6.0 × 0.5 mm)",
      maxTorqueNm: "0.28 N·m",
      driverBit: "Phillips PH1",
      smdPartCount: 52,
    },
    fasteners: makeStandardBreadboardFasteners("c6", 32, 8),
    bom: buildDevkitBom({
      boardTag: "c6",
      moduleMpn: "ESP32-C6-WROOM-1-N8",
      moduleName: "ESP32-C6-WROOM-1",
      socDiePackage: "ESP32-C6 QFN-40 (5×5 mm)",
      crystalFreq: "40 MHz ±10 ppm (Wi-Fi 6 / 802.15.4)",
      ldoMpn: "SGM2212-3.3XKC3G/TR",
      ldoPkg: "SOT-223-3",
      ldoCurrent: "800 mA max",
      bridgeMpn: "CP2102N-A02-GQFN28",
      bridgePkg: "QFN-28 (5×5 mm)",
      usbPortSpec: "Dual USB-C 16-Pin (USB-JTAG + UART)",
      usbCount: 2,
      hasRgb: true,
      pinCount: 32,
      moduleCost: 2.95,
    }),
  },

  "esp32-h2-devkitm-1": {
    boardId: "esp32-h2-devkitm-1",
    mechanical: {
      pcbThicknessMm: "1.60 ± 0.16 mm",
      pcbLayers: 4,
      fr4Grade: "FR-4 TG150",
      copperWeightOz: "1 oz (35 µm)",
      surfaceFinish: "ENIG Immersion Gold",
      solderAlloy: "SAC305 (Sn96.5 / Ag3.0 / Cu0.5)",
      reflowPeakC: 245,
      dimensionalTolMm: "±0.15 mm outline · ±0.05 mm drill",
      rfKeepoutMm: "5.2 × 13.2 mm top RF window",
      headerRowSpanMm: 22.86,
      headerDrillMm: "Ø 1.00 mm + J5 Current Shunt",
      massGrams: 8.4,
      ldoModel: "SGM2212-3.3XKC3G (Low Iq)",
      ldoMaxCurrentMa: 800,
      usbBridgeIc: "CP2102N-A02-GQFN28",
      crystalSpec: "32 MHz ±10 ppm (802.15.4 Spec)",
      esdProtectionIc: "LESD5D5.0CT1G (4× TVS)",
      thermalRjaCw: 48,
      mountingMethod: {
        en: "2×15-Pin 2.54 mm + Coin-Cell Enclosure M2.5 Mount",
        ro: "2×15 Pini 2.54 mm + Montaj Carcasă Senzor M2.5",
      },
      mountingHolesSpec: "Header PTH 30× Ø 1.00 mm + J5 Shunt",
      primaryScrewIso: "M2.5 × 4 mm (DIN 7985)",
      primaryScrewPitchMm: 0.45,
      primaryClearanceDrillMm: "Ø 2.70 mm (Close) / Ø 2.90 mm (Norm)",
      recommendedStandoff: "M2.5 × 6 mm Hex Brass",
      recommendedWasher: "M2.5 PA66 Nylon (OD 6.0 × 0.5 mm)",
      maxTorqueNm: "0.26 N·m",
      driverBit: "Phillips PH1",
      smdPartCount: 46,
    },
    fasteners: makeStandardBreadboardFasteners("h2", 30, 6),
    bom: buildDevkitBom({
      boardTag: "h2",
      moduleMpn: "ESP32-H2-MINI-1-N4",
      moduleName: "ESP32-H2-MINI-1",
      socDiePackage: "ESP32-H2FH4 QFN-32 (4×4 mm)",
      crystalFreq: "32 MHz ±10 ppm (IEEE 802.15.4)",
      ldoMpn: "SGM2212-3.3XKC3G/TR",
      ldoPkg: "SOT-223-3",
      ldoCurrent: "800 mA max",
      bridgeMpn: "CP2102N-A02-GQFN28",
      bridgePkg: "QFN-28 (5×5 mm)",
      usbPortSpec: "Dual USB-C 16-Pin (USB-JTAG + UART)",
      usbCount: 2,
      hasRgb: true,
      pinCount: 30,
      moduleCost: 2.35,
    }),
  },

  "esp32-s2-devkitc-1": {
    boardId: "esp32-s2-devkitc-1",
    mechanical: {
      pcbThicknessMm: "1.60 ± 0.16 mm",
      pcbLayers: 4,
      fr4Grade: "FR-4 TG150",
      copperWeightOz: "1 oz (35 µm)",
      surfaceFinish: "ENIG Immersion Gold",
      solderAlloy: "SAC305 (Sn96.5 / Ag3.0 / Cu0.5)",
      reflowPeakC: 245,
      dimensionalTolMm: "±0.20 mm outline · ±0.05 mm drill",
      rfKeepoutMm: "6.5 × 18.0 mm top RF keep-out",
      headerRowSpanMm: 22.86,
      headerDrillMm: "Ø 1.00 mm (Pad Ø 1.70 mm)",
      massGrams: 11.1,
      ldoModel: "AMS1117-3.3 (SOT-223)",
      ldoMaxCurrentMa: 800,
      usbBridgeIc: "CP2102N-A02-GQFN28",
      crystalSpec: "40 MHz ±10 ppm (2016 SMD)",
      esdProtectionIc: "LESD5D5.0CT1G (4× TVS)",
      thermalRjaCw: 43,
      mountingMethod: {
        en: "2×22-Pin 2.54 mm Breadboard + M2.5 Sled",
        ro: "2×22 Pini 2.54 mm Breadboard + Suport M2.5",
      },
      mountingHolesSpec: "Header PTH 44× Ø 1.00 mm + Carrier M2.5",
      primaryScrewIso: "M2.5 × 4 mm (DIN 7985)",
      primaryScrewPitchMm: 0.45,
      primaryClearanceDrillMm: "Ø 2.70 mm (Close) / Ø 2.90 mm (Norm)",
      recommendedStandoff: "M2.5 × 8 mm Hex Brass",
      recommendedWasher: "M2.5 PA66 Nylon (OD 6.0 × 0.5 mm)",
      maxTorqueNm: "0.28 N·m",
      driverBit: "Phillips PH1",
      smdPartCount: 51,
    },
    fasteners: makeStandardBreadboardFasteners("s2", 44, 8),
    bom: buildDevkitBom({
      boardTag: "s2",
      moduleMpn: "ESP32-S2-SOLO-2-N4R2",
      moduleName: "ESP32-S2-SOLO-2",
      socDiePackage: "ESP32-S2 QFN-56 (7×7 mm)",
      crystalFreq: "40 MHz ±10 ppm (2016 SMD)",
      ldoMpn: "AMS1117-3.3",
      ldoPkg: "SOT-223-3",
      ldoCurrent: "800 mA max",
      bridgeMpn: "CP2102N-A02-GQFN28",
      bridgePkg: "QFN-28 (5×5 mm)",
      usbPortSpec: "Dual Micro-USB B (Native OTG + UART)",
      usbCount: 2,
      hasRgb: true,
      pinCount: 44,
      moduleCost: 2.55,
    }),
  },

  "esp32-devkitc-v4": {
    boardId: "esp32-devkitc-v4",
    mechanical: {
      pcbThicknessMm: "1.60 ± 0.16 mm",
      pcbLayers: 2,
      fr4Grade: "FR-4 TG140 (Standard)",
      copperWeightOz: "1 oz (35 µm)",
      surfaceFinish: "Lead-Free HASL",
      solderAlloy: "SAC305 (Sn96.5 / Ag3.0 / Cu0.5)",
      reflowPeakC: 245,
      dimensionalTolMm: "±0.25 mm outline · ±0.08 mm drill",
      rfKeepoutMm: "6.5 × 18.0 mm overhanging antenna",
      headerRowSpanMm: 25.4,
      headerDrillMm: "Ø 1.00 mm (Wide 25.4 mm row span)",
      massGrams: 10.2,
      ldoModel: "AMS1117-3.3 (SOT-223)",
      ldoMaxCurrentMa: 800,
      usbBridgeIc: "CP2102N-A02-GQFN28",
      crystalSpec: "40 MHz ±10 ppm (3225 SMD)",
      esdProtectionIc: "LESD5D5.0CT1G (2× TVS)",
      thermalRjaCw: 46,
      mountingMethod: {
        en: "2×19-Pin Wide 25.4 mm Row Span + M2.5 Breakout Base",
        ro: "2×19 Pini Lățime Mare 25.4 mm + Placă Suport M2.5",
      },
      mountingHolesSpec: "Header PTH 38× Ø 1.00 mm (25.4 mm pitch span)",
      primaryScrewIso: "M2.5 × 5 mm (DIN 7985)",
      primaryScrewPitchMm: 0.45,
      primaryClearanceDrillMm: "Ø 2.70 mm (Close) / Ø 2.90 mm (Norm)",
      recommendedStandoff: "M2.5 × 10 mm Hex Brass",
      recommendedWasher: "M2.5 PA66 Nylon (OD 6.0 × 0.5 mm)",
      maxTorqueNm: "0.28 N·m",
      driverBit: "Phillips PH1",
      smdPartCount: 42,
    },
    fasteners: makeStandardBreadboardFasteners("v4", 38, 10),
    bom: buildDevkitBom({
      boardTag: "v4",
      moduleMpn: "ESP32-WROOM-32E-N4",
      moduleName: "ESP32-WROOM-32E",
      socDiePackage: "ESP32-D0WD-V3 QFN-48 (5×5 mm)",
      crystalFreq: "40 MHz ±10 ppm (3225 SMD)",
      ldoMpn: "AMS1117-3.3",
      ldoPkg: "SOT-223-3",
      ldoCurrent: "800 mA max",
      bridgeMpn: "CP2102N-A02-GQFN28",
      bridgePkg: "QFN-28 (5×5 mm)",
      usbPortSpec: "Micro-USB B 5-Pin (UART Bridge)",
      usbCount: 1,
      hasRgb: false,
      pinCount: 38,
      moduleCost: 2.4,
    }),
  },

  "esp32-c5-devkitc-1": {
    boardId: "esp32-c5-devkitc-1",
    mechanical: {
      pcbThicknessMm: "1.60 ± 0.16 mm",
      pcbLayers: 4,
      fr4Grade: "FR-4 TG170 (5 GHz Impedance Controlled)",
      copperWeightOz: "1 oz (35 µm) Outer / 0.5 oz Inner",
      surfaceFinish: "ENIG Immersion Gold (RF Low-Loss)",
      solderAlloy: "SAC305 (Sn96.5 / Ag3.0 / Cu0.5)",
      reflowPeakC: 245,
      dimensionalTolMm: "±0.15 mm outline · ±0.05 mm drill",
      rfKeepoutMm: "7.5 × 18.0 mm Dual-Band 2.4/5 GHz keep-out",
      headerRowSpanMm: 22.86,
      headerDrillMm: "Ø 1.00 mm (Pad Ø 1.70 mm)",
      massGrams: 11.2,
      ldoModel: "SGM2212-3.3XKC3G (SOT-223)",
      ldoMaxCurrentMa: 800,
      usbBridgeIc: "CP2102N-A02-GQFN28",
      crystalSpec: "48 MHz ±10 ppm (Dual-Band 5 GHz PLL)",
      esdProtectionIc: "LESD5D5.0CT1G (4× TVS)",
      thermalRjaCw: 40,
      mountingMethod: {
        en: "2×18-Pin 2.54 mm + Dual-Band RF Enclosure M2.5 Kit",
        ro: "2×18 Pini 2.54 mm + Kit Carcasă RF Dual-Band M2.5",
      },
      mountingHolesSpec: "Header PTH 36× Ø 1.00 mm + RF Clearance ≥10 mm",
      primaryScrewIso: "M2.5 × 4 mm (DIN 7985)",
      primaryScrewPitchMm: 0.45,
      primaryClearanceDrillMm: "Ø 2.70 mm (Close) / Ø 2.90 mm (Norm)",
      recommendedStandoff: "M2.5 × 8 mm Nylon/Brass (Non-metallic near RF)",
      recommendedWasher: "M2.5 PA66 Nylon (OD 6.0 × 0.5 mm)",
      maxTorqueNm: "0.28 N·m",
      driverBit: "Phillips PH1",
      smdPartCount: 58,
    },
    fasteners: makeStandardBreadboardFasteners("c5", 36, 8),
    bom: buildDevkitBom({
      boardTag: "c5",
      moduleMpn: "ESP32-C5-WROOM-1-N8R4",
      moduleName: "ESP32-C5-WROOM-1",
      socDiePackage: "ESP32-C5 QFN-48 (6×6 mm)",
      crystalFreq: "48 MHz ±10 ppm (5 GHz Wi-Fi 6)",
      ldoMpn: "SGM2212-3.3XKC3G/TR",
      ldoPkg: "SOT-223-3",
      ldoCurrent: "800 mA max",
      bridgeMpn: "CP2102N-A02-GQFN28",
      bridgePkg: "QFN-28 (5×5 mm)",
      usbPortSpec: "Dual USB-C 16-Pin (USB-JTAG + UART)",
      usbCount: 2,
      hasRgb: true,
      pinCount: 36,
      moduleCost: 3.9,
    }),
  },

  "esp32-p4-ev": {
    boardId: "esp32-p4-ev",
    mechanical: {
      pcbThicknessMm: "1.60 ± 0.13 mm",
      pcbLayers: 6,
      fr4Grade: "FR-4 TG170 (MIPI 100 Ω Diff-Pair)",
      copperWeightOz: "1 oz Outer / 0.5 oz ×4 Inner Planes",
      surfaceFinish: "ENIG Immersion Gold (2 µin Au)",
      solderAlloy: "SAC305 (Sn96.5 / Ag3.0 / Cu0.5)",
      reflowPeakC: 248,
      dimensionalTolMm: "±0.10 mm outline · ±0.05 mm M3 mounting",
      rfKeepoutMm: "6.0 × 13.5 mm edge zone (C6-MINI-1)",
      headerRowSpanMm: 2.54,
      headerDrillMm: "4× M3 Plated Mounting Holes (Ø 3.20 mm)",
      massGrams: 54.8,
      ldoModel: "SY8089A Buck (2A) + 1.1V Core DC-DC",
      ldoMaxCurrentMa: 2000,
      usbBridgeIc: "CP2102N + Native HS USB 480 Mbps",
      crystalSpec: "40 MHz ±10 ppm + 50 MHz RMII Ethernet",
      esdProtectionIc: "TPD4E05U06 (MIPI/USB HS 0.5 pF TVS)",
      thermalRjaCw: 24,
      mountingMethod: {
        en: "4× Corner Plated M3.0 Mounting Holes (104 × 72 mm Pitch)",
        ro: "4× Găuri Colț Metalizate M3.0 (Pas 104 × 72 mm)",
      },
      mountingHolesSpec: "4× Ø 3.20 mm NPTH/PTH + Ø 6.00 mm GND Pad + 8× Via Ring",
      primaryScrewIso: "M3.0 × 6 mm (ISO 7380 Button Hex)",
      primaryScrewPitchMm: 0.5,
      primaryClearanceDrillMm: "Ø 3.20 mm (Close) / Ø 3.40 mm (Norm)",
      recommendedStandoff: "M3.0 × 12 mm Hex Brass (5.5 mm AF)",
      recommendedWasher: "M3.0 PA66 Nylon (OD 7.0 × 0.8 mm)",
      maxTorqueNm: "0.55 N·m",
      driverBit: "2.0 mm Hex Allen Key + 5.5 mm Wrench",
      smdPartCount: 168,
    },
    fasteners: [
      {
        id: "p4-scr-m3",
        code: "SCR-01",
        kind: "screw",
        name: {
          en: "M3.0 × 6 mm Button-Head Hex Socket Screw (Corner Mounts)",
          ro: "Șurub M3.0 × 6 mm Cap Bombat Imbus (Prindere Colțuri PCB)",
        },
        isoStandard: "ISO 7380-1 (Class A2-70)",
        threadSpec: "M3.0 × 6.0 mm",
        pitchMm: 0.5,
        headOrOdMm: "Ø 5.7 mm × 1.65 mm H",
        driveTool: "2.0 mm Hex Allen Key",
        clearanceDrillMm: "Ø 3.20 mm (Board Mounted)",
        torqueNm: "0.55 N·m max",
        material: {
          en: "A2-70 Stainless Steel · Low-Profile Dome",
          ro: "Oțel Inoxidabil A2-70 · Cap Joasă Înălțime",
        },
        qty: 4,
        unitCostUsd: 0.06,
        notes: {
          en: "Directly threads through the 4 corner Ø 3.20 mm plated mounting holes (104.0 × 72.0 mm center-to-center pitch).",
          ro: "Se înșurubează direct prin cele 4 găuri metalizate din colțuri Ø 3.20 mm (distanță între centre 104.0 × 72.0 mm).",
        },
      },
      {
        id: "p4-wsh-m3",
        code: "WSH-01",
        kind: "washer",
        name: {
          en: "M3.0 Nylon 66 Insulating Washer (Under Screw Head)",
          ro: "Șaibă Izolatoare Nailon 66 M3.0 (Sub Capul Șurubului)",
        },
        isoStandard: "DIN 125A (PA66)",
        threadSpec: "M3.0 (ID 3.2 mm)",
        pitchMm: 0,
        headOrOdMm: "OD 7.0 mm × 0.8 mm T",
        driveTool: "Hand Assembly",
        clearanceDrillMm: "ID 3.20 ± 0.10 mm",
        torqueNm: "Distributes clamping load",
        material: {
          en: "PA66 Nylon · 110 °C Continuous",
          ro: "Nailon PA66 · 110 °C Continuu",
        },
        qty: 4,
        unitCostUsd: 0.03,
        notes: {
          en: "Protects the 6-layer TG170 solder mask and MIPI-DSI edge traces around the corner mounting bosses.",
          ro: "Protejează masca de lipire cu 6 straturi TG170 și traseele MIPI-DSI din jurul găurilor de colț.",
        },
      },
      {
        id: "p4-std-m3",
        code: "STD-01",
        kind: "standoff",
        name: {
          en: "M3.0 × 12 mm Hex Brass Standoff (EV Bench Feet)",
          ro: "Distanțier Hexagonal Alamă M3.0 × 12 mm (Picioare Banc EV)",
        },
        isoStandard: "M3 × 12 mm Hex 5.5 mm AF",
        threadSpec: "M3.0 × 12.0 mm",
        pitchMm: 0.5,
        headOrOdMm: "Hex 5.5 mm AF × 12.0 mm L",
        driveTool: "5.5 mm Nut Driver",
        clearanceDrillMm: "Thread Depth 5.0 mm/side",
        torqueNm: "0.60 N·m max",
        material: {
          en: "C36000 Nickel-Plated Brass",
          ro: "Alamă C36000 Placată cu Nichel",
        },
        qty: 4,
        unitCostUsd: 0.22,
        notes: {
          en: "Clears underside microSD cage and MIPI-DSI display ribbon routing underneath the 112 × 80 mm EV board.",
          ro: "Oferă spațiu sub placa de 112 × 80 mm pentru slotul microSD și panglica ecranului MIPI-DSI.",
        },
      },
      {
        id: "p4-scr-cam",
        code: "SCR-02",
        kind: "screw",
        name: {
          en: "M2.0 × 5 mm Pan-Head Screw (MIPI-CSI Camera Module Bracket)",
          ro: "Șurub M2.0 × 5 mm Cap Bombat (Suport Cameră MIPI-CSI)",
        },
        isoStandard: "DIN 7985 M2.0",
        threadSpec: "M2.0 × 5.0 mm",
        pitchMm: 0.4,
        headOrOdMm: "Ø 4.0 mm × 1.6 mm H",
        driveTool: "Phillips PH0",
        clearanceDrillMm: "Ø 2.20 mm (Close)",
        torqueNm: "0.16 N·m max",
        material: {
          en: "A2 Stainless Steel",
          ro: "Oțel Inoxidabil A2",
        },
        qty: 4,
        unitCostUsd: 0.04,
        notes: {
          en: "Secures the 2-lane MIPI-CSI OV5647 / SC2336 camera sub-board onto the EV bracket.",
          ro: "Fixează placa camerei MIPI-CSI OV5647 / SC2336 pe suportul plăcii EV.",
        },
      },
      {
        id: "p4-thm-01",
        code: "THM-01",
        kind: "thermal",
        name: {
          en: "10 × 10 × 1.0 mm Silicone Thermal Pad + Finned Aluminum Heatsink",
          ro: "Pad Termic Silicon 10 × 10 × 1.0 mm + Radiator Aluminiu",
        },
        isoStandard: "UL94 V-0 · 3.0 W/m·K",
        threadSpec: "Adhesive / 10×10 mm QFN104",
        pitchMm: 0,
        headOrOdMm: "10.0 × 10.0 × 5.0 mm H",
        driveTool: "Hand Press (15 N · 10 s)",
        clearanceDrillMm: "N/A (Top Die Surface)",
        torqueNm: "N/A",
        material: {
          en: "6063 Black Anodized Aluminum + Silicone Pad",
          ro: "Aluminiu Anodizat Negru 6063 + Pad Siliconic",
        },
        qty: 1,
        unitCostUsd: 0.65,
        notes: {
          en: "Keeps dual-core 400 MHz RISC-V + H.264 encoder below 65 °C during continuous 1080p30 streaming.",
          ro: "Menține procesorul dual-core 400 MHz RISC-V + encoderul H.264 sub 65 °C în streaming 1080p30 continuu.",
        },
      },
    ],
    bom: [
      {
        id: "p4-u1",
        designator: "U1",
        subsystem: "silicon-rf",
        name: {
          en: "ESP32-P4 Dual-Core 400 MHz Multimedia SoC (32 MB PSRAM)",
          ro: "SoC Multimedia ESP32-P4 Dual-Core 400 MHz (32 MB PSRAM)",
        },
        mpn: "ESP32-P4NRW32",
        manufacturer: "Espressif Systems",
        packageType: "QFN-104 Dual-Row (10 × 10 mm)",
        qty: 1,
        solderOrMount: "SAC305 Reflow 248 °C · X-Ray Void Check <15%",
        unitCostUsd: 6.2,
        datasheetNote: {
          en: "Dual 400 MHz RISC-V HP cores + LP core, 768 KB L2 SRAM, 32 MB in-package PSRAM, H.264/JPEG ISP, MIPI-CSI/DSI.",
          ro: "Două nuclee HP RISC-V 400 MHz + nucleu LP, 768 KB SRAM L2, 32 MB PSRAM integrat, ISP H.264/JPEG, MIPI-CSI/DSI.",
        },
        subParts: [
          {
            id: "p4-u1-epad",
            label: { en: "5×5 Thermal Via Matrix (EPAD)", ro: "Matrice 5×5 Vias Termice (EPAD)" },
            spec: "25× Ø 0.25 mm Resin-Plugged & Capped Vias (VIPPO)",
            tolerance: "±0.05 mm flatness",
            detail: {
              en: "Resin-plugged vias prevent solder wicking away from the 10×10 mm QFN-104 center ground slug.",
              ro: "Găurile umplute cu rășină (VIPPO) previn scurgerea pastei de lipit de sub pad-ul central QFN-104.",
            },
          },
          {
            id: "p4-u1-c6",
            label: { en: "U2 Co-Processor: ESP32-C6-MINI-1", ro: "Coprocesor U2: ESP32-C6-MINI-1" },
            spec: "SDIO 2.0 4-bit Hosted Wi-Fi 6 + BLE 5.3 Radio",
            tolerance: "50 Ω RF Keep-Out Edge",
            detail: {
              en: "Supplies wireless connectivity to the radio-less ESP32-P4 over high-speed SDIO.",
              ro: "Oferă Wi-Fi 6 și BLE 5.3 pentru ESP32-P4 printr-o legătură SDIO de mare viteză.",
            },
          },
        ],
      },
      {
        id: "p4-u3",
        designator: "U3 / U4",
        subsystem: "power-ldo",
        name: {
          en: "Dual Synchronous Buck Regulators (3.3V @ 2A + 1.1V Core)",
          ro: "Regulatoare Buck Sincrone Duble (3.3V @ 2A + 1.1V Core)",
        },
        mpn: "SY8089AAAC (SOT-23-5) + 2.2 µH Shielded Inductor",
        manufacturer: "Silergy",
        packageType: "SOT-23-5 + 4020 Shielded Coil",
        qty: 2,
        solderOrMount: "SAC305 Reflow · Short High-di/dt Loops",
        unitCostUsd: 0.72,
        datasheetNote: {
          en: "92% efficiency DC-DC converters feeding SoC core, MIPI display backlight, and RJ45 Ethernet PHY.",
          ro: "Convertoare DC-DC cu eficiență 92% pentru nucleul SoC, ecranul MIPI și interfața Ethernet RJ45.",
        },
        subParts: [
          {
            id: "p4-u3-ind",
            label: { en: "L1/L2 2.2 µH Shielded Power Inductor", ro: "Bobine Putere Ecranate L1/L2 2.2 µH" },
            spec: "Isat 3.2 A · DCR 42 mΩ · 4.0 × 4.0 × 2.0 mm",
            tolerance: "±20% inductance",
            detail: {
              en: "Magnetic ferrite shield suppresses switching EMI near the ES8311 analog audio codec.",
              ro: "Ecranarea magnetică din ferită previne zgomotul de comutație lângă codecul audio ES8311.",
            },
          },
        ],
      },
      {
        id: "p4-j-mipi",
        designator: "J3 / J4 / J5",
        subsystem: "headers-ui",
        name: {
          en: "MIPI-CSI 15-Pin + MIPI-DSI FFC + 100M RJ45 MagJack",
          ro: "Conectori FFC MIPI-CSI/DSI + RJ45 Ethernet 100M",
        },
        mpn: "FH12-15S-1SH + HR911105A (HanRun)",
        manufacturer: "Hirose / HanRun",
        packageType: "1.0 mm FFC ZIF + Through-Hole RJ45",
        qty: 3,
        solderOrMount: "100 Ω Diff-Pair Length-Matched (±0.15 mm)",
        unitCostUsd: 2.35,
        datasheetNote: {
          en: "High-speed differential lanes routed on Layer 3 between dual GND reference planes.",
          ro: "Linii diferențiale de mare viteză rutate pe Stratul 3 între două planuri continue de masă GND.",
        },
        subParts: [
          {
            id: "p4-mipi-latch",
            label: { en: "Flip-Lock FFC Actuator Latch", ro: "Clapetă Blocare Panglică FFC" },
            spec: "1.0 mm pitch · 0.30 mm FFC thickness",
            tolerance: "20 mating cycles max",
            detail: {
              en: "Lift black actuator gently with plastic spudger before inserting camera/LCD ribbon.",
              ro: "Ridică ușor clapeta neagră cu o spatulă din plastic înainte de inserarea panglicii LCD/cameră.",
            },
          },
        ],
      },
      {
        id: "p4-usb",
        designator: "J1 / J2",
        subsystem: "usb-bridge",
        name: {
          en: "USB 2.0 High-Speed (480 Mbps) USB-C OTG + UART Bridge",
          ro: "USB 2.0 High-Speed (480 Mbps) USB-C OTG + Punte UART",
        },
        mpn: "USB4105-GF-A + TPD4E05U06",
        manufacturer: "GCT / Texas Instruments",
        packageType: "16-Pin USB-C + USON-10 Low-Cap TVS",
        qty: 2,
        solderOrMount: "90 Ω Controlled Impedance + 0.5 pF ESD",
        unitCostUsd: 1.15,
        datasheetNote: {
          en: "Ultra-low capacitance 0.5 pF ESD diodes preserve 480 Mbps USB-HS eye diagram integrity.",
          ro: "Diodele ESD de capacitate ultra-redusă 0.5 pF păstrează integritatea semnalului USB-HS la 480 Mbps.",
        },
        subParts: [
          {
            id: "p4-usb-esd",
            label: { en: "U7 TPD4E05U06 High-Speed ESD Array", ro: "Matrice ESD High-Speed U7 TPD4E05U06" },
            spec: "0.5 pF line capacitance · ±15 kV IEC 61000-4-2",
            tolerance: "Flow-through routing",
            detail: {
              en: "Placed within 4 mm of the USB-C receptacle to shunt ESD energy directly to chassis ground.",
              ro: "Plasată la sub 4 mm de conectorul USB-C pentru descărcarea rapidă a impulsurilor ESD la masă.",
            },
          },
        ],
      },
      {
        id: "p4-mh-kit",
        designator: "MH1–MH4 + THM1",
        subsystem: "mechanical-screws",
        name: {
          en: "4× M3.0×6 mm Hex Screws, M3×12 mm Brass Standoffs, Nylon Washers & Heatsink",
          ro: "4× Șuruburi Imbus M3.0×6 mm, Distanțiere Alamă M3×12 mm, Șaibe & Radiator",
        },
        mpn: "ISO7380-M3×6-A2 + STD-M3×12-BR + M2×5-CAM",
        manufacturer: "Bossard / Würth Elektronik",
        packageType: "M3.0 × 0.50 mm + M2.0 × 0.40 mm",
        qty: 17,
        solderOrMount: "Torque 0.55 N·m (M3) / 0.16 N·m (M2 Camera)",
        unitCostUsd: 2.09,
        datasheetNote: {
          en: "Direct PCB corner mounting via 4× Ø 3.20 mm plated holes (104 × 72 mm pitch) plus M2 camera bracket hardware.",
          ro: "Prindere directă în colțurile PCB prin 4× găuri metalizate Ø 3.20 mm (pas 104 × 72 mm) plus șuruburi M2 pentru cameră.",
        },
        subParts: [
          {
            id: "p4-mh-scr",
            label: { en: "SCR-01: M3.0 × 6 mm ISO 7380 Button Hex", ro: "SCR-01: Șurub Imbus M3.0 × 6 mm ISO 7380" },
            spec: "Pitch 0.50 mm · 2.0 mm Allen · A2-70 Stainless",
            tolerance: "0.55 N·m max · Hole Ø 3.20 mm",
            detail: {
              en: "Always place PA66 Nylon washer between button head and copper pad ring.",
              ro: "Așază mereu șaiba de nailon PA66 între capul șurubului și inelul de cupru.",
            },
          },
          {
            id: "p4-mh-std",
            label: { en: "STD-01: M3.0 × 12 mm Hex Brass Standoff", ro: "STD-01: Distanțier Hex Alamă M3.0 × 12 mm" },
            spec: "5.5 mm AF Hex · Nickel-Plated Brass",
            tolerance: "±0.10 mm height",
            detail: {
              en: "Elevates the EV board 12 mm for unobstructed MIPI display ribbon and RJ45 latch access.",
              ro: "Ridică placa EV la 12 mm pentru acces liber la panglica MIPI și clema RJ45.",
            },
          },
          {
            id: "p4-mh-m2",
            label: { en: "SCR-02: M2.0 × 5 mm Camera Screw", ro: "SCR-02: Șurub Cameră M2.0 × 5 mm" },
            spec: "DIN 7985 · Pitch 0.40 mm · PH0 · 0.16 N·m",
            tolerance: "Clearance Ø 2.20 mm",
            detail: {
              en: "Secures the MIPI-CSI camera lens module firmly to avoid motion blur during vision inference.",
              ro: "Fixează ferm modulul camerei MIPI-CSI pentru a preveni vibrațiile în detecția vizuală.",
            },
          },
        ],
      },
    ],
  },
};
