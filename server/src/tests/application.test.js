import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Job } from '../models/Job.js';
import { Application } from '../models/Application.js';
import { ApplicantProfile } from '../models/ApplicantProfile.js';

const TEST_DB_URI = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Application, Pipeline & Kanban Endpoints', () => {
  let applicantToken;
  let applicantUser;
  let recruiterToken;
  let recruiterUser;
  let company;
  let job;
  let resumeId;

  beforeEach(async () => {
    await User.deleteMany({});
    await Company.deleteMany({});
    await Job.deleteMany({});
    await Application.deleteMany({});
    await ApplicantProfile.deleteMany({});

    // Register applicant
    const appRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'applicant@rozgaar.in',
        password: 'Password123!',
        name: 'Aarav Sharma',
        role: 'applicant',
        privacyConsent: true,
      });
    applicantToken = appRes.body.data.accessToken;
    applicantUser = appRes.body.data.user;

    // Attach mock resume to applicant profile
    const profile = await ApplicantProfile.findOne({ user: applicantUser._id });
    profile.resumes.push({
      key: 'resumes/mock-aarav-resume.pdf',
      filename: 'Aarav_Sharma_Resume.pdf',
      mime: 'application/pdf',
      size: 10240,
      isDefault: true,
    });
    await profile.save();
    resumeId = profile.resumes[0]._id.toString();

    // Register recruiter
    const recRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'recruiter@rozgaar.in',
        password: 'Password123!',
        name: 'Priya Mehra',
        role: 'recruiter',
        companyName: 'Pink City Artisans Co.',
        privacyConsent: true,
      });
    recruiterToken = recRes.body.data.accessToken;
    recruiterUser = recRes.body.data.user;
    company = { _id: recruiterUser.company };

    // Post job
    const jobRes = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        title: 'Master Weaver & Pattern Designer',
        description: 'Lead traditional handloom weaving operations in central Jaipur atelier.',
        employmentType: 'full-time',
        status: 'open',
        skills: ['Handloom', 'Textile Design', 'Pattern Making'],
      });
    job = jobRes.body.data;
  });

  it('POST /api/v1/jobs/:jobId/applications applies to open job and creates initial history', async () => {
    const res = await request(app)
      .post(`/api/v1/jobs/${job._id}/applications`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({
        resumeId,
        coverNote: 'Excited to bring 5 years of textile craft to Pink City Artisans.',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.stage).toBe('applied');
    expect(res.body.data.position).toBe(1024);
    expect(res.body.data.stageHistory).toHaveLength(1);
    expect(res.body.data.stageHistory[0].stage).toBe('applied');

    // Confirm job count incremented
    const updatedJob = await Job.findById(job._id);
    expect(updatedJob.applicationCount).toBe(1);
  });

  it('POST /api/v1/jobs/:jobId/applications prevents duplicate application (409 Conflict)', async () => {
    // First apply
    await request(app)
      .post(`/api/v1/jobs/${job._id}/applications`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({ resumeId });

    // Second apply
    const res = await request(app)
      .post(`/api/v1/jobs/${job._id}/applications`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({ resumeId });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('rejects applications to closed jobs with 400 Bad Request', async () => {
    await Job.findByIdAndUpdate(job._id, { status: 'closed' });

    const res = await request(app)
      .post(`/api/v1/jobs/${job._id}/applications`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({ resumeId });

    expect(res.status).toBe(400);
  });

  it('GET /api/v1/applications/mine lists sanitized applications for applicant', async () => {
    // Apply
    const applyRes = await request(app)
      .post(`/api/v1/jobs/${job._id}/applications`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({ resumeId });

    const appId = applyRes.body.data._id;

    // Recruiter adds internal note and rating
    await Application.findByIdAndUpdate(appId, {
      rating: 5,
      notes: [{ author: recruiterUser._id, text: 'Top candidate from referral.' }],
    });

    const res = await request(app)
      .get('/api/v1/applications/mine')
      .set('Authorization', `Bearer ${applicantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    // Crucial privacy rule: internal rating and notes MUST NOT be exposed to applicant
    expect(res.body.data[0].rating).toBeUndefined();
    expect(res.body.data[0].notes).toBeUndefined();
    expect(res.body.data[0].stage).toBe('applied');
  });

  it('PATCH /api/v1/applications/:id/withdraw allows applicant to withdraw and locks pipeline', async () => {
    const applyRes = await request(app)
      .post(`/api/v1/jobs/${job._id}/applications`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({ resumeId });

    const appId = applyRes.body.data._id;

    const withdrawRes = await request(app)
      .patch(`/api/v1/applications/${appId}/withdraw`)
      .set('Authorization', `Bearer ${applicantToken}`);

    expect(withdrawRes.status).toBe(200);
    expect(withdrawRes.body.data.stage).toBe('withdrawn');

    // Recruiter attempts to move withdrawn application -> 400 Bad Request
    const moveRes = await request(app)
      .patch(`/api/v1/applications/${appId}/stage`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ stage: 'interviewing' });

    expect(moveRes.status).toBe(400);
    expect(moveRes.body.error.message).toContain('Withdrawn applications cannot be moved');
  });

  it('PATCH /api/v1/applications/:id/stage moves stage and manages fractional position', async () => {
    const applyRes = await request(app)
      .post(`/api/v1/jobs/${job._id}/applications`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({ resumeId });

    const appId = applyRes.body.data._id;

    const res = await request(app)
      .patch(`/api/v1/applications/${appId}/stage`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        stage: 'interviewing',
        message: 'Phone screen scheduled for Thursday 3 PM.',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.stage).toBe('interviewing');
    expect(res.body.data.stageHistory).toHaveLength(2);
    expect(res.body.data.stageHistory[1].stage).toBe('interviewing');
    expect(res.body.data.stageHistory[1].message).toBe(
      'Phone screen scheduled for Thursday 3 PM.'
    );
  });

  it('POST /api/v1/applications/:id/notes and PATCH /api/v1/applications/:id/rating manage recruiter annotations', async () => {
    const applyRes = await request(app)
      .post(`/api/v1/jobs/${job._id}/applications`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({ resumeId });

    const appId = applyRes.body.data._id;

    // Add note
    const noteRes = await request(app)
      .post(`/api/v1/applications/${appId}/notes`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ text: 'Strong craftsmanship portfolio.' });

    expect(noteRes.status).toBe(201);
    expect(noteRes.body.data).toHaveLength(1);
    expect(noteRes.body.data[0].text).toBe('Strong craftsmanship portfolio.');

    // Set rating
    const ratingRes = await request(app)
      .patch(`/api/v1/applications/${appId}/rating`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ rating: 4 });

    expect(ratingRes.status).toBe(200);
    expect(ratingRes.body.data.rating).toBe(4);
  });

  it('GET /api/v1/applications/:id/resume-url generates secure download URL', async () => {
    const applyRes = await request(app)
      .post(`/api/v1/jobs/${job._id}/applications`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({ resumeId });

    const appId = applyRes.body.data._id;

    const res = await request(app)
      .get(`/api/v1/applications/${appId}/resume-url`)
      .set('Authorization', `Bearer ${recruiterToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.downloadUrl).toBeDefined();
    expect(res.body.data.filename).toBe('Aarav_Sharma_Resume.pdf');
  });
});
