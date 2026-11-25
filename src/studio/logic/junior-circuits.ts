import type { Lang } from "../types";

export type JuniorLessonId =
  | "table-lamp"
  | "mood-lamp"
  | "fill-ring"
  | "mini-piano"
  | "siren"
  | "wifi-switch"
  | "robot-gate"
  | "smart-fan";

export interface LocalizedText {
  en: string;
  ro: string;
}

export interface JuniorCallout {
  id: string;
  label: LocalizedText;
  pin?: string;
  detail: LocalizedText;
}

export interface JuniorPinoutRow {
  pin: string;
  component: LocalizedText;
  role: LocalizedText;
  wireColor: string;
}

export interface JuniorSpecRow {
  label: LocalizedText;
  value: string;
}

export interface JuniorLesson {
  id: JuniorLessonId;
  number: string;
  hashSlug: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  shortTag: LocalizedText;
  overview: LocalizedText;
  tryHint: LocalizedText;
  howItWorks: LocalizedText[];
  callouts: JuniorCallout[];
  pinout: JuniorPinoutRow[];
  exampleUse: LocalizedText;
  specs: JuniorSpecRow[];
  defaultCode: string;
  accentHex: string;
}

export interface Point2D {
  x: number;
  z: number;
}

export interface LdrReading {
  distance: number;
  coverage01: number; // 0 = bright open, 1 = fully covered by cap
  adc: number; // 0..4095 (12-bit ESP32 ADC)
  voltageV: number; // 0..3.30 V
  lux: number; // approximate illuminance
  lampOn: boolean;
}

export interface ParsedJuniorCodeParams {
  threshold: number;
  moodColorHex: string;
  breatheMs: number;
  maxRingLeds: number;
  ringMode: 0 | 1 | 2;
  pianoTempoMs: number;
  sirenBaseFreq: number;
  sirenSweepHz: number;
  sirenStepMs: number;
  wifiHost: string;
  gateTriggerCm: number;
  gateOpenAngle: number;
  fanOnTempC: number;
  fanTurboTempC: number;
}

export const LDR_SENSOR_POS: Point2D = { x: -0.95, z: 0.72 };
export const CAP_OPEN_POS: Point2D = { x: -2.45, z: 1.55 };
export const CAP_COVERED_POS: Point2D = { x: LDR_SENSOR_POS.x, z: LDR_SENSOR_POS.z };

export const PIANO_NOTES = [
  { index: 0, note: "C4", labelRo: "Do", freq: 261.63, color: "#f43f5e", pin: "GPIO 12" },
  { index: 1, note: "E4", labelRo: "Mi", freq: 329.63, color: "#f59e0b", pin: "GPIO 13" },
  { index: 2, note: "G4", labelRo: "Sol", freq: 392.0, color: "#10b981", pin: "GPIO 14" },
  { index: 3, note: "C5", labelRo: "Do+", freq: 523.25, color: "#0ea5e9", pin: "GPIO 27" },
] as const;

export const MOOD_PALETTE = [
  { id: "amber", hex: "#ff9f43", label: { en: "Warm Sunset", ro: "Apus Cald" } },
  { id: "cyan", hex: "#22d3ee", label: { en: "Ocean Glow", ro: "Lumină Ocean" } },
  { id: "violet", hex: "#a78bfa", label: { en: "Nebula", ro: "Nebuloasă" } },
  { id: "emerald", hex: "#34d399", label: { en: "Forest Mint", ro: "Pădure Mentă" } },
  { id: "rose", hex: "#fb7185", label: { en: "Coral Blush", ro: "Coral Cald" } },
] as const;

