import { useState, useEffect } from 'react';
import {
  Card, Row, Col, Table, Button, Modal, Form, Input, Select,
  DatePicker, Progress, Typography, Tag, Space, message, Statistic, Tabs, Timeline, Spin,
  Upload, Alert, Divider, Badge, Tooltip, Popover, Empty, List
} from 'antd';
import {
  PlusOutlined, EditOutlined, CheckOutlined,
  CloseOutlined, ClockCircleOutlined, SyncOutlined, CheckCircleOutlined,
  HistoryOutlined, MessageOutlined, EyeOutlined, ApiOutlined,
  UploadOutlined, FileTextOutlined,
  BellOutlined, DiffOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd/es/upload';
import { useAuthStore } from '../stores/authStore';
import { useOrgStore } from '../stores/orgStore';
import { useNotificationStore } from '../stores/notificationStore';
import { isDemoCompany } from '../utils/mockData';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface Goal {
  key: string;
  name: string;
  owner: string;
  department: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'pending_approval' | 'approved';
  approvalStatus: 'draft' | 'pending' | 'approved' | 'rejected' | 'pending_modify';
  priority: 'high' | 'medium' | 'low';
  period: string;
  version: number;
  endDate: string;
  logs: Array<{ time: string; action: string; operator: string; before?: string; after?: string }>;
  versions?: Array<{ version: number; time: string; operator: string; content: string }>;
}

const statusMap: Record<string, { text: string; color: string; icon: React.ReactNode }> = {
  not_started: { text: '未开始', color: 'default', icon: <ClockCircleOutlined /> },
  in_progress: { text: '进行中', color: 'processing', icon: <SyncOutlined spin /> },
  completed: { text: '已完成', color: 'success', icon: <CheckCircleOutlined /> },
  pending_approval: { text: '待审批', color: 'warning', icon: <ClockCircleOutlined /> },
  approved: { text: '已生效', color: 'success', icon: <CheckOutlined /> }
};

const approvalMap: Record<string, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'default' },
  pending: { text: '待审批', color: 'warning' },
  approved: { text: '已生效', color: 'success' },
  rejected: { text: '已驳回', color: 'error' },
  pending_modify: { text: '待审批(修改)', color: 'processing' }
};

const priorityMap: Record<string, { text: string; color: string }> = {
  high: { text: '高', color: 'red' },
  medium: { text: '中', color: 'orange' },
  low: { text: '低', color: 'blue' }
};



