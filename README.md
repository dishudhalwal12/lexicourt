# LexiCourt

LexiCourt is a legal workflow and courtroom-preparation app built for Indian practice. It includes case tracking, document management, AI-assisted summaries, draft generation, timelines, and hearing-readiness support.

## 5-Minute Demo Setup

If you only need to show the app quickly on a laptop:

1. Install Git and Node.js if they are missing.
2. Clone the repository.
3. Run `npm install`.
4. Create a `.env` file from `.env.example`.
5. Add the working Gemini API key.
6. Run `npm run dev:all`.
7. Open `http://127.0.0.1:3000`.
8. Click `Demo Workspace` if you want to show the app without depending on live Firebase data.

## What You Need Before Running LexiCourt

You need these tools on the laptop:

- Git
- Node.js
- npm

Important:

- Node.js is the JavaScript runtime used to run this project locally.
- When you install Node.js, `npm` is installed with it automatically.
- You do not need to install JavaScript separately.

Recommended version:

- Node.js 20 or newer

## Step 1: Check If Git, Node.js, and npm Are Already Installed

Open Terminal on macOS/Linux or PowerShell on Windows and run:

```bash
git --version
node -v
npm -v
```

If all 3 commands show a version number, move to cloning the repository.

If one of them says `command not found` or `is not recognized`, install that tool using the steps below.

## Step 2: Install Git If It Is Missing

### macOS

Option 1:

```bash
xcode-select --install
```

Option 2 with Homebrew:

```bash
brew install git
```

### Windows

Download Git from:

- [https://git-scm.com/download/win](https://git-scm.com/download/win)

Or install with Winget:

```powershell
winget install --id Git.Git -e
```

## Step 3: Install Node.js If `node` or `npm` Is Missing

### macOS

Option 1:

- Download Node.js LTS from [https://nodejs.org](https://nodejs.org)

Option 2 with Homebrew:

```bash
brew install node
```

### Windows

Option 1:

- Download Node.js LTS from [https://nodejs.org](https://nodejs.org)

Option 2 with Winget:

```powershell
winget install OpenJS.NodeJS.LTS
```

After installation, close and reopen Terminal or PowerShell, then verify:

```bash
node -v
npm -v
```

## Step 4: Clone the GitHub Repository

Git is the tool used to copy the code from GitHub to the laptop.

Run:

```bash
git clone https://github.com/dishudhalwal12/lexicourt.git
cd lexicourt
```

If the folder name on GitHub changes later, use that repository URL instead.

## Step 5: Install the Project Dependencies

Inside the project folder, run:

```bash
npm install
```

This downloads all required packages for the frontend and backend.

## Step 6: Create the Local Environment File

This app needs a local `.env` file for the Gemini API key and API port.

### macOS / Linux

```bash
cp .env.example .env
```

### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

Then open `.env` and make sure it looks like this:

```env
GEMINI_API_KEY=PASTE_YOUR_WORKING_GEMINI_API_KEY_HERE
PORT=8787
```

Important:

- Do not commit the `.env` file to GitHub.
- Keep the Gemini key only on the local laptop.
- The current project already includes Firebase web configuration in the client code.

## Step 7: Start LexiCourt

The fastest way to run everything is:

```bash
npm run dev:all
```

This starts:

- Next.js frontend on `http://127.0.0.1:3000`
- local Node API on `http://127.0.0.1:8787`

If you want to run them separately:

Terminal 1:

```bash
npm run dev:web
```

Terminal 2:

```bash
npm run dev:api
```

## Step 8: Open the App

Main app:

- [http://127.0.0.1:3000](http://127.0.0.1:3000)

Useful pages:

- [http://127.0.0.1:3000/login](http://127.0.0.1:3000/login)
- [http://127.0.0.1:3000/dashboard](http://127.0.0.1:3000/dashboard)
- [http://127.0.0.1:3000/cases](http://127.0.0.1:3000/cases)
- [http://127.0.0.1:3000/case-detail](http://127.0.0.1:3000/case-detail)
- [http://127.0.0.1:3000/assistant](http://127.0.0.1:3000/assistant)
- [http://127.0.0.1:3000/drafts](http://127.0.0.1:3000/drafts)
- [http://127.0.0.1:3000/timeline](http://127.0.0.1:3000/timeline)

API health check:

- [http://127.0.0.1:8787/api/health](http://127.0.0.1:8787/api/health)

## Demo Workspace

For a fast presentation or client meeting, LexiCourt now includes a `Demo Workspace`.

Use it when:

- you want to show the product quickly
- Firebase login or live data is not ready
- you want sample matters, documents, drafts, and timelines already loaded

How to use it:

1. Start the app with `npm run dev:all`.
2. Open [http://127.0.0.1:3000](http://127.0.0.1:3000) or [http://127.0.0.1:3000/login](http://127.0.0.1:3000/login).
3. Click `Demo Workspace`.

The demo mode keeps sample data in browser storage so changes made during the meeting stay visible while you continue clicking around.

## What “Models” LexiCourt Uses

LexiCourt currently uses 2 layers:

1. Gemini API

- Used for richer AI-generated answers, summaries, drafts, and timeline extraction.
- Requires `GEMINI_API_KEY` in `.env`.

2. Local legal datasets and fallback logic

- Stored inside the `ML/` folder.
- Used for legal reference retrieval, case insights, and fallback responses if Gemini is unavailable.

So even if Gemini is not available, parts of the app can still respond using local logic and dataset-based fallback behavior.

## Project Scripts

Useful commands:

```bash
npm run dev
npm run dev:web
npm run dev:api
npm run dev:all
npm run build
npm run start
```

Meaning:

- `npm run dev:web` starts the Next.js frontend
- `npm run dev:api` starts the local Gemini/data API
- `npm run dev:all` starts both together
- `npm run build` checks whether the app builds successfully for production

## Folder Overview

```text
LexiCourt/
├── app/                  # Next.js app routes
├── legacy/               # legacy UI surface mounted inside Next.js
├── server/               # local Node API and Gemini integration
├── ML/                   # local legal datasets and fallback logic
├── public/               # static public assets
├── context/              # docs and product context
├── package.json
├── .env.example
└── README.md
```

## Common Problems and Fixes

### Problem: `git` is not recognized

Git is not installed.

Fix:

- install Git using the instructions above
- close and reopen Terminal or PowerShell

### Problem: `node` or `npm` is not recognized

Node.js is not installed correctly or the terminal has not refreshed.

Fix:

- install Node.js LTS
- close and reopen Terminal or PowerShell
- run `node -v` and `npm -v` again

### Problem: `npm install` fails

Possible fixes:

- make sure you are inside the project folder
- make sure internet access is available
- run `node -v` and confirm Node is installed

### Problem: The frontend or API says the port is already in use

LexiCourt expects:

- frontend on port `3000`
- API on port `8787`

On macOS/Linux, check what is already using those ports:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
lsof -nP -iTCP:8787 -sTCP:LISTEN
```

If you recognize the old process, stop it and start LexiCourt again.

### Problem: The API is not responding

Check:

```bash
curl http://127.0.0.1:8787/api/health
```

If it fails:

- confirm `.env` exists
- confirm `PORT=8787`
- confirm the API was started with `npm run dev:api` or `npm run dev:all`

### Problem: AI features are weak or not using Gemini

This usually means the Gemini key is missing or invalid.

Fix:

- open `.env`
- confirm `GEMINI_API_KEY` has the working key
- restart the API server

### Problem: Login or live data is not ready for the meeting

Use the `Demo Workspace` path from the landing page or login page.

## Safe Usage Notes

- Never commit `.env`
- Never push private API keys to GitHub
- Prefer the demo workspace for presentations if you are unsure whether live Firebase data is ready

## Firebase Deployment

If you are setting up the production environment or updating security rules:

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Deploy Security Rules and Indexes
LexiCourt uses specific Firestore rules to ensure lawyer-client data privacy. To deploy these:
```bash
firebase deploy --only firestore:rules,storage:rules,firestore:indexes
```

### 4. Full Deployment (Optional)
If you want to deploy the entire project (including the web app):
```bash
firebase deploy
```

## Quick Repeat Checklist

```bash
git clone https://github.com/dishudhalwal12/lexicourt.git
cd lexicourt
npm install
cp .env.example .env
# add GEMINI_API_KEY in .env
npm run dev:all
```

Then open:

- [http://127.0.0.1:3000](http://127.0.0.1:3000)

