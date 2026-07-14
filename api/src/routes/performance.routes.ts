import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { PerformanceController } from '../controllers/performance.controller';

const router = express.Router();
const performanceController = new PerformanceController();

// 所有路由需要认证
router.use(authenticate);

/**
 * @route GET /api/v1/performance/cycles
 * @desc 获取绩效周期列表
 * @access Private
 */
router.get('/cycles', authorize(['performance:view']), performanceController.getCycles.bind(performanceController));

/**
 * @route POST /api/v1/performance/cycles
 * @desc 创建绩效周期
 * @access Private
 */
router.post('/cycles', authorize(['performance:create']), performanceController.createCycle.bind(performanceController));

/**
 * @route GET /api/v1/performance/cycles/:id
 * @desc 获取绩效周期详情
 * @access Private
 */
router.get('/cycles/:id', authorize(['performance:view']), performanceController.getCycleById.bind(performanceController));

/**
 * @route PUT /api/v1/performance/cycles/:id
 * @desc 更新绩效周期
 * @access Private
 */
router.put('/cycles/:id', authorize(['performance:edit']), performanceController.updateCycle.bind(performanceController));

/**
 * @route POST /api/v1/performance/cycles/:id/activate
 * @desc 激活绩效周期
 * @access Private
 */
router.post('/cycles/:id/activate', authorize(['performance:edit']), performanceController.activateCycle.bind(performanceController));

/**
 * @route GET /api/v1/performance/dashboard
 * @desc 获取绩效看板
 * @access Private
 */
router.get('/dashboard', authorize(['performance:view']), performanceController.getDashboard.bind(performanceController));

/**
 * @route GET /api/v1/performance/scores
 * @desc 获取评分列表
 * @access Private
 */
router.get('/scores', authorize(['performance:view']), performanceController.getScores.bind(performanceController));

/**
 * @route POST /api/v1/performance/scores
 * @desc 提交评分
 * @access Private
 */
router.post('/scores', authorize(['performance:score']), performanceController.submitScore.bind(performanceController));

export default router;
