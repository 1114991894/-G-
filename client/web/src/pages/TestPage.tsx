import React from 'react';
import { Button, Card, Typography, message } from 'antd';
import { LoginOutlined, TeamOutlined, BarChartOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const TestPage: React.FC = () => {
  return (
    <div style={{ 
      padding: '50px', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <Card style={{ 
        maxWidth: 600, 
        width: '100%',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <TeamOutlined style={{ fontSize: 64, color: '#667eea', marginBottom: 16 }} />
          <Title level={2} style={{ color: '#667eea' }}>
            百鲸G系统
          </Title>
          <Title level={4} style={{ fontWeight: 'normal', marginBottom: 32 }}>
            智能绩效管理平台 v9.0
          </Title>
          
          <Paragraph style={{ fontSize: 16, marginBottom: 32 }}>
            ✅ 前端页面加载成功！<br />
            这是一个测试页面，用于验证前端服务是否正常工作。
          </Paragraph>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button 
              type="primary" 
              size="large"
              icon={<LoginOutlined />}
              onClick={() => {
                message.success('页面正常运行！');
              }}
            >
              测试按钮
            </Button>
            
            <Button 
              size="large"
              icon={<BarChartOutlined />}
              onClick={() => {
                window.location.href = '/login';
              }}
            >
              前往登录页
            </Button>
          </div>

          <div style={{ marginTop: 32, padding: '16px', background: '#f5f5f5', borderRadius: 8 }}>
            <Paragraph style={{ margin: 0, color: '#666' }}>
              <strong>如果您能看到这个页面，说明：</strong><br />
              1. ✅ Vite 开发服务器运行正常<br />
              2. ✅ React 渲染正常<br />
              3. ✅ Ant Design 组件库加载成功<br />
              <br />
              <strong>下一步：</strong><br />
              点击"前往登录页"按钮，测试完整功能
            </Paragraph>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TestPage;
