import { useState, useEffect } from 'react';
import {
  Card, Row, Col, Table, Button, Modal, Form, Input, Select,
  DatePicker, Typography, Tag, Space, message, Statistic, Tabs, InputNumber,
  Checkbox, Steps, Divider, Alert, List, Badge, Tooltip, Empty
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined,
  FolderOutlined, CopyOutlined, ApiOutlined, ThunderboltOutlined,
  SettingOutlined, TeamOutlined, FileTextOutlined, CheckOutlined,
  LeftOutlined, RightOutlined, BulbOutlined, StarOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAuthStore } from '../stores/authStore';
import { useOrgStore } from '../stores/orgStore';
import { isDemoCompany } from '../utils/mockData';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Step } = Steps;

interface Assessment {
  key: string;
  name: string;
  department: string;
  period: string;
  tool: 'kpi' | 'okr' | 'ksf' | 'bsc';
  status: 'draft' | 'in_progress' | 'completed';
  evaluator: string;
  employeeCount: number;
  indicatorCount: number;
  createTime: string;
}

interface Indicator {
  key: string;
  name: string;
  content: string;
  weight: number;
  standard: string;
  department: string;
  position: string;
  tool: string;
  dataSource: string;
  calcFormula: string;
  status: 'active' | 'inactive';
  version: number;
  usageCount: number;
  usedCount: number;
}

const toolMap: Record<string, { text: string; color: string; desc: string }> = {
  kpi: { text: 'KPI', color: 'red', desc: '结果导向岗位（销售/生产），量化指标为主' },
  okr: { text: 'OKR', color: 'blue', desc: '创新/项目型岗位（研发/产品），目标+关键结果' },
  ksf: { text: 'KSF', color: 'orange', desc: '薪酬强关联岗位，薪酬因子与绩效指标挂钩' },
  bsc: { text: 'BSC', color: 'green', desc: '管理层/部门负责人，四维平衡计分卡' }
};

const statusMap: Record<string, { text: string; color: string; icon: React.ReactNode }> = {
  draft: { text: '草稿', color: 'default', icon: <ClockCircleOutlined /> },
  in_progress: { text: '进行中', color: 'processing', icon: <ExclamationCircleOutlined /> },
  completed: { text: '已完成', color: 'success', icon: <CheckCircleOutlined /> }
};

