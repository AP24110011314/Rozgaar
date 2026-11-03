import { Application } from '../models/Application.js';
import { Job } from '../models/Job.js';
import { Company } from '../models/Company.js';
import { ApplicantProfile } from '../models/ApplicantProfile.js';
import { Notification } from '../models/Notification.js';
import { storageService } from './storage.service.js';
import { mailService } from './mail.service.js';
import { AppError } from '../utils/appError.js';

export class ApplicationService {
  async applyToJob(applicantUser, jobId, { resumeId, coverNote }) {
    const job = await Job.findById(jobId).populate('company');
    if (!job) {
      throw AppError.notFound('Job listing not found');
    }

    if (job.status !== 'open') {
      throw AppError.badRequest('Applications to closed or draft jobs are not accepted');
    }

    // Check duplicate application
    const existing = await Application.findOne({
      job: jobId,
      applicant: applicantUser._id,
    });
    if (existing) {
      throw AppError.conflict('You have already submitted an application for this job');
    }

    // Find resume snapshot from profile
    const profile = await ApplicantProfile.findOne({ user: applicantUser._id });
    if (!profile) {
      throw AppError.badRequest('Applicant profile not found');
    }

    const resume = profile.resumes.id(resumeId);
    if (!resume) {
      throw AppError.notFound('Selected resume not found in your profile');
    }

    // Determine initial position in 'applied' column
    const lastInCol = await Application.findOne({ job: jobId, stage: 'applied' }).sort({
      position: -1,
    });
    const position = lastInCol ? lastInCol.position + 1024 : 1024;

    const application = await Application.create({
      job: jobId,
      applicant: applicantUser._id,
      company: job.company._id || job.company,
      resume: {
        key: resume.key,
        filename: resume.filename,
      },
      coverNote: coverNote || '',
      stage: 'applied',
      position,
      stageHistory: [
        {
          stage: 'applied',
          changedBy: applicantUser._id,
          message: 'Application submitted',
          at: new Date(),
        },
      ],
    });

    // Increment job applicationCount
    await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } });

    // Fire-and-forget notification to recruiter team
    try {
      const company = await Company.findById(job.company);
      if (company && company.members) {
        for (const member of company.members) {
          Notification.create({
            user: member.user,
            type: 'NEW_APPLICATION',
            application: application._id,
            message: `${applicantUser.name} applied for "${job.title}"`,
          }).catch(() => {});
        }
      }

      // Email recruiter owner
      if (company && company.owner) {
        const ownerUser = await Company.findById(company._id).populate('owner');
        if (ownerUser?.owner?.email) {
          mailService.sendApplicationReceivedEmail({
            to: ownerUser.owner.email,
            recruiterName: ownerUser.owner.name,
            applicantName: applicantUser.name,
            jobTitle: job.title,
          });
        }
      }
    } catch (notifErr) {
      console.warn('Non-blocking recruiter notification error:', notifErr.message);
    }

    return application.toApplicantJSON();
  }

  async getApplicantApplications(applicantId) {
    const applications = await Application.find({ applicant: applicantId })
      .populate('job', 'title location salary employmentType remote status')
      .populate('company', 'name slug location')
      .sort({ updatedAt: -1 });

    return applications.map((app) => app.toApplicantJSON());
  }

  async getApplicationById(user, applicationId) {
    const application = await Application.findById(applicationId)
      .populate('job', 'title location salary employmentType remote status customFields description')
      .populate('company', 'name slug location website')
      .populate('stageHistory.changedBy', 'name role')
      .populate('notes.author', 'name email');

    if (!application) {
      throw AppError.notFound('Application not found');
    }

    const isApplicant = application.applicant.toString() === user._id.toString();
    const userCompanyId = user.company?._id || user.company;
    const isCompanyRecruiter =
      userCompanyId && application.company._id.toString() === userCompanyId.toString();
    const isAdmin = user.role === 'admin';

    if (!isApplicant && !isCompanyRecruiter && !isAdmin) {
      throw AppError.forbidden('You do not have access to this application');
    }

    // Applicant sees sanitized timeline without notes or rating
    if (isApplicant) {
      return application.toApplicantJSON();
    }

    // Recruiter / Admin sees full object with candidate profile details
    const profile = await ApplicantProfile.findOne({ user: application.applicant });
    const fullApp = application.toObject();
    if (profile) {
      fullApp.applicantProfile = {
        headline: profile.headline,
        bio: profile.bio,
        phone: profile.phone,
        location: profile.location,
        skills: profile.skills,
        links: profile.links,
      };
    }

    return fullApp;
  }

  async withdrawApplication(applicantId, applicationId) {
    const application = await Application.findOne({
      _id: applicationId,
      applicant: applicantId,
    });

    if (!application) {
      throw AppError.notFound('Application not found');
    }

    if (application.stage === 'withdrawn') {
      throw AppError.badRequest('Application has already been withdrawn');
    }

    application.stage = 'withdrawn';
    application.stageHistory.push({
      stage: 'withdrawn',
      changedBy: applicantId,
      message: 'Withdrawn by applicant',
      at: new Date(),
    });

    await application.save();
    return application.toApplicantJSON();
  }

  async getJobApplicationsForRecruiter(recruiterUser, jobId, stageFilter) {
    const job = await Job.findById(jobId);
    if (!job) {
      throw AppError.notFound('Job listing not found');
    }

    const userCompanyId = recruiterUser.company?._id || recruiterUser.company;
    if (
      (!userCompanyId || job.company.toString() !== userCompanyId.toString()) &&
      recruiterUser.role !== 'admin'
    ) {
      throw AppError.forbidden('You do not have access to this job listing');
    }

    const filter = { job: jobId };
    if (stageFilter) {
      filter.stage = stageFilter;
    }

    const applications = await Application.find(filter)
      .populate('applicant', 'name email')
      .populate('stageHistory.changedBy', 'name role')
      .populate('notes.author', 'name email')
      .sort({ position: 1, createdAt: 1 });

    // Populate applicant profiles
    const applicantIds = applications.map((a) => a.applicant?._id).filter(Boolean);
    const profiles = await ApplicantProfile.find({ user: { $in: applicantIds } });
    const profileMap = new Map(profiles.map((p) => [p.user.toString(), p]));

    return applications.map((app) => {
      const obj = app.toObject();
      const p = profileMap.get(app.applicant?._id?.toString());
      if (p) {
        obj.applicantProfile = {
          headline: p.headline,
          bio: p.bio,
          phone: p.phone,
          location: p.location,
          skills: p.skills,
          links: p.links,
        };
      }
      return obj;
    });
  }

  async updateStage(recruiterUser, applicationId, { stage, message, beforeId, afterId }) {
    const application = await Application.findById(applicationId)
      .populate('job', 'title company')
      .populate('applicant', 'name email');

    if (!application) {
      throw AppError.notFound('Application not found');
    }

    const userCompanyId = recruiterUser.company?._id || recruiterUser.company;
    if (
      (!userCompanyId || application.company.toString() !== userCompanyId.toString()) &&
      recruiterUser.role !== 'admin'
    ) {
      throw AppError.forbidden('You do not have permission to manage this application');
    }

    if (application.stage === 'withdrawn') {
      throw AppError.badRequest('Withdrawn applications cannot be moved');
    }

    // Position calculation
    let newPosition = 1024;
    const jobId = application.job._id;

    if (!beforeId && !afterId) {
      const lastInCol = await Application.findOne({
        job: jobId,
        stage,
        _id: { $ne: applicationId },
      }).sort({ position: -1 });
      newPosition = lastInCol ? lastInCol.position + 1024 : 1024;
    } else if (!beforeId && afterId) {
      const afterApp = await Application.findById(afterId);
      newPosition = afterApp ? afterApp.position / 2 : 512;
    } else if (beforeId && !afterId) {
      const beforeApp = await Application.findById(beforeId);
      newPosition = beforeApp ? beforeApp.position + 1024 : 1024;
    } else if (beforeId && afterId) {
      let beforeApp = await Application.findById(beforeId);
      let afterApp = await Application.findById(afterId);

      if (beforeApp && afterApp) {
        const gap = Math.abs(afterApp.position - beforeApp.position);
        if (gap < 1e-6) {
          // Fractional collision detected: rebalance column
          await this.rebalanceColumn(jobId, stage, applicationId);
          beforeApp = await Application.findById(beforeId);
          afterApp = await Application.findById(afterId);
        }
        newPosition = (beforeApp.position + afterApp.position) / 2;
      }
    }

    application.stage = stage;
    application.position = newPosition;
    application.stageHistory.push({
      stage,
      changedBy: recruiterUser._id,
      message: message || '',
      at: new Date(),
    });

    await application.save();

    // Fire-and-forget notifications
    Notification.create({
      user: application.applicant._id,
      type: 'STAGE_CHANGE',
      application: application._id,
      message: `Your application for "${application.job.title}" has moved to ${stage}`,
    }).catch(() => {});

    Company.findById(application.company).then((comp) => {
      mailService.sendStageChangeEmail({
        to: application.applicant.email,
        name: application.applicant.name,
        jobTitle: application.job.title,
        companyName: comp?.name || 'Rozgaar Employer',
        stage,
        message,
      });
    }).catch(() => {});

    return application;
  }

  async rebalanceColumn(jobId, stage, movingAppId) {
    const columnApps = await Application.find({
      job: jobId,
      stage,
      _id: { $ne: movingAppId },
    }).sort({ position: 1 });

    const updates = columnApps.map((app, index) =>
      Application.findByIdAndUpdate(app._id, { position: (index + 1) * 1024 })
    );

    await Promise.all(updates);
  }

  async addInternalNote(recruiterUser, applicationId, text) {
    const application = await Application.findById(applicationId);
    if (!application) {
      throw AppError.notFound('Application not found');
    }

    const userCompanyId = recruiterUser.company?._id || recruiterUser.company;
    if (
      (!userCompanyId || application.company.toString() !== userCompanyId.toString()) &&
      recruiterUser.role !== 'admin'
    ) {
      throw AppError.forbidden('You do not have access to this application');
    }

    application.notes.push({
      author: recruiterUser._id,
      text,
      at: new Date(),
    });

    await application.save();
    await application.populate('notes.author', 'name email');
    return application.notes;
  }

  async updateRating(recruiterUser, applicationId, rating) {
    const application = await Application.findById(applicationId);
    if (!application) {
      throw AppError.notFound('Application not found');
    }

    const userCompanyId = recruiterUser.company?._id || recruiterUser.company;
    if (
      (!userCompanyId || application.company.toString() !== userCompanyId.toString()) &&
      recruiterUser.role !== 'admin'
    ) {
      throw AppError.forbidden('You do not have access to this application');
    }

    application.rating = rating;
    await application.save();
    return application;
  }

  async getResumeDownloadUrl(user, applicationId) {
    const application = await Application.findById(applicationId);
    if (!application) {
      throw AppError.notFound('Application not found');
    }

    const isApplicant = application.applicant.toString() === user._id.toString();
    const userCompanyId = user.company?._id || user.company;
    const isCompanyRecruiter =
      userCompanyId && application.company.toString() === userCompanyId.toString();
    const isAdmin = user.role === 'admin';

    if (!isApplicant && !isCompanyRecruiter && !isAdmin) {
      throw AppError.forbidden('You do not have permission to download this resume');
    }

    const downloadUrl = await storageService.getDownloadUrl(
      application.resume.key,
      application.resume.filename
    );

    return {
      downloadUrl,
      filename: application.resume.filename,
    };
  }
}

export const applicationService = new ApplicationService();

