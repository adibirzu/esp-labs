import type { OfficialDocResource } from "./boards";
import type { TrackMeta } from "./labs";
import type {
  ChipBlock,
  CodeTour,
  EspBoardSpec,
  GlossaryEntry,
  KitPart,
  LabItem,
  Lang,
  MemoryRegion,
  PeripheralModule,
  PinDef,
  PowerMode,
  ProjectIdea,
  RegisterDef,
  TrackId,
} from "../types";

// ============================================================================
// 1. TRACKS (7 Trasee)
// ============================================================================
const TRACKS_RO: Record<TrackId, { name: string; desc: string }> = {
  intro: { name: "Start (I1–I4)", desc: "GPIO, LED RGB, Timere, Tactil și Deep-Sleep" },
  display: { name: "Ecran (D1–D4)", desc: "Magistrală I2C, OLED 128×64, Grafică și Diagrame" },
  wifi: { name: "Wi-Fi (W1–W4)", desc: "Stație 802.11n/ax, Interfață Web, MQTT și OTA" },
  iot: { name: "IoT & Energie (P1–P4)", desc: "LiPo ADC1, Mesh ESP-NOW, ULP și Matter/Thread" },
  ble: { name: "BLE (B1–B8)", desc: "Bluetooth 5.0 Advertising, GATT și Notificări" },
  rfid: { name: "RFID (R1–R8)", desc: "Magistrală SPI, MFRC522 și Control Acces" },
  sound: { name: "Sunet (S1–S8)", desc: "Audio I2S, Amplificator MAX98357A și Sintetizator" },
};

// ============================================================================
// 2. LABS (40 Laboratoare)
// ============================================================================
const LABS_RO: Record<string, { title: string; summary: string }> = {
  "intro-1": {
    title: "Salut ESP32-S3 și LED-ul RGB de pe Placă",
    summary:
      "Controlează LED-ul RGB adresabil WS2812 de pe GPIO48 folosind perifericul RMT și citește butonul BOOT de pe GPIO0.",
  },
  "intro-2": {
    title: "Timer Hardware GPTimer și Întreruperi GPIO (ISR)",
    summary:
      "Înlocuiește buclele blocante vTaskDelay cu alarme precise la microsecundă GPTimer și întreruperi debounced pe butonul GPIO0.",
  },
  "intro-3": {
    title: "Slider Tactil Capacitiv și Variator LEDC PWM",
    summary:
      "Citește cele 14 pad-uri tactile capacitive integrate pe ESP32-S3/S2 cu filtrare de zgomot pentru a regla lin luminozitatea unui LED prin PWM pe 13 biți.",
  },
  "intro-4": {
    title: "Deep-Sleep, Memorie RTC Rapidă și Trezire Automată",
    summary:
      "Scade consumul la ~7 µA cu esp_deep_sleep_start(), păstrează contoarele în RTC_DATA_ATTR și trezește placa prin timer sau butonul EXT0.",
  },
  "display-1": {
    title: 'Ecran OLED SSD1306 0.96" prin I2C',
    summary:
      "Scanează magistrala I2C (0x3C), inițializează pompa de tensiune SSD1306 și afișează grafică și telemetrie în timp real.",
  },
  "display-2": {
    title: "Iconițe Bitmap 1-Bit și Fonturi Pixel Personalizate",
    summary:
      "Împachetează iconițe monocrome 16×16 în tablouri de octeți, desenează sprite-uri cu inversare XOR și afișează interfețe clare.",
  },
  "display-3": {
    title: "Grafic Telemetrie Live cu Buffer Circular",
    summary:
      "Trimite eșantioane RSSI, tensiune ADC sau nivel audio într-un buffer circular de 128 puncte și afișează grafice cursive la 30 FPS.",
  },
  "display-4": {
    title: "Meniu pe OLED controlat cu Encoder Rotativ",
    summary:
      "Decodează impulsurile unui encoder rotativ cu numărătorul hardware PCNT și navighează prin ecrane de setări cu selecție inversată.",
  },
  "wifi-1": {
    title: "Stație Wi-Fi, Semnal RSSI și Control HTTP",
    summary:
      "Inițializează memoria NVS și stiva LwIP, conectează-te la un router 2.4 GHz, monitorizează RSSI și comandă pini GPIO de la distanță.",
  },
  "wifi-2": {
    title: "Server Web HTTP REST și Tablou WebSocket Integrat",
    summary:
      "Servește o pagină de control comprimată direct din Flash prin esp_http_server și trimite telemetrie JSON live prin WebSockets.",
  },
  "wifi-3": {
    title: "MQTT prin TLS și Wi-Fi 6 Target Wake Time (TWT)",
    summary:
      "Publică date de senzori criptate către un broker MQTT cu esp_mqtt_client și negociază ferestre de economisire TWT pe ESP32-C6/C5.",
  },
  "wifi-4": {
    title: "Actualizări Firmware HTTPS OTA cu Partiție Dublă",
    summary:
      "Configurează partițiile ota_0 și ota_1, descarcă firmware semnat prin HTTPS, verifică SHA-256 și activează revenirea automată la eroare.",
  },
  "iot-1": {
    title: "Calibrare ADC1 și Indicator Baterie LiPo",
    summary:
      "Folosește calibrarea din fabrică eFuse pe ADC1 (sigură alături de Wi-Fi!) pentru a măsura un divizor rezistiv 1:1 și procentul bateriei LiPo.",
  },
  "iot-2": {
    title: "Rețea Wireless Directă ESP-NOW sub 5 ms",
    summary:
      "Trimite pachete criptate de 250 octeți direct între două plăci ESP32 fără router Wi-Fi, cu timp de trezire și emisie sub 15 ms.",
  },
  "iot-3": {
    title: "Stație Meteo Autonomă pe Coprocesorul ULP / LP-Core",
    summary:
      "Mută verificarea periodică a temperaturii/umidității I2C pe coprocesorul RISC-V ultra-eficient astfel încât CPU-ul principal să doarmă 99.8% din timp.",
  },
  "iot-4": {
    title: "Senzor Inteligent IEEE 802.15.4 Thread / Zigbee și Matter",
    summary:
      "Înrolează o placă ESP32-C6 sau ESP32-H2 într-o rețea mesh Thread 1.3 sau Zigbee 3.0 și raportează date live către hub-ul casei.",
  },
  "ble-1": {
    title: "Pachet de Difuzare (Advertising) BLE 5.0",
    summary:
      "Difuzare nume dispozitiv și date personalizate pe canalele Bluetooth Low Energy 37, 38 și 39 în banda de 2.4 GHz.",
  },
  "ble-2": {
    title: "Răspuns la Scanare (Scan Response) și Putere TX",
    summary:
      "Extinde datele difuzate prin pachete Scan Response și ajustează puterea radio între -12 dBm și +9 dBm.",
  },
  "ble-3": {
    title: "Server GATT și Tabel de Servicii Custom",
    summary:
      "Înregistrează un serviciu GATT pe 128 biți și expune caracteristici de citire și scriere (Read/Write).",
  },
  "ble-4": {
    title: "Citire și Scriere Caracteristici de pe Telefon",
    summary:
      "Primește pachete de octeți structurați de la o aplicație BLE pe smartphone pentru a controla perifericele hardware.",
  },
  "ble-5": {
    title: "Telemetrie în Timp Real cu Notificări GATT",
    summary:
      "Trimite periodic valori ale senzorilor prin notificări BLE fără a consuma energie cu interogări repetate.",
  },
  "ble-6": {
    title: "Asociere și Împerechere Securizată BLE (SMP)",
    summary:
      "Activează protecția MITM, compararea numerică și salvarea criptată a cheilor de împerechere în memoria NVS.",
  },
  "ble-7": {
    title: "Baliză (Beacon) cu Consum Ultra-Redus",
    summary:
      "Combină rafalele scurte de advertising BLE cu modul Light-Sleep pentru autonomie de câteva luni pe baterie.",
  },
  "ble-8": {
    title: "Hub de Telemetrie Multi-Client BLE",
    summary:
      "Gestionează mai multe conexiuni Bluetooth simultane și transmite în timp real starea sistemului ESP32-S3.",
  },
  "rfid-1": {
    title: "Magistrala SPI2 și Cablarea Cititorului MFRC522",
    summary:
      "Configurează magistrala SPI2 full-duplex la 4 MHz și citește registrul VersionReg (0x92) al modulului MFRC522.",
  },
  "rfid-2": {
    title: "Câmp RF 13.56 MHz și Detecția Cardurilor",
    summary:
      "Activează antena RF de 13.56 MHz și trimite comenzi REQA/WUPA pentru detectarea cardurilor ISO14443-A.",
  },
  "rfid-3": {
    title: "Anti-Coliziune și Extragere UID Card",
    summary:
      "Decodează codurile unice UID pe 4 și 7 octeți ale cardurilor și afișează identificatorii hexazecimali pe serial.",
  },
  "rfid-4": {
    title: "Listă Albă (Whitelist) pentru Control Acces",
    summary:
      "Verifică UID-urile scanate față de lista autorizată și semnalizează vizual/sonor accesul permis sau respins.",
  },
  "rfid-5": {
    title: "Autentificare Sectoare MIFARE Classic",
    summary:
      "Autentifică sectoarele cardurilor MIFARE folosind cheile Crypto1 Key A și Key B.",
  },
  "rfid-6": {
    title: "Citirea și Scrierea Blocurilor de Date",
    summary:
      "Salvează și citește în siguranță înregistrări de 16 octeți în memoria internă a cardurilor RFID.",
  },
  "rfid-7": {
    title: "Încuietoare Inteligentă cu Mașină de Stări",
    summary:
      "Construiește un controller de încuietoare temporizat cu protecție anti-forțare și mesaje pe ecranul OLED.",
  },
  "rfid-8": {
    title: "Jurnal de Acces Salvabil în Memoria NVS",
    summary:
      "Salvează istoricul scanărilor cu marcaj temporal în memoria nevolatilă Flash și exportă-l pe portul serial.",
  },
  "sound-1": {
    title: "Magistrala I2S și Amplificatorul Clasa D MAX98357A",
    summary:
      "Conectează liniile BCLK, LRC și DIN la amplificatorul MAX98357A și trimite cadre audio PCM pe 16 biți prin GDMA.",
  },
  "sound-2": {
    title: "Sintetizator de Undă Sinusoidală Pură (LUT)",
    summary:
      "Generează unde sinusoidale cu acumulator de fază la 44.1 kHz fără întreruperi sau sacadări ale procesorului.",
  },
  "sound-3": {
    title: "Forme de Undă Retro Chiptune (Pătrat/Ferăstrău/Triunghi)",
    summary:
      "Sintetizează sunete clasice de jocuri retro și observă forma lor în timp real pe osciloscop.",
  },
  "sound-4": {
    title: "Anvelope de Amplitudine ADSR",
    summary:
      "Modelează sunete percusive și armonice prin etapele Attack, Decay, Sustain și Release.",
  },
  "sound-5": {
    title: "Secvențiator de Pași și Gamă Muzicală",
    summary:
      "Redă melodii muzicale calibrate în gamă temperată folosind tabele de note sincronizate prin timer.",
  },
  "sound-6": {
    title: "Mixaj Polifonic și Protecție la Distorsiune",
    summary:
      "Combină simultan mai multe voci de sintetizator în aritmetică în virgulă fixă Q15 fără saturație audio.",
  },
  "sound-7": {
    title: "VU-Metru Audio în Timp Real (RMS)",
    summary:
      "Calculează amplitudinea RMS pe fiecare buffer DMA și afișează bare dinamice pe ecranul OLED sau LED.",
  },
  "sound-8": {
    title: "Motor de Efecte Sonore Interactive (SFX)",
    summary:
      "Declanșează efecte sonore neblocante (confirmare, eroare, laser) din evenimentele RFID și BLE.",
  },
};

