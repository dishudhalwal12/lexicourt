import { auth, db, googleProvider } from "./firebase-config.js";
import { navigateTo } from "./demo-state.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const PUBLIC_ALLOWED_ROLES = ["lawyer"];
const ALL_ALLOWED_ROLES = ["lawyer", "admin", "client"];
const POST_AUTH_INTENT_KEY = "lexicourt:post-auth-intent";
const POST_AUTH_INTENT_TTL_MS = 15000;
const USER_PROFILE_CACHE_KEY = "lexicourt:user-profile";

function normalizeRole(role, allowAdmin = false) {
  const normalized = String(role || "lawyer").toLowerCase();
  const allowedRoles = allowAdmin ? ALL_ALLOWED_ROLES : PUBLIC_ALLOWED_ROLES;

  if (!allowedRoles.includes(normalized)) {
    throw new Error("Invalid role selection.");
  }

  return normalized;
}

function buildUserProfileSnapshot({
  uid,
  fullName = "",
  email = "",
  role = "lawyer",
  phone = "",
  isActive = true,
  practiceName = ""
}) {
  return {
    uid: uid || "",
    fullName: fullName || "",
    email: email || "",
    role: String(role || "lawyer").toLowerCase(),
    phone: phone || "",
    isActive: isActive !== false,
    practiceName: practiceName || ""
  };
}

function buildAuthFallbackProfile(user, overrides = {}) {
  return buildUserProfileSnapshot({
    uid: overrides.uid || user?.uid || "",
    fullName: overrides.fullName || user?.displayName || "LexiCourt User",
    email: overrides.email || user?.email || "",
    role: overrides.role || "lawyer",
    phone: overrides.phone || user?.phoneNumber || "",
    isActive: overrides.isActive !== false,
    practiceName: overrides.practiceName || ""
  });
}

export function isPermissionDeniedError(error) {
  return error?.code === "permission-denied" || /insufficient permissions/i.test(String(error?.message || ""));
}

function isRecoverableProfileSyncError(error) {
  return (
    isPermissionDeniedError(error) ||
    error?.code === "failed-precondition" ||
    error?.code === "unavailable" ||
    /offline|network|timed out/i.test(String(error?.message || ""))
  );
}

async function waitForFirestoreAuth(user) {
  if (!user) {
    return;
  }

  try {
    await user.getIdToken();
  } catch (error) {
    console.warn("Unable to eagerly refresh auth token before Firestore sync:", error);
  }

  if (typeof auth?.authStateReady === "function") {
    try {
      await auth.authStateReady();
    } catch (error) {
      console.warn("Unable to confirm auth readiness before Firestore sync:", error);
    }
  }
}

async function syncUserProfileDoc(user, profileSnapshot) {
  const userDocRef = doc(db, "users", user.uid);
  const payload = {
    ...profileSnapshot,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await waitForFirestoreAuth(user);

  let lastError = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await setDoc(userDocRef, payload, { merge: true });
      return;
    } catch (error) {
      lastError = error;

      if (!isPermissionDeniedError(error) || attempt === 1) {
        throw error;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 250));
      await waitForFirestoreAuth(user);
    }
  }

  if (lastError) {
    throw lastError;
  }
}

async function ensureUserProfileDoc(user, overrides = {}) {
  if (!user?.uid) {
    return null;
  }

  const userDocRef = doc(db, "users", user.uid);
  const fallbackProfile = buildAuthFallbackProfile(user, {
    uid: user.uid,
    ...overrides
  });

  await waitForFirestoreAuth(user);

  try {
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const profile = docSnap.data();
      writeCachedUserProfileSnapshot({
        uid: user.uid,
        ...profile
      });
      return profile;
    }
  } catch (error) {
    if (!isRecoverableProfileSyncError(error)) {
      throw error;
    }
  }

  try {
    await syncUserProfileDoc(user, fallbackProfile);
  } catch (error) {
    if (!isRecoverableProfileSyncError(error)) {
      throw error;
    }

    console.warn("Falling back to local profile cache after profile recovery:", error);
  }

  writeCachedUserProfileSnapshot(fallbackProfile);
  return fallbackProfile;
}

function writeCachedUserProfileSnapshot(profile) {
  if (typeof window === "undefined" || !profile?.uid) {
    return;
  }

  try {
    window.localStorage.setItem(
      USER_PROFILE_CACHE_KEY,
      JSON.stringify({
        uid: profile.uid,
        fullName: profile.fullName || "",
        email: profile.email || "",
        role: String(profile.role || "lawyer").toLowerCase(),
        phone: profile.phone || "",
        isActive: profile.isActive !== false,
        practiceName: profile.practiceName || ""
      })
    );
  } catch (error) {
    console.warn("Unable to cache user profile:", error);
  }
}

