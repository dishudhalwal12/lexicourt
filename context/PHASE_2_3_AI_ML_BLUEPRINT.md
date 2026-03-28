# LexiCourt Phase 2 + Phase 3 AI/ML Blueprint

## Goal
Use Gemini as the always-on legal assistant layer, and use internal ML only for structured insights, predictions, ranking, and workflow intelligence.

This is the right split for LexiCourt:

- `Gemini AI` = conversational assistant, summaries, extraction, drafting, reasoning over retrieved context
- `Internal ML` = predictions, scoring, classification, readiness signals, smart recommendations, prioritization

Do **not** try to train a full legal foundation model from scratch for this product. That would be expensive, slow, and lower quality than using Gemini + focused ML models.

---

## What I Found In `ML`

### 1. `ML/crpc_qa.json`
Observed:
- ~8,194 Q&A pairs
- focused on Code of Criminal Procedure style question-answer mapping

Useful for LexiCourt:
- good as a **seed legal FAQ / retrieval dataset**
- useful for **criminal-law assistant grounding**
- useful for **intent examples** for user questions such as:
  - "which section covers..."
  - "what does section X define..."
  - "under which section..."

Not enough for:
- general legal reasoning
- drafting quality
- real litigation outcome prediction
- case strategy

Recommendation:
- use this as a **reference dataset for retrieval and intent mapping**
- do not rely on it alone for the assistant

---

### 2. `ML/Fine Tuning Dataset/`
Observed:
- ~395 CSV files
- ~90 MB total
- clause classification style dataset
- examples include:
  - `legal-proceedings.csv`
  - `confidentiality.csv`
  - `governing-law.csv`
  - `indemnity.csv`
  - `termination.csv`
- structure is mostly:
  - `clause_text`
  - `clause_type`

What it really is:
- a **contract clause classification dataset**
- largely corporate / commercial / transactional legal language
- not built for Indian courtroom case management

Useful for LexiCourt:
- document section classification
- clause tagging
- smart draft building blocks
- agreement review / clause extraction features
- identifying clause families inside uploaded agreements

Not ideal for:
- criminal litigation
- court hearing readiness
- Indian court case insights
- case outcome prediction

Recommendation:
- use this for **document intelligence**
- especially:
  - clause classification
  - document structure parsing
  - smart draft clause suggestions
- do **not** use it as the main training set for case insights

---

### 3. `ML/corpus/`
Observed:
- `fulltext/` has ~3,890 XML files
- `citations_class/` has ~2,754 XML files
- `citations_summ/` also large
- data appears to come from **AustLII / Australian case law**
- examples include Australian Federal Court decisions and citation relationship labels like:
  - `applied`
  - `followed`

Useful for LexiCourt:
- citation graph experiments
- case relationship modeling
- precedent recommendation prototypes
- legal summarization experiments

Big problem:
- this is **Australian case law**, not Indian jurisprudence

That means:
- legal doctrine mismatch
- court structure mismatch
- citation style mismatch
- jurisdiction mismatch
- unsafe as a direct “legal intelligence” base for Indian lawyer workflows

Recommendation:
- do **not** use this as the main knowledge source for Indian case insights
- only use it for:
  - generic research experiments
  - citation relationship model prototypes
  - XML parsing pipeline development

---

## Bottom Line On The Data

### Strongly useful now
- `crpc_qa.json`
  - for criminal-law retrieval seeds
  - for FAQ grounding
  - for intent examples
- `Fine Tuning Dataset/`
  - for contract clause classification
  - for smart drafting support
  - for document intelligence

### Conditionally useful
- `corpus/`
  - only for prototype citation and summarization pipelines
  - not for Indian legal production intelligence

### Not enough by itself
- none of this data is enough to train a trustworthy India-focused litigation insight model end-to-end

For real LexiCourt insights, the best data will be:
- your own case metadata
- your own hearing timelines
- your own document summaries
- your own draft history
- your own user corrections / feedback
- outcome labels from your own workflow

---

## Best AI/ML Architecture For LexiCourt

## Gemini Layer
Gemini should stay the primary assistant engine for:

- AI document chat
- case summaries
- hearing timeline extraction
- draft generation
- legal question answering over retrieved documents
- readiness explanations in plain English

Gemini input should include:
- selected case metadata
- selected documents
- extracted timeline events
- prior draft context
- relevant legal references from retrieval

This is better than replacing Gemini with a custom-trained model.

---

## Internal ML Layer
Internal ML should not try to “be the assistant.”
It should generate signals and recommendations that the assistant can explain.

### Best ML features for LexiCourt

#### 1. Hearing Readiness Score
Predict how prepared a matter is for the next hearing.