// ============================================================================
// 3. PROJECT IDEAS (10 Idei de Proiecte)
// ============================================================================
const IDEAS_RO: Record<
  string,
  { title: string; buildTime: string; summary: string; parts: string[]; steps: string[] }
> = {
  "idea-smart-rfid-vault": {
    title: "Terminal Inteligent de Acces cu RFID, OLED și Jurnal",
    buildTime: "3–4 ore",
    summary:
      "Construiește un sistem autonom de acces cu carduri MIFARE 13.56 MHz care afișează starea pe un OLED 128×64, redă sunete de confirmare/respingere pe I2S și salvează fiecare scanare în Flash.",
    parts: [
      "ESP32-S3-DevKitC-1",
      "Cititor RFID MFRC522 + Carduri MIFARE",
      'Ecran OLED I2C SSD1306 0.96"',
      "Amplificator MAX98357A + Difuzor 3W",
    ],
    steps: [
      "Verifică lipsa coliziunilor GPIO în Verificatorul de Pinout (mută RFID_RST de pe GPIO9 pe GPIO21).",
      "Inițializează SPI2 pentru citirea UID-urilor MFRC522 și salvează cardurile autorizate în memoria NVS.",
      "Afișează mesajele de întâmpinare și temporizatorul de blocare pe ecranul OLED SSD1306 (0x3C).",
      "Declanșează efecte sonore I2S și culori RGB pe GPIO48 la fiecare apropiere a unui card.",
    ],
  },
  "idea-pocket-chiptune-synth": {
    title: "Mini Pian și Sintetizator Retro Chiptune cu BLE MIDI",
    buildTime: "4 ore",
    summary:
      "Transformă ESP32-S3 într-un sintetizator retro pe 4 voci controlat prin pad-uri tactile sau Bluetooth de pe telefon, cu osciloscop live pe OLED și difuzor MAX98357A.",
    parts: [
      "ESP32-S3-DevKitC-1",
      "Amplificator I2S MAX98357A + Difuzor 4Ω",
      'Ecran OLED SSD1306 0.96"',
      "Bandă de cupru sau 8 taste tactile capacitive",
    ],
    steps: [
      "Configurează I2S0 în mod mono 16 biți la 44.1 kHz cu un inel GDMA de 6 buffere.",
      "Implementează oscilatoare sinus/pătrat/ferăstrău în virgulă fixă Q15 cu anvelope ADSR.",
      "Leagă pinii tactili capacitivi sau comenzile BLE GATT (0xFFE2) la notele muzicale.",
      "Calculează nivelul RMS pe fiecare buffer și desenează un osciloscop cursiv la 30 FPS pe OLED.",
    ],
  },
  "idea-matter-thread-sensor": {
    title: "Senzor de Climă Matter-over-Thread pentru Casă Inteligentă",
    buildTime: "2–3 ore",
    summary:
      "Creează un senzor smart-home compatibil nativ cu Apple Home, Google Home și Home Assistant folosind radio IEEE 802.15.4 și nucleul de consum redus LP RISC-V de pe ESP32-C6.",
    parts: [
      "ESP32-C6-DevKitC-1 (sau ESP32-H2-DevKitM-1)",
      "Senzor I2C Temperatură/Umiditate BME280 sau SHT40",
      "Acumulator LiPo 1000 mAh + Regulator 3.3V",
    ],
    steps: [
      "Încarcă un endpoint ESP-Matter pentru temperatură/umiditate cu cod QR de înrolare BLE.",
      "Citește senzorul I2C folosind nucleul LP RISC-V la 20 MHz în timp ce nucleul principal doarme.",
      "Trezește radio-ul 802.15.4 doar când temperatura variază cu peste 0.3 °C pentru a economisi bateria.",
      "Măsoară curentul activ vs Deep-Sleep (µA) direct pe jumper-ul J5 al plăcii DevKitC-1.",
    ],
  },
  "idea-solar-weather-station": {
    title: "Stație Meteo Solară Ultra-Eficientă cu ESP-NOW",
    buildTime: "2 ore",
    summary:
      "Construiește un nod exterior compact pe ESP32-C3 (doar 38.91 mm) care se trezește la 10 minute, măsoară bateria și vremea, trimite un pachet ESP-NOW de 2 ms și adoarme la ~5 µA.",
    parts: [
      "ESP32-C3-DevKitM-1",
      "Baterie 18650 / LiPo + Mini Panou Solar 5V",
      "Divizor de tensiune 100 kΩ + 100 kΩ",
      "Senzor I2C BMP280 / AHT20",
    ],
    steps: [
      "Conectează divizorul de tensiune 1:1 pe un canal ADC1 și calibrează citirea cu esp_adc_cal.",
      "Transmite o structură compactă de 24 octeți prin ESP-NOW fără conexiune (fără întârziere DHCP/Wi-Fi).",
      "Apelează esp_deep_sleep_start() cu trezire pe timer RTC la 600 secunde pentru autonomie de luni întregi.",
      "Recepționează pachetele pe un receptor ESP32-S3 din casă și afișează graficul pe OLED sau web.",
    ],
  },
  "idea-usb-macro-deck": {
    title: "Tastatură Macro USB-HID de Birou cu Ecran OLED",
    buildTime: "2–3 ore",
    summary:
      "Folosește portul USB-OTG nativ (TinyUSB) pentru a construi o tastatură de scurtături plug-and-play cu indicator RGB și ecran OLED cu legende — fără drivere necesare.",
    parts: [
      "ESP32-S2-DevKitC-1 sau ESP32-S3-DevKitC-1",
      "6× Switch-uri Mecanice + Taste",
      'Ecran OLED SSD1306 0.96"',
      "Cablu de date USB-C",
    ],
    steps: [
      "Activează descriptorii TinyUSB HID de tastatură pe portul nativ USB-OTG (GPIO19/GPIO20).",
      "Scanează matricea de butoane cu filtrare hardware (debounce) și întreruperi pe front.",
      "Afișează profilul activ și iconițele comenzilor (Mute, Build, Copy) pe ecranul OLED 128×64.",
      "Opțional, pornește o pagină Wi-Fi SoftAP ca să poți reconfigura tastele direct din browser.",
    ],
  },
  "idea-dualband-wifi6-monitor": {
    title: "Sondă Portabilă de Diagnoză Wi-Fi 6 Dual-Band (2.4 & 5 GHz)",
    buildTime: "4–5 ore",
    summary:
      "Construiește un analizor RF de buzunar pe ESP32-C5 care scanează simultan canalele 2.4 GHz și 5 GHz, măsoară RSSI, trimite telemetrie MQTT și desenează histograme pe OLED.",
    parts: [
      "ESP32-C5-DevKitC-1",
      'Ecran OLED SSD1306 0.96"',
      "Encoder Rotativ cu Buton",
    ],
    steps: [
      "Scanează activ canalele din benzile 2.4 GHz (Ch 1–13) și 5 GHz UNII prin API-urile Wi-Fi ESP-IDF.",
      "Desenează în timp real histograme RSSI și gradul de aglomerare al canalelor pe OLED.",
      "Publică rapoarte JSON prin MQTT către un broker local, cu suport pentru actualizări OTA.",
      "Folosește encoderul rotativ pentru a schimba între Spectru Live, Listă Rețele și Latență Ping.",
    ],
  },
  "idea-ble-env-badge": {
    title: "Ecuson Digital Purtabil cu Ecran OLED și Bluetooth 5.0",
    buildTime: "2 ore",
    summary:
      "Creează un ecuson de conferință sau de școală cu ecran OLED al cărui text, iconiță și culoare LED se schimbă instant de pe orice telefon prin BLE 5.0.",
    parts: [
      "ESP32-C3-DevKitM-1 (placă compactă de 38.91 mm)",
      'Ecran OLED SSD1306 0.96"',
      "Acumulator plat LiPo 350 mAh",
    ],
    steps: [
      "Înregistrează un serviciu GATT custom pe 128 biți cu caracteristici Read/Write pentru text și RGB.",
      "Salvează textul personalizat în NVS astfel încât numele să rămână memorat și după oprire.",
      "Alternează rafalele de advertising cu Light-Sleep pentru o autonomie de peste 48 de ore.",
      "Adaugă un buton care schimbă ecranele: Nume, Cod QR Contact și Nivel Baterie.",
    ],
  },
  "idea-p4-edge-camera-hmi": {
    title: "Cameră Edge-AI la 400 MHz și Panou Tactil la 60 FPS",
    buildTime: "6+ ore",
    summary:
      "Folosește cele două nuclee RISC-V la 400 MHz ale ESP32-P4, interfața MIPI-CSI, encoderul hardware H.264 și acceleratorul 2D-DMA pentru un interfon inteligent sau microscop digital.",
    parts: [
      "ESP32-P4-Function-EV-Board",
      "Modul Cameră MIPI-CSI SC2336",
      "Ecran Tactil Capacitiv MIPI-DSI de 7 inch",
    ],
    steps: [
      "Inițializează pipeline-ul MIPI-CSI ISP pentru a trimite cadrele YUV direct în cei 32 MB PSRAM.",
      "Folosește acceleratorul 2D-DMA PPA pentru scalare și suprapunere HUD la 60 FPS pe MIPI-DSI.",
      "Codifică clipuri declanșate de mișcare cu blocul hardware H.264 direct pe cardul microSD.",
      "Servește capturi live prin Ethernet 100M sau prin coprocesorul Wi-Fi 6 ESP32-C6 de pe placă.",
    ],
  },
  "idea-espnow-rover": {
    title: "Mașinuță / Rover Telecomandat cu ESP-NOW fără Latență",
    buildTime: "4 ore",
    summary:
      "Conectează două plăci ESP32 prin ESP-NOW (<5 ms latență) pentru control bidirecțional cu joystick, motoare comandate prin PWM LEDC și telemetrie live a bateriei pe telecomandă.",
    parts: [
      "2× ESP32-S3-DevKitC-1 (sau C3 Telecomandă + S3 Rover)",
      "Driver Motoare Dual H-Bridge DRV8833",
      "Joystick Analogic 2 Axe + Ecran OLED SSD1306",
    ],
    steps: [
      "Citește axele X/Y ale joystick-ului pe ADC1 la 50 Hz și împachetează comenzile de accelerație și direcție.",
      "Trimite pachete criptate ESP-NOW către adresa MAC a rover-ului cu oprire automată la pierderea semnalului.",
      "Comandă puntea H cu timere hardware LEDC PWM la 20 kHz (fără zgomot audibil al motoarelor).",
      "Primește înapoi tensiunea LiPo și semnalul RSSI pentru afișare pe ecranul OLED al telecomenzii.",
    ],
  },
  "idea-zigbee-desk-controller": {
    title: "Întrerupător de Birou și Variator Wireless Zigbee 3.0",
    buildTime: "2–3 ore",
    summary:
      "Construiește un comutator de scene Zigbee 3.0 pe ESP32-H2 care se conectează direct la Zigbee2MQTT sau Philips Hue cu consum de câțiva microamperi în standby.",
    parts: [
      "ESP32-H2-DevKitM-1",
      "4× Butoane Tactile de Scene sau Encoder Rotativ",
      "Baterie CR123A / LiFePO4 3.2V",
    ],
    steps: [
      "Configurează ESP-Zigbee-SDK ca dispozitiv Sleepy End Device (ZED) cu clustere On/Off și Level Control.",
      "Atașează întreruperi de trezire GPIO celor 4 butoane pentru ca microcontrolerul să doarmă între apăsări.",
      "Trimite un puls scurt verde/chihlimbar pe LED-ul RGB GPIO8 la confirmarea comenzii Zigbee.",
      "Asociază comutatorul direct cu becurile Zigbee pentru control instant chiar și fără internet.",
    ],
  },
};

