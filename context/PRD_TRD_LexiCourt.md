# LexiCourt — Product Requirements Document (PRD)
**Version:** 1.0  
**Prepared for:** Codex / Development Use  
**Project Type:** B.Tech Final Year Major Project — Web Application  
**Domain:** LegalTech / Legal Practice Management / AI-Assisted Document Intelligence  
**Stack:** HTML5 + CSS3 + JavaScript + Bootstrap 5 + Firebase + Google Gemini API  

## Section P1: Project Overview

LexiCourt is a browser-based legal practice support web application built for solo lawyers and very small legal teams in India. It helps them digitize case files, organize matters into folders, upload and retrieve documents, ask AI questions about uploaded legal records, generate quick case summaries, extract hearing timelines, and draft standard legal documents faster. The product is designed for lawyers who cannot afford large enterprise legal suites but still need faster hearing preparation, better document access, and cleaner case organization.

- **Core problem:** Individual lawyers and small teams do not have an affordable, easy-to-use digital system to manage case documents, quickly prepare before hearings, track important dates, and generate routine drafts without manually searching through bulky paper files.
- **Solution summary:** LexiCourt solves this by combining case-folder management, secure user logins, cloud storage, and Gemini-powered legal document assistance inside one web app. Lawyers upload case files, organize them by matter, query them through an AI assistant, get summaries and key dates, generate first-draft legal documents, and receive alerts if critical case documents appear to be missing before a hearing.

## Section P2: User Roles

**Role: Lawyer**
- Who they are: The primary end user of the application; typically a solo practitioner or a member of a small legal team handling multiple active court matters.
- What they can do:
  - Register and log in to the platform
  - Create, rename, view, and delete case folders
  - Upload and manage case documents
  - Open document viewer and inspect uploaded files
  - Ask AI questions about case files
  - Generate case summaries
  - Extract timelines and hearing dates
  - Generate affidavit/application/notice drafts
  - Review missing-document alerts
  - Access only their own folders and files
- Their dashboard: Case overview cards, recent folders, upcoming hearing-related items, quick actions for upload/chat/drafts, and navigation to folders, AI tools, and profile/session controls.

**Role: Client**
- Who they are: A secondary stakeholder inferred from the problem statement, representing a case participant who may need visibility into progress but not legal editing power.
- What they can do:
  - Log in to a limited-access account or view-only workspace (inferred)
  - Track basic case status and latest updates shared by the lawyer
  - View generated drafts or documents that have been explicitly shared
  - Check hearing dates or progress summaries relevant to their case
- Their dashboard: A simplified case-status dashboard with matter list, latest updates, next hearing date, and shared documents or summaries.

**Role: Admin / Firm Owner**
- Who they are: An inferred supervisory role needed to satisfy multi-role system control for small teams and operational setup.
- What they can do:
  - Manage user accounts within a small practice setup
  - Monitor storage usage and active matters
  - Configure access permissions for team members
  - Audit basic system activity
  - Review flagged missing-document alerts across all managed matters
- Their dashboard: Team overview, user management panel, aggregate case counts, flagged folders, and system-level navigation.

## Section P3: Feature List (Complete)

### Module: Authentication & Access Control

**Feature: User Registration and Login**
- Description: Allows lawyers and other approved users to create accounts and securely access the platform using email and password authentication.
- User role(s): Lawyer, Client, Admin
- Input: Name, email, password, role selection or assigned role, login credentials
- Output / Result: Account created, user authenticated, redirected to role-appropriate dashboard
- Edge cases: Duplicate email, weak password, invalid credentials, disabled account, unauthorized role assignment attempt
- Priority: High

**Feature: User-Specific Data Isolation**
- Description: Ensures each user can only see and manage their own files and records unless explicitly granted broader access.
- User role(s): Lawyer, Client, Admin
- Input: Authenticated user session and requested resource path
- Output / Result: Authorized data returned; unauthorized access blocked by Firebase rules
- Edge cases: Invalid session token, cross-user access attempt, stale permissions, logged-out access to protected screens
- Priority: High

### Module: Case Folder Management

