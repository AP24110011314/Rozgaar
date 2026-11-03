import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  adminIdParamSchema,
  adminUsersQuerySchema,
  adminCompaniesQuerySchema,
  adminJobsQuerySchema,
  adminReportsQuerySchema,
  updateReportSchema,
} from '../validators/admin.validator.js';

export const adminRouter = Router();

// Protect all admin routes with authentication and strict admin role
adminRouter.use(authenticate, authorize('admin'));

// Dashboard Stats
adminRouter.get('/stats', adminController.getStats);

// User Moderation
adminRouter.get('/users', validate({ query: adminUsersQuerySchema }), adminController.getUsers);
adminRouter.patch('/users/:id/deactivate', validate({ params: adminIdParamSchema }), adminController.toggleUserActive);

// Company Moderation
adminRouter.get('/companies', validate({ query: adminCompaniesQuerySchema }), adminController.getCompanies);

// Job Moderation
adminRouter.get('/jobs', validate({ query: adminJobsQuerySchema }), adminController.getJobs);
adminRouter.patch('/jobs/:id/close', validate({ params: adminIdParamSchema }), adminController.closeJob);

// Reported Jobs Queue
adminRouter.get('/reports', validate({ query: adminReportsQuerySchema }), adminController.getReports);
adminRouter.patch(
  '/reports/:id',
  validate({ params: adminIdParamSchema, body: updateReportSchema }),
  adminController.updateReport
);