// ============================================================================
// 4. OFFICIAL BOARDS & DOC PORTALS (8 Plăci Oficiale)
// ============================================================================
const BOARDS_RO: Record<
  string,
  { tagline: string; bestFor: string[]; gotcha: string; usb: string; psramSpec: string; flashSpec: string }
> = {
  "esp32-s3-devkitc-1": {
    tagline:
      "Placa flagship dual-core pentru AI, ecrane și audio, cu USB-OTG nativ și până la 8 MB Octal PSRAM.",
    bestFor: [
      "Sintetizatoare audio I2S și recunoaștere vocală (ESP-SR)",
      "Interfețe grafice LCD/OLED și ecrane LVGL",
      "Dispozitive USB-HID / MIDI / memorie USB nativă",
    ],
    gotcha:
      "Pe modulele N16R8, pinii GPIO35, GPIO36 și GPIO37 sunt legați intern la memoria Octal PSRAM și nu trebuie folosiți extern.",
    usb: "Dual USB-C (USB-OTG nativ + punte UART)",
    psramSpec: "Până la 8 MB Octal PSRAM (R8)",
    flashSpec: "8 MB sau 16 MB Quad/Octal SPI Flash",
  },
  "esp32-c3-devkitm-1": {
    tagline:
      "Placă RISC-V ultra-compactă și accesibilă cu Wi-Fi + BLE 5.0, măsurând doar 38.91 mm lungime.",
    bestFor: [
      "Prize inteligente compacte, relee și senzori IoT",
      "Balize BLE 5.0 și telemetrie cu buget redus",
      "Învățarea arhitecturii deschise RISC-V pe 32 biți",
    ],
    gotcha:
      "GPIO2, GPIO8 și GPIO9 sunt pini strapping de boot; GPIO9 trebuie să rămână HIGH la pornire pentru boot normal din Flash.",
    usb: "Micro-USB (punte UART) + USB Serial/JTAG pe GPIO18/19",
    psramSpec: "Fără (doar 400 KB SRAM intern)",
    flashSpec: "4 MB SPI Flash integrat",
  },
  "esp32-c6-devkitc-1": {
    tagline:
      "Placă RISC-V de generație nouă pentru casă inteligentă: Wi-Fi 6 (TWT), BLE 5.0, Zigbee 3.0 și Thread.",
    bestFor: [
      "Dispozitive Matter-over-Wi-Fi și Matter-over-Thread",
      "Senzori pe baterie cu Wi-Fi 6 Target Wake Time (TWT)",
      "Noduri, routere și coordonatori Zigbee 3.0",
    ],
    gotcha:
      "Wi-Fi 6 pe ESP32-C6 funcționează în banda de 2.4 GHz (802.11ax HE20); pentru Wi-Fi 6 Dual-Band 5 GHz alege ESP32-C5.",
    usb: "Dual USB-C (USB Serial/JTAG nativ + punte UART)",
    psramSpec: "Fără (512 KB HP + 16 KB LP SRAM)",
    flashSpec: "8 MB SPI Flash (N8)",
  },
  "esp32-h2-devkitm-1": {
    tagline:
      "Microcontroler dedicat rețelelor mesh IEEE 802.15.4 (Thread/Zigbee) + BLE 5.0 fără consumul Wi-Fi.",
    bestFor: [
      "Senzori pe baterie pastilă Matter-over-Thread pentru uși și climă",
      "Întrerupătoare, variatoare și becuri inteligente Zigbee 3.0",
      "Coprocesoare radio 802.15.4 RCP și BLE Mesh",
    ],
    gotcha:
      "ESP32-H2 NU are radio Wi-Fi prin design — conectează-l printr-un Thread Border Router pentru acces la rețeaua IP.",
    usb: "Dual USB-C (USB Serial/JTAG nativ + punte UART)",
    psramSpec: "Fără (320 KB SRAM + 4 KB memorie LP)",
    flashSpec: "4 MB Flash în capsulă",
  },
  "esp32-s2-devkitc-1": {
    tagline:
      "Placă bogată în pini (43 GPIO) cu Wi-Fi, USB-OTG nativ, două DAC-uri pe 8 biți și 14 canale tactile.",
    bestFor: [
      "Tastaturi USB-HID, macro pad-uri și gadgeturi CircuitPython",
      "Panouri cu mulți senzori și butoane tactile capacitive",
      "Tablouri web Wi-Fi cu ieșire analogică DAC hardware",
    ],
    gotcha:
      "ESP32-S2 NU are Bluetooth (nici Classic, nici BLE). Dacă ai nevoie și de BLE lângă USB-OTG, alege ESP32-S3.",
    usb: "Dual Micro-USB (USB-OTG nativ + punte UART)",
    psramSpec: "Opțional 2 MB PSRAM (SOLO-2-N4R2)",
    flashSpec: "4 MB SPI Flash",
  },
  "esp32-devkitc-v4": {
    tagline:
      "Placa clasică ESP32 originală — singura familie cu suport Bluetooth Classic A2DP audio și SPP.",
    bestFor: [
      "Boxe audio Bluetooth Classic A2DP și punți seriale SPP",
      "Tutoriale clasice Arduino / ESP-IDF și proiecte Ethernet RMII",
      "Generare de semnale analogice prin cele 2 DAC-uri pe 8 biți",
    ],
    gotcha:
      "Având lățimea de 27.90 mm, lasă un singur rând liber pe breadboard. Pinii GPIO34–39 sunt strict doar de intrare (fără pull-up intern).",
    usb: "Micro-USB (punte CP2102N USB-UART)",
    psramSpec: "4–8 MB pe WROVER-E (Fără pe WROOM-32E)",
    flashSpec: "4 MB până la 16 MB SPI Flash",
  },
  "esp32-c5-devkitc-1": {
    tagline:
      "Primul microcontroler RISC-V Espressif cu Wi-Fi 6 Dual-Band (2.4 și 5 GHz), 802.15.4 și BLE 5.0.",
    bestFor: [
      "Telemetrie 5 GHz Wi-Fi 6 cu latență mică în clădiri aglomerate pe 2.4 GHz",
      "Streaming audio/video rapid și punți wireless",
      "Hub-uri Matter dual-band și gateway-uri IoT industriale",
    ],
    gotcha:
      "Wi-Fi 5 GHz necesită o antenă dual-band acordată atât pentru 2.4 GHz cât și pentru 5.15–5.85 GHz; verifică regiunea radio în menuconfig.",
    usb: "Dual USB-C (USB Serial/JTAG nativ + punte UART)",
    psramSpec: "Suportă Quad PSRAM extern",
    flashSpec: "8 MB SPI Flash (extern)",
  },
  "esp32-p4-ev": {
    tagline:
      "Platformă multimedia și Edge-AI RISC-V dual-core la 400 MHz cu MIPI-CSI, MIPI-DSI, H.264 și Ethernet 100M.",
    bestFor: [
      "Camere 1080p H.264, procesare ISP și recunoaștere facială",
      "Ecrane tactile MIPI-DSI de 7 inch la 60 FPS (LVGL)",
      "Panouri HMI cu USB 2.0 High-Speed (480 Mbps) și Ethernet",
    ],
    gotcha:
      "Cipul ESP32-P4 nu include radio wireless intern; placa EV folosește un coprocesor ESP32-C6-MINI-1 conectat prin SDIO.",
    usb: "USB 2.0 High-Speed OTG (480 Mbps) + USB-C UART/JTAG",
    psramSpec: "16 MB / 32 MB PSRAM în capsulă",
    flashSpec: "16 MB NOR Flash + slot microSD",
  },
};

