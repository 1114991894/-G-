import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { GoalController } from '../controllers/goal.controller';

const router = express.Router();
const goalController = new GoalController();

// 所有路由需要认证
router.use(authenticate);

/**
 * @route GET /api/v1/goals
 * @desc 获取目标列表
 * @access Private
 */
router.get('/', authorize(['goal:view']), goalController.getGoals.bind(goalController));

/**
 * @route GET /api/v1/goals/:id
 * @desc 获取目标详情
 * @access Private
 */
router.get('/:id', authorize(['goal:view']), goalController.getGoalById.bind(goalController));

/**
 * @route POST /api/v1/goals
 * @desc 创建目标
 * @access Private
 */
router.post('/', authorize(['goal:create']), goalController.createGoal.bind(goalController));

/**
 * @route PUT /api/v1/goals/:id
 * @desc 更新目标
 * @access Private
 */
router.put('/:id', authorize(['goal:edit']), goalController.updateGoal.bind(goalController));

/**
 * @route DELETE /api/v1/goals/:id
 * @desc 删除目标
 * @access Private
 */
router.delete('/:id', authorize(['goal:delete']), goalController.deleteGoal.bind(goalController));

/**
 * @route POST /api/v1/goals/:id/submit
 * @desc 提交目标审批
 * @access Private
 */
router.post('/:id/submit', authorize(['goal:edit']), goalController.submitGoal.bind(goalController));

/**
 * @route POST /api/v1/goals/:id/approve
 * @desc 审批目标
 * @access Private
 */
router.post('/:id/approve', authorize(['goal:approve']), goalController.approveGoal.bind(goalController));

/**
 * @route POST /api/v1/goals/:id/reject
 * @desc 驳回目标
 * @access Private
 */
router.post('/:id/reject', authorize(['goal:approve']), goalController.rejectGoal.bind(goalController));

export default router;