function Performance() {
  const { user } = useAuthStore();
  const { deptTreeData, employees } = useOrgStore();
  const showDemoData = isDemoCompany(user?.tenantName || '');

  const assessmentData: Assessment[] = showDemoData ? [
    { key: '1', name: 'Q3绩效考核', department: '销售部', period: '2026-Q3', tool: 'kpi', status: 'in_progress', evaluator: '李经理', employeeCount: 8, indicatorCount: 5, createTime: '2026-07-01' },
    { key: '2', name: 'Q3绩效考核', department: '客服部', period: '2026-Q3', tool: 'kpi', status: 'in_progress', evaluator: '王经理', employeeCount: 6, indicatorCount: 4, createTime: '2026-07-02' },
    { key: '3', name: 'Q2绩效考核', department: '研发部', period: '2026-Q2', tool: 'okr', status: 'completed', evaluator: '赵经理', employeeCount: 10, indicatorCount: 6, createTime: '2026-04-01' },
    { key: '4', name: 'Q2管理层考核', department: '全公司', period: '2026-Q2', tool: 'bsc', status: 'completed', evaluator: '王总', employeeCount: 5, indicatorCount: 8, createTime: '2026-04-05' }
  ] : [];

  const [indicatorData, setIndicatorData] = useState<Indicator[]>(showDemoData ? [
    { key: '1', name: '销售额', content: '季度销售额完成情况', weight: 30, standard: '完成目标的90%以上得满分', department: '销售部', position: '销售专员', tool: 'kpi', dataSource: 'CRM系统', calcFormula: '实际销售额 / 目标销售额 × 100%', status: 'active', version: 2, usageCount: 156, usedCount: 24 },
    { key: '2', name: '客户满意度', content: '客户满意度评分', weight: 20, standard: '满意度达到95分以上得满分', department: '客服部', position: '客服专员', tool: 'kpi', dataSource: '调研问卷', calcFormula: '满意客户数 / 总调研客户数 × 100', status: 'active', version: 1, usageCount: 98, usedCount: 18 },
    { key: '3', name: '项目交付率', content: '项目按时交付比例', weight: 25, standard: '按时完成里程碑得满分', department: '研发部', position: '研发工程师', tool: 'kpi', dataSource: '项目管理系统', calcFormula: '按时交付项目数 / 总项目数 × 100%', status: 'active', version: 3, usageCount: 87, usedCount: 15 },
    { key: '4', name: '团队协作', content: '团队协作表现', weight: 15, standard: '团队互评平均分达到4.5分以上得满分', department: '通用', position: '通用', tool: 'kpi', dataSource: '360评价', calcFormula: '互评总得分 / 评价人数', status: 'active', version: 1, usageCount: 203, usedCount: 32 },
    { key: '5', name: '创新能力', content: '创新提案数量和质量', weight: 10, standard: '提交3个以上有效提案得满分', department: '研发部', position: '研发工程师', tool: 'kpi', dataSource: '创新管理系统', calcFormula: '有效提案数 × 质量系数', status: 'active', version: 2, usageCount: 65, usedCount: 10 },
    { key: '6', name: '财务维度', content: '财务指标完成情况', weight: 25, standard: '财务目标达成率≥90%', department: '管理层', position: '部门经理', tool: 'bsc', dataSource: 'ERP系统', calcFormula: '多项财务指标加权平均', status: 'active', version: 1, usageCount: 42, usedCount: 8 },
    { key: '7', name: '客户维度', content: '客户相关指标', weight: 25, standard: '客户满意度≥90%', department: '管理层', position: '部门经理', tool: 'bsc', dataSource: 'CRM系统', calcFormula: '多项客户指标加权平均', status: 'active', version: 1, usageCount: 42, usedCount: 8 },
  ] : []);
  const [createVisible, setCreateVisible] = useState(false);
  const [createStep, setCreateStep] = useState(0);
  const [indicatorModalVisible, setIndicatorModalVisible] = useState(false);
  const [indicatorDetailVisible, setIndicatorDetailVisible] = useState(false);
  const [aiRecommendVisible, setAiRecommendVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [indicatorForm] = Form.useForm();
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [totalIndicatorWeight, setTotalIndicatorWeight] = useState(0);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<Indicator[]>([]);
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const flattenDeptTree = (tree: any[]): any[] => {
    let result: any[] = [];
    tree.forEach(dept => {
      result.push({ key: dept.key, title: dept.title });
      if (dept.children) {
        result = result.concat(flattenDeptTree(dept.children));
      }
    });
    return result;
  };

  const deptOptions = flattenDeptTree(deptTreeData);

  const filteredPositions = selectedDepts.length > 0
    ? [...new Set(employees.filter(e => selectedDepts.includes(e.departmentId) && e.status === 'active').map(e => e.position))]
    : [...new Set(employees.filter(e => e.status === 'active').map(e => e.position))];

  const filteredEmployees = employees.filter(e => 
    e.status === 'active' && 
    (selectedDepts.length === 0 || selectedDepts.includes(e.departmentId)) &&
    (selectedPositions.length === 0 || selectedPositions.includes(e.position))
  );

  const autoMatchedIndicators = selectedDepts.length > 0 || selectedPositions.length > 0
    ? indicatorData.filter(i => {
        if (i.department === '通用' && i.position === '通用') return true;
        if (selectedDepts.length > 0 && selectedPositions.length > 0) {
          const deptNames = deptOptions.filter(d => selectedDepts.includes(d.key)).map(d => d.title);
          return deptNames.includes(i.department) || selectedPositions.includes(i.position);
        }
        if (selectedDepts.length > 0) {
          const deptNames = deptOptions.filter(d => selectedDepts.includes(d.key)).map(d => d.title);
          return deptNames.includes(i.department) || i.department === '通用';
        }
        if (selectedPositions.length > 0) {
          return selectedPositions.includes(i.position) || i.position === '通用';
        }
        return false;
      })
    : indicatorData;

  const assessmentColumns: ColumnsType<Assessment> = [
    { title: '考核名称', dataIndex: 'name', key: 'name', render: (t: string) => <a>{t}</a> },
    { title: '考核部门', dataIndex: 'department', key: 'department' },
    { title: '考核周期', dataIndex: 'period', key: 'period' },
    {
      title: '考核工具',
      dataIndex: 'tool',
      key: 'tool',
      render: (t: string) => (
        <Tooltip title={toolMap[t].desc}>
          <Tag color={toolMap[t].color}>{toolMap[t].text}</Tag>
        </Tooltip>
      )
    },
    { title: '指标数', dataIndex: 'indicatorCount', key: 'indicatorCount' },
    { title: '员工数量', dataIndex: 'employeeCount', key: 'employeeCount' },
    { title: '评估人', dataIndex: 'evaluator', key: 'evaluator' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (t: string) => { const s = statusMap[t]; return <Tag color={s.color} icon={s.icon}>{s.text}</Tag>; }
    },
    {
      title: '操作', key: 'action', render: () => (
        <Space size="middle">
          <Button type="link" size="small" icon={<EyeOutlined />}>查看</Button>
          <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
        </Space>
      )
    }
  ];

  const indicatorColumns: ColumnsType<Indicator> = [
    {
      title: '指标名称',
      dataIndex: 'name',
      key: 'name',
      render: (t: string, record) => (
        <Space>
          <a onClick={() => setIndicatorDetailVisible(true)}>{t}</a>
          {record.version > 1 && <Badge count={`V${record.version}`} style={{ backgroundColor: '#1890ff', fontSize: 10 }} />}
        </Space>
      )
    },
    { title: '考核内容', dataIndex: 'content', key: 'content', ellipsis: true },
    { title: '考核工具', dataIndex: 'tool', key: 'tool', render: (t: string) => <Tag color={toolMap[t]?.color || 'default'}>{toolMap[t]?.text || t}</Tag> },
    { title: '适用部门', dataIndex: 'department', key: 'department' },
    { title: '适用岗位', dataIndex: 'position', key: 'position' },
    { title: '权重(%)', dataIndex: 'weight', key: 'weight' },
    {
      title: '使用频率',
      dataIndex: 'usageCount',
      key: 'usageCount',
      render: (count: number) => (
        <Tooltip title={`历史使用${count}次`}>
          <Space>
            <StarOutlined style={{ color: '#faad14' }} />
            <span>{count}次</span>
          </Space>
        </Tooltip>
      )
    },
    { title: '数据来源', dataIndex: 'dataSource', key: 'dataSource' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (t: string) => <Tag color={t === 'active' ? 'success' : 'default'}>{t === 'active' ? '启用' : '禁用'}</Tag>
    },
    {
      title: '操作', key: 'action', render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setIndicatorDetailVisible(true)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
          <Button type="link" size="small" icon={<CopyOutlined />}>复制</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Space>
      )
    }
  ];

  const handleCreateAssessment = () => {
    createForm.resetFields();
    setCreateStep(0);
    setSelectedTool('');
    setSelectedIndicators([]);
    setTotalIndicatorWeight(0);
    setCreateVisible(true);
  };

  const handleNextStep = () => {
    if (createStep === 0) {
      createForm.validateFields(['name', 'tool', 'period']).then(() => {
        setCreateStep(1);
      }).catch(() => {});
    } else if (createStep === 1) {
      setCreateStep(2);
    } else if (createStep === 2) {
      if (totalIndicatorWeight !== 100) {
        message.warning(`指标权重合计必须为100%，当前为${totalIndicatorWeight}%`);
        return;
      }
      setCreateStep(3);
    }
  };

  const handlePrevStep = () => {
    if (createStep > 0) {
      setCreateStep(createStep - 1);
    }
  };

  const handleToolSelect = (tool: string) => {
    setSelectedTool(tool);
    createForm.setFieldsValue({ tool });
  };

  const handleIndicatorToggle = (indicator: Indicator) => {
    const newSelected = selectedIndicators.includes(indicator.key)
      ? selectedIndicators.filter(k => k !== indicator.key)
      : [...selectedIndicators, indicator.key];
    setSelectedIndicators(newSelected);
    const totalWeight = indicatorData
      .filter(i => newSelected.includes(i.key))
      .reduce((sum, i) => sum + i.weight, 0);
    setTotalIndicatorWeight(totalWeight);
  };

  const handleAiRecommend = async () => {
    setLoadingAi(true);
    setAiRecommendVisible(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setAiRecommendations(indicatorData.slice(0, 5));
    setLoadingAi(false);
  };

  const handleSubmitAssessment = () => {
    message.success('考核发布成功');
    setCreateVisible(false);
  };

  const handleAddIndicator = () => {
    indicatorForm.resetFields();
    setIndicatorModalVisible(true);
  };

  const handleSubmitIndicator = async () => {
    try {
      const values = await indicatorForm.validateFields();
      const newIndicator: Indicator = {
        key: String(Date.now()),
        name: values.name,
        content: values.content || '',
        weight: values.weight || 0,
        standard: values.standard || '',
        department: values.department || '通用',
        position: values.position || '通用',
        tool: values.tool,
        dataSource: values.dataSource || '',
        calcFormula: values.calcFormula || '',
        status: 'active',
        version: 1,
        usageCount: 0,
        usedCount: 0
      };
      setIndicatorData([...indicatorData, newIndicator]);
      message.success('指标保存成功');
      setIndicatorModalVisible(false);
    } catch (error) {
    }
  };

  const stepItems = [
    { title: '基础设置', icon: <SettingOutlined /> },
    { title: '选择对象', icon: <TeamOutlined /> },
    { title: '配置指标', icon: <FileTextOutlined /> },
    { title: '确认发布', icon: <CheckOutlined /> }
  ];

  const filteredIndicators = selectedTool
    ? indicatorData.filter(i => i.tool === selectedTool || i.tool === 'kpi')
    : indicatorData;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>绩效考核</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateAssessment}>发起考核</Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="考核总数" value={assessmentData.length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="进行中" value={assessmentData.filter(d => d.status === 'in_progress').length} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已完成" value={assessmentData.filter(d => d.status === 'completed').length} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="指标库" value={indicatorData.length} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
      </Row>

      <Tabs
        items={[
          {
            key: 'assessments',
            label: '考核列表',
            children: (
              <Card>
                <Table columns={assessmentColumns} dataSource={assessmentData} pagination={{ pageSize: 10 }} />
              </Card>
            )
          },
          {
            key: 'indicators',
            label: <span><FolderOutlined /> 指标库管理</span>,
            children: (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <Space>
                    <Select placeholder="按部门筛选" style={{ width: 150 }} allowClear>
                      {deptOptions.map(dept => (
                        <Option key={dept.key} value={dept.key}>{dept.title}</Option>
                      ))}
                      <Option value="通用">通用</Option>
                    </Select>
                    <Select placeholder="按考核工具筛选" style={{ width: 150 }} allowClear>
                      <Option value="kpi">KPI</Option>
                      <Option value="okr">OKR</Option>
                      <Option value="ksf">KSF</Option>
                      <Option value="bsc">BSC</Option>
                    </Select>
                    <Select placeholder="按岗位筛选" style={{ width: 150 }} allowClear>
                      {[...new Set(employees.map(e => e.position))].map(pos => (
                        <Option key={pos} value={pos}>{pos}</Option>
                      ))}
                      <Option value="通用">通用</Option>
                    </Select>
                  </Space>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleAddIndicator}>添加指标</Button>
                </div>
                <Card>
                  <Table columns={indicatorColumns} dataSource={indicatorData} pagination={{ pageSize: 10 }} />
                </Card>
              </>
            )
          }
        ]}
      />

      <Modal
        title="发起考核"
        open={createVisible}
        onCancel={() => setCreateVisible(false)}
        footer={null}
        width={900}
        destroyOnClose
      >
        <Steps current={createStep} items={stepItems} style={{ marginBottom: 32 }} />

        {createStep === 0 && (
          <div>
            <Form form={createForm} layout="vertical">
              <Form.Item name="name" label="考核名称" rules={[{ required: true, message: '请输入考核名称' }]}>
                <Input placeholder="请输入考核名称，如：Q3季度绩效考核" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="tool" label="考核工具" rules={[{ required: true, message: '请选择考核工具' }]}>
                    <div>
                      <Row gutter={12}>
                        {Object.entries(toolMap).map(([key, value]) => (
                          <Col span={12} key={key}>
                            <Card
                              size="small"
                              hoverable
                              onClick={() => handleToolSelect(key)}
                              style={{
                                cursor: 'pointer',
                                borderColor: selectedTool === key ? value.color : undefined,
                                boxShadow: selectedTool === key ? `0 0 0 2px ${value.color}20` : undefined
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Tag color={value.color} style={{ fontSize: 16, padding: '4px 12px' }}>{value.text}</Tag>
                                {selectedTool === key && <CheckCircleOutlined style={{ color: value.color, fontSize: 20 }} />}
                              </div>
                              <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                                {value.desc}
                              </div>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="period" label="考核周期" rules={[{ required: true, message: '请选择考核周期' }]}>
                    <RangePicker style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="department" label="考核部门">
                    <Select placeholder="请选择考核部门" mode="multiple">
                      {deptOptions.map(dept => (
                        <Option key={dept.key} value={dept.key}>{dept.title}</Option>
                      ))}
                      <Option value="all">全公司</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="description" label="考核说明">
                <Input.TextArea rows={3} placeholder="请输入考核说明" />
              </Form.Item>
            </Form>
          </div>
        )}

        {createStep === 1 && (
          <div>
            <Alert
              message="选择考核对象"
              description="请选择参与本次考核的员工，可按部门、岗位批量选择"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Row gutter={16}>
              <Col span={8}>
                <Card title="部门选择" size="small">
                  <Checkbox.Group 
                    style={{ width: '100%' }} 
                    value={selectedDepts}
                    onChange={(values) => {
                      setSelectedDepts(values);
                      setSelectedPositions([]);
                      setSelectedEmployees([]);
                    }}
                  >
                    {deptOptions.map(dept => {
                      const deptEmployeeCount = employees.filter(e => e.departmentId === dept.key && e.status === 'active').length;
                      return (
                        <div key={dept.key} style={{ marginBottom: 8 }}>
                          <Checkbox value={dept.key}>{dept.title}（{deptEmployeeCount}人）</Checkbox>
                        </div>
                      );
                    })}
                  </Checkbox.Group>
                </Card>
              </Col>
              <Col span={8}>
                <Card title="岗位选择" size="small">
                  <Checkbox.Group 
                    style={{ width: '100%' }} 
                    value={selectedPositions}
                    onChange={(values) => {
                      setSelectedPositions(values);
                      setSelectedEmployees([]);
                    }}
                  >
                    {filteredPositions.map(pos => (
                      <div key={pos} style={{ marginBottom: 8 }}>
                        <Checkbox value={pos}>{pos}</Checkbox>
                      </div>
                    ))}
                  </Checkbox.Group>
                </Card>
              </Col>
              <Col span={8}>
                <Card title="已选人员" size="small" extra={<Tag color="blue">共 {selectedEmployees.length} 人</Tag>}>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {filteredEmployees.map((emp) => (
                      <div key={emp.key} style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <Checkbox 
                          checked={selectedEmployees.includes(emp.key)} 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmployees([...selectedEmployees, emp.key]);
                            } else {
                              setSelectedEmployees(selectedEmployees.filter(k => k !== emp.key));
                            }
                          }}
                        >
                          {emp.name}（{emp.position}）
                        </Checkbox>
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        )}

        {createStep === 2 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Space>
                <Text strong>选择考核指标</Text>
                <Tag color={totalIndicatorWeight === 100 ? 'green' : 'red'}>
                  权重合计：{totalIndicatorWeight}%
                </Tag>
              </Space>
              <Button icon={<BulbOutlined />} onClick={handleAiRecommend} loading={loadingAi}>
                AI智能推荐
              </Button>
            </div>

            {totalIndicatorWeight !== 100 && (
              <Alert
                message={`当前指标权重合计为${totalIndicatorWeight}%，需要调整至100%才能继续`}
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Card size="small" style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary">筛选：</Text>
                <Space>
                  <Select placeholder="按部门" style={{ width: 120 }} size="small" allowClear>
                    {deptOptions.map(dept => (
                      <Option key={dept.key} value={dept.key}>{dept.title}</Option>
                    ))}
                  </Select>
                  <Select placeholder="按岗位" style={{ width: 120 }} size="small" allowClear>
                    {filteredPositions.map(pos => (
                      <Option key={pos} value={pos}>{pos}</Option>
                    ))}
                  </Select>
                </Space>
              </div>
            </Card>

            <div style={{ maxHeight: 350, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 8, padding: 12 }}>
              <Row gutter={[12, 12]}>
                {autoMatchedIndicators.map((indicator) => (
                  <Col span={12} key={indicator.key}>
                    <Card
                      size="small"
                      style={{
                        cursor: 'pointer',
                        borderColor: selectedIndicators.includes(indicator.key) ? '#1890ff' : undefined,
                        background: selectedIndicators.includes(indicator.key) ? '#e6f7ff' : undefined
                      }}
                      onClick={() => handleIndicatorToggle(indicator)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                            <Checkbox checked={selectedIndicators.includes(indicator.key)} style={{ marginRight: 8 }} />
                            {indicator.name}
                          </div>
                          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{indicator.content}</div>
                          <Space size={4}>
                            <Tag color={toolMap[indicator.tool]?.color || 'default'} style={{ fontSize: 10, margin: 0 }}>{indicator.tool.toUpperCase()}</Tag>
                            <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>{indicator.weight}%</Tag>
                            <Text type="secondary" style={{ fontSize: 10 }}>
                              <StarOutlined style={{ color: '#faad14' }} /> {indicator.usageCount}次
                            </Text>
                          </Space>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          </div>
        )}

        {createStep === 3 && (
          <div>
            <Alert
              message="请确认考核信息"
              description="确认无误后点击发布，发布后考核对象将收到通知"
              type="success"
              showIcon
              style={{ marginBottom: 24 }}
            />
            <Card size="small" title="基本信息">
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ marginBottom: 8 }}><Text type="secondary">考核名称：</Text><Text strong>Q3季度绩效考核</Text></div>
                  <div style={{ marginBottom: 8 }}><Text type="secondary">考核工具：</Text><Tag color="red">KPI</Tag></div>
                  <div><Text type="secondary">考核周期：</Text>2026-07-01 ~ 2026-09-30</div>
                </Col>
                <Col span={8}>
                  <div style={{ marginBottom: 8 }}><Text type="secondary">考核部门：</Text>销售部</div>
                  <div style={{ marginBottom: 8 }}><Text type="secondary">参与人数：</Text>8人</div>
                  <div><Text type="secondary">指标数量：</Text>{selectedIndicators.length}个</div>
                </Col>
                <Col span={8}>
                  <div style={{ marginBottom: 8 }}><Text type="secondary">权重合计：</Text><Tag color="green">{totalIndicatorWeight}%</Tag></div>
                  <div><Text type="secondary">评估人：</Text>李经理</div>
                </Col>
              </Row>
            </Card>
            <Divider />
            <Card size="small" title="考核指标列表">
              <List
                size="small"
                dataSource={indicatorData.filter(i => selectedIndicators.includes(i.key))}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.name}
                      description={
                        <Space>
                          <Tag color="blue">{item.weight}%</Tag>
                          <Text type="secondary">{item.content}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </div>
        )}

        <Divider />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={handlePrevStep} disabled={createStep === 0} icon={<LeftOutlined />}>
            上一步
          </Button>
          <Space>
            <Button onClick={() => setCreateVisible(false)}>取消</Button>
            {createStep < 3 ? (
              <Button type="primary" onClick={handleNextStep}>
                下一步 <RightOutlined />
              </Button>
            ) : (
              <Button type="primary" onClick={handleSubmitAssessment} icon={<CheckCircleOutlined />}>
                确认发布
              </Button>
            )}
          </Space>
        </div>
      </Modal>

      <Modal
        title="AI智能推荐指标"
        open={aiRecommendVisible}
        onCancel={() => setAiRecommendVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setAiRecommendVisible(false)}>取消</Button>,
          <Button key="confirm" type="primary" onClick={() => {
            setSelectedIndicators(aiRecommendations.map(r => r.key));
            setTotalIndicatorWeight(aiRecommendations.reduce((sum, i) => sum + i.weight, 0));
            setAiRecommendVisible(false);
            message.success('已应用AI推荐指标');
          }}>
            一键应用
          </Button>
        ]}
        width={700}
      >
        {loadingAi ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }}>
              <ApiOutlined spin />
            </div>
            <Text>AI正在分析岗位特征，为您智能推荐指标...</Text>
          </div>
        ) : (
          <div>
            <Alert
              message="推荐说明"
              description="基于岗位历史使用频率Top5，结合同行业最佳实践推荐"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <List
              dataSource={aiRecommendations}
              renderItem={(item, index) => (
                <List.Item
                  actions={[
                    <Tag color="gold" key="rank">Top {index + 1}</Tag>,
                    <Tag color="blue" key="weight">{item.weight}%</Tag>
                  ]}
                >
                  <List.Item.Meta
                    title={<Space><ThunderboltOutlined style={{ color: '#faad14' }} />{item.name}</Space>}
                    description={
                      <div>
                        <div>{item.content}</div>
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            历史使用 {item.usageCount} 次 · 数据来源：{item.dataSource}
                          </Text>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
            <div style={{ marginTop: 16, padding: 12, background: '#fffbe6', borderRadius: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <BulbOutlined style={{ color: '#faad14', marginRight: 4 }} />
                AI推荐指标权重合计：{aiRecommendations.reduce((sum, i) => sum + i.weight, 0)}%，您可以在此基础上调整
              </Text>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="添加考核指标"
        open={indicatorModalVisible}
        onOk={handleSubmitIndicator}
        onCancel={() => setIndicatorModalVisible(false)}
        width={700}
      >
        <Form form={indicatorForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="指标名称" rules={[{ required: true, message: '请输入指标名称' }]}>
                <Input placeholder="请输入指标名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tool" label="考核工具" rules={[{ required: true, message: '请选择考核工具' }]}>
                <Select placeholder="请选择考核工具">
                  <Option value="kpi">KPI - 关键绩效指标</Option>
                  <Option value="okr">OKR - 目标与关键成果</Option>
                  <Option value="ksf">KSF - 关键成功因素</Option>
                  <Option value="bsc">BSC - 平衡计分卡</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="content" label="考核内容" rules={[{ required: true, message: '请输入考核内容' }]}>
            <Input.TextArea rows={2} placeholder="请输入考核内容" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="weight" label="权重(%)" rules={[{ required: true, message: '请输入权重' }]}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="请输入权重" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="department" label="适用部门">
                <Select placeholder="请选择适用部门">
                  {deptOptions.map(dept => (
                    <Option key={dept.key} value={dept.title}>{dept.title}</Option>
                  ))}
                  <Option value="通用">通用</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="position" label="适用岗位">
                <Select placeholder="请选择适用岗位">
                  {[...new Set(employees.map(e => e.position))].map(pos => (
                    <Option key={pos} value={pos}>{pos}</Option>
                  ))}
                  <Option value="通用">通用</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="standard" label="评分标准" rules={[{ required: true, message: '请输入评分标准' }]}>
                <Input.TextArea rows={2} placeholder="请输入评分标准" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="calcFormula" label="计算公式">
                <Input.TextArea rows={2} placeholder="请输入计算公式" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="dataSource" label="数据来源">
            <Select placeholder="请选择数据来源">
              <Option value="crm">CRM系统</Option>
              <Option value="erp">ERP系统</Option>
              <Option value="pm">项目管理系统</Option>
              <Option value="360">360评价</Option>
              <Option value="survey">调研问卷</Option>
              <Option value="manual">手动录入</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" valuePropName="checked" initialValue={true}>
            <Checkbox>立即启用</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="指标详情"
        open={indicatorDetailVisible}
        onCancel={() => setIndicatorDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIndicatorDetailVisible(false)}>关闭</Button>,
          <Button key="edit" type="primary">编辑指标</Button>
        ]}
        width={700}
      >
        <Tabs
          items={[
            {
              key: 'basic',
              label: '基本信息',
              children: (
                <div>
                  <Row gutter={16}>
                    <Col span={12}>
                      <div style={{ marginBottom: 12 }}><Text type="secondary">指标名称：</Text><Text strong>销售额</Text></div>
                      <div style={{ marginBottom: 12 }}><Text type="secondary">考核工具：</Text><Tag color="red">KPI</Tag></div>
                      <div style={{ marginBottom: 12 }}><Text type="secondary">权重：</Text>30%</div>
                      <div style={{ marginBottom: 12 }}><Text type="secondary">状态：</Text><Tag color="green">启用</Tag></div>
                    </Col>
                    <Col span={12}>
                      <div style={{ marginBottom: 12 }}><Text type="secondary">适用部门：</Text>销售部</div>
                      <div style={{ marginBottom: 12 }}><Text type="secondary">适用岗位：</Text>销售专员</div>
                      <div style={{ marginBottom: 12 }}><Text type="secondary">数据来源：</Text>CRM系统</div>
                      <div style={{ marginBottom: 12 }}><Text type="secondary">当前版本：</Text>V2</div>
                    </Col>
                  </Row>
                  <div style={{ marginBottom: 12 }}><Text type="secondary">考核内容：</Text>季度销售额完成情况</div>
                  <div style={{ marginBottom: 12 }}><Text type="secondary">评分标准：</Text>完成目标的90%以上得满分</div>
                  <div><Text type="secondary">计算公式：</Text>实际销售额 / 目标销售额 × 100%</div>
                </div>
              )
            },
            {
              key: 'versions',
              label: '版本历史',
              children: (
                <List
                  dataSource={[
                    { version: 2, time: '2026-06-01', operator: '王经理', content: '调整权重从25%到30%', status: '当前版本' },
                    { version: 1, time: '2026-01-15', operator: '李经理', content: '初始版本', status: '历史版本' }
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
                        title={`版本 V${item.version}`}
                        description={
                          <div>
                            <div>{item.content}</div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {item.time} · 操作人：{item.operator}
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              )
            },
            {
              key: 'usage',
              label: '使用记录',
              children: (
                <div>
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={8}>
                      <Card size="small">
                        <Statistic title="累计使用" value={156} suffix="次" />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card size="small">
                        <Statistic title="当前引用" value={24} suffix="个考核" />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card size="small">
                        <Statistic title="平均得分" value={82.5} suffix="分" />
                      </Card>
                    </Col>
                  </Row>
                  <Empty description="暂无详细使用记录" />
                </div>
              )
            }
          ]}
        />
      </Modal>
    </div>
  );
}

export default Performance;