**Feature: Case Folder Creation and Organization**
- Description: Enables users to create folders for each matter and organize case files by case name, party, or hearing context.
- User role(s): Lawyer, Admin
- Input: Case name, matter title, client name, party names, case number, court name, optional notes/tags
- Output / Result: New case folder stored and visible in dashboard/folder list
- Edge cases: Empty case name, duplicate folder names, invalid special characters, unauthorized creation attempt
- Priority: High

**Feature: Case Folder Update and Deletion**
- Description: Allows users to rename, archive, or delete case folders as case status changes.
- User role(s): Lawyer, Admin
- Input: Folder update fields or delete/archive confirmation
- Output / Result: Folder metadata updated or folder removed/archived
- Edge cases: Attempt to delete non-existent folder, deletion of folder with linked documents, accidental action without confirmation, unauthorized edit/delete
- Priority: Medium

### Module: Document Upload & Storage

**Feature: Case Document Upload**
- Description: Lets users upload case documents into the relevant matter folder for centralized storage and later AI analysis.
- User role(s): Lawyer, Admin
- Input: File upload, selected case folder, document type, optional title/description/date
- Output / Result: File stored in Firebase Storage and metadata saved in database
- Edge cases: Unsupported file format, failed upload, no folder selected, duplicate filename, oversized file, network interruption
- Priority: High

**Feature: Document Viewer and Retrieval**
- Description: Allows users to open, inspect, and retrieve uploaded legal documents from within the application.
- User role(s): Lawyer, Admin, Client (shared/view-only documents only)
- Input: Folder selection, document selection, optional search/filter terms
- Output / Result: Selected file preview/download and associated metadata displayed
- Edge cases: Missing file in storage, corrupted document, revoked access, unsupported preview type
- Priority: High

### Module: AI Legal Assistant

**Feature: AI Document Query Chat**
- Description: Enables lawyers to ask natural-language questions about uploaded documents and receive contextual answers.
- User role(s): Lawyer, Admin
- Input: User question, selected case folder or selected document context
- Output / Result: AI-generated answer based on extracted document content and prompts
- Edge cases: Empty question, no documents uploaded, API timeout, ambiguous query, extracted text unavailable, unauthorized folder access
- Priority: High

**Feature: Automatic Case Summaries**
- Description: Generates concise summaries of judgments, orders, or complete case folders to reduce manual reading time.
- User role(s): Lawyer, Admin, Client (shared summaries only)
- Input: Selected document or folder, summary request
- Output / Result: Summary text highlighting essential legal context, recent developments, and document purpose
- Edge cases: Very large files, poor text extraction, low-confidence AI output, unsupported document content, no relevant text found
- Priority: High

**Feature: Timeline and Key-Date Extraction**
- Description: Pulls important dates, hearing events, and chronological milestones from legal documents.
- User role(s): Lawyer, Admin, Client (view-only, if shared)
- Input: Selected document or case folder for analysis
- Output / Result: Structured list or timeline of dates, hearings, orders, and events
- Edge cases: Dates not present, conflicting dates across documents, OCR/text extraction failure, ambiguous event references
- Priority: High

### Module: Legal Draft Automation

**Feature: Standard Legal Draft Generator**
- Description: Creates first-draft legal documents such as affidavits, notices, and applications using case data already stored in the folder.
- User role(s): Lawyer, Admin
- Input: Draft type, case folder data, party details, factual inputs, optional custom instructions
- Output / Result: Generated draft text for lawyer review and further editing
- Edge cases: Missing case details, unsupported draft type, incomplete inputs, hallucinated legal text, generation timeout
- Priority: High

### Module: Case Readiness & Alerts

**Feature: Missing Document Alert Check**
- Description: Reviews folder contents and alerts the lawyer when important case documents appear to be missing before a hearing.
- User role(s): Lawyer, Admin
- Input: Case folder contents, optional checklist type, hearing context
- Output / Result: Alert list of potentially missing documents or preparation gaps
- Edge cases: False positives due to inconsistent naming, incomplete metadata, folder not selected, no baseline checklist configured
- Priority: Medium

### Module: Client Visibility

