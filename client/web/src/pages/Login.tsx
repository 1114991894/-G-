import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form, Input, Button, Card, message, Typography, AutoComplete, Modal, Select
} from 'antd';
import {
  BuildOutlined, UserOutlined, PhoneOutlined, LockOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import {
  getCompanySearchHistory, addCompanySearchHistory,
  PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH,
  submitTrialApplication, checkCompanyExists, type TrialApplication
} from '../utils/mockData';
import LockCountdown from '../components/LockCountdown';
import wecomLogo from '../assets/wecom.svg';
import feishuLogo from '../assets/feishu.svg';
import dingtalkLogo from '../assets/dingtalk.svg';

const { Title, Text } = Typography;

function Login() {
  const [loading, setLoading] = useState(false);
  const [companyOptions, setCompanyOptions] = useState<{value: string; label?: React.ReactNode}[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [trialModalVisible, setTrialModalVisible] = useState(false);
  const [trialForm] = Form.useForm();
  const [trialLoading, setTrialLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { login, searchCompanies, checkLockStatus, locked, loginFailCount } = useAuthStore();

  useEffect(() => {
    checkLockStatus();
    if (locked) {
      const timer = setInterval(() => checkLockStatus(), 1000);
      return () => clearInterval(timer);
    }
  }, [locked, checkLockStatus]);

  useEffect(() => {
    const history = getCompanySearchHistory();
    if (history.length > 0) {
      const historyOptions = history.map(h => ({
        value: h,
        label: (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span><HistoryOutlined style={{ color: '#999', marginRight: 8 }} />{h}</span>
          </div>
        )
      }));
      setCompanyOptions(historyOptions);
    }
  }, []);

  const handleCompanySearch = (value: string) => {
    setSelectedCompany(value);
    if (value.length >= 2) {
      const results = searchCompanies(value);
      const searchOptions = results.map(c => ({ value: c.value }));
      setCompanyOptions(searchOptions);
    } else {
      const history = getCompanySearchHistory();
      const historyOptions = history.map(h => ({ value: h }));
      setCompanyOptions(historyOptions);
    }
  };

  const handleCompanySelect = (value: string) => {
    setSelectedCompany(value);
    form.setFieldValue('companyName', value);
    addCompanySearchHistory(value);
  };

  const onFinish = async (values: any) => {
    if (locked) {
      message.error('账号已锁定，请稍后再试');
      return;
    }
    setLoading(true);
    try {
      await login({
        phone: values.phone,
        password: values.password,
        tenantName: values.companyName
      });
      addCompanySearchHistory(values.companyName);
      message.success('登录成功');
      navigate('/');
    } catch (error: any) {
      const errMsg = error.message || '登录失败';
      if (errMsg.includes('锁定')) {
        checkLockStatus();
        message.error(errMsg);
      } else {
        message.error(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (platform: string) => {
    const companyName = form.getFieldValue('companyName');
    if (!companyName) {
      message.warning('请先输入公司名称');
      return;
    }

    setOauthLoading(platform);
    try {
      const redirectUri = encodeURIComponent(
        `${window.location.origin}/oauth/callback?platform=${platform}`
      );
      const response = await fetch(
        `/api/v1/auth/oauth/${platform}/auth-url?tenantName=${encodeURIComponent(companyName)}&redirect_uri=${redirectUri}`
      );
      const data = await response.json();
      if (data.success && data.data?.authUrl) {
        window.location.href = data.data.authUrl;
      } else {
        message.error(data.message || '获取授权地址失败');
      }
    } catch (error: any) {
      message.error(error.message || '获取授权地址失败');
    } finally {
      setOauthLoading(null);
    }
  };

  const isWecom = /wxwork/i.test(navigator.userAgent);
  const isFeishu = /lark|feishu/i.test(navigator.userAgent);
  const isDingtalk = /dingtalk/i.test(navigator.userAgent);
  const isInThirdApp = isWecom || isFeishu || isDingtalk;

  useEffect(() => {
    if (isWecom) {
      handleAutoLogin('wecom');
    } else if (isFeishu) {
      handleAutoLogin('feishu');
    } else if (isDingtalk) {
      handleAutoLogin('dingtalk');
    }
  }, []);

  const handleAutoLogin = async (platform: 'wecom' | 'feishu' | 'dingtalk') => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tenantName = urlParams.get('tenant') || urlParams.get('company') || '';
      if (!tenantName) {
        return;
      }
      const redirectUri = encodeURIComponent(`${window.location.origin}/oauth/callback?platform=${platform}`);
      
      const response = await fetch(
        `/api/v1/auth/oauth/${platform}/auth-url?tenantName=${encodeURIComponent(tenantName)}&redirect_uri=${redirectUri}`
      );
      const data = await response.json();
      if (data.success && data.data?.authUrl) {
        window.location.href = data.data.authUrl;
      }
    } catch (error) {
      console.error(`${platform === 'wecom' ? '企业微信' : platform === 'feishu' ? '飞书' : '钉钉'}自动登录失败:`, error);
    }
  };

  const handleTrialSubmit = async (values: TrialApplication) => {
    const { exists, message: existMsg } = await checkCompanyExists(values.companyName);
    if (exists) {
      message.warning(existMsg);
      return;
    }

    setTrialLoading(true);
    try {
      await submitTrialApplication(values);
      message.success('申请提交成功，我们会尽快与您联系');
      setTrialModalVisible(false);
      trialForm.resetFields();
    } catch (error: any) {
      message.error(error.message || '提交失败');
    } finally {
      setTrialLoading(false);
    }
  };

  const regionOptions = [
    { value: '北京市', label: '北京市' },
    { value: '天津市', label: '天津市' },
    { value: '河北省', label: '河北省' },
    { value: '山西省', label: '山西省' },
    { value: '内蒙古自治区', label: '内蒙古自治区' },
    { value: '辽宁省', label: '辽宁省' },
    { value: '吉林省', label: '吉林省' },
    { value: '黑龙江省', label: '黑龙江省' },
    { value: '上海市', label: '上海市' },
    { value: '江苏省', label: '江苏省' },
    { value: '浙江省', label: '浙江省' },
    { value: '安徽省', label: '安徽省' },
    { value: '福建省', label: '福建省' },
    { value: '江西省', label: '江西省' },
    { value: '山东省', label: '山东省' },
    { value: '河南省', label: '河南省' },
    { value: '湖北省', label: '湖北省' },
    { value: '湖南省', label: '湖南省' },
    { value: '广东省', label: '广东省' },
    { value: '广西壮族自治区', label: '广西壮族自治区' },
    { value: '海南省', label: '海南省' },
    { value: '重庆市', label: '重庆市' },
    { value: '四川省', label: '四川省' },
    { value: '贵州省', label: '贵州省' },
    { value: '云南省', label: '云南省' },
    { value: '西藏自治区', label: '西藏自治区' },
    { value: '陕西省', label: '陕西省' },
    { value: '甘肃省', label: '甘肃省' },
    { value: '青海省', label: '青海省' },
    { value: '宁夏回族自治区', label: '宁夏回族自治区' },
    { value: '新疆维吾尔自治区', label: '新疆维吾尔自治区' },
    { value: '香港特别行政区', label: '香港特别行政区' },
    { value: '澳门特别行政区', label: '澳门特别行政区' },
    { value: '台湾省', label: '台湾省' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 450, padding: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Title level={2}>百鲸G系统</Title>
          <Text type="secondary">智能绩效管理平台</Text>
        </div>

        {locked && <LockCountdown onUnlock={() => checkLockStatus()} />}

        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          disabled={locked}
        >
          <Form.Item
            name="companyName"
            rules={[{ required: true, message: '请输入公司名称' }]}
          >
            <AutoComplete
              options={companyOptions}
              onSearch={handleCompanySearch}
              onSelect={handleCompanySelect}
              placeholder="公司名称（输入前2字自动联想）"
              filterOption={false}
              notFoundContent={selectedCompany ? '未找到匹配企业' : '历史记录 / 输入关键词搜索'}
            >
              <Input prefix={<BuildOutlined />} />
            </AutoComplete>
          </Form.Item>

          <Form.Item
            name="realName"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="姓名" />
          </Form.Item>

          <Form.Item
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
            ]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="手机号" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH, message: `密码长度为${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH}位` }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={`登录密码（${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH}位）`}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
            />
          </Form.Item>

          {loginFailCount > 0 && !locked && (
            <div style={{ marginBottom: 12, textAlign: 'center' }}>
              <Text type="warning">已失败 {loginFailCount} 次，连续5次将锁定30分钟</Text>
            </div>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={locked}
              style={{ width: '100%' }}
            >
              {locked ? '账号已锁定' : '登录'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', margin: '16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ flex: 1, height: 1, background: '#eee' }} />
            <Text type="secondary" style={{ padding: '0 12px', fontSize: 12 }}>
              其他登录方式
            </Text>
            <div style={{ flex: 1, height: 1, background: '#eee' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32 }}>
            <Button
              type="text"
              onClick={() => handleOAuthLogin('wecom')}
              loading={oauthLoading === 'wecom'}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 'auto', padding: '8px 16px', gap: 4 }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
                <img src={wecomLogo} alt="企业微信" style={{ width: 36, height: 36, objectFit: 'contain' }} />
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>企业微信</Text>
            </Button>
            <Button
              type="text"
              onClick={() => handleOAuthLogin('feishu')}
              loading={oauthLoading === 'feishu'}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 'auto', padding: '8px 16px', gap: 4 }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
                <img src={feishuLogo} alt="飞书" style={{ width: 36, height: 36, objectFit: 'contain' }} />
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>飞书</Text>
            </Button>
            <Button
              type="text"
              onClick={() => handleOAuthLogin('dingtalk')}
              loading={oauthLoading === 'dingtalk'}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 'auto', padding: '8px 16px', gap: 4 }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
                <img src={dingtalkLogo} alt="钉钉" style={{ width: 36, height: 36, objectFit: 'contain' }} />
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>钉钉</Text>
            </Button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <Button type="link" onClick={() => setTrialModalVisible(true)} style={{ padding: 0 }}>
            申请试用
          </Button>
          <Text type="secondary" style={{ margin: '0 8px' }}>|</Text>
          <Button type="link" onClick={() => window.location.href = 'http://localhost:5176'} style={{ padding: 0 }}>
            切换到服务端
          </Button>
        </div>

        <Modal
          title="申请试用"
          open={trialModalVisible}
          onCancel={() => setTrialModalVisible(false)}
          footer={null}
          width={400}
        >
          <Form
            form={trialForm}
            onFinish={handleTrialSubmit}
            layout="vertical"
          >
            <Form.Item
              name="companyName"
              label="公司名称"
              rules={[{ required: true, message: '请输入公司名称' }]}
            >
              <Input placeholder="请输入公司名称" />
            </Form.Item>

            <Form.Item
              name="contactName"
              label="姓名"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input placeholder="请输入姓名" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="手机号"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
              ]}
            >
              <Input placeholder="请输入手机号" />
            </Form.Item>

            <Form.Item
              name="employeeCount"
              label="员工数"
            >
              <Input placeholder="请输入员工数（选填）" />
            </Form.Item>

            <Form.Item
              name="region"
              label="地区"
            >
              <Select options={regionOptions} placeholder="请选择地区（选填）" allowClear />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={trialLoading} style={{ width: '100%' }}>
                提交
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
}

export default Login;