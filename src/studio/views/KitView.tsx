import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Cloud,
  Copy,
  Database,
  Download,
  ImagePlus,
  Lock,
  Minus,
  Package,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { pickText } from "../data/flipper";
import {
  INVENTORY_PARTS,
  INVENTORY_PRESETS,
  type InventoryCategory,
} from "../data/inventory";
import { KIT_PARTS } from "../data/kit";
import { localizeKitPart } from "../data/ro-overrides";
import { useAuth } from "../firebase/AuthContext";
import type { Translations } from "../i18n";
import {
  buildNeonAndUpstashExport,
  compressHardwarePhotoToDataUrl,
} from "../logic/db-export";
import {
  buildInventoryRecommendations,
  type InventoryRecommendation,
} from "../logic/inventory-matcher";
import type { Lang } from "../types";

export interface CustomInventoryItem {
  id: string;
  name: string;
  qty: number;
}

interface KitViewProps {
  t: Translations;
  lang: Lang;
  ownedParts: Record<string, number>;
  setOwnedParts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  customParts: CustomInventoryItem[];
  setCustomParts: React.Dispatch<React.SetStateAction<CustomInventoryItem[]>>;
  onOpenLabCode: (code: string) => void;
  onOpenIdeaId: (ideaId: string) => void;
  onOpenFlipperGuide: (guideId: string) => void;
  onOpenFlipperBoard: (boardId: string) => void;
  highlightedPartId?: string | null;
  focusNonce?: number;
}