**Feature: Case Status Tracking for Clients**
- Description: Provides clients with a clearer way to understand what is happening in their case through shared updates and relevant case milestones.
- User role(s): Client, Lawyer
- Input: Shared case update, latest summary, hearing date, document visibility settings
- Output / Result: Client can view status information and shared outputs in a limited interface
- Edge cases: No shared data, revoked permission, outdated summary, incorrect case mapping
- Priority: Medium

### Module: Deployment & Accessibility

**Feature: Browser-Based Access Without Installation**
- Description: Makes the platform available through a standard web browser so users do not need special software installed.
- User role(s): Lawyer, Client, Admin
- Input: Browser request and authenticated session where needed
- Output / Result: Full application accessible online via Firebase Hosting
- Edge cases: Unsupported browser features, slow internet, expired session, hosting downtime
- Priority: High

## Section P4: User Flows

**Flow: Authentication (Register / Login / Logout)**
1. User opens the app and lands on the public landing page.
2. User clicks **Register** and sees a registration form with fields such as full name, email, password, confirm password, and inferred role or invite-based role.
3. User fills the form and submits it.
4. Firebase Authentication creates the account.
5. A user profile document is created in the `users` collection with role, name, email, and timestamps.
6. User is redirected to the correct dashboard based on role.
7. On a later visit, user clicks **Login**, enters email and password, and submits.
8. Firebase verifies credentials and restores session.
9. App fetches the Firestore user profile, checks role, and sends the user to Lawyer Dashboard, Client Dashboard, or Admin Dashboard.
10. When the user clicks **Logout**, the session is cleared and the user returns to the landing or login page.

**Flow: Upload Case Documents and Ask AI Questions**
1. Lawyer logs in and lands on the dashboard.
2. Lawyer opens the case folder list and selects an existing matter or creates a new folder.
3. Lawyer clicks **Upload Document**, selects one or more files, chooses document type, and submits.
4. Files are stored in Firebase Storage and metadata is saved in the database.
5. App confirms successful upload and refreshes the document list.
6. Lawyer opens the case folder AI assistant/chat panel.
7. Lawyer asks a question such as “What was the last order passed in this case?”
8. The app fetches extracted text or relevant file context and sends it to the Gemini API through a backend/cloud function.
9. Gemini returns a context-aware answer.
10. The answer is displayed in the chat window and optionally saved to chat history for that matter.

**Flow: Admin Team and Case Oversight**
1. Admin logs in and opens the admin dashboard.
2. Admin views summary cards showing number of users, active case folders, flagged matters, and storage usage.
3. Admin navigates to the user management screen.
4. Admin creates a new team member account or updates an existing user’s role/permissions.
5. Admin opens the case oversight page to view folders with missing-document alerts or inactive follow-up.
6. Admin reviews the flagged items and drills into specific folders if needed.
7. Admin adjusts access permissions or notifies the responsible lawyer.
8. Changes are saved to Firestore and reflected across the app.

## Section P5: Page & Screen Inventory

