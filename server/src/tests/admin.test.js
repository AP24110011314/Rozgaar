import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Job } from '../models/Job.js';
import { Report } from '../models/Report.js';
import { Notification } from '../models/Notification.js';

const TEST_DB_URI = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Notifications & Admin Moderation Endpoints', () => {
  let adminToken;
  let adminUser;
  let regularToken;
  let regularUser;
  let recruiterToken;
  let recruiterUser;
  let company;
  let job;

  beforeEach(async () => {
    await User.deleteMany({});
    await Company.deleteMany({});
    await Job.deleteMany({});
    await Report.deleteMany({});
    await Notification.deleteMany({});

    // Register regular applicant
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'applicant@test.com',
        password: 'Password123!',
        name: 'Regular Applicant',
        role: 'applicant',
        privacyConsent: true,
      });
    regularToken = regRes.body.data.accessToken;
    regularUser = regRes.body.data.user;

    // Register recruiter
    const recRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'recruiter@test.com',
        password: 'Password123!',
        name: 'Recruiter User',
        role: 'recruiter',
        companyName: 'Jaipur Crafts Ltd',
        privacyConsent: true,
      });
    recruiterToken = recRes.body.data.accessToken;
    recruiterUser = recRes.body.data.user;
    company = { _id: recruiterUser.company };

    // Register admin user directly in DB
    const admin = await User.create({
      email: 'admin@rozgaar.in',
      passwordHash: 'dummyhash',
      name: 'System Administrator',
      role: 'admin',
      emailVerified: true,
      isActive: true,
    });
    adminUser = admin;

    // Login admin to generate valid token
    // Or sign access token using signAccessToken utility
    const { signAccessToken } = await import('../utils/crypto.js');
    adminToken = signAccessToken({
      userId: admin._id.toString(),
      email: admin.email,
      role: 'admin',
    });

    // Create a job
    const jobRes = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        title: 'Master Wood Carver',
        description: 'Traditional wood carving and sculpture design.',
        employmentType: 'full-time',
        status: 'open',
      });
    job = jobRes.body.data;
  });

  describe('In-App Notifications', () => {
    it('GET /api/v1/notifications lists notifications and unread counter', async () => {
      // Create sample notifications for regular user
      await Notification.create([
        {
          user: regularUser._id,
          type: 'STAGE_CHANGE',
          message: 'Your application has moved to Interviewing',
        },
        {
          user: regularUser._id,
          type: 'SYSTEM',
          message: 'Welcome to Rozgaar!',
          readAt: new Date(),
        },
      ]);

      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.unreadCount).toBe(1);
    });

    it('PATCH /api/v1/notifications/:id/read marks single notification as read', async () => {
      const notif = await Notification.create({
        user: regularUser._id,
        type: 'STAGE_CHANGE',
        message: 'Your application has moved to Offer',
      });

      const res = await request(app)
        .patch(`/api/v1/notifications/${notif._id}/read`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.readAt).toBeDefined();

      const count = await Notification.countDocuments({ user: regularUser._id, readAt: null });
      expect(count).toBe(0);
    });

    it('PATCH /api/v1/notifications/read-all marks all user notifications as read', async () => {
      await Notification.create([
        { user: regularUser._id, message: 'Notice 1' },
        { user: regularUser._id, message: 'Notice 2' },
      ]);

      const res = await request(app)
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(200);
      const count = await Notification.countDocuments({ user: regularUser._id, readAt: null });
      expect(count).toBe(0);
    });
  });

  describe('Admin Moderation RBAC & Endpoints', () => {
    it('blocks non-admin users with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('GET /api/v1/admin/stats returns aggregate platform metrics', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users.total).toBeGreaterThanOrEqual(3);
      expect(res.body.data.companies.total).toBe(1);
      expect(res.body.data.jobs.open).toBe(1);
    });

    it('GET /api/v1/admin/users lists and searches users', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .query({ q: 'Applicant' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].email).toBe('applicant@test.com');
    });

    it('PATCH /api/v1/admin/users/:id/deactivate toggles active status', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${regularUser._id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(false);

      // Reactivate
      const reactivateRes = await request(app)
        .patch(`/api/v1/admin/users/${regularUser._id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(reactivateRes.status).toBe(200);
      expect(reactivateRes.body.data.isActive).toBe(true);
    });

    it('prevents admin from deactivating their own account', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${adminUser._id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('cannot deactivate your own');
    });

    it('PATCH /api/v1/admin/jobs/:id/close forces job to close', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/jobs/${job._id}/close`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('closed');
    });

    it('manages reported jobs queue: GET /admin/reports and PATCH /admin/reports/:id', async () => {
      // Create a report
      const report = await Report.create({
        job: job._id,
        reporter: regularUser._id,
        reason: 'spam',
        text: 'Suspicious duplicate listing.',
      });

      // List reports
      const listRes = await request(app)
        .get('/api/v1/admin/reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data).toHaveLength(1);
      expect(listRes.body.data[0].reason).toBe('spam');

      // Resolve report & force close job
      const resolveRes = await request(app)
        .patch(`/api/v1/admin/reports/${report._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'action_taken',
          closeJob: true,
        });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.data.status).toBe('action_taken');

      // Verify job closed
      const updatedJob = await Job.findById(job._id);
      expect(updatedJob.status).toBe('closed');
    });
  });
});

