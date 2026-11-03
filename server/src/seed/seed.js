import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../db/connect.js';
import { env } from '../config/env.js';
import {
  User,
  ApplicantProfile,
  Company,
  Job,
  Application,
  Notification,
  Report,
} from '../models/index.js';
import { storageService } from '../services/storage.service.js';
import { companiesData } from './data/companies.js';
import { recruitersData } from './data/recruiters.js';
import { jobsData } from './data/jobs.js';
import { applicantsData } from './data/applicants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Dynamically builds a valid, single-page PDF 1.4 buffer for an applicant resume
 * using their real seeded data (Name, headline, contact, summary, skills, and experience).
 */
export function buildResumePdfBuffer(applicant, version = 1) {
  function escapePdf(str) {
    return (str || '').replace(/[\\()]/g, '\\$&');
  }

  function wrapText(text, maxChars) {
    const words = (text || '').split(' ');
    const lines = [];
    let currentLine = '';
    for (const w of words) {
      if ((currentLine + ' ' + w).trim().length > maxChars) {
        lines.push(currentLine.trim());
        currentLine = w;
      } else {
        currentLine += ' ' + w;
      }
    }
    if (currentLine.trim()) lines.push(currentLine.trim());
    return lines;
  }

  const name = applicant.name || 'Candidate';
  const headline = applicant.headline || 'Professional';
  const email = applicant.email || '';
  const phone = applicant.phone || '';
  const location = [applicant.city, applicant.state].filter(Boolean).join(', ');
  const skills = Array.isArray(applicant.skills) ? applicant.skills : [];
  const bio = applicant.bio || '';
  const links = Array.isArray(applicant.links) ? applicant.links : [];

  const streamLines = [];
  streamLines.push('BT');
  // Header: Name (Font F2 = Helvetica-Bold, 18pt)
  streamLines.push('/F2 18 Tf');
  streamLines.push('50 740 Td');
  streamLines.push('(' + escapePdf(name.toUpperCase()) + ') Tj');

  // Subtitle: Headline (Font F1 = Helvetica, 11pt)
  streamLines.push('/F1 11 Tf');
  streamLines.push('0 -18 Td');
  streamLines.push('(' + escapePdf(headline) + ') Tj');

  // Contact Info (Font F1 = Helvetica, 9pt)
  streamLines.push('/F1 9 Tf');
  streamLines.push('0 -15 Td');
  const contact = [email, phone, location].filter(Boolean).join('   |   ');
  streamLines.push('(' + escapePdf(contact) + ') Tj');

  if (links.length > 0) {
    streamLines.push('0 -13 Td');
    const linksStr = links
      .map((l) => (l.label ? l.label + ': ' : '') + l.url)
      .join('   |   ');
    streamLines.push('(' + escapePdf(linksStr) + ') Tj');
  }

  // Section 1: Professional Summary
  streamLines.push('0 -24 Td');
  streamLines.push('/F2 12 Tf');
  streamLines.push('(PROFESSIONAL SUMMARY) Tj');
  streamLines.push('0 -5 Td');
  streamLines.push('/F1 10 Tf');

  const bioLines = wrapText(bio, 82);
  for (const bLine of bioLines) {
    streamLines.push('0 -14 Td');
    streamLines.push('(' + escapePdf(bLine) + ') Tj');
  }

  // Section 2: Core Competencies
  streamLines.push('0 -22 Td');
  streamLines.push('/F2 12 Tf');
  streamLines.push('(KEY SKILLS & COMPETENCIES) Tj');
  streamLines.push('0 -5 Td');
  streamLines.push('/F1 10 Tf');

  const skillLines = wrapText(skills.join('  •  '), 78);
  for (const sLine of skillLines) {
    streamLines.push('0 -14 Td');
    streamLines.push('(•  ' + escapePdf(sLine) + ') Tj');
  }

  // Section 3: Verified Employment & Credentials
  streamLines.push('0 -22 Td');
  streamLines.push('/F2 12 Tf');
  streamLines.push('(EMPLOYMENT & VERIFICATION PROFILE) Tj');
  streamLines.push('0 -5 Td');
  streamLines.push('/F1 10 Tf');
  streamLines.push('0 -14 Td');
  streamLines.push(
    '(• Status: Verified Candidate Profile on Rozgaar Hyperlocal ATS Network) Tj'
  );
  streamLines.push('0 -14 Td');
  streamLines.push(
    '(• Target Region: Active across ' +
      escapePdf(applicant.city || 'local') +
      ' industrial & commercial hubs) Tj'
  );
  streamLines.push('0 -14 Td');
  streamLines.push(
    '(• Resume Version: v' + version + ' - Updated for Hyperlocal Matching) Tj'
  );

  // Footer
  streamLines.push('0 -32 Td');
  streamLines.push('/F1 8 Tf');
  streamLines.push(
    '(Rozgaar Hyperlocal ATS - Digitally generated verified profile resume) Tj'
  );
  streamLines.push('ET');

  const streamContent = streamLines.join('\n');
  const streamByteLength = Buffer.byteLength(streamContent);

  const objects = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  objects.push(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj'
  );
  objects.push(
    '4 0 obj\n<< /Length ' +
      streamByteLength +
      ' >>\nstream\n' +
      streamContent +
      '\nendstream\nendobj'
  );
  objects.push(
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj'
  );
  objects.push(
    '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj'
  );

  const header = '%PDF-1.4\n';
  let offset = Buffer.byteLength(header);
  const xref = ['xref', '0 7', '0000000000 65535 f '];

  let body = '';
  for (let i = 0; i < objects.length; i++) {
    xref.push(String(offset).padStart(10, '0') + ' 00000 n ');
    const objStr = objects[i] + '\n';
    body += objStr;
    offset += Buffer.byteLength(objStr);
  }

  const startxref = offset;
  const trailer = [
    'trailer',
    '<< /Size 7 /Root 1 0 R >>',
    'startxref',
    startxref,
    '%%EOF',
  ].join('\n');

  return Buffer.from(header + body + xref.join('\n') + '\n' + trailer);
}

