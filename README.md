# ⚡ FitAI X — Intelligent Hypertrophy & Bio-Recovery Platform

> **FitAI X** (FitGuru AI Pro) is a full-stack AI-driven personal training, progressive overload, and bio-recovery optimization application. Powered by **Groq Llama 3.3 70B** multi-key load balancing, **PostgreSQL** data isolation, and a custom **React Native (Expo Router)** dark-mode frontend.

---

## 📐 System Architecture

```
FitAI X Monorepo Root
├── 🔌 backend/                # Express TypeScript REST API Server
│   ├── core/                 # DB Client (PostgreSQL), Security & Groq Key Pool Rotation
│   ├── routes/               # Express API endpoints (/auth, /user, /workout, /recovery, /coach)
│   ├── services/             # AI Decision Engines (Progressive Overload, Recovery, Injury Filter)
│   ├── models/ & schemas/    # TypeScript interfaces & DB SQL schemas
│   └── server.ts             # Entry point (Port 5000)
│
├── 📱 frontend/               # React Native (Expo Router) App
│   ├── app/                  # File-based router screens (index, auth, onboarding, edit-profile, tabs)
│   ├── components/           # UI components, icons, and FitGuru bot widgets
│   ├── services/             # REST API Client (groqService) & AsyncStorage Session Manager
│   └── constants/            # Design tokens & color system (Gold/Dark theme)
│
├── 🧪 tests/                  # Playwright Automated Test Suite
│   ├── api/                  # REST API Integration Tests (Auth, Profile, Workout, Recovery, Coach)
│   ├── e2e/                  # End-to-End Browser UI Tests (Playwright Chrome)
│   └── playwright.config.ts  # Unified Playwright runner config
│
└── 📄 package.json            # Root workspace scripts & orchestration
```

---

## ✨ Key Features

- **⚡ FitGuru AI Engine**: Multi-key round-robin rotation across Groq API keys with automatic local engine fallback for zero-downtime AI generation.
- **🏋️ Dynamic Workout Generator**: Tailors exercises, reps, sets, and rests according to muscle group focus, available equipment, and user injury history.
- **📊 Bio-Recovery Engine**: Calculates daily readiness scores and recommendations based on sleep duration, HRV (Heart Rate Variability), and soreness levels.
- **💬 24/7 AI Coach**: Real-time conversational fitness assistant powered by Llama-3.3-70b-versatile, Mixtral 8x7b, and Gemma 9B options.
- **🔐 Multi-Channel Auth**: Dual support for Google OAuth 2.0 and JWT Email/Password authentication with PostgreSQL session storage.
- **📱 Premium Cross-Platform UI**: Native dark glassmorphic design token system with gold accenting, animated splash screen, and offline-capable AsyncStorage session persistence.

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- **Node.js** (v18.x or higher)
- **npm** (v9.x or higher)
- **PostgreSQL** (v14+ running locally on port 5433 or standard 5432)

---

### Step 1: Clone & Install Dependencies

In the root directory of the project, install dependencies across all services:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install test suite dependencies
cd ../tests
npm install
npx playwright install chromium
```

---

### Step 2: Environment Configuration

Create a `.env` file inside the `backend/` directory:

```env
# Server Port & AI Model
PORT=5000
DEFAULT_MODEL=llama-3.3-70b-versatile

# PostgreSQL Connection String
DATABASE_URL=postgres://postgres:your_password@127.0.0.1:5433/fitaix
PGHOST=127.0.0.1
PGPORT=5433
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=fitaix

# Groq API Keys (Round-robin load balancing pool)
GROQ_API_KEY_1=gsk_your_groq_key_1
GROQ_API_KEY_2=gsk_your_groq_key_2

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

### Step 3: Run Dev Servers

Open two terminal windows from the project root directory:

**Terminal 1 — Start Express TypeScript Backend:**
```bash
npm run start:backend
# Server runs on http://localhost:5000
```

**Terminal 2 — Start React Native Expo Web/App Frontend:**
```bash
npm run start:frontend
# Expo app runs on http://localhost:8081
```

---

## 🧪 Running Automated Tests

The testing suite is located in the top-level `tests/` directory and uses **Playwright**.

### Run All Tests (API + E2E):
```bash
npm run test
```

### Run Backend REST API Tests Only:
Tests all endpoints (`/auth`, `/user/profile`, `/workout/generate`, `/recovery/insights`, `/coach/chat`) directly against port 5000:
```bash
npm run test:api
```

### Run Frontend E2E UI Tests Only:
Tests full end-to-end user flows in headless Chromium against `http://localhost:8081`:
```bash
npm run test:e2e
```

### Run E2E Tests in Interactive Headed Mode:
```bash
npm run test:headed
```

### View Visual HTML Test Report:
```bash
npm run test:report
```

---

## 📦 Production Deployment Guide

### 1. Backend Deployment (Render / Railway / Fly.io / VPS)
1. Build TypeScript:
   ```bash
   cd backend
   npm run build
   ```
2. Set Environment Variables on your hosting provider:
   - `DATABASE_URL` (Managed PostgreSQL URL, e.g., Supabase / Neon / Render Postgres)
   - `GROQ_API_KEY_1`..`4`
   - `PORT` (Provided automatically by host)
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
3. Start command:
   ```bash
   npm start
   ```

### 2. Frontend Web Deployment (Vercel / Netlify)
1. Export static bundle from Expo:
   ```bash
   cd frontend
   npx expo export -p web
   ```
2. Deploy the generated `dist/` directory to Vercel, Netlify, or AWS S3 + CloudFront.

### 3. Mobile Native App Deployment (iOS & Android)
1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Build Android APK/AAB:
   ```bash
   cd frontend
   eas build --platform android --profile production
   ```
3. Build iOS App Store Package:
   ```bash
   cd frontend
   eas build --platform ios --profile production
   ```

---

## 🛠 Tech Stack Summary

| Layer | Technology |
|---|---|
| **Frontend Framework** | React Native (v0.81), Expo (v54), Expo Router (v6) |
| **State & Storage** | AsyncStorage (Native), LocalStorage (Web) |
| **Backend Framework** | Express (v4), TypeScript (v5), tsx |
| **Database** | PostgreSQL (`pg` pool, raw SQL schemas & migrations) |
| **AI Infrastructure** | Groq SDK (Llama 3.3 70B, Mixtral 8x7B, Gemma 9B) |
| **Auth** | JWT, Google OAuth 2.0 |
| **Test Automation** | Playwright (E2E Browser & REST API integration tests) |

---

## 📜 License
MIT License. Created for FitAI X.
