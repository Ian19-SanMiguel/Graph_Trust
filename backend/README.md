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

3. AI Engine (Required for AI trust scoring)
Run this in a third terminal:

PowerShell
./run-ai.ps1

If dependencies are already installed and you only want to start the AI engine:

PowerShell
./run-ai.ps1 -NoInstall

4. AI Health Check
From backend, verify AI engine connectivity:

GET /api/dev/ai-health

If this returns success, backend can call the AI trust endpoint.

5. Optional strict AI-only trust mode
Set this in backend `.env` to disable fallback trust updates:

REQUIRE_AI_TRUST=true

When enabled, reviews still save but response includes `trustUpdated: false` and `trustSource: "none"` if AI is unavailable.

Development Credentials[!CAUTION]The following credentials are for local development and testing purposes only. Do not use these in a production environment.

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@gmail.com` | `adminadmin` |
| **User** | `user@gmail.com` | `useruser` |
