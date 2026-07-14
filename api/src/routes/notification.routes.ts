import express from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { NotificationController } from '../controllers/notification.controller';

const router = express.Router();
const notificationController = new NotificationController();

// 所有路由需要认证
router.use(authenticate);

/**
 * @route GET /api/v1/notifications
 * @desc 获取通知列表
 * @access Private
 */
router.get('/', notificationController.getNotifications.bind(notificationController));

/**
 * @route GET /api/v1/notifications/:id
 * @desc 获取通知详情
 * @access Private
 */
router.get('/:id', notificationController.getNotificationById.bind(notificationController));

/**
 * @route PUT /api/v1/notifications/:id/read
 * @desc 标记已读
 * @access Private
 */
router.put('/:id/read', notificationController.markAsRead.bind(notificationController));

/**
 * @route PUT /api/v1/notifications/read-all
 * @desc 全部标记已读
 * @access Private
 */
router.put('/read-all', notificationController.markAllAsRead.bind(notificationController));

/**
 * @route DELETE /api/v1/notifications/:id
 * @desc 删除通知
 * @access Private
 */
router.delete('/:id', notificationController.deleteNotification.bind(notificationController));

/**
 * @route GET /api/v1/notifications/unread-count
 * @desc 获取未读通知数量
 * @access Private
 */
router.get('/unread-count', notificationController.getUnreadCount.bind(notificationController));

export default router;
