import { auth, db, googleProvider } from "./firebase-config.js";
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

const PUBLIC_ALLOWED_ROLES = ["lawyer", "client"];
const ALL_ALLOWED_ROLES = ["lawyer", "admin", "client"];

function normalizeRole(role, allowAdmin = false) {
  const normalized = String(role || "lawyer").toLowerCase();
  const allowedRoles = allowAdmin ? ALL_ALLOWED_ROLES : PUBLIC_ALLOWED_ROLES;

  if (!allowedRoles.includes(normalized)) {
    throw new Error("Invalid role selection.");
  }

  return normalized;
}

export async function registerUser(email, password, fullName, role, options = {}) {
  const normalizedRole = normalizeRole(role, Boolean(options.allowAdmin));

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      fullName: fullName,
      email: email,
      role: normalizedRole,
      phone: "",
      isActive: true,
      practiceName: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return user;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
}

export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
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
    const userDocRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        fullName: user.displayName || "Google User",
        email: user.email || "",
        role: "lawyer",
        phone: user.phoneNumber || "",
        isActive: true,
        practiceName: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    return user;
  } catch (error) {
    console.error("Error with Google sign in:", error);
    throw error;
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}

export async function getCurrentUserProfile(uid) {
  if (!uid) {
    return null;
  }

  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export function redirectByRole(role) {
  switch (role) {
    case "lawyer":
      window.location.href = "dashboard.html";
      break;
    case "admin":
      window.location.href = "admin.html";
      break;
    case "client":
      window.location.href = "client-dashboard.html";
      break;
    default:
      window.location.href = "dashboard.html";
      break;
  }
}

export function listenToAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}