const DOC_PORTALS_RO: Record<string, { title: string; summary: string; appliesTo: string }> = {
  "doc-idf-stable": {
    title: "Ghid Oficial de Programare ESP-IDF (Stabil)",
    appliesTo: "Toate Familiile ESP32",
    summary:
      "Documentație completă API C/C++, nucleu FreeRTOS SMP, tabele de partiții, NVS, OTA și drivere periferice.",
  },
  "doc-devkits": {
    title: "Ghiduri Oficiale Plăci ESP-Dev-Kits",
    appliesTo: "S3, C3, C6, H2, S2, C5, P4",
    summary:
      "Desene mecanice oficiale (mm), diagrame pinout, mape jumperi și scheme electrice PDF pentru fiecare DevKit.",
  },
  "doc-hw-design": {
    title: "Ghid Proiectare Hardware PCB ESP32-S3",
    appliesTo: "PCB-uri Custom ESP32-S3",
    summary:
      "Decuplare alimentare, trasee cristal 40 MHz, adaptare antenă RF, perechi diferențiale USB și reguli strapping.",
  },
  "doc-hw-c6": {
    title: "Ghid Proiectare Hardware PCB ESP32-C6",
    appliesTo: "PCB-uri Custom ESP32-C6",
    summary:
      "Checklist layout PCB pentru Wi-Fi 6 + 802.15.4, zone libere de cupru pentru antenă și domeniul RTC de consum redus.",
  },
  "doc-matter": {
    title: "Documentație Oficială SDK ESP-Matter",
    appliesTo: "ESP32-C6, H2, S3, C3",
    summary:
      "Dezvoltă accesorii smart-home certificate Matter-over-Wi-Fi și Matter-over-Thread compatibile Apple/Google/Alexa.",
  },
  "doc-zigbee": {
    title: "Documentație Oficială ESP-Zigbee-SDK",
    appliesTo: "ESP32-C6, ESP32-H2, ESP32-C5",
    summary:
      "Stivă IEEE 802.15.4 Zigbee 3.0 pentru coordonator, router și dispozitive pe baterie cu exemple de clustere ZCL.",
  },
  "doc-espnow": {
    title: "Referință Protocol Wireless ESP-NOW",
    appliesTo: "ESP32, S2, S3, C3, C6, C5",
    summary:
      "Protocol 2.4 GHz direct între plăci cu latență sub 5 ms, criptare AES-CCMP și mod de rază lungă (LR).",
  },
  "doc-tech-portal": {
    title: "Documente Tehnice și Erate Espressif",
    appliesTo: "Toate Cipurile și Modulele",
    summary:
      "Arhivă centrală pentru fișe tehnice PDF, manuale TRM, erate de siliciu și certificări radio.",
  },
};

