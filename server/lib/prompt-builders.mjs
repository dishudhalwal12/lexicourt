function truncateText(text, maxLength = 1400) {
  const value = String(text || "").trim();
  return value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`;
}

export function buildAssistantPrompt({ caseData = {}, documents = [], question = "", references = [], insights = {}, history = [] }) {
  const contextDocs = documents
    .slice(0, 3)
    .map((doc, index) => {
      const text = doc.extractedText || doc.rawTextContent || "";
      return [
        `Document ${index + 1}: ${doc.displayTitle || doc.fileName || "Untitled"}`,
        `Type: ${doc.documentType || "unknown"}`,
        `Excerpt: ${truncateText(text, 900)}`
      ].join("\n");
    })
    .join("\n\n");

  const historyText = history
    .slice(-4)
    .map((item) => `Q: ${item.question}\nA: ${item.answer}`)
    .join("\n\n");

  const legalRefs = references
    .map((item, index) => `${index + 1}. [${item.source}] ${item.question} -> ${item.answer}`)
    .join("\n");

  return `
Case Metadata:
- Title: ${caseData.caseTitle || "Unknown case"}
- Number: ${caseData.caseNumber || caseData.caseId || caseData.id || "Unknown"}
- Matter Type: ${caseData.matterType || "Unknown"}
- Court: ${caseData.courtName || "Unknown"}
- Status: ${caseData.status || "Unknown"}

Operational Signals:
- Readiness Score: ${insights.readinessScore ?? "N/A"}
- Delay Risk: ${insights.delayRisk ?? "N/A"}
- Recommended Actions: ${(insights.recommendedActions || []).join(" | ") || "None"}

Relevant Legal References:
${legalRefs || "None found"}

Recent Conversation:
${historyText || "No prior conversation"}

Document Context:
${contextDocs || "No document text available"}

User Question:
${question}

Answer Rules:
- Give a direct lawyer-facing answer first.
- Then add "Support:" with only the most relevant factual basis.
- Then add "Next Steps:" with up to 3 bullets only if useful.
- If the file context is insufficient, say exactly what is missing.
  `.trim();
}

export function buildDraftPrompt({ caseData = {}, draftType = "Draft", partyNames = "", facts = "", documents = [] }) {
  const contextDocs = documents
    .slice(0, 3)
    .map((doc) => `${doc.displayTitle || doc.fileName}: ${truncateText(doc.extractedText || doc.rawTextContent || "", 800)}`)
    .join("\n\n");

  return `
Generate a professional Indian legal ${draftType} for the following matter.

Case:
- Title: ${caseData.caseTitle || "Unknown"}
- Number: ${caseData.caseNumber || caseData.caseId || caseData.id || "Unknown"}
- Court: ${caseData.courtName || "Unknown"}
- Matter Type: ${caseData.matterType || "Unknown"}
- Parties: ${partyNames || caseData.caseTitle || "Unknown"}

Facts / Instructions:
${facts || "No specific facts were provided."}

Available Supporting Context:
${contextDocs || "No supporting document excerpts provided."}

Draft Rules:
- Use a disciplined Indian legal drafting tone.
- Do not invent facts, dates, or orders.
- Keep the draft concise but court-ready.
- Use headings only where appropriate for the document type.
  `.trim();
}

export function buildTimelinePrompt({ caseData = {}, documents = [] }) {
  const contextDocs = documents
    .slice(0, 4)
    .map((doc) => `${doc.displayTitle || doc.fileName}: ${truncateText(doc.extractedText || doc.rawTextContent || "", 900)}`)
    .join("\n\n");

  return `
Extract a litigation timeline for this matter as JSON.

Case:
- Title: ${caseData.caseTitle || "Unknown"}
- Number: ${caseData.caseNumber || caseData.caseId || caseData.id || "Unknown"}
- Court: ${caseData.courtName || "Unknown"}
- Matter Type: ${caseData.matterType || "Unknown"}

Documents:
${contextDocs || "No document excerpts available."}

Return JSON with this exact shape:
{
  "events": [
    { "date": "DD Mon YYYY", "title": "Event title", "description": "One or two sentence description" }
  ]
}
Only include events that are reasonably supported by the provided context.
  `.trim();
}

export function buildSummaryPrompt({ caseData = {}, documents = [], insights = {} }) {
  const contextDocs = documents
    .slice(0, 3)
    .map((doc) => `${doc.displayTitle || doc.fileName}: ${truncateText(doc.extractedText || doc.rawTextContent || "", 900)}`)
    .join("\n\n");

  return `
Summarize this Indian legal matter for a lawyer dashboard.

Case:
- Title: ${caseData.caseTitle || "Unknown"}
- Number: ${caseData.caseNumber || caseData.caseId || caseData.id || "Unknown"}
- Court: ${caseData.courtName || "Unknown"}
- Matter Type: ${caseData.matterType || "Unknown"}
- Status: ${caseData.status || "Unknown"}

Signals:
- Readiness Score: ${insights.readinessScore ?? "N/A"}
- Delay Risk: ${insights.delayRisk ?? "N/A"}
- Recommended Actions: ${(insights.recommendedActions || []).join(" | ") || "None"}

Context:
${contextDocs || "No document excerpts available."}

Output Rules:
- Keep it under 180 words.
- Focus on posture, key factual/procedural points, and what should happen next.
- Do not repeat headings unless needed.
  `.trim();
}
