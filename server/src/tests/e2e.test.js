import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app.js';
import {
  User,
  ApplicantProfile,
  Company,
  Job,
  Application,
  Notification,
  Report,
} from '../models/index.js';

const TEST_DB_URI = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI;

const VALID_PDF_BUFFER = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF\n'
);

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
  // Clear any existing test state
  await Promise.all([
    User.deleteMany({}),
    ApplicantProfile.deleteMany({}),
    Company.deleteMany({}),
    Job.deleteMany({}),
    Application.deleteMany({}),
    Notification.deleteMany({}),
    Report.deleteMany({}),
  ]);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('Rozgaar ATS - End-to-End & Security Test Suite', () => {
  // Test state variables across multi-step flow
  let applicantToken = '';
  let applicantId = '';
  let resumeId = '';

  let recruiter1Token = '';
  let recruiter1Id = '';
  let company1Id = '';
  let jobId = '';

  let recruiter2Token = '';
  let recruiter2Id = '';
  let company2Id = '';

  let adminToken = '';
  let applicationId = '';
  let reportId = '';

  // ==========================================
  // 1. AUTH & ONBOARDING
  // ==========================================
  describe('Phase 1: Multi-Role User Registration & Setup', () => {
    it('creates an admin account', async () => {
      const hash = await User.hashPassword('AdminPass123!');
      await User.create({
        name: 'Platform SuperAdmin',
        email: 'superadmin@rozgaar.in',
        passwordHash: hash,
        role: 'admin',
        emailVerified: true,
        privacyConsent: true,
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'superadmin@rozgaar.in',
          password: 'AdminPass123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('admin');
      adminToken = res.body.data.accessToken;
    });

    it('registers an applicant with explicit privacy consent', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Sunita Mehra',
          email: 'sunita.mehra@example.in',
          password: 'Password123!',
          role: 'applicant',
          privacyConsent: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('applicant');
      expect(res.body.data.accessToken).toBeDefined();
      applicantToken = res.body.data.accessToken;
      applicantId = res.body.data.user._id || res.body.data.user.id;
    });

    it('registers recruiter 1 and sets up primary company', async () => {
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Vikram Sethi',
          email: 'vikram.sethi@delhicrafts.in',
          password: 'Password123!',
          role: 'recruiter',
          privacyConsent: true,
        });

      expect(regRes.status).toBe(201);
      recruiter1Token = regRes.body.data.accessToken;
      recruiter1Id = regRes.body.data.user._id || regRes.body.data.user.id;

      // Create Company
      const compRes = await request(app)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          name: 'Delhi Heritage Handlooms',
          description: 'Authentic handcrafted textiles and apparel producer.',
          website: 'https://delhihandlooms.example.in',
          location: {
            city: 'New Delhi',
            state: 'Delhi',
            geo: {
              type: 'Point',
              coordinates: [77.209, 28.6139],
            },
          },
        });

      expect(compRes.status).toBe(201);
      expect(compRes.body.data.name).toBe('Delhi Heritage Handlooms');
      company1Id = compRes.body.data._id;
    });

    it('registers recruiter 2 (competing company for cross-tenant isolation testing)', async () => {
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Arjun Gupta',
          email: 'arjun@mumbailogistics.in',
          password: 'Password123!',
          role: 'recruiter',
          privacyConsent: true,
        });

      expect(regRes.status).toBe(201);
      recruiter2Token = regRes.body.data.accessToken;
      recruiter2Id = regRes.body.data.user._id || regRes.body.data.user.id;

      const compRes = await request(app)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${recruiter2Token}`)
        .send({
          name: 'Konkan Fast Freight',
          description: 'Coastal logistics and freight forwarding.',
          location: {
            city: 'Mumbai',
            state: 'Maharashtra',
            geo: {
              type: 'Point',
              coordinates: [72.8777, 19.076],
            },
          },
        });

      expect(compRes.status).toBe(201);
      company2Id = compRes.body.data._id;
    });
  });

  // ==========================================
  // 2. APPLICANT PROFILE & RESUME MANAGEMENT
  // ==========================================
  describe('Phase 2: Applicant Profile & Resume Flow', () => {
    it('updates applicant profile with geo location and skills', async () => {
      const res = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({
          headline: 'Senior Quality Inspector & Fabric Auditor',
          bio: '6 years testing textile durability, handloom weaving consistency, and dye migration.',
          phone: '+919811122233',
          location: {
            city: 'New Delhi',
            state: 'Delhi',
            country: 'India',
            geo: {
              type: 'Point',
              coordinates: [77.209, 28.6139],
            },
          },
          skills: ['Quality Assurance', 'Textile Audit', 'Dye Testing'],
          links: [
            { label: 'LinkedIn', url: 'https://linkedin.com/in/sunita-mehra-demo' },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.headline).toBe('Senior Quality Inspector & Fabric Auditor');
      expect(res.body.data.skills).toContain('Quality Assurance');
    });

    it('uploads a valid PDF resume verified via magic bytes', async () => {
      const res = await request(app)
        .post('/api/v1/profile/resumes')
        .set('Authorization', `Bearer ${applicantToken}`)
        .attach('resume', VALID_PDF_BUFFER, 'Sunita_Mehra_CV.pdf');

      expect(res.status).toBe(201);
      expect(res.body.data.resumes[0].filename).toBe('Sunita_Mehra_CV.pdf');
      expect(res.body.data.resumes[0].isDefault).toBe(true);
      resumeId = res.body.data.resumes[0]._id;
    });
  });

  // ==========================================
  // 3. JOB CREATION & HYPERLOCAL GEO SEARCH
  // ==========================================
  describe('Phase 3: Job Posting & Hyperlocal Proximity Search', () => {
    it('recruiter 1 posts a new open job listing with custom fields', async () => {
      const res = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          title: 'Senior Textile Quality Auditor',
          description: 'Perform rigorous quality audits on handloom woven fabric batches, ensure colorfastness and weave density standards.',
          employmentType: 'full-time',
          remote: false,
          location: {
            city: 'New Delhi',
            state: 'Delhi',
            geo: {
              type: 'Point',
              coordinates: [77.215, 28.62], // ~2 km away
            },
          },
          salary: {
            min: 40000,
            max: 55000,
            currency: 'INR',
            period: 'month',
          },
          skills: ['Quality Assurance', 'Textile Audit', 'Color Fastness'],
          customFields: {
            shiftTiming: '9:30 AM - 6:00 PM',
            inspectionToolExperience: 'Spectrophotometer certified',
          },
          status: 'open',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Senior Textile Quality Auditor');
      expect(res.body.data.status).toBe('open');
      jobId = res.body.data._id;
    });

    it('applicant searches jobs using lat/lng coordinates and finds the nearby job within 25 km', async () => {
      const res = await request(app)
        .get('/api/v1/jobs')
        .query({
          lat: 28.6139,
          lng: 77.209,
          radiusKm: 25,
          q: 'Textile',
        });

      expect(res.status).toBe(200);
      const jobs = res.body.data;
      expect(jobs.length).toBeGreaterThanOrEqual(1);
      const foundJob = jobs.find((j) => j._id === jobId);
      expect(foundJob).toBeDefined();
      expect(foundJob.distanceMeters).toBeDefined();
      expect(foundJob.distanceMeters).toBeLessThan(10000); // Under 10 km
    });

    it('applicant bookmarks the job and verifies saved jobs list', async () => {
      const saveRes = await request(app)
        .post(`/api/v1/jobs/${jobId}/save`)
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(saveRes.status).toBe(200);
      expect(saveRes.body.data.saved).toBe(true);

      const listRes = await request(app)
        .get('/api/v1/jobs/saved')
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.some((j) => j._id === jobId)).toBe(true);
    });
  });

  // ==========================================
  // 4. APPLY FLOW & RECRUITER KANBAN PIPELINE
  // ==========================================
  describe('Phase 4: Apply Flow, Kanban Pipeline & Real-Time Timeline', () => {
    it('applicant submits application with resume snapshot and cover note', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${jobId}/applications`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({
          resumeId,
          coverNote: 'I have 6 years in textile QA and would be thrilled to audit handloom production batches at Delhi Heritage Handlooms.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.stage).toBe('applied');
      expect(res.body.data.job).toBe(jobId);
      applicationId = res.body.data._id;
    });

    it('prevents duplicate application submissions to the same job (409 Conflict)', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${jobId}/applications`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({
          resumeId,
          coverNote: 'Attempting to apply again...',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('recruiter views applications on the Kanban board grouped by stage', async () => {
      const res = await request(app)
        .get(`/api/v1/jobs/${jobId}/applications`)
        .set('Authorization', `Bearer ${recruiter1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      const appOnBoard = res.body.data.find((a) => a._id === applicationId);
      expect(appOnBoard).toBeDefined();
      expect(appOnBoard.applicant.name).toBe('Sunita Mehra');
      expect(appOnBoard.stage).toBe('applied');
    });

    it('recruiter rates candidate and adds internal team notes', async () => {
      // 1. Rate candidate 5/5
      const rateRes = await request(app)
        .patch(`/api/v1/applications/${applicationId}/rating`)
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({ rating: 5 });

      expect(rateRes.status).toBe(200);
      expect(rateRes.body.data.rating).toBe(5);

      // 2. Add internal note
      const noteRes = await request(app)
        .post(`/api/v1/applications/${applicationId}/notes`)
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({ text: 'CONFIDENTIAL: Impressive laboratory fabric audit background. Shortlist for immediate interview.' });

      expect(noteRes.status).toBe(201);
      expect(Array.isArray(noteRes.body.data)).toBe(true);
      expect(noteRes.body.data.some((n) => n.text.includes('CONFIDENTIAL'))).toBe(true);
    });

    it('recruiter moves candidate to interviewing stage with an interview note', async () => {
      const res = await request(app)
        .patch(`/api/v1/applications/${applicationId}/stage`)
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          stage: 'interviewing',
          message: 'Hi Sunita, we would like to invite you for an in-person technical inspection test this Thursday at 11:00 AM.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.stage).toBe('interviewing');
    });

    it('recruiter moves candidate to offered stage with a congratulatory offer message', async () => {
      const res = await request(app)
        .patch(`/api/v1/applications/${applicationId}/stage`)
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          stage: 'offered',
          message: 'Congratulations! We are delighted to extend you an offer for Senior Textile Quality Auditor.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.stage).toBe('offered');
    });

    it('applicant checks their application detail: views live timeline with zero leak of internal notes or rating', async () => {
      const res = await request(app)
        .get(`/api/v1/applications/${applicationId}`)
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.status).toBe(200);
      const appData = res.body.data;

      expect(appData.stage).toBe('offered');
      expect(appData.stageHistory.length).toBe(3); // applied -> interviewing -> offered

      // Verify the recruiter offer message is visible
      const offerHistory = appData.stageHistory.find((h) => h.stage === 'offered');
      expect(offerHistory.message).toContain('Congratulations!');

      // CRITICAL SECURITY ASSERTION: Internal notes and rating MUST NEVER appear in applicant responses
      expect(appData.rating).toBeUndefined();
      expect(appData.notes).toBeUndefined();
    });

    it('applicant receives in-app notifications for stage transitions and marks them as read', async () => {
      const notifRes = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(notifRes.status).toBe(200);
      expect(notifRes.body.data.length).toBeGreaterThan(0);
      expect(notifRes.body.meta.unreadCount).toBeGreaterThan(0);

      const targetNotif = notifRes.body.data[0];

      // Mark single read
      const markRes = await request(app)
        .patch(`/api/v1/notifications/${targetNotif._id}/read`)
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(markRes.status).toBe(200);
      expect(markRes.body.data.readAt).toBeDefined();
    });
  });

  // ==========================================
  // 5. SECURITY & ROLE BOUNDARY ENFORCEMENT
  // ==========================================
  describe('Phase 5: Security, RBAC & Cross-Tenant Boundary Enforcement', () => {
    it('blocks applicant from accessing recruiter endpoints (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/v1/jobs/${jobId}/applications`)
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks applicant from creating a job listing (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({
          title: 'Malicious Applicant Job',
          description: 'Should be blocked immediately',
        });

      expect(res.status).toBe(403);
    });

    it('blocks recruiter from accessing admin moderation endpoints (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${recruiter1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks cross-recruiter tenant access: recruiter 2 cannot modify recruiter 1 application (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/v1/applications/${applicationId}/stage`)
        .set('Authorization', `Bearer ${recruiter2Token}`)
        .send({
          stage: 'hired',
          message: 'Hijacked move',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks unauthenticated requests to protected endpoints (401 Unauthenticated)', async () => {
      const res = await request(app)
        .get('/api/v1/profile');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });
  });

  // ==========================================
  // 6. CONTENT MODERATION & ADMIN QUEUE
  // ==========================================
  describe('Phase 6: Job Reporting & Admin Moderation Action', () => {
    it('applicant reports a job listing with a reason and description', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${jobId}/report`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({
          reason: 'misleading',
          text: 'Salary advertised differs from informal conversation.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending');
      reportId = res.body.data._id;
    });

    it('admin views reports queue and sees the reported job', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const reports = res.body.data;
      const foundReport = reports.find((r) => r._id === reportId);
      expect(foundReport).toBeDefined();
      expect(foundReport.reason).toBe('misleading');
    });

    it('admin takes action on report and force-closes the offending job', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/reports/${reportId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'action_taken',
          closeJob: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('action_taken');

      // Verify the job is now closed in the database
      const jobCheck = await Job.findById(jobId);
      expect(jobCheck.status).toBe('closed');
    });
  });

  // ==========================================
  // 7. PRIVACY, DATA EXPORT & ACCOUNT ERASURE
  // ==========================================
  describe('Phase 7: Privacy, GDPR Data Export & Right to Erasure', () => {
    it('applicant exports complete profile and application history as JSON', async () => {
      const res = await request(app)
        .get('/api/v1/profile/export')
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.account.email).toBe('sunita.mehra@example.in');
      expect(res.body.data.profile.headline).toBe('Senior Quality Inspector & Fabric Auditor');
      expect(res.body.data.applications.length).toBeGreaterThan(0);
      // Sanitized in export too
      expect(res.body.data.applications[0].notes).toBeUndefined();
    });

    it('applicant deletes their account: wipes profile/resumes and anonymizes application records', async () => {
      const deleteRes = await request(app)
        .delete('/api/v1/profile')
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(deleteRes.status).toBe(200);

      // Verify user is deleted
      const userInDb = await User.findById(applicantId);
      expect(userInDb).toBeNull();

      // Verify profile is deleted
      const profileInDb = await ApplicantProfile.findOne({ user: applicantId });
      expect(profileInDb).toBeNull();

      // Verify applications are anonymized
      const appInDb = await Application.findById(applicationId);
      expect(appInDb.coverNote).toBe('[Candidate account deleted]');

      // Verify login is rejected for the deleted account
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'sunita.mehra@example.in',
          password: 'Password123!',
        });

      expect(loginRes.status).toBe(401);
    });
  });
});
