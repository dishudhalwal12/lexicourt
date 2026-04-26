import { db, auth, storage } from "./firebase-config.js";
import { getCachedUserProfileSnapshot, isPermissionDeniedError, getCurrentUserProfile } from "./auth-service.js";
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

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  }

  return 0;
}

function sortByTimestampDesc(items, key) {
  return [...items].sort((a, b) => toMillis(b[key]) - toMillis(a[key]));
}

function sortByTimestampAsc(items, key) {
  return [...items].sort((a, b) => toMillis(a[key]) - toMillis(b[key]));
}

function buildDataAccessError(message, cause) {
  const error = new Error(message);
  error.cause = cause;
  return error;
}

async function getUserRole() {
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    const profile = await getCurrentUserProfile(user.uid);
    const role = profile?.role || null;
    console.log(`Resolved role for ${user.uid}: ${role}`);
    return role;
  } catch (error) {
    const cachedRole = getCachedUserProfileSnapshot(user.uid)?.role || null;
    console.log(`Resolved role for ${user.uid} from cache: ${cachedRole}`);
    return cachedRole;
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

  const date = typeof value.toDate === "function"
    ? value.toDate()
    : value instanceof Date
      ? value
      : typeof value === "string"
        ? new Date(value)
        : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("en-IN") : fallback;
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

const LOCAL_DB_KEY = "lexicourt:local-db:v2";
const LOCAL_COLLECTIONS = [
  "caseFolders",
  "documents",
  "drafts",
  "timelines",
  "summaries",
  "aiChats",
  "readinessChecks",
  "mlPredictions",
  "clientShares",
  "users"
];

function createEmptyLocalDb() {
  return LOCAL_COLLECTIONS.reduce((dbState, key) => {
    dbState[key] = [];
    return dbState;
  }, {});
}

function readLocalDb() {
  if (typeof window === "undefined") {
    return createEmptyLocalDb();
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_DB_KEY) || "{}");
    return {
      ...createEmptyLocalDb(),
      ...parsed
    };
  } catch (error) {
    console.warn("Unable to read local LexiCourt workspace:", error);
    return createEmptyLocalDb();
  }
}

function writeLocalDb(dbState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(dbState));
  } catch (error) {
    console.warn("Unable to save local LexiCourt workspace:", error);
  }
}

function localId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function localNow() {
  return new Date().toISOString();
}

function stripUndefined(value) {
  return Object.fromEntries(
    Object.entries(value || {}).filter(([, item]) => item !== undefined)
  );
}

function getLocalCollection(name) {
  return readLocalDb()[name] || [];
}

function saveLocalRecord(collectionName, record, preferredId = "") {
  const dbState = readLocalDb();
  const id = preferredId || record.id || record[`${collectionName.slice(0, -1)}Id`] || localId(collectionName);
  const nextRecord = {
    ...stripUndefined(record),
    id,
    updatedAt: record.updatedAt || localNow()
  };
  const records = dbState[collectionName] || [];
  const existingIndex = records.findIndex((item) => item.id === id);

  if (existingIndex >= 0) {
    records[existingIndex] = {
      ...records[existingIndex],
      ...nextRecord
    };
  } else {
    records.unshift(nextRecord);
  }

  dbState[collectionName] = records;
  writeLocalDb(dbState);
  return id;
}

function deleteLocalRecord(collectionName, id) {
  const dbState = readLocalDb();
  dbState[collectionName] = (dbState[collectionName] || []).filter((item) => item.id !== id);
  writeLocalDb(dbState);
}

function getLocalCaseById(caseId) {
  return getLocalCollection("caseFolders").find((item) => item.id === caseId || item.caseId === caseId) || null;
}

function canCurrentUserReadLocalCase(caseItem, user, role) {
  if (!caseItem || !user) {
    return false;
  }

  if (role === "admin") {
    return true;
  }

  const userEmail = String(user.email || "").toLowerCase();
  const caseClientEmail = String(caseItem.clientEmail || "").toLowerCase();

  if (role === "client") {
    return (
      caseItem.clientUid === user.uid ||
      caseItem.clientId === user.uid ||
      (userEmail && caseClientEmail && userEmail === caseClientEmail) ||
      getLocalCollection("clientShares").some((share) => share.caseId === caseItem.id && share.clientUid === user.uid)
    );
  }

  return (
    caseItem.ownerUid === user.uid ||
    (Array.isArray(caseItem.assignedUserIds) && caseItem.assignedUserIds.includes(user.uid))
  );
}

