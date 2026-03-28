# LexiCourt

LexiCourt is a courtroom-focused legal workflow app for Indian practice. It includes:

- matter and case management
- document records and file upload
- AI assistant flows
- draft generation
- timelines
- readiness / hearing-prep insights
- admin and client dashboards

The project now runs through a **Next.js + TypeScript** app layer while preserving the current product design and workflow.

## Tech Stack

- Next.js
- TypeScript
- React
- Firebase Authentication
- Firestore
- Firebase Storage
- Gemini API through the local Node server
- Chart.js
- Bootstrap 5

## Important Setup Note

There are two kinds of config in this repo:

1. **Firebase web config**
This is already present in the project and is okay to keep in the client app.

2. **Gemini server key**
This must stay in a local `.env` file.

Do **not** push the Gemini API key into a public GitHub repository.

You do **not** need to generate a new Gemini key for the client laptop.
You can use the **same working key** you already have by creating a local `.env` file on the client laptop after cloning.

## Folder Structure

```text
LexiCourt/
├── app/                  # Next.js app routes
├── components/           # shared React helpers
├── legacy/               # preserved HTML/CSS/JS app surface used by the Next bridge
│   ├── assets/
│   ├── css/
│   └── js/
├── server/               # Gemini / ML / local API logic
├── ML/                   # curated legal datasets
├── context/              # project docs / references
├── next.config.ts
├── package.json
├── tsconfig.json
├── firebase.json
├── firestore.rules
└── storage.rules
```

## What You Need On The Client Laptop

Minimum requirements:

- Git
- Node.js LTS
- npm
- VS Code or any code editor

Recommended Node version:

- Node.js 20 or newer

## Before You Start

Open terminal and verify:

```bash
git --version
node -v
npm -v
```

If these commands work, continue.

If not, use the install instructions below.

## If Git Is Missing

### Windows

Install:

- Git from [https://git-scm.com/download/win](https://git-scm.com/download/win)

Or with Winget:

```powershell
winget install --id Git.Git -e
```

### macOS

Install:

```bash
xcode-select --install
```

Or with Homebrew:

```bash
brew install git
```

## If Node.js Is Missing

### Windows

Install Node LTS from:

- [https://nodejs.org](https://nodejs.org)

Or with Winget:

```powershell
winget install OpenJS.NodeJS.LTS
```

### macOS

Install from:

- [https://nodejs.org](https://nodejs.org)

Or with Homebrew:

```bash
brew install node
```

Then reopen terminal and verify again:

```bash
node -v
npm -v
```

## Clone The Project

```bash
git clone https://github.com/dishudhalwal12/lexicourt.git
cd lexicourt
```

## Install Dependencies

```bash
npm install
```

## Create The Local Environment File

This project needs a local `.env` file for the Gemini server key.

### macOS / Linux

```bash
cp .env.example .env
```

### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

Then open `.env` and set:

```env
GEMINI_API_KEY=PASTE_YOUR_CURRENT_WORKING_GEMINI_KEY_HERE
PORT=8787
```

Important:

- use the **same current Gemini key** you already use locally
- do **not** commit `.env`
- you do **not** need to regenerate Firebase config

## Fastest Way To Run Everything

From the project root:

```bash
npm run dev:all
```

That starts:

- Next.js frontend on `http://127.0.0.1:3000`
- local API on `http://127.0.0.1:8787`

## If You Want To Run Them Separately

Terminal 1:

```bash
npm run dev:web
```

Terminal 2:

```bash
npm run dev:api
```

## App URLs

Frontend:

- [http://127.0.0.1:3000](http://127.0.0.1:3000)

Common routes:

- [http://127.0.0.1:3000/login](http://127.0.0.1:3000/login)
- [http://127.0.0.1:3000/register](http://127.0.0.1:3000/register)
- [http://127.0.0.1:3000/dashboard](http://127.0.0.1:3000/dashboard)
- [http://127.0.0.1:3000/cases](http://127.0.0.1:3000/cases)

API health:

- [http://127.0.0.1:8787/api/health](http://127.0.0.1:8787/api/health)

## Quick Client Demo Flow

Use this during the Google Meet / AnyDesk setup:

1. Install Git if missing.
2. Install Node.js LTS if missing.
3. Clone the repo.
4. Run `npm install`.
5. Create `.env`.
6. Paste the current working Gemini key into `.env`.
7. Run `npm run dev:all`.
8. Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

## If Something Fails

### 1. `npm` or `node` is not recognized

Node is not installed correctly or terminal needs reopening.

Fix:

- reinstall Node LTS
- close and reopen terminal

### 2. Port 3000 is already in use

Run:

```bash
npx kill-port 3000
```

Or change the frontend port manually:

```bash
next dev --hostname 127.0.0.1 --port 3001
```

### 3. Port 8787 is already in use

Run:

```bash
npx kill-port 8787
```

Or change the API port in `.env`:

```env
PORT=8788
```

### 4. Gemini features are not working

Check:

- `.env` exists
- `GEMINI_API_KEY` is pasted correctly
- API is running
- [http://127.0.0.1:8787/api/health](http://127.0.0.1:8787/api/health) opens

### 5. Firebase login/data is not working

The Firebase web config is already in the repo.

Check:

- internet connection is available
- Firebase project is still active
- Firestore / Auth / Storage rules are deployed

### 6. UI looks broken after pulling changes

Run:

```bash
rm -rf .next
npm install
npm run dev:all
```

On Windows PowerShell:

```powershell
Remove-Item .next -Recurse -Force
npm install
npm run dev:all
```

## Production / Handoff Guidance

For a client laptop demo, local dev mode is enough.

If you want a cleaner permanent client setup later, the next step should be:

- deploy Next.js frontend
- deploy the Node API securely
- keep Gemini key on the server only

## Security Note

- Firebase client config can remain in the frontend
- Gemini API key should remain only in local `.env` or server env
- Never push `.env` to a public repository

## Current Commands Summary

Install:

```bash
npm install
```

Run all:

```bash
npm run dev:all
```

Run frontend only:

```bash
npm run dev:web
```

Run API only:

```bash
npm run dev:api
```

Build:

```bash
npm run build
```
