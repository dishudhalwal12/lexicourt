import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { DatasetEngine } from "./server/lib/dataset-engine.mjs";
import { buildAssistantPrompt, buildDraftPrompt, buildSummaryPrompt, buildTimelinePrompt } from "./server/lib/prompt-builders.mjs";
import { generateGeminiJson, generateGeminiText, isGeminiConfigured } from "./server/lib/gemini-client.mjs";

if (existsSync(".env")) {
  process.loadEnvFile?.();
}

const PORT = Number(process.env.PORT || 8787);
const datasetEngine = new DatasetEngine();
const UPLOAD_DIR = resolve("uploads");
await datasetEngine.load();
await mkdir(UPLOAD_DIR, { recursive: true });

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(payload));
}

async function parseJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sanitizeFileName(fileName = "document") {
  const base = String(fileName || "document")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return base || "document";
}

function inferMimeType(fileName) {
  const extension = extname(fileName).toLowerCase();
  const types = {
    ".pdf": "application/pdf",
    ".txt": "text/plain; charset=utf-8",
    ".md": "text/markdown; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".csv": "text/csv; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  };

  return types[extension] || "application/octet-stream";
}

async function saveUploadedFile({ fileName, dataBase64 }) {
  if (!dataBase64) {
    throw new Error("No file data was provided.");
  }

  const cleanName = sanitizeFileName(fileName);
  const storedName = `${Date.now()}-${cleanName}`;
  const filePath = join(UPLOAD_DIR, storedName);
  const buffer = Buffer.from(String(dataBase64).replace(/^data:.*;base64,/, ""), "base64");
  await writeFile(filePath, buffer);

  return {
    storedName,
    filePath,
    size: buffer.length
  };
}

async function serveUploadedFile(req, res) {
  const relativePath = decodeURIComponent(req.url.replace(/^\/uploads\//, ""));
  const safeName = sanitizeFileName(relativePath);
  const filePath = join(UPLOAD_DIR, safeName);

  try {
    const fileStats = await stat(filePath);
    const payload = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": inferMimeType(safeName),
      "Content-Length": fileStats.size,
      "Access-Control-Allow-Origin": "*",
      "Content-Disposition": `inline; filename="${safeName}"`
    });
    res.end(payload);
    return true;
  } catch {
    return false;
  }
}

function fallbackAssistantResponse({ question, references, insights }) {
  const firstReference = references[0];
  return {
    answer: `LexiCourt preview answer: ${insights.summary} ${firstReference ? `A related ${firstReference.source} reference says: ${firstReference.answer}` : "No statutory reference was strongly matched from the local datasets."} Your question was: "${question}".`,
    references,
    recommendedActions: insights.recommendedActions || []
  };
}

function fallbackDraft({ caseData, draftType, facts }) {
  return `IN THE MATTER OF ${caseData.caseTitle || "THE PRESENT CASE"}\n\n${draftType.toUpperCase()}\n\nCase Number: ${caseData.caseNumber || caseData.caseId || caseData.id || "N/A"}\nCourt: ${caseData.courtName || "N/A"}\n\nFacts:\n${facts || "No facts provided."}\n\nThis is a locally generated fallback draft. Configure Gemini to enable richer drafting output.`;
}

