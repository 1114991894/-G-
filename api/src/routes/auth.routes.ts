import express from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = express.Router();
const authController = new AuthController();

/**
 * @route POST /api/v1/auth/login
 * @desc 登录
 * @access Public
 */
router.post('/login', authController.login.bind(authController));

/**
 * @route POST /api/v1/auth/register
 * @desc 注册试用
 * @access Public
 */
router.post('/register', authController.register.bind(authController));

/**
 * @route POST /api/v1/auth/logout
 * @desc 登出
 * @access Private
 */
router.post('/logout', authController.logout.bind(authController));

/**
 * @route POST /api/v1/auth/refresh
 * @desc 刷新token
 * @access Public
 */
router.post('/refresh', authController.refreshToken.bind(authController));

/**
 * @route POST /api/v1/auth/forgot-password
 * @desc 忘记密码
 * @access Public
 */
router.post('/forgot-password', authController.forgotPassword.bind(authController));

/**
 * @route POST /api/v1/auth/reset-password
 * @desc 重置密码
 * @access Public
 */
router.post('/reset-password', authController.resetPassword.bind(authController));

/**
 * @route GET /api/v1/auth/tenants
 * @desc 搜索租户（公司）
 * @access Public
 */
router.get('/tenants', authController.searchTenants.bind(authController));

/**
 * @route GET /api/v1/auth/me
 * @desc 获取当前用户信息
 * @access Private
 */
router.get('/me', authController.getCurrentUser.bind(authController));

export default router;
