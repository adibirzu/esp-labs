import test from "node:test";
import assert from "node:assert/strict";
import {
  applyArPreset,
  clampArAlignment,
  computeArCameraPose,
  describeCameraError,
  formatRealScaleReadout,
  getDefaultArAlignment,
} from "./ar-alignment";

test("getDefaultArAlignment returns sensible calibrated defaults", () => {
  const def = getDefaultArAlignment();
  assert.equal(def.deskScale, 1.0);
  assert.equal(def.deskTiltDeg, 44);
  assert.equal(def.deskYawDeg, 0);
  assert.equal(def.showCalibrationGrid, true);
  assert.equal(def.lockDeskAlignment, false);
  assert.equal(def.facingMode, "environment");
});

test("clampArAlignment enforces safe bounds for all sliders", () => {
  const clamped = clampArAlignment({
    deskScale: 9.5,
    deskTiltDeg: -10,
    deskYawDeg: 400,
    offsetX: -99,
    offsetZ: 99,
    modelOpacity: 0.01,
    cameraFov: 120,
  });
  assert.equal(clamped.deskScale, 2.2);
  assert.equal(clamped.deskTiltDeg, 12);
  assert.equal(clamped.deskYawDeg, 180);
  assert.equal(clamped.offsetX, -12);
  assert.equal(clamped.offsetZ, 12);
  assert.equal(clamped.modelOpacity, 0.25);
  assert.equal(clamped.cameraFov, 75);
});

test("computeArCameraPose brings camera closer as deskScale increases and stays above desk plane", () => {
  const base = getDefaultArAlignment();
  const pose1 = computeArCameraPose({ ...base, deskScale: 1.0 });
  const pose2 = computeArCameraPose({ ...base, deskScale: 2.0 });

  const dist1 = Math.hypot(pose1.position[0], pose1.position[1], pose1.position[2]);
  const dist2 = Math.hypot(pose2.position[0], pose2.position[1], pose2.position[2]);
  assert.ok(dist2 < dist1, "higher deskScale should pull camera closer to enlarge virtual boards");
  assert.ok(pose1.position[1] > 5, "camera must stay elevated above the desk surface");
  assert.equal(pose1.fov, base.cameraFov);
});

test("computeArCameraPose applies yaw rotation and horizontal pan offsets accurately", () => {
  const pose = computeArCameraPose(
    clampArAlignment({
      deskScale: 1.0,
      deskTiltDeg: 45,
      deskYawDeg: 90,
      offsetX: 3.0,
      offsetZ: -2.0,
    }),
  );
  assert.equal(pose.target[0], -3);
  assert.equal(pose.target[2], 2);
  // At yaw = 90deg, sin(90) = 1 so camera sits to +X of target
  assert.ok(pose.position[0] > pose.target[0] + 10);
});

test("applyArPreset updates camera tilt, scale, and ghost opacity for overhead and pin-match", () => {
  const overhead = applyArPreset("overhead-desk");
  assert.ok(overhead.deskTiltDeg >= 80);

  const pinMatch = applyArPreset("close-pin-match");
  assert.ok(pinMatch.deskScale >= 1.5);
  assert.ok(pinMatch.modelOpacity < 0.75, "pin-match preset uses translucent X-ray ghost opacity");
});

test("formatRealScaleReadout and describeCameraError return localized clean strings", () => {
  const readout = formatRealScaleReadout(1.25);
  assert.equal(readout.scalePercent, 125);
  assert.ok(readout.esp32Label.includes("62.7"));

  const denied = new Error("User denied");
  denied.name = "NotAllowedError";
  const enMsg = describeCameraError(denied, "en");
  const roMsg = describeCameraError(denied, "ro");
  assert.ok(enMsg.title.toLowerCase().includes("denied"));
  assert.ok(roMsg.title.toLowerCase().includes("refuzat"));
});
