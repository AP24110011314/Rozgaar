# 11 – Deployment (No Docker)

Verify current free-tier limits and pricing with each provider before choosing.

## Recommended low-cost topology
| Piece | Option |
|---|---|
| Frontend (static) | Vercel, Netlify, or Cloudflare Pages |
| API | Render, Railway, Fly.io (buildpack/Node runtime), or a VPS with PM2 |
| Database | MongoDB Atlas |
| Files | AWS S3 (private bucket) |
| Email | Resend, Postmark, or SES |

## 1. Prepare
- API listens on `process.env.PORT` (never hard-code; hosts inject it).
- Add `"engines": { "node": ">=20" }` to `server/package.json` (use the current LTS).
- Build frontend: `cd client && npm run build` (outputs `dist/`).
- Production env variables: set all keys from `.env.example`; `NODE_ENV=production`; strong secrets.
- Atlas: create a production cluster, a dedicated DB user, and allow the API host's egress IPs (or `0.0.0.0/0` only with strong credentials).

## 2. Deploy the API (PaaS example: Render)
1. New Web Service → connect repo → root directory `server`.
2. Build command: `npm ci`. Start command: `npm start`.
3. Add environment variables. Health check path: `/api/v1/health`.
4. Note the public URL, e.g. `https://localhire-api.onrender.com`.

## 3. Deploy the frontend (Vercel/Netlify)
1. Root directory `client`, build `npm run build`, output `dist`.
2. Env var: `VITE_API_URL=https://<api-host>/api/v1`.
3. Add SPA fallback so all paths serve `index.html` (Netlify `_redirects`: `/* /index.html 200`; Vercel rewrite in `vercel.json`).
4. Set the API's `CLIENT_ORIGIN` to the deployed frontend URL.

**Cookie note:** if the frontend and API are on different registrable domains, refresh cookies need `SameSite=None; Secure` plus CSRF protection. Simplest fix: use subdomains of one domain (`app.example.com`, `api.example.com`).

## 4. Alternative: single VPS (Ubuntu) with PM2 + Nginx
```bash
# on server
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs nginx
sudo npm i -g pm2
cd /var/www/localhire/server && npm ci --omit=dev
pm2 start src/server.js --name localhire-api
pm2 save && pm2 startup
```
Nginx: serve `client/dist` at `/`, reverse-proxy `/api` to the backend service listening on `${PORT}`, then enable HTTPS with Certbot (`sudo certbot --nginx`).

## 5. Release checklist
- [ ] Secrets rotated and not in git
- [ ] HTTPS everywhere, HSTS on
- [ ] S3 bucket private, CORS and IAM least privilege
- [ ] Atlas backups enabled
- [ ] Indexes created (check `autoIndex`; in production create indexes via a script or `Model.syncIndexes()` at deploy)
- [ ] Error monitoring (Sentry) on both client and server
- [ ] Uptime check on `/api/v1/health`
- [ ] Privacy policy and terms published
- [ ] Email domain SPF, DKIM, DMARC configured

## 6. Backups and recovery
Atlas continuous or scheduled snapshots; test a restore once. S3 versioning on the resumes bucket.
