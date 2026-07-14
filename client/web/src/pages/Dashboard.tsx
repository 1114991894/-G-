import { useState } from 'react';
import {
  Card, Statistic, Progress, Typography, Segmented, Table,
  Tag, Tooltip, Badge, Alert, Space, Button, Modal, Row, Col
} from 'antd';
import {
  TeamOutlined, BarChartOutlined, CheckCircleOutlined, ClockCircleOutlined,
  WarningOutlined, InfoCircleOutlined, UserOutlined, ArrowUpOutlined,
  ArrowDownOutlined, EyeOutlined, RiseOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAuthStore } from '../stores/authStore';
import { isDemoCompany } from '../utils/mockData';

const { Title, Text } = Typography;

interface DepartmentData {
  key: string;
  name: string;
  targetProgress: number;
  avgScore: number;
  employeeCount: number;
  completedCount: number;
  warningCount: number;
}

interface EmployeeData {
  key: string;
  name: string;
  position: string;
  targetProgress: number;
  performanceScore: number;
  warning: boolean;
}

function Dashboard() {
  const { user } = useAuthStore();
  const [timeDimension, setTimeDimension] = useState<string>('month');
  const [compareMode, setCompareMode] = useState<string>('none');
  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeData | null>(null);

  const role = user?.role;
  const roleCode = typeof role === 'object' ? role.code : role || '';
  const isSuperAdmin = roleCode.includes('super_admin') || roleCode.includes('总管理员');
  const isMainAdmin = roleCode.includes('main_admin') || roleCode.includes('主管理员');
  const showDemoData = isDemoCompany(user?.tenantName || '');

  const departments: DepartmentData[] = showDemoData ? [
    { key: '1', name: '销售部', targetProgress: 75, avgScore: 82, employeeCount: 15, completedCount: 8, warningCount: 2 },
    { key: '2', name: '客服部', targetProgress: 60, avgScore: 75, employeeCount: 12, completedCount: 5, warningCount: 3 },
    { key: '3', name: '研发部', targetProgress: 92, avgScore: 88, employeeCount: 20, completedCount: 15, warningCount: 1 },
    { key: '4', name: '市场部', targetProgress: 45, avgScore: 70, employeeCount: 8, completedCount: 3, warningCount: 2 },
  ] : [];

  const employeesByDept: Record<string, EmployeeData[]> = showDemoData ? {
    '1': [
      { key: 'e1', name: '张三', position: '销售经理', targetProgress: 95, performanceScore: 92, warning: false },
      { key: 'e2', name: '李四', position: '销售主管', targetProgress: 65, performanceScore: 58, warning: true },
      { key: 'e3', name: '王五', position: '销售专员', targetProgress: 70, performanceScore: 72, warning: false },
    ],
    '2': [
      { key: 'e4', name: '赵六', position: '客服经理', targetProgress: 70, performanceScore: 75, warning: false },
      { key: 'e5', name: '钱七', position: '客服专员', targetProgress: 50, performanceScore: 55, warning: true },
    ],
    '3': [
      { key: 'e6', name: '孙八', position: '技术总监', targetProgress: 95, performanceScore: 95, warning: false },
    ],
    '4': [
      { key: 'e7', name: '周九', position: '市场专员', targetProgress: 40, performanceScore: 52, warning: true },
    ]
  } : {};

  const getProgressColor = (percent: number): string => {
    if (percent >= 100) return '#52c41a';
    if (percent >= 80) return '#faad14';
    return '#f5222d';
  };

  const getProgressStatus = (percent: number): 'success' | 'exception' | 'active' | undefined => {
    if (percent >= 100) return 'success';
    if (percent < 80) return 'exception';
    return 'active';
  };

  const handleDeptClick = (deptKey: string) => {
    setExpandedDept(expandedDept === deptKey ? null : deptKey);
  };

  const handleEmployeeClick = (employee: EmployeeData) => {
    setSelectedEmployee(employee);
    setEmployeeModalVisible(true);
  };

  const departmentColumns: ColumnsType<DepartmentData> = [
    {
      title: '部门',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record) => (
        <a onClick={() => handleDeptClick(record.key)}>
          {expandedDept === record.key ? '▼ ' : '▶ '}
          {text}
        </a>
      )
    },
    {
      title: (
        <Tooltip title="目标完成百分比，≥100%绿色、80-99%黄色、<80%红色">
          目标完成度 <InfoCircleOutlined style={{ color: '#999', fontSize: 12 }} />
        </Tooltip>
      ),
      dataIndex: 'targetProgress',
      key: 'targetProgress',
      render: (percent: number) => (
        <Tooltip title={`完成度：${percent}%\n计算公式：已完成目标数 / 总目标数 × 100%`}>
          <Progress
            percent={percent}
            size="small"
            strokeColor={getProgressColor(percent)}
            status={getProgressStatus(percent)}
          />
        </Tooltip>
      )
    },
    {
      title: '平均绩效分',
      dataIndex: 'avgScore',
      key: 'avgScore',
      render: (score: number) => (
        <span style={{ fontWeight: 'bold', color: score >= 90 ? '#52c41a' : score >= 70 ? '#1890ff' : '#f5222d' }}>
          {score}分
        </span>
      )
    },
    {
      title: '员工数',
      dataIndex: 'employeeCount',
      key: 'employeeCount'
    },
    {
      title: (
        <Tooltip title="连续2周期绩效低于60分的员工">
          <Badge count={departments.reduce((sum, d) => sum + d.warningCount, 0)} size="small" offset={[10, 0]}>
            <span style={{ color: '#f5222d' }}><WarningOutlined /> 绩效预警</span>
          </Badge>
        </Tooltip>
      ),
      dataIndex: 'warningCount',
      key: 'warningCount',
      render: (count: number) => (
        count > 0 ? <Tag color="red">{count}人</Tag> : <Tag color="green">0人</Tag>
      )
    }
  ];

  const expandedRowRender = (record: DepartmentData) => {
    const employees = employeesByDept[record.key] || [];
    return (
      <div style={{ paddingLeft: 40 }}>
        <Table
          size="small"
          columns={[
            {
              title: '员工姓名',
              dataIndex: 'name',
              key: 'name',
              render: (text: string, emp) => (
                <a onClick={() => handleEmployeeClick(emp as EmployeeData)}>
                  <UserOutlined style={{ marginRight: 4 }} />{text}
                </a>
              )
            },
            { title: '职位', dataIndex: 'position', key: 'position' },
            {
              title: '目标完成度',
              dataIndex: 'targetProgress',
              key: 'targetProgress',
              render: (percent: number) => (
                <Progress percent={percent} size="small" strokeColor={getProgressColor(percent)} style={{ width: 150 }} />
              )
            },
            {
              title: '绩效得分',
              dataIndex: 'performanceScore',
              key: 'performanceScore',
              render: (score: number, emp: any) => (
                <Space>
                  <span style={{ fontWeight: 'bold', color: score >= 90 ? '#52c41a' : score >= 60 ? '#1890ff' : '#f5222d' }}>
                    {score}分
                  </span>
                  {(emp as EmployeeData).warning && <Tag color="red" icon={<WarningOutlined />}>低绩效预警</Tag>}
                </Space>
              )
            },
            {
              title: '操作',
              key: 'action',
              render: (_, emp: any) => (
                <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleEmployeeClick(emp as EmployeeData)}>
                  查看档案
                </Button>
              )
            }
          ]}
          dataSource={employees}
          pagination={false}
          showHeader={true}
        />
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>绩效看板</Title>
        <Space>
          <Segmented
            value={timeDimension}
            onChange={setTimeDimension}
            options={[
              { label: '日', value: 'day' },
              { label: '周', value: 'week' },
              { label: '月', value: 'month' },
              { label: '季度', value: 'quarter' },
              { label: '年度', value: 'year' }
            ]}
          />
          <Segmented
            value={compareMode}
            onChange={setCompareMode}
            options={[
              { label: '无对比', value: 'none' },
              { label: '同比', value: 'yoy' },
              { label: '环比', value: 'mom' }
            ]}
          />
        </Space>
      </div>

      {/* 绩效预警 */}
      <Alert
        message={
          <Space>
            <WarningOutlined style={{ color: '#f5222d' }} />
            <span><strong>绩效预警：</strong>共有 {departments.reduce((sum, d) => sum + d.warningCount, 0)} 名员工连续2周期绩效低于60分，请及时关注</span>
          </Space>
        }
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        action={<Button type="link" size="small">查看详情</Button>}
      />

      {showDemoData && (
        <Alert
          message={
            <Space>
              <WarningOutlined style={{ color: '#faad14' }} />
              <span><strong>目标预警：</strong>市场部目标完成度45%且周期已过半，请及时跟进</span>
            </Space>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        <Card>
          <Statistic
            title="员工总数"
            value={showDemoData ? 128 : 0}
            prefix={<TeamOutlined />}
            suffix={showDemoData && compareMode !== 'none' && (
              <span style={{ fontSize: 14, color: '#52c41a' }}>
                <ArrowUpOutlined /> 5%
              </span>
            )}
          />
        </Card>
        <Card>
          <Statistic
            title="目标总数"
            value={showDemoData ? 456 : 0}
            prefix={<BarChartOutlined />}
            suffix={showDemoData && compareMode !== 'none' && (
              <span style={{ fontSize: 14, color: '#52c41a' }}>
                <ArrowUpOutlined /> 12%
              </span>
            )}
          />
        </Card>
        <Card>
          <Statistic
            title="已完成"
            value={showDemoData ? 89 : 0}
            suffix={showDemoData ? '/ 120' : ''}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
        <Card>
          <Statistic
            title="进行中"
            value={showDemoData ? 31 : 0}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </div>

      {(isSuperAdmin || isMainAdmin) && showDemoData && (
        <Card
          title={
            <span>
              <RiseOutlined style={{ marginRight: 8, color: '#52c41a' }} />
              全年销售目标完成进度
            </span>
          }
          style={{ marginBottom: 16 }}
        >
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text>年度销售目标完成率</Text>
              <Text strong style={{ fontSize: 20, color: '#52c41a' }}>68%</Text>
            </div>
            <Progress
              percent={68}
              strokeColor={{
                '0%': '#1890ff',
                '100%': '#52c41a'
              }}
              size="large"
              strokeWidth={24}
            />
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">年度目标</Text>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>¥5,000万</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">已完成</Text>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#52c41a' }}>¥3,400万</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">剩余目标</Text>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#faad14' }}>¥1,600万</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">时间进度</Text>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#722ed1' }}>58%</div>
              </div>
            </div>
            <div style={{ marginTop: 16, padding: 12, background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <Text type="secondary">
                  当前进度高于时间进度 <Text strong>10%</Text>，年度目标完成情况良好
                </Text>
              </div>
            </div>
          </div>
        </Card>
      )}

      {showDemoData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 16 }}>
          <Card title="目标完成进度">
            <div style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Tooltip title="销售部门本季度销售业绩目标完成情况">
                    <Text>销售目标</Text>
                  </Tooltip>
                  <Text strong style={{ color: getProgressColor(75) }}>75%</Text>
                </div>
                <Progress
                  percent={75}
                  strokeColor={getProgressColor(75)}
                  status={getProgressStatus(75)}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Tooltip title="客户满意度调研得分">
                    <Text>客户满意度</Text>
                  </Tooltip>
                  <Text strong style={{ color: getProgressColor(60) }}>60%</Text>
                </div>
                <Progress
                  percent={60}
                  strokeColor={getProgressColor(60)}
                  status={getProgressStatus(60)}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Tooltip title="团队协作评分">
                    <Text>团队协作</Text>
                  </Tooltip>
                  <Text strong style={{ color: getProgressColor(85) }}>85%</Text>
                </div>
                <Progress
                  percent={85}
                  strokeColor={getProgressColor(85)}
                  status={getProgressStatus(85)}
                />
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Tooltip title="研发项目进度">
                    <Text>研发进度</Text>
                  </Tooltip>
                  <Text strong style={{ color: getProgressColor(92) }}>92%</Text>
                </div>
                <Progress
                  percent={92}
                  strokeColor={getProgressColor(92)}
                  status={getProgressStatus(92)}
                />
              </div>
            </div>
            <div style={{ marginTop: 12, padding: 8, background: '#f9f9f9', borderRadius: 4, fontSize: 12 }}>
              <Text type="secondary">
                <InfoCircleOutlined style={{ marginRight: 4 }} />
                颜色说明：<span style={{ color: '#52c41a' }}>绿色≥100%</span> /
                <span style={{ color: '#faad14', marginLeft: 8 }}>黄色80-99%</span> /
                <span style={{ color: '#f5222d', marginLeft: 8 }}>红色&lt;80%</span>
              </Text>
            </div>
          </Card>

          <Card title="最近通知">
            <div style={{ marginTop: 16 }}>
              <div style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                <Space>
                  <Badge dot color="#52c41a" />
                  <Text>目标审批已通过</Text>
                </Space>
                <div><Text type="secondary" style={{ fontSize: 12 }}>2小时前</Text></div>
              </div>
              <div style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                <Space>
                  <Badge dot color="#faad14" />
                  <Text>绩效评分待提交</Text>
                </Space>
                <div><Text type="secondary" style={{ fontSize: 12 }}>5小时前</Text></div>
              </div>
              <div style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                <Space>
                  <Badge dot color="#f5222d" />
                  <Text style={{ color: '#f5222d' }}>绩效预警：李四连续2周期低于60分</Text>
                </Space>
                <div><Text type="secondary" style={{ fontSize: 12 }}>1天前</Text></div>
              </div>
              <div style={{ padding: '12px 0' }}>
                <Space>
                  <Badge dot color="#1890ff" />
                  <Text>新员工入职提醒</Text>
                </Space>
                <div><Text type="secondary" style={{ fontSize: 12 }}>1天前</Text></div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card title="部门绩效概览（点击部门可下钻查看员工）">
        <Table
          columns={departmentColumns}
          dataSource={departments}
          pagination={false}
          expandable={{
            expandedRowRender,
            expandedRowKeys: expandedDept ? [expandedDept] : [],
            onExpand: (expanded, record) => handleDeptClick(record.key),
            showExpandColumn: false
          }}
        />
      </Card>

      {/* 员工绩效档案弹窗 */}
      <Modal
        title={`${selectedEmployee?.name} - 绩效档案`}
        open={employeeModalVisible}
        onCancel={() => setEmployeeModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setEmployeeModalVisible(false)}>关闭</Button>
        ]}
        width={600}
      >
        {selectedEmployee && (
          <div>
            <div style={{ marginBottom: 16, padding: 16, background: '#f9f9f9', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text type="secondary">姓名</Text>
                <Text strong>{selectedEmployee.name}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text type="secondary">职位</Text>
                <Text>{selectedEmployee.position}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text type="secondary">目标完成度</Text>
                <Tag color={selectedEmployee.targetProgress >= 80 ? 'green' : 'red'}>
                  {selectedEmployee.targetProgress}%
                </Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">绩效得分</Text>
                <Text strong style={{
                  color: selectedEmployee.performanceScore >= 90 ? '#52c41a' :
                    selectedEmployee.performanceScore >= 60 ? '#1890ff' : '#f5222d',
                  fontSize: 18
                }}>
                  {selectedEmployee.performanceScore}分
                </Text>
              </div>
            </div>
            {selectedEmployee.warning && (
              <Alert
                message="绩效预警"
                description="该员工连续2周期绩效低于60分，建议及时进行绩效面谈并制定改进计划"
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            <div>
              <Text strong>历史绩效趋势</Text>
              <div style={{ marginTop: 8, padding: 16, background: '#f9f9f9', borderRadius: 4, textAlign: 'center' }}>
                <Text type="secondary">（历史绩效趋势图 - 需接入图表库）</Text>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Dashboard;