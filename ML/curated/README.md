# Curated ML Assets

This folder keeps only the ML assets currently useful for LexiCourt production features.

Kept:
- `crpc_qa.json`
- `ipc_qa.json`
- `constitution_qa.json`
- focused clause CSVs under `clauses/`

Removed / not used for production:
- the Australian legal corpus
- the U.S. Supreme Court `justice.csv`
- the broad generic contract-clause dump outside the curated subset

Reason:
- LexiCourt is India-focused
- Gemini handles assistant reasoning
- local ML should stay focused on Indian legal Q&A, drafting support, and document intelligence
