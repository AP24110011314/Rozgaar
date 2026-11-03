import { notificationService } from '../services/notification.service.js';

export class NotificationController {
  async getUserNotifications(req, res, next) {
    try {
      const result = await notificationService.getUserNotifications(req.user._id);
      res.status(200).json({
        data: result.notifications,
        meta: {
          unreadCount: result.unreadCount,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const notification = await notificationService.markAsRead(
        req.user._id,
        req.params.id
      );
      res.status(200).json({
        data: notification,
      });
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.user._id);
      res.status(200).json({
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();

