# 05 – REST API Specification

Base URL: `${API_PUBLIC_URL}/api/v1` (configured via environment variables)
Auth: `Authorization: Bearer <accessToken>`. Refresh token is an httpOnly cookie.

## Conventions
Success: `{ "data": ..., "meta": { "page":1, "limit":20, "total":134 } }`
Error: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }`

| HTTP | code |
|---|---|
| 400 | VALIDATION_ERROR |
| 401 | UNAUTHENTICATED |
| 403 | FORBIDDEN |
| 404 | NOT_FOUND |
| 409 | CONFLICT (duplicate application) |
| 413 | FILE_TOO_LARGE |
| 415 | UNSUPPORTED_FILE_TYPE |
| 429 | RATE_LIMITED |

## Auth
| Method | Path | Auth | Body |
|---|---|---|---|
| POST | /auth/register | – | `{name,email,password,role}` (role: applicant or recruiter) |
| POST | /auth/login | – | `{email,password}` → `{accessToken,user}` + refresh cookie |
| POST | /auth/refresh | cookie | → `{accessToken}` |
| POST | /auth/logout | cookie | clears cookie |
| GET | /auth/me | yes | current user |
| POST | /auth/forgot-password | – | `{email}` |
| POST | /auth/reset-password | – | `{token,password}` |

## Applicant profile
| Method | Path | Notes |
|---|---|---|
| GET | /profile | own profile |
| PUT | /profile | update fields |
| POST | /profile/resumes | multipart `resume` |
| PATCH | /profile/resumes/:resumeId | `{isDefault:true}` |
| DELETE | /profile/resumes/:resumeId | removes from S3 |

## Companies
| Method | Path | Role |
|---|---|---|
| POST | /companies | recruiter |
| GET | /companies/:id | public |
| PUT | /companies/:id | owner |
| POST | /companies/:id/members | owner, invite by email |

## Jobs
| Method | Path | Role |
|---|---|---|
| GET | /jobs | public; query below |
| GET | /jobs/:id | public (open) |
| POST | /jobs | recruiter |
| PUT | /jobs/:id | company member |
| PATCH | /jobs/:id/status | `{status:'open'|'closed'}` |
| DELETE | /jobs/:id | owner |
| GET | /companies/:id/jobs | recruiter (all statuses) |

**GET /jobs query**: `q`, `city`, `lat`, `lng`, `radiusKm` (default 25), `type`, `remote`, `minSalary`, `sort` (`newest|distance`), `page`, `limit` (max 50).

## Applications
| Method | Path | Role | Notes |
|---|---|---|---|
| POST | /jobs/:jobId/applications | applicant | `{resumeId, coverNote}` → 201 / 409 if duplicate |
| GET | /applications/mine | applicant | list with current stage |
| GET | /applications/:id | applicant (own) or company member | applicant view hides notes and rating |
| PATCH | /applications/:id/withdraw | applicant | |
| GET | /jobs/:jobId/applications | recruiter | grouped or filtered by `stage` |
| PATCH | /applications/:id/stage | recruiter | `{stage, message?, beforeId?, afterId?}` |
| POST | /applications/:id/notes | recruiter | `{text}` |
| PATCH | /applications/:id/rating | recruiter | `{rating}` |
| GET | /applications/:id/resume-url | recruiter or owner | `{url, expiresIn:300}` |

### Example: change stage
```http
PATCH /api/v1/applications/65f.../stage
{ "stage": "interviewing", "message": "We'd like to meet Thursday 3pm.", "afterId": "65f...abc" }
```
Response `200`:
```json
{ "data": { "id": "65f...", "stage": "interviewing", "position": 2048,
  "stageHistory": [ { "stage":"applied","at":"..." }, { "stage":"interviewing","message":"We'd like to meet Thursday 3pm.","at":"..." } ] } }
```

## Misc
| GET | /health | returns `{status:'ok'}` |