| Page Name | Route | Who Can Access | Key Components on This Page |
|-----------|-------|----------------|-----------------------------|
| Landing Page | / | Public | Hero section, project summary, feature highlights, login/register CTA buttons |
| Register | /register | Public | Registration form, validation messages, role/invite logic, redirect handling |
| Login | /login | Public | Email + password form, forgot-password link or helper text, redirect logic |
| Lawyer Dashboard | /dashboard | Lawyer | Stats cards, recent matters, upcoming hearing info, quick actions, sidebar navigation |
| Admin Dashboard | /admin | Admin | User stats, flagged cases, storage summary, team activity cards, admin navigation |
| Client Dashboard | /client-dashboard | Client | Case status cards, latest updates, shared summaries, next hearing information |
| Case Folder List | /cases | Lawyer, Admin | Folder table/grid, search bar, filters, create folder button |
| Create/Edit Case Folder | /cases/new and /cases/:caseId/edit | Lawyer, Admin | Case metadata form, party details, notes, save/update actions |
| Case Folder Detail | /cases/:caseId | Lawyer, Admin | Matter summary, document list, timeline widget, missing-doc alerts, quick actions |
| Document Upload Page | /cases/:caseId/upload | Lawyer, Admin | File upload dropzone, document type selector, upload progress, metadata form |
| Document Viewer | /cases/:caseId/documents/:documentId | Lawyer, Admin, Client (shared docs only) | File preview, metadata panel, action buttons, related summaries |
| AI Assistant Chat | /cases/:caseId/assistant | Lawyer, Admin | Chat interface, context selector, prompt input, response history |
| Case Summary Page | /cases/:caseId/summary | Lawyer, Admin, Client (shared summary only) | Generated summary card, refresh/regenerate actions, summary sections |
| Timeline Extraction Page | /cases/:caseId/timeline | Lawyer, Admin, Client (shared timeline only) | Chronological events list, hearing dates, source-doc references |
| Draft Generator | /cases/:caseId/drafts | Lawyer, Admin | Draft type selector, input form, generated draft editor/preview, save/export actions |
| Missing Documents Check | /cases/:caseId/readiness | Lawyer, Admin | Checklist panel, flagged missing items, hearing readiness status |
| Client Case Status Page | /client/cases/:caseId | Client | Shared case updates, hearing date, status history, downloadable shared files |
| Profile / Account | /profile | Logged-in users | User details, password update, session info, logout action |
| Not Found / Unauthorized | /404 and /unauthorized | Public / Restricted users | Error state, redirect action, access-denied explanation |

## Section P6: UI/UX Requirements

- **Layout pattern:** Sidebar-based dashboard layout for all logged-in areas, with a top navbar or compact header for branding, notifications, and profile/session actions.
- **Responsiveness:** Desktop-first and mobile-responsive. Lawyers will likely use desktop or laptop during office work, but core case lookup must remain usable on tablets and phones.
- **Color theme guidance:** Neutral and professional. The UI should communicate reliability and clarity without decorative visual overload.
- **Key UI components needed:**
  - **Sidebar navigation:** Shows primary modules like Dashboard, Cases, Uploads, AI Assistant, Drafts, Readiness, and Profile; enables fast switching between legal workflows.
  - **Top header / navbar:** Shows page title, breadcrumbs, profile menu, and session actions.
  - **Stats cards:** Display active cases, recent uploads, pending alerts, and quick metrics.
  - **Case cards / case table:** Show matter name, client/party info, next hearing date, document count, and status.
  - **Document list/table:** Displays document title, type, upload date, source folder, and open/download actions.
  - **Forms:** Used for registration, login, folder creation, metadata entry, and draft generation inputs.
  - **Upload dropzone / file picker:** Handles document uploads, progress feedback, and validation.
  - **Chat panel:** Displays question/answer history, current context, and prompt entry actions.
  - **Summary cards/panels:** Present AI-generated summaries in readable sections.
  - **Timeline component:** Shows dates and events chronologically, with references to source documents.
  - **Alert banners / checklist panels:** Surface missing-document warnings and readiness issues.
  - **Modal dialogs:** Confirm delete/archive actions and other destructive operations.
  - **Skeleton loaders:** Appear while loading case data, summaries, timelines, or AI responses.
- **Empty states:**
  - No cases yet → Show “Create your first case folder” prompt.
  - No documents in folder → Show upload CTA and supported file guidance.
  - No AI chat history → Show starter prompts and example legal questions.
  - No shared client updates → Show informative placeholder rather than blank panels.
- **Loading states:** Use skeleton loaders or lightweight shimmer placeholders on dashboard cards, document tables, AI response areas, folder detail screens, and timeline generation views.

---

# LexiCourt — Technical Requirements Document (TRD)
**Version:** 1.0  
**Stack:** HTML5 + CSS3 + JavaScript + Bootstrap 5 + Firebase (Authentication + Realtime Database/Firestore-style data layer + Storage + Hosting + Cloud Functions)  
**ML:** Google Gemini API for NLP-style document understanding, summarization, timeline extraction, and draft generation  

## Section T1: System Architecture

```text
[Browser / Web App]
        ↓
[Firebase Authentication] — handles login, roles, sessions
        ↓
[Firestore / Realtime Database Layer] — stores app data, case metadata, chat history, drafts, alerts
        ↓
[Firebase Storage] — stores uploaded case files, generated exports, supporting documents
        ↓
[Firebase Hosting] — serves the web app
        ↓
[External APIs] — Google Gemini API via Firebase Cloud Functions
```

