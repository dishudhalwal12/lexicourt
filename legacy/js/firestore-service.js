import { db, auth, storage } from "./firebase-config.js";
import { getCachedUserProfileSnapshot, isPermissionDeniedError } from "./auth-service.js";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";

function requireAuth() {
  if (!auth.currentUser) {
    throw new Error("Not authenticated");
  }

  return auth.currentUser;
}

function toMillis(value) {
  if (!value) {
    return 0;
  }

  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  return 0;
}

function sortByTimestampDesc(items, key) {
  return [...items].sort((a, b) => toMillis(b[key]) - toMillis(a[key]));
}

function sortByTimestampAsc(items, key) {
  return [...items].sort((a, b) => toMillis(a[key]) - toMillis(b[key]));
}

async function getUserRole() {
  const user = requireAuth();
  try {
    const profile = await getDoc(doc(db, "users", user.uid));
    return profile.exists() ? profile.data().role : null;
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      return getCachedUserProfileSnapshot(user.uid)?.role || "lawyer";
    }

    throw error;
  }
}

async function canUseAdminDataPath() {
  const role = await getUserRole();
  return role === "admin";
}

export function formatFirestoreDate(value, fallback = "—") {
  if (!value) {
    return fallback;
  }

  const date = typeof value.toDate === "function" ? value.toDate() : value instanceof Date ? value : null;
  return date ? date.toLocaleDateString("en-IN") : fallback;
}

export function getCaseIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("caseId");
}

export function buildCaseUrl(path, caseId) {
  const target = new URL(path, window.location.href);
  if (caseId) {
    target.searchParams.set("caseId", caseId);
  }

  return `${target.pathname}${target.search}${target.hash}`;
}

async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read the selected file."));
    reader.readAsDataURL(file);
  });
}

