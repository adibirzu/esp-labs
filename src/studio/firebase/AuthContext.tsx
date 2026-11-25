import React, {
  Component,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db, googleProvider, handleFirestoreError, OperationType } from "./firebase";
import {
  BLUEPRINT_LIMITS,
  sanitizeBenchLayout,
  sanitizeInventoryVault,
  sanitizeProfileStrings,
  type BenchLayoutMap,
} from "./payload-validators";
import type { InventoryCategory } from "../data/inventory";

export interface CustomHardwareItem {
  id: string;
  ownerId: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  voltage: string;
  interfaceSpec: string;
  notes: string;
  photoDataUrl?: string;
}

export interface CloudVaultData {
  ownedParts: Record<string, number>;
  customParts: string[];
  completedLabs: string[];
  savedIdeaIds: string[];
  benchLayout: BenchLayoutMap;
}

interface AuthContextValue {
  user: User | null;
  authReady: boolean;
  signingIn: boolean;
  syncStatus: "idle" | "syncing" | "synced" | "error";
  authError: string | null;
  vaultLoaded: boolean;
  cloudVault: CloudVaultData | null;
  customPhotoParts: CustomHardwareItem[];
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  saveInventoryVault: (data: CloudVaultData) => Promise<void>;
  saveBenchLayout: (layout: BenchLayoutMap) => Promise<void>;
  addCustomHardwareItem: (
    item: Omit<CustomHardwareItem, "id" | "ownerId">,
  ) => Promise<void>;
  updateCustomHardwareQty: (partId: string, quantity: number) => Promise<void>;
  deleteCustomHardwareItem: (partId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export class FirebaseErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message || "Unexpected error" };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 p-6">
          <div className="max-w-lg w-full rounded-2xl border border-rose-500/40 bg-white dark:bg-slate-900 p-6 space-y-3">
            <h2 className="text-base font-bold text-rose-600 dark:text-rose-400">
              Eroare sincronizare securizată / Sync Error
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-mono break-all">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, message: "" })}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer"
            >
              Reîncearcă / Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [vaultLoaded, setVaultLoaded] = useState(false);
  const [cloudVault, setCloudVault] = useState<CloudVaultData | null>(null);
  const [customPhotoParts, setCustomPhotoParts] = useState<CustomHardwareItem[]>([]);
  const vaultExistsRef = useRef(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      setAuthError(null);

      if (!nextUser) {
        setCloudVault(null);
        setCustomPhotoParts([]);
        setVaultLoaded(false);
        vaultExistsRef.current = false;
        setSyncStatus("idle");
        return;
      }

      // Sync owner-only private profile document
      try {
        const profileRef = doc(db, "users", nextUser.uid, "private", "profile");
        const snap = await getDoc(profileRef);
        const cleanProfile = sanitizeProfileStrings({
          email: nextUser.email ?? `${nextUser.uid}@users.local`,
          displayName: nextUser.displayName ?? "ESP Maker",
          photoURL: nextUser.photoURL,
        });

        if (!snap.exists()) {
          await setDoc(profileRef, {
            uid: nextUser.uid,
            email: cleanProfile.email,
            displayName: cleanProfile.displayName,
            ...(cleanProfile.photoURL ? { photoURL: cleanProfile.photoURL } : {}),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(profileRef, {
            email: cleanProfile.email,
            displayName: cleanProfile.displayName,
            ...(cleanProfile.photoURL ? { photoURL: cleanProfile.photoURL } : {}),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.error("Profile sync warning:", err);
        setAuthError(
          err instanceof Error ? err.message : "Could not sync user profile",
        );
      }
    });

    return () => unsubAuth();
  }, []);

  // Attach Firestore real-time listeners ONLY when auth is ready and user is authenticated
  useEffect(() => {
    if (!authReady || !user) return;

    const uid = user.uid;
    const invPath = `users/${uid}/private/inventory`;
    const invRef = doc(db, "users", uid, "private", "inventory");

    const unsubInv = onSnapshot(
      invRef,
      (snap) => {
        if (snap.exists()) {
          vaultExistsRef.current = true;
          const d = snap.data();
          setCloudVault({
            ownedParts: (d.ownedParts as Record<string, number>) ?? {},
            customParts: Array.isArray(d.customParts) ? (d.customParts as string[]) : [],
            completedLabs: Array.isArray(d.completedLabs) ? (d.completedLabs as string[]) : [],
            savedIdeaIds: Array.isArray(d.savedIdeaIds) ? (d.savedIdeaIds as string[]) : [],
            benchLayout: (d.benchLayout as BenchLayoutMap) ?? {},
          });
          setSyncStatus("synced");
        } else {
          vaultExistsRef.current = false;
          setCloudVault(null);
          setSyncStatus("idle");
        }
        setVaultLoaded(true);
      },
      (error) => {
        setSyncStatus("error");
        handleFirestoreError(error, OperationType.GET, invPath);
      },
    );

    const customColPath = `users/${uid}/custom_parts`;
    const customQuery = query(
      collection(db, "users", uid, "custom_parts"),
      where("ownerId", "==", uid),
    );
    const unsubCustom = onSnapshot(
      customQuery,
      (snap) => {
        const items: CustomHardwareItem[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: String(d.id ?? docSnap.id),
            ownerId: String(d.ownerId ?? uid),
            name: String(d.name ?? ""),
            category: (d.category as InventoryCategory) ?? "sensors",
            quantity: Number(d.quantity ?? 1),
            voltage: String(d.voltage ?? "3.3V"),
            interfaceSpec: String(d.interfaceSpec ?? "GPIO"),
            notes: String(d.notes ?? ""),
            photoDataUrl: typeof d.photoDataUrl === "string" ? d.photoDataUrl : undefined,
          };
        });
        setCustomPhotoParts(items);
      },
      (error) => {
        setSyncStatus("error");
        handleFirestoreError(error, OperationType.LIST, customColPath);
      },
    );

    return () => {
      unsubInv();
      unsubCustom();
    };
  }, [authReady, user]);

