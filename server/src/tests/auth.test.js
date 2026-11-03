import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app.js';
import { User } from '../models/User.js';
import { ApplicantProfile } from '../models/ApplicantProfile.js';
import { Company } from '../models/Company.js';

const TEST_DB_URI = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

beforeEach(async () => {
  await User.deleteMany({});
  await ApplicantProfile.deleteMany({});
  await Company.deleteMany({});
});

describe('Auth API Endpoints', () => {
  const applicantPayload = {
    name: 'Aarav Sharma',
    email: 'aarav@example.com',
    password: 'Password123!',
    role: 'applicant',
    privacyConsent: true,
  };

  it('POST /api/v1/auth/register successfully registers an applicant and initializes profile', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(applicantPayload);

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('user');
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data.user.email).toBe(applicantPayload.email);
    expect(res.body.data.user.role).toBe('applicant');
    expect(res.body.data.user).not.toHaveProperty('passwordHash');

    // Check refresh token cookie is set
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('refreshToken=');
    expect(cookies[0]).toContain('HttpOnly');

    // Check ApplicantProfile was created
    const profile = await ApplicantProfile.findOne({ user: res.body.data.user._id });
    expect(profile).not.toBeNull();
  });

  it('POST /api/v1/auth/register fails on duplicate email with 409 CONFLICT', async () => {
    await request(app).post('/api/v1/auth/register').send(applicantPayload);

    const duplicateRes = await request(app)
      .post('/api/v1/auth/register')
      .send(applicantPayload);

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.error.code).toBe('CONFLICT');
  });

  it('POST /api/v1/auth/register fails if privacyConsent is not true', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...applicantPayload, privacyConsent: false });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/auth/login succeeds with valid credentials and generic error on failure', async () => {
    await request(app).post('/api/v1/auth/register').send(applicantPayload);

    // Valid login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: applicantPayload.email,
        password: applicantPayload.password,
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data).toHaveProperty('accessToken');
    expect(loginRes.body.data.user.email).toBe(applicantPayload.email);

    // Invalid password
    const failRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: applicantPayload.email,
        password: 'WrongPassword123!',
      });

    expect(failRes.status).toBe(401);
    expect(failRes.body.error.code).toBe('UNAUTHENTICATED');
    expect(failRes.body.error.message).toBe('Invalid credentials');
  });

  it('handles Refresh Token Rotation and detects Reuse Attack', async () => {
    // 1. Register to obtain initial cookie
    const regRes = await request(app).post('/api/v1/auth/register').send(applicantPayload);
    const initialCookie = regRes.headers['set-cookie'];

    // 2. Perform refresh
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', initialCookie);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data).toHaveProperty('accessToken');

    const rotatedCookie = refreshRes.headers['set-cookie'];
    expect(rotatedCookie).toBeDefined();

    // 3. Attempt to reuse initialCookie (Reuse Attack)
    const reuseRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', initialCookie);

    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.error.message).toContain('Session reuse detected');

    // 4. Confirm the entire session is invalidated; even the rotated token should now fail
    const revokedRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', rotatedCookie);

    expect(revokedRes.status).toBe(401);
  });

  it('GET /api/v1/auth/me returns current user when authorized', async () => {
    const regRes = await request(app).post('/api/v1/auth/register').send(applicantPayload);
    const token = regRes.body.data.accessToken;

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe(applicantPayload.email);
  });

  it('POST /api/v1/auth/logout clears refresh cookie and revokes session', async () => {
    const regRes = await request(app).post('/api/v1/auth/register').send(applicantPayload);
    const cookie = regRes.headers['set-cookie'];
    const token = regRes.body.data.accessToken;

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .set('Cookie', cookie);

    expect(logoutRes.status).toBe(200);

    // Refresh attempt should fail after logout
    const refreshAfterLogout = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie);

    expect(refreshAfterLogout.status).toBe(401);
  });
});

