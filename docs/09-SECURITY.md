# 09 – Security and Privacy

## Authentication
- Hash passwords with **bcrypt** (cost 12) or argon2id. Minimum 8 characters, check against common-password list.
- Access JWT: 15 min, held in memory. Refresh token: 7 days, `httpOnly; Secure; SameSite=Lax` cookie, **rotated on every use**, stored hashed (`refreshTokenHash`). Reuse of an old refresh token invalidates the session.
- Rate-limit `/auth/*` strictly (e.g. 10 requests per 15 min per IP).
- Generic login error ("Invalid credentials") to prevent user enumeration.
- Email verification and password reset use single-use, hashed, short-lived tokens (1 hour).

## Authorisation (the most common ATS bug)
| Resource | Rule |
|---|---|
| Application (applicant) | `application.applicant === req.user.id` |
| Application (recruiter) | `application.company === req.user.company` |
| Job edit | user belongs to `job.company` |
| Resume download | owner, **or** recruiter of a company the applicant applied to, using the key stored on the application |
| Notes and rating | never returned to applicants |
Always derive `company` from the authenticated user or the DB record, never from the request body.

## Input hardening
- Validate every body, query, and param with Zod. Reject unknown fields (`.strict()`).
- Prevent NoSQL operator injection: validated string types only, and consider `express-mongo-sanitize` (check Express 5 compatibility) or strip keys starting with `$` or containing `.`.
- Escape or sanitise rich text. Store job descriptions as plain text or Markdown and render safely; if HTML is allowed, sanitise with DOMPurify (client) and `sanitize-html` (server).
- Limit JSON body size (100 kb).

## File upload safety
- Size limit 5 MB; extensions limited to PDF and DOCX.
- Verify content by magic bytes (`file-type`), not by `Content-Type`.
- Generate server-side keys (UUID). Never use the client filename in a path.
- Store in a private bucket; serve only presigned URLs with 5-minute expiry and `Content-Disposition: attachment`.
- Optional: scan with ClamAV (Homebrew-installable, no Docker) or a cloud scanning service before making the file available to recruiters.

## Web security
- `helmet()` defaults; strict CORS to a single origin.
- Cookies: `Secure` in production, `SameSite=Lax`. For cross-site deployments (frontend and API on different registrable domains) use `SameSite=None; Secure` and add CSRF protection on `/auth/refresh`.
- Do not log tokens, passwords, or resume content.
- `npm audit` in CI; Dependabot or Renovate for updates.

## Privacy and compliance
Applicable laws depend on where you operate. For India, review the Digital Personal Data Protection Act, 2023 and its rules; for EU/UK users, GDPR. Get legal advice before launch.
- Consent checkbox on registration and on first apply, linking to the privacy policy.
- Provide **data export** and **delete account** endpoints; deleting removes profile, resumes (S3), and anonymises applications.
- Retention: auto-delete applicant data for closed jobs after a defined period (for example 12 months).
- Collect minimal data; no age, photo, or marital status fields.
- Employers must be told they are responsible for how they use candidate data.

## Abuse and moderation
- Report job button; admin review queue.
- Flag jobs requesting payment from applicants (common scam).
- Rate-limit job creation for new companies.

## OWASP Top 10 checklist
- [ ] Broken access control tests for every route
- [ ] Cryptographic failures: HTTPS only, secrets in env, bcrypt
- [ ] Injection: Zod and sanitisation
- [ ] Insecure design: threat model reviewed per feature
- [ ] Security misconfiguration: helmet, no stack traces in production
- [ ] Vulnerable components: audit in CI
- [ ] Identification failures: rate limits, rotation, lockout
- [ ] Integrity: lockfile committed, CI from clean install
- [ ] Logging and monitoring: structured logs, alert on 5xx spikes
- [ ] SSRF: no server-side fetching of user URLs (portfolio links are only rendered as links with `rel="noopener noreferrer"`)