// ============================================================================
// 5. KIT PARTS (5 Componente Kit)
// ============================================================================
const KIT_RO: Record<
  string,
  { name: string; category: string; voltage: string; iface: string; pins: string; specs: string[] }
> = {
  esp32s3: {
    name: "Placă ESP32-S3-DevKitC-1 (N16R8)",
    category: "Placă Microcontroler",
    voltage: "5V USB / Logică 3.3V",
    iface: "Dual USB-C (UART + OTG)",
    pins: "44 Pini (2 rânduri)",
    specs: [
      "Procesor Dual-Core Xtensa LX7 @ 240 MHz",
      "16 MB Memorie Flash + 8 MB Octal PSRAM",
      "Wi-Fi 4 + BLE 5.0 + LED RGB WS2812 pe placă",
    ],
  },
  oled: {
    name: 'Ecran OLED Monocrom SSD1306 0.96"',
    category: "Afișaj / Ecran",
    voltage: "3.3V",
    iface: "I2C (Adresă 0x3C)",
    pins: "GPIO8 (SDA), GPIO9 (SCL)",
    specs: [
      "128×64 pixeli auto-iluminați (contrast excelent)",
      "Consum foarte mic, fără iluminare de fundal",
      "Magistrală I2C Fast-Mode la 400 kHz",
    ],
  },
  rfid: {
    name: "Kit Cititor RFID MFRC522 13.56 MHz",
    category: "Radio RF / NFC",
    voltage: "DOAR 3.3V!",
    iface: "SPI2 (4 MHz)",
    pins: "GPIO10–13 (SPI2) + GPIO9 (RST)",
    specs: [
      "Citește și scrie carduri ISO14443-A și MIFARE",
      "Include 1× Card S50 + 1× Breloc RFID",
      "Distanță de citire 3–5 cm",
    ],
  },
  amp: {
    name: "Amplificator Audio I2S MAX98357A + Difuzor 3W",
    category: "Sunet / Audio I2S",
    voltage: "5V VIN / Logică 3.3V",
    iface: "I2S (BCLK, LRC, DIN)",
    pins: "GPIO4, GPIO5, GPIO6",
    specs: [
      "Putere 3.2W pe difuzor de 4Ω (fără filtru extern)",
      "Câștig selectabil hardware (3dB–15dB)",
      "Nu necesită semnal separat MCLK",
    ],
  },
  breadboard: {
    name: "Breadboard 830 Puncte și Set Fire Jumper",
    category: "Prototipare",
    voltage: "Pasiv",
    iface: "Pas standard 2.54 mm",
    pins: "Linii duble alimentare",
    specs: [
      "Compatibil cu ESP32-S3-DevKitC-1",
      "Fire Dupont Tată-Tată și Tată-Mamă de 20 cm",
      "Cod de culori pentru alimentare și semnale",
    ],
  },
};

// ============================================================================
// 6. CHIP BLOCKS, REGISTERS, MEMORY, POWER MODES
// ============================================================================
const CHIP_BLOCKS_RO: Record<
  string,
  { name: string; freq: string; summary: string; specs: string[]; gotcha: string }
> = {
  cpu: {
    name: "Procesor Dual-Core Xtensa LX7",
    freq: "Până la 240 MHz",
    summary:
      "Microprocesor dual-core pe 32 biți cu instrucțiuni vectoriale (PIE) pentru rețele neuronale și procesare DSP.",
    specs: [
      "2× nuclee Xtensa LX7 (Core 0 PRO, Core 1 APP)",
      "Unitate FPU în virgulă mobilă + SIMD AI",
      "Putere de calcul până la 600 DMIPS",
    ],
    gotcha:
      "Stivele Wi-Fi și BLE rulează implicit pe Core 0; fixează buclele audio/DSP sau UI pe Core 1.",
  },
  radio: {
    name: "Radio Wi-Fi 4 și Bluetooth 5.0 LE",
    freq: "2.4 GHz ISM",
    summary:
      "Transceiver RF integrat de 2.4 GHz cu suport 802.11 b/g/n și Bluetooth 5 LE cu rază extinsă (Coded PHY).",
    specs: [
      "Wi-Fi HT40 până la 150 Mbps",
      "BLE 5.0 2M PHY și Coded PHY (rază lungă)",
      "Putere TX până la +20 dBm Wi-Fi / +9 dBm BLE",
    ],
    gotcha:
      "Canalele ADC2 nu pot fi citite cât timp Wi-Fi este activ. Folosește mereu ADC1 (GPIO1–10) pentru senzori analogici.",
  },
  gdma: {
    name: "Motor DMA General (GDMA)",
    freq: "5 TX / 5 RX",
    summary:
      "Motor DMA partajat ce permite perifericelor (SPI, I2S, AES, ADC) să transfere date direct în RAM fără a bloca procesorul.",
    specs: [
      "5 canale independente TX și 5 RX",
      "Buffere circulare cu descriptori înlănțuiți",
      "Funcționează cu SRAM intern și Octal PSRAM",
    ],
    gotcha: "Bufferele DMA trebuie aliniate la 4 octeți (și la linia de cache când sunt în PSRAM).",
  },
  spi: {
    name: "Controllere SPI2 și SPI3",
    freq: "Până la 80 MHz",
    summary:
      "Magistrale SPI rapide full-duplex cu pini nativi IOMUX și rutare flexibilă prin Matricea GPIO.",
    specs: [
      "SPI0/1 rezervate pentru Flash și PSRAM",
      "SPI2 (FSPI) nativ pe GPIO10–13",
      "Suport Quad/Octal și transferuri DMA",
    ],
    gotcha:
      "Rutarea SPI prin Matricea GPIO limitează frecvența sigură la ~40 MHz față de 80 MHz pe pinii nativi IOMUX.",
  },
  i2c: {
    name: "Controllere I2C (×2)",
    freq: "100k / 400k Hz",
    summary:
      "Două interfețe I2C independente în mod Master sau Slave, adresare pe 7/10 biți și buffere FIFO hardware.",
    specs: [
      "Mod Standard (100 kHz) și Fast Mode (400 kHz)",
      "FIFO hardware TX/RX de 32 octeți",
      "Poate folosi aproape orice pin GPIO liber",
    ],
    gotcha:
      "Rezistoarele pull-up interne (~45 kΩ) sunt slabe; adaugă pull-up extern de 4.7 kΩ pentru fire lungi sau 400 kHz.",
  },
  i2s: {
    name: "Motoare Audio I2S (×2)",
    freq: "Până la 192 kHz",
    summary:
      "Interfețe audio digitale dedicate ce suportă standardul Philips, PDM și formate multi-canal TDM.",
    specs: [
      "Eșantioane PCM pe 16 / 24 / 32 biți",
      "Divizor fracțional de ceas PLL",
      "Streaming circular GDMA fără jitter",
    ],
    gotcha: "Golește (umple cu 0) bufferele DMA înainte de oprirea I2S pentru a evita pocniturile în difuzor.",
  },
  rmt: {
    name: "RMT (Control Impulsuri & LED RGB)",
    freq: "Ceas 80 MHz",
    summary:
      "Transceiver cu 8 canale de precizie nanosecundă, ideal pentru telecomenzi IR și benzi LED WS2812.",
    specs: [
      "4 canale TX + 4 canale RX independente",
      "Rezoluție temporală de 12.5 ns",
      "Memorie hardware dedicată pentru simboluri",
    ],
    gotcha: "LED-urile WS2812 așteaptă ordinea octeților GRB (Verde-Roșu-Albastru), nu RGB!",
  },
  ledc: {
    name: "Controller PWM LEDC",
    freq: "8 Canale",
    summary:
      "Generator PWM hardware cu 4 timere, rezoluție până la 14 biți și tranziții automate (fade) fără CPU.",
    specs: [
      "8 canale de ieșire PWM independente",
      "Întreruperi hardware pentru fade liniar",
      "Actualizare fără artefacte a factorului de umplere",
    ],
    gotcha:
      "Frecvențele PWM foarte mari scad rezoluția maximă (ex: 40 MHz la 1 bit vs ~5 kHz la 13 biți).",
  },
  adc: {
    name: "Convertor Analog-Digital SAR ADC (×2)",
    freq: "20 Canale",
    summary:
      "Două convertoare pe 12 biți cu curbe de calibrare din fabrică (eFuse) și eșantionare continuă prin DMA.",
    specs: [
      "ADC1: GPIO1–10 (10 canale, sigur cu Wi-Fi)",
      "ADC2: GPIO11–20 (10 canale)",
      "Atenuare configurabilă până la ~3.1V",
    ],
    gotcha:
      "Folosește mereu calibrarea adc_cali_curve_fitting — citirile brute ADC sunt neliniare aproape de 0V și 3.3V.",
  },
  crypto: {
    name: "Acceleratoare Criptografice Hardware",
    freq: "AES / SHA / RSA",
    summary:
      "Blocuri hardware dedicate pentru TLS/HTTPS, Secure Boot v2, criptarea Flash și generare chei HMAC.",
    specs: [
      "AES-128/256 asistat de GDMA",
      "SHA-1/256/512 și RSA-4096",
      "Generator adevărat de numere aleatoare (TRNG)",
    ],
    gotcha: "TRNG necesită activarea subsistemului RF sau ADC pentru entropie fizică reală.",
  },
  ulp: {
    name: "Coprocesor ULP RISC-V",
    freq: "17.5 MHz",
    summary:
      "Nucleu RISC-V ultra-eficient ce rulează în Deep-Sleep (~7 µA) pentru a citi senzori și a trezi procesorul principal.",
    specs: [
      "Rulează din cei 16 KB RTC SRAM",
      "Acces la pini RTC GPIO, ADC și I2C",
      "Trezește nucleele LX7 la depășirea unui prag",
    ],
    gotcha: "Doar pinii GPIO0–21 au funcție RTC și pot fi accesați de coprocesorul ULP în Deep-Sleep.",
  },
};

