import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { notificationIdParamSchema } from '../validators/notification.validator.js';

export const notificationRouter = Router();

// Read all notifications (must be before :id)
notificationRouter.patch(
  '/read-all',
  authenticate,
  notificationController.markAllAsRead
);

// Get user notifications & unread count
notificationRouter.get(
  '/',
  authenticate,
  notificationController.getUserNotifications
);

// Mark single notification read
notificationRouter.patch(
  '/:id/read',
  authenticate,
  validate({ params: notificationIdParamSchema }),
  notificationController.markAsRead
);