LexiCourt follows a lightweight client-cloud architecture. The web application runs in the browser and handles the UI, navigation, and user interactions. Authentication is managed by Firebase Authentication. After login, the app reads the user profile and role from the database, then loads case folders, file metadata, summaries, chat history, and alerts from Firebase. Uploaded case files are stored in Firebase Storage, while structured data such as user profiles, case records, timeline entries, and draft outputs are stored in the database. When a lawyer asks an AI question or requests a summary, timeline, or draft, the app invokes a Firebase Cloud Function that securely calls the Gemini API, processes the result, and stores the output back in the relevant case context.

## Section T2: Firebase Firestore Schema

**Collection: users**  
Document ID: Firebase Auth UID

Fields:
| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| uid | string | Firebase Auth user ID | "uid_9a82x" |
| fullName | string | Full name of the user | "Jaskirat Singh Kamboh" |
| email | string | Email address | "lawyer@example.com" |
| role | string | User role in the system | "lawyer" |
| phone | string | Optional contact number | "+91XXXXXXXXXX" |
| isActive | boolean | Whether account is active | true |
| practiceName | string | Optional firm/team name | "Kamboh Legal Associates" |
| createdAt | timestamp | Account creation time | Timestamp |
| updatedAt | timestamp | Last profile update time | Timestamp |

**Collection: caseFolders**  
Document ID: auto-generated

Fields:
| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| caseId | string | Unique case identifier | "case_001" |
| ownerUid | string | UID of primary lawyer owner | "uid_9a82x" |
| assignedUserIds | array<string> | Team members with access | ["uid_9a82x", "uid_1b22k"] |
| clientId | string | Linked client user ID if any | "uid_client_33" |
| caseTitle | string | Matter/folder name | "State vs Sharma" |
| caseNumber | string | Court case number | "CR-120/2026" |
| courtName | string | Relevant court name | "District Court, Delhi" |
| matterType | string | Nature of legal matter | "Criminal" |
| clientName | string | Client display name | "Rohit Sharma" |
| oppositeParty | string | Opposing party details | "State" |
| status | string | Case lifecycle status | "active" |
| nextHearingDate | timestamp | Upcoming hearing date if known | Timestamp |
| tags | array<string> | Search/filter tags | ["bail", "urgent"] |
| notes | string | Internal case notes | "Prepare affidavit before hearing" |
| createdAt | timestamp | Folder creation time | Timestamp |
| updatedAt | timestamp | Last modification time | Timestamp |

**Collection: documents**  
Document ID: auto-generated

Fields:
| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| documentId | string | Unique document record ID | "doc_1001" |
| caseId | string | Linked case folder ID | "case_001" |
| ownerUid | string | User who uploaded the document | "uid_9a82x" |
| fileName | string | Original uploaded filename | "last_order.pdf" |
| displayTitle | string | User-friendly document title | "Last Hearing Order" |
| documentType | string | Type/category of file | "court_order" |
| storagePath | string | Firebase Storage path | "cases/case_001/orders/last_order.pdf" |
| mimeType | string | Uploaded file MIME type | "application/pdf" |
| fileSize | number | File size in bytes | 485200 |
| uploadStatus | string | Upload/result status | "completed" |
| extractedText | string | Parsed text used for AI features | "..." |
| extractionStatus | string | Text extraction state | "success" |
| uploadedAt | timestamp | Upload timestamp | Timestamp |
| updatedAt | timestamp | Last metadata update | Timestamp |

**Collection: aiChats**  
Document ID: auto-generated

Fields:
| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| chatId | string | Chat record identifier | "chat_901" |
| caseId | string | Linked case folder | "case_001" |
| userUid | string | User who asked the question | "uid_9a82x" |
| question | string | Prompt asked by user | "What was the last order passed?" |
| answer | string | AI-generated response | "The last order dated..." |
| sourceDocumentIds | array<string> | Files used as context | ["doc_1001", "doc_1002"] |
| responseType | string | Query/summarize/timeline/draft | "query" |
| modelName | string | AI model used | "gemini-1.5-pro" |
| createdAt | timestamp | Time of response | Timestamp |

