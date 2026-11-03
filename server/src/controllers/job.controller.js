import { jobService } from '../services/job.service.js';
import { AppError } from '../utils/appError.js';

export class JobController {
  async searchJobs(req, res, next) {
    try {
      const result = await jobService.searchJobs(req.query);
      res.status(200).json({
        data: result.jobs,
        meta: result.meta,
      });
    } catch (err) {
      next(err);
    }
  }

  async getJobById(req, res, next) {
    try {
      const job = await jobService.getJobById(req.params.id);
      res.status(200).json({
        data: job,
      });
    } catch (err) {
      next(err);
    }
  }

  async createJob(req, res, next) {
    try {
      const job = await jobService.createJob(req.user, req.body);
      res.status(201).json({
        data: job,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateJob(req, res, next) {
    try {
      const job = await jobService.updateJob(req.user, req.params.id, req.body);
      res.status(200).json({
        data: job,
      });
    } catch (err) {
      next(err);
    }
  }

  async changeJobStatus(req, res, next) {
    try {
      const job = await jobService.changeJobStatus(req.user, req.params.id, req.body.status);
      res.status(200).json({
        data: job,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteJob(req, res, next) {
    try {
      const result = await jobService.deleteJob(req.user, req.params.id);
      res.status(200).json({
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async reportJob(req, res, next) {
    try {
      const report = await jobService.reportJob(req.user._id, req.params.id, req.body);
      res.status(201).json({
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }

  async getRecruiterJobs(req, res, next) {
    try {
      if (!req.user.company) {
        throw AppError.forbidden('You do not belong to a company');
      }
      const companyId = req.user.company._id || req.user.company;
      const jobs = await jobService.getRecruiterJobs(companyId);
      res.status(200).json({
        data: jobs,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const jobController = new JobController();

