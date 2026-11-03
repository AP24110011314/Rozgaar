import { Router } from 'express';
import { jobController } from '../controllers/job.controller.js';
import { profileController } from '../controllers/profile.controller.js';
import { applicationController } from '../controllers/application.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createJobSchema,
  updateJobSchema,
  jobStatusSchema,
  jobIdParamSchema,
  jobSearchQuerySchema,
  reportJobSchema,
} from '../validators/job.validator.js';
import {
  applyJobSchema,
  jobApplicationsQuerySchema,
} from '../validators/application.validator.js';
import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const jobIdParam = z.object({
  jobId: z.string().regex(objectIdRegex, 'Invalid job ID format'),
}).strict();

export const jobRouter = Router();

// Public search
jobRouter.get('/', validate({ query: jobSearchQuerySchema }), jobController.searchJobs);

// Recruiter jobs listing (before :id)
jobRouter.get('/recruiter', authenticate, authorize('recruiter', 'admin'), jobController.getRecruiterJobs);

// Saved jobs endpoints (before :id)
jobRouter.get('/saved', authenticate, profileController.getSavedJobs);

// Applications on Job
jobRouter.post(
  '/:jobId/applications',
  authenticate,
  authorize('applicant'),
  validate({ params: jobIdParam, body: applyJobSchema }),
  applicationController.applyToJob
);

jobRouter.get(
  '/:jobId/applications',
  authenticate,
  authorize('recruiter', 'admin'),
  validate({ params: jobIdParam, query: jobApplicationsQuerySchema }),
  applicationController.getJobApplications
);

// Public single job detail
jobRouter.get('/:id', validate({ params: jobIdParamSchema }), jobController.getJobById);

// Recruiter Job CRUD
jobRouter.post(
  '/',
  authenticate,
  authorize('recruiter', 'admin'),
  validate({ body: createJobSchema }),
  jobController.createJob
);

jobRouter.put(
  '/:id',
  authenticate,
  authorize('recruiter', 'admin'),
  validate({ params: jobIdParamSchema, body: updateJobSchema }),
  jobController.updateJob
);

jobRouter.patch(
  '/:id/status',
  authenticate,
  authorize('recruiter', 'admin'),
  validate({ params: jobIdParamSchema, body: jobStatusSchema }),
  jobController.changeJobStatus
);

jobRouter.delete(
  '/:id',
  authenticate,
  authorize('recruiter', 'admin'),
  validate({ params: jobIdParamSchema }),
  jobController.deleteJob
);

// Report job
jobRouter.post(
  '/:id/report',
  authenticate,
  validate({ params: jobIdParamSchema, body: reportJobSchema }),
  jobController.reportJob
);

// Save / Unsave bookmark endpoints
jobRouter.post(
  '/:id/save',
  authenticate,
  validate({ params: jobIdParamSchema }),
  profileController.saveJob
);

jobRouter.delete(
  '/:id/save',
  authenticate,
  validate({ params: jobIdParamSchema }),
  profileController.unsaveJob
);