const REGISTERS_RO: Record<string, string> = {
  GPIO_OUT_REG:
    "Registrul de nivel de ieșire pentru GPIO0–GPIO31. Scrierea valorii 1 pune pinul în HIGH (3.3V), dacă ieșirea este activată în GPIO_ENABLE_REG.",
  GPIO_ENABLE_REG:
    "Registrul de activare ieșire pentru GPIO0–GPIO31. Setarea bitului N la 1 configurează GPION ca pin de ieșire (OUTPUT).",
  LEDC_CH0_CONF0_REG:
    "Registrul 0 de configurare pentru canalul PWM LEDC 0 (selecție timer, activare ieșire, nivel inactiv, contor overflow).",
};

const MEMORY_RO: Record<string, { name: string; desc: string }> = {
  "Internal ROM": {
    name: "ROM Intern",
    desc: "Bootloader-ul de nivel 1 imuabil, driverele ROM USB-CDC/JTAG și rutine standard matematice/cripto.",
  },
  "Internal SRAM": {
    name: "SRAM Intern",
    desc: "Memorie rapidă într-un singur ciclu împărțită între cod (IRAM), date (DRAM) și buffere DMA.",
  },
  "RTC Fast & Slow SRAM": {
    name: "SRAM RTC Rapid & Lent",
    desc: "Păstrată în timpul Deep-Sleep. Stochează codul ULP RISC-V și variabilele RTC_DATA_ATTR.",
  },
  "External Octal PSRAM": {
    name: "Octal PSRAM Extern",
    desc: "RAM extern de mare capacitate mapat prin cache L1. Ideal pentru ecrane grafice, imagini și audio.",
  },
  "External QSPI Flash": {
    name: "Flash QSPI Extern",
    desc: "Stochează firmware-ul aplicației, setările NVS, sistemul de fișiere LittleFS și partițiile OTA.",
  },
};

const POWER_MODES_RO: Record<string, { name: string; desc: string }> = {
  active: { name: "Activ (Wi-Fi / BLE TX)", desc: "Dual-core 240 MHz + radio RF pornit" },
  modem: { name: "Modem-Sleep", desc: "CPU activ, radio Wi-Fi/BLE oprit între pachete" },
  light: { name: "Light-Sleep", desc: "240 µA — CPU oprit, RAM și starea pinilor păstrate" },
  deep: { name: "Deep-Sleep (ULP)", desc: "7 µA — Doar RTC și coprocesorul ULP alimentate" },
};

const POWER_PRESETS_RO: Record<string, string> = {
  "ULP Weather Node": "Stație Meteo ULP",
  "BLE Beacon": "Baliză BLE",
  "Wi-Fi Sensor": "Senzor Wi-Fi",
  "Always-On Audio": "Audio Continuu",
};

// ============================================================================
// 7. CODE TOURS & GLOSSARY
// ============================================================================
const GLOSSARY_RO: Record<string, { category: string; desc: string; tip: string }> = {
  gpio_config_t: {
    category: "Driver GPIO",
    desc: "Structură de configurare ce definește masca de pini (pin_bit_mask), modul (INPUT/OUTPUT), rezistoarele pull-up/pull-down și întreruperile.",
    tip: "Folosește mereu (1ULL << GPIO_NUM) la pin_bit_mask pentru ca pinii >= 32 să nu depășească un întreg pe 32 biți!",
  },
  gpio_config: {
    category: "Driver GPIO",
    desc: "Aplică direcția, rezistoarele pull și întreruperile tuturor pinilor bifați în pin_bit_mask.",
    tip: "Apelează o singură dată la inițializare, în loc să configurezi fiecare pin separat într-o buclă.",
  },
  gpio_set_level: {
    category: "Driver GPIO",
    desc: "Setează starea logică de ieșire (0 = LOW / 0V, 1 = HIGH / 3.3V) a unui pin GPIO configurat ca ieșire.",
    tip: "Intern, scrie atomic în registrele GPIO_OUT_W1TS_REG sau GPIO_OUT_W1TC_REG.",
  },
  vTaskDelay: {
    category: "FreeRTOS",
    desc: "Pune în pauză sarcina curentă pentru un număr de tick-uri RTOS, lăsând CPU-ul altor sarcini și resetând Watchdog-ul.",
    tip: "Folosește pdMS_TO_TICKS(ms) pentru a converti curat milisecundele indiferent de CONFIG_FREERTOS_HZ.",
  },
  pdMS_TO_TICKS: {
    category: "Macro FreeRTOS",
    desc: "Convertește durata din milisecunde în tick-uri FreeRTOS (implicit 100 Hz = 10 ms per tick în ESP-IDF).",
    tip: "Întârzierile mai mici de 10 ms devin 0 tick-uri; pentru microsecunde folosește esp_rom_delay_us().",
  },
  i2c_param_config: {
    category: "Driver I2C",
    desc: "Configurează pinii SDA/SCL, pull-up-urile interne, modul Master/Slave și frecvența ceasului (până la 400 kHz).",
    tip: "Semnalele trec prin Matricea GPIO a ESP32-S3, deci aproape orice pin liber poate fi SDA sau SCL.",
  },
  i2c_driver_install: {
    category: "Driver I2C",
    desc: "Alocă rutinele de întrerupere și bufferele pentru controller-ul I2C ales (I2C_NUM_0 sau I2C_NUM_1).",
    tip: "În modul Master, rx_buf_len și tx_buf_len trebuie lăsate pe 0.",
  },
  spi_bus_initialize: {
    category: "SPI Master",
    desc: "Inițializează pinii SPI2_HOST sau SPI3_HOST (MOSI, MISO, SCLK) și asociază un canal GDMA pentru viteză mare.",
    tip: "Trimite SPI_DMA_CH_AUTO ca ESP-IDF să aleagă automat un canal GDMA liber.",
  },
  spi_bus_add_device: {
    category: "SPI Master",
    desc: "Atașează un dispozitiv SPI (precum MFRC522) cu propriul său pin Chip Select (CS), frecvență și mod SPI (0–3).",
    tip: "Mai multe module SPI pot partaja MOSI/MISO/SCLK atâta timp cât fiecare are un pin CS separat.",
  },
  esp_ble_gap_start_advertising: {
    category: "BLE GAP",
    desc: "Începe difuzarea pachetelor Bluetooth LE pe canalele RF 37, 38 și 39 pentru ca telefoanele să găsească placa.",
    tip: "Un interval între 100 ms și 500 ms oferă echilibrul optim între conectare rapidă și consum redus.",
  },
  esp_ble_gatts_register_callback: {
    category: "Server BLE GATT",
    desc: "Înregistrează funcția apelată la conectare, deconectare, citire, scriere și activare notificări GATT.",
    tip: "Păstrează callback-urile GATT rapide și neblocante; mută munca grea într-o coadă FreeRTOS.",
  },
  i2s_new_channel: {
    category: "Driver I2S v5",
    desc: "Alocă un canal hardware I2S TX/RX cu buffere și descriptori DMA pentru redare audio.",
    tip: "ESP-IDF v5 a introdus noul API bazat pe canale în locul vechiului i2s_driver_install().",
  },
  i2s_channel_write: {
    category: "Driver I2S v5",
    desc: "Copiază eșantioanele audio PCM în inelul GDMA pentru redare continuă către amplificatorul MAX98357A.",
    tip: "Așteaptă curat prin semafor FreeRTOS eliberarea unui buffer DMA — ideal pentru sinteza audio.",
  },
  ESP_ERROR_CHECK: {
    category: "Diagnostic",
    desc: "Verifică dacă o funcție ESP-IDF a returnat ESP_OK; altfel afișează fișierul, linia și eroarea și oprește execuția.",
    tip: "Esențial la inițializare pentru a depista imediat greșelile de configurare hardware.",
  },
  ESP_LOGI: {
    category: "Jurnalizare",
    desc: "Trimite un mesaj formatat de nivel INFO cu marcaj temporal în milisecunde pe UART0 sau USB-Serial-JTAG.",
    tip: "Poți controla nivelul de detalii per etichetă la rulare prin esp_log_level_set().",
  },
};

