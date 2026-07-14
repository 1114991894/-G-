import { useState } from 'react';
import {
  Card, Row, Col, Table, Tag, Button, Typography, Space, Avatar, Progress, Statistic,
  Modal, Form, Input, Select, DatePicker, message, Tabs, Switch,
  Alert, Checkbox, List, Badge, Tooltip, Divider, Steps, Timeline,
  Radio, Segmented, Empty, Upload
} from 'antd';
import {
  PlusOutlined, EyeOutlined, EditOutlined, UserOutlined, TrophyOutlined,
  RiseOutlined, TeamOutlined, MessageOutlined, ApiOutlined,
  BarChartOutlined, StarOutlined, WarningOutlined, SettingOutlined,
  HistoryOutlined, ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  CopyOutlined, DeleteOutlined, FileTextOutlined, UploadOutlined,
  BulbOutlined, ThunderboltOutlined, ArrowUpOutlined, ArrowDownOutlined,
  SwapOutlined, RadarChartOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd/es/upload';
import { useAuthStore } from '../stores/authStore';
import { isDemoCompany } from '../utils/mockData';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Step } = Steps;
const { TextArea } = Input;

interface TalentRecord {
  key: string;
  name: string;
  department: string;
  position: string;
  potential: 'high' | 'medium' | 'low';
  performance: number;
  competency: number;
  gridCell: string;
  readiness: string;
  successor: string;
  aiSuggestion: string;
  aiConfidence: 'high' | 'medium' | 'low';
}

interface Evaluation360 {
  key: string;
  name: string;
  department: string;
  position: string;
  totalScore: number;
  selfScore: number;
  superiorScore: number;
  peerScore: number;
  subordinateScore: number;
  status: 'pending' | 'in_progress' | 'completed' | 'abnormal';
  responseRate: number;
  totalEvaluators: number;
  completedEvaluators: number;
  startTime: string;
  endTime: string;
}

interface CompetencyModel {
  key: string;
  name: string;
  position: string;
  department: string;
  version: string;
  dimensions: Array<{ name: string; weight: number; description: string }>;
  status: 'active' | 'inactive';
  updateTime: string;
}

interface CompetencyRecord {
  key: string;
  name: string;
  department: string;
  position: string;
  matchScore: number;
  dimensions: Array<{ name: string; score: number; standard: number }>;
  strengths: string[];
  weaknesses: string[];
  aiAnalysis: string;
  learningResources: string[];
}

const potentialMap: Record<string, { text: string; color: string }> = {
  high: { text: '高潜', color: 'red' },
  medium: { text: '中潜', color: 'orange' },
  low: { text: '低潜', color: 'blue' }
};

const confidenceMap: Record<string, { text: string; color: string }> = {
  high: { text: '高', color: 'green' },
  medium: { text: '中', color: 'blue' },
  low: { text: '低', color: 'orange' }
};

const uploadProps: UploadProps = {
  name: 'file',
  action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
  headers: { authorization: 'authorization-text' },
  onChange(info) {
    if (info.file.status === 'done') {
      message.success(`${info.file.name} 简历上传成功，AI正在解析...`);
    }
  },
};

const gridCellsBase = [
  { row: 0, col: 0, label: '低绩效/高潜力', color: '#1890ff', bgColor: '#e6f7ff', type: '待发展' },
  { row: 0, col: 1, label: '中绩效/高潜力', color: '#52c41a', bgColor: '#f6ffed', type: '潜力之星' },
  { row: 0, col: 2, label: '高绩效/高潜力', color: '#f5222d', bgColor: '#fff1f0', type: '明日之星' },
  { row: 1, col: 0, label: '低绩效/中潜力', color: '#faad14', bgColor: '#fffbe6', type: '待改进' },
  { row: 1, col: 1, label: '中绩效/中潜力', color: '#1890ff', bgColor: '#e6f7ff', type: '中坚力量' },
  { row: 1, col: 2, label: '高绩效/中潜力', color: '#52c41a', bgColor: '#f6ffed', type: '可靠贡献' },
  { row: 2, col: 0, label: '低绩效/低潜力', color: '#f5222d', bgColor: '#fff1f0', type: '问题员工' },
  { row: 2, col: 1, label: '中绩效/低潜力', color: '#faad14', bgColor: '#fffbe6', type: '普通员工' },
  { row: 2, col: 2, label: '高绩效/低潜力', color: '#faad14', bgColor: '#fffbe6', type: '熟练工' },
];

