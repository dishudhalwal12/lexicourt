# LexiCourt Handbook

## 1. The One-Liner
**LexiCourt** is a **browser-based legal workspace** that helps solo lawyers and small legal teams finally stop digging through paper files right before a hearing.

## 2. The Problem (Why This Exists)
- **Paper overload** slows lawyers down when they need one order, one date, or one fact fast.
- **Hearing prep stress** kicks in when case history lives across folders, loose files, and memory. 😵
- **Routine drafting** eats hours because notices, affidavits, and applications start from scratch too often.
- **Client visibility** breaks down when updates stay trapped inside the lawyer's personal workflow.

## 3. What We Built
LexiCourt brings case files, uploaded documents, AI help, and hearing prep into one clean **workflow**. A lawyer can create a matter, upload records, pull out summaries and dates, generate first-pass drafts, and check if the file still has gaps before court.

What makes this different from a generic student project is simple: we built around a real courtroom problem, not a made-up demo. The app focuses on the exact moment when a lawyer needs clarity, speed, and confidence. ⚖️

- **Case Folders** - create, organize, update, and track matters in one place
- **Document Uploads** - store orders, affidavits, notices, and other case records
- **AI Assistant** - ask direct questions about the file and get grounded answers
- **Case Summaries** - turn long documents into quick, usable context
- **Timeline Extraction** - pull key dates, hearings, and events into order
- **Draft Generator** - create first-pass legal drafts from case details and facts

## 4. Who Uses It
| Role | What they can do | What their screen looks like |
| --- | --- | --- |
| **Lawyer** | Manage cases, upload files, chat with AI, generate drafts, review readiness | A busy **dashboard** with case cards, actions, alerts, and matter-level tools |
| **Client** | View shared updates, documents, summaries, and next hearing details | A simpler view with status, shared files, and a clean timeline panel |
| **Admin** | Oversee users, flagged matters, storage, and access control | A control screen with team stats, flagged cases, and system-level visibility |

## 5. Tech Stack — The Engine Room ⚙️
| Layer | Tools |
| --- | --- |
| **Frontend** | Next.js, React, TypeScript, Bootstrap 5, Chart.js |
| **Backend / Database** | Node API, Firebase Authentication, Firestore, Firebase Storage |
| **AI / Smart Features** | Google Gemini API, prompt templates, local dataset engine for readiness and classification |
| **Deployment** | Browser-based web app, GitHub source control, Firebase-backed cloud setup, local demo run with `npm run dev:all` |

We picked these tools for one reason: three students needed to ship something real without babysitting servers at 2am, and this stack let us move fast without losing the serious parts.

## 6. How It Actually Works
1. You open LexiCourt, log in, and land on a **dashboard** that shows your matters and quick actions.
2. You create a case folder or open an existing one, then add the court name, parties, and next hearing date.
3. You upload orders, affidavits, notices, or other files so the matter stops living in scattered folders. 📂
4. You ask the AI assistant what happened last, request a summary, or pull a hearing timeline from the file.
5. You generate a first draft for the next step and review readiness signals to catch missing documents early.
6. If needed, you share updates with the client through a lighter view built for status visibility, not legal editing.

## 7. The Team
**Jaskirat Singh Kamboh** → owned the **frontend** → built the login flow, dashboard views, case pages, and smoother navigation across the app.

**Aarush Gupta** → owned backend and **AI integration** → wired Firebase, connected Gemini, and kept refining prompts until the outputs sounded useful instead of generic.

**Sarthak Tuteja** → owned data, testing, and **deployment** → shaped the database structure, tracked bugs, handled merge issues, and pushed the working build live.

All three of us **planned the product, tested the full flows, and pushed the project across the finish line together**.

## 8. What's Not Done Yet (Honest Corner)
- **No OCR yet** - weak scans and handwritten pages still break the document pipeline.
- **No court-system integration** - the app helps with preparation, not direct filing into e-Courts or ICMS.
- **AI still needs review** - summaries and drafts are strong starting points, not final legal work.

## 9. If We Had More Time...
- Add **OCR + multilingual support** so Hindi, Punjabi, and scanned files work properly.
- Build stronger **team collaboration** with shared folders, comments, and internal task tracking.
- Connect readiness signals to smarter **next-step recommendations** before each hearing.

## 10. The Bottom Line
LexiCourt turned a messy legal workflow into a working **product**: case management, document storage, AI question-answering, summaries, timelines, drafts, and readiness checks in one place. We learned how to connect frontend work, cloud services, and AI into something people could actually use under pressure. More importantly, we learned that good software starts when you respect the real pain, not when you chase flashy features. We did not just make an app for marks. We built something that feels close to the way real work happens.
