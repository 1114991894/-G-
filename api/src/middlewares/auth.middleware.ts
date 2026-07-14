import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, Tenant, Role } from '../models';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      tenant?: any;
      role?: any;
      dataScope?: string;
      dataScopeFilter?: any;
    }
  }
}

export interface AuthRequest extends Request {
  user?: any;
  tenant?: any;
  role?: any;
}

/**
 * JWT认证中间件
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // 获取token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }

    const token = authHeader.split(' ')[1];

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bwg_performance_2024_secret_key') as any;

    // 查询用户
    const user = await User.findByPk(decoded.userId, {
      include: [
        { model: Tenant, as: 'tenant' },
        { model: Role, as: 'role' }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在或已被删除'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: '账号已被禁用'
      });
    }

    req.user = user;
    req.tenant = user.tenant;
    req.role = user.role;

    return next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: '认证令牌已过期',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌',
        code: 'INVALID_TOKEN'
      });
    }

    return res.status(500).json({
      success: false,
      message: '认证失败'
    });
  }
};

/**
 * 权限检查中间件
 */
export const authorize = (requiredPermissions: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.role) {
        return res.status(401).json({
          success: false,
          message: '未认证'
        });
      }

      const userPermissions = req.role.permissions || {};
      const dataScope = req.role.dataScope;

      // 超级管理员拥有所有权限
      if (req.role.code === 'super_admin' || req.role.code === 'admin') {
        req.dataScope = dataScope;
        return next();
      }

      // 检查权限（支持多种权限格式）
      const hasPermission = requiredPermissions.every(permission => {
        // 格式1: { 'user:view': true }
        if (userPermissions[permission] === true) return true;
        // 格式2: { system: ['view', 'edit'], user: ['view', 'create'] }
        const [module, action] = permission.split(':');
        if (Array.isArray(userPermissions[module]) && userPermissions[module].includes(action)) return true;
        // 格式3: { system: true, performance: true }
        if (userPermissions[module] === true) return true;
        return false;
      });

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: '权限不足'
        });
      }

      req.dataScope = dataScope;

      return next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: '权限检查失败'
      });
    }
  };
};

/**
 * 数据范围中间件
 */
export const dataScope = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.role) {
      return next();
    }

    const dataScope = req.role.dataScope;
    const userId = req.user.id;
    const departmentId = req.user.departmentId;

    // 根据数据范围添加查询条件
    switch (dataScope) {
      case 'all':
        // 不添加限制
        break;
      case 'department':
        // 限制只能访问部门数据
        req.dataScopeFilter = {
          departmentId: departmentId
        };
        break;
      case 'self':
        // 限制只能访问自己的数据
        req.dataScopeFilter = {
          userId: userId
        };
        break;
    }

    next();
  } catch (error) {
    next();
  }
};

export default { authenticate, authorize, dataScope };
