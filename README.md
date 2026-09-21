# Play for Impact — Golf Subscription & Impact Platform

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.9-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-v5.1-black.svg)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-cyan.svg)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-blue.svg)](https://supabase.com/)
[![Tests](https://img.shields.io/badge/Tests-77%20Passed-brightgreen.svg)]()

Play for Impact is a full-stack golf subscription platform that combines **golf scoring**, **charity contributions**, **monthly sweepstakes draws**, and **prize distribution**. Golfers track their Stableford rounds, allocate a percentage of their subscription to vetted charities, and automatically enter monthly prize draws funded by platform subscription revenue.

> ⛳ **Live Production URL:** [https://play-for-impact.vercel.app](https://play-for-impact.vercel.app)  
> 📡 **API Base URL:** `https://play-for-impact.vercel.app/api/v1`  
> 🩺 **System Health Check:** [https://play-for-impact.vercel.app/api/health](https://play-for-impact.vercel.app/api/health)  
> 🔑 **Demo Administrator:** `admin@golfdraw.com` / `admin123`

---

## Table of Contents

- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Prerequisites & Environment Configuration](#prerequisites--environment-configuration)
- [Local Quickstart](#local-quickstart)
- [Database Schema & Migrations](#database-schema--migrations)
- [Core Business Logic & Rules](#core-business-logic--rules)
- [Automated Testing](#automated-testing)
- [Production Deployment Guide](#production-deployment-guide)
- [Pre-Deployment Checklist & Security Hardening](#pre-deployment-checklist--security-hardening)
- [API Reference](#api-reference)
- [Default Credentials & Demo Walkthrough](#default-credentials--demo-walkthrough)
- [License](#license)

---

## System Architecture

```
                       ┌─────────────────────────────────────────────────┐
                       │          React 19 SPA (Vite + Tailwind v4)      │
                       │   Dashboard • Scoring • Draws • Admin Portal    │
                       └───────────────────────┬─────────────────────────┘
                                               │ HTTPS / JSON Envelopes
                                               ▼
                       ┌─────────────────────────────────────────────────┐
                       │           Express 5 Application Gateway         │
                       │   Helmet (CORP/CSP) • CORS • Winston Logger     │
                       └───────┬─────────────────────────────────┬───────┘
                               │                                 │
           ┌───────────────────┴──────────┐       ┌──────────────┴──────────────────┐
           │     Routers & Controllers    │       │     Cloud Object Storage        │
           │  JWT Auth • Zod Validators   │       │  Supabase Storage (winner-proofs│
           └───────────────┬──────────────┘       │  via @supabase/supabase-js)     │
                           │                      └─────────────────────────────────┘
           ┌───────────────┴──────────────┐
           │        Service Layer         │
           │  Draw Engine • Prize Pools   │
           │  Rolling 5 Score Eviction    │
           │  Stripe Mock / Live Service  │
           │  Supabase Storage Service    │
           └───────────────┬──────────────┘
                           │
           ┌───────────────┴──────────────┐
           │       Repository Layer       │
           │  PostgreSQL (pg) PoolClient  │
           │  Full Transaction Isolation  │
           └───────────────┬──────────────┘
                           │
                           ▼
           ┌──────────────────────────────┐
           │     Managed PostgreSQL       │
           │   Supabase / Cloud DB        │
           └──────────────────────────────┘
```

### Architectural Principles
- **Separation of Concerns:** `Routers -> Controllers -> Services -> Repositories -> Database`.
- **Database Transactions:** Multi-entity operations (draw publishing, subscription cancellation, rolling score limits) use atomic PostgreSQL transactions (`BEGIN ... COMMIT / ROLLBACK`) with injected `PoolClient` instances.
- **Strict Typing:** End-to-end TypeScript with zero `any` types. Backend query outputs map through typed database row interfaces, and API responses strictly follow a standardized envelope.
- **Cloud Native Storage:** Scorecard verification proofs stream into Supabase Storage with direct public CDN delivery, eliminating server disk persistence issues.
- **Anti-AI-Slop UX:** Designed with custom typography (`DM Serif Display` + `DM Sans`), high-contrast dark forest greens (`#047857`) and gold accents (`#D97706`), accessible skeletons, and clean bento-style cards.

---

## Tech Stack

### Frontend
- **Framework:** React 19 + TypeScript + Vite 8
- **Styling:** Tailwind CSS v4 + `@tailwindcss/vite`
- **Routing:** React Router DOM v7
- **Forms & Validation:** React Hook Form + Zod (`@hookform/resolvers`)
- **Icons & UI:** Lucide React, Sonner (Toasts), clsx, tailwind-merge
- **Testing:** Vitest + React Testing Library + JSDOM

### Backend
- **Runtime & Server:** Node.js 20+ / Express 5 + TypeScript
- **Database Driver:** `pg` (node-postgres) with connection pooling
- **Cloud Storage:** Supabase Storage (`@supabase/supabase-js`)
- **Security & Headers:** Helmet (custom CSP + CORP `cross-origin`), CORS, Compression
- **Authentication:** JWT (`jsonwebtoken`) + Password Hashing (`bcryptjs`)
- **File Uploads:** Multer in-memory streaming (strict MIME whitelist, 5MB max)
- **Validation:** Zod schemas on all request payloads
- **Logging:** Winston + Winston Daily Rotate File (structured JSON + correlation IDs)
- **Testing:** Jest + Supertest + ts-jest

---

## Repository Structure

```
play-for-impact/
├── backend/
│   ├── migrations/                  # 8 SQL migration files
│   │   ├── 001_create_users.sql
│   │   ├── 002_setup_charities.sql
│   │   ├── 003_setup_scores.sql
│   │   ├── 004_setup_subscriptions.sql
│   │   ├── 005_setup_draw_engine.sql
│   │   ├── 006_setup_winner_lifecycle.sql
│   │   ├── 007_setup_donations.sql
│   │   └── 008_setup_admin_policies.sql
│   ├── src/
│   │   ├── config/                  # Server, logger, and env config
│   │   ├── controllers/             # HTTP handlers (envelope formatting)
│   │   ├── middlewares/             # Auth, error handler, correlation ID
│   │   ├── repositories/            # SQL data access & transaction queries
│   │   ├── routers/v1/              # Route definitions & guards
│   │   ├── services/                # Business logic, draw engine, Stripe
│   │   ├── scripts/                 # Migration & DB maintenance scripts
│   │   ├── utils/                   # AppError classes, response helpers
│   │   ├── validators/              # Zod validation schemas
│   │   └── server.ts                # Express app entry & lifecycle hooks
│   ├── uploads/winner-proofs/       # Uploaded winner score card proofs
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/              # Reusable UI (Button, Card, Modal, etc.)
│   │   ├── context/                 # AuthContext (JWT persistence, user state)
│   │   ├── hooks/                   # useAuth, useSubscription
│   │   ├── pages/
│   │   │   ├── public/              # Home, Login, Register, Leaderboard, Charities
│   │   │   ├── onboarding/          # 3-step wizard (Charity -> % -> Plan)
│   │   │   ├── dashboard/           # Overview, Scores, Charity, Draws, Winnings
│   │   │   └── admin/               # Analytics, Users, Charities, Draws, Winners, Settings
│   │   ├── services/                # Axios API client & typed response mappers
│   │   ├── types/                   # Frontend domain models
│   │   ├── utils/                   # Currency, Date, and Classname formatters
│   │   ├── App.tsx                  # Application route tree
│   │   ├── main.tsx                 # React DOM mount point
│   │   └── index.css                # Tailwind v4 theme configuration
│   ├── package.json
│   ├── vite.config.ts               # Vite build config with /uploads dev proxy
│   └── tsconfig.json
├── README.md
└── package.json                     # Root orchestrator scripts
```

---

## Prerequisites & Environment Configuration

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **PostgreSQL**: PostgreSQL 14+ instance (local or hosted via Supabase, Neon, AWS RDS)

### 1. Backend Configuration (`backend/.env`)

Create `backend/.env` based on the template below:

```bash
# Server Port & Environment
PORT=3001
NODE_ENV=development

# PostgreSQL Connection String (Transaction pooler or direct connection)
DATABASE_URL=postgresql://postgres.your-project:your-password@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

# JSON Web Token Secret (Use 64+ char random string in production)
JWT_SECRET=production_grade_random_secret_at_least_32_chars_long
JWT_EXPIRES_IN=7d

# Frontend CORS Origin (Must match production client domain)
FRONTEND_URL=http://localhost:5173

# Stripe Payment Processing (Leave empty for instant Mock Mode)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Supabase Storage (Winner Proofs Bucket)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-secret-key
```

### 2. Frontend Configuration (`frontend/.env`)

Create `frontend/.env`:

```bash
# Backend API Base URL
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

> **Note on Stripe Mock Mode:** When `STRIPE_SECRET_KEY` is omitted, the platform runs in high-fidelity mock mode. Clicking checkout directly updates subscription status in PostgreSQL without external API calls, allowing full testing of the onboarding and draw flow.

---

## Local Quickstart

### 1. Install All Dependencies
From the repository root:
```bash
npm run install:all
```

### 2. Run Database Migrations
Executes all 8 raw SQL migration files in sequence:
```bash
npm run migrate
```
*(Or from the backend directory: `cd backend && npm run migrate`)*

### 3. Start Development Servers
Runs backend (Nodemon on port `3001`) and frontend (Vite on port `5173`) in parallel:
```bash
npm run dev
```

- **Frontend Application:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3001/api/v1](http://localhost:3001/api/v1)
- **Health Check:** [http://localhost:3001/health](http://localhost:3001/health)

---

## Database Schema & Migrations

The database consists of 8 core relational entities:

1. **`users`**: Accounts, role (`user` / `admin`), subscription status (`inactive`, `active`, `cancelled`, `expired`), onboarding state, and selected charity preferences.
2. **`charities`**: Vetted beneficiary organizations, total funds raised, mission details, and active status.
3. **`scores`**: Stableford scores (1–45) per player, course name, date played. Enforced rolling 5 limit per user.
4. **`subscriptions`**: Payment tracking, Stripe customer/subscription IDs, plan tier (`basic`, `premium`, `vip`), amount, and renewal dates.
5. **`draws`**: Monthly draw events, winning 5 numbers (`INTEGER[]`), allocated prize pool, jackpot rollover, and status (`pending`, `active`, `completed`).
6. **`draw_entries`**: User entries matched against winning numbers, match count (0–5), awarded prize amount, and lifecycle status (`pending`, `approved`, `rejected`, `paid`, `ineligible`).
7. **`winner_proofs`**: Scorecard verification images submitted by winning users, verification timestamps, and rejection rationale.
8. **`donations`**: Automatic donation records linking winning draw entries to user-chosen charities.
9. **`platform_settings`**: Dynamic runtime settings (prize tier shares, rollover toggles, minimum charity percentage).

---

## Core Business Logic & Rules

### 1. Rolling 5-Score Rule
- A player enters individual rounds with Stableford points between **1 and 45**.
- Only one score can be submitted per calendar date.
- Players can maintain a maximum of **5 active scores**. When submitting a 6th score, an atomic transaction automatically evicts the oldest score to maintain a 5-round qualifying profile.

### 2. Draw Simulation & Match Engine
- Monthly draws generate 5 winning numbers (range 1–45) via either **Pure Random** or **Frequency-Weighted** algorithms (weights numbers based on recent user score trends).
- Matching compares the player's 5 qualifying scores against the 5 winning numbers:
  - **5 Matches (Jackpot / Tier 1):** 40% of prize pool (if no winner, rolls over to next draw).
  - **4 Matches (Tier 2):** 35% of prize pool split equally among winners.
  - **3 Matches (Tier 3):** 25% of prize pool split equally among winners.

### 3. Automated Charity Donations
- Players specify a charity donation percentage during onboarding (minimum 10%).
- Upon draw publication, donation records are automatically created for all winning entries, transferring the player's designated percentage directly to their chosen charity.

### 4. Winner Proof Lifecycle
- Winning players with 3+ matches submit a photo of their physical or digital scorecard proof (JPEG/PNG up to 5MB).
- Administrators review proofs in the Admin Portal:
  - **Approve:** Authorizes payout.
  - **Reject:** Requires a documented rejection reason shown to the player.
  - **Mark Paid:** Finalizes payout completion.

---

## Automated Testing

The codebase includes full test suites for both backend and frontend.

### Running Backend Tests (Jest)
Runs unit, integration, and repository transaction tests with coverage:
```bash
cd backend
npm test
```
**Results:** **57 tests passing** across 6 test suites (`auth.test.ts`, `scores.test.ts`, `charities.test.ts`, `draws.test.ts`, `repositories.test.ts`, `middleware.test.ts`).

### Running Frontend Tests (Vitest)
Runs component and utility tests using Vitest and React Testing Library:
```bash
cd frontend
npm test
```
**Results:** **20 tests passing** across 3 test suites (`ScoreTable.test.tsx`, `api-mapping.test.ts`, `utils.test.ts`).

### Root Test Runner
Run both suites with one command:
```bash
npm test
```

---

## Production Deployment Guide

### Option 1: Vercel Multi-Services (Current Production Setup)

The platform is deployed as a **Vercel Multi-Service monorepo**, unifying both the Vite SPA and Express API under a single origin (`https://play-for-impact.vercel.app`):

- **Orchestrator:** Root [`vercel.json`](vercel.json) routes `/api(/.*)?` to the backend and all other paths to the frontend.
- **Root Directory:** `./`
- **Frontend Service:** Vite React SPA with client-side SPA fallback.
- **Backend Service:** Node.js Express serverless service (`entrypoint: src/server.ts`).
- **Zero CORS:** Both tiers share the same host domain, eliminating cross-origin preflight requests and CORS errors.

#### Environment Variables Configured in Vercel:
```bash
DATABASE_URL=postgresql://...aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
JWT_SECRET=play-for-impact-jwt-secret-key-2026
JWT_EXPIRES_IN=7d
SUPABASE_URL=https://deozafdqjatqizngrzwt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
STRIPE_SECRET_KEY=sk_test_...
NODE_ENV=production
VITE_API_BASE_URL=/api/v1
```

---

### Option 2: Linux Server / VPS (Ubuntu, EC2, DigitalOcean)

#### 1. Backend Process Management (PM2)
```bash
cd backend
npm ci
npm run build
npm run migrate:prod

# Start application process with auto-restart
pm2 start dist/server.js --name "play-for-impact-api"
pm2 save
pm2 startup
```

#### 2. Frontend Build & Static Serving
```bash
cd frontend
npm ci
npm run build
# The production assets in frontend/dist/ can be served via Nginx, Caddy, or Apache.
```

---

## Pre-Deployment Checklist & Security Hardening

Before taking this application live in production, ensure the following steps are completed:

- [ ] **Rotate JWT Secret**: Generate a cryptographically strong 64-character secret using `openssl rand -base64 48`. Never use local/default secrets.
- [ ] **Lock Down CORS & CORP**:
  - Verify `FRONTEND_URL` in `backend/.env` is set to the exact production HTTPS domain (e.g. `https://playforimpact.com`).
  - Verify Helmet `Cross-Origin-Resource-Policy` is set to `{ policy: 'cross-origin' }` so image proofs load reliably across domains.
- [ ] **Change Default Admin Password**:
  - Immediately update the password for seeded admin account `admin@golfdraw.com` via the database or password reset utility.
- [x] **Supabase Storage Bucket**:
  - `winner-proofs` bucket configured with public read access; images stream directly to Supabase CDN without local server disk dependency.
- [ ] **Database Connection Pooling**:
  - For serverless or high-concurrency environments, connect via Supabase Transaction Pooler (`port 6543`) with `pg` pool settings tuned (`max: 20`, `idleTimeoutMillis: 30000`).
- [ ] **Enable Live Stripe Keys**:
  - Replace mock placeholders with live `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
  - Configure the Stripe webhook endpoint to point to `https://api.yourdomain.com/api/v1/payments/webhook`.
- [ ] **Enable HTTPS / SSL**:
  - Enforce TLS 1.3 at the reverse proxy or CDN level (Cloudflare / CloudFront).
- [ ] **Monitoring & Health Checks**:
  - Configure uptime monitoring on `/health` (returns `{"status":"ok"}`).
  - Set up log aggregation for daily rotating logs in `backend/logs/`.

---

## API Reference

All endpoints return a standardized JSON envelope:

```json
// Success Response (HTTP 200/201)
{
  "success": true,
  "data": { ... }
}

// Error Response (HTTP 4xx/5xx)
{
  "success": false,
  "error": "Human-readable error description"
}
```

### Primary Endpoints Overview

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register new user account |
| `POST` | `/api/v1/auth/login` | Public | Login and receive signed JWT |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieve authenticated user profile |
| `GET` | `/api/v1/scores` | Authenticated | Get player's active Stableford rounds |
| `POST` | `/api/v1/scores` | Authenticated | Submit round (enforces rolling 5 limit) |
| `PUT` | `/api/v1/scores/:id` | Authenticated | Update existing scorecard round |
| `DELETE` | `/api/v1/scores/:id` | Authenticated | Remove scorecard round |
| `GET` | `/api/v1/charities` | Public | List all active vetted charities |
| `PUT` | `/api/v1/charities/select` | Authenticated | Lock in charity choice and contribution % |
| `GET` | `/api/v1/draws` | Public | List monthly draws (pending & completed) |
| `GET` | `/api/v1/draws/my` | Authenticated | Get player's personal draw match history |
| `POST` | `/api/v1/payments/create-checkout-session` | Authenticated | Initiate subscription checkout session |
| `GET` | `/api/v1/winners/me` | Authenticated | Retrieve user prize winnings |
| `POST` | `/api/v1/winners/:id/upload-proof` | Authenticated | Upload JPEG/PNG scorecard proof |
| `GET` | `/api/v1/admin/analytics` | Admin | Aggregate platform statistics and KPIs |
| `POST` | `/api/v1/draws/create` | Admin | Create upcoming monthly draw |
| `POST` | `/api/v1/draws/:id/simulate` | Admin | Simulate draw numbers (Random / Weighted) |
| `POST` | `/api/v1/draws/:id/publish` | Admin | Publish results, award prizes, trigger donations |
| `POST` | `/api/v1/winners/:id/approve` | Admin | Approve winner scorecard proof |
| `POST` | `/api/v1/winners/:id/reject` | Admin | Reject winner scorecard proof with reason |
| `PUT` | `/api/v1/admin/settings` | Admin | Update prize pool percentages and rollover toggles |

---

## Default Credentials & Demo Walkthrough

### Default Seeded Administrator
- **Email:** `admin@golfdraw.com`
- **Password:** `admin123`
*(Change immediately upon production deployment)*

### Demo Walkthrough Steps
1. **Register a Player Account:** Visit `/register` and create a user.
2. **Onboarding Flow:**
   - Step 1: Select a beneficiary charity (e.g. *Youth Golf Foundation*).
   - Step 2: Set contribution percentage (10% to 50%).
   - Step 3: Choose subscription tier (*Basic*, *Eagle Circle*, or *Champions Guild*).
3. **Log Rounds:** Navigate to `/dashboard/scores` and log 5 scores between 1 and 45.
4. **Admin Draw Simulation:**
   - Log in as `admin@golfdraw.com`.
   - Go to `/admin/draws`, create a new draw, run simulation, and click **Publish Draw**.
5. **Verify Winnings & Proof Upload:**
   - Return to user `/dashboard/winnings` to view matched scores.
   - Upload proof photo and observe administrative approval workflow at `/admin/winners`.

---

## License

Copyright © 2026 Play for Impact. All rights reserved. Private repository.