export const JUNIOR_LESSONS: JuniorLesson[] = [
  {
    id: "table-lamp",
    number: "01",
    hashSlug: "light",
    title: { en: "Table Lamp", ro: "Lampă de Birou" },
    subtitle: {
      en: "Light up automatically in the dark using an LDR photoresistor",
      ro: "Aprinde lampa automat la întuneric cu un senzor foto-rezistiv LDR",
    },
    shortTag: { en: "ADC Light Sensor", ro: "Senzor Lumină ADC" },
    overview: {
      en: "A photoresistor (LDR) changes its electrical resistance based on how much light hits its wavy orange surface. Drag the black Cap directly over the Light Sensor on the 3D desk — when the ESP32 reads an ADC value below THRESHOLD, GPIO 26 automatically switches the Table Lamp on!",
      ro: "Un fotorezistor (LDR) își schimbă rezistența electrică în funcție de câtă lumină cade pe suprafața lui portocalie. Trage capacul negru direct peste Senzorul de Lumină de pe bancul 3D — când ESP32 citește o valoare ADC sub pragul THRESHOLD, GPIO 26 aprinde automat Lampa de Birou!",
    },
    tryHint: {
      en: "Drag the black Cap over the Light Sensor (or slide the cover bar), then edit THRESHOLD in the code and press Run.",
      ro: "Trage capacul negru peste Senzorul de Lumină (sau folosește sliderul), apoi modifică THRESHOLD în cod și apasă Rulează.",
    },
    howItWorks: [
      {
        en: "Bright room → LDR resistance drops (~1 kΩ) → GPIO 34 voltage rises near 2.9V (ADC ~3600) → Lamp stays OFF.",
        ro: "Lumină în cameră → rezistența LDR scade (~1 kΩ) → tensiunea pe GPIO 34 crește spre 2.9V (ADC ~3600) → Lampa stă STINSĂ.",
      },
      {
        en: "Cap covers sensor → LDR resistance jumps (>50 kΩ) → voltage drops near 0.2V (ADC ~210) → Lamp turns ON!",
        ro: "Capacul acoperă senzorul → rezistența LDR crește (>50 kΩ) → tensiunea scade spre 0.2V (ADC ~210) → Lampa se APRINDE!",
      },
    ],
    callouts: [
      {
        id: "cap",
        label: { en: "The Cap", ro: "Capacul" },
        detail: {
          en: "Interactive light blocker — drag it in 3D right on top of the LDR Light Sensor to simulate nightfall.",
          ro: "Blocator interactiv de lumină — trage-l în 3D chiar peste Senzorul de Lumină pentru a simula lăsarea întunericului.",
        },
      },
      {
        id: "ldr",
        label: { en: "Light Sensor (LDR)", ro: "Senzor Lumină (LDR)" },
        pin: "GPIO 34",
        detail: {
          en: "Cadmium-sulfide photoresistor wired in a voltage divider with a 10 kΩ resistor into 12-bit ADC1_CH6.",
          ro: "Fotorezistor conectat într-un divizor de tensiune cu un rezistor de 10 kΩ la intrarea analogică ADC1_CH6 pe 12 biți.",
        },
      },
      {
        id: "lamp",
        label: { en: "Table Lamp", ro: "Lampă de Birou" },
        pin: "GPIO 26",
        detail: {
          en: "Warm linen desk lamp driven through a 220 Ω current-limiting resistor (or MOSFET/relay for mains bulbs).",
          ro: "Lampă de birou cu lumină caldă comandată prin rezistor de 220 Ω (sau MOSFET/releu pentru becuri de putere).",
        },
      },
      {
        id: "esp32",
        label: { en: "ESP32 Brain", ro: "Creierul ESP32" },
        pin: "3.3V · 12-bit ADC",
        detail: {
          en: "Samples GPIO 34 continuously at 12-bit resolution (0–4095) and compares it against your THRESHOLD constant.",
          ro: "Citește continuu pinul GPIO 34 cu rezoluție de 12 biți (0–4095) și compară rezultatul cu pragul tău THRESHOLD.",
        },
      },
    ],
    pinout: [
      { pin: "3V3", component: { en: "LDR Top Leg", ro: "Picioruș LDR +" }, role: { en: "3.3V Sensor Supply", ro: "Alimentare senzor 3.3V" }, wireColor: "#ef4444" },
      { pin: "GPIO 34", component: { en: "LDR + 10 kΩ Junction", ro: "Nod LDR + 10 kΩ" }, role: { en: "12-bit Analog Input (ADC1)", ro: "Intrare Analogică 12 biți (ADC1)" }, wireColor: "#f59e0b" },
      { pin: "GPIO 26", component: { en: "Table Lamp (+ 220 Ω)", ro: "Lampă Birou (+ 220 Ω)" }, role: { en: "Digital Output HIGH/LOW", ro: "Ieșire Digitală HIGH/LOW" }, wireColor: "#3b82f6" },
      { pin: "GND", component: { en: "10 kΩ + Lamp Cathode", ro: "10 kΩ + Masă Lampă" }, role: { en: "Common Ground (0V)", ro: "Masă Comună (0V)" }, wireColor: "#1e293b" },
    ],
    exampleUse: {
      en: "Used in automatic street lamps, smart garden lights, hallway night-lights, and smartphone screen auto-brightness.",
      ro: "Folosit în lămpi stradale automate, lumini solare de grădină, veioze de noapte și ajustarea automată a ecranului la telefon.",
    },
    specs: [
      { label: { en: "ADC Resolution", ro: "Rezoluție ADC" }, value: "12-bit (0 – 4095)" },
      { label: { en: "LDR Bright / Dark", ro: "LDR Lumină / Întuneric" }, value: "~1 kΩ / >50 kΩ" },
      { label: { en: "Divider Resistor", ro: "Rezistor Divizor" }, value: "10 kΩ (Brown-Black-Orange)" },
      { label: { en: "Lamp Protection", ro: "Protecție Lampă" }, value: "220 Ω (Red-Red-Brown)" },
    ],
    defaultCode: `// 01. Table Lamp — Light Up in the Dark
const int LDR_PIN   = 34;   // 12-bit ADC input
const int LAMP_PIN  = 26;   // Table lamp output
const int THRESHOLD = 1800; // Try 900 or 2800!

void setup() {
  pinMode(LAMP_PIN, OUTPUT);
  Serial.begin(115200);
}

void loop() {
  int light = analogRead(LDR_PIN);
  bool dark = (light < THRESHOLD);
  digitalWrite(LAMP_PIN, dark ? HIGH : LOW);
  delay(120);
}`,
    accentHex: "#f59e0b",
  },
  {
    id: "mood-lamp",
    number: "02",
    hashSlug: "mood",
    title: { en: "Mood Lamp", ro: "Lampă de Atmosferă" },
    subtitle: {
      en: "Mix 16 million RGB colors inside a glowing frosted glass orb",
      ro: "Combină 16 milioane de culori RGB într-un glob de sticlă mată",
    },
    shortTag: { en: "RGB PWM Mixing", ro: "Mixare RGB PWM" },
    overview: {
      en: "By pulsing Red, Green, and Blue LED channels hundreds of times per second (PWM), your eyes blend them into any cozy ambient glow. Click the frosted 3D Mood Lamp to cycle colors or type any hex color into COLOR_HEX and press Run!",
      ro: "Pulsând canalele Roșu, Verde și Albastru de sute de ori pe secundă (PWM), ochii tăi le combină în orice culoare caldă. Apasă pe globul 3D sau schimbă codul hex COLOR_HEX în editor și apasă Rulează!",
    },
    tryHint: {
      en: "Click the frosted 3D glass orb or edit COLOR_HEX (e.g. #22d3ee or #a78bfa) and press Run.",
      ro: "Apasă pe globul de sticlă 3D sau modifică COLOR_HEX (ex. #22d3ee sau #a78bfa) și apasă Rulează.",
    },
    howItWorks: [
      {
        en: "Each color channel receives a 0–255 duty cycle from ESP32's hardware LEDC PWM timer.",
        ro: "Fiecare canal primește un factor de umplere 0–255 de la timerul hardware LEDC PWM al ESP32.",
      },
      {
        en: "Frosted glass scatters the three tiny LED dots evenly so the whole orb glows smoothly.",
        ro: "Sticla mată difuzează uniform cele trei LED-uri mici, făcând tot globul să lumineze omogen.",
      },
    ],
    callouts: [
      {
        id: "orb",
        label: { en: "Frosted Orb Lamp", ro: "Glob Luminos RGB" },
        pin: "GPIO 12 / 13 / 14",
        detail: {
          en: "Click directly on the 3D frosted glass dome to cycle cozy room palettes.",
          ro: "Apasă direct pe globul de sticlă mată 3D pentru a schimba paletele de lumină.",
        },
      },
      {
        id: "resistors",
        label: { en: "3× 220 Ω Resistors", ro: "3× Rezistoare 220 Ω" },
        pin: "R · G · B",
        detail: {
          en: "Protects each RGB channel so current stays safely around 10–15 mA.",
          ro: "Protejează fiecare canal RGB pentru a menține curentul în siguranță la 10–15 mA.",
        },
      },
    ],
    pinout: [
      { pin: "GPIO 12", component: { en: "Red Channel (+220 Ω)", ro: "Canal Roșu (+220 Ω)" }, role: { en: "LEDC PWM Ch0", ro: "PWM LEDC Canal 0" }, wireColor: "#ef4444" },
      { pin: "GPIO 13", component: { en: "Green Channel (+220 Ω)", ro: "Canal Verde (+220 Ω)" }, role: { en: "LEDC PWM Ch1", ro: "PWM LEDC Canal 1" }, wireColor: "#10b981" },
      { pin: "GPIO 14", component: { en: "Blue Channel (+220 Ω)", ro: "Canal Albastru (+220 Ω)" }, role: { en: "LEDC PWM Ch2", ro: "PWM LEDC Canal 2" }, wireColor: "#3b82f6" },
      { pin: "GND", component: { en: "RGB Common Cathode", ro: "Catod Comun RGB" }, role: { en: "0V Return", ro: "Masă 0V" }, wireColor: "#1e293b" },
    ],
    exampleUse: {
      en: "Powers bedside wake-up sunrise lamps, desk bias lighting, and smart ambient bulbs like Philips Hue.",
      ro: "Stă la baza lămpilor de trezire cu răsărit, luminilor ambientale de birou și becurilor smart RGB.",
    },
    specs: [
      { label: { en: "PWM Frequency", ro: "Frecvență PWM" }, value: "5 kHz (Flicker-free)" },
      { label: { en: "Color Depth", ro: "Adâncime Culoare" }, value: "24-bit (16.7M colors)" },
      { label: { en: "Current / Channel", ro: "Curent / Canal" }, value: "~12 mA @ 3.3V" },
    ],
    defaultCode: `// 02. Mood Lamp — Cozy RGB Breathing Orb
const char* COLOR_HEX = "#ff9f43"; // Try #22d3ee or #a78bfa
const int BREATHE_MS  = 1800;      // Breathing cycle speed

void setup() {
  rgbInit(12, 13, 14);
}

void loop() {
  rgbBreatheHex(COLOR_HEX, BREATHE_MS);
}`,
    accentHex: "#f97316",
  },
  {
    id: "fill-ring",
    number: "03",
    hashSlug: "ring",
    title: { en: "Fill a Ring", ro: "Inel NeoPixel 12 LED" },
    subtitle: {
      en: "Twist a potentiometer dial to light up 12 WS2812B smart LEDs",
      ro: "Rotește potențiometrul pentru a aprinde 12 LED-uri inteligente WS2812B",
    },
    shortTag: { en: "Potentiometer + NeoPixel", ro: "Potențiometru + NeoPixel" },
    overview: {
      en: "A potentiometer outputs a smooth analog voltage from 0V to 3.3V as you turn its dial. The ESP32 maps that 0–4095 reading onto a 12-LED NeoPixel ring using just ONE data wire!",
      ro: "Un potențiometru trimite o tensiune analogică lină între 0V și 3.3V pe măsură ce rotești butonul. ESP32 mapează citirea 0–4095 pe un inel cu 12 LED-uri NeoPixel folosind un SINGUR fir de date!",
    },
    tryHint: {
      en: "Click the 3D knob on the breadboard (or drag the Dial slider) to fill the ring. Edit MODE (0=Cyan, 1=Rainbow, 2=Amber) and press Run!",
      ro: "Apasă pe butonul rotativ 3D (sau mișcă sliderul) pentru a umple inelul. Modifică MODE (0=Cyan, 1=Curcubeu, 2=Chihlimbar) și apasă Rulează!",
    },
    howItWorks: [
      {
        en: "map(analogRead(34), 0, 4095, 0, MAX_LEDS) converts dial angle into an exact LED count.",
        ro: "map(analogRead(34), 0, 4095, 0, MAX_LEDS) transformă unghiul butonului în numărul exact de LED-uri aprinse.",
      },
      {
        en: "Each WS2812B LED takes 24 bits of color data and passes the remaining bits down the ring.",
        ro: "Fiecare LED WS2812B preia 24 de biți de culoare și transmite restul datelor mai departe în inel.",
      },
    ],
    callouts: [
      {
        id: "ring",
        label: { en: "12-LED NeoPixel Ring", ro: "Inel 12 LED NeoPixel" },
        pin: "GPIO 18 (DIN)",
        detail: {
          en: "Daisy-chained WS2812B smart RGB LEDs controlled over a single 800 kHz data wire.",
          ro: "LED-uri RGB inteligente WS2812B înseriate și controlate printr-un singur fir de date la 800 kHz.",
        },
      },
      {
        id: "pot",
        label: { en: "10 kΩ Rotary Knob", ro: "Potențiometru 10 kΩ" },
        pin: "GPIO 34 (ADC)",
        detail: {
          en: "Click the 3D knob to step the dial or drag the smooth dial control to sweep 0–4095.",
          ro: "Apasă butonul 3D sau trage sliderul pentru a varia lin tensiunea 0–3.3V (0–4095).",
        },
      },
    ],
    pinout: [
      { pin: "GPIO 34", component: { en: "Potentiometer Wiper (Mid)", ro: "Cursor Potențiometru (Mijloc)" }, role: { en: "Analog Voltage 0–3.3V", ro: "Tensiune Analogică 0–3.3V" }, wireColor: "#f59e0b" },
      { pin: "GPIO 18", component: { en: "NeoPixel Ring DIN", ro: "Intrare Date Inel DIN" }, role: { en: "800 kHz RMT Data", ro: "Date RMT 800 kHz" }, wireColor: "#10b981" },
      { pin: "5V / 3V3", component: { en: "Ring VCC + Pot End", ro: "Alimentare Inel + Pot" }, role: { en: "Power Rail", ro: "Linie Alimentare" }, wireColor: "#ef4444" },
      { pin: "GND", component: { en: "Ring GND + Pot End", ro: "Masă Inel + Pot" }, role: { en: "Common Ground", ro: "Masă Comună" }, wireColor: "#1e293b" },
    ],
    exampleUse: {
      en: "Seen in smart speaker volume rings, audio VU meters, kitchen timers, and robot battery gauges.",
      ro: "Întâlnit la inelele de volum ale boxelor smart, VU-metre audio, cronometre și indicatori de baterie.",
    },
    specs: [
      { label: { en: "LED Protocol", ro: "Protocol LED" }, value: "WS2812B · 800 kHz" },
      { label: { en: "Ring Size", ro: "Număr LED-uri" }, value: "12 Addressable Pixels" },
      { label: { en: "Potentiometer", ro: "Potențiometru" }, value: "10 kΩ Linear Taper" },
    ],
    defaultCode: `// 03. Fill a Ring — Dial to NeoPixel Bar
const int POT_PIN  = 34;
const int RING_PIN = 18;
const int MAX_LEDS = 12; // 1..12
const int MODE     = 1;  // 0=Cyan, 1=Rainbow, 2=Amber

void loop() {
  int raw = analogRead(POT_PIN);
  int lit = map(raw, 0, 4095, 0, MAX_LEDS);
  ringShow(lit, MODE);
}`,
    accentHex: "#10b981",
  },
  {
    id: "mini-piano",
    number: "04",
    hashSlug: "piano",
    title: { en: "Mini Piano", ro: "Mini Pian Electronic" },
    subtitle: {
      en: "Play real musical notes with 4 tactile keys and a piezo buzzer",
      ro: "Cântă note muzicale reale cu 4 clape tactile și un buzzer piezo",
    },
    shortTag: { en: "Buttons + Piezo Audio", ro: "Butoane + Audio Piezo" },
    overview: {
      en: "Each colored tactile button is wired to a GPIO input with an internal pull-up resistor. Tap any of the 4 keys right on the 3D breadboard — the ESP32 vibrates the piezo disc at the exact musical frequency in Hertz!",
      ro: "Fiecare buton colorat este conectat la un pin GPIO cu rezistor pull-up intern. Apasă orice clapă direct pe breadboard-ul 3D — ESP32 vibrează membrana piezo la frecvența exactă a notei muzicale în Herți!",
    },
    tryHint: {
      en: "Click the 4 colored 3D keys directly on the breadboard to play notes, or press Run to play the auto-melody!",
      ro: "Apasă direct pe cele 4 clape colorate 3D pentru a cânta note, sau apasă Rulează pentru melodia automată!",
    },
    howItWorks: [
      {
        en: "Sound pitch equals vibration speed: C4 vibrates 262 times/sec, while C5 vibrates twice as fast (523 Hz).",
        ro: "Înălțimea sunetului este viteza vibrației: Do (C4) vibrează de 262 ori/sec, iar Do+ (C5) de două ori mai repede (523 Hz).",
      },
      {
        en: "Internal INPUT_PULLUP keeps unpressed pins HIGH (1) and drops cleanly to LOW (0) when pressed.",
        ro: "Modul INPUT_PULLUP ține pinii neapăsați în HIGH (1) și îi coboară curat în LOW (0) la apăsare.",
      },
    ],
    callouts: [
      {
        id: "keys",
        label: { en: "4 Tactile Keys", ro: "4 Clape Tactile" },
        pin: "GPIO 12 · 13 · 14 · 27",
        detail: {
          en: "Click each 3D keycap (C4, E4, G4, C5) directly on the breadboard to hear real audio!",
          ro: "Apasă fiecare clapă 3D (Do, Mi, Sol, Do+) direct pe breadboard pentru a auzi sunetul real!",
        },
      },
      {
        id: "buzzer",
        label: { en: "Piezo Buzzer", ro: "Buzzer Piezo" },
        pin: "GPIO 25 (PWM)",
        detail: {
          en: "Ceramic piezoelectric disc that bends slightly with every square-wave pulse to push air into sound.",
          ro: "Disc ceramic piezoelectric care vibrează la fiecare impuls pătrat pentru a produce unde sonore.",
        },
      },
    ],
    pinout: [
      { pin: "GPIO 12", component: { en: "Key 1 — C4 (262 Hz)", ro: "Clapa 1 — Do (262 Hz)" }, role: { en: "INPUT_PULLUP", ro: "Intrare Pull-Up" }, wireColor: "#f43f5e" },
      { pin: "GPIO 13", component: { en: "Key 2 — E4 (330 Hz)", ro: "Clapa 2 — Mi (330 Hz)" }, role: { en: "INPUT_PULLUP", ro: "Intrare Pull-Up" }, wireColor: "#f59e0b" },
      { pin: "GPIO 14", component: { en: "Key 3 — G4 (392 Hz)", ro: "Clapa 3 — Sol (392 Hz)" }, role: { en: "INPUT_PULLUP", ro: "Intrare Pull-Up" }, wireColor: "#10b981" },
      { pin: "GPIO 27", component: { en: "Key 4 — C5 (523 Hz)", ro: "Clapa 4 — Do+ (523 Hz)" }, role: { en: "INPUT_PULLUP", ro: "Intrare Pull-Up" }, wireColor: "#0ea5e9" },
      { pin: "GPIO 25", component: { en: "Piezo Speaker (+)", ro: "Difuzor Piezo (+)" }, role: { en: "LEDC Tone Out", ro: "Ieșire Ton LEDC" }, wireColor: "#8b5cf6" },
    ],
    exampleUse: {
      en: "Foundation for DIY pocket synthesizers, game sound effects, electronic doorbells, and MIDI controllers.",
      ro: "Baza pentru sintetizatoare portabile DIY, efecte sonore de jocuri, sonerii și controllere MIDI.",
    },
    specs: [
      { label: { en: "Notes", ro: "Note Muzicale" }, value: "C4 · E4 · G4 · C5" },
      { label: { en: "Driver", ro: "Comandă" }, value: "ESP32 LEDC Square Wave" },
      { label: { en: "Button Logic", ro: "Logică Butoane" }, value: "Active-LOW Pull-Up" },
    ],
    defaultCode: `// 04. Mini Piano — 4-Key Chiptune Synth
const int BUZZER_PIN = 25;
const int TEMPO_MS   = 320; // Lower = faster melody!
const int NOTES[4]   = { 262, 330, 392, 523 };

void loop() {
  for (int i = 0; i < 4; i++) {
    if (digitalRead(KEY_PINS[i]) == LOW) {
      tone(BUZZER_PIN, NOTES[i], TEMPO_MS);
    }
  }
}`,
    accentHex: "#0ea5e9",
  },
  {
    id: "siren",
    number: "05",
    hashSlug: "siren",
    title: { en: "Sound a Siren", ro: "Sirenă cu Girofar" },
    subtitle: {
      en: "Alternate red & blue beacon LEDs with a sweeping dual-tone alarm",
      ro: "Alternează girofarul roșu-albastru cu o sirenă bitonală",
    },
    shortTag: { en: "Dual LED + Tone Sweep", ro: "LED Dublu + Sirenă" },
    overview: {
      en: "Combine two digital output pins for alternating Red and Blue warning beacons with a sweeping PWM tone on the piezo siren. Flip the 3D toggle switch on the breadboard or press Run to arm the alarm!",
      ro: "Combină doi pini digitali pentru girofarul alternativ Roșu-Albastru cu un semnal PWM variabil pe buzzer. Apasă întrerupătorul 3D de pe breadboard sau butonul Rulează pentru a arma sirena!",
    },
    tryHint: {
      en: "Click the 3D arming switch or press Run. Edit BASE_FREQ and STEP_MS in the code to tune your siren!",
      ro: "Apasă întrerupătorul 3D sau butonul Rulează. Modifică BASE_FREQ și STEP_MS în cod pentru a ajusta sunetul sirenei!",
    },
    howItWorks: [
      {
        en: "Phase A sets GPIO 26 HIGH (Red) + GPIO 27 LOW and plays BASE_FREQ.",
        ro: "Faza A pune GPIO 26 pe HIGH (Roșu) + GPIO 27 pe LOW și redă frecvența BASE_FREQ.",
      },
      {
        en: "Phase B flips to GPIO 27 HIGH (Blue) and jumps pitch up by SWEEP_HZ.",
        ro: "Faza B comută pe GPIO 27 HIGH (Albastru) și urcă frecvența cu SWEEP_HZ.",
      },
    ],
    callouts: [
      {
        id: "beacons",
        label: { en: "Red & Blue Beacons", ro: "Girofar Roșu & Albastru" },
        pin: "GPIO 26 / 27",
        detail: {
          en: "High-brightness 5 mm LEDs alternating out of phase every STEP_MS milliseconds.",
          ro: "LED-uri de 5 mm care alternează în antifază la fiecare STEP_MS milisecunde.",
        },
      },
      {
        id: "switch",
        label: { en: "Arming Switch", ro: "Comutator Armare" },
        pin: "GPIO 15",
        detail: {
          en: "Click the metallic 3D toggle switch to arm or disarm the siren immediately.",
          ro: "Apasă comutatorul metalic 3D pentru a arma sau dezarma instantaneu sirena.",
        },
      },
    ],
    pinout: [
      { pin: "GPIO 26", component: { en: "Red Beacon LED (+220 Ω)", ro: "LED Girofar Roșu (+220 Ω)" }, role: { en: "Digital Output", ro: "Ieșire Digitală" }, wireColor: "#ef4444" },
      { pin: "GPIO 27", component: { en: "Blue Beacon LED (+220 Ω)", ro: "LED Girofar Albastru (+220 Ω)" }, role: { en: "Digital Output", ro: "Ieșire Digitală" }, wireColor: "#3b82f6" },
      { pin: "GPIO 25", component: { en: "Piezo Siren", ro: "Sirenă Piezo" }, role: { en: "Dual-Tone PWM", ro: "PWM Bitonal" }, wireColor: "#f59e0b" },
      { pin: "GPIO 15", component: { en: "Toggle Switch", ro: "Comutator Armare" }, role: { en: "Digital Input", ro: "Intrare Digitală" }, wireColor: "#10b981" },
    ],
    exampleUse: {
      en: "Used in bicycle anti-theft alarms, door-open alerts, smoke detectors, and toy emergency vehicles.",
      ro: "Folosit în alarme antifurt pentru bicicletă, alerte de ușă deschisă, detectoare de fum și jucării interactive.",
    },
    specs: [
      { label: { en: "Tone Pattern", ro: "Tipar Sunet" }, value: "Hi-Lo Dual Frequency" },
      { label: { en: "Beacon LEDs", ro: "LED-uri Girofar" }, value: "Red 625nm + Blue 465nm" },
      { label: { en: "Switch Mode", ro: "Mod Comutator" }, value: "Latched Slide Toggle" },
    ],
    defaultCode: `// 05. Sound a Siren — Hi-Lo Alarm & Beacons
const int BASE_FREQ = 640; // Low tone (Hz)
const int SWEEP_HZ  = 340; // High tone offset (Hz)
const int STEP_MS   = 320; // Flash speed (ms)

void loop() {
  setBeacons(true, false);
  tone(25, BASE_FREQ, STEP_MS);
  delay(STEP_MS);
  setBeacons(false, true);
  tone(25, BASE_FREQ + SWEEP_HZ, STEP_MS);
  delay(STEP_MS);
}`,
    accentHex: "#ef4444",
  },
  {
    id: "wifi-switch",
    number: "06",
    hashSlug: "wifi",
    title: { en: "Wi-Fi Web Switch", ro: "Comutator Wi-Fi Web" },
    subtitle: {
      en: "Tap a mini 3D smartphone to toggle a desk lamp over 2.4 GHz Wi-Fi",
      ro: "Apasă pe mini-telefonul 3D pentru a controla lampa prin Wi-Fi 2.4 GHz",
    },
    shortTag: { en: "HTTP Server + Antenna", ro: "Server HTTP + Antenă" },
    overview: {
      en: "The ESP32 has a full 2.4 GHz Wi-Fi radio built right onto the board! It hosts a tiny webpage at 192.168.4.1. Tap the 3D smartphone screen on the workbench to send a real HTTP GET /toggle request across the airwaves!",
      ro: "ESP32 are un modul radio Wi-Fi 2.4 GHz integrat direct pe placă! Găzduiește o mică pagină web la 192.168.4.1. Apasă ecranul telefonului 3D de pe banc pentru a trimite o cerere HTTP GET /toggle prin unde radio!",
    },
    tryHint: {
      en: "Tap the 3D smartphone screen on the desk (or click Send /toggle) to watch the Wi-Fi waves reach the ESP32 antenna!",
      ro: "Apasă pe ecranul telefonului 3D (sau pe Trimite /toggle) și urmărește undele Wi-Fi până la antena ESP32!",
    },
    howItWorks: [
      {
        en: "Smartphone opens http://192.168.4.1/toggle over the ESP32 SoftAP Wi-Fi network.",
        ro: "Telefonul accesează http://192.168.4.1/toggle prin rețeaua Wi-Fi SoftAP creată de ESP32.",
      },
      {
        en: "ESP32 HTTP handler flips GPIO 26 and replies HTTP 200 OK with the updated bulb status.",
        ro: "Handlerul HTTP de pe ESP32 inversează pinul GPIO 26 și răspunde cu HTTP 200 OK și noua stare a lămpii.",
      },
    ],
    callouts: [
      {
        id: "phone",
        label: { en: "3D Smartphone Client", ro: "Telefon 3D Client" },
        pin: "192.168.4.1",
        detail: {
          en: "Click directly on the miniature phone screen to fire an HTTP GET /toggle request.",
          ro: "Apasă direct pe ecranul mini-telefonului pentru a trimite o cerere HTTP GET /toggle.",
        },
      },
      {
        id: "antenna",
        label: { en: "2.4 GHz PCB Antenna", ro: "Antenă PCB 2.4 GHz" },
        pin: "802.11 b/g/n",
        detail: {
          en: "Receives wireless TCP/IP packets without any extra modules or cables.",
          ro: "Recepționează pachete TCP/IP fără cabluri sau module externe.",
        },
      },
      {
        id: "bulb",
        label: { en: "Smart Lamp Output", ro: "Lampă Inteligentă" },
        pin: "GPIO 26",
        detail: {
          en: "Switches smoothly each time a valid /toggle command arrives over Wi-Fi.",
          ro: "Comută instant la fiecare comandă /toggle primită prin Wi-Fi.",
        },
      },
    ],
    pinout: [
      { pin: "Wi-Fi AP", component: { en: "PCB Meander Antenna", ro: "Antenă PCB Integrată" }, role: { en: "2.4 GHz SoftAP + HTTP", ro: "SoftAP 2.4 GHz + HTTP" }, wireColor: "#06b6d4" },
      { pin: "GPIO 26", component: { en: "Smart Lamp Bulb", ro: "Bec Lampă Smart" }, role: { en: "Web-Controlled Output", ro: "Ieșire Comandată Web" }, wireColor: "#f59e0b" },
      { pin: "GND", component: { en: "Lamp Return", ro: "Masă Lampă" }, role: { en: "Common Ground", ro: "Masă Comună" }, wireColor: "#1e293b" },
    ],
    exampleUse: {
      en: "The exact architecture behind Wi-Fi smart plugs, greenhouse irrigation dashboards, and remote robot controls.",
      ro: "Exact arhitectura prizelor inteligente Wi-Fi, sistemelor de irigare automată și roboților controlați din telefon.",
    },
    specs: [
      { label: { en: "Wi-Fi Standard", ro: "Standard Wi-Fi" }, value: "IEEE 802.11 b/g/n" },
      { label: { en: "Endpoint", ro: "Rută HTTP" }, value: "GET /toggle → 200 OK" },
      { label: { en: "Latency", ro: "Latență Locală" }, value: "~12 ms LAN" },
    ],
    defaultCode: `// 06. Wi-Fi Web Switch — Phone to ESP32
const char* HOST_IP = "192.168.4.1";
const int LAMP_PIN  = 26;

void handleToggle() {
  lampState = !lampState;
  digitalWrite(LAMP_PIN, lampState ? HIGH : LOW);
  server.send(200, "text/plain", lampState ? "ON" : "OFF");
}`,
    accentHex: "#06b6d4",
  },
  {
    id: "robot-gate",
    number: "07",
    hashSlug: "servo",
    title: { en: "Robot Radar Gate", ro: "Barieră Robot cu Servo" },
    subtitle: {
      en: "Sense an approaching rover with sonar and lift a 3D servo barrier",
      ro: "Detectează mașinuța cu sonar ultrasonic și ridică bariera servo 3D",
    },
    shortTag: { en: "Ultrasonic + Servo", ro: "Ultrasonic + Servo" },
    overview: {
      en: "An HC-SR04 ultrasonic sensor sends out an invisible high-pitched sound ping and times the echo to measure distance in centimeters. Move the toy rover closer on the 3D desk — when it enters TRIGGER_CM, the SG90 servo swings the striped gate arm smoothly up to OPEN_ANGLE!",
      ro: "Senzorul ultrasonic HC-SR04 trimite un impuls sonor invizibil și măsoară ecoul pentru a calcula distanța în centimetri. Apropie mașinuța pe bancul 3D — când intră sub TRIGGER_CM, motorul servo SG90 ridică automat bariera până la OPEN_ANGLE!",
    },
    tryHint: {
      en: "Slide the Rover Distance bar under 28 cm (or click the 3D mini car!) to watch the servo arm swing open. Edit OPEN_ANGLE in code and press Run!",
      ro: "Trage sliderul Distanță Mașinuță sub 28 cm (sau apasă direct pe mașinuța 3D!) pentru a ridica bariera. Modifică OPEN_ANGLE în cod și apasă Rulează!",
    },
    howItWorks: [
      {
        en: "Distance = (echo_microseconds × 0.0343) / 2 — sound travels 1 cm in ~29 microseconds.",
        ro: "Distanța = (ecou_microsecunde × 0.0343) / 2 — sunetul parcurge 1 cm în ~29 microsecunde.",
      },
      {
        en: "ESP32 sends a 50 Hz PWM pulse (1.0–2.0 ms wide) on GPIO 13 to steer the SG90 servo angle cleanly.",
        ro: "ESP32 trimite un semnal PWM de 50 Hz (impuls 1.0–2.0 ms) pe GPIO 13 pentru a poziționa precis brațul servo SG90.",
      },
    ],
    callouts: [
      {
        id: "rover",
        label: { en: "Mini Rover Car", ro: "Mașinuță Rover" },
        detail: {
          en: "Click the 3D wooden rover (or slide Distance) to drive it toward the ultrasonic radar gate.",
          ro: "Apasă pe mașinuța 3D (sau folosește sliderul Distanță) pentru a o apropia de bariera radar.",
        },
      },
      {
        id: "sonar",
        label: { en: "HC-SR04 Sonar Eyes", ro: "Ochi Sonar HC-SR04" },
        pin: "GPIO 5 / 18",
        detail: {
          en: "Twin 40 kHz transducers: one emits the ultrasonic burst (TRIG), the other catches the echo (ECHO).",
          ro: "Două capsule de 40 kHz: una emite impulsul ultrasonic (TRIG), cealaltă recepționează ecoul (ECHO).",
        },
      },
      {
        id: "servo",
        label: { en: "SG90 Servo Gate", ro: "Barieră Servo SG90" },
        pin: "GPIO 13 (PWM)",
        detail: {
          en: "Geared micro-servo motor rotating 0° (Closed) to 90° (Open) with internal feedback potentiometer.",
          ro: "Micro-motor servo cu roți dințate ce rotește brațul de la 0° (Închis) la 90° (Deschis).",
        },
      },
    ],
    pinout: [
      { pin: "GPIO 5", component: { en: "HC-SR04 TRIG", ro: "HC-SR04 TRIG" }, role: { en: "10 µs Sonar Pulse", ro: "Impuls Sonar 10 µs" }, wireColor: "#06b6d4" },
      { pin: "GPIO 18", component: { en: "HC-SR04 ECHO", ro: "HC-SR04 ECHO" }, role: { en: "Echo Timing Input", ro: "Intrare Timp Ecou" }, wireColor: "#8b5cf6" },
      { pin: "GPIO 13", component: { en: "SG90 Orange Signal", ro: "Fir Semnal SG90" }, role: { en: "50 Hz Servo PWM", ro: "PWM Servo 50 Hz" }, wireColor: "#f97316" },
      { pin: "5V / GND", component: { en: "Servo & Sonar Power", ro: "Alimentare Servo/Sonar" }, role: { en: "Power Rail", ro: "Alimentare 5V" }, wireColor: "#ef4444" },
    ],
    exampleUse: {
      en: "Powers automatic parking toll gates, touchless trash cans, obstacle-avoiding robots, and smart pet feeders.",
      ro: "Folosit în bariere automate de parcare, coșuri fără atingere, roboți care ocolesc obstacole și hrănitoare smart.",
    },
    specs: [
      { label: { en: "Sonar Range", ro: "Rază Sonar" }, value: "2 cm – 400 cm (40 kHz)" },
      { label: { en: "Servo Rotation", ro: "Rotație Servo" }, value: "0° – 180° (50 Hz PWM)" },
      { label: { en: "Stall Torque", ro: "Cuplu SG90" }, value: "1.8 kg·cm @ 4.8V" },
    ],
    defaultCode: `// 07. Robot Radar Gate — Sonar + SG90 Servo
const int TRIGGER_CM = 28; // Open gate when rover < 28 cm
const int OPEN_ANGLE = 90; // Gate lift angle (45..110 deg)

void loop() {
  int cm = sonarReadCm(5, 18);
  servoWrite(13, cm <= TRIGGER_CM ? OPEN_ANGLE : 0);
  delay(80);
}`,
    accentHex: "#f97316",
  },
  {
    id: "smart-fan",
    number: "08",
    hashSlug: "fan",
    title: { en: "Smart Plant Fan", ro: "Ventilator Smart Climă" },
    subtitle: {
      en: "Keep a greenhouse plant cool with a DHT22 sensor and 3-speed fan",
      ro: "Păstrează planta răcoroasă cu senzorul DHT22 și ventilator în 3 trepte",
    },
    shortTag: { en: "DHT22 Temp + Fan", ro: "Senzor Temp + Ventilator" },
    overview: {
      en: "A DHT22 digital climate sensor measures room temperature and humidity every second. Slide the Weather Heat control higher — when temperature passes FAN_ON_C, ESP32 spins up the 3D desk fan (and hits Turbo speed above TURBO_C) to keep your plant happy!",
      ro: "Senzorul digital DHT22 măsoară temperatura și umiditatea în fiecare secundă. Crește temperatura camerei — când depășește FAN_ON_C, ESP32 pornește ventilatorul 3D (și trece în mod Turbo peste TURBO_C) pentru a proteja planta!",
    },
    tryHint: {
      en: "Slide Room Temp past 27 °C (or click the 3D Fan hub!) to spin up cooling. Edit FAN_ON_C in code and press Run!",
      ro: "Ridică Temperatura Camerei peste 27 °C (sau apasă pe ventilatorul 3D!) pentru a porni răcirea. Modifică FAN_ON_C și apasă Rulează!",
    },
    howItWorks: [
      {
        en: "Below FAN_ON_C → Fan rests at 0% (Cool Green status). Between FAN_ON_C and TURBO_C → Eco Breeze (60% PWM).",
        ro: "Sub FAN_ON_C → Ventilatorul stă oprit (0%, status Verde). Între FAN_ON_C și TURBO_C → Briză Eco (60% PWM).",
      },
      {
        en: "At or above TURBO_C → 100% Full Cooling PWM + Coral heat indicator alert!",
        ro: "La sau peste TURBO_C → Răcire 100% Turbo PWM + indicator vizual Coral de căldură!",
      },
    ],
    callouts: [
      {
        id: "dht22",
        label: { en: "DHT22 Climate Sensor", ro: "Senzor Climă DHT22" },
        pin: "GPIO 4 (1-Wire)",
        detail: {
          en: "White slatted housing containing a precision thermistor and capacitive humidity sensor.",
          ro: "Carcasă albă cu grilă ce conține un termistor precis și un senzor capacitiv de umiditate.",
        },
      },
      {
        id: "fan",
        label: { en: "3D PWM Cooling Fan", ro: "Ventilator PWM 3D" },
        pin: "GPIO 21 (MOSFET)",
        detail: {
          en: "Click the fan or adjust Room Temp to switch smoothly between OFF, ECO (60%), and TURBO (100%).",
          ro: "Apasă pe ventilator sau ajustează Temperatura pentru a comuta între OPRIT, ECO (60%) și TURBO (100%).",
        },
      },
      {
        id: "plant",
        label: { en: "Mini Greenhouse Plant", ro: "Plantă Mini-Seră" },
        detail: {
          en: "Thrives best between 20 °C and 26 °C with gentle airflow when afternoon sun warms the desk.",
          ro: "Se simte excelent între 20 °C și 26 °C, cu ventilație blândă când soarele încălzește biroul.",
        },
      },
    ],
    pinout: [
      { pin: "GPIO 4", component: { en: "DHT22 Data Pin", ro: "Pin Date DHT22" }, role: { en: "1-Wire Digital Bus", ro: "Magistrală 1-Wire" }, wireColor: "#10b981" },
      { pin: "GPIO 21", component: { en: "Fan MOSFET Gate", ro: "Poartă MOSFET Ventilator" }, role: { en: "25 kHz PWM Speed", ro: "Viteză PWM 25 kHz" }, wireColor: "#0ea5e9" },
      { pin: "3V3 / GND", component: { en: "DHT22 & Fan Rail", ro: "Alimentare Senzor/Fan" }, role: { en: "Power & Common GND", ro: "Alimentare & Masă" }, wireColor: "#ef4444" },
    ],
    exampleUse: {
      en: "The exact closed-loop thermostat logic inside smart greenhouses, gaming PC fan curves, and home HVAC controllers.",
      ro: "Exact logica de termostat din serele inteligente, curbele de ventilatoare pentru PC-uri și termostatele smart.",
    },
    specs: [
      { label: { en: "Temp Accuracy", ro: "Precizie Temp" }, value: "±0.5 °C (-40 to 80 °C)" },
      { label: { en: "Fan Speed Stages", ro: "Trepte Viteză" }, value: "0% OFF · 60% ECO · 100% TURBO" },
      { label: { en: "PWM Frequency", ro: "Frecvență PWM" }, value: "25 kHz (Silent Drive)" },
    ],
    defaultCode: `// 08. Smart Plant Fan — Closed-Loop Thermostat
const int FAN_ON_C = 27; // Start Eco breeze at 27 C
const int TURBO_C  = 32; // Full Turbo cooling at 32 C

void loop() {
  int tempC = dhtReadTempC(4);
  int pwm = tempC >= TURBO_C ? 255 : (tempC >= FAN_ON_C ? 155 : 0);
  analogWrite(21, pwm);
}`,
    accentHex: "#10b981",
  },
];