export function KitView({
  t,
  lang,
  ownedParts,
  setOwnedParts,
  customParts,
  setCustomParts,
  onOpenLabCode,
  onOpenIdeaId,
  onOpenFlipperGuide,
  onOpenFlipperBoard,
  highlightedPartId,
  focusNonce,
}: KitViewProps) {
  const {
    user,
    authReady,
    signingIn,
    syncStatus,
    authError,
    cloudVault,
    customPhotoParts,
    signInWithGoogle,
    addCustomHardwareItem,
    updateCustomHardwareQty,
    deleteCustomHardwareItem,
  } = useAuth();

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<"all" | InventoryCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [recTab, setRecTab] = useState<"ready" | "almost" | "upgrades">("ready");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Add Hardware + Photo Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [hwName, setHwName] = useState("");
  const [hwCategory, setHwCategory] = useState<InventoryCategory>("boards");
  const [hwQty, setHwQty] = useState(1);
  const [hwVoltage, setHwVoltage] = useState("3.3V");
  const [hwInterface, setHwInterface] = useState("I2C / SPI / GPIO");
  const [hwNotes, setHwNotes] = useState("");
  const [hwPhotoDataUrl, setHwPhotoDataUrl] = useState<string | undefined>(undefined);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [savingHw, setSavingHw] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // NeonDB + Upstash Export Modal State
  const [showDbModal, setShowDbModal] = useState(false);
  const [dbModalTab, setDbModalTab] = useState<"neon" | "upstash">("neon");
  const [copiedDb, setCopiedDb] = useState(false);

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      for (const track of cameraStreamRef.current.getTracks()) {
        track.stop();
      }
      cameraStreamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (highlightedPartId && cardRefs.current[highlightedPartId]) {
      cardRefs.current[highlightedPartId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightedPartId, focusNonce]);

  const partById = useMemo(
    () => new Map(INVENTORY_PARTS.map((p) => [p.id, p])),
    [],
  );

  const report = useMemo(
    () => buildInventoryRecommendations(ownedParts, lang),
    [ownedParts, lang],
  );

  const filteredParts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return INVENTORY_PARTS.filter((part) => {
      if (categoryFilter !== "all" && part.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        part.name.en.toLowerCase().includes(q) ||
        part.name.ro.toLowerCase().includes(q) ||
        part.bus.toLowerCase().includes(q) ||
        part.notes.en.toLowerCase().includes(q) ||
        part.notes.ro.toLowerCase().includes(q)
      );
    });
  }, [categoryFilter, searchQuery]);

  const neonUpstashExport = useMemo(() => {
    if (!showDbModal || !user) return null;
    return buildNeonAndUpstashExport({
      userId: user.uid,
      userEmail: user.email ?? `${user.uid}@users.local`,
      ownedParts,
      customPhotoParts,
      benchLayout: cloudVault?.benchLayout ?? {},
    });
  }, [showDbModal, user, ownedParts, customPhotoParts, cloudVault]);

  const togglePart = (partId: string) => {
    setOwnedParts((prev) => {
      const current = prev[partId] ?? 0;
      if (current > 0) {
        const next = { ...prev };
        delete next[partId];
        return next;
      }
      return { ...prev, [partId]: 1 };
    });
  };

  const adjustQty = (partId: string, delta: number) => {
    setOwnedParts((prev) => {
      const nextQty = Math.max(0, (prev[partId] ?? 0) + delta);
      if (nextQty === 0) {
        const next = { ...prev };
        delete next[partId];
        return next;
      }
      return { ...prev, [partId]: nextQty };
    });
  };

  const applyPreset = (partIds: string[]) => {
    const next: Record<string, number> = {};
    for (const id of partIds) {
      next[id] = Math.max(1, ownedParts[id] ?? 1);
    }
    setOwnedParts(next);
  };

  const clearInventory = () => {
    setOwnedParts({});
  };

  const startLiveCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        lang === "ro"
          ? "Camera nu este disponibilă în acest browser — folosește butonul Încarcă Fotografie."
          : "Live camera unavailable in this browser — use Upload Photo instead.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      setCameraActive(true);
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      }, 60);
    } catch {
      setCameraError(
        lang === "ro"
          ? "Accesul la cameră a fost refuzat sau nu există cameră conectată. Poți încărca o poză din fișier."
          : "Camera permission denied or no webcam found. You can upload an image file instead.",
      );
    }
  };

  const captureCameraFrame = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    const scale = Math.min(1, 480 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    let dataUrl = canvas.toDataURL("image/jpeg", 0.72);
    if (dataUrl.length > 130000) {
      dataUrl = canvas.toDataURL("image/jpeg", 0.5);
    }
    setHwPhotoDataUrl(dataUrl);
    stopCamera();
  };

  const handlePhotoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoBusy(true);
    setCameraError(null);
    try {
      const compressed = await compressHardwarePhotoToDataUrl(file);
      setHwPhotoDataUrl(compressed);
    } catch {
      setCameraError(
        lang === "ro"
          ? "Nu s-a putut procesa fotografia selectată."
          : "Could not process the selected image.",
      );
    } finally {
      setPhotoBusy(false);
      e.target.value = "";
    }
  };

  const handleSaveCustomHardware = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !hwName.trim()) return;
    setSavingHw(true);
    try {
      await addCustomHardwareItem({
        name: hwName.trim(),
        category: hwCategory,
        quantity: Math.max(1, hwQty),
        voltage: hwVoltage.trim() || "3.3V",
        interfaceSpec: hwInterface.trim() || "GPIO",
        notes: hwNotes.trim(),
        photoDataUrl: hwPhotoDataUrl,
      });
      setHwName("");
      setHwQty(1);
      setHwVoltage("3.3V");
      setHwInterface("I2C / SPI / GPIO");
      setHwNotes("");
      setHwPhotoDataUrl(undefined);
      stopCamera();
      setShowAddModal(false);
      setStatusMessage(
        lang === "ro"
          ? "Componenta hardware și fotografia au fost salvate securizat în baza de date!"
          : "Hardware component & photo securely saved to your cloud App DB!",
      );
    } finally {
      setSavingHw(false);
    }
  };

  const handleExportInventory = () => {
    const payload = {
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      ownedParts,
      customParts,
      customPhotoParts,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "esp-labs-inventory.json";
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage(
      lang === "ro"
        ? "Inventarul a fost exportat în esp-labs-inventory.json."
        : "Inventory exported to esp-labs-inventory.json.",
    );
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as {
          ownedParts?: Record<string, number>;
          customParts?: CustomInventoryItem[];
        };
        if (parsed.ownedParts && typeof parsed.ownedParts === "object") {
          setOwnedParts(parsed.ownedParts);
        }
        if (Array.isArray(parsed.customParts)) {
          setCustomParts(parsed.customParts);
        }
        setStatusMessage(
          lang === "ro"
            ? "Inventarul a fost importat cu succes și sincronizat."
            : "Inventory imported and synced successfully.",
        );
      } catch {
        setStatusMessage(
          lang === "ro"
            ? "Fișier JSON invalid — nu s-a putut importa inventarul."
            : "Invalid JSON file — could not import inventory.",
        );
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleDownloadDbFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyDbSnippet = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedDb(true);
    window.setTimeout(() => setCopiedDb(false), 1600);
  };

  const handleOpenRecommendation = (rec: InventoryRecommendation) => {
    if (rec.kind === "idea") {
      onOpenIdeaId(rec.targetId);
    } else if (rec.kind === "flipper-guide") {
      onOpenFlipperGuide(rec.targetId);
    } else if (rec.kind === "flipper-board") {
      onOpenFlipperBoard(rec.targetId);
    } else if (rec.kind === "lab" && rec.labCode) {
      onOpenLabCode(rec.labCode);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-1 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {t.kitTitle}
              </h1>
              {user ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/35 text-emerald-700 dark:text-emerald-300 text-[11px] font-mono font-semibold">
                  <Cloud className="w-3.5 h-3.5" />
                  {syncStatus === "syncing"
                    ? lang === "ro"
                      ? "Se sincronizează..."
                      : "Syncing..."
                    : lang === "ro"
                      ? "Securizat · Google SSO Cloud"
                      : "Secured · Google SSO Cloud"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/35 text-amber-700 dark:text-amber-300 text-[11px] font-mono font-semibold">
                  <Lock className="w-3.5 h-3.5" />
                  {lang === "ro" ? "Acces Protejat prin Google SSO" : "Protected by Google SSO"}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.kitSub}
            </p>
          </div>

          {user && (
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                <Camera className="w-3.5 h-3.5" />
                {lang === "ro" ? "Adaugă Hardware + Foto" : "Add Hardware + Photo"}
              </button>
              <button
                type="button"
                onClick={() => setShowDbModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-violet-500/40 bg-violet-500/10 hover:border-violet-400 text-violet-700 dark:text-violet-300 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                <Database className="w-3.5 h-3.5" />
                {lang === "ro" ? "NeonDB SQL + Upstash" : "NeonDB SQL + Upstash"}
              </button>
              <button
                type="button"
                onClick={handleExportInventory}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-cyan-500 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 text-cyan-500" />
                {t.inventory.exportInventory}
              </button>
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-cyan-500 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-500" />
                {t.inventory.importInventory}
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json"
                onChange={handleImportFile}
                className="hidden"
                aria-label={t.inventory.importInventory}
              />
            </div>
          )}
        </div>

        {user && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
              {t.inventory.presetsLabel}:
            </span>
            {INVENTORY_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.id}
                onClick={() => applyPreset(preset.partIds)}
                title={pickText(preset.description, lang)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-cyan-600 hover:text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                {pickText(preset.name, lang)}
              </button>
            ))}
            <button
              type="button"
              onClick={clearInventory}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer whitespace-nowrap"
            >
              {t.inventory.clearAll}
            </button>
          </div>
        )}

        {statusMessage && (
          <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {statusMessage}
          </div>
        )}
      </div>

      {/* GOOGLE SSO SECURITY VAULT GATE WHEN SIGNED OUT */}
      {!user ? (
        <section className="rounded-2xl border border-cyan-500/35 bg-gradient-to-br from-white via-slate-50 to-cyan-50/40 dark:from-slate-900 dark:via-[#0b1322] dark:to-cyan-950/30 p-8">
          <div className="max-w-2xl mx-auto text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight">
                {lang === "ro"
                  ? "Inventar Hardware Securizat — Autentificare cu Cont Google SSO"
                  : "Secured Hardware Inventory — Sign in with Google SSO"}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {lang === "ro"
                  ? "Pentru a-ți proteja lista personală de plăci ESP32, module Flipper Zero, fotografiile componentelor și layout-ul Bancului 3D, accesul la inventar este permis exclusiv proprietarului autentificat prin Google SSO."
                  : "To keep your personal ESP32 boards, Flipper Zero modules, hardware photos, and 3D Bench layout strictly private, inventory access is locked to your authenticated Google SSO account."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/60 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
                  <Lock className="w-3.5 h-3.5" />
                  {lang === "ro" ? "Reguli Strict Private" : "Owner-Only Security"}
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-snug">
                  {lang === "ro"
                    ? "Doar contul tău Google verificat poate citi sau modifica inventarul."
                    : "Only your verified Google UID can read or mutate your inventory documents."}
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/60 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Camera className="w-3.5 h-3.5" />
                  {lang === "ro" ? "Foto Hardware în App DB" : "Hardware Photos in DB"}
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-snug">
                  {lang === "ro"
                    ? "Fotografiază plăcile reale din cameră sau încarcă poze direct în baza de date."
                    : "Capture photos of your physical boards from webcam/phone straight into your DB."}
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/60 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-violet-600 dark:text-violet-400">
                  <Database className="w-3.5 h-3.5" />
                  {lang === "ro" ? "Export NeonDB + Upstash" : "NeonDB + Upstash Ready"}
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-snug">
                  {lang === "ro"
                    ? "Descarcă oricând scriptul SQL PostgreSQL pentru NeonDB și config-ul Upstash Redis."
                    : "Export a ready-to-run NeonDB PostgreSQL schema + Upstash Redis cache blueprint anytime."}
                </p>
              </div>
            </div>

            {authError && (
              <div className="text-xs text-rose-600 dark:text-rose-400 font-mono">
                {authError}
              </div>
            )}

            <div className="pt-1 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                disabled={!authReady || signingIn}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white text-sm font-bold shadow-lg shadow-cyan-900/20 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {signingIn
                    ? lang === "ro"
                      ? "Se conectează la Google..."
                      : "Connecting to Google..."
                    : lang === "ro"
                      ? "Conectează-te cu Google SSO"
                      : "Sign in with Google SSO"}
                </span>
              </button>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === "ro"
                  ? "Specificațiile electrice ale kitului de bază rămân vizibile mai jos fără autentificare."
                  : "Public core kit electrical reference specs remain visible below without signing in."}
              </span>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Custom Photographed Hardware Gallery (Cloud App DB) */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Camera className="w-4 h-4 text-cyan-500" />
                  {lang === "ro"
                    ? `Componentele Mele Fotografiate & Personalizate (${customPhotoParts.length})`
                    : `My Photographed & Custom Hardware (${customPhotoParts.length})`}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === "ro"
                    ? "Salvate criptat în contul tău Google · poți face fotografii noi cu camera sau încărca imagini."
                    : "Stored privately in your Google account App DB · capture real boards via camera or upload images."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                {lang === "ro" ? "Adaugă Hardware Nou" : "Add Hardware"}
              </button>
            </div>

            {customPhotoParts.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/50 text-center space-y-2">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {lang === "ro"
                    ? "Nu ai adăugat încă plăci sau module proprii cu fotografie. Apasă butonul de mai sus pentru a fotografia o componentă fizică."
                    : "No custom photographed hardware yet. Click Add Hardware above to take a photo of your real board or module."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {customPhotoParts.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 overflow-hidden flex flex-col justify-between"
                  >
                    {item.photoDataUrl ? (
                      <div className="h-36 w-full bg-slate-900 overflow-hidden border-b border-slate-200 dark:border-slate-800">
                        <img
                          src={item.photoDataUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-24 w-full bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400">
                        <Package className="w-8 h-8 opacity-60" />
                      </div>
                    )}
                    <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                          <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
                            {t.inventory.categories[item.category]}
                          </span>
                          <span className="text-amber-600 dark:text-amber-400">{item.voltage}</span>
                        </div>
                        <h3 className="text-sm font-bold leading-snug">{item.name}</h3>
                        <div className="text-[11px] font-mono text-slate-500">
                          {item.interfaceSpec}
                        </div>
                        {item.notes && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                            {item.notes}
                          </p>
                        )}
                      </div>
                      <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              void updateCustomHardwareQty(item.id, Math.max(1, item.quantity - 1))
                            }
                            aria-label="Decrease custom part quantity"
                            className="w-6 h-6 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-cyan-500 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-mono font-bold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => void updateCustomHardwareQty(item.id, item.quantity + 1)}
                            aria-label="Increase custom part quantity"
                            className="w-6 h-6 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-cyan-500 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => void deleteCustomHardwareItem(item.id)}
                          aria-label={`Delete ${item.name}`}
                          className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{lang === "ro" ? "Șterge" : "Remove"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Main Two-Column Matcher Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT (7 cols): Interactive Parts Checklist */}
            <section className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Package className="w-4 h-4 text-cyan-500" />
                  {t.inventory.myPartsTitle}
                </h2>
                <span className="text-xs font-mono font-semibold text-cyan-600 dark:text-cyan-400 tabular-nums">
                  {report.ownedCount} / {report.totalCatalogCount} {t.inventory.partsOwned}
                </span>
              </div>

              {/* Search & Category Filter */}
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.inventory.searchPlaceholder}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      "all",
                      "boards",
                      "wireless",
                      "display-audio",
                      "sensors",
                      "power-proto",
                    ] as const
                  ).map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        categoryFilter === cat
                          ? "bg-cyan-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {t.inventory.categories[cat]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selectable Parts List */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[620px] overflow-y-auto pr-1">
                {filteredParts.map((part) => {
                  const qty = ownedParts[part.id] ?? 0;
                  const owned = qty > 0;
                  return (
                    <div
                      key={part.id}
                      className={`py-3 px-2 rounded-lg flex items-center justify-between gap-3 transition-colors ${
                        owned ? "bg-emerald-500/5" : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => togglePart(part.id)}
                        className="flex items-start gap-3 text-left flex-1 min-w-0 cursor-pointer"
                      >
                        <span
                          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                            owned
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                          }`}
                        >
                          {owned && <Check className="w-3.5 h-3.5" />}
                        </span>
                        <div className="min-w-0 space-y-0.5">
                          <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                            {pickText(part.name, lang)}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {part.bus} · {part.voltage} · ~${part.approxPriceUsd}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {pickText(part.notes, lang)}
                          </div>
                        </div>
                      </button>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => adjustQty(part.id, -1)}
                          disabled={qty === 0}
                          aria-label={`Decrease quantity for ${pickText(part.name, lang)}`}
                          className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-35 hover:border-cyan-500 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-mono font-bold tabular-nums">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustQty(part.id, 1)}
                          aria-label={`Increase quantity for ${pickText(part.name, lang)}`}
                          className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-cyan-500 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* RIGHT (5 cols): Smart Recommendations Engine */}
            <section className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 space-y-4">
              <div className="space-y-1">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  {t.inventory.recommendationsTitle}
                </h2>
                <div className="text-xs font-mono text-slate-500 tabular-nums">
                  {report.ready.length} {t.inventory.tabReady} · {report.almostReady.length}{" "}
                  {t.inventory.tabAlmost}
                </div>
              </div>

              {/* Recommendation Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80">
                <button
                  type="button"
                  onClick={() => setRecTab("ready")}
                  className={`flex-1 px-2 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    recTab === "ready"
                      ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {t.inventory.tabReady} ({report.ready.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRecTab("almost")}
                  className={`flex-1 px-2 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    recTab === "almost"
                      ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {t.inventory.tabAlmost} ({report.almostReady.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRecTab("upgrades")}
                  className={`flex-1 px-2 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    recTab === "upgrades"
                      ? "bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {t.inventory.tabUpgrades}
                </button>
              </div>

              {/* TAB: Ready to Build */}
              {recTab === "ready" && (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {report.ready.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 leading-relaxed">
                      {t.inventory.readyEmpty}
                    </div>
                  ) : (
                    report.ready.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {t.inventory.kindLabels[rec.kind]} · 100%
                          </span>
                          {rec.difficulty && (
                            <span className="text-slate-500">{t.difficulties[rec.difficulty]}</span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold leading-snug">{rec.title}</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                          {rec.subtitle}
                        </p>
                        <div className="pt-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleOpenRecommendation(rec)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                          >
                            <span>{t.inventory.openBuild}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB: Almost Ready */}
              {recTab === "almost" && (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {report.almostReady.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 leading-relaxed">
                      {t.inventory.almostEmpty}
                    </div>
                  ) : (
                    report.almostReady.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            {t.inventory.kindLabels[rec.kind]} · {rec.matchPercent}%
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenRecommendation(rec)}
                            className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold cursor-pointer"
                          >
                            {t.inventory.openBuild} →
                          </button>
                        </div>
                        <h3 className="text-sm font-bold leading-snug">{rec.title}</h3>
                        <div className="space-y-1.5">
                          <div className="text-[11px] font-semibold text-slate-500">
                            {t.inventory.missingLabel}:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {rec.missingPartIds.map((missingId) => {
                              const part = partById.get(missingId);
                              if (!part) return null;
                              return (
                                <button
                                  type="button"
                                  key={missingId}
                                  onClick={() => adjustQty(missingId, 1)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-[11px] font-medium transition-colors cursor-pointer"
                                  title={t.inventory.markOwned}
                                >
                                  <Plus className="w-3 h-3 text-emerald-500" />
                                  <span>{pickText(part.name, lang)}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB: Top Upgrade Impact */}
              {recTab === "upgrades" && (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {report.upgradeImpact.length === 0 ? (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                      {t.inventory.upgradesEmpty}
                    </div>
                  ) : (
                    report.upgradeImpact.map((entry) => (
                      <div
                        key={entry.part.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-bold leading-snug">
                              {pickText(entry.part.name, lang)}
                            </h3>
                            <div className="text-[11px] font-mono text-slate-500 mt-0.5 tabular-nums">
                              ~${entry.part.approxPriceUsd} · +{entry.unlocksReadyCount}{" "}
                              {t.inventory.unlocksNow} · +{entry.helpsCount} {t.inventory.helpsBuilds}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => adjustQty(entry.part.id, 1)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <Plus className="w-3 h-3" />
                            {t.inventory.markOwned}
                          </button>
                        </div>
                        {entry.unlockedTitles.length > 0 && (
                          <ul className="space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                            {entry.unlockedTitles.map((title, i) => (
                              <li key={i} className="truncate">
                                – {title}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </section>
          </div>
        </>
      )}

      {/* Preserved Public Core Kit Reference Electrical Specs */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight">{t.inventory.kitSpecsTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {KIT_PARTS.map((rawPart) => {
            const part = localizeKitPart(rawPart, lang);
            const isHighlighted = highlightedPartId === part.id;
            return (
              <div
                key={part.id}
                ref={(el) => {
                  cardRefs.current[part.id] = el;
                }}
                className={`p-5 rounded-xl border bg-white dark:bg-slate-900/70 flex flex-col justify-between space-y-4 transition-colors ${
                  isHighlighted
                    ? "border-cyan-500 ring-2 ring-cyan-500/30"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
                      {part.category}
                    </span>
                    <span className="text-amber-600 dark:text-amber-400">{part.voltage}</span>
                  </div>

                  <h3 className="text-base font-bold">{part.name}</h3>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-1.5">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">{t.interfaceLabel}:</span>
                      <span className="text-cyan-700 dark:text-cyan-300 text-right">
                        {part.iface}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">{t.pinsLabel}:</span>
                      <span className="text-emerald-700 dark:text-emerald-300 text-right">
                        {part.pins}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-1">
                    {part.specs.map((s, i) => (
                      <li key={i} className="text-xs text-slate-600 dark:text-slate-400">
                        – {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    {t.usedInLabs}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {part.labs.map((code) => (
                      <button
                        type="button"
                        key={code}
                        onClick={() => onOpenLabCode(code)}
                        className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-700 dark:text-cyan-300 font-mono text-xs font-bold transition-colors cursor-pointer"
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* MODAL: Add Hardware + Live Camera / Photo Upload */}
      {showAddModal && user && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={lang === "ro" ? "Adaugă Hardware Nou" : "Add New Hardware"}
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-500" />
                <h2 className="text-sm font-bold">
                  {lang === "ro"
                    ? "Adaugă Componentă Hardware + Fotografie în App DB"
                    : "Add Hardware Component + Photo to App DB"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setShowAddModal(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => void handleSaveCustomHardware(e)}
              className="p-5 space-y-4 overflow-y-auto"
            >
              {/* Photo Capture / Upload Area */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === "ro" ? "Fotografie Hardware (Opțional)" : "Hardware Photo (Optional)"}
                </label>

                {cameraActive ? (
                  <div className="rounded-xl overflow-hidden border border-cyan-500/50 bg-black space-y-2 p-2">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold cursor-pointer"
                      >
                        {lang === "ro" ? "Anulează" : "Cancel"}
                      </button>
                      <button
                        type="button"
                        onClick={captureCameraFrame}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {lang === "ro" ? "Fă Fotografie" : "Capture Photo"}
                      </button>
                    </div>
                  </div>
                ) : hwPhotoDataUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-950">
                    <img
                      src={hwPhotoDataUrl}
                      alt="Hardware preview"
                      className="w-full h-44 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setHwPhotoDataUrl(undefined)}
                      className="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-slate-950/85 text-white text-xs font-semibold hover:bg-rose-600 cursor-pointer"
                    >
                      {lang === "ro" ? "Elimină" : "Remove"}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => void startLiveCamera()}
                      className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl border border-dashed border-cyan-500/50 bg-cyan-500/5 hover:bg-cyan-500/10 text-xs font-semibold text-cyan-700 dark:text-cyan-300 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{lang === "ro" ? "Deschide Camera" : "Take Live Photo"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={photoBusy}
                      className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:border-cyan-500 text-xs font-semibold cursor-pointer"
                    >
                      <ImagePlus className="w-4 h-4 text-emerald-500" />
                      <span>
                        {photoBusy
                          ? lang === "ro"
                            ? "Compresie..."
                            : "Compressing..."
                          : lang === "ro"
                            ? "Încarcă Poză"
                            : "Upload Image"}
                      </span>
                    </button>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => void handlePhotoFileSelected(e)}
                      className="hidden"
                    />
                  </div>
                )}

                {cameraError && (
                  <div className="text-[11px] text-amber-600 dark:text-amber-400">{cameraError}</div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold">
                    {lang === "ro" ? "Nume Placă / Modul *" : "Board / Component Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={hwName}
                    onChange={(e) => setHwName(e.target.value)}
                    placeholder={
                      lang === "ro"
                        ? "ex. ESP32-S3 SuperMini, Modul CC1101 + Antenă..."
                        : "e.g. ESP32-S3 SuperMini, CC1101 433MHz Module..."
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">
                    {lang === "ro" ? "Categorie" : "Category"}
                  </label>
                  <select
                    value={hwCategory}
                    onChange={(e) => setHwCategory(e.target.value as InventoryCategory)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs"
                  >
                    {(
                      ["boards", "wireless", "display-audio", "sensors", "power-proto"] as const
                    ).map((cat) => (
                      <option key={cat} value={cat}>
                        {t.inventory.categories[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">
                    {lang === "ro" ? "Cantitate" : "Quantity"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={hwQty}
                    onChange={(e) => setHwQty(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">
                    {lang === "ro" ? "Tensiune Logică" : "Voltage"}
                  </label>
                  <input
                    type="text"
                    maxLength={40}
                    value={hwVoltage}
                    onChange={(e) => setHwVoltage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">
                    {lang === "ro" ? "Interfață / Bus" : "Interface / Bus"}
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    value={hwInterface}
                    onChange={(e) => setHwInterface(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold">
                    {lang === "ro" ? "Notițe / Pinout / Cutie Depozitare" : "Notes / Pinout / Bin Location"}
                  </label>
                  <textarea
                    rows={2}
                    maxLength={400}
                    value={hwNotes}
                    onChange={(e) => setHwNotes(e.target.value)}
                    placeholder={
                      lang === "ro"
                        ? "ex. Cutia A2, funcționează cu GhostESP pe UART0..."
                        : "e.g. Drawer A2, tested with GhostESP over UART0..."
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setShowAddModal(false);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                >
                  {lang === "ro" ? "Anulează" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={savingHw || !hwName.trim()}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
                >
                  {savingHw
                    ? lang === "ro"
                      ? "Se salvează..."
                      : "Saving..."
                    : lang === "ro"
                      ? "Salvează în Baza de Date"
                      : "Save to App DB"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NeonDB PostgreSQL Migration SQL + Upstash Redis Caching Blueprint */}
      {showDbModal && neonUpstashExport && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="NeonDB & Upstash Redis Export"
        >
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-violet-500" />
                <h2 className="text-sm font-bold">
                  {lang === "ro"
                    ? "Portabilitate Bază de Date: NeonDB (PostgreSQL Free) + Upstash Redis"
                    : "Database Portability: NeonDB (PostgreSQL Free) + Upstash Redis"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowDbModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {lang === "ro"
                  ? "Inventarul tău rulează securizat în Firestore Cloud chiar acum, iar scriptul de mai jos îți permite migrarea instant într-o bază de date NeonDB PostgreSQL (Free Tier) cu strat de cache serverless Upstash Redis."
                  : "Your inventory runs live and secured on Firestore today, and this real-time export lets you migrate directly into NeonDB PostgreSQL (Free Tier) paired with an Upstash Redis serverless cache."}
              </p>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setDbModalTab("neon")}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                      dbModalTab === "neon"
                        ? "bg-white dark:bg-slate-950 text-cyan-600 dark:text-cyan-400 shadow-xs"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    NeonDB PostgreSQL (.sql)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDbModalTab("upstash")}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                      dbModalTab === "upstash"
                        ? "bg-white dark:bg-slate-950 text-violet-600 dark:text-violet-400 shadow-xs"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Upstash Redis (.json)
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyDbSnippet(
                        dbModalTab === "neon"
                          ? neonUpstashExport.sql
                          : neonUpstashExport.upstashConfig,
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-cyan-500 text-xs font-semibold cursor-pointer"
                  >
                    {copiedDb ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedDb ? t.copied : t.copy}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      dbModalTab === "neon"
                        ? handleDownloadDbFile(
                            neonUpstashExport.sql,
                            "esplabs-neondb-migration.sql",
                            "application/sql",
                          )
                        : handleDownloadDbFile(
                            neonUpstashExport.upstashConfig,
                            "esplabs-upstash-redis.json",
                            "application/json",
                          )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{lang === "ro" ? "Descarcă" : "Download"}</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 border border-slate-800 text-[11px] font-mono leading-relaxed overflow-x-auto max-h-80">
                {dbModalTab === "neon" ? neonUpstashExport.sql : neonUpstashExport.upstashConfig}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
