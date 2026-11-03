# 12 – Roadmap

## Phase 0: Foundations (Week 1)
- [ ] Repo, lint, prettier, env validation
- [ ] Express app skeleton, health route, error handling
- [ ] Mongo connection, models and indexes
- [ ] Vite app, routing, Tailwind, axios client

## Phase 1: Auth and profiles (Week 2)
- [ ] Register, login, refresh rotation, logout
- [ ] Role guards, protected routes
- [ ] Applicant profile CRUD
- [ ] Resume upload (local driver) with magic-byte check

## Phase 2: Jobs (Week 3)
- [ ] Company creation
- [ ] Job CRUD and status changes
- [ ] Public search: keyword, city, radius, filters, pagination
- [ ] Job detail page

## Phase 3: Applications and pipeline (Week 4 to 5)
- [ ] Apply flow with resume selection
- [ ] Applicant dashboard and detail timeline
- [ ] Recruiter Kanban board with optimistic drag-and-drop
- [ ] Stage change service, history, rejection message
- [ ] Notes and rating
- [ ] Email notifications on stage change

## Phase 4: Hardening (Week 6)
- [ ] S3 storage driver, presigned downloads
- [ ] Rate limits, security headers, authorisation test suite
- [ ] Email verification, password reset
- [ ] Accessibility pass (keyboard Kanban alternative)
- [ ] E2E tests, CI

## Phase 5: Launch (Week 7)
- [ ] Deploy API, client, Atlas, S3
- [ ] Privacy policy, terms, data export and delete
- [ ] Seed with 10 to 20 real local employers
- [ ] Feedback loop and analytics

## Post-MVP backlog
| Priority | Feature |
|---|---|
| High | Team members and shared boards |
| High | Email templates and bulk status updates |
| High | SSE or Socket.IO real-time updates |
| Medium | Interview scheduling (calendar links) |
| Medium | Saved searches and job alerts |
| Medium | Telugu and Hindi localisation |
| Medium | Anonymised review mode |
| Low | Resume parsing |
| Low | Employer analytics (time-in-stage, funnel) |
| Low | Paid tiers (Stripe or Razorpay) |

## Definition of done (per feature)
Code reviewed, tests added, API doc updated, accessibility checked, no new lint or audit errors.
