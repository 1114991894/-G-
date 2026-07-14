import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form, Input, Button, Card, message, Typography
} from 'antd';
import { UserOutlined, PhoneOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import {
  isLocked, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH
} from '../utils/mockData';

const { Title, Text } = Typography;

function Login() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { login, checkLockStatus, locked, loginFailCount } = useAuthStore();

  useEffect(() => {
    checkLockStatus();
    if (locked) {
      const timer = setInterval(() => checkLockStatus(), 1000);
      return () => clearInterval(timer);
    }
  }, [locked, checkLockStatus]);

  const onFinish = async (values: any) => {
    if (locked) {
      message.error('账号已锁定，请稍后再试');
      return;
    }
    setLoading(true);
    try {
      await login(values.phone, values.password, 'server');
      message.success('登录成功');
      navigate('/dashboard');
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
          <Text type="secondary">服务机构管理平台</Text>
        </div>

        {locked && (
          <div style={{ marginBottom: 16, padding: 12, background: '#fff2f0', borderRadius: 4, border: '1px solid #ffccc7' }}>
            <Text type="danger" strong>🔒 账号已锁定</Text>
            <div style={{ marginTop: 4 }}>
              <Text type="secondary">连续登录失败次数过多，已临时锁定30分钟，请稍后重试。</Text>
            </div>
          </div>
        )}

        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          disabled={locked}
        >
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

        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <Button type="link" onClick={() => window.location.href = 'http://localhost:5174/login'} style={{ padding: 0 }}>
            切换到客户端
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default Login;