# LexiCourt

LexiCourt is a multi-page legal workflow app built with plain HTML/CSS/JS on the frontend, Firebase for app data/auth, and a local Node API layer for Gemini-powered assistant flows and internal ML insights.

## Stack

- Frontend: HTML, CSS, JavaScript, Bootstrap 5
- Auth / Data: Firebase Authentication + Firestore
- AI layer: Gemini via secure server-side API proxy
- Internal ML: local insight engine using curated legal datasets in `ML/`

## Run Frontend

From the project root:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Open:

- `http://127.0.0.1:8000`

## Run API

Create a local `.env` from `.env.example` and set:

- `GEMINI_API_KEY`

Then run:

```bash
npm run api
```

API health:

- `http://127.0.0.1:8787/api/health`

## AI/ML Features Added

- Gemini-backed assistant route
- Gemini-backed draft generation route
- Gemini-backed timeline generation route
- case insight scoring:
  - readiness score
  - delay risk
  - urgency
  - recommended next actions
- curated India-law retrieval support from:
  - `crpc_qa.json`
  - `ipc_qa.json`
  - `constitution_qa.json`

## ML Data Curation

Removed:

- Australian legal corpus
- U.S. Supreme Court `justice.csv`
- broad clause dump outside the curated subset

Kept:

- India-law Q&A datasets
- curated clause classification subset in `ML/curated/clauses`
