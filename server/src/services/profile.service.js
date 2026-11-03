import { ApplicantProfile } from '../models/ApplicantProfile.js';
import { User } from '../models/User.js';
import { Job } from '../models/Job.js';
import { Application } from '../models/Application.js';
import { Notification } from '../models/Notification.js';
import { storageService } from './storage.service.js';
import { AppError } from '../utils/appError.js';

export class ProfileService {
  /**
   * Get applicant profile with presigned download URLs for resumes
   */
  async getProfile(userId) {
    let profile = await ApplicantProfile.findOne({ user: userId });

    if (!profile) {
      profile = await ApplicantProfile.create({ user: userId });
    }

    const profileObj = profile.toObject();

    // Attach download URLs to each resume
    profileObj.resumes = await Promise.all(
      profileObj.resumes.map(async (r) => ({
        ...r,
        url: await storageService.getDownloadUrl(r.key, r.filename),
      }))
    );

    return profileObj;
  }

  /**
   * Update applicant profile
   */
  async updateProfile(userId, updateData) {
    let profile = await ApplicantProfile.findOne({ user: userId });

    if (!profile) {
      profile = new ApplicantProfile({ user: userId, ...updateData });
    } else {
      if (updateData.headline !== undefined) profile.headline = updateData.headline;
      if (updateData.bio !== undefined) profile.bio = updateData.bio;
      if (updateData.phone !== undefined) profile.phone = updateData.phone;
      if (updateData.location) {
        profile.location = {
          ...profile.location.toObject(),
          ...updateData.location,
        };
      }
      if (updateData.skills !== undefined) profile.skills = updateData.skills;
      if (updateData.links !== undefined) profile.links = updateData.links;
    }

    await profile.save();
    return this.getProfile(userId);
  }

  /**
   * Upload resume and add to applicant profile (max 3 resumes)
   */
  async uploadResume(userId, file, { mime, ext }) {
    let profile = await ApplicantProfile.findOne({ user: userId });
    if (!profile) {
      profile = await ApplicantProfile.create({ user: userId });
    }

    if (profile.resumes.length >= 3) {
      throw AppError.badRequest('Maximum of 3 resumes allowed. Please delete one to upload a new one.');
    }

    // Upload to storage driver
    const uploadResult = await storageService.uploadFile({
      buffer: file.buffer,
      originalFilename: file.originalname,
      mimeType: mime,
      ext,
    });

    const isFirst = profile.resumes.length === 0;

    profile.resumes.push({
      key: uploadResult.key,
      filename: uploadResult.filename,
      mime: uploadResult.mime,
      size: uploadResult.size,
      isDefault: isFirst,
      uploadedAt: new Date(),
    });

    await profile.save();
    return this.getProfile(userId);
  }

  /**
   * Set a resume as default
   */
  async setDefaultResume(userId, resumeId) {
    const profile = await ApplicantProfile.findOne({ user: userId });
    if (!profile) {
      throw AppError.notFound('Profile not found');
    }

    const resumeExists = profile.resumes.some((r) => r._id.toString() === resumeId);
    if (!resumeExists) {
      throw AppError.notFound('Resume not found in profile');
    }

    profile.resumes.forEach((r) => {
      r.isDefault = r._id.toString() === resumeId;
    });

    await profile.save();
    return this.getProfile(userId);
  }

  /**
   * Delete resume from storage and profile
   */
  async deleteResume(userId, resumeId) {
    const profile = await ApplicantProfile.findOne({ user: userId });
    if (!profile) {
      throw AppError.notFound('Profile not found');
    }

    const resumeIndex = profile.resumes.findIndex((r) => r._id.toString() === resumeId);
    if (resumeIndex === -1) {
      throw AppError.notFound('Resume not found in profile');
    }

    const [deletedResume] = profile.resumes.splice(resumeIndex, 1);

    // Delete physical file from storage
    await storageService.deleteFile(deletedResume.key);

    // If the deleted resume was default and other resumes remain, set the first as default
    if (deletedResume.isDefault && profile.resumes.length > 0) {
      profile.resumes[0].isDefault = true;
    }

    await profile.save();
    return this.getProfile(userId);
  }

  /**
   * GDPR / Privacy: Export user data (JSON)
   */
  async exportData(userId) {
    const user = await User.findById(userId).lean();
    if (!user) {
      throw AppError.notFound('User not found');
    }

    const profile = await ApplicantProfile.findOne({ user: userId }).lean();
    const rawApplications = await Application.find({ applicant: userId })
      .populate('job', 'title status location salary')
      .populate('company', 'name website location')
      .lean();

    // Sanitize applications: internal notes and ratings must NEVER appear in applicant responses
    const applications = rawApplications.map((app) => {
      delete app.notes;
      delete app.rating;
      return app;
    });
    const notifications = await Notification.find({ user: userId }).lean();

    return {
      exportedAt: new Date().toISOString(),
      account: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      profile: profile || null,
      applications: applications || [],
      notifications: notifications || [],
    };
  }

  /**
   * GDPR / Privacy: Delete account & clean up resumes, anonymize applications
   */
  async deleteAccount(userId) {
    const profile = await ApplicantProfile.findOne({ user: userId });

    if (profile) {
      // Delete all uploaded resumes from storage
      for (const resume of profile.resumes) {
        await storageService.deleteFile(resume.key);
      }
      await ApplicantProfile.deleteOne({ _id: profile._id });
    }

    // Anonymize applications submitted by user (protect historical ATS record while erasing PII)
    await Application.updateMany(
      { applicant: userId },
      {
        $set: {
          coverNote: '[Candidate account deleted]',
          'resume.filename': '[Deleted]',
        },
      }
    );

    // Remove user notifications
    await Notification.deleteMany({ user: userId });

    // Delete user record
    await User.findByIdAndDelete(userId);

    return { message: 'Account and associated profile data deleted successfully' };
  }

  /**
   * Save / Bookmark a job
   */
  async saveJob(userId, jobId) {
    const job = await Job.findById(jobId);
    if (!job) {
      throw AppError.notFound('Job not found');
    }

    let profile = await ApplicantProfile.findOne({ user: userId });
    if (!profile) {
      profile = await ApplicantProfile.create({ user: userId });
    }

    const alreadySaved = profile.savedJobs.some((id) => id.toString() === jobId);
    if (!alreadySaved) {
      profile.savedJobs.push(jobId);
      await profile.save();
    }

    return { saved: true, savedJobs: profile.savedJobs };
  }

  /**
   * Unsave / Remove bookmark for a job
   */
  async unsaveJob(userId, jobId) {
    let profile = await ApplicantProfile.findOne({ user: userId });
    if (!profile) {
      profile = await ApplicantProfile.create({ user: userId });
    }

    profile.savedJobs = profile.savedJobs.filter((id) => id.toString() !== jobId);
    await profile.save();

    return { saved: false, savedJobs: profile.savedJobs };
  }

  /**
   * Get all saved jobs with populated details
   */
  async getSavedJobs(userId) {
    const profile = await ApplicantProfile.findOne({ user: userId }).populate({
      path: 'savedJobs',
      populate: {
        path: 'company',
        select: 'name slug logoKey location website',
      },
    });

    return profile ? profile.savedJobs : [];
  }
}

export const profileService = new ProfileService();