export function getCachedUserProfileSnapshot(uid) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawProfile = window.localStorage.getItem(USER_PROFILE_CACHE_KEY);
    if (!rawProfile) {
      return null;
    }

    const parsedProfile = JSON.parse(rawProfile);
    if (!parsedProfile?.uid) {
      return null;
    }

    if (uid && parsedProfile.uid !== uid) {
      return null;
    }

    return parsedProfile;
  } catch (error) {
    console.warn("Unable to read cached user profile:", error);
    return null;
  }
}

function clearCachedUserProfileSnapshot() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(USER_PROFILE_CACHE_KEY);
  } catch (error) {
    console.warn("Unable to clear cached user profile:", error);
  }
}

export async function registerUser(email, password, fullName, role, options = {}) {
  const normalizedRole = normalizeRole(role, Boolean(options.allowAdmin));

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const profileSnapshot = buildUserProfileSnapshot({
      uid: user.uid,
      fullName,
      email,
      role: normalizedRole
    });

    try {
      await syncUserProfileDoc(user, profileSnapshot);
    } catch (error) {
      if (!isRecoverableProfileSyncError(error)) {
        throw error;
      }

      console.warn("Falling back to local profile cache after registration:", error);
    }

    writeCachedUserProfileSnapshot(profileSnapshot);

    return user;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
}

export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await ensureUserProfileDoc(userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
}

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const fallbackProfile = buildAuthFallbackProfile(user, {
      fullName: user.displayName || "Google User",
      role: "lawyer",
      phone: user.phoneNumber || ""
    });

    await ensureUserProfileDoc(user, fallbackProfile);

    return user;
  } catch (error) {
    console.error("Error with Google sign in:", error);
    throw error;
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
    clearCachedUserProfileSnapshot();
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}

export async function getCurrentUserProfile(uid, options = {}) {
  if (!uid) {
    return null;
  }

  const retries = Math.max(0, Number(options.retries) || 0);
  const delayMs = Math.max(0, Number(options.delayMs) || 250);
  const docRef = doc(db, "users", uid);
  let lastError = null;
  const cachedProfile = getCachedUserProfileSnapshot(uid);

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const profile = docSnap.data();
        writeCachedUserProfileSnapshot({
          uid,
          ...profile
        });
        return profile;
      }

      if (auth.currentUser && auth.currentUser.uid === uid) {
        return ensureUserProfileDoc(auth.currentUser, { uid });
      }

      if (cachedProfile) {
        return cachedProfile;
      }

      if (auth.currentUser && auth.currentUser.uid === uid) {
        return buildAuthFallbackProfile(auth.currentUser, { uid });
      }
    } catch (error) {
      lastError = error;

      if (isPermissionDeniedError(error)) {
        if (cachedProfile) {
          return cachedProfile;
        }

        if (auth.currentUser && auth.currentUser.uid === uid) {
          return buildAuthFallbackProfile(auth.currentUser, { uid });
        }
      }
    }

    if (attempt < retries) {
      await new Promise((resolve) => window.setTimeout(resolve, delayMs));
    }
  }

  if (lastError && !isPermissionDeniedError(lastError)) {
    console.error("Error fetching user profile:", lastError);
  }

  if (auth.currentUser && auth.currentUser.uid === uid) {
    return buildAuthFallbackProfile(auth.currentUser, { uid });
  }

  return cachedProfile;
}

export function getDashboardPathForRole(role) {
  switch (String(role || "lawyer").toLowerCase()) {
    case "admin":
      return "/admin";
    case "client":
      return "/client-dashboard";
    case "lawyer":
    default:
      return "/dashboard";
  }
}

export function rememberPostAuthIntent(role) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      POST_AUTH_INTENT_KEY,
      JSON.stringify({
        role: String(role || "lawyer").toLowerCase(),
        target: getDashboardPathForRole(role),
        createdAt: Date.now()
      })
    );
  } catch (error) {
    console.warn("Unable to store post-auth redirect intent:", error);
  }
}

export function readPostAuthIntent() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawIntent = window.sessionStorage.getItem(POST_AUTH_INTENT_KEY);
    if (!rawIntent) {
      return null;
    }

    const parsedIntent = JSON.parse(rawIntent);
    if (!parsedIntent?.createdAt || Date.now() - parsedIntent.createdAt > POST_AUTH_INTENT_TTL_MS) {
      clearPostAuthIntent();
      return null;
    }

    return parsedIntent;
  } catch (error) {
    console.warn("Unable to read post-auth redirect intent:", error);
    clearPostAuthIntent();
    return null;
  }
}

export function clearPostAuthIntent() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(POST_AUTH_INTENT_KEY);
  } catch (error) {
    console.warn("Unable to clear post-auth redirect intent:", error);
  }
}

export function redirectByRole(role, options = {}) {
  rememberPostAuthIntent(role);
  navigateTo(getDashboardPathForRole(role), options);
}

export function listenToAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}
