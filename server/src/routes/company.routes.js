import { Router } from 'express';
import { companyController } from '../controllers/company.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createCompanySchema,
  updateCompanySchema,
  inviteMemberSchema,
  companyIdParamSchema,
} from '../validators/company.validator.js';

export const companyRouter = Router();

// Create Company
companyRouter.post(
  '/',
  authenticate,
  authorize('recruiter', 'admin'),
  validate({ body: createCompanySchema }),
  companyController.createCompany
);

// Get Company Profile (Public)
companyRouter.get(
  '/:id',
  validate({ params: companyIdParamSchema }),
  companyController.getCompany
);

// Update Company
companyRouter.put(
  '/:id',
  authenticate,
  authorize('recruiter', 'admin'),
  validate({ params: companyIdParamSchema, body: updateCompanySchema }),
  companyController.updateCompany
);

// Invite Team Member
companyRouter.post(
  '/:id/members',
  authenticate,
  authorize('recruiter', 'admin'),
  validate({ params: companyIdParamSchema, body: inviteMemberSchema }),
  companyController.inviteMember
);

// Get Company Open Jobs
companyRouter.get(
  '/:id/jobs',
  validate({ params: companyIdParamSchema }),
  companyController.getCompanyJobs
);

