import fs from 'node:fs';
import path from 'node:path';
import { connectDB, disconnectDB } from './connect.js';
import {
  User,
  ApplicantProfile,
  Company,
  Job,
  Application,
  Notification,
  Report,
} from '../models/index.js';
import { env } from '../config/env.js';

const MOCK_PDF_BUFFER = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n'
);

export async function seedDatabase() {
  if (env.SEED_ALLOW !== 'true') {
    console.error('❌ Seeding aborted: SEED_ALLOW must be set to "true" in environment to run the database seeder.');
    process.exit(1);
  }

  console.log('🌱 Starting Rozgaar database seeding...');
  await connectDB();

  // 1. Ensure upload directory and sample files exist
  const uploadDir = path.resolve(env.LOCAL_UPLOAD_DIR);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const sampleResumes = [
    { key: 'mock-resume-aarav.pdf', filename: 'Aarav_Sharma_Resume.pdf' },
    { key: 'mock-resume-priya.pdf', filename: 'Priya_Patel_CV.pdf' },
    { key: 'mock-resume-kabir.pdf', filename: 'Kabir_Mehta_Resume.pdf' },
  ];

  for (const resume of sampleResumes) {
    const filePath = path.join(uploadDir, resume.key);
    fs.writeFileSync(filePath, MOCK_PDF_BUFFER);
  }
  console.log('📄 Sample resume PDF files created in uploads directory.');

  // 2. Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    ApplicantProfile.deleteMany({}),
    Company.deleteMany({}),
    Job.deleteMany({}),
    Application.deleteMany({}),
    Notification.deleteMany({}),
    Report.deleteMany({}),
  ]);
  console.log('🧹 Cleared existing database records.');

  // 3. Create Admin User
  const adminPasswordHash = await User.hashPassword('AdminPass123!');
  const adminUser = await User.create({
    name: 'Admin Moderator',
    email: 'admin@rozgaar.in',
    passwordHash: adminPasswordHash,
    role: 'admin',
    emailVerified: true,
    privacyConsent: true,
    privacyConsentAt: new Date(),
  });
  console.log('👑 Admin user created: admin@rozgaar.in');

  // 4. Create Recruiter Users & Companies
  const recruiterPasswordHash = await User.hashPassword('RecruiterPass123!');

  // Recruiter 1: Jaipur
  const recruiterJaipur = await User.create({
    name: 'Rajesh Sharma',
    email: 'recruiter.jaipur@rozgaar.in',
    passwordHash: recruiterPasswordHash,
    role: 'recruiter',
    emailVerified: true,
    privacyConsent: true,
  });

  const companyJaipur = await Company.create({
    name: 'Pink City Artisans & Crafts',
    slug: 'pink-city-artisans',
    description: 'Heritage handloom textile, block printing, and handcrafted merchandise hub connecting Rajasthan artisans with nationwide retail.',
    website: 'https://pinkcityartisans.example.in',
    location: {
      city: 'Jaipur',
      state: 'Rajasthan',
      geo: {
        type: 'Point',
        coordinates: [75.7873, 26.9124], // [lng, lat]
      },
    },
    owner: recruiterJaipur._id,
    members: [{ user: recruiterJaipur._id, role: 'owner' }],
  });

  recruiterJaipur.company = companyJaipur._id;
  await recruiterJaipur.save();

  // Recruiter 2: Indore
  const recruiterIndore = await User.create({
    name: 'Pooja Verma',
    email: 'recruiter.indore@rozgaar.in',
    passwordHash: recruiterPasswordHash,
    role: 'recruiter',
    emailVerified: true,
    privacyConsent: true,
  });

  const companyIndore = await Company.create({
    name: 'Malwa Express Logistics',
    slug: 'malwa-express-logistics',
    description: 'Hyperlocal warehousing, cold-chain aggregation, and middle-mile fleet supply network across central India.',
    website: 'https://malwalogistics.example.in',
    location: {
      city: 'Indore',
      state: 'Madhya Pradesh',
      geo: {
        type: 'Point',
        coordinates: [75.8577, 22.7196], // [lng, lat]
      },
    },
    owner: recruiterIndore._id,
    members: [{ user: recruiterIndore._id, role: 'owner' }],
  });

  recruiterIndore.company = companyIndore._id;
  await recruiterIndore.save();

  // Recruiter 3: Bengaluru
  const recruiterBengaluru = await User.create({
    name: 'Vikram Patel',
    email: 'recruiter.bengaluru@rozgaar.in',
    passwordHash: recruiterPasswordHash,
    role: 'recruiter',
    emailVerified: true,
    privacyConsent: true,
  });

  const companyBengaluru = await Company.create({
    name: 'Kaveri Retail Solutions',
    slug: 'kaveri-retail-solutions',
    description: 'Omnichannel POS hardware, automated inventory management, and store checkout infrastructure for neighborhood supermarkets.',
    website: 'https://kaveriretail.example.in',
    location: {
      city: 'Bengaluru',
      state: 'Karnataka',
      geo: {
        type: 'Point',
        coordinates: [77.5946, 12.9716], // [lng, lat]
      },
    },
    owner: recruiterBengaluru._id,
    members: [{ user: recruiterBengaluru._id, role: 'owner' }],
  });

  recruiterBengaluru.company = companyBengaluru._id;
  await recruiterBengaluru.save();

  console.log('🏢 3 Companies & Recruiter accounts created.');

  // 5. Create Applicant Users & Profiles
  const applicantPasswordHash = await User.hashPassword('ApplicantPass123!');

  // Applicant 1: Aarav Sharma (Indore)
  const applicantAarav = await User.create({
    name: 'Aarav Sharma',
    email: 'applicant.aarav@rozgaar.in',
    passwordHash: applicantPasswordHash,
    role: 'applicant',
    emailVerified: true,
    privacyConsent: true,
  });

  await ApplicantProfile.create({
    user: applicantAarav._id,
    headline: 'Warehouse Operations Lead & Inventory Dispatch Specialist',
    bio: '5+ years managing cross-docking operations, SAP warehouse inventory, and delivery route dispatch in central India supply networks.',
    phone: '+91 98765 43210',
    location: {
      city: 'Indore',
      state: 'Madhya Pradesh',
      country: 'India',
      geo: { type: 'Point', coordinates: [75.8577, 22.7196] },
    },
    skills: ['Warehouse Operations', 'Inventory Management', 'ERP', 'Dispatch Routing', 'Fleet Management'],
    links: [
      { label: 'LinkedIn', url: 'https://linkedin.com/in/aarav-sharma-demo' },
      { label: 'Supply Chain Portfolio', url: 'https://aarav-logistics.example.in' },
    ],
    resumes: [
      {
        key: 'mock-resume-aarav.pdf',
        filename: 'Aarav_Sharma_Resume.pdf',
        mime: 'application/pdf',
        size: 10240,
        isDefault: true,
        uploadedAt: new Date(),
      },
    ],
  });

  // Applicant 2: Priya Patel (Jaipur)
  const applicantPriya = await User.create({
    name: 'Priya Patel',
    email: 'applicant.priya@rozgaar.in',
    passwordHash: applicantPasswordHash,
    role: 'applicant',
    emailVerified: true,
    privacyConsent: true,
  });

  await ApplicantProfile.create({
    user: applicantPriya._id,
    headline: 'Textile Quality Assurance Lead & Production Coordinator',
    bio: 'Specialized in handloom weave inspection, fabric batch audit, natural dye consistency QA, and artisan vendor relations in Jaipur.',
    phone: '+91 98123 45678',
    location: {
      city: 'Jaipur',
      state: 'Rajasthan',
      country: 'India',
      geo: { type: 'Point', coordinates: [75.7873, 26.9124] },
    },
    skills: ['Quality Assurance', 'Textile Manufacturing', 'Fabric Inspection', 'Vendor Coordination', 'Six Sigma'],
    links: [
      { label: 'Design Portfolio', url: 'https://priyapatel.design.example.in' },
    ],
    resumes: [
      {
        key: 'mock-resume-priya.pdf',
        filename: 'Priya_Patel_CV.pdf',
        mime: 'application/pdf',
        size: 12400,
        isDefault: true,
        uploadedAt: new Date(),
      },
    ],
  });

  // Applicant 3: Kabir Mehta (Bengaluru)
  const applicantKabir = await User.create({
    name: 'Kabir Mehta',
    email: 'applicant.kabir@rozgaar.in',
    passwordHash: applicantPasswordHash,
    role: 'applicant',
    emailVerified: true,
    privacyConsent: true,
  });

  await ApplicantProfile.create({
    user: applicantKabir._id,
    headline: 'Store Operations Supervisor & Retail POS Hardware Specialist',
    bio: 'Experienced supermarket operations specialist with deep hands-on expertise in touchscreen POS terminals, barcode scanners, and customer support.',
    phone: '+91 98234 56789',
    location: {
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      geo: { type: 'Point', coordinates: [77.5946, 12.9716] },
    },
    skills: ['Store Management', 'POS Hardware', 'Hardware Troubleshooting', 'Customer Relations', 'Team Leadership'],
    links: [
      { label: 'LinkedIn', url: 'https://linkedin.com/in/kabir-mehta-demo' },
    ],
    resumes: [
      {
        key: 'mock-resume-kabir.pdf',
        filename: 'Kabir_Mehta_Resume.pdf',
        mime: 'application/pdf',
        size: 15300,
        isDefault: true,
        uploadedAt: new Date(),
      },
    ],
  });

  console.log('👤 3 Applicant profiles & resumes created.');

  // 6. Create Jobs
  const now = Date.now();
  const dayMs = 86400000;

  // Job 1: Pink City Artisans - Quality Control Lead
  const job1 = await Job.create({
    company: companyJaipur._id,
    title: 'Quality Control Lead - Handloom & Apparel',
    description: 'We are seeking a meticulous Quality Control Lead to inspect incoming block-printed apparel and handloom fabrics. You will work directly with our master artisans in Sanganer and Bagru, implement standard defect rating criteria, coordinate batch reworks, and certify exports.',
    employmentType: 'full-time',
    remote: false,
    location: {
      city: 'Jaipur',
      state: 'Rajasthan',
      geo: { type: 'Point', coordinates: [75.7873, 26.9124] },
    },
    salary: { min: 35000, max: 48000, currency: 'INR', period: 'month' },
    skills: ['Quality Assurance', 'Textile Manufacturing', 'Fabric Inspection', 'Vendor Coordination'],
    customFields: new Map([
      ['shift', 'Day Shift (9:00 AM - 6:00 PM)'],
      ['experienceRequired', '3-5 years in textile QA'],
      ['certificationPreferred', 'ISO 9001 internal auditor'],
    ]),
    status: 'open',
    publishedAt: new Date(now - 10 * dayMs),
    expiresAt: new Date(now + 30 * dayMs),
    applicationCount: 2,
  });

  // Job 2: Pink City Artisans - Digital Cataloguer (Remote friendly)
  const job2 = await Job.create({
    company: companyJaipur._id,
    title: 'Digital Cataloguer & E-Commerce Associate',
    description: 'Help bring heritage artisan crafts to online marketplaces. You will photograph textile batches, write descriptive product tags in Hindi and English, manage SKU inventory on our portal, and coordinate dispatch packaging.',
    employmentType: 'full-time',
    remote: true,
    location: {
      city: 'Jaipur',
      state: 'Rajasthan',
      geo: { type: 'Point', coordinates: [75.7873, 26.9124] },
    },
    salary: { min: 25000, max: 35000, currency: 'INR', period: 'month' },
    skills: ['E-Commerce', 'Product Photography', 'Inventory Cataloguing', 'Content Writing'],
    customFields: new Map([
      ['setup', 'Remote-friendly with monthly Jaipur studio visit'],
      ['languages', 'Hindi and English'],
    ]),
    status: 'open',
    publishedAt: new Date(now - 8 * dayMs),
    expiresAt: new Date(now + 25 * dayMs),
    applicationCount: 1,
  });

  // Job 3: Malwa Express Logistics - Warehouse Supervisor (Indore)
  const job3 = await Job.create({
    company: companyIndore._id,
    title: 'Warehouse Operations Supervisor',
    description: 'Lead receiving, cross-docking, and inventory dispatch at our Vijay Nagar regional logistics hub. You will supervise a team of 15 logistics associates, ensure strict inventory hygiene, and oversee 99.8% on-time dispatch dispatch metrics.',
    employmentType: 'full-time',
    remote: false,
    location: {
      city: 'Indore',
      state: 'Madhya Pradesh',
      geo: { type: 'Point', coordinates: [75.8577, 22.7196] },
    },
    salary: { min: 32000, max: 45000, currency: 'INR', period: 'month' },
    skills: ['Warehouse Operations', 'Inventory Management', 'ERP', 'Dispatch Routing', 'Team Leadership'],
    customFields: new Map([
      ['shift', 'Rotational (Morning / Evening)'],
      ['warehouseAreaSqFt', '25,000 sq ft'],
    ]),
    status: 'open',
    publishedAt: new Date(now - 7 * dayMs),
    expiresAt: new Date(now + 28 * dayMs),
    applicationCount: 2,
  });

  // Job 4: Malwa Express Logistics - Fleet Coordinator (Indore)
  const job4 = await Job.create({
    company: companyIndore._id,
    title: 'Fleet Coordinator & Route Planner',
    description: 'Coordinate 30+ commercial carrier vehicles across Madhya Pradesh and Gujarat corridors. Monitor live GPS telematics, enforce driver rest periods, and minimize trip turnaround time.',
    employmentType: 'contract',
    remote: false,
    location: {
      city: 'Indore',
      state: 'Madhya Pradesh',
      geo: { type: 'Point', coordinates: [75.8577, 22.7196] },
    },
    salary: { min: 28000, max: 38000, currency: 'INR', period: 'month' },
    skills: ['Fleet Management', 'Route Optimization', 'GPS Telematics', 'Vendor Management'],
    customFields: new Map([
      ['shift', 'Early Shift (6:00 AM - 2:30 PM)'],
    ]),
    status: 'open',
    publishedAt: new Date(now - 5 * dayMs),
    expiresAt: new Date(now + 20 * dayMs),
    applicationCount: 1,
  });

  // Job 5: Kaveri Retail Solutions - Retail POS Specialist (Bengaluru)
  const job5 = await Job.create({
    company: companyBengaluru._id,
    title: 'Retail POS Field Support Specialist',
    description: 'Deploy, configure, and troubleshoot touchscreen point-of-sale systems, barcode scanners, and receipt printers for neighborhood grocery chains in Bengaluru. Provide prompt onsite merchant resolution.',
    employmentType: 'full-time',
    remote: false,
    location: {
      city: 'Bengaluru',
      state: 'Karnataka',
      geo: { type: 'Point', coordinates: [77.5946, 12.9716] },
    },
    salary: { min: 38000, max: 52000, currency: 'INR', period: 'month' },
    skills: ['POS Hardware', 'Hardware Troubleshooting', 'Customer Support', 'Networking'],
    customFields: new Map([
      ['allowance', 'Two-wheeler fuel & mobile reimbursement provided'],
      ['territory', 'South Bengaluru'],
    ]),
    status: 'open',
    publishedAt: new Date(now - 3 * dayMs),
    expiresAt: new Date(now + 35 * dayMs),
    applicationCount: 1,
  });

  // Job 6: Archived / Closed job
  const job6 = await Job.create({
    company: companyJaipur._id,
    title: 'Seasonal Handloom Weaving Apprentice',
    description: 'Apprenticeship program for traditional block printing and loom set up. Position closed for season.',
    employmentType: 'internship',
    remote: false,
    location: {
      city: 'Jaipur',
      state: 'Rajasthan',
      geo: { type: 'Point', coordinates: [75.7873, 26.9124] },
    },
    salary: { min: 14000, max: 18000, currency: 'INR', period: 'month' },
    skills: ['Block Printing', 'Handloom Weaving'],
    customFields: new Map(),
    status: 'closed',
    publishedAt: new Date(now - 60 * dayMs),
    expiresAt: new Date(now - 10 * dayMs),
    applicationCount: 0,
  });

  console.log('💼 6 Job listings created (5 open, 1 closed).');

  // 7. Create Applications across Kanban Stages
  // App 1: Priya -> Job 1 (Quality Control Lead) -> 'offered'
  const app1 = await Application.create({
    job: job1._id,
    applicant: applicantPriya._id,
    company: companyJaipur._id,
    resume: { key: 'mock-resume-priya.pdf', filename: 'Priya_Patel_CV.pdf' },
    coverNote: 'With over 5 years overseeing handloom quality audit in Sanganer, I am confident in upholding Pink City Artisans high defect standards.',
    stage: 'offered',
    position: 1024,
    rating: 5,
    stageHistory: [
      { stage: 'applied', at: new Date(now - 6 * dayMs) },
      { stage: 'reviewing', changedBy: recruiterJaipur._id, message: 'Strong background in textile inspection.', at: new Date(now - 4 * dayMs) },
      { stage: 'interviewing', changedBy: recruiterJaipur._id, message: 'In-person practical weave defect test scheduled for tomorrow.', at: new Date(now - 2 * dayMs) },
      { stage: 'offered', changedBy: recruiterJaipur._id, message: 'Congratulations Priya! We are pleased to extend you an offer for Quality Control Lead.', at: new Date(now - 1 * dayMs) },
    ],
    notes: [
      { author: recruiterJaipur._id, text: 'Scored 98% on dye defect inspection. Highly recommended.', at: new Date(now - 2 * dayMs) },
    ],
  });

  // App 2: Kabir -> Job 1 (Quality Control Lead) -> 'rejected'
  const app2 = await Application.create({
    job: job1._id,
    applicant: applicantKabir._id,
    company: companyJaipur._id,
    resume: { key: 'mock-resume-kabir.pdf', filename: 'Kabir_Mehta_Resume.pdf' },
    coverNote: 'Interested in transitioning from retail store operations into quality control.',
    stage: 'rejected',
    position: 1024,
    rating: 2,
    stageHistory: [
      { stage: 'applied', at: new Date(now - 5 * dayMs) },
      { stage: 'reviewing', changedBy: recruiterJaipur._id, message: 'Reviewing background against role requirements.', at: new Date(now - 3 * dayMs) },
      { stage: 'rejected', changedBy: recruiterJaipur._id, message: 'Thank you for your interest. We are seeking candidates with specific textile manufacturing experience for this senior role.', at: new Date(now - 1 * dayMs) },
    ],
    notes: [
      { author: recruiterJaipur._id, text: 'Great attitude, but lacking textile QA background.', at: new Date(now - 3 * dayMs) },
    ],
  });

  // App 3: Aarav -> Job 3 (Warehouse Operations Supervisor) -> 'interviewing'
  const app3 = await Application.create({
    job: job3._id,
    applicant: applicantAarav._id,
    company: companyIndore._id,
    resume: { key: 'mock-resume-aarav.pdf', filename: 'Aarav_Sharma_Resume.pdf' },
    coverNote: 'I have 5 years managing fast-paced fulfillment operations in Indore and would love to streamline operations at Malwa Express Logistics.',
    stage: 'interviewing',
    position: 1024,
    rating: 4,
    stageHistory: [
      { stage: 'applied', at: new Date(now - 4 * dayMs) },
      { stage: 'reviewing', changedBy: recruiterIndore._id, message: 'Profile matches our regional warehouse requirements.', at: new Date(now - 2 * dayMs) },
      { stage: 'interviewing', changedBy: recruiterIndore._id, message: 'Interview scheduled at Vijay Nagar depot on Friday at 3:00 PM.', at: new Date(now - 1 * dayMs) },
    ],
    notes: [
      { author: recruiterIndore._id, text: 'Solid experience with inventory dispatch ERP systems.', at: new Date(now - 2 * dayMs) },
    ],
  });

  // App 4: Kabir -> Job 3 (Warehouse Operations Supervisor) -> 'applied'
  const app4 = await Application.create({
    job: job3._id,
    applicant: applicantKabir._id,
    company: companyIndore._id,
    resume: { key: 'mock-resume-kabir.pdf', filename: 'Kabir_Mehta_Resume.pdf' },
    coverNote: 'Experienced store supervisor looking to contribute to warehouse floor operations.',
    stage: 'applied',
    position: 2048,
    rating: null,
    stageHistory: [
      { stage: 'applied', at: new Date(now - 1 * dayMs) },
    ],
    notes: [],
  });

  // App 5: Aarav -> Job 4 (Fleet Coordinator) -> 'hired'
  const app5 = await Application.create({
    job: job4._id,
    applicant: applicantAarav._id,
    company: companyIndore._id,
    resume: { key: 'mock-resume-aarav.pdf', filename: 'Aarav_Sharma_Resume.pdf' },
    coverNote: 'Extensive background in route planning and commercial carrier coordination.',
    stage: 'hired',
    position: 1024,
    rating: 5,
    stageHistory: [
      { stage: 'applied', at: new Date(now - 5 * dayMs) },
      { stage: 'reviewing', changedBy: recruiterIndore._id, message: 'Candidate has proven telematics background.', at: new Date(now - 4 * dayMs) },
      { stage: 'interviewing', changedBy: recruiterIndore._id, message: 'Route simulation test completed successfully.', at: new Date(now - 3 * dayMs) },
      { stage: 'offered', changedBy: recruiterIndore._id, message: 'Offer sent for Fleet Coordinator position.', at: new Date(now - 2 * dayMs) },
      { stage: 'hired', changedBy: recruiterIndore._id, message: 'Offer accepted! Welcome to the Malwa Express team.', at: new Date(now - 1 * dayMs) },
    ],
    notes: [
      { author: recruiterIndore._id, text: 'Candidate accepted offer letter. Onboarding starting next Monday.', at: new Date(now - 1 * dayMs) },
    ],
  });

  // App 6: Kabir -> Job 5 (Retail POS Support Specialist) -> 'reviewing'
  const app6 = await Application.create({
    job: job5._id,
    applicant: applicantKabir._id,
    company: companyBengaluru._id,
    resume: { key: 'mock-resume-kabir.pdf', filename: 'Kabir_Mehta_Resume.pdf' },
    coverNote: 'Hands-on technician skilled in barcode scanners, receipt printers, and merchant customer care.',
    stage: 'reviewing',
    position: 1024,
    rating: 4,
    stageHistory: [
      { stage: 'applied', at: new Date(now - 2 * dayMs) },
      { stage: 'reviewing', changedBy: recruiterBengaluru._id, message: 'Checking technical hardware credentials.', at: new Date(now - 1 * dayMs) },
    ],
    notes: [
      { author: recruiterBengaluru._id, text: 'Direct experience with our exact POS printer models.', at: new Date(now - 1 * dayMs) },
    ],
  });

  // App 7: Priya -> Job 2 (Digital Cataloguer) -> 'applied'
  const app7 = await Application.create({
    job: job2._id,
    applicant: applicantPriya._id,
    company: companyJaipur._id,
    resume: { key: 'mock-resume-priya.pdf', filename: 'Priya_Patel_CV.pdf' },
    coverNote: 'Would love to help digitize our artisan collections for national e-commerce channels.',
    stage: 'applied',
    position: 1024,
    rating: null,
    stageHistory: [
      { stage: 'applied', at: new Date(now - 1 * dayMs) },
    ],
    notes: [],
  });

  console.log('📋 7 Applications seeded across Kanban stages (applied, reviewing, interviewing, offered, hired, rejected).');

  // 8. Create In-App Notifications
  await Notification.create([
    {
      user: applicantPriya._id,
      type: 'STAGE_CHANGE',
      application: app1._id,
      message: 'Good news! Pink City Artisans & Crafts has moved your application for Quality Control Lead to offered.',
      readAt: null,
    },
    {
      user: applicantPriya._id,
      type: 'STAGE_CHANGE',
      application: app2._id,
      message: 'Update: Your application for Quality Control Lead has been updated to rejected.',
      readAt: new Date(now - 12 * 3600000),
    },
    {
      user: applicantAarav._id,
      type: 'STAGE_CHANGE',
      application: app3._id,
      message: 'Update: Malwa Express Logistics has moved your application for Warehouse Operations Supervisor to interviewing.',
      readAt: null,
    },
    {
      user: applicantAarav._id,
      type: 'STAGE_CHANGE',
      application: app5._id,
      message: 'Congratulations! Malwa Express Logistics has marked your application as hired.',
      readAt: null,
    },
    {
      user: applicantKabir._id,
      type: 'STAGE_CHANGE',
      application: app6._id,
      message: 'Update: Kaveri Retail Solutions has moved your application for Retail POS Field Support Specialist to reviewing.',
      readAt: null,
    },
    {
      user: recruiterJaipur._id,
      type: 'NEW_APPLICATION',
      application: app1._id,
      message: 'New application received from Priya Patel for Quality Control Lead - Handloom & Apparel.',
      readAt: new Date(now - 2 * dayMs),
    },
    {
      user: recruiterIndore._id,
      type: 'NEW_APPLICATION',
      application: app3._id,
      message: 'New application received from Aarav Sharma for Warehouse Operations Supervisor.',
      readAt: new Date(now - 3 * dayMs),
    },
  ]);
  console.log('🔔 7 In-App Notifications seeded.');

  // 9. Create Sample Reports
  await Report.create([
    {
      job: job4._id,
      reporter: applicantPriya._id,
      reason: 'misleading',
      text: 'Title previously mentioned remote work options but job details require daily 6:00 AM dispatch presence.',
      status: 'pending',
    },
    {
      job: job6._id,
      reporter: applicantKabir._id,
      reason: 'spam',
      text: 'Closed seasonal position that was kept published past expiration.',
      status: 'reviewed',
    },
  ]);
  console.log('🚩 2 Sample Job Reports created in moderation queue.');

  // 10. Bookmark some jobs for applicants
  await ApplicantProfile.updateOne(
    { user: applicantAarav._id },
    { $addToSet: { savedJobs: [job1._id, job5._id] } }
  );
  await ApplicantProfile.updateOne(
    { user: applicantPriya._id },
    { $addToSet: { savedJobs: [job2._id] } }
  );

  console.log('⭐ Saved jobs bookmarked for applicants.');
  console.log('✅ Database seeded successfully!');
  console.log('\n================ DEMO CREDENTIALS ================');
  console.log('👑 Admin:');
  console.log('   Email:    admin@rozgaar.in');
  console.log('   Password: AdminPass123!');
  console.log('\n🏢 Recruiters:');
  console.log('   Jaipur:    recruiter.jaipur@rozgaar.in    (Pass: RecruiterPass123!)');
  console.log('   Indore:    recruiter.indore@rozgaar.in    (Pass: RecruiterPass123!)');
  console.log('   Bengaluru: recruiter.bengaluru@rozgaar.in (Pass: RecruiterPass123!)');
  console.log('\n👤 Job Seekers:');
  console.log('   Aarav (Indore):    applicant.aarav@rozgaar.in (Pass: ApplicantPass123!)');
  console.log('   Priya (Jaipur):    applicant.priya@rozgaar.in (Pass: ApplicantPass123!)');
  console.log('   Kabir (Bengaluru): applicant.kabir@rozgaar.in (Pass: ApplicantPass123!)');
  console.log('===================================================\n');

  await disconnectDB();
}

// Execute when run directly via node
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}

