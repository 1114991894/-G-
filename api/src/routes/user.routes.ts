import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserController } from '../controllers/user.controller';

const router = express.Router();
const userController = new UserController();

// 所有路由需要认证
router.use(authenticate);

/**
 * @route GET /api/v1/users
 * @desc 获取用户列表
 * @access Private
 */
router.get('/', authorize(['user:view']), userController.getUsers.bind(userController));

/**
 * @route GET /api/v1/users/:id
 * @desc 获取用户详情
 * @access Private
 */
router.get('/:id', authorize(['user:view']), userController.getUserById.bind(userController));

/**
 * @route POST /api/v1/users
 * @desc 创建用户
 * @access Private
 */
router.post('/', authorize(['user:create']), userController.createUser.bind(userController));

/**
 * @route PUT /api/v1/users/:id
 * @desc 更新用户
 * @access Private
 */
router.put('/:id', authorize(['user:edit']), userController.updateUser.bind(userController));

/**
 * @route DELETE /api/v1/users/:id
 * @desc 删除用户
 * @access Private
 */
router.delete('/:id', authorize(['user:delete']), userController.deleteUser.bind(userController));

/**
 * @route PUT /api/v1/users/:id/reset-password
 * @desc 重置密码
 * @access Private
 */
router.put('/:id/reset-password', authorize(['user:edit']), userController.resetPassword.bind(userController));

/**
 * @route PUT /api/v1/users/:id/status
 * @desc 更新状态
 * @access Private
 */
router.put('/:id/status', authorize(['user:edit']), userController.updateStatus.bind(userController));

export default router;
