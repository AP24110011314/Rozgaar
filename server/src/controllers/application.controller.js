import { applicationService } from '../services/application.service.js';

export class ApplicationController {
  async applyToJob(req, res, next) {
    try {
      const application = await applicationService.applyToJob(
        req.user,
        req.params.jobId,
        req.body
      );
      res.status(201).json({
        data: application,
      });
    } catch (err) {
      next(err);
    }
  }

  async getApplicantApplications(req, res, next) {
    try {
      const applications = await applicationService.getApplicantApplications(req.user._id);
      res.status(200).json({
        data: applications,
      });
    } catch (err) {
      next(err);
    }
  }

  async getApplicationById(req, res, next) {
    try {
      const application = await applicationService.getApplicationById(req.user, req.params.id);
      res.status(200).json({
        data: application,
      });
    } catch (err) {
      next(err);
    }
  }

  async withdrawApplication(req, res, next) {
    try {
      const application = await applicationService.withdrawApplication(
        req.user._id,
        req.params.id
      );
      res.status(200).json({
        data: application,
      });
    } catch (err) {
      next(err);
    }
  }

  async getJobApplications(req, res, next) {
    try {
      const applications = await applicationService.getJobApplicationsForRecruiter(
        req.user,
        req.params.jobId,
        req.query.stage
      );
      res.status(200).json({
        data: applications,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateStage(req, res, next) {
    try {
      const application = await applicationService.updateStage(
        req.user,
        req.params.id,
        req.body
      );
      res.status(200).json({
        data: application,
      });
    } catch (err) {
      next(err);
    }
  }

  async addInternalNote(req, res, next) {
    try {
      const notes = await applicationService.addInternalNote(
        req.user,
        req.params.id,
        req.body.text
      );
      res.status(201).json({
        data: notes,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateRating(req, res, next) {
    try {
      const application = await applicationService.updateRating(
        req.user,
        req.params.id,
        req.body.rating
      );
      res.status(200).json({
        data: application,
      });
    } catch (err) {
      next(err);
    }
  }

  async getResumeDownloadUrl(req, res, next) {
    try {
      const result = await applicationService.getResumeDownloadUrl(
        req.user,
        req.params.id
      );
      res.status(200).json({
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const applicationController = new ApplicationController();

