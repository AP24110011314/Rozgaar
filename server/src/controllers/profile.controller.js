import { profileService } from '../services/profile.service.js';
import { storageService } from '../services/storage.service.js';
import { ApplicantProfile } from '../models/ApplicantProfile.js';
import { Application } from '../models/Application.js';
import { AppError } from '../utils/appError.js';

export class ProfileController {
  async getProfile(req, res, next) {
    try {
      const profile = await profileService.getProfile(req.user._id);
      res.status(200).json({
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const profile = await profileService.updateProfile(req.user._id, req.body);
      res.status(200).json({
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  }

  async uploadResume(req, res, next) {
    try {
      const updatedProfile = await profileService.uploadResume(
        req.user._id,
        req.file,
        req.fileMetadata
      );
      res.status(201).json({
        data: {
          resumes: updatedProfile.resumes,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async setDefaultResume(req, res, next) {
    try {
      const updatedProfile = await profileService.setDefaultResume(
        req.user._id,
        req.params.id
      );
      res.status(200).json({
        data: {
          resumes: updatedProfile.resumes,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteResume(req, res, next) {
    try {
      const updatedProfile = await profileService.deleteResume(
        req.user._id,
        req.params.id
      );
      res.status(200).json({
        data: {
          resumes: updatedProfile.resumes,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Serve local resume securely (authorized: candidate owner OR recruiter of company candidate applied to)
   */
  async serveLocalResume(req, res, next) {
    try {
      const { key } = req.params;

      // Authorisation check: owner or recruiter of applied job
      const isOwner = await ApplicantProfile.findOne({
        user: req.user._id,
        'resumes.key': key,
      });

      let isAuthorizedRecruiter = false;
      if (!isOwner && req.user.role === 'recruiter' && req.user.company) {
        const hasApplication = await Application.findOne({
          company: req.user.company._id || req.user.company,
          'resume.key': key,
        });
        if (hasApplication) {
          isAuthorizedRecruiter = true;
        }
      }

      if (!isOwner && !isAuthorizedRecruiter && req.user.role !== 'admin') {
        throw AppError.forbidden('You do not have permission to view or download this resume');
      }

      const stream = storageService.getLocalStream(key);
      res.setHeader('Content-Type', key.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `inline; filename="resume-${key}"`);
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }

  async exportData(req, res, next) {
    try {
      const data = await profileService.exportData(req.user._id);
      res.status(200).json({
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteAccount(req, res, next) {
    try {
      const result = await profileService.deleteAccount(req.user._id);
      res.clearCookie('refreshToken', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/api/v1/auth',
      });
      res.status(200).json({
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async saveJob(req, res, next) {
    try {
      const result = await profileService.saveJob(req.user._id, req.params.id);
      res.status(200).json({
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async unsaveJob(req, res, next) {
    try {
      const result = await profileService.unsaveJob(req.user._id, req.params.id);
      res.status(200).json({
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getSavedJobs(req, res, next) {
    try {
      const savedJobs = await profileService.getSavedJobs(req.user._id);
      res.status(200).json({
        data: savedJobs,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const profileController = new ProfileController();

