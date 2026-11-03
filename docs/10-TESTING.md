# 10 – Testing Strategy

## Tools
| Scope | Tool |
|---|---|
| Server unit and integration | Vitest + Supertest + `mongodb-memory-server` (no Docker; downloads a mongod binary) |
| Client components | Vitest + React Testing Library + jsdom |
| API mocking (client) | MSW |
| End-to-end | Playwright (runs natively on macOS) |
| Lint and format | ESLint + Prettier |

## Test pyramid
- **Unit (many):** stage transition rules, position calculation, serializers, validators.
- **Integration (some):** each route with real Mongoose against in-memory MongoDB.
- **E2E (few):** golden paths.

## Must-have test cases

### Auth
- Register, login, refresh rotation, reuse of old refresh token rejected, logout clears cookie.

### Authorisation
- Applicant cannot read another applicant's application (403/404).
- Recruiter of company A cannot change stage for company B's application.
- Applicant response never contains `notes` or `rating`.

### Applications
- Duplicate apply returns 409.
- Apply to a closed job returns 409 or 400.
- Stage change appends history and triggers mail (mock mail service).
- Withdrawn application cannot be moved by recruiter.
- Position calculation between two neighbours returns the midpoint.

### Uploads
- File over 5 MB returns 413.
- Renamed `.exe` with `.pdf` extension returns 415.
- Valid PDF is stored and key is saved.

### Search
- Radius filter returns only jobs inside the radius.
- Pagination and sort.

## Example integration test
```js
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../app.js';

let mongod;
beforeAll(async () => { mongod = await MongoMemoryServer.create(); await mongoose.connect(mongod.getUri()); });
afterAll(async () => { await mongoose.disconnect(); await mongod.stop(); });

describe('auth', () => {
  it('registers and logs in', async () => {
    await request(app).post('/api/v1/auth/register')
      .send({ name: 'A', email: 'a@x.com', password: 'Passw0rd!x', role: 'applicant' }).expect(201);
    const res = await request(app).post('/api/v1/auth/login')
      .send({ email: 'a@x.com', password: 'Passw0rd!x' }).expect(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });
});
```
Set `NODE_ENV=test` and test env vars in `vitest.config.js` (`test.env`).

## E2E golden paths (Playwright)
1. Recruiter registers → creates company → posts job → job appears in public search.
2. Applicant registers → uploads resume → applies → dashboard shows "Applied".
3. Recruiter drags card to Interviewing → applicant timeline shows the change after refresh.

## CI (GitHub Actions, no Docker needed)
Steps: checkout → setup-node (LTS) → `npm ci` in server and client → lint → test → build client. Cache npm.

## Coverage targets
Services 85%+, middleware 90%+, overall 70%+. Do not chase UI coverage; protect critical flows.
