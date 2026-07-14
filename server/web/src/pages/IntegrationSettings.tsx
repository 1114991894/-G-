import { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Typography, Modal, Form, Input,
  message, Tooltip, Tabs, Switch, Select, Descriptions, Empty, Spin, Alert
} from 'antd';
import {
  ApiOutlined, SettingOutlined, CheckCircleOutlined,
  CloseCircleOutlined, SaveOutlined, ReloadOutlined,
  WechatOutlined, MessageOutlined, DingdingOutlined
} from '@ant-design/icons';
import request from '../utils/request';

const { Title, Text } = Typography;
const { Option } = Select;

interface Client {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  status: string;
}

interface PlatformConfig {
  enabled: boolean;
  corpId?: string;
  agentId?: string;
  secret?: string;
  appId?: string;
  appSecret?: string;
  appKey?: string;
  autoCreateUser?: boolean;
  defaultRole?: string;
}

interface IntegrationConfig {
  tenantId: string;
  tenantName: string;
  integration: Record<string, PlatformConfig>;
}

const PLATFORM_INFO: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
  wecom: { name: '企业微信', icon: <WechatOutlined />, color: '#07C160' },
  feishu: { name: '飞书', icon: <MessageOutlined />, color: '#3370FF' },
  dingtalk: { name: '钉钉', icon: <DingdingOutlined />, color: '#1677FF' },
};

