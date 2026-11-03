import { companyService } from '../services/company.service.js';

export class CompanyController {
  async createCompany(req, res, next) {
    try {
      const company = await companyService.createCompany(req.user, req.body);
      res.status(201).json({
        data: company,
      });
    } catch (err) {
      next(err);
    }
  }

  async getCompany(req, res, next) {
    try {
      const company = await companyService.getCompany(req.params.id);
      res.status(200).json({
        data: company,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateCompany(req, res, next) {
    try {
      const company = await companyService.updateCompany(req.user, req.params.id, req.body);
      res.status(200).json({
        data: company,
      });
    } catch (err) {
      next(err);
    }
  }

  async inviteMember(req, res, next) {
    try {
      const company = await companyService.inviteMember(req.user, req.params.id, req.body);
      res.status(200).json({
        data: company,
      });
    } catch (err) {
      next(err);
    }
  }

  async getCompanyJobs(req, res, next) {
    try {
      const jobs = await companyService.getCompanyJobs(req.params.id);
      res.status(200).json({
        data: jobs,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const companyController = new CompanyController();

