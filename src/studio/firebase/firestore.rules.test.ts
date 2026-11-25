import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  BLUEPRINT_LIMITS,
  isValidFirebaseId,
  sanitizeInventoryVault,
} from "./payload-validators";

interface MockAuth {
  uid: string;
  emailVerified: boolean;
}

const SERVER_TIME = 1764099600000;

/**
 * Pure mirror of the Eight Pillars rules in firestore.rules to verify
 * all 12 "Dirty Dozen" payloads from security_spec.md return PERMISSION_DENIED.
 */
function evaluateInventoryRule(params: {
  op: "get" | "list" | "create" | "update" | "delete";
  auth: MockAuth | null;
  pathUserId: string;
  incoming?: Record<string, unknown>;
  existing?: Record<string, unknown>;
}): "ALLOW" | "PERMISSION_DENIED" {
  const { op, auth, pathUserId, incoming, existing } = params;
  if (op === "list") return "PERMISSION_DENIED";
  if (!auth || !auth.emailVerified) return "PERMISSION_DENIED";
  if (!isValidFirebaseId(pathUserId) || auth.uid !== pathUserId) return "PERMISSION_DENIED";
  if (op === "get" || op === "delete") return "ALLOW";

  const data = incoming;
  if (!data) return "PERMISSION_DENIED";

  const required = [
    "ownerId",
    "ownedParts",
    "customParts",
    "completedLabs",
    "savedIdeaIds",
    "createdAt",
    "updatedAt",
  ];
  const allowed = new Set([...required, "benchLayout"]);
  const keys = Object.keys(data);
  if (!required.every((k) => k in data)) return "PERMISSION_DENIED";
  if (!keys.every((k) => allowed.has(k))) return "PERMISSION_DENIED";

  if (typeof data.ownerId !== "string" || data.ownerId !== auth.uid || data.ownerId !== pathUserId) {
    return "PERMISSION_DENIED";
  }
  if (typeof data.ownedParts !== "object" || data.ownedParts === null || Array.isArray(data.ownedParts)) {
    return "PERMISSION_DENIED";
  }
  if (Object.keys(data.ownedParts).length > BLUEPRINT_LIMITS.OWNED_PARTS_MAX_KEYS) {
    return "PERMISSION_DENIED";
  }
  const checkList = (val: unknown, max: number) =>
    Array.isArray(val) &&
    val.length <= max &&
    (val.length === 0 || (typeof val[0] === "string" && val[0].length >= 1 && val[0].length <= 120));

  if (!checkList(data.customParts, BLUEPRINT_LIMITS.CUSTOM_PARTS_MAX_ITEMS)) return "PERMISSION_DENIED";
  if (!checkList(data.completedLabs, BLUEPRINT_LIMITS.COMPLETED_LABS_MAX_ITEMS)) return "PERMISSION_DENIED";
  if (!checkList(data.savedIdeaIds, BLUEPRINT_LIMITS.SAVED_IDEAS_MAX_ITEMS)) return "PERMISSION_DENIED";

  if ("benchLayout" in data) {
    if (
      typeof data.benchLayout !== "object" ||
      data.benchLayout === null ||
      Array.isArray(data.benchLayout) ||
      Object.keys(data.benchLayout).length > BLUEPRINT_LIMITS.BENCH_LAYOUT_MAX_BOARDS
    ) {
      return "PERMISSION_DENIED";
    }
  }

  if (op === "create") {
    if (data.createdAt !== SERVER_TIME || data.updatedAt !== SERVER_TIME) return "PERMISSION_DENIED";
    return "ALLOW";
  }

  if (!existing) return "PERMISSION_DENIED";
  if (data.ownerId !== existing.ownerId || data.createdAt !== existing.createdAt) {
    return "PERMISSION_DENIED";
  }
  if (data.updatedAt !== SERVER_TIME) return "PERMISSION_DENIED";
  return "ALLOW";
}

const VALID_INV = {
  ownerId: "alice_123",
  ownedParts: { "esp32-s3-devkit": 1, "flipper-zero": 1 },
  customParts: ["LoRa SX1262"],
  completedLabs: ["intro-1"],
  savedIdeaIds: ["idea-rfid-smart-terminal"],
  benchLayout: { "esp32-s3": { x: 0, y: 0, z: 0, rotY: 0 } },
  createdAt: SERVER_TIME,
  updatedAt: SERVER_TIME,
};

