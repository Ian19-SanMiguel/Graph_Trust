GraphTrust E-Commerce Store
1. Prerequisites
Node.js: Must be installed on your system.

PowerShell Permissions: Run this command once in PowerShell (as Administrator) to allow development scripts to run:

PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
2. Running the Application
You must run both the backend and frontend simultaneously in two separate terminal windows.

Terminal 1: Backend (Server)
Shell
cd backend
npm install
npm run dev

Terminal 2: Frontend (UI)
Shell
cd frontend
npm install
npm run dev

Terminal 3: AI Engine (One Command)
PowerShell
./run-ai.ps1

AI graph persistence now defaults to Firestore (database-backed) and no longer silently falls back to local SQLite.
Before starting the AI engine, provide Firebase Admin credentials, for example:

PowerShell
$env:FIREBASE_PROJECT_ID="your-project-id"
$env:FIREBASE_CREDENTIALS_PATH="C:\path\to\service-account.json"

Optional local-only fallback (not recommended for normal app runs):

PowerShell
$env:GRAPH_STORE_BACKEND="sqlite"

If you already installed AI dependencies and only want to start it:
PowerShell
./run-ai.ps1 -NoInstall

Development Credentials[!CAUTION]The following credentials are for local development and testing purposes only. Do not use these in a production environment.

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@gmail.com` | `adminadmin` |
| **User** | `user@gmail.com` | `useruser` |
