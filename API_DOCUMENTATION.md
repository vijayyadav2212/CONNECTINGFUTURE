# API Documentation (summary)

This document lists the server-side Express API endpoints (backend) and the frontend Next.js API routes (proxies / payment handlers) implemented in the workspace.

Notes:
- For backend routes: the server runs at `http://localhost:4000` by default.
- Many backend routes use JWT auth (`checkJwt`) — this is indicated in the Auth column.

---

## Auth & User

- GET /api/health
  - Auth: none
  - Description: Health check and DB/auth0 config status
  - Query/Body: none

- GET /api/protected
  - Auth: yes (`checkJwt`)
  - Description: example protected route returning authenticated claims

- POST /api/uploads/resume
  - Auth: none
  - Description: upload resume via multipart/form-data (field `resume`), returns file URL
  - Limits: PDF/DOC/DOCX, max 10MB

- POST /api/users
  - Auth: yes
  - Description: store basic user info after login (upsert by `auth0_id`)
  - Body: `{ sub, email, name, picture }`

- GET /api/users/profile
  - Auth: yes
  - Description: return local user profile (seeds from Auth0 if not present)

- PUT /api/users/profile
  - Auth: yes
  - Description: create/update user's profile fields
  - Body: fields like `email`, `name`, `graduationYear`, `course`, `currentCompany`, `jobTitle`, `location`, `linkedIn`, `bio`, `skills`, `isOpenToMentoring`

- POST /api/users/sync-self
  - Auth: yes
  - Description: fetch user's Auth0 record and upsert locally

---

## Academic Progress

- GET /api/academic-progress/me
  - Auth: yes
  - Description: returns computed academic progress (semesters, courses, overall stats)

- PUT /api/academic-progress/me
  - Auth: yes
  - Description: replace user's academic progress (semesters + courses). Transactional.
  - Body: `{ semesters: [...] }` where each semester has `id|name, gpa, totalCredits, courses[]` etc.

---

## Donations

- GET /api/donations
  - Auth: none
  - Description: list donations with pagination and optional filters (`status`, `donor_email`)
  - Query: `page`, `limit`, `status`, `donor_email`

- POST /api/donations
  - Auth: none
  - Description: create donation record
  - Body: donor fields (`donor_name`, `donor_email`, `amount`, `payment_method`, optional Razorpay fields)

- GET /api/donations/:id
  - Auth: none
  - Description: fetch donation by id

- PUT /api/donations/:id
  - Auth: none
  - Description: update donation fields (transaction_status, receipt flags, etc.)

- DELETE /api/donations/:id
  - Auth: none
  - Description: delete donation (only allowed for non-completed statuses)

- GET /api/donations/analytics/summary
  - Auth: none
  - Description: summary analytics (total amount, counts, monthly aggregates)

Note: In the frontend there are also serverless Next routes implementing donations endpoints (see Frontend API section).

---

## Roadmaps

- POST /api/roadmaps
  - Auth: none
  - Description: create a roadmap
  - Body: owner_email, title, description, category, level, duration, phases, tags

- GET /api/roadmaps
  - Auth: none
  - Description: list roadmaps (optional `owner_email`, paging)

- GET /api/roadmaps/:id
  - Auth: none
  - Description: get roadmap by id

- PUT /api/roadmaps/:id
  - Auth: none
  - Description: update roadmap (select fields)

- DELETE /api/roadmaps/:id
  - Auth: none
  - Description: delete roadmap

---

## Jobs & Applications

- POST /api/jobs
  - Auth: none
  - Description: create job/internship posting

- GET /api/jobs
  - Auth: none
  - Description: list jobs with filters (`q`, `industry`, `job_type`, `location`, `remote_only`, `status`, `posted_by`, paging)

- GET /api/jobs/:id
  - Auth: none
  - Description: get job by id

- PUT /api/jobs/:id
  - Auth: none
  - Description: update job fields

- DELETE /api/jobs/:id
  - Auth: none
  - Description: delete job

- POST /api/jobs/:id/apply
  - Auth: none
  - Description: student applies to job (applicant_email, resume_url, cover_letter). Enforces `student` role check.

- GET /api/applications
  - Auth: none
  - Description: list applications for a student (requires `applicant_email` query)

- GET /api/applications/by-job
  - Auth: none
  - Description: list applicants for a job (query `job_id`)

- PUT /api/applications/:id
  - Auth: none
  - Description: update application status (`applied|withdrawn|accepted|rejected`)

---

## Messaging

- POST /api/messages
  - Auth: none
  - Description: creates an encrypted message between `sender_email` and `receiver_email`. Mentorship chat gating applies (free limit then require session).
  - Body: `{ sender_email, receiver_email, content }`

- GET /api/messages
  - Auth: none
  - Description: get messages in a thread (query `user` and `with`) - decrypts before returning

- GET /api/messages/threads
  - Auth: none
  - Description: list user's message threads (latest message per thread)