export async function createCase(caseData) {
  const user = requireAuth();
  const docRef = await addDoc(collection(db, "caseFolders"), {
    ...caseData,
    ownerUid: user.uid,
    assignedUserIds: [user.uid],
    clientId: caseData.clientId || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  await updateDoc(docRef, { caseId: docRef.id });
  return docRef.id;
}

export async function updateCase(caseId, updates) {
  await updateDoc(doc(db, "caseFolders", caseId), {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

export async function deleteCase(caseId) {
  await deleteDoc(doc(db, "caseFolders", caseId));
}

export async function getCasesForCurrentUser() {
  const user = requireAuth();
  let role = "lawyer";

  try {
    role = (await getUserRole()) || "lawyer";
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error;
    }
  }

  const isAdmin = role === "admin";

  try {
    if (isAdmin) {
      return getAllCasesAdmin();
    }

    if (role === "client") {
      const shares = await getClientSharedItems(user.uid);
      const seenIds = new Set();
      const sharedCases = [];

      for (const share of shares) {
        if (!share.caseId || seenIds.has(share.caseId)) {
          continue;
        }

        seenIds.add(share.caseId);
        const caseItem = await getCaseById(share.caseId);
        if (caseItem) {
          sharedCases.push(caseItem);
        }
      }

      return sortByTimestampDesc(sharedCases, "updatedAt");
    }

    const cases = [];
    const seenIds = new Set();

    const appendSnapshot = (snapshot) => {
      snapshot.forEach((item) => {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          cases.push({ ...item.data(), id: item.id });
        }
      });
    };

    appendSnapshot(await getDocs(query(collection(db, "caseFolders"), where("ownerUid", "==", user.uid))));
    appendSnapshot(await getDocs(query(collection(db, "caseFolders"), where("assignedUserIds", "array-contains", user.uid))));
    appendSnapshot(await getDocs(query(collection(db, "caseFolders"), where("clientId", "==", user.uid))));

    return sortByTimestampDesc(cases, "updatedAt");
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      return [];
    }

    throw error;
  }
}

export async function getAllCasesAdmin() {
  const snapshot = await getDocs(collection(db, "caseFolders"));
  const cases = [];
  snapshot.forEach((item) => {
    cases.push({ ...item.data(), id: item.id });
  });
  return sortByTimestampDesc(cases, "updatedAt");
}

export async function getCaseById(caseId) {
  if (!caseId) {
    return null;
  }

  const docSnap = await getDoc(doc(db, "caseFolders", caseId));
  return docSnap.exists() ? { ...docSnap.data(), id: docSnap.id } : null;
}

export async function createDocumentRecord(docData) {
  const user = requireAuth();
  const docRef = await addDoc(collection(db, "documents"), {
    ...docData,
    ownerUid: user.uid,
    uploadStatus: docData.uploadStatus || "completed",
    uploadedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  await updateDoc(docRef, { documentId: docRef.id });
  return docRef.id;
}

function sanitizeFileName(fileName) {
  return String(fileName || "document")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "document";
}

export async function uploadCaseFileToStorage(caseId, file) {
  if (!caseId) {
    throw new Error("Case ID is required for file upload.");
  }
  if (!(file instanceof File)) {
    throw new Error("A valid file is required.");
  }

  const user = requireAuth();

  const safeName = sanitizeFileName(file.name);
  const storagePath = `cases/${caseId}/${Date.now()}-${safeName}`;
  const storageRef = ref(storage, storagePath);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type || "application/octet-stream",
    customMetadata: {
      ownerUid: user.uid,
      caseId
    }
  });
  const downloadURL = await getDownloadURL(snapshot.ref);

  return {
    storagePath,
    downloadURL,
    fileName: safeName,
    mimeType: file.type || "application/octet-stream",
    fileSize: file.size || 0
  };
}

export async function getDocumentsByCase(caseId) {
  if (!caseId) {
    return [];
  }

  const snapshot = await getDocs(query(collection(db, "documents"), where("caseId", "==", caseId)));
  const docs = [];
  snapshot.forEach((item) => {
    docs.push({ ...item.data(), id: item.id });
  });
  return sortByTimestampDesc(docs, "uploadedAt");
}

export async function saveDraft(draftData) {
  const user = requireAuth();
  const docRef = await addDoc(collection(db, "drafts"), {
    ...draftData,
    requestedBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  await updateDoc(docRef, { draftId: docRef.id });
  return docRef.id;
}

export async function getDraftsByCase(caseId) {
  if (!caseId) {
    return [];
  }

  const snapshot = await getDocs(query(collection(db, "drafts"), where("caseId", "==", caseId)));
  const drafts = [];
  snapshot.forEach((item) => {
    drafts.push({ ...item.data(), id: item.id });
  });
  return sortByTimestampDesc(drafts, "updatedAt");
}

export async function saveTimeline(timelineData) {
  const user = requireAuth();
  const docRef = await addDoc(collection(db, "timelines"), {
    ...timelineData,
    generatedBy: user.uid,
    generatedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  await updateDoc(docRef, { timelineId: docRef.id });
  return docRef.id;
}

export async function getTimelineByCase(caseId) {
  if (!caseId) {
    return [];
  }

  const snapshot = await getDocs(query(collection(db, "timelines"), where("caseId", "==", caseId)));
  const timelines = [];
  snapshot.forEach((item) => {
    timelines.push({ ...item.data(), id: item.id });
  });
  return sortByTimestampDesc(timelines, "generatedAt");
}

export async function saveSummary(summaryData) {
  const user = requireAuth();
  const docRef = await addDoc(collection(db, "summaries"), {
    ...summaryData,
    requestedBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  await updateDoc(docRef, { summaryId: docRef.id });
  return docRef.id;
}

export async function getSummariesByCase(caseId) {
  if (!caseId) {
    return [];
  }

  const snapshot = await getDocs(query(collection(db, "summaries"), where("caseId", "==", caseId)));
  const summaries = [];
  snapshot.forEach((item) => {
    summaries.push({ ...item.data(), id: item.id });
  });
  return sortByTimestampDesc(summaries, "updatedAt");
}

export async function saveAiChat(chatData) {
  const user = requireAuth();
  const docRef = await addDoc(collection(db, "aiChats"), {
    ...chatData,
    userUid: user.uid,
    createdAt: serverTimestamp()
  });
  await updateDoc(docRef, { chatId: docRef.id });
  return docRef.id;
}

export async function getAiChatsByCase(caseId) {
  if (!caseId) {
    return [];
  }

  const snapshot = await getDocs(query(collection(db, "aiChats"), where("caseId", "==", caseId)));
  const chats = [];
  snapshot.forEach((item) => {
    chats.push({ ...item.data(), id: item.id });
  });
  return sortByTimestampAsc(chats, "createdAt");
}

export async function createReadinessCheck(checkData) {
  const user = requireAuth();
  const docRef = await addDoc(collection(db, "readinessChecks"), {
    ...checkData,
    generatedBy: user.uid,
    createdAt: serverTimestamp()
  });
  await updateDoc(docRef, { checkId: docRef.id });
  return docRef.id;
}

export async function getReadinessChecksByCase(caseId) {
  if (!caseId) {
    return [];
  }

  const snapshot = await getDocs(query(collection(db, "readinessChecks"), where("caseId", "==", caseId)));
  const checks = [];
  snapshot.forEach((item) => {
    checks.push({ ...item.data(), id: item.id });
  });
  return sortByTimestampDesc(checks, "createdAt");
}

export async function createClientShare(shareData) {
  const user = requireAuth();
  const caseId = shareData.caseId;
  const clientUid = shareData.clientUid;
  const shareId = `${caseId}_${clientUid}`;

  await setDoc(doc(db, "clientShares", shareId), {
    ...shareData,
    shareId,
    sharedBy: user.uid,
    createdAt: serverTimestamp()
  });

  return shareId;
}

export async function getClientSharedItems(clientUid) {
  const uid = clientUid || requireAuth().uid;
  const snapshot = await getDocs(query(collection(db, "clientShares"), where("clientUid", "==", uid)));
  const shares = [];
  snapshot.forEach((item) => {
    shares.push({ ...item.data(), id: item.id });
  });
  return shares;
}

export async function getAdminUsersList() {
  const snapshot = await getDocs(collection(db, "users"));
  const users = [];
  snapshot.forEach((item) => {
    users.push({ ...item.data(), id: item.id });
  });
  return users;
}

export async function updateCurrentUserProfile(updates) {
  const user = requireAuth();
  await updateDoc(doc(db, "users", user.uid), {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

export async function saveMlPrediction(predictionData) {
  const user = requireAuth();
  const docRef = await addDoc(collection(db, "mlPredictions"), {
    ...predictionData,
    generatedBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  await updateDoc(docRef, { predictionId: docRef.id });
  return docRef.id;
}

export async function getMlPredictionsByCase(caseId) {
  if (!caseId) {
    return [];
  }

  const snapshot = await getDocs(query(collection(db, "mlPredictions"), where("caseId", "==", caseId)));
  const predictions = [];
  snapshot.forEach((item) => {
    predictions.push({ ...item.data(), id: item.id });
  });
  return sortByTimestampDesc(predictions, "updatedAt");
}
