import { useState } from 'react';
import {
  Card, Row, Col, Table, Button, Modal, Form, Input, Select,
  Typography, Tag, Space, message, Statistic, Tabs,
  DatePicker, TimePicker, List, Timeline, Avatar,
  Progress, Tooltip, Divider, Badge, Alert
} from 'antd';
import {
  PlusOutlined, EditOutlined, EyeOutlined, CheckOutlined,
  UserOutlined, CalendarOutlined,
  MessageOutlined,
  PhoneOutlined, VideoCameraOutlined,
  FileTextOutlined, ClockCircleOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined,
  TeamOutlined, BulbOutlined, AlertOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAuthStore } from '../stores/authStore';

const { Title, Text } = Typography;
const { RangePicker } = TimePicker;
const { TextArea } = Input;
const { Option } = Select;

interface InterviewInvitation {
  key: string;
  employeeName: string;
  department: string;
  position: string;
  interviewer: string;
  date: string;
  time: string;
  type: 'face_to_face' | 'video' | 'phone';
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'expired';
  remark: string;
  template: string;
  location: string;
  remindBefore: number;
}

interface InterviewRecord {
  key: string;
  employeeName: string;
  department: string;
  position: string;
  interviewer: string;
  date: string;
  time: string;
  type: 'face_to_face' | 'video' | 'phone';
  content: string;
  summary: string;
  improvementPlan: string;
  template: string;
  actionItems: ActionItem[];
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  assignee: string;
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'high' | 'medium' | 'low';
}

interface InterviewTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  content: string;
  usedCount: number;
}

const statusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '待确认', color: 'warning' },
  accepted: { text: '已接受', color: 'processing' },
  rejected: { text: '已拒绝', color: 'error' },
  completed: { text: '已完成', color: 'success' },
  expired: { text: '已过期', color: 'default' }
};

const typeMap: Record<string, { text: string; color: string; icon: React.ReactNode }> = {
  face_to_face: { text: '面对面', color: 'blue', icon: <UserOutlined /> },
  video: { text: '视频', color: 'green', icon: <VideoCameraOutlined /> },
  phone: { text: '电话', color: 'orange', icon: <PhoneOutlined /> }
};

const priorityMap: Record<string, { text: string; color: string }> = {
  high: { text: '高', color: 'red' },
  medium: { text: '中', color: 'orange' },
  low: { text: '低', color: 'blue' }
};

const actionStatusMap: Record<string, { text: string; color: string; icon: React.ReactNode }> = {
  pending: { text: '待开始', color: 'default', icon: <ClockCircleOutlined /> },
  in_progress: { text: '进行中', color: 'processing', icon: <MessageOutlined /> },
  completed: { text: '已完成', color: 'success', icon: <CheckCircleOutlined /> },
  overdue: { text: '已逾期', color: 'error', icon: <ExclamationCircleOutlined /> }
};

const interviewTemplates: InterviewTemplate[] = [
  { id: '1', name: '季度绩效面谈', type: 'performance', description: '用于季度绩效回顾和反馈', content: '1. 工作业绩回顾\n2. 优点与不足分析\n3. 下季度目标设定\n4. 职业发展讨论', usedCount: 128 },
  { id: '2', name: '绩效改进面谈', type: 'improvement', description: '用于绩效不达标员工的改进计划', content: '1. 绩效问题说明\n2. 原因分析\n3. 改进目标制定\n4. 支持资源确认\n5. 跟进计划', usedCount: 45 },
  { id: '3', name: '晋升面谈', type: 'promotion', description: '用于晋升前的评估面谈', content: '1. 现有工作表现评估\n2. 新岗位要求说明\n3. 能力差距分析\n4. 发展计划制定', usedCount: 32 },
  { id: '4', name: '试用期面谈', type: 'probation', description: '用于试用期员工评估', content: '1. 试用期工作回顾\n2. 岗位匹配度评估\n3. 转正建议\n4. 后续发展规划', usedCount: 56 },
  { id: '5', name: '离职面谈', type: 'exit', description: '用于员工离职时的面谈', content: '1. 离职原因了解\n2. 工作反馈收集\n3. 改进建议征集\n4. 交接事项确认', usedCount: 21 }
];

