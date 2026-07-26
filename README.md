<div align="center">

# 🎓 Connecting Future

### Exclusive Alumni–Student Mentorship & Networking Platform

A verified, secure, university-only network that bridges the guidance gap between students and alumni through real-time mentorship, AI-generated career roadmaps, encrypted messaging, a moderated job/event board, and transparent donations.

![Next.js](https://img.shields.io/badge/Next.js-15.5.3-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5.17-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Auth0](https://img.shields.io/badge/Auth-Auth0-EB5424?style=for-the-badge&logo=auth0&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)

</div>

---

## 📖 Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Overview](#api-overview)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Roles & Permissions](#roles--permissions)
- [Security](#security)
- [Project Stats](#project-stats)
- [Roadmap / Future Scope](#roadmap--future-scope)
- [Author](#author)
- [License](#license)

---

<a id="overview"></a>
## 🧭 Overview

**Connecting Future** is a full-stack web platform designed for university students who struggle with placement preparation, career direction, and connecting with experienced seniors. It replaces fragmented, unverified channels — cold LinkedIn outreach, noisy unmoderated WhatsApp/Telegram groups, and opaque manual donation systems — with a single, closed-loop, university-verified network.

The platform combines:
- **Academic progress tracking** (semester-wise GPA/course tracking)
- **AI-generated learning roadmaps and quizzes** (Google Gemini)
- **Encrypted 1:1 messaging** (AES-256-GCM)
- **Structured mentorship & resume review workflows**
- **A moderated job and event board** (including aggregated external listings)
- **Secure donation processing** (Razorpay)
- **A dedicated admin panel** for platform-wide moderation and governance

---

<a id="problem-statement"></a>
## ❗ Problem Statement

| Pain Point | Description |
|---|---|
| **Cold Outreach Friction** | Students reaching out to alumni on LinkedIn face very low response rates — alumni can't easily verify affiliation and messages get lost in the noise. |
| **Lack of Moderation & Trust** | WhatsApp/Telegram alumni groups are unmoderated — spam, irrelevant posts, and zero engagement tracking. |
| **Referral & Donation Opacity** | Job referrals are handled informally over email with no status updates; university donations lack digital transparency, making alumni hesitant to contribute. |

**Who feels this most:** Third- and fourth-year students preparing for placements, and alumni looking for a structured way to give back.

**Existing alternatives fall short:**
- **LinkedIn** — generic, saturated, no academic integration, no structured mentorship requests.
- **Almabase** — expensive, institution-facing, fundraising-only.
- **WhatsApp/Telegram groups** — zero privacy, unstructured, no moderation.

---

<a id="key-features"></a>
## ✨ Key Features

### 🔐 Role-Based Authentication
- Auth0-backed login (OAuth2/OIDC) with **3 distinct roles**: Student, Alumni, Admin.
- JWT verification via `express-jwt` + `jwks-rsa`.
- Alumni require **admin approval** before gaining platform access.

### 📊 Academic Progress Tracker
- Semester-wise course and grade entry.
- Automatic GPA computation and progress visualization.

### 🤖 AI-Powered Career Roadmaps
- Admin-triggered roadmap generation using **Google Gemini (`gemini-flash-latest`)**.
- Milestone-based structure with progress tracking and a "follow roadmap" mechanic.
- **Dynamic AI-generated MCQ quizzes** per milestone to validate student understanding before progressing.

### 🤝 Mentorship & Resume Review
- End-to-end mentorship request lifecycle: **request → accept/reject → schedule → complete → rate**.
- Session purchasing/subscription support.
- Dedicated resume upload + alumni feedback loop, independent of general chat.

### 💬 Encrypted Messaging
- **AES-256-GCM** encryption at rest using Node's native `crypto` module.
- Ciphertext, IV, and auth tag stored separately — **no plaintext message ever persisted**.
- Threaded conversations with read-receipt tracking.

### 💼 Jobs & Events Board
- Alumni/Admins can post jobs and organize virtual or physical events.
- All submissions go through an **admin approval workflow** before publishing.
- **External Job Aggregation** via the RapidAPI **JSearch** API, with click/application analytics.
- Application and view tracking per listing.

### 💳 Razorpay Donation Integration
- Category-based donations (Education, Infrastructure, Research, etc.).
- Signature verification, transaction-status tracking, and automated receipt generation.
- Full donation analytics summary endpoint.

### 🛡️ Admin Control Panel
- Centralized dashboard: pending approvals, active jobs, upcoming events, new registrations.
- Alumni approval queue with search/filter (by name, email, major, status).
- Job & event management (approve/reject/edit/delete).
- Platform settings (auto-approve toggles, job visibility rules).
- User management and mentorship payment/payout tracking.

### 📰 Real-Time Social Feed ("Memories")
- Post creation with likes, comments, shares, and view tracking.
- **Server-Sent Events (SSE)** stream for live feed updates without polling.
- Tag-based notifications ("mentioned you") with read/unread state.

### 🔔 Notifications System
- Typed notifications (approval, rejection, new_job, new_event, message).
- Action URLs for one-click navigation to the relevant resource.

### 🏆 Leaderboard
- Alumni engagement leaderboard.
- Student resource/leaderboard tracking.

### 📁 Secure File Handling
- **Cloudinary**-backed storage for resumes, event banners, chat attachments, and profile images.
- Multer-based multipart upload handling, fully decoupled from the app server.

---

<a id="tech-stack"></a>
## 🛠️ Tech Stack

### Frontend
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Radix UI](https://img.shields.io/badge/Radix_UI-161618?style=flat&logo=radixui&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=flat&logo=shadcnui&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat&logo=framer&logoColor=white)
![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?style=flat&logo=reacthookform&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat&logo=zod&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-22B5BF?style=flat)
![Lucide](https://img.shields.io/badge/Lucide_Icons-F56565?style=flat&logo=lucide&logoColor=white)

| Layer | Technology |
|---|---|
| Framework | **Next.js 15** (App Router, TypeScript) |
| UI Library | **React 18** |
| Styling | **Tailwind CSS**, `tailwindcss-animate`, `tailwind-merge` |
| Component System | **shadcn/ui**, Radix UI primitives, `class-variance-authority` |
| Animation | **Framer Motion** |
| Forms & Validation | `react-hook-form`, `@hookform/resolvers`, **Zod** |
| Data Visualization | **Recharts** |
| Icons | `lucide-react` |
| Notifications/UI Utils | Sonner, react-hot-toast, vaul, embla-carousel-react, cmdk, input-otp, react-day-picker |
| PDF/Canvas Export | jspdf, html2canvas |
| Auth (client) | `@auth0/auth0-react`, `@auth0/nextjs-auth0` |
| Theming | `next-themes` |

### Backend
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Auth0](https://img.shields.io/badge/Auth0-EB5424?style=flat&logo=auth0&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=flat&logo=googlegemini&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=flat&logo=cloudinary&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-0C2451?style=flat&logo=razorpay&logoColor=white)
![Nodemailer](https://img.shields.io/badge/Nodemailer-22B573?style=flat)

| Layer | Technology |
|---|---|
| Runtime | **Node.js** |
| Framework | **Express.js** |
| ORM | **Prisma** (`@prisma/client`) |
| Database | **PostgreSQL** (hosted on **Neon**, serverless) |
| Authentication | **Auth0**, `express-jwt`, `jwks-rsa` (JWT/JWKS verification) |
| AI | `@google/generative-ai` — **Gemini (`gemini-flash-latest`)** |
| File Storage | **Cloudinary** SDK |
| File Uploads | **Multer** |
| Payments | **Razorpay** SDK |
| Email | **Nodemailer** |
| Encryption | Node.js native `crypto` — **AES-256-GCM** |
| Utilities | cors, dotenv |

### Database
**PostgreSQL** (Neon, serverless) with **Prisma ORM**. Core models: `users`, `messages`, `donations`, `job_postings`, `events`, `notifications` — plus domain-specific tables for roadmaps, mentorship, resume reviews, academic progress, connections, memories, applications, external jobs, and site settings.

### Third-Party Services / APIs
| Service | Purpose |
|---|---|
| **Auth0** | Authentication, RBAC, JWT/JWKS validation |
| **Google Gemini API** | AI roadmap generation & quiz generation |
| **Cloudinary** | Media/file storage & delivery |
| **Razorpay** | Payment gateway for donations |
| **RapidAPI (JSearch)** | External job listing aggregation |

### Hosting / Deployment
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=flat&logo=render&logoColor=white)
![Neon](https://img.shields.io/badge/Neon-00E599?style=flat&logo=neon&logoColor=white)

| Component | Platform |
|---|---|
| Frontend | **Vercel** |
| Backend API | **Render** |
| Database | **Neon** (PostgreSQL) |

---

<a id="system-architecture"></a>
## 🏗️ System Architecture

```mermaid
graph TB
    A["👤 User / Browser"]

    subgraph FE["Frontend — Vercel"]
        B["Next.js 15 App Router"]
        B1["React 18 + TypeScript"]
        B2["Tailwind CSS + shadcn/ui"]
        B --> B1 --> B2
    end

    subgraph ID["Identity Provider"]
        C["Auth0<br/>OAuth2 / OIDC"]
    end

    subgraph BE["Backend API — Render"]
        D["Express.js Server"]
        D1["express-jwt + jwks-rsa<br/>JWT / JWKS Verification"]
        D2["122+ REST Endpoints<br/>(14 domain modules)"]
        D3["AES-256-GCM<br/>Message Encryption"]
        D4["Server-Sent Events<br/>(Live Feed Stream)"]
        D --> D1 --> D2
        D2 --> D3
        D2 --> D4
    end

    E["Prisma ORM"]

    subgraph DB["Database — Neon"]
        F[("PostgreSQL")]
    end

    subgraph EXT["External Services"]
        G["Cloudinary<br/>File / Image Storage"]
        H["Razorpay<br/>Payment Gateway"]
        I["Google Gemini API<br/>AI Roadmaps & Quizzes"]
        J["RapidAPI JSearch<br/>External Job Listings"]
    end

    A -->|"HTTPS"| B
    B -->|"Login redirect"| C
    C -->|"JWT (id/access token)"| B
    B -->|"REST call + Bearer JWT"| D
    D2 -->|"Prisma Client"| E
    E -->|"SQL queries"| F
    D2 -->|"Upload / Delete media"| G
    D2 -->|"Create order / Verify signature"| H
    D2 -->|"Generate roadmap / quiz"| I
    D2 -->|"Fetch external listings"| J
    D4 -->|"text/event-stream"| B
```

**Request flow example (Mentorship Request):**
`Student UI → Express /api/mentorship/request → JWT verified → Prisma write → PostgreSQL → Notification row created → Alumni UI polls/streams update`

---

<a id="project-structure"></a>
## 📂 Project Structure

```
CONNECTINGFUTURE/
├── backend/
│   ├── server.js                 # Main Express app (~5,900 lines, 122+ endpoints)
│   ├── prisma/
│   │   └── schema.prisma         # Prisma schema (Postgres/Neon)
│   ├── database/                 # Domain-specific data-access modules
│   │   ├── academicProgress.js
│   │   ├── applications.js
│   │   ├── connections.js
│   │   ├── donations.js
│   │   ├── events.js
│   │   ├── externalJobs.js
│   │   ├── jobs.js
│   │   ├── memories.js
│   │   ├── mentorship.js
│   │   ├── messages.js
│   │   ├── resumeReviews.js
│   │   ├── roadmaps.js
│   │   └── siteSettings.js
│   ├── services/
│   │   └── cloudinaryService.js  # Cloudinary upload/delete helpers
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/                  # Next.js App Router (48 route pages)
│   │   │   ├── admin/            # Admin dashboard, approvals, jobs, events, users, settings, reports
│   │   │   ├── alumni/           # Alumni dashboard, mentorship, roadmap, earnings, donations, network
│   │   │   ├── student/          # Student dashboard, mentorship requests, resume review, academic progress
│   │   │   ├── login/ · registration/ · student-registration/ · post-login/
│   │   │   └── api/              # Next.js API routes (payment webhooks, user proxy, etc.)
│   │   ├── components/
│   │   │   ├── ui/               # 51 shadcn/ui-based reusable components
│   │   │   ├── alumni/
│   │   │   └── payment/
│   │   ├── contexts/             # ProfileGate and other React contexts
│   │   ├── hooks/                # useAuth0Token, useAnimatedCounter, useIntersectionObserver, etc.
│   │   └── lib/                  # apiClient, utils
│   ├── pages/api/auth/           # Auth0 SDK routes ([...auth0].ts, token.js)
│   └── package.json
│
├── API_DOCUMENTATION.md          # Full endpoint reference
├── ADMIN_PANEL_SUMMARY.md        # Admin panel implementation notes
├── DEPLOYMENT_GUIDE.md           # Step-by-step production deployment guide
├── PRODUCT_VISION_DOCUMENT.md    # Vision, personas, phased roadmap
└── CLOUDINARY_UPLOAD_FLOW_FIX.md
```

---

<a id="database-schema"></a>
## 🗄️ Database Schema

**Core Prisma models:**

```prisma
model users {
  auth0_id, email, name, user_type, role, approval_status,
  graduation_year, major, current_job, company, skills, is_mentor, ...
}

model messages {
  thread_key, sender_email, receiver_email, iv, auth_tag, ciphertext, read_at
}

model donations {
  donor_name, donor_email, amount, currency, payment_method,
  razorpay_order_id, razorpay_payment_id, razorpay_signature,
  transaction_status, cause_category, receipt_sent
}

model job_postings {
  title, company, job_type, experience_level, approval_status,
  posted_by_email, is_active, expires_at
}

model events {
  title, event_type, is_virtual, virtual_link, start_date, end_date,
  approval_status, max_attendees
}

model notifications {
  user_email, notification_type, title, related_id, related_type, is_read
}
```

Additional domain tables (managed via dedicated modules): `roadmaps` & milestones, `mentorship` requests/sessions/ratings, `resume_reviews`, `academic_progress` (semesters/courses), `connections`, `memories` (feed posts/comments/likes), `applications`, `external_jobs` cache, `site_settings`.

All tables are indexed on their primary lookup columns (e.g., `auth0_id`, `email`, `approval_status`, `created_at`) for query performance at scale.

---

<a id="api-overview"></a>
## 🔌 API Overview

The backend exposes **122+ REST endpoints** grouped into the following domains (see `API_DOCUMENTATION.md` for the full reference):

| Domain | Example Endpoints |
|---|---|
| **Auth & Users** | `GET /api/users`, `PUT /api/users/profile`, `POST /api/users/sync-self` |
| **Academic Progress** | `GET/POST /api/academic/semesters`, `GET/POST /api/academic/courses` |
| **Roadmaps & Quizzes** | `POST /api/admin/roadmaps/generate`, `POST /api/roadmaps/:id/milestones/:order/quiz/generate` |
| **Mentorship** | `POST /api/mentorship/request`, `POST /api/mentorship/sessions/schedule`, `POST /api/mentorship/ratings` |
| **Resume Reviews** | `POST /api/resume-reviews/request`, `POST /api/resume-reviews/:id/submit-feedback` |
| **Messaging** | `GET /api/messages/threads`, `POST /api/messages` |
| **Connections** | `POST /api/connections/request`, `POST /api/connections/respond` |
| **Jobs & Applications** | `GET /api/jobs`, `POST /api/jobs/:id/apply`, `GET /api/jobs/external` |
| **Events** | `POST /api/events`, `POST /api/events/:id/register` |
| **Donations** | `POST /api/donations`, `GET /api/donations/analytics/summary` |
| **Memories (Feed)** | `POST /api/memories`, `GET /api/memories/stream` (SSE), `POST /api/memories/:id/like` |
| **Admin** | `PUT /api/admin/users/:id/approval`, `PUT /api/admin/settings/jobs` |
| **File Uploads** | `POST /api/uploads/resume`, `POST /api/uploads/event-image` |

Authentication: protected routes require `Authorization: Bearer <JWT>` validated against Auth0's JWKS endpoint via `checkJwt` middleware.

---

<a id="getting-started"></a>
## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- npm or pnpm
- A PostgreSQL database (Neon recommended)
- Auth0 tenant + application
- Cloudinary account
- Razorpay account
- Google Gemini API key
- RapidAPI JSearch key

### 1. Clone the repository
```bash
git clone https://github.com/vijayyadav2212/CONNECTINGFUTURE.git
cd CONNECTINGFUTURE
```

### 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env      # fill in real credentials
npm run prisma:generate
npm run prisma:push
npm run dev                # starts on http://localhost:4000
```

### 3. Frontend setup
```bash
cd frontend
npm install
cp .env.example .env.local # fill in real credentials
npm run dev                # starts on http://localhost:3000
```

---

<a id="environment-variables"></a>
## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://<user>:<password>@<neon-host>/neondb?sslmode=require
PORT=4000
NODE_ENV=production

# Auth0
AUTH0_DOMAIN=
AUTH0_AUDIENCE=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
AUTH0_MGMT_CLIENT_ID=
AUTH0_MGMT_CLIENT_SECRET=

# Encryption (32-char key for AES-256-GCM)
ENCRYPTION_KEY=

# Gemini AI
GEMINI_API_KEY=

# Cloudinary
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# External Jobs (RapidAPI JSearch)
RAPIDAPI_JSEARCH_KEY=
RAPIDAPI_JSEARCH_HOST=jsearch.p.rapidapi.com
JOBS_CACHE_TTL_MINUTES=15
JOBS_RATE_LIMIT_WINDOW_MS=60000
JOBS_RATE_LIMIT_MAX=30
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_AUTH0_AUDIENCE=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
NEXT_PUBLIC_ADMIN_EMAILS=
NEXT_PUBLIC_STUDENT_EMAILS=
NEXT_PUBLIC_STUDENT_EMAIL_DOMAINS=
```

> ⚠️ **Never commit `.env` files.** This repo's `.gitignore` already excludes `.env`, `.env.local`, and `uploads/` — keep it that way, and rotate any key that has ever been committed or shared.

---

<a id="deployment"></a>
## ☁️ Deployment

| Component | Platform | Notes |
|---|---|---|
| Database | **Neon** | Serverless Postgres, connection pooling enabled |
| Backend | **Render** | Root dir `backend`, build: `npm install && npm run prisma:generate`, start: `npm start` |
| Frontend | **Vercel** | Root dir `frontend`, auto-detects Next.js |

Full step-by-step instructions (Auth0 callback URLs, Razorpay webhook setup, Cloudinary config, Prisma migration commands) are documented in [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md).

---

<a id="roles--permissions"></a>
## 👥 Roles & Permissions

| Role | Access |
|---|---|
| **Student** | Academic tracker, roadmaps, mentorship requests, resume review, messaging, job board, events |
| **Alumni** | All student-facing features (as mentor) + job/event posting, earnings, donation history — **requires admin approval** to activate |
| **Admin** | Full moderation: approve/reject alumni, jobs, events; manage users; view platform analytics; configure site settings |

---

<a id="security"></a>
## 🛡️ Security

- **RBAC** enforced at both route-middleware and UI levels.
- **JWT validation** via Auth0 JWKS (`express-jwt` + `jwks-rsa`) — no self-issued tokens.
- **AES-256-GCM encryption at rest** for all private messages (ciphertext + IV + auth tag stored separately; decrypted only server-side per request).
- **Payment signature verification** for all Razorpay transactions before marking donations as completed.
- **Approval-gated onboarding** — alumni cannot access the platform until an admin approves their profile.
- **Input validation** via Zod (frontend) and parameterized queries via Prisma (backend) to prevent injection.
- Secrets are environment-based and excluded from version control via `.gitignore`.

---

<a id="project-stats"></a>
## 📊 Project Stats

| Metric | Value |
|---|---|
| REST API endpoints | **122+** |
| Backend data-access modules | **14** |
| Frontend App Router pages | **48** |
| Total TypeScript/TSX files | **141** |
| Reusable UI components | **51** |
| Core Prisma models | **6 primary + 9 domain tables** |
| Third-party integrations | **5** (Auth0, Gemini, Cloudinary, Razorpay, RapidAPI) |
| Backend server size | **~5,900 lines** (`server.js`) |

---

<a id="roadmap--future-scope"></a>
## 🗺️ Roadmap / Future Scope

- [x] Real-time WebSocket notifications (replacing/augmenting SSE)
- [x] Integrated video mentorship sessions
- [x] AI-based mentor-matching (skills/course/major similarity)
- [x] Automated analytics/reporting dashboard for admins
- [ ] Mobile app (React Native)

---

<a id="author"></a>
## 👨‍💻 Author - Vijay Yadav & Team

<div align="left">

<a href="https://github.com/vijayyadav2212" target="_blank" rel="noopener noreferrer">
  <img src="https://skillicons.dev/icons?i=github" alt="GitHub" width="36" height="36" title="GitHub" />
</a>
&nbsp;
<a href="https://linkedin.com/in/vijay0411" target="_blank" rel="noopener noreferrer">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linkedin/linkedin-original.svg" alt="LinkedIn" width="36" height="36" title="LinkedIn" />
</a>
&nbsp;
<a href="https://leetcode.com/u/ttGXbZCUeP" target="_blank" rel="noopener noreferrer">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.simpleicons.org/leetcode/ffffff" />
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/leetcode/leetcode-original.svg" alt="LeetCode" width="36" height="36" title="LeetCode" />
  </picture>
</a>
&nbsp;
<a href="mailto:yvijay2212@gmail.com" target="_blank" rel="noopener noreferrer">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.simpleicons.org/gmail/ffffff" />
    <img src="https://cdn.simpleicons.org/gmail/000000" alt="Email" width="36" height="36" title="Email" />
  </picture>
</a>

</div>

---

<a id="license"></a>
## 📄 License

This project is licensed under the **MIT License** — feel free to use, modify, and distribute with attribution.

---

<div align="center">

Made with ❤️ by **Vijay Yadav & Team**

</div>
