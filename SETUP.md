# AI Roof Inspector — Setup Guide

## Running locally

### Step 1: Restart your computer after installing Node.js
Node.js adds itself to PATH during install, but open terminals won't see it until you restart (or open a fresh terminal window).

### Step 2: Add your Anthropic API key
Open `backend/.env` and replace `your_api_key_here` with your actual key:
```
ANTHROPIC_API_KEY=sk-ant-...your-key-here...
```
Get a key at https://console.anthropic.com

### Step 3: Double-click `start.bat`
It will:
1. Detect Node.js automatically
2. Warn you clearly if anything is missing
3. Install all dependencies (first run only, ~1 minute)
4. Build the frontend into the backend
5. Start the server and open http://localhost:3001

---

## Deploying as a public website (no installs for users)

The app is structured so Express serves the built React frontend — one server, one URL.

### Deploy to Railway (free, easiest option)

1. Push this project to a GitHub repository
2. Go to https://railway.app and sign in with GitHub
3. Click **New Project → Deploy from GitHub repo** → select your repo
4. In Railway's **Variables** tab, add:
   ```
   ANTHROPIC_API_KEY=sk-ant-...your-key...
   ```
5. In **Settings**, set:
   - **Build command:** `npm run build`
   - **Start command:** `npm start`
6. Railway auto-deploys — your app gets a public URL like `https://your-app.railway.app`

Users visit that URL. No installs, no Node, nothing to download.

### Deploy to Render (also free)

1. Push to GitHub
2. Go to https://render.com → New → Web Service → connect your repo
3. Set:
   - **Build command:** `npm run build`
   - **Start command:** `npm start`
4. Add `ANTHROPIC_API_KEY` in the Environment tab
5. Deploy — get a `https://your-app.onrender.com` URL

---

## Project structure

```
AI Roof Inspection App/
├── package.json           ← Root: build + start scripts for deployment
├── start.bat              ← Local one-click launcher
├── backend/
│   ├── server.js          ← Express API + serves built frontend
│   ├── public/            ← Built React app (auto-generated, don't edit)
│   ├── .env               ← API key goes here
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   └── components/
    │       ├── ImageUploader.jsx
    │       ├── LoadingState.jsx
    │       └── ReportDisplay.jsx
    ├── vite.config.js     ← Builds into ../backend/public
    └── package.json
```