**Collection: summaries**  
Document ID: auto-generated

Fields:
| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| summaryId | string | Summary record ID | "sum_501" |
| caseId | string | Linked case folder | "case_001" |
| documentId | string | Linked document if summary is file-specific | "doc_1001" |
| requestedBy | string | UID of requesting user | "uid_9a82x" |
| summaryText | string | Generated summary content | "This order concerns..." |
| summaryScope | string | Case-level or document-level summary | "document" |
| modelName | string | AI model used | "gemini-1.5-pro" |
| createdAt | timestamp | Generation time | Timestamp |
| updatedAt | timestamp | Last refresh time | Timestamp |

**Collection: timelines**  
Document ID: auto-generated

Fields:
| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| timelineId | string | Timeline record ID | "time_071" |
| caseId | string | Linked case folder | "case_001" |
| generatedBy | string | UID of requesting user | "uid_9a82x" |
| sourceDocumentIds | array<string> | Documents analyzed | ["doc_1001"] |
| events | array<object> | Extracted chronological events | [{"date":"2026-01-03","event":"Notice issued"}] |
| generatedAt | timestamp | Extraction time | Timestamp |
| modelName | string | AI model used | "gemini-1.5-pro" |

**Collection: drafts**  
Document ID: auto-generated

Fields:
| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| draftId | string | Draft record identifier | "draft_220" |
| caseId | string | Linked case folder | "case_001" |
| requestedBy | string | User who generated the draft | "uid_9a82x" |
| draftType | string | Draft category | "affidavit" |
| inputPayload | map | User-provided case and drafting inputs | {"deponent":"Rohit Sharma"} |
| generatedText | string | Draft output content | "I, Rohit Sharma..." |
| status | string | Draft state | "generated" |
| modelName | string | AI model used | "gemini-1.5-pro" |
| createdAt | timestamp | Generation timestamp | Timestamp |
| updatedAt | timestamp | Last edit timestamp | Timestamp |

**Collection: readinessChecks**  
Document ID: auto-generated

Fields:
| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| checkId | string | Alert/check identifier | "check_88" |
| caseId | string | Linked case folder | "case_001" |
| generatedBy | string | User/system that ran the check | "uid_9a82x" |
| hearingDate | timestamp | Relevant hearing date | Timestamp |
| checklistType | string | Type of readiness checklist | "pre-hearing" |
| missingItems | array<string> | Potentially missing documents | ["Vakalatnama", "Previous order copy"] |
| severity | string | Overall alert level | "medium" |
| notes | string | Additional comments | "Order copy not found in folder" |
| createdAt | timestamp | Check time | Timestamp |

**Collection: clientShares**  
Document ID: auto-generated

Fields:
| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| shareId | string | Share/access record ID | "share_11" |
| caseId | string | Linked case folder | "case_001" |
| clientUid | string | Client user ID | "uid_client_33" |
| sharedBy | string | Lawyer/admin who granted access | "uid_9a82x" |
| sharedDocumentIds | array<string> | Files visible to client | ["doc_1001"] |
| sharedSummaryIds | array<string> | Summaries visible to client | ["sum_501"] |
| sharedTimelineIds | array<string> | Timelines visible to client | ["time_071"] |
| permissions | map | Access configuration | {"viewDocuments":true,"viewStatus":true} |
| createdAt | timestamp | Share creation time | Timestamp |

## Section T3: Firebase Auth Setup

```text
**Method:** Email + Password
**Roles:** Stored in Firestore/Database users collection as `role` field
**Role check:** On login, fetch user doc from database → read `role` → redirect to correct dashboard
**Session:** Firebase handles session persistence automatically
**Protected routes:** Use JavaScript auth state listener + route guards to block unauthorized access
```

**Redirect logic per role:**
- `lawyer` → `/dashboard`
- `admin` → `/admin`
- `client` → `/client-dashboard`

**Additional auth notes:**
- Registration should normally default to `lawyer` unless admin-created or invite-based client access is enabled.
- Firebase Security Rules must ensure users can only access documents and records tied to their UID or explicitly shared cases.
- Admin users can read/write broader organizational records for managed team accounts.

