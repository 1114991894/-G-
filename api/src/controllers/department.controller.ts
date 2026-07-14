import { Request, Response } from 'express';
import { Department, Employee } from '../models';

export class DepartmentController {
  /**
   * 获取部门列表（树形）
   */
  async getDepartments(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId;
      const { type = 'tree' } = req.query;

      const departments = await Department.findAll({
        where: { tenantId, status: 'active' },
        order: [['sortOrder', 'ASC']]
      });

      if (type === 'tree') {
        // 构建树形结构
        const tree = this.buildTree(departments);
        res.json({
          success: true,
          data: tree
        });
      } else {
        res.json({
          success: true,
          data: departments
        });
      }
    } catch (error) {
      console.error('获取部门列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取失败'
      });
    }
  }

  /**
   * 构建树形结构
   */
  private buildTree(departments: any[]): any[] {
    const map = new Map();
    const roots: any[] = [];

    // 创建映射
    departments.forEach(dept => {
      map.set(dept.id, { ...dept.toJSON(), children: [] });
    });

    // 构建树
    departments.forEach(dept => {
      const node = map.get(dept.id);
      if (dept.parentId && map.has(dept.parentId)) {
        map.get(dept.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  /**
   * 获取部门详情
   */
  async getDepartmentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = (req as any).user?.tenantId;

      const department = await Department.findOne({
        where: { id, tenantId }
      });

      if (!department) {
        res.status(404).json({
          success: false,
          message: '部门不存在'
        });
        return;
      }

      res.json({
        success: true,
        data: department
      });
    } catch (error) {
      console.error('获取部门详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取失败'
      });
    }
  }

  /**
   * 创建部门
   */
  async createDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { name, code, parentId, managerId, description, sortOrder } = req.body;
      const tenantId = (req as any).user?.tenantId;

      // 计算层级和路径
      let level = 1;
      let path = '';

      if (parentId) {
        const parent = await Department.findOne({
          where: { id: parentId, tenantId }
        });

        if (parent) {
          level = parent.level + 1;
          path = parent.path ? `${parent.path},${parentId}` : parentId;
        }
      }

      // 创建部门
      const department = await Department.create({
        tenantId,
        name,
        code,
        parentId,
        level,
        path,
        sortOrder: sortOrder || 0,
        managerId,
        description,
        status: 'active'
      });

      res.status(201).json({
        success: true,
        message: '创建成功',
        data: department
      });
    } catch (error) {
      console.error('创建部门失败:', error);
      res.status(500).json({
        success: false,
        message: '创建失败'
      });
    }
  }

  /**
   * 更新部门
   */
  async updateDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, code, parentId, managerId, description, sortOrder, status } = req.body;
      const tenantId = (req as any).user?.tenantId;

      const department = await Department.findOne({
        where: { id, tenantId }
      });

      if (!department) {
        res.status(404).json({
          success: false,
          message: '部门不存在'
        });
        return;
      }

      // 更新部门
      await department.update({
        name,
        code,
        parentId,
        managerId,
        description,
        sortOrder,
        status
      });

      res.json({
        success: true,
        message: '更新成功'
      });
    } catch (error) {
      console.error('更新部门失败:', error);
      res.status(500).json({
        success: false,
        message: '更新失败'
      });
    }
  }

  /**
   * 删除部门
   */
  async deleteDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = (req as any).user?.tenantId;

      const department = await Department.findOne({
        where: { id, tenantId }
      });

      if (!department) {
        res.status(404).json({
          success: false,
          message: '部门不存在'
        });
        return;
      }

      // 检查是否有子部门
      const children = await Department.findAll({
        where: { parentId: id, tenantId }
      });

      if (children.length > 0) {
        res.status(400).json({
          success: false,
          message: '该部门下有子部门，无法删除'
        });
        return;
      }

      // 检查是否有员工
      const employees = await Employee.findAll({
        where: { departmentId: id, tenantId }
      });

      if (employees.length > 0) {
        res.status(400).json({
          success: false,
          message: '该部门下有员工，无法删除'
        });
        return;
      }

      // 删除部门
      await department.update({ status: 'inactive' });

      res.json({
        success: true,
        message: '删除成功'
      });
    } catch (error) {
      console.error('删除部门失败:', error);
      res.status(500).json({
        success: false,
        message: '删除失败'
      });
    }
  }

  /**
   * 获取部门员工
   */
  async getDepartmentEmployees(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = (req as any).user?.tenantId;

      const employees = await Employee.findAll({
        where: { departmentId: id, tenantId }
      });

      res.json({
        success: true,
        data: employees
      });
    } catch (error) {
      console.error('获取部门员工失败:', error);
      res.status(500).json({
        success: false,
        message: '获取失败'
      });
    }
  }
}

export default DepartmentController;