export const JUNIOR_MISSIONS: Record<JuniorLessonId, LocalizedText> = {
  "table-lamp": {
    en: "Mission: Drag the black Cap over the LDR sensor until the Table Lamp lights up!",
    ro: "Misiune: Trage capacul negru peste senzorul LDR până când se aprinde Lampa!",
  },
  "mood-lamp": {
    en: "Mission: Tap the frosted orb or pick a new RGB color swatch to transform the room glow!",
    ro: "Misiune: Apasă pe globul 3D sau alege o culoare RGB nouă pentru a schimba atmosfera!",
  },
  "fill-ring": {
    en: "Mission: Turn the 10 kΩ knob until at least 8 of the 12 NeoPixel LEDs shine bright!",
    ro: "Misiune: Rotește potențiometrul până când se aprind cel puțin 8 din cele 12 LED-uri!",
  },
  "mini-piano": {
    en: "Mission: Tap the 3D piano keys (or press Run) to play a musical melody on the piezo!",
    ro: "Misiune: Apasă clapele 3D ale pianului (sau Rulează) pentru a cânta o melodie pe piezo!",
  },
  siren: {
    en: "Mission: Flip the 3D toggle switch to arm the Red & Blue emergency beacons!",
    ro: "Misiune: Comută întrerupătorul 3D pentru a arma girofarul Roșu-Albastru!",
  },
  "wifi-switch": {
    en: "Mission: Tap the 3D mini smartphone screen to fire a wireless /toggle command!",
    ro: "Misiune: Apasă pe ecranul telefonului 3D pentru a trimite comanda Wi-Fi /toggle!",
  },
  "robot-gate": {
    en: "Mission: Drive the mini rover closer than TRIGGER_CM so the sonar lifts the servo gate!",
    ro: "Misiune: Apropie mașinuța sub distanța TRIGGER_CM ca sonarul să ridice bariera servo!",
  },
  "smart-fan": {
    en: "Mission: Warm the greenhouse past FAN_ON_C to spin up the cooling fan for the plant!",
    ro: "Misiune: Încălzește sera peste FAN_ON_C pentru a porni ventilatorul de răcire al plantei!",
  },
};