function IntegrationSettings() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [config, setConfig] = useState<IntegrationConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [form] = Form.useForm();
  const [activePlatform, setActivePlatform] = useState('wecom');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('server_clients');
      if (stored) {
        const allClients: Client[] = JSON.parse(stored);
        const activeClients = allClients.filter(
          (c: any) => c.status === 'active' || c.status === 'trial'
        );
        setClients(activeClients);
      }
    } catch (error) {
      message.error('加载客户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async (clientId: string) => {
    setSelectedClientId(clientId);
    setConfigLoading(true);
    try {
      const res: any = await request.get(`/integration/${clientId}/config`);
      if (res.success) {
        setConfig(res.data);
        const integration = res.data.integration || {};
        const wecom = integration.wecom || { enabled: false };
        const feishu = integration.feishu || { enabled: false };
        const dingtalk = integration.dingtalk || { enabled: false };
        form.setFieldsValue({
          wecomEnabled: wecom.enabled || false,
          wecomCorpId: wecom.corpId || '',
          wecomAgentId: wecom.agentId || '',
          wecomSecret: wecom.secret || '',
          wecomAutoCreate: wecom.autoCreateUser || false,
          wecomDefaultRole: wecom.defaultRole || 'employee',
          feishuEnabled: feishu.enabled || false,
          feishuAppId: feishu.appId || '',
          feishuAppSecret: feishu.appSecret || '',
          feishuAutoCreate: feishu.autoCreateUser || false,
          feishuDefaultRole: feishu.defaultRole || 'employee',
          dingtalkEnabled: dingtalk.enabled || false,
          dingtalkAppKey: dingtalk.appKey || '',
          dingtalkAppSecret: dingtalk.appSecret || '',
          dingtalkAutoCreate: dingtalk.autoCreateUser || false,
          dingtalkDefaultRole: dingtalk.defaultRole || 'employee',
        });
      }
    } catch (error) {
      message.error('加载配置失败');
      setConfig(null);
    } finally {
      setConfigLoading(false);
    }
  };

  const handleSave = async (platform: string) => {
    try {
      const values = await form.validateFields();
      setSaveLoading(true);

      let platformConfig: PlatformConfig = { enabled: values[`${platform}Enabled`] };

      if (platform === 'wecom') {
        platformConfig = {
          enabled: values.wecomEnabled,
          corpId: values.wecomCorpId,
          agentId: values.wecomAgentId,
          secret: values.wecomSecret,
          autoCreateUser: values.wecomAutoCreate,
          defaultRole: values.wecomDefaultRole,
        };
      } else if (platform === 'feishu') {
        platformConfig = {
          enabled: values.feishuEnabled,
          appId: values.feishuAppId,
          appSecret: values.feishuAppSecret,
          autoCreateUser: values.feishuAutoCreate,
          defaultRole: values.feishuDefaultRole,
        };
      } else if (platform === 'dingtalk') {
        platformConfig = {
          enabled: values.dingtalkEnabled,
          appKey: values.dingtalkAppKey,
          appSecret: values.dingtalkAppSecret,
          autoCreateUser: values.dingtalkAutoCreate,
          defaultRole: values.dingtalkDefaultRole,
        };
      }

      const res: any = await request.put(`/integration/${selectedClientId}/config`, {
        platform,
        config: platformConfig,
      });

      if (res.success) {
        message.success(`${PLATFORM_INFO[platform].name} 配置保存成功`);
        if (config) {
          setConfig({
            ...config,
            integration: {
              ...config.integration,
              [platform]: platformConfig,
            },
          });
        }
      } else {
        message.error(res.message || '保存失败');
      }
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.message || '保存失败');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleToggle = async (platform: string, enabled: boolean) => {
    if (!selectedClientId) return;
    try {
      const res: any = await request.post(`/integration/${selectedClientId}/toggle`, {
        platform,
        enabled,
      });
      if (res.success) {
        message.success(`${PLATFORM_INFO[platform].name} 已${enabled ? '启用' : '禁用'}`);
        if (config) {
          const integration = { ...config.integration };
          if (!integration[platform]) {
            integration[platform] = { enabled };
          } else {
            integration[platform].enabled = enabled;
          }
          setConfig({ ...config, integration });
        }
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '企业名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '联系人',
      dataIndex: 'contactName',
      key: 'contactName',
      width: 100,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => {
        const colors: Record<string, string> = {
          active: 'green',
          trial: 'blue',
          inactive: 'red',
          pending: 'orange',
        };
        const texts: Record<string, string> = {
          active: '正常',
          trial: '试用',
          inactive: '已禁用',
          pending: '待审核',
        };
        return <Tag color={colors[status] || 'default'}>{texts[status] || status}</Tag>;
      },
    },
    {
      title: '集成状态',
      key: 'integration',
      width: 200,
      render: (_: any, record: Client) => {
        const integration = config && config.tenantId === record.id ? config.integration : {};
        return (
          <Space size={4}>
            {Object.entries(PLATFORM_INFO).map(([key, info]) => {
              const cfg = integration[key];
              const isEnabled = cfg?.enabled;
              return (
                <Tooltip key={key} title={isEnabled ? `${info.name}已启用` : `${info.name}未启用`}>
                  <Tag
                    color={isEnabled ? info.color : 'default'}
                    style={{ margin: 0, cursor: 'pointer' }}
                  >
                    {info.icon}
                  </Tag>
                </Tooltip>
              );
            })}
          </Space>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: Client) => (
        <Button
          type={selectedClientId === record.id ? 'primary' : 'default'}
          size="small"
          icon={<SettingOutlined />}
          onClick={() => loadConfig(record.id)}
        >
          配置
        </Button>
      ),
    },
  ];

  const renderPlatformForm = (platform: string) => {
    const info = PLATFORM_INFO[platform];
    const prefix = platform;
    const currentConfig = config?.integration?.[platform];
    const isEnabled = currentConfig?.enabled;

    return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <span style={{ fontSize: 24, color: info.color }}>{info.icon}</span>
            <span style={{ fontSize: 16, fontWeight: 'bold' }}>{info.name}</span>
            {isEnabled ? (
              <Tag color="green" icon={<CheckCircleOutlined />}>已启用</Tag>
            ) : (
              <Tag icon={<CloseCircleOutlined />}>未启用</Tag>
            )}
          </Space>
          <Switch
            checked={isEnabled || false}
            onChange={(checked) => handleToggle(platform, checked)}
            checkedChildren="启用"
            unCheckedChildren="禁用"
          />
        </div>

        <Form form={form} layout="vertical">
          {platform === 'wecom' && (
            <>
              <Form.Item
                name={`${prefix}CorpId`}
                label="企业 CorpId"
                rules={[{ required: form.getFieldValue(`${prefix}Enabled`), message: '请输入企业 CorpId' }]}
                extra="在企业微信管理后台「我的企业」页面获取"
              >
                <Input placeholder="如：ww1234567890abcdef" />
              </Form.Item>
              <Form.Item
                name={`${prefix}AgentId`}
                label="应用 AgentId"
                rules={[{ required: form.getFieldValue(`${prefix}Enabled`), message: '请输入应用 AgentId' }]}
                extra="在企业微信「应用管理」中创建自建应用后获取"
              >
                <Input placeholder="如：1000002" />
              </Form.Item>
              <Form.Item
                name={`${prefix}Secret`}
                label="应用 Secret"
                rules={[{ required: form.getFieldValue(`${prefix}Enabled`), message: '请输入应用 Secret' }]}
              >
                <Input.Password placeholder="自建应用的 Secret" />
              </Form.Item>
            </>
          )}

          {platform === 'feishu' && (
            <>
              <Form.Item
                name={`${prefix}AppId`}
                label="App ID"
                rules={[{ required: form.getFieldValue(`${prefix}Enabled`), message: '请输入 App ID' }]}
                extra="在飞书开放平台创建企业自建应用后获取"
              >
                <Input placeholder="如：cli_xxxxxxxx" />
              </Form.Item>
              <Form.Item
                name={`${prefix}AppSecret`}
                label="App Secret"
                rules={[{ required: form.getFieldValue(`${prefix}Enabled`), message: '请输入 App Secret' }]}
              >
                <Input.Password placeholder="自建应用的 App Secret" />
              </Form.Item>
            </>
          )}

          {platform === 'dingtalk' && (
            <>
              <Form.Item
                name={`${prefix}AppKey`}
                label="App Key"
                rules={[{ required: form.getFieldValue(`${prefix}Enabled`), message: '请输入 App Key' }]}
                extra="在钉钉开发者后台创建企业内部应用后获取"
              >
                <Input placeholder="如：dingxxxxxxxx" />
              </Form.Item>
              <Form.Item
                name={`${prefix}AppSecret`}
                label="App Secret"
                rules={[{ required: form.getFieldValue(`${prefix}Enabled`), message: '请输入 App Secret' }]}
              >
                <Input.Password placeholder="自建应用的 App Secret" />
              </Form.Item>
            </>
          )}

          <Form.Item name={`${prefix}AutoCreateUser`} valuePropName="checked" label="自动创建用户">
            <Switch
              checkedChildren="开启"
              unCheckedChildren="关闭"
            />
          </Form.Item>

          <Form.Item
            name={`${prefix}DefaultRole`}
            label="默认角色"
            extra="通过第三方登录自动创建用户时分配的默认角色"
          >
            <Select placeholder="请选择默认角色">
              <Option value="employee">员工</Option>
              <Option value="manager">负责人</Option>
              <Option value="sub_admin">分管理员</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saveLoading}
              onClick={() => handleSave(platform)}
            >
              保存{info.name}配置
            </Button>
          </Form.Item>
        </Form>

        {platform === 'wecom' && (
          <Alert
            type="info"
            showIcon
            message="企业微信配置指南"
            description={
              <div style={{ fontSize: 13 }}>
                <p>1. 登录 <a href="https://work.weixin.qq.com/" target="_blank" rel="noopener noreferrer">企业微信管理后台</a></p>
                <p>2. 应用管理 → 自建 → 创建应用，获取 AgentId 和 Secret</p>
                <p>3. 「我的企业」页面获取 CorpId</p>
                <p>4. 应用详情 → 网页授权及 JS-SDK → 设置可信域名（你的前端域名）</p>
                <p>5. 应用详情 → 企业可信IP → 添加你的服务器IP</p>
              </div>
            }
          />
        )}
        {platform === 'feishu' && (
          <Alert
            type="info"
            showIcon
            message="飞书配置指南"
            description={
              <div style={{ fontSize: 13 }}>
                <p>1. 登录 <a href="https://open.feishu.cn/" target="_blank" rel="noopener noreferrer">飞书开放平台</a></p>
                <p>2. 创建企业自建应用，获取 App ID 和 App Secret</p>
                <p>3. 权限管理 → 申请「获取用户基本信息」「获取手机号」「获取邮箱」权限</p>
                <p>4. 安全设置 → 配置重定向 URL（你的回调地址）</p>
                <p>5. 版本管理与发布 → 提交审核并发布</p>
              </div>
            }
          />
        )}
        {platform === 'dingtalk' && (
          <Alert
            type="info"
            showIcon
            message="钉钉配置指南"
            description={
              <div style={{ fontSize: 13 }}>
                <p>1. 登录 <a href="https://open-dev.dingtalk.com/" target="_blank" rel="noopener noreferrer">钉钉开发者后台</a></p>
                <p>2. 创建企业内部应用 → H5微应用，获取 App Key 和 App Secret</p>
                <p>3. 权限管理 → 申请通讯录个人信息读权限、手机号信息读取权限</p>
                <p>4. 应用首页地址和回调域名配置为你的前端域名</p>
                <p>5. 发布应用并设置可见范围</p>
              </div>
            }
          />
        )}
      </div>
    );
  };

  return (
    <div>
      <Title level={4}>
        <ApiOutlined /> 第三方平台集成
      </Title>
      <Text type="secondary">为每个客户企业配置企业微信、飞书、钉钉的免密登录</Text>

      <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
        <Card
          title="客户企业列表"
          style={{ width: 600 }}
          styles={{ body: { padding: 0 } }}
        >
          <Spin spinning={loading}>
            <Table
              dataSource={clients}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10, size: 'small' }}
              size="small"
              scroll={{ y: 500 }}
            />
          </Spin>
        </Card>

        <Card
          title={
            selectedClientId ? (
              <Space>
                <SettingOutlined />
                <span>集成配置 - {config?.tenantName || clients.find(c => c.id === selectedClientId)?.name}</span>
              </Space>
            ) : '请选择客户企业'
          }
          style={{ flex: 1, minWidth: 500 }}
        >
          {configLoading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <Spin size="large" />
            </div>
          ) : selectedClientId && config ? (
            <Tabs
              activeKey={activePlatform}
              onChange={setActivePlatform}
              items={Object.entries(PLATFORM_INFO).map(([key, info]) => ({
                key,
                label: (
                  <Space>
                    <span style={{ color: info.color }}>{info.icon}</span>
                    {info.name}
                    {config.integration?.[key]?.enabled && (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    )}
                  </Space>
                ),
                children: renderPlatformForm(key),
              }))}
            />
          ) : (
            <Empty
              description="请从左侧选择客户企业"
              style={{ padding: 60 }}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

export default IntegrationSettings;
