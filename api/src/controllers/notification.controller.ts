import { Request, Response } from 'express';
import { Notification } from '../models';

export class NotificationController {
  /**
   * 获取通知列表
   */
  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, pageSize = 20, type, isRead } = req.query;
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.id;

      const where: any = { tenantId, userId };
      
      if (type) where.type = type;
      if (isRead !== undefined) where.isRead = isRead === 'true';

      const offset = (Number(page) - 1) * Number(pageSize);
      
      const { count, rows } = await Notification.findAndCountAll({
        where,
        limit: Number(pageSize),
        offset,
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          list: rows,
          total: count,
          page: Number(page),
          pageSize: Number(pageSize)
        }
      });
    } catch (error) {
      console.error('获取通知列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取失败'
      });
    }
  }

  /**
   * 获取通知详情
   */
  async getNotificationById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.id;

      const notification = await Notification.findOne({
        where: { id, tenantId, userId }
      });

      if (!notification) {
        res.status(404).json({
          success: false,
          message: '通知不存在'
        });
        return;
      }

      // 标记为已读
      if (!notification.isRead) {
        await notification.update({
          isRead: true,
          readAt: new Date()
        });
      }

      res.json({
        success: true,
        data: notification
      });
    } catch (error) {
      console.error('获取通知详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取失败'
      });
    }
  }

  /**
   * 标记已读
   */
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.id;

      const notification = await Notification.findOne({
        where: { id, tenantId, userId }
      });

      if (!notification) {
        res.status(404).json({
          success: false,
          message: '通知不存在'
        });
        return;
      }

      await notification.update({
        isRead: true,
        readAt: new Date()
      });

      res.json({
        success: true,
        message: '标记成功'
      });
    } catch (error) {
      console.error('标记已读失败:', error);
      res.status(500).json({
        success: false,
        message: '标记失败'
      });
    }
  }

  /**
   * 全部标记已读
   */
  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.id;

      await Notification.update(
        { isRead: true, readAt: new Date() },
        { where: { tenantId, userId, isRead: false } }
      );

      res.json({
        success: true,
        message: '全部标记已读'
      });
    } catch (error) {
      console.error('标记全部已读失败:', error);
      res.status(500).json({
        success: false,
        message: '标记失败'
      });
    }
  }

  /**
   * 删除通知
   */
  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.id;

      const notification = await Notification.findOne({
        where: { id, tenantId, userId }
      });

      if (!notification) {
        res.status(404).json({
          success: false,
          message: '通知不存在'
        });
        return;
      }

      await notification.destroy();

      res.json({
        success: true,
        message: '删除成功'
      });
    } catch (error) {
      console.error('删除通知失败:', error);
      res.status(500).json({
        success: false,
        message: '删除失败'
      });
    }
  }

  /**
   * 获取未读通知数量
   */
  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.id;

      const count = await Notification.count({
        where: { tenantId, userId, isRead: false }
      });

      res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      console.error('获取未读通知数量失败:', error);
      res.status(500).json({
        success: false,
        message: '获取失败'
      });
    }
  }
}

export default NotificationController;