- POST /api/messages/connected
  - Auth: none
  - Description: variant that ensures users are connected (via connections) before posting message

---

## Connections (network)

- POST /api/connections/request
  - Auth: none
  - Description: send connection request (requester_email, target_email, message)

- POST /api/connections/respond
  - Auth: none
  - Description: accept/reject a request (`user_email`, `other_email`, `action`)

- GET /api/connections
  - Auth: none
  - Description: list connections for a user (query `user_email`, optional `status`)

- POST /api/connections/remove
  - Auth: none
  - Description: set status to `removed` for pair

---

## Mentorship (mentors, requests, sessions, ratings)

- GET /api/mentors
  - Auth: none
  - Description: list available mentors with filters (q, min_experience, max_price, min_rating, paging)

- GET /api/mentors/profile
  - Auth: none
  - Description: get single mentor profile by `email` query

- POST /api/mentors/profile
  - Auth: none
  - Description: create/update mentor profile (alumni) fields

- POST /api/mentorship/request
  - Auth: none
  - Description: student requests mentorship from mentor (`student_email`, `mentor_email`, `message`)

- POST /api/mentorship/respond
  - Auth: none
  - Description: mentor responds to request (`mentor_email`, `student_email`, `action=accept|reject`)

- GET /api/mentorship/requests
  - Auth: none
  - Description: list mentorship requests for mentor or student (query `mentor_email` or `student_email`, optional `status`)

- POST /api/mentorship/sessions/purchase
  - Auth: none
  - Description: create a paid session record (after payment): `{ student_email, mentor_email, amount, currency, payment_id, order_id }` => status `paid`

- POST /api/mentorship/sessions/schedule
  - Auth: none
  - Description: schedule a session (attach `meeting_link`, `scheduled_at`, `duration_minutes`). Body: `{ session_id, scheduled_at, duration_minutes, meeting_link, notes }` => status `scheduled`

- POST /api/mentorship/sessions/complete
  - Auth: none
  - Description: mark session as completed (mentor action). Body: `{ session_id }`

- GET /api/mentorship/sessions
  - Auth: none
  - Description: list sessions for mentor or student (query `mentor_email` or `student_email`, optional `status`)

- POST /api/mentorship/ratings
  - Auth: none
  - Description: submit rating after session `{ session_id, student_email, mentor_email, rating, feedback }` and updates mentor aggregates

---

## Frontend Next.js API Routes (proxies & payment handlers)

These are implemented under `frontend/src/app/api/*` and mostly proxy to the backend or implement payment operations.

- GET /api/mentors/profile (Next route)
  - File: `frontend/src/app/api/mentors/profile/route.ts`
  - Auth: none for GET; POST uses server-side token
  - Description: Proxy to backend `/api/mentors/profile` (GET) and `/api/mentors/profile` (POST) using Auth0 server-side token for POST

- POST /api/payment/create-order
  - File: `frontend/src/app/api/payment/create-order/route.ts`
  - Auth: none
  - Description: Creates Razorpay order (requires `RAZORPAY_KEY_ID`/`SECRET` env)
  - Body: `{ amount, currency, receipt, notes }`

- POST /api/payment/verify
  - File: `frontend/src/app/api/payment/verify/route.ts`
  - Auth: none
  - Description: Verifies Razorpay payment signature and stores donation to backend `/api/donations`
  - Body: `{ paymentId, orderId, signature, donationData }`

- POST /api/payment/webhook
  - File: `frontend/src/app/api/payment/webhook/route.ts`
  - Auth: none (verifies webhook signature)
  - Description: Razorpay webhook receiver; validates `x-razorpay-signature`

- Donations serverless routes (frontend)
  - Files: `frontend/src/app/api/donations/*`
  - Routes: GET `/api/donations`, POST `/api/donations`, PUT `/api/donations` (update via body), DELETE `/api/donations/:id`, GET `/api/donations/:id`, GET `/api/donations/donor`, GET `/api/donations/analytics`
  - Description: Implement donations CRUD and analytics using MySQL connection within the Next.js server handlers (note: these parallel backend endpoints in Express).

- POST /api/user/register (Next route)
  - File: `frontend/src/app/api/user/register/route.ts`
  - Auth: server-side via Pages API token (pulls token and PUTs to backend `/api/users/profile`)

- GET /api/user/profile (Next route)
  - File: `frontend/src/app/api/user/profile/route.ts`
  - Auth: server-side via Pages API token; proxies to backend `/api/users/profile` and returns `isNewUser` flag

---

If you want, I can:
- generate a more detailed OpenAPI/Swagger JSON for these endpoints, or
- add example request/response bodies for selected endpoints.

Files referenced while documenting:
- `backend/server.js` (main Express endpoints)
- `frontend/src/app/api/*` (Next.js API routes and payment handlers)

---

Generated: Feb 05, 2026