export function getJuniorLesson(id: JuniorLessonId): JuniorLesson {
  return JUNIOR_LESSONS.find((l) => l.id === id) ?? JUNIOR_LESSONS[0];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Computes realistic 12-bit ESP32 ADC light sensor telemetry based on
 * the 3D horizontal distance between the draggable Cap and the LDR sensor.
 */
export function computeLdrReading(
  capPos: Point2D,
  threshold: number,
  sensorPos: Point2D = LDR_SENSOR_POS,
): LdrReading {
  const dx = capPos.x - sensorPos.x;
  const dz = capPos.z - sensorPos.z;
  const distance = Math.hypot(dx, dz);

  // Within 0.25 units = fully sealed dark; beyond 1.45 units = full room light
  const rawCoverage = 1 - (distance - 0.22) / (1.45 - 0.22);
  const coverage01 = clamp(rawCoverage, 0, 1);
  // Smooth S-curve so edge shadow transitions naturally
  const smoothCov = coverage01 * coverage01 * (3 - 2 * coverage01);

  const brightAdc = 3640;
  const darkAdc = 185;
  const adc = Math.round(brightAdc - smoothCov * (brightAdc - darkAdc));
  const voltageV = Number(((adc / 4095) * 3.3).toFixed(2));
  const lux = Math.max(3, Math.round(780 * Math.pow(1 - smoothCov, 1.8) + 3));
  const lampOn = adc < threshold;

  return {
    distance: Number(distance.toFixed(2)),
    coverage01: Number(smoothCov.toFixed(3)),
    adc,
    voltageV,
    lux,
    lampOn,
  };
}

/**
 * Interpolates Cap position from a 0..1 coverage slider (0 = resting on desk, 1 = seated over LDR).
 */
export function capPosFromCover01(cover01: number): Point2D {
  const t = clamp(cover01, 0, 1);
  return {
    x: Number((CAP_OPEN_POS.x + (CAP_COVERED_POS.x - CAP_OPEN_POS.x) * t).toFixed(3)),
    z: Number((CAP_OPEN_POS.z + (CAP_COVERED_POS.z - CAP_OPEN_POS.z) * t).toFixed(3)),
  };
}

/**
 * Safely parses editable constants from the user's code editor so live code edits
 * immediately drive the 3D hardware simulation.
 */
export function parseEditableCodeParams(code: string): ParsedJuniorCodeParams {
  const matchInt = (name: string, fallback: number, min: number, max: number): number => {
    const regex = new RegExp(`\\b${name}\\s*=\\s*(\\d+)`, "i");
    const m = code.match(regex);
    if (!m) return fallback;
    const parsed = Number.parseInt(m[1], 10);
    return Number.isFinite(parsed) ? clamp(parsed, min, max) : fallback;
  };

  const hexMatch = code.match(/COLOR_HEX\s*=\s*"(#[0-9a-fA-F]{6})"/i);
  const hostMatch = code.match(/HOST_IP\s*=\s*"([^"]{4,32})"/i);

  return {
    threshold: matchInt("THRESHOLD", 1800, 250, 3500),
    moodColorHex: hexMatch ? hexMatch[1] : "#ff9f43",
    breatheMs: matchInt("BREATHE_MS", 1800, 500, 5000),
    maxRingLeds: matchInt("MAX_LEDS", 12, 1, 12),
    ringMode: matchInt("MODE", 1, 0, 2) as 0 | 1 | 2,
    pianoTempoMs: matchInt("TEMPO_MS", 320, 140, 1000),
    sirenBaseFreq: matchInt("BASE_FREQ", 640, 280, 1400),
    sirenSweepHz: matchInt("SWEEP_HZ", 340, 80, 800),
    sirenStepMs: matchInt("STEP_MS", 320, 140, 900),
    wifiHost: hostMatch ? hostMatch[1] : "192.168.4.1",
    gateTriggerCm: matchInt("TRIGGER_CM", 28, 10, 65),
    gateOpenAngle: matchInt("OPEN_ANGLE", 90, 45, 115),
    fanOnTempC: matchInt("FAN_ON_C", 27, 18, 36),
    fanTurboTempC: matchInt("TURBO_C", 32, 24, 42),
  };
}