const CODE_TOURS_RO: Record<string, { title: string; steps: { title: string; text: string }[] }> = {
  blink: {
    title: "Aprindere LED & RGB (GPIO)",
    steps: [
      {
        title: "Definirea Pinilor",
        text: "GPIO48 comandă LED-ul RGB integrat pe DevKitC-1, iar GPIO0 este conectat la butonul tactil BOOT.",
      },
      {
        title: "Configurarea Ieșirii GPIO",
        text: "Construim o mască pe 64 biți (obligatoriu pentru GPIO >= 32!) și o aplicăm prin gpio_config(), actualizând GPIO_ENABLE1_REG.",
      },
      {
        title: "Buclă Neblocantă FreeRTOS",
        text: "gpio_set_level() comută atomic pinul, iar vTaskDelay() cedează procesorul 500 ms ca Watchdog-ul să rămână fericit.",
      },
    ],
  },
  oled: {
    title: "Ecran OLED I2C (SSD1306)",
    steps: [
      {
        title: "Magistrala I2C și Adresa",
        text: 'GPIO8 (SDA) și GPIO9 (SCL) sunt rutate prin Matricea GPIO. Majoritatea ecranelor OLED 0.96" răspund la adresa 0x3C.',
      },
      {
        title: "Configurare Fast-Mode 400 kHz",
        text: "Activăm pull-up-urile interne pentru fire scurte pe breadboard și setăm ceasul la 400 kHz pentru animații fluide.",
      },
      {
        title: "Instalarea Driverului Hardware",
        text: "i2c_param_config() scrie registrele de temporizare, iar i2c_driver_install() activează FIFO-ul și întreruperile I2C0.",
      },
    ],
  },
  rfid: {
    title: "Cititor RFID SPI (MFRC522)",
    steps: [
      {
        title: "Pini Nativi SPI2 IOMUX",
        text: "GPIO10–13 sunt pinii nativi FSPI (SPI2) ai ESP32-S3, ocolind Matricea GPIO pentru semnale curate la viteză mare.",
      },
      {
        title: "Inițializare Magistrală + GDMA",
        text: "spi_bus_initialize() rezervă SPI2_HOST și alege automat un canal GDMA pentru transferuri rapide.",
      },
      {
        title: "Atașarea Modulului MFRC522",
        text: "MFRC522 folosește SPI Mod 0 (CPOL=0, CPHA=0) până la 10 MHz; 4 MHz merge impecabil pe fire jumper.",
      },
    ],
  },
  ble: {
    title: "Server Bluetooth 5.0 GATT",
    steps: [
      {
        title: "Interval și Canale Advertising",
        text: "Valorile 0x20–0x40 corespund unui interval de 20–40 ms pe toate cele trei canale BLE 2.4 GHz (37, 38, 39).",
      },
      {
        title: "Înregistrare Handler Evenimente GATT",
        text: "esp_ble_gatts_register_callback() conectează funcțiile de citire, scriere și notificare pentru caracteristicile tale.",
      },
      {
        title: "Pornirea Difuzării RF",
        text: "esp_ble_gap_start_advertising() pornește emisia BLE 5.0 astfel încât telefoanele din apropiere să se poată conecta.",
      },
    ],
  },
  sound: {
    title: "Sintetizator Audio I2S (MAX98357A)",
    steps: [
      {
        title: "Magistrală Audio I2S pe 3 Fire",
        text: "MAX98357A are nevoie doar de BCLK (ceas biți), LRC (selecție canal) și DIN (date PCM) — fără fir MCLK!",
      },
      {
        title: "Alocare Canal I2S TX",
        text: "i2s_new_channel() configurează I2S0 în mod Master și pregătește bufferele circulare GDMA.",
      },
      {
        title: "Redare PCM 16-Biți prin GDMA",
        text: "Umplem un tabel de 256 eșantioane sinusoidale și îl trimitem prin i2s_channel_write() pentru redare continuă.",
      },
    ],
  },
};

