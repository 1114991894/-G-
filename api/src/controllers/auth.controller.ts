import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, Tenant, Role, Employee } from '../models';
import { Op } from 'sequelize';

export class AuthController {
  /**
   * 登录
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password, tenantId } = req.body;

      // 验证参数
      if (!username || !password) {
        res.status(400).json({
          success: false,
          message: '用户名和密码不能为空'
        });
        return;
      }

      // 查询用户
      const where: any = {
        [Op.or]: [
          { username: username },
          { email: username },
          { phone: username }
        ]
      };

      if (tenantId) {
        where.tenantId = tenantId;
      }

      const user = await User.findOne({
        where,
        include: [
          { model: Tenant, as: 'tenant' },
          { model: Role, as: 'role' },
          { model: Employee, as: 'employee' }
        ]
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
        return;
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
        return;
      }

      // 检查账号状态
      if (user.status !== 'active') {
        res.status(401).json({
          success: false,
          message: '账号已被禁用'
        });
        return;
      }

      // 检查租户状态
      if (user.tenant && user.tenant.status !== 'active') {
        res.status(401).json({
          success: false,
          message: '企业账号已被禁用'
        });
        return;
      }

      const token = jwt.sign(
        { userId: user.id, tenantId: user.tenantId, roleId: user.roleId },
        process.env.JWT_SECRET || 'bwg_performance_2024_secret_key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '2h' } as jwt.SignOptions
      );

      // 更新最后登录信息
      await user.update({
        lastLoginAt: new Date(),
        lastLoginIp: req.ip,
        loginCount: user.loginCount + 1
      });

      // 返回结果
      res.json({
        success: true,
        message: '登录成功',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            realName: user.realName,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
            role: user.role,
            tenant: user.tenant,
            employee: user.employee
          }
        }
      });
    } catch (error) {
      console.error('登录失败:', error);
      res.status(500).json({
        success: false,
        message: '登录失败'
      });
    }
  }

  /**
   * 注册试用
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { companyName, contactName, contactPhone, contactEmail, password } = req.body;

      // 验证参数
      if (!companyName || !contactName || !contactPhone || !password) {
        res.status(400).json({
          success: false,
          message: '缺少必填参数'
        });
        return;
      }

      // 创建租户
      const tenant = await Tenant.create({
        name: companyName,
        type: 'client',
        contactName,
        contactPhone,
        contactEmail,
        status: 'trial',
        trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天试用
      });

      // 创建默认角色
      const adminRole = await Role.create({
        tenantId: tenant.id,
        name: '管理员',
        code: 'admin',
        description: '系统管理员',
        permissions: {
          system: true,
          performance: true,
          talent: true,
          report: true
        },
        dataScope: 'all',
        level: 1,
        status: 'active'
      });

      // 创建用户
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        tenantId: tenant.id,
        username: contactPhone,
        password: hashedPassword,
        email: contactEmail || '',
        realName: contactName,
        roleId: adminRole.id,
        status: 'active'
      });

      res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          tenantId: tenant.id,
          userId: user.id
        }
      });
    } catch (error) {
      console.error('注册失败:', error);
      res.status(500).json({
        success: false,
        message: '注册失败'
      });
    }
  }

  /**
   * 登出
   */
  async logout(_req: Request, res: Response): Promise<void> {
    try {
      res.json({
        success: true,
        message: '登出成功'
      });
    } catch (error) {
      console.error('登出失败:', error);
      res.status(500).json({
        success: false,
        message: '登出失败'
      });
    }
  }

  /**
   * 刷新token
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'refreshToken不能为空'
        });
        return;
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'bwg_performance_2024_secret_key') as any;

      const newToken = jwt.sign(
        { userId: decoded.userId, tenantId: decoded.tenantId, roleId: decoded.roleId },
        process.env.JWT_SECRET || 'bwg_performance_2024_secret_key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '2h' } as jwt.SignOptions
      );

      res.json({
        success: true,
        message: '刷新成功',
        data: {
          token: newToken
        }
      });
    } catch (error) {
      console.error('刷新token失败:', error);
      res.status(401).json({
        success: false,
        message: '刷新token失败'
      });
    }
  }

  /**
   * 忘记密码
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: '邮箱不能为空'
        });
        return;
      }

      // TODO: 发送重置密码邮件

      res.json({
        success: true,
        message: '重置密码邮件已发送'
      });
    } catch (error) {
      console.error('忘记密码失败:', error);
      res.status(500).json({
        success: false,
        message: '操作失败'
      });
    }
  }

  /**
   * 重置密码
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        res.status(400).json({
          success: false,
          message: '参数不能为空'
        });
        return;
      }

      // TODO: 验证token并重置密码

      res.json({
        success: true,
        message: '密码重置成功'
      });
    } catch (error) {
      console.error('重置密码失败:', error);
      res.status(500).json({
        success: false,
        message: '操作失败'
      });
    }
  }

  /**
   * 搜索租户（公司）
   */
  async searchTenants(req: Request, res: Response): Promise<void> {
    try {
      const { keyword } = req.query;

      if (!keyword) {
        res.json({
          success: true,
          data: []
        });
        return;
      }

      const tenants = await Tenant.findAll({
        where: {
          name: { [Op.like]: `%${keyword}%` },
          status: 'active'
        },
        limit: 10
      });

      res.json({
        success: true,
        data: tenants
      });
    } catch (error) {
      console.error('搜索租户失败:', error);
      res.status(500).json({
        success: false,
        message: '搜索失败'
      });
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未认证'
        });
        return;
      }

      const user = await User.findByPk(userId, {
        include: [
          { model: Tenant, as: 'tenant' },
          { model: Role, as: 'role' },
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
        data: {
          id: user.id,
          username: user.username,
          realName: user.realName,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role,
          tenant: user.tenant,
          employee: user.employee
        }
      });
    } catch (error) {
      console.error('获取用户信息失败:', error);
      res.status(500).json({
        success: false,
        message: '获取失败'
      });
    }
  }
}

export default AuthController;
