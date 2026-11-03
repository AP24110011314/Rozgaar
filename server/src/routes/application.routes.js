import { Router } from 'express';
import { applicationController } from '../controllers/application.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  applicationIdParamSchema,
  updateStageSchema,
  addNoteSchema,
  updateRatingSchema,
} from '../validators/application.validator.js';

export const applicationRouter = Router();

// Applicant & Admin: Get all personal applications (admin receives empty array if none)
applicationRouter.get(
  '/mine',
  authenticate,
  authorize('applicant', 'admin'),
  applicationController.getApplicantApplications
);

// Applicant & Recruiter: View single application
applicationRouter.get(
  '/:id',
  authenticate,
  validate({ params: applicationIdParamSchema }),
  applicationController.getApplicationById
);

// Applicant: Withdraw application
applicationRouter.patch(
  '/:id/withdraw',
  authenticate,
  authorize('applicant'),
  validate({ params: applicationIdParamSchema }),
  applicationController.withdrawApplication
);

// Recruiter: Move candidate stage & reorder
applicationRouter.patch(
  '/:id/stage',
  authenticate,
  authorize('recruiter', 'admin'),
  validate({ params: applicationIdParamSchema, body: updateStageSchema }),
  applicationController.updateStage
);

// Recruiter: Add internal note
applicationRouter.post(
  '/:id/notes',
  authenticate,
  authorize('recruiter', 'admin'),
  validate({ params: applicationIdParamSchema, body: addNoteSchema }),
  applicationController.addInternalNote
);

// Recruiter: Set rating (1-5)
applicationRouter.patch(
  '/:id/rating',
  authenticate,
  authorize('recruiter', 'admin'),
  validate({ params: applicationIdParamSchema, body: updateRatingSchema }),
  applicationController.updateRating
);

// Applicant & Recruiter: Secure presigned resume download URL
applicationRouter.get(
  '/:id/resume-url',
  authenticate,
  validate({ params: applicationIdParamSchema }),
  applicationController.getResumeDownloadUrl
);

