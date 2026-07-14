import { Card, Row, Col, Statistic, Progress, Typography, Tag, Tabs, Space, Avatar } from 'antd';
import {
  TeamOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TrophyOutlined,
  RiseOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { isDemoCompany } from '../utils/mockData';

const { Title, Text } = Typography;

function Home() {
  const { user } = useAuthStore();

  const isAdmin = (user?.role?.code || '').includes('admin');
  const showDemoData = isDemoCompany(user?.tenantName || '');

  const performanceData = showDemoData ? [
    { title: '员工总数', value: 128, prefix: <TeamOutlined /> },
    { title: '目标总数', value: 456, prefix: <BarChartOutlined /> },
    { title: '已完成', value: 89, suffix: '/ 120', valueStyle: { color: '#52c41a' }, prefix: <CheckCircleOutlined /> },
    { title: '进行中', value: 31, valueStyle: { color: '#1890ff' }, prefix: <ClockCircleOutlined /> }
  ] : [];

  const talentData = showDemoData ? [
    { title: '人才总数', value: 48, prefix: <TeamOutlined /> },
    { title: '高潜人才', value: 12, valueStyle: { color: '#f5222d' }, prefix: <RiseOutlined /> },
    { title: '继任计划', value: 8, valueStyle: { color: '#1890ff' }, prefix: <TrophyOutlined /> },
    { title: '培训项目', value: 15, valueStyle: { color: '#52c41a' }, prefix: <BarChartOutlined /> }
  ] : [];

  const recentGoals = showDemoData ? [
    { name: 'Q3 销售目标', owner: '张三', progress: 75, status: 'in_progress' },
    { name: '客户满意度提升', owner: '李四', progress: 60, status: 'in_progress' },
    { name: '新产品研发', owner: '王五', progress: 90, status: 'completed' }
  ] : [];

  const recentPerformance = showDemoData ? [
    { name: '张三', score: 92, level: 'S', status: 'completed' },
    { name: '李四', score: 85, level: 'A', status: 'completed' },
    { name: '王五', score: 78, level: 'B', status: 'in_progress' }
  ] : [];

  const talentGrid = showDemoData ? [
    { label: '低绩效/低潜力', count: 3, color: '#f5222d' },
    { label: '中绩效/低潜力', count: 5, color: '#faad14' },
    { label: '高绩效/低潜力', count: 2, color: '#1890ff' },
    { label: '低绩效/中潜力', count: 4, color: '#faad14' },
    { label: '中绩效/中潜力', count: 8, color: '#1890ff' },
    { label: '高绩效/中潜力', count: 6, color: '#52c41a' },
    { label: '低绩效/高潜力', count: 1, color: '#1890ff' },
    { label: '中绩效/高潜力', count: 7, color: '#52c41a' },
    { label: '高绩效/高潜力', count: 12, color: '#f5222d' }
  ] : [];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>首页</Title>

      <Tabs
        items={[
          {
            key: 'performance',
            label: '绩效看板',
            children: (
              <>
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  {performanceData.map((item, index) => (
                    <Col span={6} key={index}>
                      <Card>
                        <Statistic {...item} />
                      </Card>
                    </Col>
                  ))}
                </Row>

                {showDemoData && (
                    <Row gutter={16} style={{ marginBottom: 24 }}>
                      <Col span={12}>
                        <Card title="目标完成进度">
                          <div style={{ marginTop: 16 }}>
                            {['销售目标', '客户满意度', '团队协作'].map((item, index) => (
                              <div key={index} style={{ marginBottom: 16 }}>
                                <Text>{item}</Text>
                                <Progress percent={[75, 60, 85][index]} style={{ marginTop: 8 }} />
                              </div>
                            ))}
                          </div>
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card title="最近通知">
                          <div style={{ marginTop: 16 }}>
                            {['目标审批已通过', '绩效评分待提交', '新员工入职提醒'].map((item, index) => (
                              <div key={index} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                                <Text>{item}</Text>
                                <div><Text type="secondary" style={{ fontSize: 12 }}>{['2小时前', '5小时前', '1天前'][index]}</Text></div>
                              </div>
                            ))}
                          </div>
                        </Card>
                      </Col>
                    </Row>
                  )}

                <Card title="近期目标">
                  <div style={{ marginTop: 16 }}>
                    {recentGoals.map((goal, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: 16, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold' }}>{goal.name}</div>
                          <div style={{ color: '#666', fontSize: 12 }}>负责人: {goal.owner}</div>
                        </div>
                        <div style={{ width: 120 }}>
                          <Progress percent={goal.progress} size="small" />
                        </div>
                        <Tag color={goal.status === 'completed' ? 'success' : 'processing'}>
                          {goal.status === 'completed' ? '已完成' : '进行中'}
                        </Tag>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )
          },
          {
            key: 'talent',
            label: '人才看板',
            children: (
              <>
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  {talentData.map((item, index) => (
                    <Col span={6} key={index}>
                      <Card>
                        <Statistic {...item} />
                      </Card>
                    </Col>
                  ))}
                </Row>

                <Card title="人才九宫格" style={{ marginBottom: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {talentGrid.map((item, index) => (
                      <div key={index} style={{
                        padding: 16,
                        background: '#fafafa',
                        border: `2px solid ${item.color}`,
                        borderRadius: 8,
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: item.color }}>{item.count}</div>
                        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="绩效考核排名">
                  <div style={{ marginTop: 16 }}>
                    {recentPerformance.map((item, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: 16, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <div style={{ width: 32, textAlign: 'center', fontWeight: 'bold', color: ['#f5222d', '#fa8c16', '#1890ff'][index] }}>
                          {index + 1}
                        </div>
                        <Avatar size="small" icon={<UserOutlined />} style={{ margin: '0 12px' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                        </div>
                        <Tag color={item.level === 'S' ? 'red' : item.level === 'A' ? 'orange' : 'blue'}>
                          {item.level}
                        </Tag>
                        <div style={{ marginLeft: 16, fontWeight: 'bold', color: item.score >= 90 ? '#52c41a' : item.score >= 80 ? '#1890ff' : item.score >= 60 ? '#faad14' : '#f5222d' }}>
                          {item.score}分
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )
          }
        ]}
      />
    </div>
  );
}

export default Home;
