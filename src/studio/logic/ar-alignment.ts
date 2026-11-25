export type ArFacingMode = "environment" | "user";
export type ArPresetId = "seated-45" | "overhead-desk" | "close-pin-match";
export type ArSessionStatus = "off" | "requesting" | "live-camera" | "desk-photo" | "error";

export interface ArAlignmentState {
  /** Real-world scale multiplier (1.0 = calibrated 10mm/unit standard desk view). */
  deskScale: number;
  /** Camera pitch angle looking down onto the desk plane in degrees (12°..85°). */
  deskTiltDeg: number;
  /** Horizontal yaw rotation of the virtual bench relative to the camera in degrees (-180°..180°). */
  deskYawDeg: number;
  /** Horizontal pan offset (cm / world units) to align boards left/right on the desk. */
  offsetX: number;
  /** Depth pan offset (cm / world units) to align boards closer/further on the desk. */
  offsetZ: number;
  /** Virtual board opacity (0.25..1.0) for X-ray pin-to-pin alignment over physical hardware. */
  modelOpacity: number;
  /** Simulated camera lens vertical FOV in degrees (30°..75°). */
  cameraFov: number;
  /** Whether the translucent metric calibration grid & 100mm ruler are visible. */
  showCalibrationGrid: boolean;
  /** Lock OrbitControls so the calibrated desk plane does not drift while moving individual boards. */
  lockDeskAlignment: boolean;
  /** Horizontal mirror of the camera feed (useful for front webcams). */
  mirrorVideo: boolean;
  /** Preferred camera lens direction. */
  facingMode: ArFacingMode;
}

export interface ArCameraPose {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export interface ArScaleReadout {
  scalePercent: number;
  esp32Label: string;
  breadboardLabel: string;
  gridCellLabel: string;
}

const BASE_CAMERA_DISTANCE = 20.5;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function getDefaultArAlignment(): ArAlignmentState {
  return {
    deskScale: 1.0,
    deskTiltDeg: 44,
    deskYawDeg: 0,
    offsetX: 0,
    offsetZ: 0,
    modelOpacity: 0.94,
    cameraFov: 48,
    showCalibrationGrid: true,
    lockDeskAlignment: false,
    mirrorVideo: false,
    facingMode: "environment",
  };
}

export function clampArAlignment(
  partial: Partial<ArAlignmentState>,
  base: ArAlignmentState = getDefaultArAlignment(),
): ArAlignmentState {
  const merged = { ...base, ...partial };
  return {
    deskScale: round2(clamp(merged.deskScale, 0.45, 2.2)),
    deskTiltDeg: Math.round(clamp(merged.deskTiltDeg, 12, 85)),
    deskYawDeg: Math.round(clamp(merged.deskYawDeg, -180, 180)),
    offsetX: round2(clamp(merged.offsetX, -12, 12)),
    offsetZ: round2(clamp(merged.offsetZ, -12, 12)),
    modelOpacity: round2(clamp(merged.modelOpacity, 0.25, 1.0)),
    cameraFov: Math.round(clamp(merged.cameraFov, 30, 75)),
    showCalibrationGrid: Boolean(merged.showCalibrationGrid),
    lockDeskAlignment: Boolean(merged.lockDeskAlignment),
    mirrorVideo: Boolean(merged.mirrorVideo),
    facingMode: merged.facingMode === "user" ? "user" : "environment",
  };
}

/**
 * Converts AR desk calibration parameters into a Three.js PerspectiveCamera pose.
 * Higher deskScale brings the camera closer so virtual boards appear larger to match
 * close-up physical hardware on the user's desk.
 */
export function computeArCameraPose(alignment: ArAlignmentState): ArCameraPose {
  const safe = clampArAlignment(alignment);
  const distance = BASE_CAMERA_DISTANCE / safe.deskScale;
  const tiltRad = (safe.deskTiltDeg * Math.PI) / 180;
  const yawRad = (safe.deskYawDeg * Math.PI) / 180;

  const horizDist = distance * Math.cos(tiltRad);
  const camY = Math.max(0.8, distance * Math.sin(tiltRad));

  // Offset moves the virtual rig relative to the camera frame by shifting the look target opposite
  const targetX = -safe.offsetX;
  const targetZ = -safe.offsetZ;

  const camX = targetX + horizDist * Math.sin(yawRad);
  const camZ = targetZ + horizDist * Math.cos(yawRad);

  return {
    position: [round2(camX), round2(camY), round2(camZ)],
    target: [round2(targetX), 0.25, round2(targetZ)],
    fov: safe.cameraFov,
  };
}

export function applyArPreset(
  preset: ArPresetId,
  current: ArAlignmentState = getDefaultArAlignment(),
): ArAlignmentState {
  if (preset === "overhead-desk") {
    return clampArAlignment(
      {
        deskScale: 1.08,
        deskTiltDeg: 82,
        deskYawDeg: 0,
        offsetX: 0,
        offsetZ: 0,
        modelOpacity: 0.92,
        cameraFov: 46,
        showCalibrationGrid: true,
      },
      current,
    );
  }
  if (preset === "close-pin-match") {
    return clampArAlignment(
      {
        deskScale: 1.65,
        deskTiltDeg: 58,
        deskYawDeg: 0,
        offsetX: 1.8,
        offsetZ: 2.0,
        modelOpacity: 0.62,
        cameraFov: 44,
        showCalibrationGrid: true,
      },
      current,
    );
  }
  // seated-45
  return clampArAlignment(
    {
      deskScale: 1.0,
      deskTiltDeg: 44,
      deskYawDeg: 0,
      offsetX: 0,
      offsetZ: 0,
      modelOpacity: 0.94,
      cameraFov: 48,
      showCalibrationGrid: true,
    },
    current,
  );
}

export function formatRealScaleReadout(deskScale: number): ArScaleReadout {
  const safeScale = clamp(deskScale, 0.45, 2.2);
  return {
    scalePercent: Math.round(safeScale * 100),
    esp32Label: "ESP32-S3: 62.7 × 25.4 mm",
    breadboardLabel: "Breadboard: 165 × 55 mm",
    gridCellLabel: "Grid: 10 mm / 50 mm",
  };
}

export function describeCameraError(
  error: unknown,
  lang: "ro" | "en",
): { title: string; detail: string } {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return lang === "ro"
      ? {
          title: "Permisiune cameră refuzată",
          detail:
            "Permite accesul la cameră în browser pentru a suprapune componentele 3D peste biroul tău real, sau încarcă o fotografie a biroului.",
        }
      : {
          title: "Camera permission denied",
          detail:
            "Allow camera access in your browser to overlay 3D boards on your real desk, or upload a photo of your physical workspace instead.",
        };
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return lang === "ro"
      ? {
          title: "Nicio cameră detectată",
          detail:
            "Nu a fost găsită o cameră activă pe acest dispozitiv. Poți reîncerca sau încărca o fotografie reală a biroului tău pentru aliniere AR.",
        }
      : {
          title: "No camera detected",
          detail:
            "No physical camera was found on this device. You can retry or upload a real photo of your desk to align virtual 3D boards on top.",
        };
  }
  return lang === "ro"
    ? {
        title: "Camera nu a putut fi pornită",
        detail:
          "Fluxul video nu este disponibil în acest moment (posibil utilizat de altă aplicație). Reîncearcă sau încarcă o fotografie a biroului.",
      }
    : {
        title: "Unable to start camera",
        detail:
          "The camera stream could not be opened right now (it may be in use by another app). Retry or load a desk photo for AR alignment.",
      };
}
