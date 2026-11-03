# 01 – Research

> Note: figures marked *(verify)* are commonly cited industry claims. Confirm them against a current source before putting them in a pitch deck or investor material.

## 1. Problem statement

Local hiring is fragmented. Small businesses lack tooling and reach; applicants lack visibility. Both sides lose time.

### Employer pain points
| Pain | Detail | Product response |
|---|---|---|
| Buried on large boards | SMB listings compete with funded corporate postings | Geo-first search and a local-only feed |
| Inbox chaos | Resumes arrive at `jobs@company.com` and get lost | Central pipeline with one record per application |
| Admin overload | Downloading PDFs, scheduling by email *(the "70% of time" figure is unverified)* | Kanban board, status templates, notes |
| No structured evaluation | No scoring or filtering | Ratings, tags, notes, stage filters |
| Cost | Paid job boards and enterprise ATS are expensive for 1 to 20 person shops | Free or low-cost tier |

### Applicant pain points
| Pain | Detail | Product response |
|---|---|---|
| Ghosting | No signal after applying | Status timeline plus email notification on every change |
| Scattered tracking | Spreadsheets, emails, forms | Single applications dashboard |
| Resume version confusion | Unclear which resume went where | Application stores a snapshot reference to the exact resume file |
| Static profiles | Few places for portfolio links | Profile with links and multiple resumes |

## 2. Competitive landscape (verify current pricing and features)

| Product | Strength | Gap for local SMBs |
|---|---|---|
| Indeed / LinkedIn | Huge reach | Noise, sponsored-ad dominance, cost |
| Workable / Lever / Greenhouse | Powerful ATS | Priced and designed for mid-market and enterprise |
| Breezy HR / Recruitee / Zoho Recruit | Cheaper ATS | Still not community-focused; no applicant-side tracking |
| Craigslist / Facebook groups | Local, free | No tracking, spam, no structure |
| Google Forms + Sheets | Free | Manual, no notifications, no applicant view |

**Differentiators**
1. Local-first discovery (city and radius).
2. Two-sided transparency: applicants see the same pipeline stage employers set.
3. Zero-setup for a 3-person business.
4. Applicant-owned dashboard across all employers.

## 3. Personas

**Priya, owner of a 6-person bakery.** Posts 2 jobs a year, has no HR staff, uses WhatsApp and email. Needs a 5-minute posting flow and a simple board.

**Rahul, 22, recent graduate.** Applies to 30+ places. Wants to know where he stands and reuse his resume.

**Meena, office manager at a 40-person clinic.** Hires part-time, needs filtering, notes, and sharing a board with 2 colleagues.

## 4. Key product principles
- Status change always notifies the applicant (cannot be disabled in the MVP).
- Rejection is a first-class stage, with an optional message.
- Mobile-friendly: many local applicants apply from phones.
- Data minimisation: collect only what hiring requires.

## 5. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Cold start (no jobs, no applicants) | High | Launch in one city; recruit 20 employers manually first |
| Spam or fake postings | Medium | Email verification, rate limits, report button, admin moderation |
| Resume privacy | High | Private bucket, presigned URLs, access checks, delete on request |
| Bias and discrimination | Medium | No photo or age fields; optional anonymised review mode (roadmap) |
| Legal (data protection) | High | Consent, retention policy, export and delete endpoints (see 09-SECURITY.md) |
| Drag-and-drop library | Low | `react-beautiful-dnd` is deprecated. Use `@hello-pangea/dnd` (maintained fork, same API) or `dnd-kit` |

## 6. Success metrics
- Time to post first job under 5 minutes.
- Percentage of applications that receive a status change within 7 days (target above 80%).
- Applicant return rate within 14 days.
- Employer weekly active rate.

## 7. Open questions
- Free for applicants forever? Employer pricing model (per active job, flat monthly)?
- Which first city or region?
- Languages (English, Telugu, Hindi)? i18n should be planned early.
