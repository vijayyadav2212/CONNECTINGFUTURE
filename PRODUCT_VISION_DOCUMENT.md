# Product Vision Document

*Team Name:* Team Devbappa
*Product Name:* AlumNex
*Date:* July 8, 2026
*Version:* 1.0.0

---

## 1. Vision Statement
For university students who struggle with placement preparation, career direction, and connecting with experienced seniors, AlumNex is an exclusive alumni-student mentorship and networking platform that bridges the guidance gap by enabling real-time mentorship, curated learning roadmaps, job boards, and transparent university support. Unlike generic platforms like LinkedIn or unstructured WhatsApp groups, we provide a verified, secure university-only network integrated with academic progress tracking, encrypted messaging, and administrative moderation.

---

## 2. Problem Statement
Students lack access to structured, verified career guidance from alumni who have been in their exact position, while alumni lack transparent, secure channels to give back (via mentorship, job postings, or financial donations).

- **Problem:** Inefficient and fragmented channels for student-alumni interactions, leading to unverified profiles, manual placement referral chasing, and opaque donation systems.
- **Who feels this pain most:** Third- and fourth-year college students preparing for placements, and engaged alumni looking for structured ways to support their university.
- **Evidence / Proof Points:**
  - **Cold Outreach Friction:** Students attempting to reach out to alumni on LinkedIn experience very low response rates because alumni cannot verify their affiliation easily, or the messages get lost.
  - **Lack of Moderation & Trust:** WhatsApp and Telegram alumni channels are unmoderated, leading to spam, irrelevant posts, and untracked engagement.
  - **Referral and Donation Tracking Gaps:** Job referrals are handled informally over email without status updates, and university donations lack digital transparency, making alumni hesitant to contribute.

---

## 3. Target User
Be specific — one primary persona, not a list of five.

- **Primary User:** The University Student (seeking mentorship, roadmaps, and career opportunities) and University Alumni (willing to guide, refer, or support).
- **Their Context / Situation:** A student who feels overwhelmed by competitive placement seasons, seeking verified career paths, resume reviews, and direct advice from seniors who graduated from their department.
- **Current Workaround / Competitor:** LinkedIn (too generic, low response rates), WhatsApp/Telegram groups (unstructured, noisy), Almabase (mostly focused on donations rather than student tools).
- **Who we are NOT building for (yet):** External corporate recruiters (non-alumni) and high school applicants.

---

## 4. Value Proposition
Before vs. After — what changes for the user if this works.

| Before (Today) | After (With Our Product) |
|----------------|--------------------------|
| Disconnected, unverified networks of students and alumni with low response rates on cold outreach. | An exclusive, closed-loop community verified via university email and Auth0 authentication. |
| Hard-to-track academic progress and arbitrary self-studying without tailored directions. | Semester-wise course grade tracking integrated with Gemini AI-generated career roadmaps and technical milestone quizzes. |
| Unsecured, unencrypted chats where private career information and resumes are exposed. | End-to-end secure, encrypted communication (AES-256-GCM) protecting student-alumni correspondence. |
| Informal, untracked job referrals and opaque, manual donation structures. | Structured Job Board moderated by Admins and integrated Razorpay donations with real-time tracking and automated receipts. |

---

## 5. Differentiator
Why this approach, why us, why now.

- **Existing Alternatives:** LinkedIn, Almabase, WhatsApp alumni directories.
- **Why They Fall Short:**
  - **LinkedIn** is saturated, lacks academic integration (GPA, specific courses), and doesn't support structured mentorship requests.
  - **Almabase** is expensive, institution-facing, and focuses purely on fundraising rather than student career development.
  - **WhatsApp** groups offer zero privacy, are highly unstructured, and have no moderation workflow.
- **Our Unique Advantage:** A unified platform combining academic course tracking with professional growth. It leverages Gemini AI to generate custom learning roadmaps and technical quizzes. It includes a built-in admin panel to moderate user registrations, events, and job posts, alongside Razorpay integration for transparent donations and AES-256-GCM encryption for messaging.

---

## 6. Tech Stack (Technical Requirements)

Include:
- **Frontend:** Next.js (App Router, TypeScript), Tailwind CSS, React, Lucide Icons
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (hosted on Neon), Prisma ORM
- **Authentication:** Auth0 (Role-Based Access Control: Student, Alumni, Admin)
- **APIs / Third-party Services:** Cloudinary (secure file/resume/image storage), Razorpay (donation payments)
- **AI Models:** Gemini API (`gemini-flash-latest` via `@google/generative-ai` for roadmap generation and technical milestone quizzes)
- **Encryption:** Node.js standard Crypto API (AES-256-GCM) for chat ciphertexts
- **Hosting / Deployment:** Vercel (Frontend), Render/Railway (Backend), Neon (PostgreSQL Database)