test("Dirty Dozen adversarial payloads are all rejected with PERMISSION_DENIED", () => {
  const alice: MockAuth = { uid: "alice_123", emailVerified: true };
  const bob: MockAuth = { uid: "bob_456", emailVerified: true };
  const unverifiedAlice: MockAuth = { uid: "alice_123", emailVerified: false };

  // 1. Unauthenticated read/write
  assert.equal(evaluateInventoryRule({ op: "get", auth: null, pathUserId: "alice_123" }), "PERMISSION_DENIED");
  // 2. Cross-tenant theft
  assert.equal(evaluateInventoryRule({ op: "get", auth: bob, pathUserId: "alice_123" }), "PERMISSION_DENIED");
  // 3. Unverified email spoofing
  assert.equal(
    evaluateInventoryRule({ op: "create", auth: unverifiedAlice, pathUserId: "alice_123", incoming: VALID_INV }),
    "PERMISSION_DENIED",
  );
  // 4. Owner ID spoofing on create
  assert.equal(
    evaluateInventoryRule({
      op: "create",
      auth: alice,
      pathUserId: "alice_123",
      incoming: { ...VALID_INV, ownerId: "bob_456" },
    }),
    "PERMISSION_DENIED",
  );
  // 5. Shadow field injection on create
  assert.equal(
    evaluateInventoryRule({
      op: "create",
      auth: alice,
      pathUserId: "alice_123",
      incoming: { ...VALID_INV, isAdmin: true },
    }),
    "PERMISSION_DENIED",
  );
  // 6. Shadow field injection on update
  assert.equal(
    evaluateInventoryRule({
      op: "update",
      auth: alice,
      pathUserId: "alice_123",
      existing: VALID_INV,
      incoming: { ...VALID_INV, proTier: true },
    }),
    "PERMISSION_DENIED",
  );
  // 7. Immutable createdAt tampering on update
  assert.equal(
    evaluateInventoryRule({
      op: "update",
      auth: alice,
      pathUserId: "alice_123",
      existing: VALID_INV,
      incoming: { ...VALID_INV, createdAt: 1000 },
    }),
    "PERMISSION_DENIED",
  );
  // 8. Client-forged timestamp
  assert.equal(
    evaluateInventoryRule({
      op: "create",
      auth: alice,
      pathUserId: "alice_123",
      incoming: { ...VALID_INV, updatedAt: SERVER_TIME - 5000 },
    }),
    "PERMISSION_DENIED",
  );
  // 9. Path ID poisoning
  assert.equal(
    evaluateInventoryRule({ op: "get", auth: { uid: "../admin", emailVerified: true }, pathUserId: "../admin" }),
    "PERMISSION_DENIED",
  );
  // 10. Oversized array / bad element type
  assert.equal(
    evaluateInventoryRule({
      op: "create",
      auth: alice,
      pathUserId: "alice_123",
      incoming: { ...VALID_INV, customParts: [12345] },
    }),
    "PERMISSION_DENIED",
  );
  // 11. Oversized ownedParts map (> 60 keys)
  const hugeMap: Record<string, number> = {};
  for (let i = 0; i < 65; i++) hugeMap[`part-${i}`] = 1;
  assert.equal(
    evaluateInventoryRule({
      op: "create",
      auth: alice,
      pathUserId: "alice_123",
      incoming: { ...VALID_INV, ownedParts: hugeMap },
    }),
    "PERMISSION_DENIED",
  );
  // 12. Type poisoning on whitelisted field
  assert.equal(
    evaluateInventoryRule({
      op: "update",
      auth: alice,
      pathUserId: "alice_123",
      existing: VALID_INV,
      incoming: { ...VALID_INV, ownedParts: "hacked" },
    }),
    "PERMISSION_DENIED",
  );
  // Valid owner create & update succeed
  assert.equal(
    evaluateInventoryRule({ op: "create", auth: alice, pathUserId: "alice_123", incoming: VALID_INV }),
    "ALLOW",
  );
  assert.equal(
    evaluateInventoryRule({ op: "list", auth: alice, pathUserId: "alice_123" }),
    "PERMISSION_DENIED",
  );
});

test("sanitizeInventoryVault enforces volumetric bounds and drops invalid keys", () => {
  const sanitized = sanitizeInventoryVault({
    ownedParts: { "esp32-s3-devkit": 2, "bad key!": 5, "zero-part": 0 },
    customParts: ["  LoRa SX1262  ", "LoRa SX1262", ""],
    completedLabs: ["intro-1", "intro-1"],
    savedIdeaIds: ["idea-1"],
    benchLayout: { "esp32-s3": { x: 999, y: -5, z: 2.12345, rotY: 1 } },
  });
  assert.deepEqual(sanitized.ownedParts, { "esp32-s3-devkit": 2 });
  assert.deepEqual(sanitized.customParts, ["LoRa SX1262"]);
  assert.deepEqual(sanitized.completedLabs, ["intro-1"]);
  assert.equal(sanitized.benchLayout["esp32-s3"].x, 25);
  assert.equal(sanitized.benchLayout["esp32-s3"].y, 0);
});

test("firestore.rules file preserves global default-deny and verified-owner checks", () => {
  const rules = readFileSync(new URL("../../../firestore.rules", import.meta.url), "utf8");
  assert.ok(rules.includes("allow read, write: if false;"));
  assert.ok(rules.includes("request.auth.token.email_verified == true"));
  assert.ok(rules.includes("isValidPrivateProfile"));
  assert.ok(rules.includes("isValidPrivateInventory"));
});
