import { Request, Response } from 'express';
import { User, Role, Department, Employee } from '../models';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';

export class UserController {
  /**
   * 获取用户列表
   */
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, pageSize = 20, keyword, status, roleId, departmentId } = req.query;
      const tenantId = (req as any).user?.tenantId;

      const where: any = { tenantId };
      
      if (keyword) {
        where[Op.or] = [
          { username: { [Op.like]: `%${keyword}%` } },
          { realName: { [Op.like]: `%${keyword}%` } },
          { email: { [Op.like]: `%${keyword}%` } }
        ];
      }
      
      if (status) where.status = status;
      if (roleId) where.roleId = roleId;
      if (departmentId) where.departmentId = departmentId;

      const offset = (Number(page) - 1) * Number(pageSize);
      
      const { count, rows } = await User.findAndCountAll({
        where,
        include: [
          { model: Role, as: 'role' },
          { model: Department, as: 'department' },
          { model: Employee, as: 'employee' }
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
      console.error('获取用户列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取失败'
      });
    }
  }

  /**
   * 获取用户详情
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = (req as any).user?.tenantId;

      const user = await User.findOne({
        where: { id, tenantId },
        include: [
          { model: Role, as: 'role' },
          { model: Department, as: 'department' },
          { model: Employee, as: 'employee' }
        ]
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在'
        });
        return;
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('获取用户详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取失败'
      });
    }
  }

  /**
   * 创建用户
   */
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { username, password, email, phone, realName, roleId, departmentId, employeeId } = req.body;
      const tenantId = (req as any).user?.tenantId;

      // 检查用户名是否存在
      const existingUser = await User.findOne({
        where: { tenantId, username }
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          message: '用户名已存在'
        });
        return;
      }

      // 检查手机号是否已被使用
      const phoneUser = await User.findOne({
        where: { tenantId, phone }
      });

      if (phoneUser) {
        res.status(400).json({
          success: false,
          message: '该手机号已被注册'
        });
        return;
      }

      // 支持角色代码或角色ID
      let actualRoleId = roleId;
      if (!roleId || !roleId.includes('-')) {
        const role = await Role.findOne({
          where: { tenantId, code: roleId }
        });
        if (!role) {
          res.status(400).json({
            success: false,
            message: '角色不存在'
          });
          return;
        }
        actualRoleId = role.id;
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password || '123456', 10);

      // 创建用户
      const user = await User.create({
        tenantId,
        username,
        password: hashedPassword,
        email: email || '',
        phone,
        realName,
        roleId: actualRoleId,
        departmentId,
        employeeId,
        status: 'active'
      });

      res.status(201).json({
        success: true,
        message: '创建成功',
        data: user
      });
    } catch (error) {
      console.error('创建用户失败:', error);
      res.status(500).json({
        success: false,
        message: '创建失败'
      });
    }
  }

  /**
   * 更新用户
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { email, phone, realName, roleId, departmentId, employeeId, status } = req.body;
      const tenantId = (req as any).user?.tenantId;

      const user = await User.findOne({
        where: { id, tenantId }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在'
        });
        return;
      }

      // 更新用户
      await user.update({
        email,
        phone,
        realName,
        roleId,
        departmentId,
        employeeId,
        status
      });

      res.json({
        success: true,
        message: '更新成功'
      });
    } catch (error) {
      console.error('更新用户失败:', error);
      res.status(500).json({
        success: false,
        message: '更新失败'
      });
    }
  }

  /**
   * 删除用户
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = (req as any).user?.tenantId;

      const user = await User.findOne({
        where: { id, tenantId }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在'
        });
        return;
      }

      // 软删除（更新状态）
      await user.update({ status: 'inactive' });

      res.json({
        success: true,
        message: '删除成功'
      });
    } catch (error) {
      console.error('删除用户失败:', error);
      res.status(500).json({
        success: false,
        message: '删除失败'
      });
    }
  }

  /**
   * 重置密码
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { password } = req.body;
      const tenantId = (req as any).user?.tenantId;

      const user = await User.findOne({
        where: { id, tenantId }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在'
        });
        return;
      }

      // 加密新密码
      const hashedPassword = await bcrypt.hash(password || '123456', 10);

      // 更新密码
      await user.update({
        password: hashedPassword,
        passwordVersion: user.passwordVersion + 1
      });

      res.json({
        success: true,
        message: '密码重置成功'
      });
    } catch (error) {
      console.error('重置密码失败:', error);
      res.status(500).json({
        success: false,
        message: '重置失败'
      });
    }
  }

  /**
   * 更新状态
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const tenantId = (req as any).user?.tenantId;

      const user = await User.findOne({
        where: { id, tenantId }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在'
        });
        return;
      }

      await user.update({ status });

      res.json({
        success: true,
        message: '状态更新成功'
      });
    } catch (error) {
      console.error('更新状态失败:', error);
      res.status(500).json({
        success: false,
        message: '更新失败'
      });
    }
  }
}

export default UserController;