function Talent() {
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [aiVisible, setAiVisible] = useState(false);
  const [gridConfigVisible, setGridConfigVisible] = useState(false);
  const [employeeListVisible, setEmployeeListVisible] = useState(false);
  const [selectedCell, setSelectedCell] = useState<any>(null);
  const [selectedTalent, setSelectedTalent] = useState<TalentRecord | null>(null);
  const [gridDimensionX, setGridDimensionX] = useState('performance');
  const [gridDimensionY, setGridDimensionY] = useState('potential');
  const [historyPeriod, setHistoryPeriod] = useState('current');
  const [feedbackStep, setFeedbackStep] = useState(0);
  const [feedbackForm] = Form.useForm();
  const [competencyCompareVisible, setCompetencyCompareVisible] = useState(false);
  const [modelDetailVisible, setModelDetailVisible] = useState(false);
  const { user } = useAuthStore();

  const isAdmin = (user?.role?.code || '').includes('admin');
  const showDemoData = isDemoCompany(user?.tenantName || '');

  const gridCells = showDemoData
    ? [
        { row: 0, col: 0, label: '低绩效/高潜力', count: 1, color: '#1890ff', bgColor: '#e6f7ff', type: '待发展' },
        { row: 0, col: 1, label: '中绩效/高潜力', count: 7, color: '#52c41a', bgColor: '#f6ffed', type: '潜力之星' },
        { row: 0, col: 2, label: '高绩效/高潜力', count: 12, color: '#f5222d', bgColor: '#fff1f0', type: '明日之星' },
        { row: 1, col: 0, label: '低绩效/中潜力', count: 4, color: '#faad14', bgColor: '#fffbe6', type: '待改进' },
        { row: 1, col: 1, label: '中绩效/中潜力', count: 8, color: '#1890ff', bgColor: '#e6f7ff', type: '中坚力量' },
        { row: 1, col: 2, label: '高绩效/中潜力', count: 6, color: '#52c41a', bgColor: '#f6ffed', type: '可靠贡献' },
        { row: 2, col: 0, label: '低绩效/低潜力', count: 3, color: '#f5222d', bgColor: '#fff1f0', type: '问题员工' },
        { row: 2, col: 1, label: '中绩效/低潜力', count: 5, color: '#faad14', bgColor: '#fffbe6', type: '普通员工' },
        { row: 2, col: 2, label: '高绩效/低潜力', count: 2, color: '#faad14', bgColor: '#fffbe6', type: '熟练工' },
      ]
    : gridCellsBase.map(c => ({ ...c, count: 0 }));

  const talentData: TalentRecord[] = showDemoData ? [
    { key: '1', name: '张三', department: '销售部', position: '销售经理', potential: 'high', performance: 92, competency: 88, gridCell: '高绩效/高潜力', readiness: '6个月', successor: '销售总监', aiSuggestion: '建议晋升为销售总监，该员工表现出色，具备领导能力', aiConfidence: 'high' },
    { key: '2', name: '李四', department: '客服部', position: '客服主管', potential: 'medium', performance: 85, competency: 80, gridCell: '中绩效/中潜力', readiness: '12个月', successor: '客服经理', aiSuggestion: '建议培养，该员工有潜力但需要进一步提升管理能力', aiConfidence: 'medium' },
    { key: '3', name: '王五', department: '研发部', position: '高级工程师', potential: 'high', performance: 88, competency: 90, gridCell: '高绩效/高潜力', readiness: '3个月', successor: '技术经理', aiSuggestion: '建议晋升为技术经理，技术能力强，创新意识突出', aiConfidence: 'high' },
    { key: '4', name: '赵六', department: '市场部', position: '市场专员', potential: 'low', performance: 72, competency: 68, gridCell: '低绩效/低潜力', readiness: '-', successor: '-', aiSuggestion: '建议关注，该员工绩效偏低，需要制定改进计划', aiConfidence: 'medium' },
    { key: '5', name: '钱七', department: '销售部', position: '销售专员', potential: 'high', performance: 78, competency: 82, gridCell: '低绩效/高潜力', readiness: '18个月', successor: '销售主管', aiSuggestion: '潜力较大，建议加强销售技巧培训', aiConfidence: 'medium' },
    { key: '6', name: '孙八', department: '研发部', position: '工程师', potential: 'medium', performance: 95, competency: 85, gridCell: '高绩效/中潜力', readiness: '-', successor: '-', aiSuggestion: '技术骨干，可考虑技术专家路线', aiConfidence: 'high' },
  ] : [];

  const evaluationData: Evaluation360[] = showDemoData ? [
    { key: '1', name: 'Q3 360度评价', department: '销售部', position: '全员', totalScore: 86.5, selfScore: 88, superiorScore: 85, peerScore: 87, subordinateScore: 86, status: 'completed', responseRate: 95, totalEvaluators: 40, completedEvaluators: 38, startTime: '2026-07-01', endTime: '2026-07-15' },
    { key: '2', name: 'Q3 360度评价', department: '研发部', position: '全员', totalScore: 0, selfScore: 0, superiorScore: 0, peerScore: 0, subordinateScore: 0, status: 'in_progress', responseRate: 65, totalEvaluators: 50, completedEvaluators: 32, startTime: '2026-07-10', endTime: '2026-07-25' },
    { key: '3', name: 'Q2 360度评价', department: '客服部', position: '全员', totalScore: 82.3, selfScore: 85, superiorScore: 80, peerScore: 83, subordinateScore: 81, status: 'completed', responseRate: 92, totalEvaluators: 25, completedEvaluators: 23, startTime: '2026-04-01', endTime: '2026-04-15' },
    { key: '4', name: '管理层评价', department: '全公司', position: '管理层', totalScore: 0, selfScore: 0, superiorScore: 0, peerScore: 0, subordinateScore: 0, status: 'pending', responseRate: 0, totalEvaluators: 15, completedEvaluators: 0, startTime: '2026-08-01', endTime: '2026-08-15' },
  ] : [];

  const competencyModels: CompetencyModel[] = showDemoData ? [
    { key: '1', name: '销售经理胜任力模型', position: '销售经理', department: '销售部', version: 'V2.0', dimensions: [{ name: '领导力', weight: 20, description: '带领团队达成目标的能力' }, { name: '客户开发', weight: 25, description: '开发新客户和维护客户关系' }, { name: '谈判能力', weight: 20, description: '商务谈判和合同签订能力' }, { name: '数据分析', weight: 15, description: '销售数据分析和决策能力' }, { name: '团队培养', weight: 20, description: '培养下属和团队建设能力' }], status: 'active', updateTime: '2026-06-15' },
    { key: '2', name: '研发工程师胜任力模型', position: '研发工程师', department: '研发部', version: 'V1.5', dimensions: [{ name: '技术深度', weight: 30, description: '专业技术能力的深度' }, { name: '学习能力', weight: 20, description: '学习新技术的速度和能力' }, { name: '问题解决', weight: 20, description: '分析和解决技术问题的能力' }, { name: '团队协作', weight: 15, description: '与团队成员协作能力' }, { name: '创新能力', weight: 15, description: '技术创新和改进能力' }], status: 'active', updateTime: '2026-05-20' },
  ] : [];

  const competencyData: CompetencyRecord[] = showDemoData ? [
    { key: '1', name: '张三', department: '销售部', position: '销售经理', matchScore: 90, dimensions: [{ name: '领导力', score: 92, standard: 85 }, { name: '客户开发', score: 95, standard: 90 }, { name: '谈判能力', score: 88, standard: 85 }, { name: '数据分析', score: 78, standard: 80 }, { name: '团队培养', score: 85, standard: 80 }], strengths: ['领导力', '客户开发', '谈判能力'], weaknesses: ['数据分析', '战略规划'], aiAnalysis: '该员工与销售总监岗位匹配度较高，建议重点培养战略规划能力', learningResources: ['数据分析实战课程', '战略管理培训', '高级销售谈判技巧'] },
    { key: '2', name: '王五', department: '研发部', position: '高级工程师', matchScore: 85, dimensions: [{ name: '技术深度', score: 92, standard: 85 }, { name: '学习能力', score: 88, standard: 80 }, { name: '问题解决', score: 90, standard: 85 }, { name: '团队协作', score: 78, standard: 80 }, { name: '创新能力', score: 85, standard: 80 }], strengths: ['技术深度', '问题解决', '创新能力'], weaknesses: ['项目管理', '跨部门沟通'], aiAnalysis: '技术能力优秀，建议加强项目管理和沟通能力培养', learningResources: ['项目管理PMP认证', '高效沟通技巧', '技术领导力培养'] },
  ] : [];

  const talentColumns: ColumnsType<TalentRecord> = [
    { title: '姓名', dataIndex: 'name', key: 'name', render: (text: string) => <Space><Avatar size="small" icon={<UserOutlined />} /><a>{text}</a></Space> },
    { title: '部门', dataIndex: 'department', key: 'department' },
    { title: '职位', dataIndex: 'position', key: 'position' },
    { title: '潜力', dataIndex: 'potential', key: 'potential', render: (p: string) => <Tag color={potentialMap[p].color}>{potentialMap[p].text}</Tag> },
    { title: '绩效', dataIndex: 'performance', key: 'performance', render: (s: number) => <Progress percent={s} size="small" status={s >= 90 ? 'success' : 'active'} style={{ width: 100 }} /> },
    { title: '九宫格', dataIndex: 'gridCell', key: 'gridCell' },
    { title: '准备度', dataIndex: 'readiness', key: 'readiness' },
    { title: '继任岗位', dataIndex: 'successor', key: 'successor' },
    { title: '操作', key: 'action', render: (_: any, record: TalentRecord) => (
      <Space size="small">
        <Button type="link" size="small" icon={<EyeOutlined />}>查看</Button>
        <Button type="link" size="small" icon={<ApiOutlined />} onClick={() => { setSelectedTalent(record); setAiVisible(true); }}>AI分析</Button>
        <Button type="link" size="small" icon={<EditOutlined />}>发展计划</Button>
      </Space>
    )}
  ];

  const evaluationColumns: ColumnsType<Evaluation360> = [
    { title: '评价名称', dataIndex: 'name', key: 'name', render: (t: string) => <a>{t}</a> },
    { title: '部门', dataIndex: 'department', key: 'department' },
    { title: '评价对象', dataIndex: 'position', key: 'position' },
    { title: '回收率', dataIndex: 'responseRate', key: 'responseRate', render: (r: number) => <Progress percent={r} size="small" status={r >= 80 ? 'success' : 'exception'} style={{ width: 100 }} /> },
    { title: '完成/总数', dataIndex: 'completedEvaluators', key: 'completed', render: (c: number, record: Evaluation360) => `${c}/${record.totalEvaluators}` },
    { title: '综合得分', dataIndex: 'totalScore', key: 'totalScore', render: (s: number) => s > 0 ? <span style={{ fontWeight: 'bold' }}>{s}分</span> : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => {
      const map: Record<string, { text: string; color: string }> = {
        pending: { text: '待开始', color: 'default' },
        in_progress: { text: '进行中', color: 'processing' },
        completed: { text: '已完成', color: 'success' },
        abnormal: { text: '异常待审', color: 'warning' }
      };
      return <Tag color={map[s].color}>{map[s].text}</Tag>;
    }},
    { title: '操作', key: 'action', render: (_, record: Evaluation360) => (
      <Space size="small">
        <Button type="link" size="small" icon={<EyeOutlined />}>查看</Button>
        {record.status === 'completed' && <Button type="link" size="small" icon={<ApiOutlined />}>AI分析</Button>}
        {record.status === 'in_progress' && <Button type="link" size="small" icon={<WarningOutlined />}>催办</Button>}
      </Space>
    )}
  ];

  const modelColumns: ColumnsType<CompetencyModel> = [
    { title: '模型名称', dataIndex: 'name', key: 'name', render: (t: string) => <a onClick={() => setModelDetailVisible(true)}>{t}</a> },
    { title: '适用岗位', dataIndex: 'position', key: 'position' },
    { title: '适用部门', dataIndex: 'department', key: 'department' },
    { title: '版本', dataIndex: 'version', key: 'version', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '维度数', dataIndex: 'dimensions', key: 'dims', render: (d: any[]) => d.length + '个' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'active' ? 'success' : 'default'}>{s === 'active' ? '启用' : '禁用'}</Tag> },
    { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime' },
    { title: '操作', key: 'action', render: () => (
      <Space size="small">
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setModelDetailVisible(true)}>查看</Button>
        <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
        <Button type="link" size="small" icon={<CopyOutlined />}>复制</Button>
      </Space>
    )}
  ];

  const competencyColumns: ColumnsType<CompetencyRecord> = [
    { title: '姓名', dataIndex: 'name', key: 'name', render: (t: string) => <Space><Avatar size="small" icon={<UserOutlined />} /><a>{t}</a></Space> },
    { title: '部门', dataIndex: 'department', key: 'department' },
    { title: '职位', dataIndex: 'position', key: 'position' },
    { title: '匹配度', dataIndex: 'matchScore', key: 'matchScore', render: (s: number) => (
      <div><Progress percent={s} size="small" status={s >= 80 ? 'success' : s >= 60 ? 'active' : 'exception'} style={{ width: 100 }} /><span style={{ marginLeft: 8 }}>{s}%</span></div>
    )},
    { title: '优势', dataIndex: 'strengths', key: 'strengths', render: (s: string[]) => s.map((x, i) => <Tag key={i} color="green">{x}</Tag>) },
    { title: '待提升', dataIndex: 'weaknesses', key: 'weaknesses', render: (w: string[]) => w.map((x, i) => <Tag key={i} color="orange">{x}</Tag>) },
    { title: '操作', key: 'action', render: () => (
      <Space size="small">
        <Button type="link" size="small" icon={<EyeOutlined />}>查看分析</Button>
        <Button type="link" size="small" icon={<RadarChartOutlined />}>雷达图</Button>
      </Space>
    )}
  ];

  const handleInitiateFeedback = () => {
    feedbackForm.resetFields();
    setFeedbackStep(0);
    setFeedbackVisible(true);
  };

  const handleCellClick = (cell: any) => {
    setSelectedCell(cell);
    setEmployeeListVisible(true);
  };

  const handleBatchAction = (action: string) => {
    message.success(`已对 ${selectedCell?.count || 0} 人批量执行：${action}`);
    setEmployeeListVisible(false);
  };

  const feedbackStepItems = [
    { title: '基础设置', icon: <SettingOutlined /> },
    { title: '选择对象', icon: <TeamOutlined /> },
    { title: '问卷设计', icon: <FileTextOutlined /> },
    { title: '评价人规则', icon: <UserOutlined /> },
    { title: '确认发布', icon: <CheckCircleOutlined /> }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>人才发展</Title>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="人才总数" value={showDemoData ? 48 : 0} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="高潜人才" value={showDemoData ? 12 : 0} valueStyle={{ color: '#f5222d' }} prefix={<RiseOutlined />} suffix={showDemoData ? <Tag color="red" style={{ marginLeft: 8 }}>25%</Tag> : undefined} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="继任计划" value={showDemoData ? 8 : 0} valueStyle={{ color: '#1890ff' }} prefix={<TrophyOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="培训项目" value={showDemoData ? 15 : 0} valueStyle={{ color: '#52c41a' }} prefix={<StarOutlined />} />
          </Card>
        </Col>
      </Row>

      <Tabs
        items={[
          {
            key: 'dashboard',
            label: <span><BarChartOutlined /> 人才看板</span>,
            children: (
              <div>
                <Card
                  title="人才九宫格"
                  extra={
                    <Space>
                      <Select value={historyPeriod} onChange={setHistoryPeriod} style={{ width: 140 }} size="small">
                        <Option value="current">当前周期</Option>
                        <Option value="last_q">上季度</Option>
                        <Option value="last_y">上年度</Option>
                        <Option value="custom">自定义周期</Option>
                      </Select>
                      <Button size="small" icon={<SettingOutlined />} onClick={() => setGridConfigVisible(true)}>维度配置</Button>
                    </Space>
                  }
                  style={{ marginBottom: 16 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ textAlign: 'center' }}>
                      <Text type="secondary" style={{ writingMode: 'vertical-rl', fontSize: 14 }}>
                        {gridDimensionY === 'potential' ? '潜力 →' : '胜任力 →'}
                      </Text>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, padding: '0 8px' }}>
                        <Text type="secondary">低</Text>
                        <Text type="secondary">中</Text>
                        <Text type="secondary">高</Text>
                      </div>
                      <div style={{ display: 'grid', gridTemplateRows: 'repeat(3, 120px)', gap: 8 }}>
                        {[0, 1, 2].map(row => (
                          <div key={row} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                            {[0, 1, 2].map(col => {
                              const cell = gridCells.find(c => c.row === row && c.col === col);
                              return (
                                <div
                                  key={`${row}-${col}`}
                                  onClick={() => cell && handleCellClick(cell)}
                                  style={{
                                    padding: 12,
                                    background: cell?.bgColor,
                                    border: `2px solid ${cell?.color}`,
                                    borderRadius: 8,
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                  <div style={{ fontSize: 28, fontWeight: 'bold', color: cell?.color }}>{cell?.count}</div>
                                  <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{cell?.type}</div>
                                  <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{cell?.label}</div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', width: 60 }}>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {gridDimensionX === 'performance' ? '绩效 →' : '绩效 →'}
                    </Text>
                  </div>
                  {showDemoData && (
                    <>
                      <Divider orientation="left" style={{ marginTop: 8 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>AI智能分析</Text>
                      </Divider>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Card size="small" title="晋升建议" extra={<Tag color="green">置信度：高</Tag>}>
                            <div style={{ marginBottom: 8 }}><ArrowUpOutlined style={{ color: '#52c41a' }} /> 建议晋升：3人</div>
                            <div style={{ fontSize: 12, color: '#666' }}>张三（销售总监）、王五（技术经理）</div>
                          </Card>
                        </Col>
                        <Col span={8}>
                          <Card size="small" title="培养建议" extra={<Tag color="blue">置信度：中</Tag>}>
                            <div style={{ marginBottom: 8 }}><BulbOutlined style={{ color: '#1890ff' }} /> 重点培养：7人</div>
                            <div style={{ fontSize: 12, color: '#666' }}>李四（管理能力）、钱七（销售技巧）</div>
                          </Card>
                        </Col>
                        <Col span={8}>
                          <Card size="small" title="关注提醒" extra={<Tag color="orange">置信度：高</Tag>}>
                            <div style={{ marginBottom: 8 }}><WarningOutlined style={{ color: '#faad14' }} /> 需要关注：3人</div>
                            <div style={{ fontSize: 12, color: '#666' }}>赵六（绩效偏低）、建议制定改进计划</div>
                          </Card>
                        </Col>
                      </Row>
                    </>
                  )}
                </Card>

                <Card title="人才盘点列表">
                  <Table columns={talentColumns} dataSource={talentData} pagination={{ pageSize: 10 }} />
                </Card>
              </div>
            )
          },
          {
            key: 'feedback',
            label: <span><MessageOutlined /> 360评价</span>,
            children: (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <Space>
                    <Select placeholder="按部门筛选" style={{ width: 150 }} allowClear>
                      <Option value="sales">销售部</Option>
                      <Option value="service">客服部</Option>
                      <Option value="rd">研发部</Option>
                    </Select>
                    <Select placeholder="按状态筛选" style={{ width: 150 }} allowClear>
                      <Option value="pending">待开始</Option>
                      <Option value="in_progress">进行中</Option>
                      <Option value="completed">已完成</Option>
                      <Option value="abnormal">异常待审</Option>
                    </Select>
                  </Space>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleInitiateFeedback}>发起评价</Button>
                </div>
                <Card>
                  <Table columns={evaluationColumns} dataSource={evaluationData} pagination={{ pageSize: 10 }} />
                </Card>
              </div>
            )
          },
          {
            key: 'competency',
            label: <span><StarOutlined /> 岗位胜任力</span>,
            children: (
              <Tabs
                items={[
                  {
                    key: 'models',
                    label: '岗位模型管理',
                    children: (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                          <Space>
                            <Select placeholder="按部门筛选" style={{ width: 150 }} allowClear>
                              <Option value="sales">销售部</Option>
                              <Option value="rd">研发部</Option>
                              <Option value="hr">人力资源部</Option>
                            </Select>
                            <Select placeholder="按岗位筛选" style={{ width: 150 }} allowClear>
                              <Option value="manager">经理级</Option>
                              <Option value="supervisor">主管级</Option>
                              <Option value="staff">员工级</Option>
                            </Select>
                          </Space>
                          <Button type="primary" icon={<PlusOutlined />}>创建岗位模型</Button>
                        </div>
                        <Card>
                          <Table columns={modelColumns} dataSource={competencyModels} pagination={{ pageSize: 10 }} />
                        </Card>
                      </div>
                    )
                  },
                  {
                    key: 'matching',
                    label: '人岗匹配',
                    children: (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                          <Space>
                            <Select placeholder="选择岗位模型" style={{ width: 200 }}>
                              <Option value="1">销售经理胜任力模型</Option>
                              <Option value="2">研发工程师胜任力模型</Option>
                            </Select>
                            <Upload {...uploadProps}>
                              <Button icon={<UploadOutlined />}>简历解析</Button>
                            </Upload>
                          </Space>
                          <Space>
                            <Button icon={<SwapOutlined />} onClick={() => setCompetencyCompareVisible(true)}>横向对比</Button>
                            <Button icon={<HistoryOutlined />}>纵向对比</Button>
                          </Space>
                        </div>
                        <Card>
                          <Table columns={competencyColumns} dataSource={competencyData} pagination={{ pageSize: 10 }} />
                        </Card>
                      </div>
                    )
                  }
                ]}
              />
            )
          }
        ]}
      />

      <Modal
        title="九宫格维度配置"
        open={gridConfigVisible}
        onCancel={() => setGridConfigVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setGridConfigVisible(false)}>取消</Button>,
          <Button key="confirm" type="primary" onClick={() => { message.success('配置已保存'); setGridConfigVisible(false); }}>保存配置</Button>
        ]}
        width={600}
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="横轴维度">
                <Select value={gridDimensionX} onChange={setGridDimensionX}>
                  <Option value="performance">绩效结果</Option>
                  <Option value="competency">胜任力</Option>
                  <Option value="potential">潜力</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="纵轴维度">
                <Select value={gridDimensionY} onChange={setGridDimensionY}>
                  <Option value="potential">潜力</Option>
                  <Option value="performance">绩效结果</Option>
                  <Option value="competency">胜任力</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Divider />
          <Alert
            message="数据来源说明"
            description={
              <ul style={{ marginBottom: 0 }}>
                <li>绩效结果：全年绩效考核平均分</li>
                <li>潜力评估：360评价中的潜力维度得分</li>
                <li>胜任力：岗位胜任力模型匹配度</li>
              </ul>
            }
            type="info"
            showIcon
          />
        </Form>
      </Modal>

      <Modal
        title={`${selectedCell?.label || ''} - 员工列表`}
        open={employeeListVisible}
        onCancel={() => setEmployeeListVisible(false)}
        footer={[
          <Button key="close" onClick={() => setEmployeeListVisible(false)}>关闭</Button>,
          <Button key="develop" onClick={() => handleBatchAction('发起培养计划')}>批量发起培养计划</Button>,
          <Button key="training" type="primary" onClick={() => handleBatchAction('安排培训')}>批量安排培训</Button>
        ]}
        width={800}
      >
        <Alert
          message={`当前格子共 ${selectedCell?.count || 0} 人，类型：${selectedCell?.type}`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Table
          size="small"
          columns={[
            { title: '姓名', dataIndex: 'name', key: 'name', render: (t: string) => <Space><Avatar size="small" icon={<UserOutlined />} />{t}</Space> },
            { title: '部门', dataIndex: 'department', key: 'department' },
            { title: '职位', dataIndex: 'position', key: 'position' },
            { title: '绩效', dataIndex: 'performance', key: 'performance', render: (s: number) => `${s}分` },
            { title: '潜力', dataIndex: 'potential', key: 'potential', render: (p: string) => potentialMap[p]?.text },
            { title: '操作', key: 'action', render: () => <Space><Button type="link" size="small">查看档案</Button><Button type="link" size="small">发展计划</Button></Space> }
          ]}
          dataSource={talentData.filter(t => t.gridCell === selectedCell?.label)}
          pagination={{ pageSize: 5 }}
          rowSelection={{}}
        />
      </Modal>

      <Modal
        title={`${selectedTalent?.name} - AI分析建议`}
        open={aiVisible}
        onCancel={() => setAiVisible(false)}
        footer={null}
        width={750}
      >
        {selectedTalent && (
          <div>
            <div style={{ marginBottom: 16, padding: 16, background: '#f9f9f9', borderRadius: 8 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ marginBottom: 8 }}><Text type="secondary">姓名：</Text><Text strong>{selectedTalent.name}</Text></div>
                  <div style={{ marginBottom: 8 }}><Text type="secondary">部门：</Text>{selectedTalent.department}</div>
                  <div><Text type="secondary">职位：</Text>{selectedTalent.position}</div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: 8 }}><Text type="secondary">潜力：</Text><Tag color={potentialMap[selectedTalent.potential].color}>{potentialMap[selectedTalent.potential].text}</Tag></div>
                  <div style={{ marginBottom: 8 }}><Text type="secondary">绩效得分：</Text><Text strong>{selectedTalent.performance}分</Text></div>
                  <div><Text type="secondary">AI置信度：</Text><Tag color={confidenceMap[selectedTalent.aiConfidence].color}>{confidenceMap[selectedTalent.aiConfidence].text}</Tag></div>
                </Col>
              </Row>
            </div>

            <Tabs
              items={[
                {
                  key: 'suggestion',
                  label: '发展建议',
                  children: (
                    <div>
                      <div style={{ padding: 16, background: '#e6f7ff', borderRadius: 8, marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                          <ApiOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                          <Text strong>AI综合分析建议</Text>
                          <Tag color="blue" style={{ marginLeft: 8 }}>AI生成</Tag>
                        </div>
                        <p style={{ marginBottom: 0 }}>{selectedTalent.aiSuggestion}</p>
                      </div>
                      <div>
                        <Text strong>分析维度：</Text>
                        <List
                          size="small"
                          dataSource={[
                            { title: '历史绩效趋势', desc: '近3个周期绩效呈上升趋势，增长率12%' },
                            { title: '同岗位对比', desc: '绩效排名前20%，高于同岗位平均水平' },
                            { title: '360评价反馈', desc: '上级评价高，同事评价良好，下级待提升' },
                            { title: '岗位胜任力匹配', desc: '匹配度85%，核心能力达标' }
                          ]}
                          renderItem={(item) => (
                            <List.Item>
                              <List.Item.Meta title={item.title} description={item.desc} />
                            </List.Item>
                          )}
                        />
                      </div>
                    </div>
                  )
                },
                {
                  key: 'promotion',
                  label: '晋升/调薪建议',
                  children: (
                    <div>
                      <Alert
                        message={`建议晋升为：${selectedTalent.successor}`}
                        description={`预计准备时间：${selectedTalent.readiness}`}
                        type="success"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                      <div>
                        <Text strong>培养路径：</Text>
                        <Timeline
                          items={[
                            { color: 'green', children: '第1-3个月：参加管理技能培训' },
                            { color: 'blue', children: '第4-6个月：担任代理经理，参与决策' },
                            { color: 'gray', children: '第7-12个月：正式晋升考核' }
                          ]}
                        />
                      </div>
                    </div>
                  )
                }
              ]}
            />
          </div>
        )}
      </Modal>

      <Modal
        title="发起360度评价"
        open={feedbackVisible}
        onCancel={() => setFeedbackVisible(false)}
        footer={null}
        width={900}
        destroyOnClose
      >
        <Steps current={feedbackStep} items={feedbackStepItems} style={{ marginBottom: 32 }} />

        {feedbackStep === 0 && (
          <Form form={feedbackForm} layout="vertical">
            <Form.Item name="title" label="评价名称" rules={[{ required: true, message: '请输入评价名称' }]}>
              <Input placeholder="请输入评价名称，如：Q3季度360度评价" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="department" label="评价部门" rules={[{ required: true, message: '请选择部门' }]}>
                  <Select placeholder="请选择评价部门" mode="multiple">
                    <Option value="sales">销售部</Option>
                    <Option value="service">客服部</Option>
                    <Option value="rd">研发部</Option>
                    <Option value="marketing">市场部</Option>
                    <Option value="all">全公司</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="position" label="评价对象">
                  <Select placeholder="请选择评价对象岗位" mode="multiple">
                    <Option value="manager">部门经理</Option>
                    <Option value="supervisor">主管</Option>
                    <Option value="staff">普通员工</Option>
                    <Option value="all">全员</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="startDate" label="开始时间" rules={[{ required: true, message: '请选择开始时间' }]}>
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="endDate" label="结束时间" rules={[{ required: true, message: '请选择结束时间' }]}>
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}

        {feedbackStep === 1 && (
          <div>
            <Alert message="选择评价对象" description="请选择参与本次评价的员工" type="info" showIcon style={{ marginBottom: 16 }} />
            <Row gutter={16}>
              <Col span={8}>
                <Card title="部门选择" size="small">
                  <Checkbox.Group style={{ width: '100%' }}>
                    <div style={{ marginBottom: 8 }}><Checkbox>销售部（15人）</Checkbox></div>
                    <div style={{ marginBottom: 8 }}><Checkbox>客服部（12人）</Checkbox></div>
                    <div style={{ marginBottom: 8 }}><Checkbox>研发部（20人）</Checkbox></div>
                    <div style={{ marginBottom: 8 }}><Checkbox>市场部（8人）</Checkbox></div>
                  </Checkbox.Group>
                </Card>
              </Col>
              <Col span={16}>
                <Card title="已选人员" size="small" extra={<Tag color="blue">共 8 人</Tag>}>
                  <Checkbox.Group style={{ width: '100%' }}>
                    <Row gutter={[8, 8]}>
                      {['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'].map((name, i) => (
                        <Col span={8} key={i}>
                          <Checkbox defaultChecked><Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 4 }} />{name}</Checkbox>
                        </Col>
                      ))}
                    </Row>
                  </Checkbox.Group>
                </Card>
              </Col>
            </Row>
          </div>
        )}

        {feedbackStep === 2 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text strong>问卷设计</Text>
              <Space>
                <Select placeholder="从模板库选择" style={{ width: 180 }}>
                  <Option value="t1">通用360评价模板</Option>
                  <Option value="t2">管理层专用模板</Option>
                  <Option value="t3">技术岗位模板</Option>
                </Select>
                <Button icon={<PlusOutlined />}>添加题目</Button>
              </Space>
            </div>
            <Card size="small" title="题目列表" style={{ marginBottom: 16 }}>
              <List
                dataSource={[
                  { type: 'scale', title: '该员工的工作业绩如何？', score: 5 },
                  { type: 'scale', title: '该员工的团队协作能力如何？', score: 5 },
                  { type: 'scale', title: '该员工的责任心如何？', score: 5 },
                  { type: 'scale', title: '该员工的学习能力如何？', score: 5 },
                  { type: 'sort', title: '请对以下能力按重要性排序', options: ['执行力', '创新力', '沟通力', '领导力'] },
                  { type: 'open', title: '该员工最突出的优点是什么？' },
                  { type: 'open', title: '该员工最需要改进的方面是什么？' }
                ]}
                renderItem={(item, index) => (
                  <List.Item
                    actions={[<Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>, <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>]}
                  >
                    <List.Item.Meta
                      avatar={<Tag color={item.type === 'scale' ? 'blue' : item.type === 'sort' ? 'orange' : 'green'}>
                        {item.type === 'scale' ? '量表题' : item.type === 'sort' ? '排序题' : '开放题'}
                      </Tag>}
                      title={`${index + 1}. ${item.title}`}
                      description={item.options ? `选项：${item.options.join('、')}` : item.score ? `${item.score}分制` : ''}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </div>
        )}

        {feedbackStep === 3 && (
          <div>
            <Alert
              message="评价人规则配置"
              description="系统将根据组织架构自动分配评价人，确保评价的客观性和全面性"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="评价人组成" style={{ marginBottom: 16 }}>
                  <List
                    size="small"
                    dataSource={[
                      { role: '上级评价', rule: '必选，直属上级1人', enabled: true },
                      { role: '平级评价', rule: '随机2-3人', enabled: true },
                      { role: '下级评价', rule: '随机2-3人（如有）', enabled: true },
                      { role: '自评', rule: '可选', enabled: true },
                    ]}
                    renderItem={(item) => (
                      <List.Item
                        actions={[<Switch defaultChecked={item.enabled} />]}
                      >
                        <List.Item.Meta title={item.role} description={item.rule} />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="匿名保护规则" style={{ marginBottom: 16 }}>
                  <List
                    size="small"
                    dataSource={[
                      { rule: '评价人身份对管理者完全匿名', desc: '管理者只能看到汇总结果' },
                      { rule: '仅总管理员可查看身份', desc: '用于异常检测和审计' },
                      { rule: '平级/下级评价完全匿名', desc: '无法追溯评价人身份' },
                      { rule: '少于3人时自动合并', desc: '防止小范围可识别' }
                    ]}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta title={item.rule} description={item.desc} />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </div>
        )}

        {feedbackStep === 4 && (
          <div>
            <Alert message="请确认评价信息" description="确认无误后点击发布，评价对象和评价人将收到通知" type="success" showIcon style={{ marginBottom: 24 }} />
            <Card size="small" title="基本信息" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}><div style={{ marginBottom: 8 }}><Text type="secondary">评价名称：</Text><Text strong>Q3季度360度评价</Text></div></Col>
                <Col span={8}><div style={{ marginBottom: 8 }}><Text type="secondary">评价部门：</Text>销售部</div></Col>
                <Col span={8}><div style={{ marginBottom: 8 }}><Text type="secondary">评价人数：</Text>8人</div></Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}><div><Text type="secondary">开始时间：</Text>2026-07-01</div></Col>
                <Col span={8}><div><Text type="secondary">结束时间：</Text>2026-07-15</div></Col>
                <Col span={8}><div><Text type="secondary">题目数量：</Text>7题</div></Col>
              </Row>
            </Card>
          </div>
        )}

        <Divider />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button disabled={feedbackStep === 0} onClick={() => setFeedbackStep(feedbackStep - 1)}>上一步</Button>
          <Space>
            <Button onClick={() => setFeedbackVisible(false)}>取消</Button>
            {feedbackStep < 4 ? (
              <Button type="primary" onClick={() => setFeedbackStep(feedbackStep + 1)}>下一步</Button>
            ) : (
              <Button type="primary" onClick={() => { message.success('评价已发布'); setFeedbackVisible(false); }}>确认发布</Button>
            )}
          </Space>
        </div>
      </Modal>

      <Modal
        title="岗位胜任力横向对比"
        open={competencyCompareVisible}
        onCancel={() => setCompetencyCompareVisible(false)}
        footer={[<Button key="close" onClick={() => setCompetencyCompareVisible(false)}>关闭</Button>]}
        width={900}
      >
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Text type="secondary">对比岗位：</Text>
            <Select defaultValue="1" style={{ width: 200 }}>
              <Option value="1">销售经理胜任力模型</Option>
            </Select>
          </Space>
        </div>
        <Card size="small" title="雷达图对比" style={{ marginBottom: 16 }}>
          <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f9', borderRadius: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <RadarChartOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 8 }} />
              <Text type="secondary">（雷达图 - 需接入图表库）</Text>
            </div>
          </div>
        </Card>
        <Table
          size="small"
          columns={[
            { title: '维度', dataIndex: 'dim', key: 'dim' },
            { title: '张三', dataIndex: 'p1', key: 'p1', render: (s: number) => <span style={{ color: s >= 85 ? '#52c41a' : '#faad14' }}>{s}分</span> },
            { title: '李四', dataIndex: 'p2', key: 'p2', render: (s: number) => <span style={{ color: s >= 85 ? '#52c41a' : '#faad14' }}>{s}分</span> },
            { title: '标准分', dataIndex: 'std', key: 'std' },
            { title: '差距分析', key: 'gap', render: () => <Button type="link" size="small">查看详情</Button> }
          ]}
          dataSource={[
            { dim: '领导力', p1: 92, p2: 78, std: 85 },
            { dim: '客户开发', p1: 95, p2: 82, std: 90 },
            { dim: '谈判能力', p1: 88, p2: 85, std: 85 },
            { dim: '数据分析', p1: 78, p2: 72, std: 80 },
            { dim: '团队培养', p1: 85, p2: 75, std: 80 },
          ]}
          pagination={false}
        />
      </Modal>

      <Modal
        title="岗位模型详情"
        open={modelDetailVisible}
        onCancel={() => setModelDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModelDetailVisible(false)}>关闭</Button>,
          <Button key="edit" type="primary">编辑模型</Button>
        ]}
        width={750}
      >
        <Tabs
          items={[
            {
              key: 'detail',
              label: '模型详情',
              children: (
                <div>
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={8}><div style={{ marginBottom: 8 }}><Text type="secondary">模型名称：</Text><Text strong>销售经理胜任力模型</Text></div></Col>
                    <Col span={8}><div style={{ marginBottom: 8 }}><Text type="secondary">适用岗位：</Text>销售经理</div></Col>
                    <Col span={8}><div style={{ marginBottom: 8 }}><Text type="secondary">当前版本：</Text><Tag color="blue">V2.0</Tag></div></Col>
                  </Row>
                  <Divider orientation="left">五维度模型</Divider>
                  <List
                    dataSource={competencyModels[0]?.dimensions}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          title={<Space>{item.name}<Tag color="blue">{item.weight}%</Tag></Space>}
                          description={item.description}
                        />
                        <Progress percent={item.weight} style={{ width: 120 }} />
                      </List.Item>
                    )}
                  />
                </div>
              )
            },
            {
              key: 'versions',
              label: '版本历史',
              children: (
                <List
                  dataSource={[
                    { version: 'V2.0', time: '2026-06-15', operator: '王总', content: '增加数据分析维度，调整权重分配', status: '当前版本' },
                    { version: 'V1.5', time: '2026-03-20', operator: '李经理', content: '优化团队培养维度描述', status: '历史版本' },
                    { version: 'V1.0', time: '2025-12-01', operator: 'HR团队', content: '初始版本发布', status: '历史版本' }
                  ]}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        item.status === '当前版本'
                          ? <Tag color="green" key="status">当前版本</Tag>
                          : <Button type="link" size="small" key="rollback">回滚</Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={`版本 ${item.version}`}
                        description={<div>{item.content}<br /><Text type="secondary" style={{ fontSize: 12 }}>{item.time} · 操作人：{item.operator}</Text></div>}
                      />
                    </List.Item>
                  )}
                />
              )
            }
          ]}
        />
      </Modal>
    </div>
  );
}

export default Talent;
