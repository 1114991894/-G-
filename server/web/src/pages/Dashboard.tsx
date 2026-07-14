import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  Card, Row, Col, Statistic, Typography, Tag, Button, Table,
  Progress, Tabs, message, Divider, Space, Tooltip,
  Badge, Alert
} from 'antd';
import {
  TeamOutlined, RiseOutlined, FallOutlined, ClockCircleOutlined, StopOutlined,
  EnvironmentOutlined, WarningOutlined,
  EyeOutlined, HeartOutlined,
  FireOutlined, CalendarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface RegionData {
  key: string;
  region: string;
  province: string;
  city: string;
  clientCount: number;
  totalEmployee: number;
  percentage: number;
}

interface ScaleData {
  key: string;
  scale: string;
  clientCount: number;
  percentage: number;
}

interface HealthClient {
  key: string;
  name: string;
  contact: string;
  phone: string;
  employeeCount: number;
  region: string;
  status: 'active' | 'trial' | 'inactive';
  healthScore: number;
  healthLevel: 'excellent' | 'good' | 'normal' | 'warning' | 'danger';
  lastLogin: string;
  loginDays7d: number;
  featureUsage: number;
  dataCompleteness: number;
}

interface ExpiringClient {
  key: string;
  name: string;
  contact: string;
  phone: string;
  expireDate: string;
  daysLeft: number;
  status: 'active' | 'trial';
}

const statusMap: Record<string, { text: string; color: string; badge: string }> = {
  active: { text: '已启用', color: 'success', badge: 'success' },
  trial: { text: '试用中', color: 'processing', badge: 'processing' },
  inactive: { text: '已禁用', color: 'error', badge: 'error' }
};

const healthColorMap: Record<string, string> = {
  excellent: '#52c41a',
  good: '#1890ff',
  normal: '#faad14',
  warning: '#fa8c16',
  danger: '#f5222d'
};

const healthLabelMap: Record<string, string> = {
  excellent: '优秀',
  good: '良好',
  normal: '一般',
  warning: '预警',
  danger: '危险'
};

function Dashboard() {
  const [activeTab, setActiveTab] = useState('health');
  const [clientCount, setClientCount] = useState(0);
  const [todayNewCount, setTodayNewCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const navigate = useNavigate();
  
  const { user } = useAuthStore();
  const isSuperAdmin = (user?.role || '').includes('super_admin') || (user?.role || '').includes('总管理员');

  useEffect(() => {
    const loadClientsData = async () => {
      let clients: any[] = [];
      
      try {
        const response = await fetch('/api/shared/clients');
        const result = await response.json();
        if (result.success) {
          clients = result.data;
        }
      } catch {
        const clientsKey = 'server_clients';
        const storedClients = localStorage.getItem(clientsKey);
        if (storedClients) {
          try {
            clients = JSON.parse(storedClients);
          } catch {}
        }
      }
      
      const filteredClients = isSuperAdmin 
        ? clients 
        : clients.filter((c: any) => c.assignedTo === user?.id || c.status === 'pending');
      
      setClientCount(filteredClients.length);
      setPendingCount(filteredClients.filter((c: any) => c.status === 'pending').length);
      setInactiveCount(filteredClients.filter((c: any) => c.status === 'inactive').length);
      
      const today = new Date().toLocaleDateString('zh-CN');
      setTodayNewCount(filteredClients.filter((c: any) => c.createdAt?.includes(today)).length);
      
      const now = new Date();
      const expiring = filteredClients.filter((c: any) => {
        if (!c.expireDate || c.expireDate === '-' || c.expireDate === '') return false;
        const expireDateStr = c.expireDate.includes('-') && c.expireDate.split('-').length > 1
          ? c.expireDate.split('-')[1].trim()
          : c.expireDate;
        const expireDate = new Date(expireDateStr);
        expireDate.setHours(23, 59, 59, 999);
        const diffDays = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 30;
      });
      setExpiringCount(expiring.length);
    };
    
    loadClientsData();
  }, [user, isSuperAdmin]);

  const regionData: RegionData[] = [];

  const scaleData: ScaleData[] = [];

  const healthClients: HealthClient[] = [];

  const expiringClients: ExpiringClient[] = [];

  const overviewStats = [
    { 
      title: '服务客户总数', 
      value: clientCount, 
      suffix: '家', 
      icon: <TeamOutlined />, 
      color: '#1890ff', 
      trend: null,
      onClick: () => navigate('/clients')
    },
    { 
      title: '今日新增', 
      value: todayNewCount, 
      suffix: '家', 
      icon: <RiseOutlined />, 
      color: '#52c41a', 
      trend: null,
      onClick: () => navigate('/clients')
    },
    { 
      title: '已禁用客户', 
      value: inactiveCount, 
      suffix: '家', 
      icon: <StopOutlined />, 
      color: '#f5222d', 
      trend: null,
      onClick: () => navigate('/clients?status=inactive')
    },
    { 
      title: '活跃率', 
      value: 0, 
      suffix: '%', 
      icon: <FireOutlined />, 
      color: '#722ed1', 
      trend: null,
      onClick: () => navigate('/clients')
    },
    { 
      title: '到期预警', 
      value: expiringCount, 
      suffix: '家', 
      icon: <CalendarOutlined />, 
      color: '#eb2f96', 
      trend: null,
      onClick: () => navigate('/clients')
    },
  ];

  const regionColumns: ColumnsType<RegionData> = [
    {
      title: '区域/省份/城市',
      dataIndex: 'region',
      key: 'region',
      render: (_: any, record: RegionData) => (
        <Space>
          <EnvironmentOutlined style={{ color: '#1890ff' }} />
          <span>{record.region} / {record.province} / {record.city}</span>
        </Space>
      )
    },
    {
      title: '客户数',
      dataIndex: 'clientCount',
      key: 'clientCount',
      sorter: (a, b) => a.clientCount - b.clientCount,
      defaultSortOrder: 'descend',
      render: (val: number) => <span style={{ fontWeight: 'bold' }}>{val}家</span>
    },
    {
      title: '员工总数',
      dataIndex: 'totalEmployee',
      key: 'totalEmployee',
      sorter: (a, b) => a.totalEmployee - b.totalEmployee,
      render: (val: number) => `${val}人`
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (val: number) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Progress percent={val} size="small" style={{ width: 100, marginRight: 8 }} />
          <span>{val}%</span>
        </div>
      )
    }
  ];

  const scaleColumns: ColumnsType<ScaleData> = [
    {
      title: '规模区间',
      dataIndex: 'scale',
      key: 'scale',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: '客户数',
      dataIndex: 'clientCount',
      key: 'clientCount',
      sorter: (a, b) => a.clientCount - b.clientCount,
      render: (val: number) => <span style={{ fontWeight: 'bold' }}>{val}家</span>
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (val: number) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Progress percent={val} size="small" style={{ width: 150, marginRight: 8 }} strokeColor="#722ed1" />
          <span>{val}%</span>
        </div>
      )
    }
  ];

  const healthColumns: ColumnsType<HealthClient> = [
    {
      title: '客户名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <a>{text}</a>
    },
    {
      title: '健康分',
      dataIndex: 'healthScore',
      key: 'healthScore',
      sorter: (a, b) => a.healthScore - b.healthScore,
      defaultSortOrder: 'descend',
      render: (score: number, record: HealthClient) => (
        <Space>
          <Progress
            type="dashboard"
            percent={score}
            width={50}
            strokeColor={healthColorMap[record.healthLevel]}
            format={() => score}
          />
          <Tag color={healthColorMap[record.healthLevel]}>{healthLabelMap[record.healthLevel]}</Tag>
        </Space>
      )
    },
    {
      title: '登录频率(7天)',
      dataIndex: 'loginDays7d',
      key: 'loginDays7d',
      render: (days: number) => `${days}天/周`
    },
    {
      title: '功能使用率',
      dataIndex: 'featureUsage',
      key: 'featureUsage',
      render: (val: number) => (
        <Progress percent={val} size="small" style={{ width: 80 }} />
      )
    },
    {
      title: '数据完整度',
      dataIndex: 'dataCompleteness',
      key: 'dataCompleteness',
      render: (val: number) => (
        <Progress percent={val} size="small" style={{ width: 80 }} strokeColor="#13c2c2" />
      )
    },
    {
      title: '最近登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={statusMap[status].color}>{statusMap[status].text}</Tag>
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Button type="link" size="small" icon={<EyeOutlined />}>详情</Button>
      )
    }
  ];

  const expiringColumns: ColumnsType<ExpiringClient> = [
    {
      title: '客户名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <a>{text}</a>
    },
    {
      title: '联系人',
      dataIndex: 'contact',
      key: 'contact'
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: '到期日期',
      dataIndex: 'expireDate',
      key: 'expireDate',
    },
    {
      title: '剩余天数',
      dataIndex: 'daysLeft',
      key: 'daysLeft',
      sorter: (a, b) => a.daysLeft - b.daysLeft,
      defaultSortOrder: 'ascend',
      render: (days: number) => {
        let color = '#52c41a';
        if (days <= 7) color = '#f5222d';
        else if (days <= 15) color = '#faad14';
        return (
          <Space>
            <ClockCircleOutlined style={{ color }} />
            <span style={{ color, fontWeight: 'bold' }}>{days}天</span>
            {days <= 7 && <Tag color="red">紧急</Tag>}
            {days > 7 && days <= 15 && <Tag color="orange">即将到期</Tag>}
          </Space>
        );
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={statusMap[status].color}>{statusMap[status].text}</Tag>
    },
  ];

  const lowHealthCount = healthClients.filter(c => c.healthScore < 60).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>客户看板</Title>
      </div>

      {lowHealthCount > 0 && (
        <Alert
          message={
            <Space>
              <WarningOutlined style={{ color: '#f5222d' }} />
              <span>有 <strong>{lowHealthCount}</strong> 家客户健康分低于60分，建议及时关注</span>
            </Space>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          action={<Button type="link" size="small" onClick={() => setActiveTab('health')}>查看详情</Button>}
        />
      )}

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {overviewStats.map((stat, index) => (
          <Col span={4} key={index}>
            <Card 
              hoverable 
              size="small"
              onClick={stat.onClick}
              style={{ cursor: stat.onClick ? 'pointer' : 'default' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{stat.title}</Text>
                  <div style={{ marginTop: 4, display: 'flex', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 24, fontWeight: 'bold', color: stat.color }}>{stat.value}</span>
                    <span style={{ fontSize: 12, color: '#999', marginLeft: 4 }}>{stat.suffix}</span>
                  </div>
                  {stat.trend && (
                    <div style={{ marginTop: 4, fontSize: 12 }}>
                      {stat.trend.type === 'up' ? (
                        <span style={{ color: '#52c41a' }}>
                          <RiseOutlined /> 环比 +{stat.trend.value}
                        </span>
                      ) : (
                        <span style={{ color: '#f5222d' }}>
                          <FallOutlined /> 环比 -{stat.trend.value}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 28, color: stat.color, opacity: 0.8 }}>
                  {stat.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'region',
            label: <span><EnvironmentOutlined /> 区域分析</span>,
            children: (
              <Card title="按区域/省份/城市客户分布">
                <Table
                  columns={regionColumns}
                  dataSource={regionData}
                  pagination={{ pageSize: 10 }}
                  summary={(pageData) => {
                    const totalClient = pageData.reduce((sum, item) => sum + item.clientCount, 0);
                    const totalEmployee = pageData.reduce((sum, item) => sum + item.totalEmployee, 0);
                    return (
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0}><Text strong>本页合计</Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={1}><Text strong>{totalClient}家</Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={2}><Text strong>{totalEmployee}人</Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={3}><Text strong>100%</Text></Table.Summary.Cell>
                      </Table.Summary.Row>
                    );
                  }}
                />
              </Card>
            )
          },
          {
            key: 'scale',
            label: <span><TeamOutlined /> 规模分析</span>,
            children: (
              <Card title="按员工人数区间分布">
                <Table columns={scaleColumns} dataSource={scaleData} pagination={false} />
                <Divider />
                <Row gutter={16}>
                  {scaleData.map((item, index) => (
                    <Col span={6} key={item.key}>
                      <Card size="small">
                        <Statistic
                          title={item.scale}
                          value={item.clientCount}
                          suffix="家"
                          valueStyle={{ color: ['#1890ff', '#52c41a', '#faad14', '#722ed1'][index] }}
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            )
          },
          {
            key: 'health',
            label: <span><HeartOutlined /> 健康度分析</span>,
            children: (
              <Card
                title="客户健康度评分"
                extra={
                  <Space>
                    <Tag color={healthColorMap.excellent}>优秀 90+</Tag>
                    <Tag color={healthColorMap.good}>良好 80-89</Tag>
                    <Tag color={healthColorMap.normal}>一般 60-79</Tag>
                    <Tag color={healthColorMap.warning}>预警 50-59</Tag>
                    <Tag color={healthColorMap.danger}>危险 &lt;50</Tag>
                  </Space>
                }
              >
                <Alert
                  message="健康度综合评分 = 登录频率(40%) + 功能使用率(35%) + 数据完整度(25%)"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Table columns={healthColumns} dataSource={healthClients} pagination={{ pageSize: 10 }} />
              </Card>
            )
          },
          {
            key: 'expiring',
            label: <span><ClockCircleOutlined /> 到期预警</span>,
            children: (
              <Card title="服务即将到期的客户（30天内）">
                <Alert
                  message="建议：到期前30天开始提醒，到期前7天重点跟进，可配合优惠活动促进续费"
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Table columns={expiringColumns} dataSource={expiringClients} pagination={{ pageSize: 10 }} />
              </Card>
            )
          }
        ]}
      />
    </div>
  );
}

export default Dashboard;