---

## 7. Feature Finalization

### Core Features (MVP)
- **Role-based Authentication (Auth0):** Secure login separating Students, Alumni, and Admins. Alumni require Admin approval before accessing the platform.
- **Academic Progress Tracker:** Student-facing dashboard to input semester-wise course grades and track GPA.
- **AI Roadmap Generator:** Admin-triggered generation of step-by-step career/skill roadmaps using Gemini AI.
- **AI Milestone Quizzes:** Dynamic generation of technical multiple-choice quizzes using Gemini AI to test student understanding of roadmap milestones.
- **Mentorship & Resume Review:** Mentorship request workflow; Student-to-Alumni resume upload and review feedback system.
- **Encrypted Messaging System:** AES-256-GCM encrypted peer-to-peer chat for students and mentors.
- **Jobs & Events Board:** Alumni can post jobs and organize virtual/physical events. Requires Admin approval before publishing.
- **Razorpay Donation Integration:** Seamless monetary support system with categories (e.g., scholarship, infrastructure) and receipt generation.
- **Admin Control Panel:** Complete management system for reviewing pending registrations, job submissions, and events.

### Additional Features (Nice to Have)
- **Real-time Notifications:** WebSockets for instant message and approval notifications.
- **Video Mentorship Sessions:** Integrated video calling directly on the platform.
- **AI Mentor Matching:** Auto-recommending mentors to students based on matching skills, courses, and graduation majors.

---

## 8. Phase Themes (Not a Detailed Roadmap)

| Phase | Days | Theme / Focus |
|--------|------|---------------|
| Phase 1 | Days 1–15 | **Foundation & Authentication:** Set up Prisma schemas, PostgreSQL, and Auth0 role-based authorization for students, alumni, and admins. |
| Phase 2 | Days 16–30 | **Mentorship & Core Interaction:** Build connection request workflows, AES-256-GCM encrypted peer-to-peer messaging, and resume review uploads. |
| Phase 3 | Days 31–45 | **AI Integration & Boards:** Implement the Gemini AI learning roadmap/quiz generator, build the job and event posting boards, and integrate Razorpay payments. |
| Phase 4 | Days 46–60 | **Moderation & Refinement:** Launch the Admin Dashboard for workflow moderation, implement user notifications, conduct end-to-end testing, and deploy. |

---

## 9. Success Metrics (NEW)

How will you know your product is successful?

- **Active Engagement:** Number of active weekly users (both Students and Alumni) interacting on the platform.
- **Mentorship Connections:** Total number of requested, accepted, and completed mentorship pairings/resume reviews.
- **Donation Volume:** Total funds raised securely through the Razorpay integration.
- **Moderation Efficiency:** Median time taken by administrators to approve or reject pending alumni profiles, jobs, and events (target: < 24 hours).
- **Placement Impact:** Qualitative and quantitative feedback showing students landing jobs/internships posted directly on the platform.

---

## 10. Research References (NEW)

Mention all research sources used:
- **Auth0 Security Guidelines:** Implementing secure token authentication and client-side route guards.
- **Razorpay API Reference:** Integrating subscription/donation systems and signature validation.
- **Cloudinary Media API:** Standardizing multipart image/document uploads in Node.js and Next.js.
- **Prisma Schema Documentation:** Database modeling for Postgres/Neon relationships.
- **Google Generative AI Documentation:** Gemini models token usage and prompt engineering guidelines.

---

## 11. Team Responsibilities (NEW)

| Member | Role | Responsibility |
|--------|------|----------------|
| **Lead Developer** | Full-Stack Software Engineer | Implements the Next.js frontend, Express backend, Prisma migrations, and integrates external APIs (Auth0, Razorpay, Cloudinary, Gemini). |
| **Alumni Relations Manager** | Moderator / Administrator | Handles alumni verification checks, validates university emails, moderates jobs/events, and coordinates platform outreach. |
| **Academic Coordinator** | Course Advisor | Oversees the mapping of academic courses, validates study materials, and reviews generated roadmaps. |

---

## 12. Open Questions

Things that are still under discussion or need validation before implementation.

- What is the storage limit for Cloudinary resume uploads, and do we need to implement automatic compression?
- Should we add a fee structure for premium mentorship sessions, or keep the platform entirely donation-based?
- How do we handle alumni whose graduation year or major is not listed in standard database records during manual verification?

---

*Instructions:*
* This is a **living document**. Update the version whenever significant changes are made.
* Keep your answers concise but well justified.
* Do not write assumptions without research or research reasoning.
* Focus on solving a real problem instead of adding unnecessary features.
* Finalize this document before beginning development so your entire team has a clear direction.