/**
 * Computes per-LED hex colors for the 12-LED WS2812B NeoPixel ring.
 */
export function computeRingLedColors(
  potValue01: number,
  maxLeds: number,
  mode: 0 | 1 | 2,
): { litCount: number; adc: number; colors: (string | null)[] } {
  const clampedPot = clamp(potValue01, 0, 1);
  const safeMax = clamp(Math.round(maxLeds), 1, 12);
  const adc = Math.round(clampedPot * 4095);
  const litCount = Math.round(clampedPot * safeMax);

  const rainbow = [
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#eab308",
    "#84cc16",
    "#22c55e",
    "#10b981",
    "#14b8a6",
    "#06b6d4",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
  ];

  const colors: (string | null)[] = Array.from({ length: 12 }, (_, idx) => {
    if (idx >= litCount) return null;
    if (mode === 0) return "#06b6d4";
    if (mode === 2) return "#f59e0b";
    return rainbow[idx % rainbow.length];
  });

  return { litCount, adc, colors };
}

export function computeSirenPhase(
  step: number,
  baseFreq: number,
  sweepHz: number,
): { redOn: boolean; blueOn: boolean; freqHz: number } {
  const isHigh = step % 2 === 1;
  return {
    redOn: !isHigh,
    blueOn: isHigh,
    freqHz: isHigh ? baseFreq + sweepHz : baseFreq,
  };
}

export function computeRadarGateState(
  distanceCm: number,
  triggerCm: number,
  openAngleDeg: number,
): { gateOpen: boolean; servoAngleDeg: number; echoUs: number } {
  const safeDist = clamp(Math.round(distanceCm), 5, 80);
  const gateOpen = safeDist <= triggerCm;
  const servoAngleDeg = gateOpen ? clamp(openAngleDeg, 45, 115) : 0;
  const echoUs = Math.round((safeDist * 2) / 0.0343);
  return { gateOpen, servoAngleDeg, echoUs };
}

export function computeSmartFanState(
  tempC: number,
  fanOnC: number,
  turboC: number,
): { mode: "off" | "eco" | "turbo"; dutyPct: number; rpm: number } {
  const safeTurbo = Math.max(fanOnC + 2, turboC);
  if (tempC >= safeTurbo) {
    return { mode: "turbo", dutyPct: 100, rpm: 2400 };
  }
  if (tempC >= fanOnC) {
    return { mode: "eco", dutyPct: 60, rpm: 1450 };
  }
  return { mode: "off", dutyPct: 0, rpm: 0 };
}

export function getText(text: LocalizedText, lang: Lang): string {
  return text[lang];
}
