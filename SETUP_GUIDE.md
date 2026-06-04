# Family Health Tracker — Complete VS Code Setup Guide
## ✅ No API Key Required · 100% Free · Works Offline

---

## WHAT THIS APP DOES

- Add every family member (you, spouse, kids, parents)
- Upload their lab reports (PDF or photo)
- Smart parser automatically reads the text and extracts 60+ known parameters (Haemoglobin, TSH, Cholesterol, HbA1c, Creatinine, Vitamin D, etc.)
- Dashboard with trend charts + comparison tables per member
- Filter by category: CBC, Lipids, Liver, Kidney, Thyroid, Vitamins, Immunity
- Share reports with your doctor via a secure link (no login needed for the doctor)

---

## PART 1 — INSTALL REQUIRED SOFTWARE

### Step 1 — Install Node.js

1. Open your browser and go to: **https://nodejs.org**
2. Click the big green button that says **"LTS"** (Long Term Support)
3. Download the installer (it will be a `.msi` file on Windows, `.pkg` on Mac)
4. Run the installer → click **Next** all the way through → click **Install**
5. When it finishes, click **Finish**

**Verify it worked:**
- On Windows: Press `Win + R`, type `cmd`, press Enter
- On Mac: Press `Cmd + Space`, type `Terminal`, press Enter
- Type this and press Enter:
  ```
  node --version
  ```
- You should see something like: `v20.11.0` (any number 18 or above is fine)
- Also type:
  ```
  npm --version
  ```
- You should see something like: `10.2.4`

> ❌ If you see "not recognized" or "command not found" — restart your computer and try again.

---

### Step 2 — Install VS Code

1. Go to: **https://code.visualstudio.com**
2. Click **Download for Windows** (or Mac/Linux)
3. Run the installer → accept the agreement → click Next
4. ✅ Make sure to tick **"Add to PATH"** when the option appears
5. Click **Install** → **Finish**

**Recommended VS Code Extensions (optional but helpful):**

After opening VS Code, click the Extensions icon on the left sidebar (looks like 4 squares):
- Search **"ESLint"** → Install (by Microsoft)
- Search **"Prettier"** → Install (by Prettier)
- Search **"SQLite Viewer"** → Install (by Florian Klampfer) — lets you see your database

---

## PART 2 — SET UP THE PROJECT

### Step 3 — Extract the ZIP File

1. Find the downloaded `family-health-tracker.zip` file (usually in your Downloads folder)
2. Right-click it → **Extract All** (Windows) or double-click (Mac)
3. Choose a location you'll remember, e.g. your Desktop or Documents
4. You will get a folder called `family-health-tracker`

---

### Step 4 — Open the Project in VS Code

1. Open VS Code
2. Go to the menu: **File → Open Folder**
3. Navigate to the `family-health-tracker` folder you just extracted
4. Click **Select Folder** (Windows) or **Open** (Mac)
5. VS Code will open and you'll see all the project files in the left panel

The folder structure looks like this:
```
family-health-tracker/
├── backend/          ← The server (runs on your computer)
│   ├── .env          ← Configuration file
│   ├── server.js     ← Server entry point
│   ├── db/           ← Database setup
│   ├── middleware/   ← Authentication
│   └── routes/       ← API endpoints
├── frontend/         ← The website (React app)
│   ├── src/
│   │   ├── pages/    ← Dashboard, Upload, Trends, Shares
│   │   └── components/
│   └── index.html
└── SETUP_GUIDE.md    ← This file
```

---

### Step 5 — Open the Terminal in VS Code

1. In VS Code, go to the menu: **Terminal → New Terminal**
2. A terminal panel will appear at the bottom of VS Code
3. You will see a prompt like `C:\Users\YourName\...\family-health-tracker>` (Windows) or `~/family-health-tracker$` (Mac)

> 💡 This terminal is just like the Command Prompt or Terminal app but inside VS Code.

---

### Step 6 — Install Backend Dependencies

In the VS Code terminal, type the following commands **one at a time** and press Enter after each:

