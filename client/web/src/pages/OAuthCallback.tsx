import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, message, Typography, Button, Card } from 'antd';
import { useAuthStore } from '../stores/authStore';

const { Title, Text } = Typography;

function OAuthCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { oauthLogin } = useAuthStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const platform = params.get('platform') || detectPlatform();

    if (!code) {
      setError('未获取到授权信息');
      setLoading(false);
      return;
    }

    if (!platform) {
      setError('无法识别登录平台');
      setLoading(false);
      return;
    }

    setLoading(true);
    oauthLogin(platform, code, state)
      .then(() => {
        message.success('登录成功');
        navigate('/');
      })
      .catch((err: any) => {
        const errMsg = err.message || '登录失败';
        setError(errMsg);
        setLoading(false);
      });
  }, [oauthLogin, navigate]);

  const detectPlatform = (): string | null => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('wxwork')) return 'wecom';
    if (ua.includes('lark') || ua.includes('feishu')) return 'feishu';
    if (ua.includes('dingtalk')) return 'dingtalk';
    return null;
  };

  const platformName = (() => {
    const params = new URLSearchParams(window.location.search);
    const platform = params.get('platform');
    const names: Record<string, string> = {
      wecom: '企业微信',
      feishu: '飞书',
      dingtalk: '钉钉'
    };
    return names[platform || ''] || '第三方';
  })();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 400, textAlign: 'center' }}>
        {loading ? (
          <div>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">正在通过{platformName}登录...</Text>
            </div>
          </div>
        ) : error ? (
          <div>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <Title level={4} style={{ marginBottom: 8 }}>登录失败</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
              {error}
            </Text>
            <Button type="primary" onClick={() => navigate('/login')}>
              返回登录页
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

export default OAuthCallback;