async function getLocalCasesForCurrentUser() {
  const user = requireAuth();
  const role = String((await getUserRole()) || "lawyer").toLowerCase();
  return sortByTimestampDesc(
    getLocalCollection("caseFolders").filter((caseItem) => canCurrentUserReadLocalCase(caseItem, user, role)),
    "updatedAt"
  );
}

function mergeById(primaryItems, secondaryItems) {
  const merged = [];
  const seen = new Set();

  [...primaryItems, ...secondaryItems].forEach((item) => {
    if (!item?.id || seen.has(item.id)) {
      return;
    }

    seen.add(item.id);
    merged.push(item);
  });

  return merged;
}

function localByCase(collectionName, caseId, sortKey, direction = "desc") {
  const items = getLocalCollection(collectionName).filter((item) => item.caseId === caseId);
  return direction === "asc" ? sortByTimestampAsc(items, sortKey) : sortByTimestampDesc(items, sortKey);
}

export async function createCase(caseData) {
  const user = requireAuth();
  const assignedUserIds = [user.uid, ...(caseData.assignedUserIds || [])].filter(Boolean);
  const payload = {
    ...caseData,
    ownerUid: user.uid,
    assignedUserIds: [...new Set(assignedUserIds)],
    clientId: caseData.clientId || "",
    clientUid: caseData.clientUid || "",
    clientEmail: String(caseData.clientEmail || "").toLowerCase(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  console.log("Creating case with payload:", payload);
  try {
    const docRef = await addDoc(collection(db, "caseFolders"), payload);
    console.log("Case created in Firebase with ID:", docRef.id);
    await updateDoc(docRef, { caseId: docRef.id });
    
    // Also save locally for immediate UI feedback before indexing catch-up
    saveLocalRecord("caseFolders", {
      ...payload,
      id: docRef.id,
      caseId: docRef.id,
      createdAt: localNow(),
      updatedAt: localNow()
    }, docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error("Firebase case creation failed:", error);
    if (!isPermissionDeniedError(error)) {
      throw error;
    }

    const id = localId("case");
    const localPayload = {
      ...payload,
      id,
      caseId: id,
      createdAt: localNow(),
      updatedAt: localNow(),
      syncStatus: "local"
    };
    saveLocalRecord("caseFolders", localPayload, id);
    return id;
  }
}

export async function updateCase(caseId, updates) {
  let denied = false;
  try {
    await updateDoc(doc(db, "caseFolders", caseId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error;
    }
    denied = true;
  }

  const existing = getLocalCaseById(caseId);
  if (existing || denied) {
    saveLocalRecord("caseFolders", {
      ...(existing || { id: caseId, caseId }),
      ...updates,
      updatedAt: localNow(),
      syncStatus: existing?.syncStatus || "local"
    }, caseId);
  }
}

export async function deleteCase(caseId) {
  try {
    await deleteDoc(doc(db, "caseFolders", caseId));
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error;
    }
  }
  deleteLocalRecord("caseFolders", caseId);
}

export async function getCasesForCurrentUser() {
  const user = requireAuth();
  let role = null;

  try {
    role = await getUserRole();
  } catch (error) {
    console.warn("Unable to determine user role for cases query:", error);
  }

  if (!role && user) {
    console.warn("User role not resolved, defaulting to 'lawyer' for cases query.");
    role = "lawyer";
  }

  if (!role) {
    return [];
  }

  const isAdmin = role === "admin";

  if (isAdmin) {
    try {
      return mergeById(await getAllCasesAdmin(), await getLocalCasesForCurrentUser());
    } catch (error) {
      if (!isPermissionDeniedError(error)) {
        throw error;
      }
      console.warn("Using local admin case fallback after Firebase denied access:", error);
      return getLocalCasesForCurrentUser();
    }
  }

  if (role === "client") {
    try {
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

      if (user.email) {
        const emailSnapshot = await getDocs(
          query(collection(db, "caseFolders"), where("clientEmail", "==", user.email.toLowerCase()))
        );

        emailSnapshot.forEach((item) => {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            sharedCases.push({ ...item.data(), id: item.id });
          }
        });
      }

      return sortByTimestampDesc(mergeById(sharedCases, await getLocalCasesForCurrentUser()), "updatedAt");
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        console.warn("Using local client case fallback after Firebase denied access:", error);
        return getLocalCasesForCurrentUser();
      }

      throw error;
    }
  }

  const cases = [];
  const seenIds = new Set();
  const warnings = [];

  const appendSnapshot = (snapshot) => {
    snapshot.forEach((item) => {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        cases.push({ ...item.data(), id: item.id });
      }
    });
  };

  const collectQuery = async (label, sourceQuery) => {
    try {
      appendSnapshot(await getDocs(sourceQuery));
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        warnings.push(`${label}: ${error.message || "permission denied"}`);
        return;
      }

      throw error;
    }
  };

  await collectQuery("owned cases", query(collection(db, "caseFolders"), where("ownerUid", "==", user.uid)));
  await collectQuery(
    "assigned cases",
    query(collection(db, "caseFolders"), where("assignedUserIds", "array-contains", user.uid))
  );

  console.log(`Fetched ${cases.length} cases for lawyer ${user.uid}`);

  if (warnings.length) {
    console.warn("Returning case results after Firestore query warnings:", warnings.join("; "));
  }

  return sortByTimestampDesc(mergeById(cases, await getLocalCasesForCurrentUser()), "updatedAt");
}