## Section T4: File & Folder Structure

```text
LexiCourt/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Navbar.js
│   │   ├── Sidebar.js
│   │   ├── StatsCard.js
│   │   ├── CaseCard.js
│   │   ├── CaseTable.js
│   │   ├── UploadDropzone.js
│   │   ├── DocumentTable.js
│   │   ├── ChatPanel.js
│   │   ├── TimelineView.js
│   │   ├── DraftPreview.js
│   │   ├── AlertBanner.js
│   │   ├── LoaderSkeleton.js
│   │   └── ProtectedRoute.js
│   ├── pages/
│   │   ├── LandingPage.js
│   │   ├── Register.js
│   │   ├── Login.js
│   │   ├── LawyerDashboard.js
│   │   ├── AdminDashboard.js
│   │   ├── ClientDashboard.js
│   │   ├── CaseListPage.js
│   │   ├── CaseFormPage.js
│   │   ├── CaseDetailPage.js
│   │   ├── DocumentUploadPage.js
│   │   ├── DocumentViewerPage.js
│   │   ├── AssistantPage.js
│   │   ├── SummaryPage.js
│   │   ├── TimelinePage.js
│   │   ├── DraftGeneratorPage.js
│   │   ├── ReadinessPage.js
│   │   ├── ClientCaseStatusPage.js
│   │   ├── ProfilePage.js
│   │   ├── UnauthorizedPage.js
│   │   └── NotFoundPage.js
│   ├── firebase/
│   │   ├── config.js
│   │   ├── auth.js
│   │   ├── db.js
│   │   ├── storage.js
│   │   └── functions.js
│   ├── context/
│   │   └── AuthContext.js
│   ├── services/
│   │   ├── caseService.js
│   │   ├── documentService.js
│   │   ├── aiService.js
│   │   ├── draftService.js
│   │   └── readinessService.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useCases.js
│   │   ├── useDocuments.js
│   │   └── useAI.js
│   ├── utils/
│   │   ├── dateHelpers.js
│   │   ├── validators.js
│   │   ├── routeHelpers.js
│   │   └── promptTemplates.js
│   ├── styles/
│   │   └── main.css
│   ├── router/
│   │   └── routes.js
│   └── app.js
├── functions/
│   ├── index.js
│   ├── geminiHandlers.js
│   ├── promptBuilders.js
│   └── package.json
├── .env
├── .gitignore
├── package.json
└── README.md
```

## Section T5: React Router / Route Setup

| Route | Component | Protected? | Role Required |
|-------|-----------|------------|---------------|
| / | LandingPage | No | Public |
| /register | Register | No | Public |
| /login | Login | No | Public |
| /dashboard | LawyerDashboard | Yes | lawyer |
| /admin | AdminDashboard | Yes | admin |
| /client-dashboard | ClientDashboard | Yes | client |
| /cases | CaseListPage | Yes | lawyer, admin |
| /cases/new | CaseFormPage | Yes | lawyer, admin |
| /cases/:caseId/edit | CaseFormPage | Yes | lawyer, admin |
| /cases/:caseId | CaseDetailPage | Yes | lawyer, admin |
| /cases/:caseId/upload | DocumentUploadPage | Yes | lawyer, admin |
| /cases/:caseId/documents/:documentId | DocumentViewerPage | Yes | lawyer, admin, shared client |
| /cases/:caseId/assistant | AssistantPage | Yes | lawyer, admin |
| /cases/:caseId/summary | SummaryPage | Yes | lawyer, admin, shared client |
| /cases/:caseId/timeline | TimelinePage | Yes | lawyer, admin, shared client |
| /cases/:caseId/drafts | DraftGeneratorPage | Yes | lawyer, admin |
| /cases/:caseId/readiness | ReadinessPage | Yes | lawyer, admin |
| /client/cases/:caseId | ClientCaseStatusPage | Yes | client |
| /profile | ProfilePage | Yes | Any logged-in user |
| /unauthorized | UnauthorizedPage | No | Public |
| * | NotFoundPage | No | Public |

## Section T6: Environment Variables

