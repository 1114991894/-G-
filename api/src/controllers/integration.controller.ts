import { Request, Response } from 'express';
import { Tenant } from '../models';

export class IntegrationController {
  async getIntegrationConfig(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const currentTenantId = (req as any).user?.tenantId;
      const userRole = (req as any).user?.role?.code;

      let targetTenantId = tenantId;

      if (userRole !== 'super_admin' && userRole !== 'main_admin') {
        targetTenantId = currentTenantId;
      }

      const tenant = await Tenant.findByPk(targetTenantId);

      if (!tenant) {
        res.status(404).json({
          success: false,
          message: '企业不存在'
        });
        return;
      }

      const settings = tenant.settings || {};
      const integration = settings.integration || {};

      const sanitizedIntegration: any = {};
      for (const [platform, config] of Object.entries(integration)) {
        const cfg: any = config;
        sanitizedIntegration[platform] = {
          enabled: cfg.enabled || false,
          ...(platform === 'wecom' && {
            corpId: cfg.corpId || '',
            agentId: cfg.agentId || '',
            autoCreateUser: cfg.autoCreateUser || false,
            defaultRole: cfg.defaultRole || 'employee'
          }),
          ...(platform === 'feishu' && {
            appId: cfg.appId || '',
            autoCreateUser: cfg.autoCreateUser || false,
            defaultRole: cfg.defaultRole || 'employee'
          }),
          ...(platform === 'dingtalk' && {
            appKey: cfg.appKey || '',
            autoCreateUser: cfg.autoCreateUser || false,
            defaultRole: cfg.defaultRole || 'employee'
          })
        };
      }

      res.json({
        success: true,
        data: {
          tenantId: tenant.id,
          tenantName: tenant.name,
          integration: sanitizedIntegration
        }
      });
    } catch (error) {
      console.error('获取集成配置失败:', error);
      res.status(500).json({
        success: false,
        message: '获取失败'
      });
    }
  }

  async updateIntegrationConfig(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const { platform, config } = req.body;
      const currentTenantId = (req as any).user?.tenantId;
      const userRole = (req as any).user?.role?.code;

      let targetTenantId = tenantId;

      if (userRole !== 'super_admin' && userRole !== 'main_admin') {
        targetTenantId = currentTenantId;
      }

      if (!platform || !config) {
        res.status(400).json({
          success: false,
          message: '缺少必要参数'
        });
        return;
      }

      const tenant = await Tenant.findByPk(targetTenantId);

      if (!tenant) {
        res.status(404).json({
          success: false,
          message: '企业不存在'
        });
        return;
      }

      const settings = tenant.settings || {};
      const integration = settings.integration || {};

      integration[platform] = {
        ...integration[platform],
        ...config
      };

      await tenant.update({
        settings: {
          ...settings,
          integration
        }
      });

      res.json({
        success: true,
        message: '配置更新成功',
        data: { integration }
      });
    } catch (error) {
      console.error('更新集成配置失败:', error);
      res.status(500).json({
        success: false,
        message: '更新失败'
      });
    }
  }

  async toggleIntegration(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const { platform, enabled } = req.body;
      const currentTenantId = (req as any).user?.tenantId;
      const userRole = (req as any).user?.role?.code;

      let targetTenantId = tenantId;

      if (userRole !== 'super_admin' && userRole !== 'main_admin') {
        targetTenantId = currentTenantId;
      }

      const tenant = await Tenant.findByPk(targetTenantId);

      if (!tenant) {
        res.status(404).json({
          success: false,
          message: '企业不存在'
        });
        return;
      }

      const settings = tenant.settings || {};
      const integration = settings.integration || {};

      if (!integration[platform]) {
        integration[platform] = { enabled: false };
      }
      integration[platform].enabled = enabled;

      await tenant.update({
        settings: {
          ...settings,
          integration
        }
      });

      res.json({
        success: true,
        message: enabled ? '已启用' : '已禁用'
      });
    } catch (error) {
      console.error('切换集成状态失败:', error);
      res.status(500).json({
        success: false,
        message: '操作失败'
      });
    }
  }
}

export default IntegrationController;