const uploadProps: UploadProps = {
  name: 'file',
  action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
  headers: { authorization: 'authorization-text' },
  onChange(info) {
    if (info.file.status !== 'uploading') {
      console.log(info.file, info.fileList);
    }
    if (info.file.status === 'done') {
      message.success(`${info.file.name} 文件上传成功`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 文件上传失败`);
    }
  },
};

function Goals() {
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [versionCompareVisible, setVersionCompareVisible] = useState(false);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ content: string; type: string; confidence: string }>>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const { user } = useAuthStore();
  const { deptTreeData, employees } = useOrgStore();
  const { addNotification } = useNotificationStore();

  const roleCode = typeof user?.role === 'object' ? user?.role.code : user?.role || '';
  const isSuperAdmin = roleCode === 'super_admin';
  const isMainAdmin = roleCode === 'main_admin';
  const isSubAdmin = roleCode === 'sub_admin';
  const isManager = roleCode === 'manager';
  const isAdmin = isSuperAdmin || isMainAdmin;
  const showDemoData = isDemoCompany(user?.tenantName || '');

  const getDeptOptions = (depts: any[], prefix: string = ''): { value: string; label: string }[] => {
    let options: { value: string; label: string }[] = [];
    depts.forEach(dept => {
      const label = prefix ? `${prefix}/${dept.title}` : dept.title;
      options.push({ value: dept.key, label });
      if (dept.children && dept.children.length > 0) {
        options = [...options, ...getDeptOptions(dept.children, label)];
      }
    });
    return options;
  };

  const deptOptions = getDeptOptions(deptTreeData);

  const filteredEmployees = selectedDept
    ? employees.filter(e => e.departmentId === selectedDept || e.departmentId.startsWith(selectedDept + '-'))
    : employees.filter(e => e.status === 'active');

  useEffect(() => {
    setSelectedDept(form.getFieldValue('department') || '');
  }, [form]);

  const handleDeptChange = (value: string) => {
    setSelectedDept(value);
    form.setFieldsValue({ owner: undefined });
  };

  const data: Goal[] = showDemoData ? [
    {
      key: '1',
      name: 'Q3 销售目标',
      owner: '张三',
      department: '销售部',
      progress: 75,
      status: 'in_progress',
      approvalStatus: 'approved',
      priority: 'high',
      period: '2026-Q3',
      version: 2,
      endDate: '2026-09-30',
      logs: [
        { time: '2026-07-01 09:00', action: '创建目标', operator: '李经理', before: '-', after: '初始版本' },
        { time: '2026-07-02 10:30', action: '提交审批', operator: '李经理' },
        { time: '2026-07-02 14:00', action: '审批通过', operator: '王总' },
        { time: '2026-07-15 11:00', action: '修改目标', operator: '李经理', before: '目标值100万', after: '目标值120万' },
        { time: '2026-07-16 09:30', action: '提交修改审批', operator: '李经理' },
        { time: '2026-07-16 15:00', action: '修改审批通过', operator: '王总' }
      ],
      versions: [
        { version: 1, time: '2026-07-01 09:00', operator: '李经理', content: '初始版本，目标值100万' },
        { version: 2, time: '2026-07-16 15:00', operator: '王总', content: '调整目标值为120万' }
      ]
    },
    {
      key: '2',
      name: '客户满意度提升',
      owner: '李四',
      department: '客服部',
      progress: 60,
      status: 'pending_approval',
      approvalStatus: 'pending',
      priority: 'medium',
      period: '2026-Q3',
      version: 1,
      endDate: '2026-09-30',
      logs: [
        { time: '2026-07-05 10:00', action: '创建目标', operator: '王经理' },
        { time: '2026-07-06 09:00', action: '提交审批', operator: '王经理' }
      ],
      versions: [
        { version: 1, time: '2026-07-05 10:00', operator: '王经理', content: '初始版本' }
      ]
    },
    {
      key: '3',
      name: '新产品研发',
      owner: '王五',
      department: '研发部',
      progress: 90,
      status: 'completed',
      approvalStatus: 'approved',
      priority: 'high',
      period: '2026-Q2',
      version: 1,
      endDate: '2026-06-30',
      logs: [
        { time: '2026-04-01 09:00', action: '创建目标', operator: '赵经理' },
        { time: '2026-04-02 10:00', action: '提交审批', operator: '赵经理' },
        { time: '2026-04-02 15:00', action: '审批通过', operator: '王总' },
        { time: '2026-06-30 18:00', action: '完成目标', operator: '王五' }
      ],
      versions: [
        { version: 1, time: '2026-04-01 09:00', operator: '赵经理', content: '初始版本' }
      ]
    },
    {
      key: '4',
      name: '团队建设',
      owner: '赵六',
      department: '销售部',
      progress: 45,
      status: 'in_progress',
      approvalStatus: 'pending_modify',
      priority: 'low',
      period: '2026-Q3',
      version: 2,
      endDate: '2026-09-30',
      logs: [
        { time: '2026-07-10 09:00', action: '创建目标', operator: '李经理' },
        { time: '2026-07-11 10:00', action: '审批通过', operator: '王总' },
        { time: '2026-07-20 14:00', action: '申请修改', operator: '李经理', before: '权重10%', after: '权重15%' },
      ],
      versions: [
        { version: 1, time: '2026-07-10 09:00', operator: '李经理', content: '初始版本' },
        { version: 2, time: '2026-07-20 14:00', operator: '李经理', content: '调整权重，待审批' }
      ]
    }
  ] : [];

  const columns: ColumnsType<Goal> = [
    {
      title: '目标名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record) => (
        <Space>
          <a onClick={() => { setSelectedGoal(record); setDetailVisible(true); }}>{text}</a>
          {record.version > 1 && <Badge count={`V${record.version}`} style={{ backgroundColor: '#1890ff' }} />}
        </Space>
      )
    },
    {
      title: '负责人',
      dataIndex: 'owner',
      key: 'owner'
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department'
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => (
        <Progress percent={progress} size="small" status={progress === 100 ? 'success' : 'active'} />
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const s = statusMap[status];
        return <Tag color={s.color} icon={s.icon}>{s.text}</Tag>;
      }
    },
    {
      title: '审批状态',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      render: (status: string) => {
        const s = approvalMap[status];
        return <Tag color={s.color}>{s.text}</Tag>;
      }
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const p = priorityMap[priority];
        return <Tag color={p.color}>{p.text}</Tag>;
      }
    },
    {
      title: '周期',
      dataIndex: 'period',
      key: 'period'
    },
    {
      title: (
        <Tooltip title="距离目标结束日期">
          <BellOutlined style={{ color: '#faad14' }} /> 到期提醒
        </Tooltip>
      ),
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date: string, record: Goal) => {
        const end = new Date(date);
        const now = new Date();
        const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7 && diffDays > 0) {
          return <Tag color="orange">{diffDays}天后到期</Tag>;
        } else if (diffDays <= 0) {
          return <Tag color="red">已到期</Tag>;
        }
        return <Text type="secondary">{date}</Text>;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Goal) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedGoal(record); setDetailVisible(true); }}>详情</Button>
          <Button type="link" size="small" icon={<DiffOutlined />} onClick={() => { setSelectedGoal(record); setVersionCompareVisible(true); }}>版本</Button>
          {record.approvalStatus === 'approved' && (isAdmin || isManager) && (
            <Button type="link" size="small" icon={<EditOutlined />}>修改申请</Button>
          )}
          {record.approvalStatus === 'draft' && (isAdmin || isManager) && (
            <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
          )}
          {record.approvalStatus === 'pending' && isAdmin && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => message.success('审批通过')}>批准</Button>
          )}
          {record.approvalStatus === 'pending' && isAdmin && (
            <Button type="link" size="small" danger icon={<CloseOutlined />}>驳回</Button>
          )}
          {record.approvalStatus === 'pending_modify' && isAdmin && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => message.success('修改审批通过')}>批准修改</Button>
          )}
        </Space>
      )
    }
  ];

  const handleAdd = () => {
    form.resetFields();
    setAiSuggestions([]);
    setSelectedDept('');
    setModalVisible(true);
  };

  const handleAiSuggest = async () => {
    setLoadingAi(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setAiSuggestions([
      { content: '该员工上季度KPI完成率125%，建议本季度目标上调15%', type: 'performance', confidence: '高' },
      { content: '同岗位平均目标完成率为85%，当前目标难度适中', type: 'compare', confidence: '中' },
      { content: '建议将大目标拆分为3个里程碑，便于跟踪进度', type: 'structure', confidence: '中' }
    ]);
    setLoadingAi(false);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('表单数据:', values);
      if (isAdmin) {
        message.success('目标创建成功');
      } else {
        message.success('目标已提交审批');
        addNotification({
          id: Date.now().toString(),
          type: 'goal_approval',
          title: '目标审批提醒',
          content: `${user?.realName} 创建了目标「${values.name}」，请审批`,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
      setModalVisible(false);
    } catch (error) {
    }
  };

  const filteredData = activeTab === 'all' ? data : data.filter(item => item.approvalStatus === activeTab);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>目标管理</Title>
        <Space>
          <Button icon={<UploadOutlined />} onClick={() => setBatchModalVisible(true)}>批量导入</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>创建目标</Button>
        </Space>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <Card>
            <Statistic title="目标总数" value={data.length} />
          </Card>
        </div>
        <div style={{ flex: 1 }}>
          <Card>
            <Statistic title="进行中" value={data.filter(d => d.status === 'in_progress').length} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </div>
        <div style={{ flex: 1 }}>
          <Card>
            <Statistic title="已完成" value={data.filter(d => d.status === 'completed').length} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </div>
        <div style={{ flex: 1 }}>
          <Card>
            <Statistic
              title="待审批"
              value={data.filter(d => d.approvalStatus === 'pending' || d.approvalStatus === 'pending_modify').length}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </div>
      </div>

      <Alert
        message={
          <Space>
            <BellOutlined style={{ color: '#faad14' }} />
            <span><strong>到期提醒：</strong>共有 {data.filter(d => {
              const end = new Date(d.endDate);
              const now = new Date();
              const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              return diffDays <= 7 && diffDays > 0;
            }).length} 个目标将在7天内到期</span>
          </Space>
        }
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'all', label: '全部' },
            { key: 'draft', label: '草稿' },
            { key: 'pending', label: '待审批' },
            { key: 'pending_modify', label: '待审批(修改)' },
            { key: 'approved', label: '已生效' },
            { key: 'rejected', label: '已驳回' }
          ]}
        />
        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 10 }}
          size="small"
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title="创建目标"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={750}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>取消</Button>,
          <Button key="save" onClick={() => message.success('已保存为草稿')}>保存草稿</Button>,
          <Button key="submit" type="primary" onClick={handleSubmit}>
            {isAdmin ? '确定' : '提交审批'}
          </Button>
        ]}
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <Form.Item name="name" label="目标名称" rules={[{ required: true, message: '请输入目标名称' }]}>
              <Input placeholder="请输入目标名称" />
            </Form.Item>
          </div>
          <div style={{ flex: 1 }}>
            <Form.Item name="department" label="部门" rules={[{ required: true, message: '请选择部门' }]}>
              <Select placeholder="请选择部门" onChange={handleDeptChange}>
                {deptOptions.map(opt => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <Form.Item name="owner" label="负责人" rules={[{ required: true, message: '请选择负责人' }]}>
              <Select placeholder="请选择负责人">
                {filteredEmployees.map(emp => (
                  <Option key={emp.key} value={emp.key}>{emp.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <div style={{ flex: 1 }}>
            <Form.Item name="priority" label="优先级" rules={[{ required: true, message: '请选择优先级' }]}>
              <Select placeholder="请选择优先级">
                <Option value="high">高</Option>
                <Option value="medium">中</Option>
                <Option value="low">低</Option>
              </Select>
            </Form.Item>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <Form.Item name="period" label="目标周期" rules={[{ required: true, message: '请选择目标周期' }]}>
              <RangePicker style={{ width: 400 }} />
            </Form.Item>
          </div>
        </div>
          <Form.Item name="description" label="目标描述">
            <Input.TextArea rows={3} placeholder="请输入目标描述" />
          </Form.Item>

          <Divider orientation="left">
            <Text type="secondary">AI建议</Text>
          </Divider>

          <div style={{ marginBottom: 16, padding: 16, background: '#fffbe6', borderRadius: 8, border: '1px solid #ffe58f' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ApiOutlined style={{ color: '#faad14' }} />
                <Text strong>AI智能建议</Text>
                <Tag color="blue" style={{ marginLeft: 8 }}>AI生成</Tag>
              </div>
              <Button type="link" icon={<ApiOutlined />} onClick={handleAiSuggest} loading={loadingAi}>获取建议</Button>
            </div>
            {loadingAi ? (
              <Spin tip="AI分析中..." />
            ) : aiSuggestions.length > 0 ? (
              <div>
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} style={{ marginBottom: 8, padding: 10, background: '#fff', borderRadius: 4, border: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <MessageOutlined style={{ color: '#1890ff' }} />
                      <span>{suggestion.content}</span>
                    </div>
                    <Space>
                      <Tag color={suggestion.confidence === '高' ? 'green' : suggestion.confidence === '中' ? 'blue' : 'orange'}>
                        置信度：{suggestion.confidence}
                      </Tag>
                      <Button type="link" size="small">采纳</Button>
                      <Button type="link" size="small">忽略</Button>
                    </Space>
                  </div>
                </div>
              ))}
              </div>
            ) : (
              <Text type="secondary">点击"获取建议"，AI将根据员工历史绩效、同岗位水平给出目标设定建议</Text>
            )}
          </div>
        </Form>
      </Modal>

      <Modal
        title="批量导入目标"
        open={batchModalVisible}
        onCancel={() => setBatchModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setBatchModalVisible(false)}>取消</Button>,
          <Button key="confirm" type="primary" onClick={() => { message.success('导入成功'); setBatchModalVisible(false); }}>确认导入</Button>
        ]}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <Alert
            message="导入说明"
            description={
              <div>
                <p>1. 请使用Excel模板填写目标数据</p>
                <p>2. 支持格式：.xlsx, .xls</p>
                <p>3. 错误行将标红提示，可修改后重新导入</p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <div style={{ marginBottom: 16 }}>
            <Button type="link" icon={<FileTextOutlined />}>下载导入模板</Button>
          </div>
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>选择文件上传</Button>
          </Upload>
        </div>
        <div style={{ padding: 16, background: '#f9f9f9', borderRadius: 4 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <ExclamationCircleOutlined style={{ marginRight: 4 }} />
            提示：导入后系统会自动校验权重合计，如超过或不足100%将标红提示
          </Text>
        </div>
      </Modal>

      <Modal
        title={selectedGoal?.name || '目标详情'}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={750}
      >
        {selectedGoal && (
          <Tabs
            items={[
              {
                key: 'info',
                label: '基本信息',
                children: (
                  <div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                          <Text type="secondary">负责人</Text>
                          <Text>{selectedGoal.owner}</Text>
                        </div>
                        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                          <Text type="secondary">部门</Text>
                          <Text>{selectedGoal.department}</Text>
                        </div>
                        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                          <Text type="secondary">优先级</Text>
                          <Tag color={priorityMap[selectedGoal.priority].color}>{priorityMap[selectedGoal.priority].text}</Tag>
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                          <Text type="secondary">周期</Text>
                          <Text>{selectedGoal.period}</Text>
                        </div>
                        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                          <Text type="secondary">审批状态</Text>
                          <Tag color={approvalMap[selectedGoal.approvalStatus].color}>{approvalMap[selectedGoal.approvalStatus].text}</Tag>
                        </div>
                      </div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ marginBottom: 8 }}>
                        <Text type="secondary">进度</Text>
                      </div>
                      <Progress percent={selectedGoal.progress} showInfo />
                    </div>
                    <div>
                      <div style={{ marginBottom: 8 }}>
                        <Text type="secondary">目标描述</Text>
                      </div>
                      <div style={{ padding: 12, background: '#f9f9f9', borderRadius: 4 }}>
                        {selectedGoal.name} - 详细描述内容
                      </div>
                    </div>
                  </div>
                )
              },
              {
                key: 'logs',
                label: <span><HistoryOutlined /> 变更记录</span>,
                children: (
                  <Timeline>
                    {selectedGoal.logs.map((log, index) => (
                      <Timeline.Item key={index}>
                        <div>
                          <Text strong>{log.action}</Text>
                          <Text type="secondary" style={{ marginLeft: 8 }}>{log.time}</Text>
                          <Text type="secondary" style={{ marginLeft: 8 }}>操作人: {log.operator}</Text>
                          {log.before && log.after && (
                            <div style={{ marginTop: 4, padding: 8, background: '#f9f9f9', borderRadius: 4, fontSize: 12 }}>
                              <div><Text type="secondary">修改前：</Text><del style={{ color: '#999' }}>{log.before}</del></div>
                              <div><Text type="secondary">修改后：</Text><span style={{ color: '#52c41a' }}>{log.after}</span></div>
                            </div>
                          )}
                        </div>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                )
              },
              {
                key: 'versions',
                label: <span><DiffOutlined /> 版本对比</span>,
                children: (
                  <div>
                    {selectedGoal.versions && selectedGoal.versions.length > 0 ? (
                      <List
                        dataSource={selectedGoal.versions}
                        renderItem={(version) => (
                          <List.Item
                            actions={[
                              <Button type="link" size="small">查看详情</Button>
                            ]}
                          >
                            <List.Item.Meta
                              title={`版本 V{version.version}`}
                              description={
                                <div>
                                  <div><Text type="secondary">时间：{version.time}</Text></div>
                                  <div><Text type="secondary">操作人：{version.operator}</Text></div>
                                  <div style={{ marginTop: 4 }}>{version.content}</div>
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Empty description="暂无版本记录" />
                    )}
                  </div>
                )
              }
            ]}
          />
        )}
      </Modal>

      <Modal
        title="版本对比"
        open={versionCompareVisible}
        onCancel={() => setVersionCompareVisible(false)}
        footer={[
          <Button key="close" onClick={() => setVersionCompareVisible(false)}>关闭</Button>
        ]}
        width={700}
      >
        {selectedGoal && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Select defaultValue="v1" style={{ width: 120 }}>
                  <Option value="v1">版本 V1</Option>
                  <Option value="v2">版本 V2</Option>
                </Select>
                <Text type="secondary">对比</Text>
                <Select defaultValue="v2" style={{ width: 120 }}>
                  <Option value="v1">版本 V1</Option>
                  <Option value="v2">版本 V2</Option>
                </Select>
              </Space>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <Card title="版本 V1" size="small" style={{ background: '#fff1f0' }}>
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">目标名称：</Text>
                    <del style={{ color: '#999' }}>Q3 销售目标（100万）</del>
                  </div>
                  <div>
                    <Text type="secondary">操作人：李经理</Text>
                  </div>
                  <div>
                    <Text type="secondary">时间：2026-07-01 09:00</Text>
                  </div>
                </Card>
              </div>
              <div style={{ flex: 1 }}>
                <Card title="版本 V2" size="small" style={{ background: '#f6ffed' }}>
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">目标名称：</Text>
                    <span style={{ color: '#52c41a' }}>Q3 销售目标（120万）</span>
                  </div>
                  <div>
                    <Text type="secondary">操作人：王总（审批）</Text>
                  </div>
                  <div>
                    <Text type="secondary">时间：2026-07-16 15:00</Text>
                  </div>
                </Card>
              </div>
            </div>
            <div style={{ marginTop: 16, padding: 12, background: '#f9f9f9', borderRadius: 4 }}>
              <Text strong>变更说明：</Text>
              <ul style={{ marginBottom: 0, marginTop: 8 }}>
                <li>目标值从100万调整为120万（增加20万）</li>
                <li>权重从25%调整为30%（增加5%）</li>
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Goals;