export async function getAllCasesAdmin() {
  try {
    const snapshot = await getDocs(collection(db, "caseFolders"));
    const cases = [];
    snapshot.forEach((item) => {
      cases.push({ ...item.data(), id: item.id });
    });
    return sortByTimestampDesc(mergeById(cases, getLocalCollection("caseFolders")), "updatedAt");
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error;
    }
    return sortByTimestampDesc(getLocalCollection("caseFolders"), "updatedAt");
  }
}

export async function getCaseById(caseId) {
  if (!caseId) {
    return null;
  }

  try {
    const docSnap = await getDoc(doc(db, "caseFolders", caseId));
    return docSnap.exists() ? { ...docSnap.data(), id: docSnap.id } : getLocalCaseById(caseId);
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error;
    }
    return getLocalCaseById(caseId);
  }
}

export async function createDocumentRecord(docData) {
  const user = requireAuth();
  const payload = {
    ...docData,
    ownerUid: user.uid,
    uploadedBy: user.uid,
    uploadedByRole: await getUserRole(),
    uploadStatus: docData.uploadStatus || "completed",
    uploadedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  console.log("Creating document record with payload:", payload);
  try {
    const docRef = await addDoc(collection(db, "documents"), payload);
    console.log("Document record created in Firebase with ID:", docRef.id);
    await updateDoc(docRef, { documentId: docRef.id });
    return docRef.id;
  } catch (error) {
    console.error("Firebase document creation failed:", error);
    // Log more details about the failure
    if (isPermissionDeniedError(error)) {
      console.warn("Permission denied while creating document record. Check Firestore rules and user role.");
    }
    
    if (!isPermissionDeniedError(error)) {
      throw error;
    }

    const id = localId("document");
    saveLocalRecord("documents", {
      ...docData,
      id,
      documentId: id,
      ownerUid: user.uid,
      uploadedBy: user.uid,
      uploadedByRole: await getUserRole(),
      uploadStatus: docData.uploadStatus || "completed",
      uploadedAt: localNow(),
      updatedAt: localNow(),
      syncStatus: "local"
    }, id);
    return id;
  }
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
  console.log(`Starting file upload to ${storagePath}...`);
  
  try {
    const storageRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type || "application/octet-stream",
      customMetadata: {
        ownerUid: user.uid,
        caseId
      }
    });
    console.log("File bytes uploaded successfully. Getting download URL...");
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("Download URL obtained:", downloadURL);

    return {
      storagePath,
      downloadURL,
      fileName: safeName,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size || 0
    };
  } catch (error) {
    console.error("Firebase Storage upload failed:", error);
    if (isPermissionDeniedError(error)) {
      console.warn("Permission denied while uploading to Storage. Check Storage rules.");
    }

    if (!isPermissionDeniedError(error)) {
      throw error;
    }

    console.log("Falling back to local data URL for storage due to permission error.");
    return {
      storagePath: `local/${storagePath}`,
      downloadURL: await readFileAsDataUrl(file),
      fileName: safeName,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size || 0,
      syncStatus: "local"
    };
  }
}

