# 03 – Architecture

## 1. High-level diagram

```
┌──────────────────┐   HTTPS / JSON + JWT    ┌───────────────────────────┐
│ React (Vite)     │ ──────────────────────► │ Express API  :4000        │
│ :5173            │ ◄────────────────────── │  routes → controllers →   │
│ TanStack Query   │                         │  services → models        │
└──────────────────┘                         └─────────┬─────────┬───────┘
                                                       │         │
                                        Mongoose       │         │ AWS SDK v3
                                                       ▼         ▼
                                              ┌──────────────┐ ┌───────────────┐
                                              │ MongoDB      │ │ S3 (private)  │
                                              │ :27017/Atlas │ │ resumes       │
                                              └──────────────┘ └───────────────┘
                                                       │
                                                       ▼
                                              Email (Nodemailer / Resend)
```

## 2. Key decisions (ADR summary)

| # | Decision | Reason |
|---|---|---|
| 1 | REST + JSON | Simple, cacheable, fits MVP |
| 2 | Access JWT (15 min) in memory + refresh token in httpOnly cookie | Limits XSS exposure of long-lived credentials |
| 3 | Multer **memory storage** then stream to S3 | No temp files on server; easy to swap drivers |
| 4 | Private S3 bucket, presigned GET URLs | Resumes are personal data; never public URLs |
| 5 | Zod for request validation | Single source of truth for shapes |
| 6 | Service layer between controllers and models | Testable business rules (stage transitions) |
| 7 | Polling or SSE for live timeline, not WebSockets (MVP) | Updates are infrequent; fewer moving parts |
| 8 | `@hello-pangea/dnd` | Maintained fork of the deprecated `react-beautiful-dnd` |
| 9 | Fractional ordering (`position` float) for Kanban | Reorder with one write instead of many |
| 10 | MongoDB `2dsphere` index for geo search | Native radius queries |

## 3. Layering rules (backend)
- **Routes**: map URL to middleware chain to controller.
- **Controllers**: parse request, call a service, shape the response. No business logic.
- **Services**: business rules (transitions, ownership checks, notifications).
- **Models**: schema, indexes, simple virtuals.
- **Middleware**: auth, role guard, validation, rate limit, error handler.

## 4. Stage change sequence

```
Recruiter UI        API                    MongoDB          Email
   │ PATCH /applications/:id/stage            │               │
   │──────────────►│ verify JWT + company membership          │
   │               │ validate transition                      │
   │               │ update stage + push stageHistory ───────►│
   │               │ enqueue notification ───────────────────►│ send
   │◄──────────────│ 200 {application}                        │
   │ optimistic UI confirmed                                  │
Applicant UI polls GET /applications/:id every 30s (or SSE) → timeline refreshes
```

## 5. Resume upload sequence
1. Client `POST /api/v1/profile/resumes` (multipart, field `resume`).
2. Multer checks size and MIME in memory.
3. Server verifies magic bytes (PDF `%PDF`, DOCX zip header).
4. Server `PutObject` to `resumes/{userId}/{uuid}.{ext}` with SSE.
5. Mongo stores `{key, filename, mime, size}` (never a public URL).
6. Download: `GET /api/v1/resumes/:key` returns a 5-minute presigned URL after an authorisation check.

## 6. Configuration
All config comes from environment variables (see `06-SETUP-MACOS.md`). Never commit `.env`.

## 7. Scalability path
- Add Redis for rate limiting and queues (BullMQ) for email.
- Add MongoDB text or Atlas Search index for better job search.
- Move to Socket.IO or SSE for real-time.
- CDN for the static frontend.