```
cd backend
```
(This moves into the backend folder)

```
npm install
```
(This downloads all required packages — takes 1-3 minutes)

You'll see a lot of text scrolling by — that's normal. Wait until you see the prompt again (the `>`).

> ⚠️ You may see some yellow "warnings" — those are fine. Only red "errors" are a problem.

---

### Step 7 — Install Frontend Dependencies

Now open a **second terminal** in VS Code:
- Click the **`+`** button in the top-right of the terminal panel (or go to Terminal → New Terminal)

In this new terminal, type:

```
cd frontend
```

```
npm install
```

Again wait for it to finish (1-2 minutes).

---

## PART 3 — RUN THE APP

You need **two terminals running at the same time** — one for the backend, one for the frontend.

### Step 8 — Start the Backend (Terminal 1)

Click on your first terminal (the one that's inside `backend/`).

If it shows `family-health-tracker>` instead of `backend>`, type:
```
cd backend
```

Then start the server:
```
npm run dev
```

✅ You should see:
```
🏥 Family Health Tracker API running on http://localhost:3001
📊 Health check: http://localhost:3001/api/health
```

> 🔴 **Keep this terminal open and running.** Do NOT close it.

---

### Step 9 — Start the Frontend (Terminal 2)

Click on your second terminal (the one inside `frontend/`).

If it shows `family-health-tracker>`, type:
```
cd frontend
```

Then start the app:
```
npm run dev
```

✅ You should see:
```
  VITE v5.x.x  ready in 500ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

> 🔴 **Keep this terminal open too.**

---

### Step 10 — Open the App in Your Browser

1. Open Chrome, Firefox, or Edge
2. In the address bar, type: **http://localhost:5173**
3. Press Enter
4. You will see the **Family Health Tracker login screen** 🎉

---

## PART 4 — FIRST TIME USE

### Create Your Account

1. Click **"Create Account"**
2. Enter your name, email (can be any email, it's stored only on your computer), and a password
3. Click **"Create Account"**
4. You're in! A family member with your name is automatically created.

### Add Family Members

1. In the left sidebar, click **"+ Add"** next to "Family Members"
2. Fill in the name, relationship (Self, Spouse, Child, Parent, etc.), gender, date of birth, blood group
3. Click **"Add Member"**
4. Repeat for each family member

### Upload a Lab Report

1. Click **"Reports & Upload"** in the left sidebar
2. Click the family member's name at the top (to select who the report belongs to)
3. Set the **Year** and **Month** of the report
4. You can optionally type the Lab Name and Doctor name (or leave blank — the parser will try to detect them)
5. Click **"Choose File"** or drag your PDF/image onto the upload area
6. Wait 5-15 seconds
7. You'll see a log showing how many parameters were extracted

### View the Dashboard

1. Click **"Dashboard"** in the sidebar
2. You'll see:
   - **Summary cards**: Total parameters, Normal count, Abnormal count
   - **Report chips**: Click to toggle which reports are shown
   - **Category filters**: CBC, Sugar, Lipids, Liver, Kidney, Thyroid, Vitamins, Immunity
   - **Trend Charts**: Line graphs for every parameter across reports
   - **Comparison Table**: All values side by side with status (Normal/High/Low)

### Share with Your Doctor

1. From the Dashboard, click **"⤴ Share with Doctor"**
2. Enter the doctor's name and email
3. Choose which reports to include
4. Set an expiry date (e.g. 30 days)
5. Click **"Create Share Link"**
6. Copy the link and send it to your doctor (WhatsApp, email, etc.)
7. Your doctor clicks the link — they see a clean read-only report with no login required

---

## TROUBLESHOOTING

### "npm is not recognized" or "node is not recognized"
→ Node.js didn't install properly. Restart your computer, then try installing Node.js again from nodejs.org.

### "Cannot GET /api/health" or frontend shows blank page
→ The backend isn't running. Go to Terminal 1 and make sure `npm run dev` is running. If it stopped, type `npm run dev` again.

### "EADDRINUSE: address already in use 3001"
→ Port 3001 is already occupied. Either:
- Close any other running Node apps, OR
- Open `backend/.env`, change `PORT=3001` to `PORT=3002`, and open `frontend/vite.config.js`, change `target: 'http://localhost:3001'` to `target: 'http://localhost:3002'`

### Upload says "0 parameters extracted"
→ This happens when the PDF is a scanned image. The OCR (image reader) will try but may not read stylised lab formats. Solution:
- Make sure the PDF has actual selectable text (try selecting text in the PDF — if you can highlight it, extraction will work great)
- For image files (JPG/PNG), OCR works but depends on image quality and contrast
- You can always add parameters manually using the "Manual Entry" option

### App works but charts don't show
→ You need at least 2 reports uploaded for the same member to see trend lines.

### "better-sqlite3" installation error on Windows
→ You need Windows Build Tools. Run this in your terminal as Administrator:
```
npm install --global windows-build-tools
```
Then retry `npm install` in the backend folder.

### Forgot password
→ Since data is stored locally, open the file `backend/data/health_tracker.db` with the SQLite Viewer extension in VS Code, find your user in the `users` table, and delete the row. Then re-register.

---

## HOW TO START THE APP NEXT TIME

Every time you want to use the app:

1. Open VS Code → Open the `family-health-tracker` folder
2. Open **two terminals** (Terminal → New Terminal, then click + for another)
3. **Terminal 1:** `cd backend` then `npm run dev`
4. **Terminal 2:** `cd frontend` then `npm run dev`
5. Open browser → **http://localhost:5173**

> 💡 Tip: You can also create a batch file (Windows) or shell script (Mac) to start both with one click — ask Claude to help you create one!

---

## WHERE YOUR DATA IS STORED

| Data | Location |
|------|----------|
| Database (all members, reports, parameters) | `backend/data/health_tracker.db` |
| Uploaded report files | `backend/uploads/` |

**Back up these two folders regularly to keep your health data safe!**

---

## HOSTING GUIDE (to use from anywhere, not just your computer)

Once it works locally, you can host it online so you can access it from your phone or share the link. Both options below are **free**.

### Option A — Railway (Backend) + Netlify (Frontend) — Recommended

**Step 1: Push code to GitHub**
1. Create a free account at https://github.com
2. Click "New Repository" → name it `family-health-tracker` → click "Create"
3. In VS Code terminal:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOURUSERNAME/family-health-tracker.git
   git push -u origin main
   ```

**Step 2: Deploy Backend on Railway**
1. Go to https://railway.app → Sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub Repo"**
3. Select `family-health-tracker`
4. Railway will detect it as a Node app. Set:
   - **Root Directory:** `backend`
   - **Start Command:** `node server.js`
5. Go to **Variables** tab → Add:
   - `JWT_SECRET` = any long random string
   - `FRONTEND_URL` = https://your-app.netlify.app (you'll get this next)
6. Copy your Railway app URL (looks like `https://family-health-tracker-production.up.railway.app`)

**Step 3: Deploy Frontend on Netlify**
1. Go to https://netlify.com → Sign in with GitHub
2. Click **"Add new site"** → **"Import an existing project"** → Select your GitHub repo
3. Set:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
4. Go to **Environment Variables** → Add:
   - `VITE_API_URL` = your Railway URL from Step 2
5. Also update `frontend/vite.config.js` — change the proxy target to your Railway URL
6. Redeploy

**Now update Railway** with your Netlify URL in the `FRONTEND_URL` variable.

---

### Option B — Render (Free, simpler)
1. Go to https://render.com → Sign in with GitHub
2. **Backend:** New → Web Service → Root: `backend` → Build: `npm install` → Start: `node server.js`
3. **Frontend:** New → Static Site → Root: `frontend` → Build: `npm run build` → Publish: `dist`

---

*Built with React, Vite, Node.js, Express, SQLite, pdf-parse, and Tesseract.js OCR. No external APIs required.*