function fallbackTimeline({ caseData }) {
  const events = [];
  if (caseData.createdAt) {
    events.push({
      date: new Date(caseData.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      title: "Case Record Created",
      description: "The matter was added to the LexiCourt system for ongoing tracking."
    });
  }
  if (caseData.nextHearingDate) {
    events.push({
      date: new Date(caseData.nextHearingDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      title: "Next Hearing",
      description: `The next recorded hearing date is listed before ${caseData.courtName || "the court"}.`
    });
  }
  return { events };
}

const server = createServer(async (req, res) => {
  if (!req.url) {
    return sendJson(res, 404, { error: "Not found" });
  }

  if (req.method === "OPTIONS") {
    return sendJson(res, 204, {});
  }

  try {
    if (req.method === "GET" && req.url.startsWith("/uploads/")) {
      const served = await serveUploadedFile(req, res);
      if (!served) {
        return sendJson(res, 404, { error: "File not found" });
      }
      return;
    }

    if (req.method === "GET" && req.url === "/api/health") {
      return sendJson(res, 200, {
        ok: true,
        geminiConfigured: isGeminiConfigured(),
        datasets: {
          qaSources: 3,
          clauseProfiles: 10
        }
      });
    }

    if (req.method === "POST" && req.url === "/api/insights/case") {
      const body = await parseJsonBody(req);
      const insights = datasetEngine.buildCaseInsights(body);
      return sendJson(res, 200, {
        ok: true,
        insights
      });
    }

    if (req.method === "POST" && req.url === "/api/documents/classify") {
      const body = await parseJsonBody(req);
      const classification = datasetEngine.classifyDocument(body.text || "");
      return sendJson(res, 200, { ok: true, classification });
    }

    if (req.method === "POST" && req.url === "/api/files/upload") {
      const body = await parseJsonBody(req);
      const saved = await saveUploadedFile({
        fileName: body.fileName,
        dataBase64: body.dataBase64
      });

      return sendJson(res, 200, {
        ok: true,
        fileName: saved.storedName,
        fileSize: saved.size,
        url: `http://127.0.0.1:${PORT}/uploads/${encodeURIComponent(saved.storedName)}`
      });
    }

    if (req.method === "POST" && req.url === "/api/assistant/chat") {
      const body = await parseJsonBody(req);
      const references = datasetEngine.retrieveLegalReferences(body.question || "", 5);
      const insights = datasetEngine.buildCaseInsights(body);

      if (!isGeminiConfigured()) {
        return sendJson(res, 200, {
          ok: true,
          mode: "fallback",
          ...fallbackAssistantResponse({ question: body.question || "", references, insights })
        });
      }

      const answer = await generateGeminiText({
        systemInstruction: "You are LexiCourt AI, an Indian legal workflow assistant. Be practical, grounded, and cautious. Use provided case context first. Do not fabricate statutes or procedural facts. If context is insufficient, say so clearly.",
        userPrompt: buildAssistantPrompt({
          caseData: body.caseData,
          documents: body.documents,
          question: body.question,
          references,
          insights,
          history: body.history
        }),
        temperature: 0.25
      });

      return sendJson(res, 200, {
        ok: true,
        mode: "gemini",
        answer,
        references,
        recommendedActions: insights.recommendedActions || []
      });
    }

    if (req.method === "POST" && req.url === "/api/drafts/generate") {
      const body = await parseJsonBody(req);

      if (!isGeminiConfigured()) {
        return sendJson(res, 200, {
          ok: true,
          mode: "fallback",
          draft: fallbackDraft(body)
        });
      }

      const draft = await generateGeminiText({
        systemInstruction: "You are LexiCourt Draft AI. Draft polished first-pass Indian legal documents. Maintain formal structure, legal tone, and practical readability. Do not invent procedural history that is not supported by provided context.",
        userPrompt: buildDraftPrompt(body),
        temperature: 0.35
      });

      return sendJson(res, 200, {
        ok: true,
        mode: "gemini",
        draft
      });
    }

    if (req.method === "POST" && req.url === "/api/timelines/generate") {
      const body = await parseJsonBody(req);

      if (!isGeminiConfigured()) {
        return sendJson(res, 200, {
          ok: true,
          mode: "fallback",
          ...fallbackTimeline(body)
        });
      }

      const result = await generateGeminiJson({
        systemInstruction: "You are LexiCourt Timeline AI. Extract structured litigation chronology from the supplied document context. Only include reasonably supported events and keep them concise.",
        userPrompt: buildTimelinePrompt(body),
        temperature: 0.2
      });

      return sendJson(res, 200, {
        ok: true,
        mode: "gemini",
        events: Array.isArray(result.events) ? result.events : []
      });
    }

    if (req.method === "POST" && req.url === "/api/summaries/generate") {
      const body = await parseJsonBody(req);
      const insights = datasetEngine.buildCaseInsights(body);

      if (!isGeminiConfigured()) {
        return sendJson(res, 200, {
          ok: true,
          mode: "fallback",
          summary: insights.summary
        });
      }

      const summary = await generateGeminiText({
        systemInstruction: "You are LexiCourt Summary AI. Produce concise, lawyer-friendly matter summaries from the provided case and document context. Focus on practical posture and next actions.",
        userPrompt: buildSummaryPrompt({
          caseData: body.caseData,
          documents: body.documents,
          insights
        }),
        temperature: 0.2
      });

      return sendJson(res, 200, {
        ok: true,
        mode: "gemini",
        summary,
        insights
      });
    }

    return sendJson(res, 404, { error: "Route not found" });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, {
      ok: false,
      error: error.message || "Internal server error"
    });
  }
});

server.listen(PORT, () => {
  console.log(`LexiCourt API running on http://127.0.0.1:${PORT}`);
});