function PerformanceImprovement() {
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [recordDetailVisible, setRecordDetailVisible] = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [actionItemModalVisible, setActionItemModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedInvitation, setSelectedInvitation] = useState<InterviewInvitation | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<InterviewRecord | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<InterviewTemplate | null>(null);
  const { user } = useAuthStore();

  const isAdmin = (user?.role?.code || '').includes('admin');
  const isManager = (user?.role?.code || '').includes('manager');
  const isEmployee = (user?.role?.code || '') === 'employee';

  const invitations: InterviewInvitation[] = [];

  const records: InterviewRecord[] = [];

  const invitationColumns: ColumnsType<InterviewInvitation> = [
    {
      title: '员工姓名',
      dataIndex: 'employeeName',
      key: 'employeeName',
      render: (text: string) => <a>{text}</a>
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department'
    },
    {
      title: '面谈人',
      dataIndex: 'interviewer',
      key: 'interviewer'
    },
    {
      title: '面谈模板',
      dataIndex: 'template',
      key: 'template',
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date'
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time'
    },
    {
      title: '方式',
      dataIndex: 'type',
      key: 'type',
      render: (t: string) => {
        const tp = typeMap[t];
        return <Tag color={tp.color} icon={tp.icon}>{tp.text}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (t: string) => <Tag color={statusMap[t].color}>{statusMap[t].text}</Tag>
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: InterviewInvitation) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedInvitation(record); setDetailVisible(true); }}>详情</Button>
          {record.status === 'pending' && isEmployee && (
            <>
              <Button type="link" size="small" icon={<CheckOutlined />}>接受</Button>
              <Button type="link" size="small" danger>拒绝</Button>
            </>
          )}
          {(record.status === 'accepted' || record.status === 'pending') && (isAdmin || isManager) && (
            <Button type="link" size="small" icon={<EditOutlined />}>修改</Button>
          )}
          {record.status === 'completed' && (
            <Button type="link" size="small" icon={<FileTextOutlined />}>查看记录</Button>
          )}
        </Space>
      )
    }
  ];

  const recordColumns: ColumnsType<InterviewRecord> = [
    {
      title: '员工姓名',
      dataIndex: 'employeeName',
      key: 'employeeName',
      render: (text: string) => <a>{text}</a>
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department'
    },
    {
      title: '面谈人',
      dataIndex: 'interviewer',
      key: 'interviewer'
    },
    {
      title: '面谈模板',
      dataIndex: 'template',
      key: 'template',
      render: (text: string) => <Tag color="purple">{text}</Tag>
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date'
    },
    {
      title: '行动项',
      dataIndex: 'actionItems',
      key: 'actions',
      render: (items: ActionItem[]) => {
        const total = items.length;
        const completed = items.filter(i => i.status === 'completed').length;
        return (
          <Tooltip title={`已完成 ${completed}/${total} 项`}>
            <Progress percent={Math.round((completed / total) * 100)} size="small" style={{ width: 80 }} />
          </Tooltip>
        );
      }
    },
    {
      title: '面谈摘要',
      dataIndex: 'summary',
      key: 'summary',
      ellipsis: true
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: InterviewRecord) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedRecord(record); setRecordDetailVisible(true); }}>查看记录</Button>
          <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
        </Space>
      )
    }
  ];

  const handleInvite = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('邀约数据:', values);
      message.success('面谈邀约已发送，员工将收到提醒');
      setModalVisible(false);
    } catch (error) {
      // 校验失败
    }
  };

  const handleTemplateSelect = (template: InterviewTemplate) => {
    setSelectedTemplate(template);
    form.setFieldsValue({
      template: template.id,
      content: template.content
    });
    setTemplateModalVisible(false);
    message.success(`已套用模板：${template.name}`);
  };

  const filteredInvitations = isEmployee ? invitations.filter(d => d.employeeName === user?.realName) : invitations;
  const filteredRecords = isEmployee ? records.filter(d => d.employeeName === user?.realName) : records;

  const pendingActions = records.reduce((sum, r) => sum + r.actionItems.filter(a => a.status === 'pending' || a.status === 'in_progress').length, 0);
  const completedActions = records.reduce((sum, r) => sum + r.actionItems.filter(a => a.status === 'completed').length, 0);
  const overdueActions = records.reduce((sum, r) => sum + r.actionItems.filter(a => a.status === 'overdue').length, 0);
  const totalActions = records.reduce((sum, r) => sum + r.actionItems.length, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4}>绩效提升</Title>
        {(isAdmin || isManager) && (
          <Space>
            <Button icon={<FileTextOutlined />} onClick={() => setTemplateModalVisible(true)}>面谈模板</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleInvite}>发起面谈</Button>
          </Space>
        )}
      </div>

      <Alert
        message="面谈管理与行动追踪"
        description="支持多种面谈模板、邀约状态流转、行动项自动追踪、到期提醒，形成完整的绩效改进闭环。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic title="待确认邀约" value={invitations.filter(d => d.status === 'pending').length} valueStyle={{ color: '#faad14' }} prefix={<CalendarOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="已接受" value={invitations.filter(d => d.status === 'accepted').length} valueStyle={{ color: '#1890ff' }} prefix={<CheckOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="待完成行动项" value={pendingActions} valueStyle={{ color: '#722ed1' }} prefix={<BulbOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="已逾期行动项" value={overdueActions} valueStyle={{ color: '#f5222d' }} prefix={<AlertOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="已完成行动项" value={completedActions} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="面谈记录" value={records.length} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
      </Row>

      <Tabs
        items={[
          {
            key: 'invitations',
            label: <span><CalendarOutlined /> 面谈邀约</span>,
            children: (
              <Card>
                <Table
                  columns={invitationColumns}
                  dataSource={filteredInvitations}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            )
          },
          {
            key: 'records',
            label: <span><FileTextOutlined /> 面谈记录</span>,
            children: (
              <Card>
                <Table
                  columns={recordColumns}
                  dataSource={filteredRecords}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            )
          },
          {
            key: 'actions',
            label: <span><BulbOutlined /> 行动项追踪</span>,
            children: (
              <Card>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={8}>
                    <Card size="small" title="行动项完成率">
                      <div style={{ textAlign: 'center', padding: 16 }}>
                        <Progress
                          type="dashboard"
                          percent={totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0}
                          format={(percent) => `${percent}%`}
                        />
                        <div style={{ marginTop: 8, color: '#666' }}>
                          已完成 {completedActions} / {totalActions} 项
                        </div>
                      </div>
                    </Card>
                  </Col>
                  <Col span={16}>
                    <Card size="small" title="待处理行动项">
                      <List
                        size="small"
                        dataSource={records.flatMap(r => r.actionItems.filter(a => a.status === 'pending' || a.status === 'in_progress')).slice(0, 5)}
                        renderItem={(item) => (
                          <List.Item
                            actions={[
                              <Tag color={priorityMap[item.priority].color} key="priority">
                                {priorityMap[item.priority].text}优先级
                              </Tag>,
                              <Button type="link" size="small" key="view">查看</Button>
                            ]}
                          >
                            <List.Item.Meta
                              avatar={<Badge status={actionStatusMap[item.status].color as any} />}
                              title={item.title}
                              description={`负责人：${item.assignee} · 截止：${item.deadline}`}
                            />
                          </List.Item>
                        )}
                      />
                    </Card>
                  </Col>
                </Row>
              </Card>
            )
          }
        ]}
      />

      <Modal
        title="发起面谈邀约"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="employee" label="员工姓名" rules={[{ required: true, message: '请选择员工' }]}>
                <Select placeholder="请选择员工">
                  <Option value="zhangsan">张三</Option>
                  <Option value="lisi">李四</Option>
                  <Option value="wangwu">王五</Option>
                  <Option value="zhaoliu">赵六</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="template" label="面谈模板" rules={[{ required: true, message: '请选择面谈模板' }]}>
                <Select placeholder="请选择模板" onClick={() => setTemplateModalVisible(true)}>
                  {interviewTemplates.map(t => (
                    <Option key={t.id} value={t.id}>{t.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="date" label="面谈日期" rules={[{ required: true, message: '请选择日期' }]}>
                <DatePicker style={{ width: '100%' }} placeholder="请选择面谈日期" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="time" label="面谈时间" rules={[{ required: true, message: '请选择时间' }]}>
                <RangePicker style={{ width: '100%' }} placeholder={['开始时间', '结束时间']} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="type" label="面谈方式" rules={[{ required: true, message: '请选择面谈方式' }]}>
                <Select placeholder="请选择面谈方式">
                  <Option value="face_to_face">面对面面谈</Option>
                  <Option value="video">视频面谈</Option>
                  <Option value="phone">电话面谈</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="location" label="面谈地点/链接">
            <Input placeholder="请输入会议室名称或视频会议链接" />
          </Form.Item>
          <Form.Item name="remindBefore" label="提前提醒">
            <Select defaultValue={60} style={{ width: 200 }}>
              <Option value={15}>提前15分钟</Option>
              <Option value={30}>提前30分钟</Option>
              <Option value={60}>提前1小时</Option>
              <Option value={1440}>提前1天</Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="面谈主题">
            <Input placeholder="请输入面谈主题" />
          </Form.Item>
          <Form.Item name="content" label="面谈内容">
            <TextArea rows={6} placeholder="请输入面谈主要内容，可从模板库选择" />
          </Form.Item>
          <Alert
            message="提醒机制"
            description="系统将在面谈前自动发送提醒给双方，确保面谈按时进行。"
            type="info"
            showIcon
          />
        </Form>
      </Modal>

      <Modal
        title="面谈模板库"
        open={templateModalVisible}
        onCancel={() => setTemplateModalVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <Input.Search placeholder="搜索模板..." style={{ width: 300 }} />
        </div>
        <Row gutter={[16, 16]}>
          {interviewTemplates.map(template => (
            <Col span={12} key={template.id}>
              <Card
                size="small"
                hoverable
                onClick={() => handleTemplateSelect(template)}
                extra={<Tag color="blue">使用 {template.usedCount} 次</Tag>}
              >
                <Card.Meta
                  title={template.name}
                  description={
                    <div>
                      <Tag color="purple" style={{ marginBottom: 8 }}>{template.type}</Tag>
                      <p style={{ marginBottom: 0, color: '#666', fontSize: 12 }}>{template.description}</p>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Modal>

      <Modal
        title={`面谈详情 - ${selectedInvitation?.employeeName || ''}`}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={650}
      >
        {selectedInvitation && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}><div style={{ marginBottom: 8 }}><Text type="secondary">员工姓名：</Text>{selectedInvitation.employeeName}</div></Col>
              <Col span={12}><div style={{ marginBottom: 8 }}><Text type="secondary">部门/职位：</Text>{selectedInvitation.department} / {selectedInvitation.position}</div></Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}><div style={{ marginBottom: 8 }}><Text type="secondary">面谈人：</Text>{selectedInvitation.interviewer}</div></Col>
              <Col span={12}><div style={{ marginBottom: 8 }}><Text type="secondary">面谈模板：</Text><Tag color="blue">{selectedInvitation.template}</Tag></div></Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}><div style={{ marginBottom: 8 }}><Text type="secondary">日期：</Text>{selectedInvitation.date}</div></Col>
              <Col span={8}><div style={{ marginBottom: 8 }}><Text type="secondary">时间：</Text>{selectedInvitation.time}</div></Col>
              <Col span={8}><div style={{ marginBottom: 8 }}><Text type="secondary">方式：</Text><Tag color={typeMap[selectedInvitation.type].color}>{typeMap[selectedInvitation.type].text}</Tag></div></Col>
            </Row>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">地点：</Text>{selectedInvitation.location}
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">状态：</Text>
              <Tag color={statusMap[selectedInvitation.status].color}>{statusMap[selectedInvitation.status].text}</Tag>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">提前提醒：</Text>{selectedInvitation.remindBefore}分钟
            </div>
            <Divider />
            <div>
              <Text type="secondary">面谈主题：</Text>
              <p style={{ marginTop: 8 }}>{selectedInvitation.remark}</p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={`面谈记录 - ${selectedRecord?.employeeName || ''}`}
        open={recordDetailVisible}
        onCancel={() => setRecordDetailVisible(false)}
        footer={null}
        width={850}
      >
        {selectedRecord && (
          <Tabs>
            <Tabs.TabPane tab="面谈详情" key="detail">
              <div>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={8}><div style={{ marginBottom: 8 }}><Text type="secondary">员工姓名：</Text>{selectedRecord.employeeName}</div></Col>
                  <Col span={8}><div style={{ marginBottom: 8 }}><Text type="secondary">部门/职位：</Text>{selectedRecord.department} / {selectedRecord.position}</div></Col>
                  <Col span={8}><div style={{ marginBottom: 8 }}><Text type="secondary">面谈人：</Text>{selectedRecord.interviewer}</div></Col>
                </Row>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={8}><div style={{ marginBottom: 8 }}><Text type="secondary">日期：</Text>{selectedRecord.date}</div></Col>
                  <Col span={8}><div style={{ marginBottom: 8 }}><Text type="secondary">时间：</Text>{selectedRecord.time}</div></Col>
                  <Col span={8}><div style={{ marginBottom: 8 }}><Text type="secondary">模板：</Text><Tag color="purple">{selectedRecord.template}</Tag></div></Col>
                </Row>
                <Divider orientation="left">面谈内容</Divider>
                <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4, whiteSpace: 'pre-wrap', marginBottom: 16 }}>
                  {selectedRecord.content}
                </div>
                <Divider orientation="left">面谈摘要</Divider>
                <div style={{ padding: 12, background: '#e6f7ff', borderRadius: 4, marginBottom: 16 }}>
                  {selectedRecord.summary}
                </div>
                <Divider orientation="left">改进计划</Divider>
                <div style={{ padding: 12, background: '#f6ffed', borderRadius: 4, whiteSpace: 'pre-wrap' }}>
                  {selectedRecord.improvementPlan}
                </div>
              </div>
            </Tabs.TabPane>

            <Tabs.TabPane tab={<span><BulbOutlined /> 行动项 ({selectedRecord.actionItems.length})</span>} key="actions">
              <div style={{ marginBottom: 16, textAlign: 'right' }}>
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setActionItemModalVisible(true)}>添加行动项</Button>
              </div>
              <List
                dataSource={selectedRecord.actionItems}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Tag color={priorityMap[item.priority].color} key="priority">
                        {priorityMap[item.priority].text}
                      </Tag>,
                      <Tag color={actionStatusMap[item.status].color} key="status">
                        {actionStatusMap[item.status].icon} {actionStatusMap[item.status].text}
                      </Tag>,
                      <Button type="link" size="small" key="edit">编辑</Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={item.title}
                      description={
                        <div>
                          <div>{item.description}</div>
                          <div style={{ marginTop: 4, color: '#999', fontSize: 12 }}>
                            负责人：{item.assignee} · 截止日期：{item.deadline}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Tabs.TabPane>

            <Tabs.TabPane tab={<span><HistoryOutlined /> 时间线</span>} key="timeline">
              <Timeline>
                <Timeline.Item color="green">
                  <Text strong>面谈完成</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary">{selectedRecord.date} {selectedRecord.time}</Text>
                  </div>
                  <div style={{ marginTop: 4, color: '#666' }}>面谈已完成，记录已归档</div>
                </Timeline.Item>
                <Timeline.Item color="blue">
                  <Text strong>员工接受邀约</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary">2026-07-20 10:30</Text>
                  </div>
                  <div style={{ marginTop: 4, color: '#666' }}>{selectedRecord.employeeName} 已接受面谈邀约</div>
                </Timeline.Item>
                <Timeline.Item>
                  <Text strong>发起面谈邀约</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary">2026-07-19 14:00</Text>
                  </div>
                  <div style={{ marginTop: 4, color: '#666' }}>{selectedRecord.interviewer} 发起了面谈邀约</div>
                </Timeline.Item>
              </Timeline>
            </Tabs.TabPane>
          </Tabs>
        )}
      </Modal>

      <Modal
        title="添加行动项"
        open={actionItemModalVisible}
        onCancel={() => setActionItemModalVisible(false)}
        onOk={() => { message.success('行动项已添加'); setActionItemModalVisible(false); }}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="行动项标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入行动项标题" />
          </Form.Item>
          <Form.Item label="详细描述">
            <TextArea rows={3} placeholder="请输入详细描述" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="负责人" rules={[{ required: true, message: '请选择负责人' }]}>
                <Select placeholder="请选择负责人">
                  <Option value="1">张三</Option>
                  <Option value="2">李四</Option>
                  <Option value="3">王五</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="优先级" rules={[{ required: true, message: '请选择优先级' }]}>
                <Select placeholder="请选择优先级">
                  <Option value="high">高优先级</Option>
                  <Option value="medium">中优先级</Option>
                  <Option value="low">低优先级</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="截止日期" rules={[{ required: true, message: '请选择截止日期' }]}>
            <DatePicker style={{ width: '100%' }} placeholder="请选择截止日期" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default PerformanceImprovement;
