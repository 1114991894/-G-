import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { DepartmentController } from '../controllers/department.controller';

const router = express.Router();
const departmentController = new DepartmentController();

// 所有路由需要认证
router.use(authenticate);

/**
 * @route GET /api/v1/departments
 * @desc 获取部门列表（树形）
 * @access Private
 */
router.get('/', authorize(['department:view']), departmentController.getDepartments.bind(departmentController));

/**
 * @route GET /api/v1/departments/:id
 * @desc 获取部门详情
 * @access Private
 */
router.get('/:id', authorize(['department:view']), departmentController.getDepartmentById.bind(departmentController));

/**
 * @route POST /api/v1/departments
 * @desc 创建部门
 * @access Private
 */
router.post('/', authorize(['department:create']), departmentController.createDepartment.bind(departmentController));

/**
 * @route PUT /api/v1/departments/:id
 * @desc 更新部门
 * @access Private
 */
router.put('/:id', authorize(['department:edit']), departmentController.updateDepartment.bind(departmentController));

/**
 * @route DELETE /api/v1/departments/:id
 * @desc 删除部门
 * @access Private
 */
router.delete('/:id', authorize(['department:delete']), departmentController.deleteDepartment.bind(departmentController));

/**
 * @route GET /api/v1/departments/:id/employees
 * @desc 获取部门员工
 * @access Private
 */
router.get('/:id/employees', authorize(['department:view']), departmentController.getDepartmentEmployees.bind(departmentController));

export default router;
