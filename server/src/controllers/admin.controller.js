import { adminService } from '../services/admin.service.js';

export class AdminController {
  async getStats(req, res, next) {
    try {
      const stats = await adminService.getStats();
      res.status(200).json({
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }

  async getUsers(req, res, next) {
    try {
      const result = await adminService.getUsers(req.query);
      res.status(200).json({
        data: result.users,
        meta: result.meta,
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleUserActive(req, res, next) {
    try {
      const user = await adminService.toggleUserActive(req.user._id, req.params.id);
      res.status(200).json({
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  async getCompanies(req, res, next) {
    try {
      const result = await adminService.getCompanies(req.query);
      res.status(200).json({
        data: result.companies,
        meta: result.meta,
      });
    } catch (err) {
      next(err);
    }
  }

  async getJobs(req, res, next) {
    try {
      const result = await adminService.getJobs(req.query);
      res.status(200).json({
        data: result.jobs,
        meta: result.meta,
      });
    } catch (err) {
      next(err);
    }
  }

  async closeJob(req, res, next) {
    try {
      const job = await adminService.closeJob(req.params.id);
      res.status(200).json({
        data: job,
      });
    } catch (err) {
      next(err);
    }
  }

  async getReports(req, res, next) {
    try {
      const result = await adminService.getReports(req.query);
      res.status(200).json({
        data: result.reports,
        meta: result.meta,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateReport(req, res, next) {
    try {
      const report = await adminService.updateReport(req.params.id, req.body);
      res.status(200).json({
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();

