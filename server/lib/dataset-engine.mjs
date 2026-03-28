import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const BASE_DIR = resolve(process.cwd(), "ML");
const QA_DATASETS = [
  { path: resolve(BASE_DIR, "crpc_qa.json"), source: "CRPC" },
  { path: resolve(BASE_DIR, "ipc_qa.json"), source: "IPC" },
  { path: resolve(BASE_DIR, "constitution_qa.json"), source: "Constitution" }
];

const CLAUSE_DATASETS = [
  "legal-proceedings.csv",
  "dispute-resolution.csv",
  "notices.csv",
  "confidentiality.csv",
  "arbitration.csv",
  "governing-law.csv",
  "remedies.csv",
  "termination.csv",
  "judgments.csv",
  "indemnity.csv"
];

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function parseClauseCsv(raw) {
  const lines = raw.split("\n").slice(1).filter(Boolean);
  const rows = [];

  for (const line of lines) {
    const markerIndex = line.lastIndexOf('",');
    if (markerIndex === -1) {
      continue;
    }

    const clauseText = line.slice(1, markerIndex).replace(/""/g, '"');
    const clauseType = line.slice(markerIndex + 2).trim();
    rows.push({ clauseText, clauseType });
  }

  return rows;
}

function buildQaIndex(entries) {
  return entries.map((entry) => ({
    ...entry,
    tokenSet: new Set(tokenize(`${entry.question} ${entry.answer}`))
  }));
}

function scoreOverlap(tokenSet, queryTokens) {
  let score = 0;
  for (const token of queryTokens) {
    if (tokenSet.has(token)) {
      score += 1;
    }
  }
  return score;
}

function buildClauseProfiles(rows) {
  const profiles = new Map();
  const docTotals = new Map();
  const vocabulary = new Set();

  for (const row of rows) {
    const label = row.clauseType;
    const tokens = tokenize(row.clauseText);
    const profile = profiles.get(label) || new Map();
    docTotals.set(label, (docTotals.get(label) || 0) + 1);

    for (const token of tokens) {
      vocabulary.add(token);
      profile.set(token, (profile.get(token) || 0) + 1);
    }

    profiles.set(label, profile);
  }

  return { profiles, docTotals, vocabularySize: vocabulary.size };
}

function classifyWithBayes(text, model) {
  const tokens = tokenize(text);
  if (!tokens.length) {
    return [];
  }

  const results = [];
  const labels = Array.from(model.profiles.keys());

  for (const label of labels) {
    const profile = model.profiles.get(label);
    const totalForLabel = Array.from(profile.values()).reduce((sum, value) => sum + value, 0);
    let score = Math.log((model.docTotals.get(label) || 1) / Math.max(labels.length, 1));

    for (const token of tokens) {
      const tokenCount = profile.get(token) || 0;
      score += Math.log((tokenCount + 1) / (totalForLabel + model.vocabularySize));
    }

    results.push({ label, score });
  }

  const normalized = results
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const topScore = normalized[0]?.score ?? 0;
  return normalized.map((item) => ({
    label: item.label,
    confidence: Number((1 / (1 + Math.exp(-(item.score - topScore + 1)))).toFixed(3))
  }));
}

function countDaysSince(value) {
  if (!value) {
    return 365;
  }

  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return 365;
  }

  const diff = Date.now() - date.getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function extractDate(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  return value instanceof Date ? value : null;
}

export class DatasetEngine {
  constructor() {
    this.qaIndex = [];
    this.clauseModel = null;
    this.loaded = false;
  }

  async load() {
    const qaEntries = [];

    for (const dataset of QA_DATASETS) {
      const raw = await readFile(dataset.path, "utf8");
      const data = JSON.parse(raw);
      qaEntries.push(
        ...data.map((item) => ({
          source: dataset.source,
          question: item.question,
          answer: item.answer
        }))
      );
    }

    const clauseRows = [];
    for (const fileName of CLAUSE_DATASETS) {
      const path = resolve(BASE_DIR, "curated", "clauses", fileName);
      const raw = await readFile(path, "utf8");
      clauseRows.push(...parseClauseCsv(raw));
    }

    this.qaIndex = buildQaIndex(qaEntries);
    this.clauseModel = buildClauseProfiles(clauseRows);
    this.loaded = true;
  }

  ensureLoaded() {
    if (!this.loaded) {
      throw new Error("Dataset engine not loaded.");
    }
  }

