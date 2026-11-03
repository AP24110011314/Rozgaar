# Rozgaar ATS – Production Deployment Guide (Vercel & Render)

This step-by-step guide walks you through deploying **Rozgaar (रोज़गार)** from a macOS workstation to production using **Render** for the Express API backend, **Vercel** for the Vite React frontend, **MongoDB Atlas** for data persistence, **AWS S3** for resume file storage, and **Resend** for transactional email notifications.

> **Note on Dashboard UIs:** Cloud provider dashboards update their interfaces periodically. If an exact button label or menu item differs slightly from this guide, verify the current wording in the respective provider dashboard.

---

## Architecture Topology

```
[ User Browser / Mobile Phone ]
               │
               ▼
   [ Vercel Edge CDN (Frontend) ]
   https://rozgaar.vercel.app
         │
         ├── /assets/*  ──> Static Vite Assets (Immutable Cache)
         ├── /*         ──> Single Page App (index.html fallback)
         └── /api/v1/*  ──> Reverse Proxy Rewrite
                                   │
                                   ▼
                      [ Render Web Service (Backend) ]
                      https://rozgaar-api.onrender.com
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
         [ MongoDB Atlas M0/M10 ]         [ AWS S3 Private Bucket ]
         Geo-indexed Database             Resumes (`resumes/*`)
```

---

## Environment Variables Reference

### 1. Render Web Service (Backend)

| Variable Name | Required | Example / Placeholder | Source / Instructions |
|---|---|---|---|
| `NODE_ENV` | **Yes** | `production` | Set to `production` to activate security guards, compression, and secure cookies. |
| `PORT` | Auto | *(Injected by Render)* | **Do NOT set manually.** Render automatically assigns and binds `process.env.PORT`. |
| `CLIENT_ORIGIN` | **Yes** | `https://rozgaar.vercel.app` | Your deployed Vercel domain (or comma-separated allowed frontend origins). |
| `API_PUBLIC_URL` | **Yes** | `https://rozgaar-api.onrender.com` | Your public Render service URL. |
| `MONGODB_URI` | **Yes** | `mongodb+srv://rozgaar_prod_app:<enc-pass>@cluster0.abcde.mongodb.net/rozgaar?retryWrites=true&w=majority` | MongoDB Atlas Database Connection String (URL-encode any special characters in the password). |
| `JWT_ACCESS_SECRET` | **Yes** | `f9c2d1e04b8a7f6e5d4c3b2a109876543210fedcba9876543210abcdef123456` | 64-char hex string (min 32 chars). Generate via macOS terminal. |
| `JWT_REFRESH_SECRET` | **Yes** | `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` | Different 64-char hex string (min 32 chars). Generate via macOS terminal. |
| `ACCESS_TOKEN_TTL` | No | `15m` | Lifetime of short-lived JWT access token in memory. Defaults to `15m`. |
| `REFRESH_TOKEN_TTL`| No | `7d` | Lifetime of rotating httpOnly refresh token. Defaults to `7d`. |
| `STORAGE_DRIVER` | **Yes** | `s3` | Set to `s3` for persistent storage (Render local disks are ephemeral and wiped on redeploy). |
| `AWS_REGION` | **Yes** | `ap-south-1` | AWS Region of your S3 bucket (e.g. `ap-south-1` for Mumbai). |
| `AWS_ACCESS_KEY_ID`| **Yes** | `AKIAIOSFODNN7EXAMPLE` | IAM User Access Key ID with restricted S3 permissions. |
| `AWS_SECRET_ACCESS_KEY`| **Yes** | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` | IAM User Secret Access Key. |
| `S3_BUCKET` | **Yes** | `rozgaar-resumes-prod` | Name of your private S3 bucket. |
| `AWS_S3_BUCKET` | No | `rozgaar-resumes-prod` | Alias for `S3_BUCKET`. |
| `MAIL_DRIVER` | No | `resend` | Set to `resend` for cloud HTTP API mail delivery (bypasses Render SMTP port blocks). |
| `RESEND_API_KEY` | Conditional | `re_123456789_abcdefghijklmnopqrstuvwxyz` | Required if `MAIL_DRIVER=resend`. Generated from Resend dashboard. |
| `MAIL_FROM` | No | `Rozgaar <noreply@yourdomain.com>` | Sender identity for status updates and email alerts. |
| `SEED_ALLOW` | **Yes** | `false` | **Always `false` on Render.** Prevents unauthorized database seeding in production. |
| `SEED_DEMO_PASSWORD`| No | `RozgaarProd2026!Secure` | Strong master password used when seeding from your local machine. |

### 2. Vercel Project (Frontend)

| Variable Name | Required | Example / Placeholder | Source / Instructions |
|---|---|---|---|
| `VITE_API_URL` | **Yes** | `/api/v1` | **Must be `/api/v1`** (relative path). Proxies requests through Vercel's edge rewrite to Render, ensuring first-party cookie context. |

---

## Step-by-Step Deployment Procedure

### Step 1: Prepare Repository & Verify Local Quality Gates

1. Open Terminal on your Mac and navigate to your project root:
   ```bash
   cd ~/Projects/Rozgaar
   ```
2. Run the complete automated verification pipeline:
   ```bash
   npm run verify
   ```
   This executes:
   - Server Vitest unit & integration suite (71 tests).
   - Client Vitest component suite (2 tests).
   - URL & Port security audit (`scripts/check-urls.js`).
   - Secrets & credential audit (`scripts/check-secrets.js`).
   - Production Vite client build (`client/dist`).

3. Verify Git tracking ignores secret files:
   ```bash
   git status
   ```
   Ensure `.env`, `server/.env`, and `client/.env` are **untracked**.

4. Initialize and commit your changes:
   ```bash
   git add .
   git commit -m "chore: prepare production deployment for Vercel and Render"
   ```

5. Create a new private repository on GitHub (e.g. `github.com/<your-username>/rozgaar`), link your remote, and push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/rozgaar.git
   git push -u origin main
   ```

---

### Step 2: Set Up MongoDB Atlas for Production

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Select your production cluster or create a new free tier (M0) or dedicated (M10+) cluster in your target region (e.g., `AWS / Mumbai (ap-south-1)`).
3. **Database User Configuration**:
   - Navigate to **Security** → **Database Access** → click **Add New Database User**.
   - **Authentication Method**: Password.
   - **Username**: `rozgaar_prod_app`.
   - **Password**: Generate a secure 32+ character random password.
   - **Database User Privileges**: Select **Built-in Role** → `readWrite` on database `rozgaar`.
   - Click **Add User**.
   > **Important:** If your password contains special characters (such as `@`, `:`, `/`, `?`, `#`, `[`), URL-encode them (e.g., `@` becomes `%40`, `#` becomes `%23`).
4. **Network Access Configuration**:
   - Navigate to **Security** → **Network Access** → click **Add IP Address**.
   - Render free web services share dynamic outbound IP pools without dedicated static IPs. Therefore, configure `0.0.0.0/0` (Allow Access from Anywhere) with a description: `Render dynamic pool (secured by strong DB credentials)`.
   - Click **Confirm**.
5. **Verify Atlas Connection from your Mac**:
   - Temporarily update `server/.env` with your new production `MONGODB_URI`.
   - Run the diagnostic ping and index verification from your terminal:
     ```bash
     npm run db:ping
     npm run db:indexes
     ```
   - Both commands must report successful connection and verified 2dsphere / unique indexes.

---

### Step 3: Configure AWS S3 for Resumes

1. Log in to the [AWS Management Console](https://console.aws.amazon.com/).
2. Navigate to **S3** → click **Create bucket**.
   - **Bucket name**: `rozgaar-resumes-prod-<unique-suffix>`.
   - **AWS Region**: `ap-south-1` (Asia Pacific Mumbai) or your cluster region.
   - **Block Public Access settings for this bucket**: Keep **Block *all* public access** checked (resumes are private and accessed via 5-minute presigned URLs only).
   - **Default encryption**: Enable with Server-side encryption with Amazon S3 managed keys (`SSE-S3`).
   - Click **Create bucket**.
3. **Create IAM Least-Privilege Policy & User**:
   - Navigate to **IAM** → **Policies** → click **Create policy**.
   - Select the **JSON** tab and paste the following least-privilege policy (replace `YOUR_BUCKET_NAME` with your bucket name):
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [
         {
           "Sid": "RozgaarResumeStorageAccess",
           "Effect": "Allow",
           "Action": [
             "s3:PutObject",
             "s3:GetObject",
             "s3:DeleteObject"
           ],
           "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/resumes/*"
         }
       ]
     }
     ```
   - Name the policy `RozgaarResumeStoragePolicy` and click **Create policy**.
   - Navigate to **IAM** → **Users** → click **Create user**.
   - Name: `rozgaar-app-service`.
   - Attach policy directly: search and select `RozgaarResumeStoragePolicy`.
   - Complete creation, open the user, go to the **Security credentials** tab, and click **Create access key** (use case: *Application running outside AWS*).
   - Save your `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.
4. **Test S3 Storage from your Mac**:
   - Set the S3 environment variables in `server/.env` (`STORAGE_DRIVER=s3`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`).
   - Run the storage check:
     ```bash
     npm run check:storage
     ```
   - Verify all 4 steps succeed (Upload, Presign, Fetch, Delete).

---

### Step 4: Configure Transactional Email (Resend)

Render blocks outbound SMTP ports (`25`, `465`, `587`) on free tier instances. Rozgaar includes an HTTP-API email driver.
1. Sign up or log in at [Resend](https://resend.com/).
2. Navigate to **API Keys** → click **Create API Key**.
   - Name: `Rozgaar Production`.
   - Permission: **Full access** (or sending access).
   - Copy your key (`re_...`).
3. Under **Domains**, you can verify your custom domain DNS records (SPF, DKIM). Alternatively, for initial testing, use `onboarding@resend.dev` as `MAIL_FROM`.

---

### Step 5: Generate Production Cryptographic Secrets

On your Mac terminal, generate two distinct, cryptographically strong 64-character secret tokens:
```bash
node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```
Copy these distinct keys for the next step.

---

### Step 6: Create the Render Web Service Manually

1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → select **Web Service**.
3. Choose **Build and deploy from a Git repository** → connect your GitHub account and select `rozgaar`.
4. Fill in the service configuration:
   - **Name**: `rozgaar-api` (or a custom name; note your resulting URL: `https://<service-name>.onrender.com`).
   - **Region**: Singapore or Frankfurt (closest to your users and MongoDB Atlas region).
   - **Branch**: `main`.
   - **Root Directory**: `server`.
   - **Runtime**: `Node`.
   - **Build Command**: `npm ci`.
   - **Start Command**: `npm start`.
   - **Instance Type**: `Free` (or `Starter`).
5. Click **Advanced**:
   - **Health Check Path**: `/api/v1/health`.
   - **Auto-Deploy**: `Yes`.
6. Click **Add Environment Variable** and enter the following keys:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: *Your Atlas production connection string*
   - `JWT_ACCESS_SECRET`: *Your generated 64-char access secret*
   - `JWT_REFRESH_SECRET`: *Your generated 64-char refresh secret*
   - `STORAGE_DRIVER`: `s3`
   - `AWS_REGION`: `ap-south-1`
   - `AWS_ACCESS_KEY_ID`: *Your IAM Access Key ID*
   - `AWS_SECRET_ACCESS_KEY`: *Your IAM Secret Access Key*
   - `S3_BUCKET`: *Your S3 bucket name*
   - `MAIL_DRIVER`: `resend`
   - `RESEND_API_KEY`: *Your Resend API Key (`re_...`)*
   - `MAIL_FROM`: `Rozgaar <onboarding@resend.dev>`
   - `SEED_ALLOW`: `false`
   - `CLIENT_ORIGIN`: `https://rozgaar-placeholder.vercel.app` *(Temporary; updated in Step 9)*
   - `API_PUBLIC_URL`: `https://<service-name>.onrender.com`
7. Click **Create Web Service**.
8. Wait for the initial build to complete. When the log displays `Rozgaar API running in production mode`, open `https://<service-name>.onrender.com/api/v1/health` in your browser. It should return HTTP 200 with status `ok` and `database: "connected"`.

---

### Step 7: Update `client/vercel.json` with your Live Render URL

1. In your local repository, open [client/vercel.json](file:///Users/ammu/Projects/Rozgaar/client/vercel.json).
2. Update the rewrite destination from the default placeholder to your exact Render service URL:
   ```json
   {
     "$schema": "https://openapi.vercel.sh/vercel.json",
     "version": 2,
     "rewrites": [
       {
         "source": "/api/v1/:path*",
         "destination": "https://<your-service-name>.onrender.com/api/v1/:path*"
       },
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
3. Commit and push this change to GitHub:
   ```bash
   git add client/vercel.json
   git commit -m "fix(deploy): update vercel proxy rewrite destination to live render service"
   git push origin main
   ```

---

### Step 8: Create the Vercel Frontend Project

1. Log in to [Vercel Dashboard](https://vercel.com/).
2. Click **Add New...** → **Project**.
3. Import your `rozgaar` GitHub repository.
4. Configure the project:
   - **Framework Preset**: `Vite`.
   - **Root Directory**: Click *Edit* and select `client`.
   - **Build Command**: `npm run build` (default).
   - **Output Directory**: `dist` (default).
5. Expand **Environment Variables**:
   - Key: `VITE_API_URL`
   - Value: `/api/v1`
   - Scope: *Production*, *Preview*, and *Development*.
6. Click **Deploy**.
7. In ~30-60 seconds, Vercel will complete the build and assign your production URL (e.g. `https://rozgaar-<username>.vercel.app`).

---

### Step 9: Close the Origin Loop on Render

*(Why this step is needed: Render needs Vercel's URL for CORS headers, while Vercel needs Render's URL for reverse proxy rewrites. Configuring the placeholder first prevents the chicken-and-egg deployment block).*

1. Return to the [Render Dashboard](https://dashboard.render.com/) and open your `rozgaar-api` service.
2. Go to **Environment**.
3. Update `CLIENT_ORIGIN` to your exact Vercel URL:
   ```
   CLIENT_ORIGIN=https://rozgaar-<username>.vercel.app
   ```
4. Click **Save Changes**. Render will automatically trigger a rolling redeploy.

---

### Step 10: Seed Initial Demo Data Safely from macOS

1. On your Mac terminal, navigate to `server/`:
   ```bash
   cd ~/Projects/Rozgaar/server
   ```
2. Verify that your local `server/.env` file points to the production Atlas `MONGODB_URI`.
3. Set `SEED_ALLOW=true` in your local `server/.env` only:
   ```bash
   SEED_ALLOW=true
   ```
4. Run the seed script:
   ```bash
   npm run seed
   ```
   This populates demo companies (Durga Bakery, Amaravati Logistics), recruiter accounts, applicant profiles, and active jobs.
5. **Immediately revert** `SEED_ALLOW=false` in your local `server/.env`:
   ```bash
   SEED_ALLOW=false
   ```
   > **Security Warning:** Before a public launch with real users, change `SEED_DEMO_PASSWORD` to an unguessable phrase or remove the demo accounts.

---

### Step 11: Post-Deployment Smoke & Verification Testing

1. **Automated Smoke Test through Vercel Proxy**:
   Run the 49-point automated live smoke test directly through your Vercel domain to verify proxy routing, token refresh rotation, and database operations:
   ```bash
   SMOKE_API_URL=https://rozgaar-<username>.vercel.app/api/v1 \
   SMOKE_APPLICANT_EMAIL=applicant@rozgaar.example \
   SMOKE_RECRUITER_EMAIL=recruiter@rozgaar.example \
   SMOKE_ADMIN_EMAIL=admin@rozgaar.example \
   SEED_DEMO_PASSWORD=RozgaarDemo2026! \
   npm run smoke
   ```
   Ensure all 49 tests display `PASS` with zero failures.

2. **Automated End-to-End Test on Production**:
   ```bash
   E2E_CLIENT_URL=https://rozgaar-<username>.vercel.app npm run e2e
   ```
   All 16 Playwright journeys must pass.

3. **Manual Mobile Smoke Test (iPhone Safari & Android Chrome)**:
   - Open `https://rozgaar-<username>.vercel.app` on your smartphone.
   - Log in as applicant (`applicant@rozgaar.example` / `RozgaarDemo2026!`).
   - Refresh the page: verify the session persists smoothly without logging you out.
   - Search for a job using the mobile "Filters" bottom drawer.
   - Apply to an open job and upload a test PDF resume.
   - Log in as recruiter (`recruiter@rozgaar.example`), open the Kanban pipeline, and tap "Move to..." to advance the candidate.
   - Verify the candidate's secure resume download link opens the file.

---

### Step 12: Custom Domain Setup (Optional)

1. In the **Vercel Dashboard**, go to **Settings** → **Domains**.
2. Add your custom domain (e.g. `jobs.yourdomain.com` or `rozgaar.in`).
3. Follow the DNS instructions to add the `CNAME` or `A` records at your registrar.
4. Once verified, update `CLIENT_ORIGIN` in the Render dashboard to include your custom domain:
   ```
   CLIENT_ORIGIN=https://jobs.yourdomain.com
   ```

---

### Step 13: Maintenance & Day-2 Operations

- **Viewing Real-Time Logs**:
  - *Render*: Web Service → **Logs** (streams stdout, morgan combined requests, error traces).
  - *Vercel*: Project → **Deployments** → click deployment → **Functions** / **Edge Logs**.
- **Rollbacks**:
  - *Render*: Go to **Deploys** → find a previous healthy build → click **Rollback to this deploy**.
  - *Vercel*: Go to **Deployments** → locate previous stable deployment → click **...** → **Promote to Production**.
- **Rotating Secrets**:
  - Generate new secrets using `crypto.randomBytes(32).toString('hex')`.
  - Update `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in Render. Existing user sessions will be invalidated gracefully, requiring a clean login.
- **Handling Free-Tier Render Cold Starts**:
  - Render free instances spin down after 15 minutes of inactivity. When a new request arrives, it can take 30–50 seconds to boot.
  - *Workaround*: Set up a free monitoring check (e.g. using UptimeRobot, BetterStack, or Cron-Job.org) that pings `https://<service-name>.onrender.com/api/v1/health` every 10 minutes.
  - *Production Solution*: Upgrade Render instance to the **Starter ($7/mo)** plan for zero cold starts and 100% always-on availability.

---

## Production Troubleshooting Matrix

| Problem | Root Cause | Solution |
|---|---|---|
| **CORS error in browser console** | `CLIENT_ORIGIN` on Render does not match the Vercel URL. | Update `CLIENT_ORIGIN` in Render dashboard to exact Vercel URL (including `https://` with no trailing slash) and redeploy. |
| **Logged out on page refresh (401 loops)** | Refresh cookie rejected due to cross-site restrictions or path mismatch. | Verify `VITE_API_URL` is set to `/api/v1` so requests route through the first-party Vercel rewrite. Check that `sameSite` is `none` and `secure` is `true` if calling Render directly. |
| **502 / 504 Bad Gateway from `/api/v1/*`** | Render free instance is sleeping or still booting. | Wait 30 seconds for cold start completion, or set up an uptime ping to keep the instance warm. |
| **`MongooseServerSelectionError`** | MongoDB Atlas IP whitelist blocking Render or incorrect password. | Ensure `0.0.0.0/0` is added to Atlas Network Access. Verify that special characters in the password are URL-encoded. |
| **Render: "No open ports detected"** | Server not binding to `process.env.PORT`. | Render injects `PORT`. Ensure `server.js` listens on `env.PORT` and does NOT hardcode port 5000. |
| **Resume uploads fail (S3)** | S3 bucket permissions or incorrect region. | Verify bucket exists in `AWS_REGION` and IAM policy grants `s3:PutObject` on `arn:aws:s3:::<bucket>/resumes/*`. Run `npm run check:storage`. |
| **Emails not received** | SMTP ports blocked or invalid API key. | Set `MAIL_DRIVER=resend` with a valid `RESEND_API_KEY`. Check the Resend dashboard log for delivery details. |
| **Vercel build fails** | Missing `VITE_API_URL` or wrong Root Directory. | In Vercel Project Settings, confirm Root Directory is set to `client` and `VITE_API_URL=/api/v1` is defined. |
| **Blank page on deep link refresh** | Single Page Application (SPA) fallback missing. | Confirm `client/vercel.json` contains `"source": "/(.*)", "destination": "/index.html"`. |
| **Mixed Content warnings** | Calling `http://` resources from an HTTPS page. | Ensure all URLs, API endpoints, and assets use `https://`. |

---

## Go-Live Checklist

- [ ] All 73 test suite tests pass (`npm run test`).
- [ ] Codebase audits pass with zero violations (`npm run check:urls`, `npm run check:secrets`).
- [ ] Production build succeeds (`npm run build:client`).
- [ ] MongoDB Atlas user created with least-privilege `readWrite` on `rozgaar` database.
- [ ] AWS S3 bucket has Block Public Access enabled and default encryption on.
- [ ] IAM policy restricted strictly to bucket `resumes/*` prefix.
- [ ] Unique 64-character JWT secrets generated and configured in Render.
- [ ] `SEED_ALLOW` set to `false` in Render environment.
- [ ] `client/vercel.json` points to live Render URL.
- [ ] Vercel `VITE_API_URL` configured to `/api/v1`.
- [ ] Render `CLIENT_ORIGIN` updated with production Vercel domain.
- [ ] Automated smoke test (`npm run smoke`) passes against live Vercel URL.
- [ ] Mobile responsive layout verified on real iOS and Android devices.
- [ ] Privacy policy and Terms of service linked in application footer.

