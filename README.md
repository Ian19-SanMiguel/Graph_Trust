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