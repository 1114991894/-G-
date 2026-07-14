import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { EmployeeController } from '../controllers/employee.controller';

const router = express.Router();
const employeeController = new EmployeeController();

// 所有路由需要认证
router.use(authenticate);

/**
 * @route GET /api/v1/employees
 * @desc 获取员工列表
 * @access Private
 */
router.get('/', authorize(['employee:view']), employeeController.getEmployees.bind(employeeController));

/**
 * @route GET /api/v1/employees/:id
 * @desc 获取员工详情
 * @access Private
 */
router.get('/:id', authorize(['employee:view']), employeeController.getEmployeeById.bind(employeeController));

/**
 * @route POST /api/v1/employees
 * @desc 创建员工
 * @access Private
 */
router.post('/', authorize(['employee:create']), employeeController.createEmployee.bind(employeeController));

/**
 * @route PUT /api/v1/employees/:id
 * @desc 更新员工
 * @access Private
 */
router.put('/:id', authorize(['employee:edit']), employeeController.updateEmployee.bind(employeeController));

/**
 * @route DELETE /api/v1/employees/:id
 * @desc 删除员工
 * @access Private
 */
router.delete('/:id', authorize(['employee:delete']), employeeController.deleteEmployee.bind(employeeController));

/**
 * @route POST /api/v1/employees/import
 * @desc 批量导入员工
 * @access Private
 */
router.post('/import', authorize(['employee:create']), employeeController.importEmployees.bind(employeeController));

/**
 * @route GET /api/v1/employees/export
 * @desc 导出员工
 * @access Private
 */
router.get('/export', authorize(['employee:view']), employeeController.exportEmployees.bind(employeeController));

export default router;
