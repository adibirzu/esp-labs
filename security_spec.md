# ESP-Labs Studio — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Strict PII & Inventory Isolation**: Every document lives under `/users/{userId}/private/{docId}` (`profile` or `inventory`). No user can read, list, create, update, or delete another user's profile or hardware inventory.
2. **Verified Google SSO Mandate**: All read and write operations require `request.auth != null`, `request.auth.uid == userId`, and `request.auth.token.email_verified == true`.
3. **Immutable Ownership & Timestamps**: `uid`, `ownerId`, and `createdAt` cannot be modified after creation. `createdAt` (on create) and `updatedAt` (on create/update) must strictly equal server `request.time`.
4. **No Shadow Fields & Strict Volumetric Bounds**: Every document enforces exact `keys().hasAll(...)` and `keys().hasOnly(...)` allowlists, string `.size()` caps, map key caps (`ownedParts.size() <= 60`, `benchLayout.size() <= 12`), and list bounds (`customParts.size() <= 40`, `completedLabs.size() <= 60`, `savedIdeaIds.size() <= 40`).
5. **No Blanket List / Scraping**: No collection-wide `allow list` rules exist; all accesses target single validated document paths (`/users/{userId}/private/profile` and `/users/{userId}/private/inventory`).

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Be Rejected)
1. **Unauthenticated Read/Write**: `auth = null` attempting to read or write `/users/alice/private/inventory`.
2. **Cross-Tenant Theft**: Authenticated user `bob` (`email_verified: true`) reading `/users/alice/private/inventory`.
3. **Unverified Email Spoofing**: Authenticated user `alice` with `email_verified: false` writing `/users/alice/private/inventory`.
4. **Owner ID Spoofing on Create**: User `alice` creating `/users/alice/private/inventory` with `ownerId: "bob"`.
5. **Shadow / Ghost Field Injection (Create)**: User `alice` adding `isAdmin: true` or `role: "superadmin"` to profile or inventory.
6. **Shadow Field Injection (Update)**: User `alice` sending an update with extra undocumented key `proTier: true`.
7. **Immutable Field Tampering (Update)**: User `alice` attempting to alter `ownerId` or `createdAt` during an update.
8. **Client-Forged Timestamp**: User `alice` sending a backdated `updatedAt` instead of `serverTimestamp()` (`request.time`).
9. **Path ID Poisoning**: Document path `/users/../../../admin/private/inventory` or 500-char junk `userId`.
10. **Oversized Array Denial-of-Wallet**: `customParts` containing 45 items (exceeds `<= 40` cap) or non-string first element (`[12345]`).
11. **Oversized Map / String Payload**: `displayName` of 500 characters (exceeds `<= 120` cap) or `ownedParts` with 80 keys (exceeds `<= 60` cap).
12. **Type Poisoning on Whitelisted Update Field**: Updating `ownedParts` to a string `"hacked"` instead of a `map`, or `completedLabs` to a number `42`.