  retrieveLegalReferences(question, limit = 5) {
    this.ensureLoaded();
    const queryTokens = tokenize(question);
    if (!queryTokens.length) {
      return [];
    }

    return this.qaIndex
      .map((item) => ({
        ...item,
        score: scoreOverlap(item.tokenSet, queryTokens)
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => ({
        source: item.source,
        question: item.question,
        answer: item.answer
      }));
  }

  classifyDocument(text) {
    this.ensureLoaded();
    const predictions = classifyWithBayes(text, this.clauseModel);
    return {
      predictions,
      topLabel: predictions[0]?.label || "unknown"
    };
  }

  buildCaseInsights({ caseData = {}, documents = [], drafts = [], chats = [], summaries = [], timelines = [] }) {
    const nextHearing = extractDate(caseData.nextHearingDate);
    const daysToNextHearing = nextHearing
      ? Math.round((nextHearing.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
    const staleDays = countDaysSince(extractDate(caseData.updatedAt) || extractDate(caseData.createdAt));
    const documentCount = documents.length;
    const draftCount = drafts.length;
    const timelineCount = timelines.length;
    const summaryCount = summaries.length;
    const chatCount = chats.length;
    const hasOrder = documents.some((doc) =>
      /order|judgment|court order/i.test(`${doc.displayTitle || ""} ${doc.fileName || ""} ${doc.documentType || ""}`)
    );
    const hasAffidavit = documents.some((doc) =>
      /affidavit/i.test(`${doc.displayTitle || ""} ${doc.fileName || ""} ${doc.documentType || ""}`)
    );
    const missingDocumentCount = Number(!hasOrder) + Number(!hasAffidavit);

    let readinessScore = 48;
    readinessScore += clamp(documentCount * 5, 0, 20);
    readinessScore += clamp(draftCount * 6, 0, 12);
    readinessScore += clamp(summaryCount * 4, 0, 8);
    readinessScore += clamp(timelineCount * 6, 0, 12);
    readinessScore += clamp(chatCount * 2, 0, 8);

    if (caseData.status === "Active") {
      readinessScore += 8;
    }

    if (typeof daysToNextHearing === "number") {
      if (daysToNextHearing < 0) {
        readinessScore -= 8;
      } else if (daysToNextHearing <= 7) {
        readinessScore -= missingDocumentCount * 12;
        readinessScore += draftCount > 0 ? 6 : 0;
      } else if (daysToNextHearing <= 21) {
        readinessScore -= missingDocumentCount * 8;
      }
    }

    readinessScore -= staleDays > 30 ? 8 : 0;
    readinessScore = clamp(Math.round(readinessScore), 10, 98);

    let delayRisk = 18;
    delayRisk += caseData.status === "Pending" ? 26 : 0;
    delayRisk += missingDocumentCount * 14;
    delayRisk += staleDays > 30 ? 18 : 0;
    delayRisk += draftCount === 0 ? 8 : 0;
    delayRisk += timelineCount === 0 ? 8 : 0;
    delayRisk = clamp(Math.round(delayRisk), 5, 95);

    const urgency =
      delayRisk >= 65 || readinessScore <= 45
        ? "High"
        : delayRisk >= 40 || readinessScore <= 60
          ? "Medium"
          : "Low";

    const nextActions = [];
    if (!hasOrder) {
      nextActions.push("Upload or add the latest court order record.");
    }
    if (!hasAffidavit && /criminal|bail|appeal/i.test(`${caseData.matterType || ""} ${caseData.caseTitle || ""}`)) {
      nextActions.push("Prepare or review the supporting affidavit before the next hearing.");
    }
    if (timelineCount === 0) {
      nextActions.push("Generate a timeline so counsel can track the hearing chronology.");
    }
    if (draftCount === 0) {
      nextActions.push("Generate a first-pass draft from the existing facts.");
    }
    if (!nextActions.length) {
      nextActions.push("Review the case file with the assistant and confirm hearing readiness.");
    }

    return {
      readinessScore,
      delayRisk,
      urgency,
      staleDays,
      daysToNextHearing,
      missingDocumentCount,
      documentCount,
      draftCount,
      timelineCount,
      summaryCount,
      recommendedActions: nextActions.slice(0, 3),
      summary: `Readiness is ${readinessScore}/100 with ${urgency.toLowerCase()} operational risk. ${missingDocumentCount ? `${missingDocumentCount} key file area(s) still look incomplete.` : "The file looks structurally complete."}`
    };
  }
}
