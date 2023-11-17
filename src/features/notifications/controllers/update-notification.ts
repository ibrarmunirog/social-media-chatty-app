import { notificationQueue } from '@services/queues/notification.queue';
import { socketIONotificationObject } from '@sockets/notification';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export class UpdateNotificationController {
  public static async updateNotification(req: Request, res: Response): Promise<void> {
    const { notificationId } = req.params;
    socketIONotificationObject.emit('update notification', notificationId);
    notificationQueue.addNotificationJob('updateNotification', { key: notificationId });
    res.status(HTTP_STATUS.OK).json({ message: 'Notification marked as read' });
  }
}
