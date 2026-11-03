import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Job } from '../models/Job.js';
import { Report } from '../models/Report.js';

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
  await Company.deleteMany({});
  await Job.deleteMany({});
  await Report.deleteMany({});
});

describe('Company & Job Management Endpoints', () => {
  let recruiterToken;
  let recruiterUser;
  let companyId;

  beforeEach(async () => {
    // Register Recruiter
    const regRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Kavita Joshi',
      email: 'kavita@sunrisediag.com',
      password: 'Password123!',
      role: 'recruiter',
      companyName: 'Sunrise Diagnostics',
      privacyConsent: true,
    });

    recruiterToken = regRes.body.data.accessToken;
    recruiterUser = regRes.body.data.user;
    companyId = recruiterUser.company;
  });

  it('GET /api/v1/companies/:id returns company details', async () => {
    const res = await request(app).get(`/api/v1/companies/${companyId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Sunrise Diagnostics');
  });

  it('PUT /api/v1/companies/:id updates company information', async () => {
    const res = await request(app)
      .put(`/api/v1/companies/${companyId}`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        description: 'Leading diagnostic center in South Delhi',
        website: 'https://sunrisediag.in',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe('Leading diagnostic center in South Delhi');
    expect(res.body.data.website).toBe('https://sunrisediag.in');
  });

  it('POST /api/v1/jobs creates a new job listing for company', async () => {
    const jobPayload = {
      title: 'Lab Technician',
      description: 'Experienced lab technician needed for biochemistry processing.',
      employmentType: 'full-time',
      remote: false,
      location: {
        city: 'New Delhi',
        state: 'Delhi',
        geo: {
          type: 'Point',
          coordinates: [77.209, 28.6139],
        },
      },
      salary: {
        min: 25000,
        max: 35000,
        currency: 'INR',
        period: 'month',
      },
      skills: ['Phlebotomy', 'Biochemistry', 'Quality Control'],
      status: 'open',
    };

    const res = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send(jobPayload);

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Lab Technician');
    expect(res.body.data.status).toBe('open');
    expect(res.body.data.publishedAt).toBeDefined();
  });

  it('GET /api/v1/jobs searches jobs by keyword and geo proximity', async () => {
    // Create an open job in Connaught Place (New Delhi: 77.2167, 28.6315)
    await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        title: 'Front Desk Receptionist',
        description: 'Manage appointments and greet patients warmly.',
        employmentType: 'full-time',
        location: {
          city: 'New Delhi',
          geo: { type: 'Point', coordinates: [77.2167, 28.6315] },
        },
        status: 'open',
      });

    // Create a job far away in Bengaluru (77.5946, 12.9716)
    await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        title: 'Clinical Data Analyst',
        description: 'Analyze diagnostics data remotely or in Bengaluru office.',
        employmentType: 'contract',
        location: {
          city: 'Bengaluru',
          geo: { type: 'Point', coordinates: [77.5946, 12.9716] },
        },
        status: 'open',
      });

    // Keyword search: "Receptionist"
    const keywordRes = await request(app).get('/api/v1/jobs?q=Receptionist');
    expect(keywordRes.status).toBe(200);
    expect(keywordRes.body.data).toHaveLength(1);
    expect(keywordRes.body.data[0].title).toBe('Front Desk Receptionist');

    // Geo search: Center near New Delhi within 25 km
    const geoRes = await request(app).get(
      '/api/v1/jobs?lat=28.6139&lng=77.2090&radiusKm=25'
    );
    expect(geoRes.status).toBe(200);
    expect(geoRes.body.data).toHaveLength(1);
    expect(geoRes.body.data[0].title).toBe('Front Desk Receptionist');
  });

  it('prevents cross-company job modification (403 Forbidden)', async () => {
    // Create job under company 1
    const jobRes = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        title: 'Ultrasound Specialist',
        description: 'Certified ultrasound doctor needed for mornings.',
        status: 'draft',
      });

    const jobId = jobRes.body.data._id;

    // Register a second recruiter with different company
    const otherRecruiter = await request(app).post('/api/v1/auth/register').send({
      name: 'Dr. Suresh Verma',
      email: 'suresh@apexhealthcare.com',
      password: 'Password123!',
      role: 'recruiter',
      companyName: 'Apex Healthcare',
      privacyConsent: true,
    });

    const otherToken = otherRecruiter.body.data.accessToken;

    // Second recruiter attempts to modify first recruiter's job
    const unauthorizedEdit = await request(app)
      .put(`/api/v1/jobs/${jobId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Hacked Title' });

    expect(unauthorizedEdit.status).toBe(403);
    expect(unauthorizedEdit.body.error.code).toBe('FORBIDDEN');
  });

  it('POST /api/v1/jobs/:id/report reports a job listing', async () => {
    const jobRes = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        title: 'Data Entry Assistant',
        description: 'Simple data entry role.',
        status: 'open',
      });

    const jobId = jobRes.body.data._id;

    // Applicant user reports the job
    const appReg = await request(app).post('/api/v1/auth/register').send({
      name: 'Nitin Kumar',
      email: 'nitin@example.com',
      password: 'Password123!',
      role: 'applicant',
      privacyConsent: true,
    });
    const applicantToken = appReg.body.data.accessToken;

    const reportRes = await request(app)
      .post(`/api/v1/jobs/${jobId}/report`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({
        reason: 'misleading',
        text: 'The salary offered differs from what was discussed.',
      });

    expect(reportRes.status).toBe(201);
    expect(reportRes.body.data.reason).toBe('misleading');
  });
});

