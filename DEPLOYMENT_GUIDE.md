# AlumNex Deployment Guide

This guide provides the complete, step-by-step instructions to deploy the AlumNex application to production without modifying the source code.

---

## 1. Database Deployment (Neon PostgreSQL)

1. Sign up or log in to the [Neon Console](https://neon.tech/).
2. Create a new PostgreSQL project (select a region closest to your target users/servers).
3. Copy the **Connection String** (`DATABASE_URL`). It will look like this:
   ```env
   postgresql://[user]:[password]@[neon-hostname]/neondb?sslmode=require
   ```

---

## 2. Configure Third-Party Services

### A. Auth0 Setup (Auth0 Dashboard)
Since you are migrating the app from local development (`http://localhost:3000`) to production, you need to update the permitted domains in your Auth0 application settings:
1. Log in to the [Auth0 Dashboard](https://manage.auth0.com/).
2. Go to **Applications** > Select your client application (Regular Web App or Single Page App).
3. Scroll down to **Application URIs** and update/add your production URLs:
   - **Allowed Callback URLs:** `https://your-frontend-app.vercel.app/api/auth/callback`
   - **Allowed Logout URLs:** `https://your-frontend-app.vercel.app`
   - **Allowed Web Origins:** `https://your-frontend-app.vercel.app`
   - **Allowed Origins (CORS):** `https://your-frontend-app.vercel.app`
4. Under **APIs** > Select your custom API > Ensure CORS is enabled for the frontend origin.

### B. Cloudinary Setup
1. Log in to [Cloudinary](https://cloudinary.com/).
2. Retrieve your credentials from the Dashboard. You will need:
   - **Cloud Name**
   - **API Key**
   - **API Secret**
   - Or the full **CLOUDINARY_URL** (format: `cloudinary://api_key:api_secret@cloud_name`).

### C. Razorpay Setup
1. Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Go to **Settings** > **API Keys**.
3. Generate new API keys (Test or Live mode) and note down:
   - **Key ID**
   - **Key Secret**

---

## 3. Deploy the Backend API (Render)

Render is recommended for hosting the Express backend.

1. Push your project repository (containing both `backend` and `frontend` folders) to GitHub or another Git provider.
2. Log in to [Render](https://render.com/) and click **New** > **Web Service**.
3. Connect your GitHub repository.
4. Configure the service settings:
   - **Name:** `alumnex-backend`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run prisma:generate`
   - **Start Command:** `npm start`
5. Under **Environment Variables**, add the variables defined in your [backend/.env.example](file:///d:/Vedant/Project/CONNECTINGFUTURE/backend/.env.example):
   - `DATABASE_URL`: *[Your Neon PostgreSQL connection string from Step 1]*
   - `PORT`: `4000` (Render overrides this automatically, but set it as fallback)
   - `NODE_ENV`: `production`
   - `ENCRYPTION_KEY`: *[A secure 32-character random string for AES-256-GCM messaging encryption]*
   - `AUTH0_DOMAIN`: *[Your Auth0 Domain URL]*
   - `AUTH0_AUDIENCE`: *[Your Auth0 API Identifier]*
   - `AUTH0_CLIENT_ID`: *[Your Auth0 Client ID]*
   - `AUTH0_CLIENT_SECRET`: *[Your Auth0 Client Secret]*
   - `AUTH0_MGMT_CLIENT_ID`: *[Your Auth0 Management API Client ID]*
   - `AUTH0_MGMT_CLIENT_SECRET`: *[Your Auth0 Management API Client Secret]*
   - `CLOUDINARY_URL`: *[Your Cloudinary connection URL]*
   - `RAPIDAPI_JSEARCH_KEY`: *[Your RapidAPI JSearch key]*
   - `RAPIDAPI_JSEARCH_HOST`: `jsearch.p.rapidapi.com`
6. Click **Deploy Web Service** and copy the deployed backend URL once complete (e.g., `https://alumnex-backend.onrender.com`).

---

## 4. Run Database Schema Migrations

With the Neon database created and connection string obtained, push the Prisma schemas:
1. Open your local terminal/command prompt.
2. Navigate to the `backend` directory.
3. Run the schema push command:
   ```bash
   DATABASE_URL="your-neon-postgres-connection-string" npm run prisma:push
   ```
   *(This initializes and sets up all SQL tables from [schema.prisma](file:///d:/Vedant/Project/CONNECTINGFUTURE/backend/prisma/schema.prisma) in the Neon PostgreSQL database).*

---

## 5. Deploy the Frontend (Vercel)

Vercel is optimized for building and serving Next.js applications.

1. Log in to [Vercel](https://vercel.com/) and click **Add New** > **Project**.
2. Select your GitHub repository.
3. Configure the build settings:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `frontend`
4. Expand the **Environment Variables** section and add the configurations from [frontend/.env](file:///d:/Vedant/Project/CONNECTINGFUTURE/frontend/.env):
   - `NEXT_PUBLIC_API_BASE_URL`: `https://alumnex-backend.onrender.com` (Your deployed Render backend URL)
   - `AUTH0_BASE_URL`: `https://your-frontend-app.vercel.app` (Your production Vercel frontend URL)
   - `AUTH0_ISSUER_BASE_URL`: `https://your-auth0-domain.us.auth0.com`
   - `AUTH0_SECRET`: *[A secure, random 32-character encryption key]*
   - `AUTH0_CLIENT_ID`: *[Your Auth0 client application ID]*
   - `AUTH0_CLIENT_SECRET`: *[Your Auth0 client application secret]*
   - `AUTH0_AUDIENCE`: *[Your Auth0 API audience URL]*
   - `RAZORPAY_KEY_ID`: *[Your Razorpay public Key ID]*
   - `RAZORPAY_KEY_SECRET`: *[Your Razorpay private Key Secret]*
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`: *[Your Razorpay public Key ID]*
5. Click **Deploy**. Vercel will build the Next.js static files and deploy the application.