Inputs:
- next hearing date distance
- missing document count
- number of recent uploads
- summary availability
- draft availability
- timeline completeness
- unresolved tasks

Output:
- readiness score `0-100`
- risk label:
  - low
  - medium
  - high

This is one of the best ML features for the product.

---

#### 2. Case Risk / Delay Prediction
Predict whether a case is likely to get delayed, blocked, or remain inactive.

Inputs:
- hearing gaps
- adjournment frequency
- inactive days
- missing docs
- court type
- matter type
- pending actions

Output:
- probability of delay
- recommended next action

This should be a product insight feature, not a legal opinion feature.

---

#### 3. Document Type + Clause Classification
Use the fine-tuning clause dataset here.

Possible outputs:
- affidavit
- notice
- application
- order
- charge sheet
- FIR
- witness statement
- contract clause category

This can power:
- automatic document tagging
- better retrieval
- better draft generation prompts

---

#### 4. Smart Next-Step Recommendation
Given case activity, predict the next most useful task.

Outputs like:
- "Generate readiness summary"
- "Review last order"
- "Upload missing annexure"
- "Prepare affidavit before next hearing"

This can be heuristic-first, ML-later.

---

#### 5. Retrieval Ranking / Insight Ranking
Use embeddings + ranking to choose:
- the most relevant document
- the most relevant paragraph
- the most important recent event
- the strongest supporting record for Gemini

This is often more valuable than a big custom model.

---

## Phase 2 Recommendation

Phase 2 should build the AI-ready backend and data pipeline.

### Build in Phase 2
- Firebase auth
- Firestore case/document/timeline/draft/chat models
- Gemini integration for:
  - summaries
  - chat
  - timeline extraction
  - drafting
- document text extraction pipeline
- retrieval pipeline over stored text
- structured event extraction from orders and filings
- feedback logging tables

### New Firestore collections to add
- `documentChunks`
- `assistantRuns`
- `assistantFeedback`
- `mlFeatures`
- `mlPredictions`
- `caseSignals`

### Store these signals per case
- `missingDocumentCount`
- `daysToNextHearing`
- `lastActivityAt`
- `timelineEventCount`
- `draftCount`
- `summaryCount`
- `adjournmentCount`
- `documentCoverageScore`

Without these structured features, ML later will be weak.

---

## Phase 3 Recommendation

Phase 3 should add intelligence and prediction features on top of the structured data created in Phase 2.

### Build in Phase 3
- readiness scoring model
- delay-risk model
- document classifier
- clause classifier
- citation recommendation prototype
- smart next-step recommender
- dashboard insight cards driven by predictions

### Best model choices

For readiness / risk / delay:
- start with:
  - XGBoost
  - LightGBM
  - Random Forest
- only move to neural models if you later have enough clean labeled data

For document / clause classification:
- start with:
  - TF-IDF + linear classifier baseline
  - Legal-BERT style embedding classifier later if needed

For retrieval:
- embeddings + reranking

For assistant reasoning:
- Gemini

---

## Recommended Product Features To Impress Users

### AI assistant features
- ask questions on a case
- summarize last order
- extract hearing chronology
- explain case posture
- generate first drafts

### ML insight features
- hearing readiness score
- delay probability
- missing-document alerting
- high-priority case flag
- auto-tagged document types
- clause extraction from agreements
- next best action recommendation

This is the strongest combination:
- Gemini feels smart to the user
- internal ML makes the product feel proactive

---

## What I Would Not Do

- do not train a giant custom legal LLM from these datasets
- do not use the Australian case corpus as Indian production legal truth
- do not market predictive output as legal advice
- do not train case-outcome prediction until you have reliable labeled internal data

---

## Best Practical Path

### Immediate path
1. Keep Gemini as the assistant brain.
2. Build structured signals in Firestore.
3. Use `crpc_qa.json` for criminal-law retrieval support.
4. Use the clause CSVs for document intelligence and drafting support.
5. Ignore the Australian corpus for production legal advice, but keep it for R&D.

### Best first ML model to ship
`Hearing Readiness Score`

Why:
- highly useful
- easy to explain
- safe
- driven by your own product data
- makes the dashboard feel intelligent fast

---

## Suggested Next Build Order

1. Gemini backend for chat, summaries, timelines, drafts
2. structured extraction pipeline
3. feature logging per case
4. readiness score MVP
5. document/clause classifier
6. delay-risk model
7. next-step recommender

---

## Final Recommendation

Yes, there is useful data in `ML`, but the smartest use is selective:

- `Gemini` should remain the assistant
- `CRPC QA` should support legal retrieval
- `Clause CSVs` should power drafting and document classification
- `Australian corpus` should stay experimental only
- `Internal product data` should become the real long-term training source for LexiCourt insights