  const signInWithGoogle = useCallback(async () => {
    setSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("popup-closed-by-user")) {
        setAuthError(msg);
      }
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    setAuthError(null);
    await signOut(auth);
  }, []);

  const saveInventoryVault = useCallback(
    async (data: CloudVaultData) => {
      if (!user) return;
      const uid = user.uid;
      const invPath = `users/${uid}/private/inventory`;
      const invRef = doc(db, "users", uid, "private", "inventory");
      const clean = sanitizeInventoryVault(data);
      setSyncStatus("syncing");
      try {
        if (!vaultExistsRef.current) {
          const existingSnap = await getDoc(invRef);
          vaultExistsRef.current = existingSnap.exists();
        }
        if (!vaultExistsRef.current) {
          await setDoc(invRef, {
            ownerId: uid,
            ownedParts: clean.ownedParts,
            customParts: clean.customParts,
            completedLabs: clean.completedLabs,
            savedIdeaIds: clean.savedIdeaIds,
            benchLayout: clean.benchLayout,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          vaultExistsRef.current = true;
        } else {
          await updateDoc(invRef, {
            ownedParts: clean.ownedParts,
            customParts: clean.customParts,
            completedLabs: clean.completedLabs,
            savedIdeaIds: clean.savedIdeaIds,
            benchLayout: clean.benchLayout,
            updatedAt: serverTimestamp(),
          });
        }
        setSyncStatus("synced");
      } catch (err) {
        setSyncStatus("error");
        handleFirestoreError(err, OperationType.WRITE, invPath);
      }
    },
    [user],
  );

  const saveBenchLayout = useCallback(
    async (layout: BenchLayoutMap) => {
      if (!user) return;
      const uid = user.uid;
      const invPath = `users/${uid}/private/inventory`;
      const invRef = doc(db, "users", uid, "private", "inventory");
      const cleanLayout = sanitizeBenchLayout(layout);
      setSyncStatus("syncing");
      try {
        if (!vaultExistsRef.current) {
          const existingSnap = await getDoc(invRef);
          vaultExistsRef.current = existingSnap.exists();
        }
        if (!vaultExistsRef.current) {
          await setDoc(invRef, {
            ownerId: uid,
            ownedParts: {},
            customParts: [],
            completedLabs: [],
            savedIdeaIds: [],
            benchLayout: cleanLayout,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          vaultExistsRef.current = true;
        } else {
          await updateDoc(invRef, {
            benchLayout: cleanLayout,
            updatedAt: serverTimestamp(),
          });
        }
        setSyncStatus("synced");
      } catch (err) {
        setSyncStatus("error");
        handleFirestoreError(err, OperationType.UPDATE, invPath);
      }
    },
    [user],
  );

  const addCustomHardwareItem = useCallback(
    async (item: Omit<CustomHardwareItem, "id" | "ownerId">) => {
      if (!user) return;
      const uid = user.uid;
      const partId = `hw_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      const path = `users/${uid}/custom_parts/${partId}`;
      const docRef = doc(db, "users", uid, "custom_parts", partId);
      setSyncStatus("syncing");
      try {
        const cleanName = item.name.trim().slice(0, 100);
        if (!cleanName) return;
        const payload: Record<string, unknown> = {
          id: partId,
          ownerId: uid,
          name: cleanName,
          category: item.category,
          quantity: Math.max(1, Math.min(999, Math.floor(item.quantity || 1))),
          voltage: (item.voltage || "3.3V").trim().slice(0, 40),
          interfaceSpec: (item.interfaceSpec || "GPIO").trim().slice(0, 60),
          notes: (item.notes || "").trim().slice(0, 400),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        if (item.photoDataUrl && item.photoDataUrl.length <= 140000) {
          payload.photoDataUrl = item.photoDataUrl;
        }
        await setDoc(docRef, payload);
        setSyncStatus("synced");
      } catch (err) {
        setSyncStatus("error");
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [user],
  );

  const updateCustomHardwareQty = useCallback(
    async (partId: string, quantity: number) => {
      if (!user || !BLUEPRINT_LIMITS.ID_PATTERN.test(partId)) return;
      const uid = user.uid;
      const path = `users/${uid}/custom_parts/${partId}`;
      const docRef = doc(db, "users", uid, "custom_parts", partId);
      setSyncStatus("syncing");
      try {
        const nextQty = Math.max(1, Math.min(999, Math.floor(quantity)));
        await updateDoc(docRef, {
          quantity: nextQty,
          updatedAt: serverTimestamp(),
        });
        setSyncStatus("synced");
      } catch (err) {
        setSyncStatus("error");
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user],
  );

  const deleteCustomHardwareItem = useCallback(
    async (partId: string) => {
      if (!user || !BLUEPRINT_LIMITS.ID_PATTERN.test(partId)) return;
      const uid = user.uid;
      const path = `users/${uid}/custom_parts/${partId}`;
      const docRef = doc(db, "users", uid, "custom_parts", partId);
      setSyncStatus("syncing");
      try {
        await deleteDoc(docRef);
        setSyncStatus("synced");
      } catch (err) {
        setSyncStatus("error");
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        authReady,
        signingIn,
        syncStatus,
        authError,
        vaultLoaded,
        cloudVault,
        customPhotoParts,
        signInWithGoogle,
        signOutUser,
        saveInventoryVault,
        saveBenchLayout,
        addCustomHardwareItem,
        updateCustomHardwareQty,
        deleteCustomHardwareItem,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