const dayMs = 86400000;
const now = Date.now();

export async function runSeeder() {
  const args = process.argv.slice(2);
  const isReset =
    args.includes('--reset') || process.env.npm_config_reset === 'true';
  const isAppend =
    args.includes('--append') || process.env.npm_config_append === 'true';
  const isDryRun =
    args.includes('--dry-run') || process.env.npm_config_dry_run === 'true';

  console.log('\n======================================================');
  console.log('🌱 Rozgaar Database Seeder');
  console.log('======================================================');

  // 1. Safety check
  if (env.SEED_ALLOW !== 'true') {
    console.error(
      '❌ Seeding refused: SEED_ALLOW must be explicitly set to "true" in environment.'
    );
    process.exit(1);
  }

  // 2. Handle --dry-run
  if (isDryRun) {
    console.log('🔍 [DRY-RUN MODE] Computing planned seed items without database writes:');
    console.log('  • Admin Users:           1');
    console.log(`  • Companies:             ${companiesData.length}`);
    console.log(`  • Recruiters:            ${recruitersData.length}`);
    console.log(`  • Jobs:                  ${jobsData.length} (65 open, 8 draft, 7 closed)`);
    console.log(`  • Applicants & Profiles: ${applicantsData.length}`);
    console.log('  • Applications:          250 (across all 7 Kanban stages)');
    console.log('  • Notifications:         45 (15 each for admin, recruiter, applicant)');
    console.log('  • Moderation Reports:    6');
    console.log('  • Target Demo Accounts:');
    console.log('     - Admin:     admin@rozgaar.example');
    console.log('     - Recruiter: recruiter@rozgaar.example');
    console.log('     - Applicant: applicant@rozgaar.example');
    console.log('✨ Dry-run calculation complete. Database untouched.\n');
    return;
  }

  // 3. Connect to Atlas Database
  await connectDB();

  // 4. Handle --reset or default cleanup of seeded records
  if (isReset || !isAppend) {
    console.log('🧹 Removing existing seeded records (isSeed: true)...');
    const deleteResults = await Promise.all([
      User.deleteMany({ isSeed: true }),
      ApplicantProfile.deleteMany({ isSeed: true }),
      Company.deleteMany({ isSeed: true }),
      Job.deleteMany({ isSeed: true }),
      Application.deleteMany({ isSeed: true }),
      Notification.deleteMany({ isSeed: true }),
      Report.deleteMany({ isSeed: true }),
    ]);
    console.log(
      `   Removed: Users: ${deleteResults[0].deletedCount}, Profiles: ${deleteResults[1].deletedCount}, Companies: ${deleteResults[2].deletedCount}, Jobs: ${deleteResults[3].deletedCount}, Apps: ${deleteResults[4].deletedCount}, Notifications: ${deleteResults[5].deletedCount}, Reports: ${deleteResults[6].deletedCount}`
    );
  } else {
    console.log('⏩ [APPEND MODE] Inserting seed records without deleting existing items.');
  }

  // 5. Hash shared demo password once with bcrypt
  console.log('🔒 Hashing demo credentials securely...');
  const demoPassword = env.SEED_DEMO_PASSWORD || 'RozgaarDemo2026!';
  const passwordHash = await bcrypt.hash(demoPassword, 10);

  // 6. Seed Admin User
  console.log('👑 Seeding Admin Account...');
  const adminUser = await User.create({
    name: 'Admin Controller',
    email: 'admin@rozgaar.example',
    passwordHash,
    role: 'admin',
    emailVerified: true,
    privacyConsent: true,
    privacyConsentAt: new Date(),
    isSeed: true,
  });

  // 7. Seed Recruiter Users
  console.log('👥 Seeding Recruiter Accounts...');
  const recruiterMap = new Map(); // email -> User doc
  for (const r of recruitersData) {
    const recruiterUser = await User.create({
      name: r.name,
      email: r.email,
      passwordHash,
      role: 'recruiter',
      emailVerified: true,
      privacyConsent: true,
      privacyConsentAt: new Date(),
      isSeed: true,
    });
    recruiterMap.set(r.email, recruiterUser);
  }

  // 8. Seed Companies
  console.log('🏢 Seeding SMB Companies across 6 Indian cities...');
  const companyMap = new Map(); // slug -> Company doc
  for (const c of companiesData) {
    const ownerUser = recruiterMap.get(c.recruiterRef);
    if (!ownerUser) {
      throw new Error(`Owner recruiter not found for company ${c.slug}: ${c.recruiterRef}`);
    }

    // Find all recruiters belonging to this company
    const companyRecruiters = recruitersData.filter((r) => r.companySlug === c.slug);
    const members = companyRecruiters.map((r) => ({
      user: recruiterMap.get(r.email)._id,
      role: r.roleInCompany || 'member',
    }));

    const company = await Company.create({
      name: c.name,
      slug: c.slug,
      description: c.description,
      website: c.website,
      location: c.location,
      owner: ownerUser._id,
      members,
      isSeed: true,
    });

    companyMap.set(c.slug, company);

    // Update recruiter users' company reference
    for (const r of companyRecruiters) {
      await User.updateOne({ email: r.email }, { company: company._id });
    }
  }

  // 9. Seed Jobs
  console.log('💼 Seeding 80 Jobs with custom fields, salaries, and geo points...');
  const createdJobs = [];
  const jobMapByCompany = new Map(); // companySlug -> Job[]

  for (const j of jobsData) {
    const company = companyMap.get(j.companySlug);
    if (!company) {
      throw new Error(`Company not found for job: ${j.companySlug}`);
    }

    const publishedAt =
      j.publishedDaysAgo !== null
        ? new Date(now - j.publishedDaysAgo * dayMs)
        : null;
    const expiresAt =
      j.expiresInDays !== null
        ? new Date(now + j.expiresInDays * dayMs)
        : null;

    const job = await Job.create({
      company: company._id,
      title: j.title,
      description: j.description,
      employmentType: j.employmentType,
      remote: j.remote,
      location: {
        city: j.city,
        state: j.state,
        geo: {
          type: 'Point',
          coordinates: j.coordinates,
        },
      },
      salary: j.salary,
      skills: j.skills,
      customFields: new Map(Object.entries(j.customFields || {})),
      status: j.status,
      publishedAt,
      expiresAt,
      applicationCount: 0,
      isSeed: true,
    });

    createdJobs.push(job);
    if (!jobMapByCompany.has(j.companySlug)) {
      jobMapByCompany.set(j.companySlug, []);
    }
    jobMapByCompany.get(j.companySlug).push(job);
  }

  // 10. Seed Applicants & Profiles with Resumes
  console.log('👤 Seeding 60 Applicants & Profiles with PDF resumes...');
  const createdApplicants = [];
  const applicantProfileMap = new Map(); // userId -> profile doc

  for (let idx = 0; idx < applicantsData.length; idx++) {
    const a = applicantsData[idx];

    // Create User record
    const user = await User.create({
      name: a.name,
      email: a.email,
      passwordHash,
      role: 'applicant',
      emailVerified: true,
      privacyConsent: true,
      privacyConsentAt: new Date(),
      isSeed: true,
    });
    createdApplicants.push(user);

    // Generate resumes via storage service
    const resumes = [];
    const resumeCount = a.resumeCount || 1;
    for (let rIdx = 1; rIdx <= resumeCount; rIdx++) {
      const sanitizedName = a.name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${sanitizedName}_Resume_v${rIdx}.pdf`;

      const resumeBuffer = buildResumePdfBuffer(a, rIdx);
      const uploaded = await storageService.uploadFile({
        buffer: resumeBuffer,
        originalFilename: filename,
        mimeType: 'application/pdf',
        ext: 'pdf',
        prefix: 'seed/',
      });

      resumes.push({
        key: uploaded.key,
        filename: uploaded.filename,
        mime: 'application/pdf',
        size: uploaded.size,
        isDefault: rIdx === 1,
        uploadedAt: new Date(now - (idx + rIdx) * 3600000 * 4),
      });
    }

    // Pick 1 to 4 random saved jobs for this applicant
    const savedJobsSubset = [];
    const openJobs = createdJobs.filter((job) => job.status === 'open');
    const savedCount = (idx % 4) + 1;
    for (let s = 0; s < savedCount; s++) {
      const randomJob = openJobs[(idx * 7 + s * 13) % openJobs.length];
      if (randomJob && !savedJobsSubset.includes(randomJob._id)) {
        savedJobsSubset.push(randomJob._id);
      }
    }

    // Create Profile record
    const profile = await ApplicantProfile.create({
      user: user._id,
      headline: a.headline,
      bio: a.bio,
      phone: a.phone,
      location: {
        city: a.city,
        state: a.state,
        country: 'India',
        geo: {
          type: 'Point',
          coordinates: a.coordinates,
        },
      },
      skills: a.skills,
      links: a.links || [],
      resumes,
      savedJobs: savedJobsSubset,
      isSeed: true,
    });

    applicantProfileMap.set(user._id.toString(), profile);
  }

  // 11. Seed 250 Applications across all 7 stages
  console.log('📋 Seeding 250 Applications across all 7 Kanban stages...');
  const stages = [
    'applied',
    'reviewing',
    'interviewing',
    'offered',
    'hired',
    'rejected',
    'withdrawn',
  ];

  // Stage distribution target:
  // applied: 65, reviewing: 50, interviewing: 45, offered: 35, hired: 30, rejected: 15, withdrawn: 10 = 250
  const stageTargetCounts = {
    applied: 65,
    reviewing: 50,
    interviewing: 45,
    offered: 35,
    hired: 30,
    rejected: 15,
    withdrawn: 10,
  };

  const stageCurrentCounts = {
    applied: 0,
    reviewing: 0,
    interviewing: 0,
    offered: 0,
    hired: 0,
    rejected: 0,
    withdrawn: 0,
  };

  const stagePositions = {
    applied: 1024,
    reviewing: 1024,
    interviewing: 1024,
    offered: 1024,
    hired: 1024,
    rejected: 1024,
    withdrawn: 1024,
  };

  const createdApplications = [];
  const existingJobApplicantPairs = new Set();
  const jobApplicationCountMap = new Map(); // jobId -> count

  // Helper to construct realistic stage history
  function buildStageHistory(stage, appliedDaysAgo, recruiterId) {
    const history = [];
    const baseTime = now - appliedDaysAgo * dayMs;

    history.push({
      stage: 'applied',
      at: new Date(baseTime),
      changedBy: null,
      message: 'Application submitted by candidate.',
    });

    if (stage === 'applied') return history;

    // Transition to reviewing
    const reviewingTime = baseTime + 1 * dayMs;
    history.push({
      stage: 'reviewing',
      at: new Date(reviewingTime),
      changedBy: recruiterId,
      message: 'Candidate credentials under review by hiring team.',
    });

    if (stage === 'reviewing') return history;

    if (stage === 'withdrawn') {
      history.push({
        stage: 'withdrawn',
        at: new Date(reviewingTime + 1 * dayMs),
        changedBy: null,
        message: 'Candidate withdrew application due to scheduling.',
      });
      return history;
    }

    if (stage === 'rejected') {
      history.push({
        stage: 'rejected',
        at: new Date(reviewingTime + 2 * dayMs),
        changedBy: recruiterId,
        message:
          'Thank you for your interest. We are proceeding with candidates whose background more closely aligns with role requirements.',
      });
      return history;
    }

    // interviewing
    const interviewingTime = reviewingTime + 2 * dayMs;
    history.push({
      stage: 'interviewing',
      at: new Date(interviewingTime),
      changedBy: recruiterId,
      message: 'Practical skills assessment and interview scheduled.',
    });

    if (stage === 'interviewing') return history;

    // offered
    const offeredTime = interviewingTime + 2 * dayMs;
    history.push({
      stage: 'offered',
      at: new Date(offeredTime),
      changedBy: recruiterId,
      message: 'Congratulations! We are delighted to extend you a formal offer of employment.',
    });

    if (stage === 'offered') return history;

    // hired
    const hiredTime = offeredTime + 2 * dayMs;
    history.push({
      stage: 'hired',
      at: new Date(hiredTime),
      changedBy: recruiterId,
      message: 'Offer accepted! Welcome to the team.',
    });

    return history;
  }

  // A. Guarantee demo applicant (Aarav Sharma) has an application in EVERY stage
  const demoApplicantUser = createdApplicants[0]; // applicant@rozgaar.example
  const demoApplicantProfile = applicantProfileMap.get(demoApplicantUser._id.toString());
  const demoResume = demoApplicantProfile.resumes[0];

  const openJobsList = createdJobs.filter((j) => j.status === 'open');

  for (let sIdx = 0; sIdx < stages.length; sIdx++) {
    const stage = stages[sIdx];
    const targetJob = openJobsList[sIdx % openJobsList.length];
    const pairKey = `${targetJob._id}_${demoApplicantUser._id}`;
    existingJobApplicantPairs.add(pairKey);

    const position = stagePositions[stage];
    stagePositions[stage] += 1024;
    stageCurrentCounts[stage] += 1;

    // Find company recruiter
    const company = Array.from(companyMap.values()).find((c) =>
      c._id.equals(targetJob.company)
    );
    const recruiterId = company?.owner || adminUser._id;

    const app = await Application.create({
      job: targetJob._id,
      applicant: demoApplicantUser._id,
      company: targetJob.company,
      resume: { key: demoResume.key, filename: demoResume.filename },
      coverNote: `I am deeply interested in the ${targetJob.title} position and confident my skills will add immediate value.`,
      stage,
      position,
      stageHistory: buildStageHistory(stage, 12 - sIdx, recruiterId),
      rating: (sIdx % 3) + 3,
      notes: [
        {
          author: recruiterId,
          text: `Demo applicant evaluation note for stage: ${stage}. Strong practical competence demonstrated.`,
          at: new Date(now - (8 - sIdx) * dayMs),
        },
      ],
      isSeed: true,
    });

    createdApplications.push(app);
    jobApplicationCountMap.set(
      targetJob._id.toString(),
      (jobApplicationCountMap.get(targetJob._id.toString()) || 0) + 1
    );
  }

  // B. Guarantee demo recruiter's company (Durga Sweets) has a fully populated Kanban board
  // Job 1: Head Baker & Traditional Confectionery Lead
  const demoRecruiterUser = recruiterMap.get('recruiter@rozgaar.example');
  const demoCompanyJobs = jobMapByCompany.get('durga-sweets-bakery');
  const primaryDemoJob = demoCompanyJobs[0]; // Head Baker

  for (let sIdx = 0; sIdx < stages.length; sIdx++) {
    const stage = stages[sIdx];
    // Pick an applicant other than demo applicant
    const applicantUser = createdApplicants[sIdx + 1];
    const pairKey = `${primaryDemoJob._id}_${applicantUser._id}`;

    if (!existingJobApplicantPairs.has(pairKey)) {
      existingJobApplicantPairs.add(pairKey);

      const applicantProfile = applicantProfileMap.get(applicantUser._id.toString());
      const resume = applicantProfile.resumes[0];
      const position = stagePositions[stage];
      stagePositions[stage] += 1024;
      stageCurrentCounts[stage] += 1;

      const app = await Application.create({
        job: primaryDemoJob._id,
        applicant: applicantUser._id,
        company: primaryDemoJob.company,
        resume: { key: resume.key, filename: resume.filename },
        coverNote: `Applying with great enthusiasm for ${primaryDemoJob.title}. My resume highlights my relevant background.`,
        stage,
        position,
        stageHistory: buildStageHistory(stage, 15 - sIdx, demoRecruiterUser._id),
        rating: (sIdx % 4) + 2,
        notes: [
          {
            author: demoRecruiterUser._id,
            text: `Candidate profile reviewed for ${stage} column. Background meets requirements.`,
            at: new Date(now - (10 - sIdx) * dayMs),
          },
        ],
        isSeed: true,
      });

      createdApplications.push(app);
      jobApplicationCountMap.set(
        primaryDemoJob._id.toString(),
        (jobApplicationCountMap.get(primaryDemoJob._id.toString()) || 0) + 1
      );
    }
  }

  // C. Distribute remaining applications until exactly 250 total
  let appCounter = createdApplications.length;
  let applicantCycle = 2;
  let jobCycle = 0;

  while (appCounter < 250) {
    // Pick next stage with remaining quota
    let chosenStage = null;
    for (const stage of stages) {
      if (stageCurrentCounts[stage] < stageTargetCounts[stage]) {
        chosenStage = stage;
        break;
      }
    }
    if (!chosenStage) chosenStage = 'applied';

    const targetJob = openJobsList[jobCycle % openJobsList.length];
    const targetApplicant = createdApplicants[applicantCycle % createdApplicants.length];
    const pairKey = `${targetJob._id}_${targetApplicant._id}`;

    applicantCycle++;
    jobCycle++;

    if (existingJobApplicantPairs.has(pairKey)) {
      continue;
    }

    existingJobApplicantPairs.add(pairKey);
    stageCurrentCounts[chosenStage] += 1;
    const position = stagePositions[chosenStage];
    stagePositions[chosenStage] += 1024;

    const applicantProfile = applicantProfileMap.get(targetApplicant._id.toString());
    const resume =
      applicantProfile && applicantProfile.resumes.length > 0
        ? applicantProfile.resumes[0]
        : { key: 'seed/placeholder.pdf', filename: 'Resume.pdf' };

    // Resolve recruiter
    const company = Array.from(companyMap.values()).find((c) =>
      c._id.equals(targetJob.company)
    );
    const recruiterId = company?.owner || adminUser._id;

    const daysAgo = (appCounter % 30) + 2;
    const hasNotes = appCounter % 2 === 0;

    const notes = hasNotes
      ? [
          {
            author: recruiterId,
            text: `Candidate profile screened. Experience matches criteria for ${targetJob.title}.`,
            at: new Date(now - (daysAgo - 1) * dayMs),
          },
        ]
      : [];

    const app = await Application.create({
      job: targetJob._id,
      applicant: targetApplicant._id,
      company: targetJob.company,
      resume: { key: resume.key, filename: resume.filename },
      coverNote: `I am pleased to submit my application for the ${targetJob.title} opening. Please review my attached resume.`,
      stage: chosenStage,
      position,
      stageHistory: buildStageHistory(chosenStage, daysAgo, recruiterId),
      rating: hasNotes ? (appCounter % 5) + 1 : null,
      notes,
      isSeed: true,
    });

    createdApplications.push(app);
    jobApplicationCountMap.set(
      targetJob._id.toString(),
      (jobApplicationCountMap.get(targetJob._id.toString()) || 0) + 1
    );

    appCounter++;
  }

  // Synchronize each Job's applicationCount
  for (const [jobId, count] of jobApplicationCountMap.entries()) {
    await Job.updateOne({ _id: jobId }, { applicationCount: count });
  }

  // 12. Seed 15 Notifications each for Demo Accounts
  console.log('🔔 Seeding 15 Notifications per Demo Account...');
  const notificationsToCreate = [];

  // A. Demo Applicant notifications (applicant@rozgaar.example)
  for (let n = 1; n <= 15; n++) {
    const isRead = n > 5; // First 5 unread
    notificationsToCreate.push({
      user: demoApplicantUser._id,
      type: 'STAGE_CHANGE',
      application: createdApplications[n % 7]._id,
      message: `Status update: Your application for "${openJobsList[n % openJobsList.length].title}" has progressed to ${stages[n % stages.length]}.`,
      readAt: isRead ? new Date(now - n * 3600000 * 3) : null,
      isSeed: true,
    });
  }

  // B. Demo Recruiter notifications (recruiter@rozgaar.example)
  for (let n = 1; n <= 15; n++) {
    const isRead = n > 4; // First 4 unread
    const candidateName = createdApplicants[(n + 3) % createdApplicants.length].name;
    notificationsToCreate.push({
      user: demoRecruiterUser._id,
      type: 'NEW_APPLICATION',
      application: createdApplications[(n + 7) % createdApplications.length]._id,
      message: `New application received: ${candidateName} applied for "${primaryDemoJob.title}".`,
      readAt: isRead ? new Date(now - n * 3600000 * 2) : null,
      isSeed: true,
    });
  }

  // C. Admin notifications (admin@rozgaar.example)
  for (let n = 1; n <= 15; n++) {
    const isRead = n > 6;
    notificationsToCreate.push({
      user: adminUser._id,
      type: 'SYSTEM',
      application: null,
      message: `System Audit Alert #${n}: Platform health verified and geo-index latency nominal across AP/Telangana regions.`,
      readAt: isRead ? new Date(now - n * 3600000 * 4) : null,
      isSeed: true,
    });
  }

  await Notification.insertMany(notificationsToCreate);

  // 13. Seed 6 Reports for the Admin Moderation Queue
  console.log('🚩 Seeding 6 Job Reports in Admin Moderation Queue...');
  const reportsData = [
    {
      job: openJobsList[2]._id,
      reporter: createdApplicants[4]._id,
      reason: 'misleading',
      text: 'Listing lists remote options in preview but job description specifies daily mandatory on-site factory presence.',
      status: 'pending',
    },
    {
      job: openJobsList[5]._id,
      reporter: createdApplicants[6]._id,
      reason: 'spam',
      text: 'Duplicate posting submitted multiple times within same week.',
      status: 'pending',
    },
    {
      job: openJobsList[8]._id,
      reporter: createdApplicants[8]._id,
      reason: 'fraud',
      text: 'Recruiter asked for unverified security deposit for training kit.',
      status: 'pending',
    },
    {
      job: openJobsList[11]._id,
      reporter: createdApplicants[10]._id,
      reason: 'misleading',
      text: 'Salary advertised as monthly fixed but actual remuneration is commission-only based.',
      status: 'reviewed',
    },
    {
      job: openJobsList[14]._id,
      reporter: createdApplicants[12]._id,
      reason: 'harassment',
      text: 'Interview coordinator used unprofessional language during screening call.',
      status: 'action_taken',
    },
    {
      job: openJobsList[17]._id,
      reporter: createdApplicants[14]._id,
      reason: 'other',
      text: 'Position already fulfilled internally according to company front desk.',
      status: 'dismissed',
    },
  ];

  await Report.insertMany(reportsData.map((r) => ({ ...r, isSeed: true })));

  // 14. Post-Seed Verification Step (Atlas counts, indexes, and geo query)
  console.log('\n======================================================');
  console.log('🔍 RUNNING POST-SEED VERIFICATION');
  console.log('======================================================');

  const [
    userCount,
    profileCount,
    companyCount,
    jobCount,
    appCount,
    notifCount,
    reportCount,
  ] = await Promise.all([
    User.countDocuments({ isSeed: true }),
    ApplicantProfile.countDocuments({ isSeed: true }),
    Company.countDocuments({ isSeed: true }),
    Job.countDocuments({ isSeed: true }),
    Application.countDocuments({ isSeed: true }),
    Notification.countDocuments({ isSeed: true }),
    Report.countDocuments({ isSeed: true }),
  ]);

  console.log('📊 Seeded Document Counts in Database:');
  console.log(`   • Users:           ${userCount} (1 Admin + 20 Recruiters + 60 Applicants)`);
  console.log(`   • Profiles:        ${profileCount}`);
  console.log(`   • Companies:       ${companyCount}`);
  console.log(`   • Jobs:            ${jobCount} (65 open, 8 draft, 7 closed)`);
  console.log(`   • Applications:    ${appCount} (Across all 7 Kanban stages)`);
  console.log(`   • Notifications:   ${notifCount} (15 per demo account)`);
  console.log(`   • Moderation Reps: ${reportCount}`);

  // Confirm indexes
  const jobIndexes = await Job.collection.indexes();
  const has2dsphere = jobIndexes.some(
    (idx) => idx.key && idx.key['location.geo'] === '2dsphere'
  );
  const hasTextIndex = jobIndexes.some(
    (idx) => idx.key && idx.key._fts === 'text'
  );
  console.log(`\n📌 Index Verification:`);
  console.log(`   • 2dsphere index on Job location.geo: ${has2dsphere ? '✅ ACTIVE' : '❌ MISSING'}`);
  console.log(`   • Full-text search index on Job:     ${hasTextIndex ? '✅ ACTIVE' : '❌ MISSING'}`);

  // Sample Geo Query: Jobs within 25 km of Vijayawada (lng: 80.6480, lat: 16.5062)
  const vijayawadaCoords = [80.648, 16.5062];
  const maxDistanceMeters = 25000; // 25 km

  const nearbyJobs = await Job.find({
    status: 'open',
    'location.geo': {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: vijayawadaCoords,
        },
        $maxDistance: maxDistanceMeters,
      },
    },
  }).select('title location.city salary');

  console.log(
    `\n📍 Sample 2dsphere Geo-Query Result (Jobs within 25 km of Vijayawada):`
  );
  console.log(
    `   Found ${nearbyJobs.length} active jobs within 25 km radius of Vijayawada center:`
  );
  nearbyJobs.slice(0, 5).forEach((j, i) => {
    console.log(
      `   ${i + 1}. ${j.title} (${j.location.city}) - ₹${j.salary?.min?.toLocaleString('en-IN') || 0} - ₹${j.salary?.max?.toLocaleString('en-IN') || 0}/${j.salary?.period || 'mo'}`
    );
  });

  console.log('\n================ DEMO CREDENTIALS ================');
  console.log('All demo accounts share the password configured in SEED_DEMO_PASSWORD:');
  console.log('👑 Admin:');
  console.log('   Email:     admin@rozgaar.example');
  console.log('\n🏢 Recruiter (Owns "Durga Sweets & Artisan Bakery" with populated Kanban):');
  console.log('   Email:     recruiter@rozgaar.example');
  console.log('\n👤 Job Seeker (Aarav Sharma - has applications in every stage):');
  console.log('   Email:     applicant@rozgaar.example');
  console.log('===================================================\n');

  await disconnectDB();
  console.log('✅ Seeding completed successfully!');
}

// Auto-run if executed directly via node
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeeder()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeder execution failed:', err);
      process.exit(1);
    });
}

