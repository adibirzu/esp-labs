import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LABS } from "../data/labs";
import { evaluateDigitalBadges, findNewlyUnlockedBadges } from "./badges";

describe("Digital Badge System Engine", () => {
  it("starts with 0 unlocked badges for a brand-new user and includes ESP Rookie, Soldering Master, and Code Whisperer", () => {
    const summary = evaluateDigitalBadges({
      completedLabIds: [],
      labs: LABS,
      savedIdeaIds: [],
      playgroundRuns: 0,
      solvedQuizIds: [],
      ownedPartsCount: 0,
    });

    assert.equal(summary.unlockedCount, 0);
    assert.equal(summary.badges.length, 9);
    const ids = summary.badges.map((b) => b.id);
    assert.ok(ids.includes("esp-rookie"));
    assert.ok(ids.includes("soldering-master"));
    assert.ok(ids.includes("code-whisperer"));
    assert.equal(summary.badges.find((b) => b.id === "esp-rookie")?.titleEn, "ESP Rookie");
    assert.equal(summary.badges.find((b) => b.id === "soldering-master")?.titleEn, "Soldering Master");
    assert.equal(summary.badges.find((b) => b.id === "code-whisperer")?.titleEn, "Code Whisperer");
  });

  it("unlocks ESP Rookie on first intro lab or playground run", () => {
    const byLab = evaluateDigitalBadges({
      completedLabIds: ["intro-1"],
      labs: LABS,
      savedIdeaIds: [],
      playgroundRuns: 0,
      solvedQuizIds: [],
    });
    assert.equal(byLab.badges.find((b) => b.id === "esp-rookie")?.unlocked, true);

    const byRun = evaluateDigitalBadges({
      completedLabIds: [],
      labs: LABS,
      savedIdeaIds: [],
      playgroundRuns: 1,
      solvedQuizIds: [],
    });
    assert.equal(byRun.badges.find((b) => b.id === "esp-rookie")?.unlocked, true);
  });

  it("unlocks Soldering Master across multi-track hardware builds and Code Whisperer after 3 live code runs", () => {
    const summary = evaluateDigitalBadges({
      completedLabIds: ["intro-1", "display-1", "sound-1", "rfid-1"],
      labs: LABS,
      savedIdeaIds: ["idea-1", "idea-2", "idea-3"],
      playgroundRuns: 3,
      solvedQuizIds: [],
    });

    assert.equal(summary.badges.find((b) => b.id === "soldering-master")?.unlocked, true);
    assert.equal(summary.badges.find((b) => b.id === "code-whisperer")?.unlocked, true);
    assert.equal(summary.badges.find((b) => b.id === "oled-artisan")?.unlocked, true);
    assert.equal(summary.badges.find((b) => b.id === "chiptune-composer")?.unlocked, true);
    assert.equal(summary.badges.find((b) => b.id === "rfid-guardian")?.unlocked, true);
    assert.equal(summary.badges.find((b) => b.id === "project-architect")?.unlocked, true);
  });

  it("preserves cloud-persisted badges and detects newly unlocked badges cleanly", () => {
    const prev = evaluateDigitalBadges({
      completedLabIds: ["intro-1"],
      labs: LABS,
      savedIdeaIds: [],
      playgroundRuns: 0,
      solvedQuizIds: [],
    });

    const next = evaluateDigitalBadges({
      completedLabIds: ["intro-1", "display-1"],
      labs: LABS,
      savedIdeaIds: [],
      playgroundRuns: 3,
      solvedQuizIds: [],
      persistedBadgeIds: ["rfid-guardian"],
    });

    assert.equal(next.badges.find((b) => b.id === "rfid-guardian")?.unlocked, true);
    const newlyUnlocked = findNewlyUnlockedBadges(prev.unlockedIds, next.badges).map((b) => b.id);
    assert.ok(newlyUnlocked.includes("oled-artisan"));
    assert.ok(newlyUnlocked.includes("code-whisperer"));
    assert.ok(newlyUnlocked.includes("rfid-guardian"));
    assert.ok(!newlyUnlocked.includes("esp-rookie"));
  });
});
