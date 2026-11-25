export type Lang = "en" | "ro";
export type ViewId = "labs" | "pinout" | "chip" | "code" | "kit";
export type TrackId = "intro" | "display" | "wifi" | "ble" | "rfid" | "sound";
export type SimType = "intro" | "display" | "wifi" | "ble" | "rfid" | "sound";

export interface WiringItem {
  from: string;
  to: string;
  signal: string;
  color: string;
}

export interface LabItem {
  id: string;
  code: string;
  track: TrackId;
  simType: SimType;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  title: string;
  summary: string;
  tourId?: string;
  wiring: WiringItem[];
  defaultLogs: string[];
}

export interface PinDef {
  id: string;
  label: string;
  gpio: number | null;
  types: string[];
  adc?: string;
  touch?: string;
  strapping?: string;
  gotcha?: string;
  notes: string;
}

export interface ModulePinAssignment {
  gpio: number;
  role: string;
}

export interface PeripheralModule {
  id: string;
  name: string;
  color: string;
  badge: string;
  pins: ModulePinAssignment[];
}

export interface ChipBlock {
  id: string;
  name: string;
  category: string;
  freq: string;
  accent: string;
  summary: string;
  specs: string[];
  gotcha: string;
  labs: string[];
}

export interface RegisterField {
  bit: number;
  name: string;
  group: string;
  desc: string;
}

export interface RegisterDef {
  id: string;
  address: string;
  desc: string;
  defaultVal: number;
  fields: RegisterField[];
}

export interface MemoryRegion {
  name: string;
  size: string;
  range: string;
  type: string;
  color: string;
  width: string;
  desc: string;
}

export interface PowerMode {
  id: string;
  name: string;
  currentMa: number;
  desc: string;
}

export interface GlossaryEntry {
  title: string;
  category: string;
  desc: string;
  tip: string;
}

export interface TourStep {
  lines: [number, number];
  title: string;
  text: string;
}

export interface CodeTour {
  id: string;
  title: string;
  file: string;
  code: string;
  steps: TourStep[];
}

export interface KitPart {
  id: string;
  name: string;
  category: string;
  voltage: string;
  iface: string;
  pins: string;
  specs: string[];
  labs: string[];
  accent: string;
}