// ============================================================================
// 8. PINOUT NOTES & PERIPHERAL MODULES
// ============================================================================
const PINS_RO: Record<string, { notes: string; strapping?: string; gotcha?: string }> = {
  L1: { notes: "Ieșire alimentare stabilizată 3.3V (max ~500mA din regulatorul LDO)." },
  L2: { notes: "Ieșire alimentare stabilizată 3.3V." },
  L3: { notes: "Activare / Resetare Cip (Activ pe LOW). Legat la butonul RST/EN." },
  L4: { notes: "GPIO curat multifuncțional. Excelent pentru I2S BCLK sau ADC1." },
  L5: { notes: "GPIO curat multifuncțional. Ideal pentru I2S LRC / WS." },
  L6: { notes: "GPIO curat multifuncțional. Ideal pentru I2S DIN." },
  L7: { notes: "GPIO general cu suport ADC1 și senzor tactil capacitiv." },
  L8: { notes: "Pin opțional XTAL_32K_P. ADC2 nu poate fi folosit simultan cu Wi-Fi." },
  L9: { notes: "Pin opțional XTAL_32K_N. ADC2 indisponibil când Wi-Fi este activ." },
  L10: { notes: "Candidat implicit UART1 TX. ADC2 intră în conflict cu Wi-Fi." },
  L11: { notes: "Candidat implicit UART1 RX. ADC2 intră în conflict cu Wi-Fi." },
  L12: { notes: "Pin recomandat I2C0 SDA pe ESP32-S3." },
  L13: {
    strapping: "Selecție sursă semnal JTAG (flotant implicit).",
    gotcha: "Pin strapping: contează doar dacă s-a ars eFuse EFUSE_STRAP_JTAG_SEL.",
    notes: "GPIO cu ADC1_CH2 și Touch3, cu funcție opțională strapping JTAG.",
  },
  L14: {
    strapping: "Control mod boot și mesaje ROM (pull-down intern).",
    gotcha: "Pin strapping! NU trebuie tras la HIGH în timpul resetării, altfel placa nu pornește.",
    notes: "GPIO strapping sigur pentru intrări, cu pull-down intern.",
  },
  L15: { notes: "Pin recomandat I2C0 SCL. Folosit și ca MFRC522 RST în laboratoarele RFID." },
  L16: { notes: "Pin nativ SPI2 (FSPI) CS0." },
  L17: { notes: "Pin nativ SPI2 (FSPI) MOSI (FSPID)." },
  L18: { notes: "Pin nativ SPI2 (FSPI) SCK (FSPICLK)." },
  L19: { notes: "Pin nativ SPI2 (FSPI) MISO (FSPIQ)." },
  L20: { notes: "SPI2 WP / GPIO de uz general." },
  L21: { notes: "Alimentare 5V direct din USB VBUS (prin diodă de protecție). Alimentează MAX98357A." },
  L22: { notes: "Masă comună (GND / 0V)." },
  R1: { notes: "Masă comună (GND / 0V)." },
  R2: {
    notes: "UART0 TX (conectat la puntea USB-UART de pe placă).",
    gotcha: "Trimite log-uri ROM la 115200 baud în timpul pornirii.",
  },
  R3: {
    notes: "UART0 RX (conectat la puntea USB-UART de pe placă).",
    gotcha: "Partajat cu puntea USB-UART; evită sarcini electrice mari.",
  },
  R4: { notes: "GPIO curat de uz general cu ADC1 și senzor tactil." },
  R5: { notes: "GPIO curat de uz general cu ADC1 și senzor tactil." },
  R6: { notes: "MTMS (JTAG) / GPIO de uz general." },
  R7: { notes: "MTDI (JTAG) / GPIO de uz general." },
  R8: { notes: "MTDO (JTAG) / GPIO de uz general." },
  R9: { notes: "MTCK (JTAG) / GPIO de uz general." },
  R10: { notes: "GPIO de uz general (sigur pe plăcile N8R8 / N16R8)." },
  R11: {
    gotcha: "PERICOL OCTAL PSRAM: Rezervat pe modulele N8R8 / N16R8 pentru memoria Octal PSRAM! Nu folosi extern.",
    notes: "Conectat intern la memoria Octal PSRAM pe variantele R8.",
  },
  R12: {
    gotcha: "PERICOL OCTAL PSRAM: Rezervat pe modulele N8R8 / N16R8 pentru memoria Octal PSRAM!",
    notes: "Conectat intern la memoria Octal PSRAM pe variantele R8.",
  },
  R13: {
    gotcha: "PERICOL OCTAL PSRAM: Rezervat pe modulele N8R8 / N16R8 pentru memoria Octal PSRAM!",
    notes: "Conectat intern la memoria Octal PSRAM pe variantele R8.",
  },
  R14: {
    strapping: "Selecție Mod Boot (HIGH = Pornire Flash, LOW = Mod Programare/Download).",
    gotcha: "Legat la butonul BOOT de pe placă. Menținerea pe LOW la reset intră în bootloader!",
    notes: "Butonul tactil BOOT de pe placă și pin strapping.",
  },
  R15: {
    strapping: "Selecție Tensiune VDD_SPI (LOW = 3.3V, HIGH = 1.8V).",
    gotcha: "PIN STRAPPING CRITIC: Dacă GPIO45 e tras la HIGH la pornire, Flash-ul trece pe 1.8V și placa nu mai bootează!",
    notes: "Pin strapping tensiune VDD_SPI (trebuie să rămână LOW la boot).",
  },
  R16: { notes: "Conectat la LED-ul RGB adresabil WS2812 integrat pe DevKitC-1 v1.1." },
  R17: { notes: "GPIO de uz general." },
  R18: { notes: "GPIO curat de uz general. Alternativă excelentă pentru I2C sau linii Reset." },
  R19: {
    gotcha: "USB D+ Nativ (USB-OTG / USB-Serial-JTAG). Evită dacă folosești portul USB nativ.",
    notes: "Pereche diferențială USB_D+.",
  },
  R20: {
    gotcha: "USB D- Nativ (USB-OTG / USB-Serial-JTAG). Evită dacă folosești portul USB nativ.",
    notes: "Pereche diferențială USB_D-.",
  },
  R21: { notes: "Masă comună (GND / 0V)." },
  R22: { notes: "Masă comună (GND / 0V)." },
};

const MODULES_RO: Record<string, string> = {
  oled: "Ecran OLED SSD1306 (I2C)",
  rfid: "Cititor RFID MFRC522 (SPI2)",
  i2s: "Amplificator MAX98357A (I2S)",
  rgb: "LED RGB de pe Placă",
  hazard: "SPI Extern Rapid (Demo Conflict)",
};

// ============================================================================
// PUBLIC LOCALIZATION HELPERS
// ============================================================================
export function localizeTrack(track: TrackMeta, lang: Lang): TrackMeta {
  if (lang !== "ro") return track;
  const ov = TRACKS_RO[track.id];
  return ov ? { ...track, name: ov.name, desc: ov.desc } : track;
}

export function localizeLab(lab: LabItem, lang: Lang): LabItem {
  if (lang !== "ro") return lab;
  const ov = LABS_RO[lab.id];
  return ov ? { ...lab, title: ov.title, summary: ov.summary } : lab;
}

export function localizeIdea(idea: ProjectIdea, lang: Lang): ProjectIdea {
  if (lang !== "ro") return idea;
  const ov = IDEAS_RO[idea.id];
  return ov
    ? {
        ...idea,
        title: ov.title,
        buildTime: ov.buildTime,
        summary: ov.summary,
        parts: ov.parts,
        steps: ov.steps,
      }
    : idea;
}

export function localizeBoard(board: EspBoardSpec, lang: Lang): EspBoardSpec {
  if (lang !== "ro") return board;
  const ov = BOARDS_RO[board.id];
  return ov
    ? {
        ...board,
        tagline: ov.tagline,
        bestFor: ov.bestFor,
        gotcha: ov.gotcha,
        usb: ov.usb,
        psramSpec: ov.psramSpec,
        flashSpec: ov.flashSpec,
      }
    : board;
}

export function localizeDocPortal(doc: OfficialDocResource, lang: Lang): OfficialDocResource {
  if (lang !== "ro") return doc;
  const ov = DOC_PORTALS_RO[doc.id];
  return ov ? { ...doc, title: ov.title, summary: ov.summary, appliesTo: ov.appliesTo } : doc;
}

export function localizeKitPart(part: KitPart, lang: Lang): KitPart {
  if (lang !== "ro") return part;
  const ov = KIT_RO[part.id];
  return ov ? { ...part, ...ov } : part;
}

export function localizeChipBlock(block: ChipBlock, lang: Lang): ChipBlock {
  if (lang !== "ro") return block;
  const ov = CHIP_BLOCKS_RO[block.id];
  return ov ? { ...block, ...ov } : block;
}

export function localizeRegister(reg: RegisterDef, lang: Lang): RegisterDef {
  if (lang !== "ro") return reg;
  const desc = REGISTERS_RO[reg.id];
  return desc ? { ...reg, desc } : reg;
}

export function localizeMemoryRegion(region: MemoryRegion, lang: Lang): MemoryRegion {
  if (lang !== "ro") return region;
  const ov = MEMORY_RO[region.name];
  return ov ? { ...region, name: ov.name, desc: ov.desc } : region;
}

export function localizePowerMode(mode: PowerMode, lang: Lang): PowerMode {
  if (lang !== "ro") return mode;
  const ov = POWER_MODES_RO[mode.id];
  return ov ? { ...mode, name: ov.name, desc: ov.desc } : mode;
}

export function localizePowerPresetLabel(label: string, lang: Lang): string {
  if (lang !== "ro") return label;
  return POWER_PRESETS_RO[label] ?? label;
}

export function localizeGlossary(key: string, entry: GlossaryEntry, lang: Lang): GlossaryEntry {
  if (lang !== "ro") return entry;
  const ov = GLOSSARY_RO[key];
  return ov ? { ...entry, category: ov.category, desc: ov.desc, tip: ov.tip } : entry;
}

export function localizeCodeTour(tour: CodeTour, lang: Lang): CodeTour {
  if (lang !== "ro") return tour;
  const ov = CODE_TOURS_RO[tour.id];
  if (!ov) return tour;
  return {
    ...tour,
    title: ov.title,
    steps: tour.steps.map((s, idx) =>
      ov.steps[idx] ? { ...s, title: ov.steps[idx].title, text: ov.steps[idx].text } : s,
    ),
  };
}

export function localizePin(pin: PinDef, lang: Lang): PinDef {
  if (lang !== "ro") return pin;
  const ov = PINS_RO[pin.id];
  return ov
    ? {
        ...pin,
        notes: ov.notes,
        strapping: ov.strapping ?? pin.strapping,
        gotcha: ov.gotcha ?? pin.gotcha,
      }
    : pin;
}

export function localizeModule(mod: PeripheralModule, lang: Lang): PeripheralModule {
  if (lang !== "ro") return mod;
  const name = MODULES_RO[mod.id];
  return name ? { ...mod, name } : mod;
}