```env
# Firebase config
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Gemini / AI config
REACT_APP_USE_CLOUD_FUNCTIONS=true
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-pro
```

## Section T7: ML Model Specification

```text
**Model Type:** NLP / Generative AI / Retrieval-style document assistance
**What it predicts/outputs:** Answers questions from legal documents, generates summaries, extracts timelines, and drafts standard legal text
**Input features (what data goes in):**
  - extractedDocumentText: string, parsed text from uploaded legal files
  - userPrompt: string, lawyer's question or instruction
  - caseMetadata: object, case title, parties, dates, matter type
  - draftType: string, affidavit / notice / application / other draft category
  - promptTemplate: string, system-level instruction template for legal output quality
**Output:** Natural-language answer, concise summary, structured timeline events, or generated draft text
**Dataset needed:** No traditional supervised dataset is required for phase 1 because the system uses a hosted foundation model. The main input corpus comes from user-uploaded legal documents and prompt templates.
**Where to find dataset:** Not applicable in the traditional ML sense; primary data source is uploaded case material. For future fine-tuning or evaluation, legal judgment/order datasets from public repositories or Kaggle-style legal text collections may be explored.
**Integration:** Firebase Cloud Functions act as the secure server-side layer. The web app sends requests to a cloud function, which calls the Gemini API and returns structured output.
**Files needed:**
  - functions/geminiHandlers.js — AI request handlers
  - functions/promptBuilders.js — legal prompt templates
  - src/services/aiService.js — frontend request wrapper
  - src/utils/promptTemplates.js — reusable prompt patterns
```

## Section T8: Third-Party APIs

**API: Google Gemini API**
- Purpose: Provides document question answering, summarization, timeline extraction, and legal draft generation.
- Endpoint used: Gemini text generation endpoint via official Google AI SDK or REST generative content endpoint
- Auth: API key stored securely in server-side environment variables or Firebase Functions config
- How to get key: Create a Google AI Studio or Google Cloud project, enable Gemini access, then generate an API key from the Google AI console

**API: Firebase Authentication / Storage / Hosting / Cloud Functions**
- Purpose: Handles authentication, cloud storage, deployment, and backend logic orchestration
- Endpoint used: Firebase client SDK and callable/HTTP Cloud Functions endpoints
- Auth: Firebase project credentials and SDK configuration; security enforced through rules and auth tokens
- How to get key: Create a Firebase project in Firebase Console, enable the required services, and copy web app configuration values into the environment file

## Section T9: Development Setup Instructions

```bash
# Setting up the project locally

1. Clone the repo:
   git clone [repo-url]
   cd LexiCourt

2. Install dependencies:
   npm install

3. Set up Firebase:
   - Go to console.firebase.google.com
   - Create a new project named "LexiCourt"
   - Enable Authentication (Email/Password)
   - Create Firestore database or Realtime Database
   - Enable Storage
   - Enable Hosting
   - Enable Cloud Functions
   - Copy config keys to .env file

4. Set up Gemini:
   - Create a Gemini API key in Google AI Studio / Google Cloud
   - Store it in server-side environment config
   - Add model name and AI flags to the environment file

5. Run the app:
   npm run dev   # if migrated to Vite
   npm start     # if using Create React App or a configured JS build setup

6. Run Firebase emulators or deploy functions if needed:
   firebase emulators:start
   firebase deploy

7. Open in browser:
   http://localhost:3000
   or
   http://localhost:5173
```

---

## Inference Notes

- The synopsis explicitly states that the target users are solo lawyers and small teams. A **client** role is inferred because the problem statement mentions clients needing visibility into case progress.
- An **admin/firm owner** role is inferred to satisfy team-level access control and management needs for a multi-user web application.
- The synopsis mentions **Firebase Realtime Database**, while the skill template asks for **Firestore schema**. This document uses a Firestore-style schema specification because the required format is collection-based, but the same logical entities can be implemented in Realtime Database if desired.
- The skill template uses **React.js** in examples, but the synopsis explicitly lists **HTML, CSS, JavaScript, and Bootstrap 5** as the implemented frontend. This document preserves the actual synopsis stack rather than changing it.