export async function getDocumentsByCase(caseId) {
  if (!caseId) {
    return [];
  }

  try {
    const snapshot = await getDocs(query(collection(db, "documents"), where("caseId", "==", caseId)));
    const docs = [];
    snapshot.forEach((item) => {
      docs.push({ ...item.data(), id: item.id });
    });
    return sortByTimestampDesc(mergeById(docs, localByCase("documents", caseId, "uploadedAt")), "uploadedAt");
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error;
    }
    return localByCase("documents", caseId, "uploadedAt");
  }
}

export async function saveDraft(draftData) {
  const user = requireAuth();
  try {
    const docRef = await addDoc(collection(db, "drafts"), {
      ...draftData,
      requestedBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    await updateDoc(docRef, { draftId: docRef.id });
    return docRef.id;
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error;
    }
  }

  const id = localId("draft");
  saveLocalRecord("drafts", {
    ...draftData,
    id,
    draftId: id,
    requestedBy: user.uid,
    createdAt: localNow(),
    updatedAt: localNow(),
    syncStatus: "local"
  }, id);
  return id;
}

export async function getDraftsByCase(caseId) {
  if (!caseId) {
    return [];
  }

  try {
    const snapshot = await getDocs(query(collection(db, "drafts"), where("caseId", "==", caseId)));
    const drafts = [];
    snapshot.forEach((item) => {
      drafts.push({ ...item.data(), id: item.id });
    });
    return sortByTimestampDesc(mergeById(drafts, localByCase("drafts", caseId, "updatedAt")), "updatedAt");
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error;
    }
    return localByCase("drafts", caseId, "updatedAt");
  }
}

export async function saveTimeline(timelineData) {
  const user = requireAuth();
  try {
    const docRef = await addDoc(collection(db, "timelines"), {
      ...timelineData,
      generatedBy: user.uid,
      generatedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    await updateDoc(docRef, { timelineId: docRef.id });
    return docRef.id;
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error;
    }
  }

  const id = localId("timeline");
  saveLocalRecord("timelines", {
    ...timelineData,
    id,
    timelineId: id,
    generatedBy: user.uid,
    generatedAt: localNow(),
    updatedAt: localNow(),
    syncStatus: "local"
  }, id);
  return id;
}

export async function getTimelineByCase(caseId) {
  if (!caseId) {
    return [];
  }

  try {
    const snapshot = await getDocs(query(collection(db, "timelines"), where("caseId", "==", caseId)));
    const timelines = [];
    snapshot.forEach((item) => {
      timelines.push({ ...item.data(), id: item.id });
    });
    return sortByTimestampDesc(mergeById(timelines, localByCase("timelines", caseId, "generatedAt")), "generatedAt");
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error;
    }
    return localByCase("timelines", caseId, "generatedAt");
  }
}

export async function saveSummary(summaryData) {
  const user = requireAuth();
  try {
    const docRef = await addDoc(collection(db, "summaries"), {
      ...summaryData,
      requestedBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    await updateDoc(docRef, { summaryId: docRef.id });
    return docRef.id;
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error;
    }
  }

  const id = localId("summary");
  saveLocalRecord("summaries", {
    ...summaryData,
    id,
    summaryId: id,
    requestedBy: user.uid,
    createdAt: localNow(),
    updatedAt: localNow(),
    syncStatus: "local"
  }, id);
  return id;
}

export async function getSummariesByCase(caseId) {
  if (!caseId) {
    return [];
  }

  try {
    const snapshot = await getDocs(query(collection(db, "summaries"), where("caseId", "==", caseId)));
    const summaries = [];
    snapshot.forEach((item) => {
      summaries.push({ ...item.data(), id: item.id });
    });
    return sortByTimestampDesc(mergeById(summaries, localByCase("summaries", caseId, "updatedAt")), "updatedAt");
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error;
    }
    return localByCase("summaries", caseId, "updatedAt");
  }
}

