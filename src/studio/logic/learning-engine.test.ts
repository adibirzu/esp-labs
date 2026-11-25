import test from "node:test";
import assert from "node:assert/strict";
import { OFFICIAL_DOC_PORTALS, OFFICIAL_ESP_BOARDS } from "../data/boards";
import { CHIP_BLOCKS, MEMORY_REGIONS, POWER_MODES, REGISTERS } from "../data/chip";
import { CODE_TOURS, GLOSSARY } from "../data/code";
import { PROJECT_IDEAS } from "../data/ideas";
import { KIT_PARTS } from "../data/kit";
import { LABS, TRACKS } from "../data/labs";
import { ALL_PINS, PERIPHERAL_MODULES } from "../data/pinout";
import {
  localizeBoard,
  localizeChipBlock,
  localizeCodeTour,
  localizeDocPortal,
  localizeGlossary,
  localizeIdea,
  localizeKitPart,
  localizeLab,
  localizeMemoryRegion,
  localizeModule,
  localizePin,
  localizePowerMode,
  localizeRegister,
  localizeTrack,
} from "../data/ro-overrides";
import {
  computeLearnerProgress,
  getIdeasForAudience,
  getRecommendedLabsForAudience,
} from "./learning-engine";

test("computeLearnerProgress computes XP, level progression, and unlocked badges", () => {
  const starter = computeLearnerProgress([], LABS, [], 0, []);
  assert.equal(starter.xp, 0);
  assert.equal(starter.level, 1);
  assert.equal(starter.unlockedCount, 0);

  const active = computeLearnerProgress(
    ["intro-1", "display-1", "wifi-1", "ble-1", "sound-1", "rfid-1", "iot-1"],
    LABS,
    ["idea-smart-rfid-vault", "idea-pocket-chiptune-synth"],
    3,
    ["q1", "q2"],
  );
  // 7*50 + 2*15 + 3*20 + 2*35 = 350 + 30 + 60 + 70 = 510 XP -> Level 3
  assert.equal(active.xp, 510);
  assert.equal(active.level, 3);
  assert.equal(active.unlockedCount, 6);
});

test("audience recommendations return curated sets for kids and adults", () => {
  const kidsLabs = getRecommendedLabsForAudience(LABS, "kids");
  const adultLabs = getRecommendedLabsForAudience(LABS, "adults");
  assert.ok(kidsLabs.length >= 8);
  assert.ok(adultLabs.length >= 8);
  assert.equal(kidsLabs[0].code, "I1");
  assert.equal(adultLabs[0].code, "I2");

  const kidsIdeas = getIdeasForAudience(PROJECT_IDEAS, "kids");
  const adultIdeas = getIdeasForAudience(PROJECT_IDEAS, "adults");
  assert.ok(kidsIdeas.length >= 4);
  assert.ok(adultIdeas.length >= 4);
});

test("100% of data entries have distinct Romanian localizations", () => {
  for (const track of TRACKS) {
    const ro = localizeTrack(track, "ro");
    assert.notEqual(ro.desc, track.desc, `Missing RO track desc for ${track.id}`);
  }
  for (const lab of LABS) {
    const ro = localizeLab(lab, "ro");
    assert.notEqual(ro.title, lab.title, `Missing RO lab title for ${lab.id}`);
    assert.notEqual(ro.summary, lab.summary, `Missing RO lab summary for ${lab.id}`);
  }
  for (const idea of PROJECT_IDEAS) {
    const ro = localizeIdea(idea, "ro");
    assert.notEqual(ro.title, idea.title, `Missing RO idea title for ${idea.id}`);
    assert.notEqual(ro.summary, idea.summary, `Missing RO idea summary for ${idea.id}`);
  }
  for (const board of OFFICIAL_ESP_BOARDS) {
    const ro = localizeBoard(board, "ro");
    assert.notEqual(ro.tagline, board.tagline, `Missing RO board tagline for ${board.id}`);
  }
  for (const doc of OFFICIAL_DOC_PORTALS) {
    const ro = localizeDocPortal(doc, "ro");
    assert.notEqual(ro.title, doc.title, `Missing RO doc portal for ${doc.id}`);
  }
  for (const part of KIT_PARTS) {
    const ro = localizeKitPart(part, "ro");
    assert.notEqual(ro.category, part.category, `Missing RO kit part for ${part.id}`);
  }
  for (const block of CHIP_BLOCKS) {
    const ro = localizeChipBlock(block, "ro");
    assert.notEqual(ro.summary, block.summary, `Missing RO chip block for ${block.id}`);
  }
  for (const reg of REGISTERS) {
    const ro = localizeRegister(reg, "ro");
    assert.notEqual(ro.desc, reg.desc, `Missing RO register for ${reg.id}`);
  }
  for (const mem of MEMORY_REGIONS) {
    const ro = localizeMemoryRegion(mem, "ro");
    assert.notEqual(ro.desc, mem.desc, `Missing RO memory region for ${mem.name}`);
  }
  for (const pm of POWER_MODES) {
    const ro = localizePowerMode(pm, "ro");
    assert.notEqual(ro.desc, pm.desc, `Missing RO power mode for ${pm.id}`);
  }
  for (const [k, entry] of Object.entries(GLOSSARY)) {
    const ro = localizeGlossary(k, entry, "ro");
    assert.notEqual(ro.desc, entry.desc, `Missing RO glossary for ${k}`);
  }
  for (const tour of CODE_TOURS) {
    const ro = localizeCodeTour(tour, "ro");
    assert.notEqual(ro.title, tour.title, `Missing RO code tour for ${tour.id}`);
  }
  for (const pin of ALL_PINS) {
    const ro = localizePin(pin, "ro");
    assert.notEqual(ro.notes, pin.notes, `Missing RO pin notes for ${pin.id}`);
  }
  for (const mod of PERIPHERAL_MODULES) {
    const ro = localizeModule(mod, "ro");
    assert.notEqual(ro.name, mod.name, `Missing RO module for ${mod.id}`);
  }
});
