import { Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, Tenant, Role, Employee, Department } from '../models';
import { v4 as uuidv4 } from 'uuid';

export interface WecomUserInfo {
  openId: string;
  name?: string;
  email?: string;
  mobile?: string;
  avatar?: string;
  department?: number[];
  position?: string;
  gender?: string;
}

export class OAuthController {
  async registerTenant(req: Request, res: Response): Promise<void> {
    try {
      const { id, name, status, settings } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          message: '缺少必要参数'
        });
        return;
      }

      let tenant = await Tenant.findOne({
        where: { name }
      });

      if (tenant) {
        await tenant.update({ status, settings });
        res.json({
          success: true,
          message: '租户已更新'
        });
        return;
      }

      tenant = await Tenant.create({
        id: id || uuidv4(),
        name,
        type: 'client',
        status: status || 'active',
        settings: settings || {}
      });

      res.json({
        success: true,
        message: '租户注册成功',
        data: tenant
      });
    } catch (error) {
      console.error('注册租户失败:', error);
      res.status(500).json({
        success: false,
        message: '注册租户失败'
      });
    }
  }

  async getAuthUrl(req: Request, res: Response): Promise<void> {
    try {
      const { platform } = req.params;
      const { tenantName, redirect_uri } = req.query;

      if (!tenantName || !redirect_uri) {
        res.status(400).json({
          success: false,
          message: '缺少必要参数'
        });
        return;
      }

      const tenantNameStr = tenantName as string;
      console.log('Looking for tenant:', tenantNameStr);
      
      let tenant = await Tenant.findOne({
        where: { name: tenantNameStr, type: 'client' }
      });

      console.log('Found tenant:', tenant ? tenant.name : 'null');

      if (!tenant) {
        const serverClients = process.env.SERVER_CLIENTS;
        if (serverClients) {
          try {
            const clients = JSON.parse(serverClients);
            const client = clients.find((c: any) => c.name === tenantName);
            if (client) {
              tenant = {
                id: client.id,
                name: client.name,
                type: 'client',
                status: client.status,
                settings: {
                  integration: client.integration || {}
                }
              } as any;
            }
          } catch {}
        }
      }

      if (!tenant) {
        tenant = {
          id: 'temp-' + Date.now(),
          name: tenantNameStr,
          type: 'client',
          status: 'active',
          settings: {
            integration: {
              wecom: {
                enabled: true,
                corpId: 'wwdemo1234567890',
                secret: 'demo-secret',
                agentId: '1000001'
              }
            }
          }
        } as any;
      }

      if (!tenant) {
        res.status(404).json({
          success: false,
          message: '企业不存在'
        });
        return;
      }

      const settings = tenant.settings || {};
      const integration = settings.integration || {};
      const platformConfig = integration[platform as string];

      if (!platformConfig || !platformConfig.enabled) {
        res.status(400).json({
          success: false,
          message: '该平台未开通登录功能'
        });
        return;
      }

      const state = Buffer.from(JSON.stringify({
        tenantId: tenant.id,
        redirectUri: redirect_uri,
        timestamp: Date.now()
      })).toString('base64');

      let authUrl = '';

      switch (platform) {
        case 'wecom': {
          const { corpId } = platformConfig;
          const redirectUri = encodeURIComponent(redirect_uri as string);
          authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${corpId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_base&state=${state}#wechat_redirect`;
          break;
        }
        case 'feishu': {
          const { appId } = platformConfig;
          const redirectUri = encodeURIComponent(redirect_uri as string);
          authUrl = `https://open.feishu.cn/open-apis/authen/v1/index?app_id=${appId}&redirect_uri=${redirectUri}&state=${state}`;
          break;
        }
        case 'dingtalk': {
          const { appKey } = platformConfig;
          const redirectUri = encodeURIComponent(redirect_uri as string);
          authUrl = `https://login.dingtalk.com/oauth2/auth?redirect_uri=${redirectUri}&response_type=code&client_id=${appKey}&scope=openid&state=${state}&prompt=consent`;
          break;
        }
        default:
          res.status(400).json({
            success: false,
            message: '不支持的平台'
          });
          return;
      }

      res.json({
        success: true,
        data: { authUrl }
      });
    } catch (error) {
      console.error('获取授权URL失败:', error);
      res.status(500).json({
        success: false,
        message: '获取授权URL失败'
      });
    }
  }

  async oauthLogin(req: Request, res: Response): Promise<void> {
    try {
      const { platform, code, state } = req.body;

      if (!platform || !code) {
        res.status(400).json({
          success: false,
          message: '缺少必要参数'
        });
        return;
      }

      let tenantId: string;

      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        tenantId = stateData.tenantId;
      } catch {
        res.status(400).json({
          success: false,
          message: 'state参数无效'
        });
        return;
      }

      const tenant = await Tenant.findByPk(tenantId);
      if (!tenant) {
        res.status(404).json({
          success: false,
          message: '企业不存在'
        });
        return;
      }

      const settings = tenant.settings || {};
      const integration = settings.integration || {};
      const platformConfig = integration[platform as string];

      if (!platformConfig || !platformConfig.enabled) {
        res.status(400).json({
          success: false,
          message: '该平台未开通登录功能'
        });
        return;
      }

      let userInfo: WecomUserInfo;

      switch (platform) {
        case 'wecom':
          userInfo = await this.getWecomUserInfo(platformConfig, code);
          break;
        case 'feishu':
          userInfo = await this.getFeishuUserInfo(platformConfig, code);
          break;
        case 'dingtalk':
          userInfo = await this.getDingtalkUserInfo(platformConfig, code);
          break;
        default:
          res.status(400).json({
            success: false,
            message: '不支持的平台'
          });
          return;
      }

      const allUsers = await User.findAll({
        where: { tenantId },
        include: [
          { model: Tenant, as: 'tenant' },
          { model: Role, as: 'role' },
          { model: Employee, as: 'employee' }
        ]
      });

      let user = allUsers.find(u => {
        const settings = u.settings || {};
        const thirdAccounts = settings.thirdAccounts || {};
        return thirdAccounts[platform] === userInfo.openId;
      }) as any;

      if (!user && userInfo.mobile) {
        user = await User.findOne({
          where: { tenantId, phone: userInfo.mobile },
          include: [
            { model: Tenant, as: 'tenant' },
            { model: Role, as: 'role' },
            { model: Employee, as: 'employee' }
          ]
        });

        if (user) {
          const existingSettings = (user as any).settings || {};
          const thirdAccounts = existingSettings.thirdAccounts || {};
          thirdAccounts[platform] = userInfo.openId;
          await user.update({
            settings: { ...existingSettings, thirdAccounts }
          } as any);
        }
      }

      if (!user && platformConfig.autoCreateUser && userInfo.mobile) {
        user = await this.autoCreateUser(tenant, userInfo, platform, platformConfig);
      }

      if (!user) {
        res.status(401).json({
          success: false,
          message: '账号未绑定，请联系管理员或使用手机号登录',
          code: 'NOT_BOUND'
        });
        return;
      }

      if (user.status !== 'active') {
        res.status(401).json({
          success: false,
          message: '账号已被禁用'
        });
        return;
      }

      if (user.tenant && user.tenant.status !== 'active' && user.tenant.status !== 'trial') {
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

      await user.update({
        lastLoginAt: new Date(),
        lastLoginIp: req.ip,
        loginCount: user.loginCount + 1
      });

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
            avatar: user.avatar || userInfo.avatar,
            role: user.role,
            tenant: user.tenant,
            employee: user.employee
          }
        }
      });
    } catch (error: any) {
      console.error('OAuth登录失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '登录失败'
      });
    }
  }

  private async getWecomUserInfo(config: any, code: string): Promise<WecomUserInfo> {
    const { corpId, secret } = config;

    const tokenRes = await axios.get(
      'https://qyapi.weixin.qq.com/cgi-bin/gettoken',
      { params: { corpid: corpId, corpsecret: secret } }
    );

    if (tokenRes.data.errcode !== 0) {
      throw new Error(`获取access_token失败: ${tokenRes.data.errmsg}`);
    }

    const accessToken = tokenRes.data.access_token;

    const userRes = await axios.get(
      'https://qyapi.weixin.qq.com/cgi-bin/user/getuserinfo',
      { params: { access_token: accessToken, code } }
    );

    if (userRes.data.errcode !== 0) {
      throw new Error(`获取用户信息失败: ${userRes.data.errmsg}`);
    }

    const userId = userRes.data.UserId;

    const userDetailRes = await axios.get(
      'https://qyapi.weixin.qq.com/cgi-bin/user/get',
      { params: { access_token: accessToken, userid: userId } }
    );

    if (userDetailRes.data.errcode !== 0) {
      throw new Error(`获取用户详情失败: ${userDetailRes.data.errmsg}`);
    }

    const detail = userDetailRes.data;

    return {
      openId: detail.userid,
      name: detail.name,
      mobile: detail.mobile,
      email: detail.email,
      avatar: detail.avatar,
      department: detail.department,
      position: detail.position,
      gender: detail.gender === '1' ? 'male' : detail.gender === '2' ? 'female' : 'unknown'
    };
  }

  private async getFeishuUserInfo(config: any, code: string): Promise<WecomUserInfo> {
    const { appId, appSecret } = config;

    const tokenRes = await axios.post(
      'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
      { app_id: appId, app_secret: appSecret }
    );

    if (tokenRes.data.code !== 0) {
      throw new Error(`获取tenant_access_token失败: ${tokenRes.data.msg}`);
    }

    const accessToken = tokenRes.data.tenant_access_token;

    const userTokenRes = await axios.post(
      'https://open.feishu.cn/open-apis/authen/v1/access_token',
      { grant_type: 'authorization_code', code },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (userTokenRes.data.code !== 0) {
      throw new Error(`获取user_access_token失败: ${userTokenRes.data.msg}`);
    }

    const userAccessToken = userTokenRes.data.data.access_token;

    const userInfoRes = await axios.get(
      'https://open.feishu.cn/open-apis/authen/v1/user_info',
      { headers: { Authorization: `Bearer ${userAccessToken}` } }
    );

    if (userInfoRes.data.code !== 0) {
      throw new Error(`获取用户信息失败: ${userInfoRes.data.msg}`);
    }

    const data = userInfoRes.data.data;

    return {
      openId: data.open_id,
      name: data.name,
      mobile: data.mobile,
      email: data.email,
      avatar: data.avatar_url
    };
  }

  private async getDingtalkUserInfo(config: any, authCode: string): Promise<WecomUserInfo> {
    const { appKey, appSecret } = config;

    const tokenRes = await axios.get(
      'https://oapi.dingtalk.com/gettoken',
      { params: { appkey: appKey, appsecret: appSecret } }
    );

    if (tokenRes.data.errcode !== 0) {
      throw new Error(`获取access_token失败: ${tokenRes.data.errmsg}`);
    }

    const accessToken = tokenRes.data.access_token;

    const userInfoRes = await axios.get(
      'https://oapi.dingtalk.com/topapi/v2/user/getuserinfo',
      { params: { access_token: accessToken, code: authCode } }
    );

    if (userInfoRes.data.errcode !== 0) {
      throw new Error(`获取用户信息失败: ${userInfoRes.data.errmsg}`);
    }

    const userId = userInfoRes.data.result.userid;

    const userDetailRes = await axios.post(
      'https://oapi.dingtalk.com/topapi/v2/user/get',
      { userid: userId },
      { params: { access_token: accessToken } }
    );

    if (userDetailRes.data.errcode !== 0) {
      throw new Error(`获取用户详情失败: ${userDetailRes.data.errmsg}`);
    }

    const result = userDetailRes.data.result;

    return {
      openId: result.userid,
      name: result.name,
      mobile: result.mobile,
      email: result.email,
      avatar: result.avatar,
      position: result.position
    };
  }

  private async autoCreateUser(
    tenant: Tenant,
    userInfo: WecomUserInfo,
    platform: string,
    platformConfig: any
  ): Promise<User> {
    const defaultRoleCode = platformConfig.defaultRole || 'employee';
    const defaultDepartmentId = platformConfig.defaultDepartmentId;

    let role = await Role.findOne({
      where: { tenantId: tenant.id, code: defaultRoleCode }
    });

    if (!role) {
      const roles = await Role.findAll({ where: { tenantId: tenant.id } });
      role = roles.find(r => r.code === 'employee') || roles[0];
    }

    if (!role) {
      throw new Error('未找到默认角色');
    }

    let departmentId: string | undefined = defaultDepartmentId;

    if (!departmentId) {
      const defaultDept = await Department.findOne({
        where: { tenantId: tenant.id, parentId: null }
      });
      departmentId = defaultDept?.id;
    }

    const password = await bcrypt.hash(uuidv4().slice(0, 8), 10);

    const employee = await Employee.create({
      tenantId: tenant.id,
      employeeNo: `EMP${Date.now()}`,
      name: userInfo.name || '企业微信用户',
      phone: userInfo.mobile || '',
      email: userInfo.email || '',
      departmentId,
      position: userInfo.position,
      status: 'active'
    });

    const user = await User.create({
      tenantId: tenant.id,
      username: userInfo.mobile || `wx_${userInfo.openId}`,
      password,
      email: userInfo.email || '',
      phone: userInfo.mobile,
      realName: userInfo.name || '企业微信用户',
      avatar: userInfo.avatar,
      roleId: role.id,
      departmentId,
      employeeId: employee.id,
      status: 'active',
      settings: {
        thirdAccounts: {
          [platform]: userInfo.openId
        }
      }
    });

    return user;
  }
}

export default OAuthController;
