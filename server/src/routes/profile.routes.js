import { Router } from 'express';
import { profileController } from '../controllers/profile.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadResumeMiddleware, verifyMagicBytes } from '../middleware/upload.js';
import {
  updateProfileSchema,
  resumeIdParamSchema,
} from '../validators/profile.validator.js';

export const profileRouter = Router();

// Profile CRUD
profileRouter.get('/', authenticate, profileController.getProfile);

profileRouter.put(
  '/',
  authenticate,
  validate({ body: updateProfileSchema }),
  profileController.updateProfile
);

// Resume management
profileRouter.post(
  '/resumes',
  authenticate,
  uploadResumeMiddleware,
  verifyMagicBytes,
  profileController.uploadResume
);

profileRouter.patch(
  '/resumes/:id',
  authenticate,
  validate({ params: resumeIdParamSchema }),
  profileController.setDefaultResume
);

profileRouter.delete(
  '/resumes/:id',
  authenticate,
  validate({ params: resumeIdParamSchema }),
  profileController.deleteResume
);

// Secure authenticated raw file stream (for local storage driver)
profileRouter.get(
  '/resumes/raw/:key',
  authenticate,
  profileController.serveLocalResume
);

// Privacy endpoints
profileRouter.get('/export', authenticate, profileController.exportData);
profileRouter.delete('/', authenticate, profileController.deleteAccount);

