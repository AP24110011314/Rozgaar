# 02 – Product Requirements Document

## 1. Roles
- **Applicant**: browses jobs, applies, tracks.
- **Recruiter**: belongs to a company; manages jobs and applications.
- **Admin**: moderates users, companies, and jobs.

## 2. MVP scope (Phase 1)

### Must have
| ID | Story | Acceptance criteria |
|---|---|---|
| A1 | As an applicant, I register and log in | Email and password, JWT access and refresh, validation errors shown |
| A2 | I build a profile and upload resumes | PDF/DOC/DOCX up to 5 MB, up to 3 resumes, one default |
| A3 | I search jobs by keyword, city, radius, type | Paginated, sortable by date and distance |
| A4 | I apply with a chosen resume and optional cover note | One application per job (unique), confirmation shown |
| A5 | I see all my applications and their stage | Dashboard list plus per-application timeline |
| A6 | I get an email when my status changes | Sent within 1 minute; includes optional recruiter message |
| A7 | I withdraw an application | Stage becomes `withdrawn` and recorded in history |
| R1 | As a recruiter, I register a company | Company profile with name, location, description |
| R2 | I create, edit, publish, and close jobs | Draft, open, closed states |
| R3 | I view applications for a job on a Kanban board | Columns per stage; drag to change stage |
| R4 | I open a candidate's resume securely | Presigned URL, expires in 5 minutes |
| R5 | I add notes and a 1 to 5 rating | Visible only to company members |
| R6 | I reject with an optional message | Applicant sees the message in the timeline |

### Should have
- Recruiter invites teammates to the company.
- Saved jobs for applicants.
- Email verification.

### Won't have (MVP)
Resume parsing with AI, payments, calendar scheduling, chat, mobile app.

## 3. Pipeline stages

`applied → reviewing → interviewing → offered → hired`, plus terminal `rejected` and `withdrawn`.

Rules:
- Recruiters can move forward, backward, or to `rejected` at any time.
- Applicants can only move to `withdrawn`.
- Every transition appends to `stageHistory` with who, when, and note.

## 4. Non-functional requirements
| Area | Requirement |
|---|---|
| Performance | API p95 under 300 ms for list endpoints at 10k jobs |
| Availability | 99% (MVP) |
| Security | See 09-SECURITY.md |
| Accessibility | WCAG 2.1 AA for core flows; Kanban must offer a keyboard or menu alternative to drag |
| Browser support | Last 2 versions of Chrome, Safari, Firefox, Edge |
| Responsive | 360 px and up |

## 5. Key user flows
1. **Apply**: Browse → Job detail → Apply (pick resume) → Confirmation → Dashboard shows `applied`.
2. **Triage**: Recruiter opens Board → drags card to `interviewing` → API writes history → email sent → applicant timeline updates.

## 6. Out of scope data
No collection of age, photo, marital status, or religion.
