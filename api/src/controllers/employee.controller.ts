import { Request, Response } from 'express';
import { Employee, Department, User } from '../models';
import { Op } from 'sequelize';

export class EmployeeController {
  /**
   * 获取员工列表
   */
  async getEmployees(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, pageSize = 20, keyword, departmentId, status } = req.query;
      const tenantId = (req as any).user?.tenantId;

      const where: any = { tenantId };
      
      if (keyword) {
        where[Op.or] = [
          { name: { [Op.like]: `%${keyword}%` } },
          { employeeNo: { [Op.like]: `%${keyword}%` } },
          { phone: { [Op.like]: `%${keyword}%` } }
        ];
      }
      
      if (departmentId) where.departmentId = departmentId;
      if (status) where.status = status;

      const offset = (Number(page) - 1) * Number(pageSize);
      
      const { count, rows } = await Employee.findAndCountAll({
        where,
        include: [
          { model: Department, as: 'department' },
          { model: Employee, as: 'manager' }
        ],
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
      console.error('获取员工列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取失败'
      });
    }
  }

  /**
   * 获取员工详情
   */
  async getEmployeeById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = (req as any).user?.tenantId;

      const employee = await Employee.findOne({
        where: { id, tenantId },
        include: [
          { model: Department, as: 'department' },
          { model: Employee, as: 'manager' },
          { model: User, as: 'users' }
        ]
      });

      if (!employee) {
        res.status(404).json({
          success: false,
          message: '员工不存在'
        });
        return;
      }

      res.json({
        success: true,
        data: employee
      });
    } catch (error) {
      console.error('获取员工详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取失败'
      });
    }
  }

  /**
   * 创建员工
   */
  async createEmployee(req: Request, res: Response): Promise<void> {
    try {
      const { employeeNo, name, gender, phone, email, departmentId, position, managerId, entryDate } = req.body;
      const tenantId = (req as any).user?.tenantId;

      // 创建员工
      const employee = await Employee.create({
        tenantId,
        employeeNo,
        name,
        gender,
        phone,
        email,
        departmentId,
        position,
        managerId,
        entryDate,
        status: 'active'
      });

      res.status(201).json({
        success: true,
        message: '创建成功',
        data: employee
      });
    } catch (error) {
      console.error('创建员工失败:', error);
      res.status(500).json({
        success: false,
        message: '创建失败'
      });
    }
  }

  /**
   * 更新员工
   */
  async updateEmployee(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, gender, phone, email, departmentId, position, managerId, status } = req.body;
      const tenantId = (req as any).user?.tenantId;

      const employee = await Employee.findOne({
        where: { id, tenantId }
      });

      if (!employee) {
        res.status(404).json({
          success: false,
          message: '员工不存在'
        });
        return;
      }

      // 更新员工
      await employee.update({
        name,
        gender,
        phone,
        email,
        departmentId,
        position,
        managerId,
        status
      });

      res.json({
        success: true,
        message: '更新成功'
      });
    } catch (error) {
      console.error('更新员工失败:', error);
      res.status(500).json({
        success: false,
        message: '更新失败'
      });
    }
  }

  /**
   * 删除员工
   */
  async deleteEmployee(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = (req as any).user?.tenantId;

      const employee = await Employee.findOne({
        where: { id, tenantId }
      });

      if (!employee) {
        res.status(404).json({
          success: false,
          message: '员工不存在'
        });
        return;
      }

      // 软删除（更新状态）
      await employee.update({ status: 'inactive' });

      res.json({
        success: true,
        message: '删除成功'
      });
    } catch (error) {
      console.error('删除员工失败:', error);
      res.status(500).json({
        success: false,
        message: '删除失败'
      });
    }
  }

  /**
   * 批量导入员工
   */
  async importEmployees(_req: Request, res: Response): Promise<void> {
    try {
      res.json({
        success: true,
        message: '导入功能待实现'
      });
    } catch (error) {
      console.error('导入员工失败:', error);
      res.status(500).json({
        success: false,
        message: '导入失败'
      });
    }
  }

  /**
   * 导出员工
   */
  async exportEmployees(_req: Request, res: Response): Promise<void> {
    try {
      // TODO: 实现Excel导出逻辑
      res.json({
        success: true,
        message: '导出功能待实现'
      });
    } catch (error) {
      console.error('导出员工失败:', error);
      res.status(500).json({
        success: false,
        message: '导出失败'
      });
    }
  }
}

export default EmployeeController;
