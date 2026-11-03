# 06 – Setup on macOS (No Docker, No Port 5000)

## Why not port 5000?
macOS Monterey (12) and later run **AirPlay Receiver** on ports 5000 and 7000. Starting Express on 5000 fails with `EADDRINUSE` or returns 403 from AirTunes. This project uses dedicated ports configured via environment variables (default: **4000** for API and **5173** for client).

Check what is using a port:
```bash
lsof -nP -iTCP:4000 -sTCP:LISTEN
```
(Optional) Free port 5000 in System Settings → General → AirDrop & Handoff → AirPlay Receiver → Off.

## 1. Prerequisites
```bash
# Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node via nvm (use current LTS)
brew install nvm
mkdir -p ~/.nvm
# add the nvm lines Homebrew prints to ~/.zshrc, then:
nvm install --lts && nvm use --lts
node -v && npm -v
git --version
```

## 2. MongoDB Atlas (Cloud Database)

Rozgaar is cloud-native and connects directly to MongoDB Atlas:
1. Create a free or dedicated cluster at [cloud.mongodb.com](https://cloud.mongodb.com/).
2. **Database Access:** Create a user with readWrite privileges.
3. **Network Access:** Allow-list your current IP address (or `0.0.0.0/0` during development).
4. Copy the SRV connection string into `server/.env` as `MONGODB_URI`.
5. Run connection ping and sync indexes:
   ```bash
   npm run db:ping
   npm run db:indexes
   ```

## 3. File storage

### Development: local disk driver (no AWS needed)
Set `STORAGE_DRIVER=local`. Files go to `server/uploads/` (git-ignored) and are served only through an authenticated route.

### S3 (staging and production)
1. Create a **private** bucket with Block Public Access on.
2. Create an IAM user with `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on `arn:aws:s3:::BUCKET/resumes/*`.
3. Fill the `AWS_*` variables in `server/.env`.
4. Add a CORS rule allowing your frontend origin (`CLIENT_ORIGIN`).

## 4. Environment files

`server/.env.example`
```
NODE_ENV=development
PORT=4000
CLIENT_ORIGIN=https://app.yourdomain.example
API_PUBLIC_URL=https://api.yourdomain.example
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/rozgaar?retryWrites=true&w=majority

JWT_ACCESS_SECRET=your_jwt_access_secret_min_32_characters_long_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_min_32_characters_long_here
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d

STORAGE_DRIVER=local            # local | s3
LOCAL_UPLOAD_DIR=./uploads
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=

SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="Rozgaar <noreply@yourdomain.example>"
SEED_ALLOW=true
SEED_DEMO_PASSWORD=your_seed_demo_password_here
```

`client/.env.example`
```
VITE_API_URL=https://api.yourdomain.example/api/v1
VITE_DEV_PORT=5173
```

`.gitignore` (root)
```
node_modules
.env
server/uploads
dist
.DS_Store
```

## 5. Vite config (port and proxy)
Vite dev port is read dynamically from `VITE_DEV_PORT` with `strictPort: true`.

## 6. Run
Terminal 1: `npm run dev:server`
Terminal 2: `npm run dev:client`
Open the client URL configured via `VITE_DEV_PORT` / `CLIENT_ORIGIN` and check `/health` on the server port.

## 7. Dev email
Create a free Ethereal account (https://ethereal.email) and put its SMTP credentials in `server/.env`.

## 8. Troubleshooting
| Symptom | Fix |
|---|---|
| `EADDRINUSE :::4000` | `lsof -nP -iTCP:4000 -sTCP:LISTEN` then `kill <PID>` |
| Atlas connection failed | Verify IP allow-list in Atlas Network Access and URL-encode password special chars |
| CORS error in browser | `CLIENT_ORIGIN` must exactly match the frontend URL scheme and port |
| Refresh cookie not sent | Axios needs `withCredentials: true` |
