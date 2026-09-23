# MediCare+ — Hospital Management System

A full-stack Hospital Management System with role-based dashboards, appointment
booking, prescriptions, billing, medical records, and a built-in AI assistant.

**Stack:** React + Vite + Tailwind CSS (frontend) · Node.js + Express + SQLite
via Node's built-in `node:sqlite` module (backend) · JWT authentication with
role-based access control.

> **Node version:** requires Node **22.5+** (tested on Node 24). The backend
> uses Node's built-in SQLite support instead of a native npm package, so
> there's nothing to compile — `npm install` should just work on any modern
> Node version, Windows included, with no Visual Studio Build Tools needed.

## Features

- **Public website** — professional landing page, doctor listings, login/register
- **Auth** — JWT-based login, patient self-registration, staff accounts created by admin
- **Role-based dashboards** — Admin, Doctor, Receptionist, Patient, each with its own view and permissions
- **Patients** — profiles, medical history fields, staff CRUD
- **Doctors** — specializations, schedules, fees; admin-managed
- **Appointments** — booking, status workflow (pending → confirmed → completed/cancelled)
- **Prescriptions** — structured medicines list + instructions, written by doctors
- **Billing** — itemized bills, payment status, "mark as paid" flow
- **Medical Records** — diagnosis, symptoms, treatment, vitals, restricted to clinical staff + the owning patient
- **AI Assistant** — floating chat widget for booking help, billing/prescription questions, and basic symptom-to-department triage. Works out of the box with a free rule-based engine; optionally upgrades to Claude if you provide an API key (see below).

## Project structure

```
hospital-management-system/
  backend/            Express API + SQLite database
    db/               schema.sql, database.js, seed.js
    middleware/        auth.js (JWT + role guard)
    routes/            auth, patients, doctors, appointments,
                        prescriptions, billing, records, assistant,
                        dashboard, users
    server.js
  frontend/           React + Vite + Tailwind SPA
    src/
      api/            axios client
      context/        AuthContext
      components/     AppLayout, ProtectedRoute, AIAssistantWidget, ui.jsx
      pages/          Landing, Login, Register, Dashboard, Patients,
                       Doctors, Appointments, Prescriptions, Billing,
                       MedicalRecords, Staff
```

## Getting started

### Option A — run both servers with one command (recommended)

From the project root (the folder containing this README):

```bash
npm run install:all   # installs backend + frontend dependencies
npm run seed           # creates demo admin/doctor/receptionist/patient accounts
npm run dev             # starts BOTH the backend (:5000) and frontend (:5173)
```

You'll see color-coded output from both servers in the same terminal
(`BACKEND` in blue, `FRONTEND` in green). Once you see the frontend's
`Local: http://localhost:5173/` line, open that URL in your browser.
Press `Ctrl+C` once to stop both servers together.

Don't forget to copy the backend's env file first (only needed once):
```bash
copy backend\.env.example backend\.env        # Windows (PowerShell/cmd)
cp backend/.env.example backend/.env          # macOS/Linux
```

### Option B — run them separately (two terminals)

Useful if you want to see each server's logs on its own, or restart one
without the other.

#### 1. Backend

```bash
cd backend
cp .env.example .env      # edit JWT_SECRET to something random & long
npm install
npm run seed               # creates demo admin/doctor/receptionist/patient accounts
npm run dev                 # starts the API on http://localhost:5000
```

#### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev                 # starts the app on http://localhost:5173
```

The Vite dev server proxies `/api` to `http://localhost:5000`, so just open
`http://localhost:5173`.

### Demo logins (after `npm run seed`)

| Role         | Email                  | Password       |
|--------------|-------------------------|----------------|
| Admin        | admin@hms.com           | Admin@123      |
| Doctor       | ananya.roy@hms.com      | Doctor@123     |
| Receptionist | reception@hms.com       | Reception@123  |
| Patient      | patient@hms.com         | Patient@123    |

## Enabling the Claude-powered AI assistant (optional)

By default the assistant uses a free, zero-config rule-based engine
(`backend/routes/assistant.js`) that handles common FAQs and basic
symptom-to-department triage.

To upgrade it to a real LLM conversation:

1. Get an API key from the Anthropic Console.
2. Add it to `backend/.env`:
   ```
   ANTHROPIC_API_KEY=your_key_here
   ```
3. Restart the backend. The assistant will automatically route messages
   through Claude and fall back to the rule-based engine if the API call
   ever fails.

## Deployment notes

- Swap `better-sqlite3` for PostgreSQL/MySQL if you need multi-instance
  deployment; the query layer is plain SQL and easy to port.
- Set a strong, unique `JWT_SECRET` in production and serve the API over HTTPS.
- Build the frontend for production with `npm run build` inside `frontend/`
  and serve the `dist/` folder from any static host (or from Express itself).
- This demo stores plaintext-adjacent data (bcrypt-hashed passwords only) in
  a local SQLite file — add proper encryption-at-rest and audit logging
  before handling real patient data (HIPAA/GDPR compliance is out of scope
  for this starter).

## License

Built as a portfolio project. Free to use and modify.
