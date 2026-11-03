import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app.js';
import { User } from '../models/User.js';
import { ApplicantProfile } from '../models/ApplicantProfile.js';
import { Company } from '../models/Company.js';
import { Job } from '../models/Job.js';

const TEST_DB_URI = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI;

// Valid minimal PDF buffer recognized by magic bytes
const VALID_PDF_BUFFER = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF\n'
);

// Fake text pretending to be a PDF
const FAKE_PDF_BUFFER = Buffer.from('Plain text disguised as resume.pdf');

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
  await Job.deleteMany({});
});

describe('Profile & Resume Endpoints', () => {
  let token;
  let userId;

  beforeEach(async () => {
    const regRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Rohan Mehra',
      email: 'rohan@example.com',
      password: 'Password123!',
      role: 'applicant',
      privacyConsent: true,
    });
    token = regRes.body.data.accessToken;
    userId = regRes.body.data.user._id;
  });

  it('GET /api/v1/profile returns applicant profile', async () => {
    const res = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('user', userId);
    expect(res.body.data).toHaveProperty('resumes');
  });

  it('PUT /api/v1/profile updates profile fields', async () => {
    const updatePayload = {
      headline: 'Full-stack Node.js Engineer',
      bio: '5+ years experience building local web applications.',
      phone: '+919876543210',
      skills: ['Node.js', 'MongoDB', 'React', 'Tailwind'],
      links: [{ label: 'GitHub', url: 'https://github.com/rohan' }],
    };

    const res = await request(app)
      .put('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.data.headline).toBe(updatePayload.headline);
    expect(res.body.data.skills).toContain('Node.js');
    expect(res.body.data.links[0].label).toBe('GitHub');
  });

  it('POST /api/v1/profile/resumes accepts valid PDF via magic bytes', async () => {
    const res = await request(app)
      .post('/api/v1/profile/resumes')
      .set('Authorization', `Bearer ${token}`)
      .attach('resume', VALID_PDF_BUFFER, 'resume-official.pdf');

    expect(res.status).toBe(201);
    expect(res.body.data.resumes).toHaveLength(1);
    expect(res.body.data.resumes[0].filename).toBe('resume-official.pdf');
    expect(res.body.data.resumes[0].isDefault).toBe(true);
  });

  it('POST /api/v1/profile/resumes rejects fake extension / invalid magic bytes with 415', async () => {
    const res = await request(app)
      .post('/api/v1/profile/resumes')
      .set('Authorization', `Bearer ${token}`)
      .attach('resume', FAKE_PDF_BUFFER, 'fake-resume.pdf');

    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe('UNSUPPORTED_FILE_TYPE');
  });

  it('POST /api/v1/profile/resumes rejects oversized files with 413', async () => {
    const oversizeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6 MB
    const res = await request(app)
      .post('/api/v1/profile/resumes')
      .set('Authorization', `Bearer ${token}`)
      .attach('resume', oversizeBuffer, 'huge-resume.pdf');

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('FILE_TOO_LARGE');
  });

  it('enforces maximum limit of 3 resumes', async () => {
    // Upload 3 valid resumes
    for (let i = 1; i <= 3; i++) {
      const uploadRes = await request(app)
        .post('/api/v1/profile/resumes')
        .set('Authorization', `Bearer ${token}`)
        .attach('resume', VALID_PDF_BUFFER, `resume-${i}.pdf`);
      expect(uploadRes.status).toBe(201);
    }

    // 4th upload should fail
    const fourthRes = await request(app)
      .post('/api/v1/profile/resumes')
      .set('Authorization', `Bearer ${token}`)
      .attach('resume', VALID_PDF_BUFFER, 'resume-4.pdf');

    expect(fourthRes.status).toBe(400);
    expect(fourthRes.body.error.message).toContain('Maximum of 3 resumes allowed');
  });

  it('PATCH /api/v1/profile/resumes/:id sets a default resume', async () => {
    // Upload resume 1
    const res1 = await request(app)
      .post('/api/v1/profile/resumes')
      .set('Authorization', `Bearer ${token}`)
      .attach('resume', VALID_PDF_BUFFER, 'first.pdf');

    // Upload resume 2
    const res2 = await request(app)
      .post('/api/v1/profile/resumes')
      .set('Authorization', `Bearer ${token}`)
      .attach('resume', VALID_PDF_BUFFER, 'second.pdf');

    const secondResumeId = res2.body.data.resumes[1]._id;

    const patchRes = await request(app)
      .patch(`/api/v1/profile/resumes/${secondResumeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(patchRes.status).toBe(200);
    const resumes = patchRes.body.data.resumes;
    const r1 = resumes.find((r) => r.filename === 'first.pdf');
    const r2 = resumes.find((r) => r.filename === 'second.pdf');
    expect(r1.isDefault).toBe(false);
    expect(r2.isDefault).toBe(true);
  });

  it('DELETE /api/v1/profile/resumes/:id deletes resume and updates default', async () => {
    const uploadRes = await request(app)
      .post('/api/v1/profile/resumes')
      .set('Authorization', `Bearer ${token}`)
      .attach('resume', VALID_PDF_BUFFER, 'temp.pdf');

    const resumeId = uploadRes.body.data.resumes[0]._id;

    const delRes = await request(app)
      .delete(`/api/v1/profile/resumes/${resumeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.data.resumes).toHaveLength(0);
  });

  it('manages saved jobs (save, get, unsave)', async () => {
    // Create a mock company and job
    const company = await Company.create({
      name: 'City Tech',
      slug: 'city-tech',
      owner: new mongoose.Types.ObjectId(),
    });

    const job = await Job.create({
      company: company._id,
      title: 'Junior Web Developer',
      description: 'Exciting local opportunity',
      location: { city: 'Noida', state: 'UP' },
      status: 'open',
    });

    // Save job
    const saveRes = await request(app)
      .post(`/api/v1/jobs/${job._id}/save`)
      .set('Authorization', `Bearer ${token}`);

    expect(saveRes.status).toBe(200);
    expect(saveRes.body.data.saved).toBe(true);

    // Get saved jobs
    const getRes = await request(app)
      .get('/api/v1/jobs/saved')
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data).toHaveLength(1);
    expect(getRes.body.data[0].title).toBe('Junior Web Developer');

    // Unsave job
    const unsaveRes = await request(app)
      .delete(`/api/v1/jobs/${job._id}/save`)
      .set('Authorization', `Bearer ${token}`);

    expect(unsaveRes.status).toBe(200);
    expect(unsaveRes.body.data.saved).toBe(false);
  });

  it('GET /api/v1/profile/export exports full JSON data', async () => {
    const res = await request(app)
      .get('/api/v1/profile/export')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('account');
    expect(res.body.data).toHaveProperty('profile');
    expect(res.body.data.account.email).toBe('rohan@example.com');
  });

  it('DELETE /api/v1/profile removes account and profile', async () => {
    const res = await request(app)
      .delete('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const user = await User.findById(userId);
    expect(user).toBeNull();
  });
});