export async function saveAiChat(chatData) {
  const user = requireAuth();
  try {
    const docRef = await addDoc(collection(db, "aiChats"), {
      ...chatData,
      userUid: user.uid,
      createdAt: serverTimestamp()
    });
    await updateDoc(docRef, { chatId: docRef.id });
    return docRef.id;
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error;
    }
  }

  const id = localId("chat");
  saveLocalRecord("aiChats", {
    ...chatData,
    id,
    chatId: id,
    userUid: user.uid,
    createdAt: localNow(),
    syncStatus: "local"
  }, id);
  return id;
}

export async function getAiChatsByCase(caseId) {
  if (!caseId) {
    return [];
  }

  try {
    const snapshot = await getDocs(query(collection(db, "aiChats"), where("caseId", "==", caseId)));
    const chats = [];
    snapshot.forEach((item) => {
      chats.push({ ...item.data(), id: item.id });
    });
    return sortByTimestampAsc(mergeById(chats, localByCase("aiChats", caseId, "createdAt", "asc")), "createdAt");
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error;
    }
    return localByCase("aiChats", caseId, "createdAt", "asc");
  }
}

export async function createReadinessCheck(checkData) {
  const user = requireAuth();
  try {
    const docRef = await addDoc(collection(db, "readinessChecks"), {
      ...checkData,
      generatedBy: user.uid,
      createdAt: serverTimestamp()
    });
    await updateDoc(docRef, { checkId: docRef.id });
    return docRef.id;
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error;
    }
  }

  const id = localId("readiness");
  saveLocalRecord("readinessChecks", {
    ...checkData,
    id,
    checkId: id,
    generatedBy: user.uid,
    createdAt: localNow(),
    syncStatus: "local"
  }, id);
  return id;
}

export async function getReadinessChecksByCase(caseId) {
  if (!caseId) {
    return [];
  }

  try {
    const snapshot = await getDocs(query(collection(db, "readinessChecks"), where("caseId", "==", caseId)));
    const checks = [];
    snapshot.forEach((item) => {
      checks.push({ ...item.data(), id: item.id });
    });
    return sortByTimestampDesc(mergeById(checks, localByCase("readinessChecks", caseId, "createdAt")), "createdAt");
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error;
    }
    return localByCase("readinessChecks", caseId, "createdAt");
  }
}

export async function createClientShare(shareData) {
  const user = requireAuth();
  const caseId = shareData.caseId;
  const clientUid = shareData.clientUid;
  const shareId = `${caseId}_${clientUid}`;

  try {
    await setDoc(doc(db, "clientShares", shareId), {
      ...shareData,
      shareId,
      sharedBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error;
    }
  }

  saveLocalRecord("clientShares", {
    ...shareData,
    id: shareId,
    shareId,
    sharedBy: user.uid,
    createdAt: localNow(),
    updatedAt: localNow(),
    syncStatus: "local"
  }, shareId);

  await updateCase(caseId, {
    clientUid,
    clientId: clientUid,
    clientEmail: shareData.clientEmail || "",
    clientName: shareData.clientName || shareData.clientEmail || "",
    sharedWithClientAt: serverTimestamp()
  });

  return shareId;
}

export async function getClientSharedItems(clientUid) {
  const uid = clientUid || requireAuth().uid;
  try {
    const snapshot = await getDocs(query(collection(db, "clientShares"), where("clientUid", "==", uid)));
    const shares = [];
    snapshot.forEach((item) => {
      shares.push({ ...item.data(), id: item.id });
    });
    return mergeById(shares, getLocalCollection("clientShares").filter((share) => share.clientUid === uid));
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error;
    }
    return getLocalCollection("clientShares").filter((share) => share.clientUid === uid);
  }
}

export async function getAdminUsersList() {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    const users = [];
    snapshot.forEach((item) => {
      users.push({ ...item.data(), id: item.id });
    });
    return mergeById(users, getLocalCollection("users"));
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error;
    }
    return getLocalCollection("users");
  }
}

export async function findClientUsersByEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    return [];
  }

  try {
    const snapshot = await getDocs(
      query(
        collection(db, "users"),
        where("email", "==", normalizedEmail),
        where("role", "==", "client")
      )
    );
    const users = [];
    snapshot.forEach((item) => {
      const data = item.data();
      if (String(data.role || "").toLowerCase() === "client") {
        users.push({ ...data, id: item.id });
      }
    });

    return mergeById(users, getLocalCollection("users").filter((item) =>
      String(item.email || "").toLowerCase() === normalizedEmail &&
      String(item.role || "").toLowerCase() === "client"
    ));
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error;
    }
    return getLocalCollection("users").filter((item) =>
      String(item.email || "").toLowerCase() === normalizedEmail &&
      String(item.role || "").toLowerCase() === "client"
    );
  }
}

