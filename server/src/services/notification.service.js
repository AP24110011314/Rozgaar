import { Notification } from '../models/Notification.js';
import { AppError } from '../utils/appError.js';

export class NotificationService {
  async getUserNotifications(userId) {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ user: userId })
        .populate({
          path: 'application',
          select: 'job stage',
          populate: { path: 'job', select: 'title' },
        })
        .sort({ createdAt: -1 })
        .limit(30),
      Notification.countDocuments({ user: userId, readAt: null }),
    ]);

    return {
      notifications,
      unreadCount,
    };
  }

  async markAsRead(userId, notificationId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      user: userId,
    });

    if (!notification) {
      throw AppError.notFound('Notification not found');
    }

    if (!notification.readAt) {
      notification.readAt = new Date();
      await notification.save();
    }

    return notification;
  }

  async markAllAsRead(userId) {
    await Notification.updateMany(
      { user: userId, readAt: null },
      { $set: { readAt: new Date() } }
    );

    return { message: 'All notifications marked as read' };
  }
}

export const notificationService = new NotificationService();