export async function shareCaseWithClientByEmail(caseRecord, clientEmail) {
  const normalizedEmail = String(clientEmail || "").trim().toLowerCase();
  if (!caseRecord?.id || !normalizedEmail) {
    return null;
  }

  const clients = await findClientUsersByEmail(normalizedEmail);
  const client = clients[0] || null;

  if (!client) {
    await updateCase(caseRecord.id, {
      clientEmail: normalizedEmail,
      pendingClientEmail: normalizedEmail
    });
    return {
      pending: true,
      clientEmail: normalizedEmail
    };
  }

  const shareId = await createClientShare({
    caseId: caseRecord.id,
    clientUid: client.uid || client.id,
    clientEmail: normalizedEmail,
    clientName: client.fullName || caseRecord.clientName || normalizedEmail,
    permissions: {
      canViewDocuments: true,
      canUploadDocuments: true,
      canViewTimeline: true
    }
  });

  return {
    pending: false,
    shareId,
    client
  };
}

export async function updateCurrentUserProfile(updates) {
  const user = requireAuth();
  try {
    await updateDoc(doc(db, "users", user.uid), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error;
    }
  }

  const existing = getLocalCollection("users").find((item) => item.uid === user.uid || item.id === user.uid) || {};
  saveLocalRecord("users", {
    ...existing,
    ...updates,
    id: user.uid,
    uid: user.uid,
    email: user.email || existing.email || "",
    updatedAt: localNow(),
    syncStatus: "local"
  }, user.uid);
}

export async function saveMlPrediction(predictionData) {
  const user = requireAuth();
  try {
    const docRef = await addDoc(collection(db, "mlPredictions"), {
      ...predictionData,
      generatedBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    await updateDoc(docRef, { predictionId: docRef.id });
    return docRef.id;
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error;
    }
  }

  const id = localId("prediction");
  saveLocalRecord("mlPredictions", {
    ...predictionData,
    id,
    predictionId: id,
    generatedBy: user.uid,
    createdAt: localNow(),
    updatedAt: localNow(),
    syncStatus: "local"
  }, id);
  return id;
}

export async function getMlPredictionsByCase(caseId) {
  if (!caseId) {
    return [];
  }

  try {
    const snapshot = await getDocs(query(collection(db, "mlPredictions"), where("caseId", "==", caseId)));
    const predictions = [];
    snapshot.forEach((item) => {
      predictions.push({ ...item.data(), id: item.id });
    });
    return sortByTimestampDesc(mergeById(predictions, localByCase("mlPredictions", caseId, "updatedAt")), "updatedAt");
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error;
    }
    return localByCase("mlPredictions", caseId, "updatedAt");
  }
}

export async function claimCasesForClient(user) {
  if (!user?.email || !user?.uid) {
    return;
  }

  const email = String(user.email).toLowerCase().trim();
  console.log(`Starting auto-claim for client: ${email}`);

  try {
    const q = query(collection(db, "caseFolders"), where("clientEmail", "==", email));
    const snapshot = await getDocs(q);
    
    for (const caseDoc of snapshot.docs) {
      const caseData = caseDoc.data();
      const caseId = caseDoc.id;

      // Update case with client UID if missing
      if (caseData.clientUid !== user.uid) {
        console.log(`Linking client UID to case: ${caseId}`);
        await updateCase(caseId, {
          clientUid: user.uid,
          clientId: user.uid,
          clientName: user.displayName || caseData.clientName || email,
          pendingClientEmail: "" // Clear pending status
        });
      }

      // Ensure a formal clientShare record exists
      await createClientShare({
        caseId: caseId,
        clientUid: user.uid,
        clientEmail: email,
        clientName: user.displayName || email,
        permissions: {
          canViewDocuments: true,
          canUploadDocuments: true,
          canViewTimeline: true
        }
      });
    }
  } catch (error) {
    console.warn("Auto-claim failed:", error);
  }
}
