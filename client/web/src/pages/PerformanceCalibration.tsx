import { useState } from 'react';
import {
  Card, Row, Col, Table, Button, Modal, Form, Input, Select, InputNumber,
  Typography, Tag, Space, message, Statistic, Tabs, Timeline, Divider,
  Alert, Tooltip, Progress, Badge, List, Avatar, Radio
} from 'antd';
import {
  EditOutlined, EyeOutlined, CheckOutlined,
  SendOutlined, HistoryOutlined, MessageOutlined,
  ClockCircleOutlined, ArrowRightOutlined,
  UserOutlined, WarningOutlined, ExclamationCircleOutlined,
  UpOutlined, RollbackOutlined, FileTextOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAuthStore } from '../stores/authStore';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface FeedbackRecord {
  key: string;
  employeeName: string;
  department: string;
  position: string;
  assessmentName: string;
  score: number;
  feedbackContent: string;
  status: 'pending' | 'processing' | 'escalated' | 'resolved' | 'rejected';
  createTime: string;
  processTime: string;
  processResult: string;
  processPerson: string;
  currentLevel: number;
  deadline: string;
  isOverdue: boolean;
  escalatedCount: number;
}

interface FeedbackLog {
  time: string;
  action: string;
  operator: string;
  detail: string;
  level: number;
}

const statusMap: Record<string, { text: string; color: string; icon: React.ReactNode }> = {
  pending: { text: '待处理', color: 'warning', icon: <ClockCircleOutlined /> },
  processing: { text: '处理中', color: 'processing', icon: <ArrowRightOutlined /> },
  escalated: { text: '已升级', color: 'error', icon: <UpOutlined /> },
  resolved: { text: '已解决', color: 'success', icon: <CheckOutlined /> },
  rejected: { text: '已驳回', color: 'default', icon: <RollbackOutlined /> }
};

const levelMap: Record<number, { text: string; color: string }> = {
  1: { text: '直属上级', color: 'blue' },
  2: { text: '二级上级', color: 'purple' },
  3: { text: 'HR部门', color: 'orange' },
  4: { text: '总管理员', color: 'red' }
};

function PerformanceCalibration() {
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [escalateVisible, setEscalateVisible] = useState(false);
  const [processVisible, setProcessVisible] = useState(false);
  const [form] = Form.useForm();
  const [processForm] = Form.useForm();
  const [escalateForm] = Form.useForm();
  const [selectedRecord, setSelectedRecord] = useState<FeedbackRecord | null>(null);
  const [currentTab, setCurrentTab] = useState('all');
  const { user } = useAuthStore();

  const isAdmin = (user?.role?.code || '').includes('admin');
  const isManager = (user?.role?.code || '').includes('manager');
  const isEmployee = (user?.role?.code || '') === 'employee';

  const data: FeedbackRecord[] = [];

  const logs: FeedbackLog[] = [];

  const columns: ColumnsType<FeedbackRecord> = [
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
      title: '职位',
      dataIndex: 'position',
      key: 'position'
    },
    {
      title: '考核名称',
      dataIndex: 'assessmentName',
      key: 'assessmentName'
    },
    {
      title: '当前得分',
      dataIndex: 'score',
      key: 'score',
      render: (t: number) => <span style={{ fontWeight: 'bold' }}>{t}分</span>
    },
    {
      title: '当前级别',
      dataIndex: 'currentLevel',
      key: 'currentLevel',
      render: (level: number) => <Tag color={levelMap[level]?.color}>{levelMap[level]?.text}</Tag>
    },
    {
      title: '处理时限',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (date: string, record: FeedbackRecord) => (
        <Space>
          <span>{date}</span>
          {record.isOverdue && <Badge status="error" text="已超期" />}
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (t: string) => {
        const s = statusMap[t];
        return <Tag color={s.color} icon={s.icon}>{s.text}</Tag>;
      }
    },
    {
      title: '提交时间',
      dataIndex: 'createTime',
      key: 'createTime'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: FeedbackRecord) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedRecord(record); setDetailVisible(true); }}>详情</Button>
          {record.status === 'pending' && (isAdmin || isManager) && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setSelectedRecord(record); setProcessVisible(true); }}>处理</Button>
          )}
          {record.status === 'processing' && isEmployee && record.employeeName === user?.realName && (
            <Button type="link" size="small" icon={<UpOutlined />} onClick={() => { setSelectedRecord(record); setEscalateVisible(true); }}>申请升级</Button>
          )}
          {(record.status === 'resolved' || record.status === 'rejected') && isEmployee && record.employeeName === user?.realName && (
            <Button type="link" size="small" icon={<MessageOutlined />}>查看结果</Button>
          )}
        </Space>
      )
    }
  ];

  const handleSubmitFeedback = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('反馈数据:', values);
      message.success('反馈提交成功，请等待处理');
      setModalVisible(false);
    } catch (error) {
      // 校验失败
    }
  };

  const handleProcess = async (action: string) => {
    try {
      const values = await processForm.validateFields();
      console.log('处理结果:', values, action);
      message.success(action === 'approve' ? '已同意校准申请' : '已驳回申请');
      setProcessVisible(false);
    } catch (error) {
      // 校验失败
    }
  };

  const handleEscalate = async () => {
    try {
      const values = await escalateForm.validateFields();
      console.log('升级申请:', values);
      message.success('升级申请已提交，将由上级管理者处理');
      setEscalateVisible(false);
    } catch (error) {
      // 校验失败
    }
  };

  const filteredData = () => {
    let result = data;
    if (isEmployee) {
      result = result.filter(d => d.employeeName === user?.realName);
    }
    if (currentTab !== 'all') {
      result = result.filter(d => d.status === currentTab);
    }
    return result;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4}>绩效校准</Title>
        {isEmployee && (
          <Button type="primary" icon={<SendOutlined />} onClick={handleSubmitFeedback}>提交反馈</Button>
        )}
      </div>

      <Alert
        message="校准反馈闭环"
        description="员工提交异议 → 管理者收到通知 → 管理者处理（同意/驳回/升级） → 结果通知员工 → 历史记录存档。处理时限为3个工作日，超期自动升级。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={5}>
          <Card>
            <Statistic title="待处理" value={data.filter(d => d.status === 'pending').length} valueStyle={{ color: '#faad14' }} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic title="处理中" value={data.filter(d => d.status === 'processing').length} valueStyle={{ color: '#1890ff' }} prefix={<ArrowRightOutlined />} />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic title="已升级" value={data.filter(d => d.status === 'escalated').length} valueStyle={{ color: '#f5222d' }} prefix={<UpOutlined />} />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic title="已超期" value={data.filter(d => d.isOverdue).length} valueStyle={{ color: '#fa541c' }} prefix={<ExclamationCircleOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="已解决" value={data.filter(d => d.status === 'resolved').length} valueStyle={{ color: '#52c41a' }} prefix={<CheckOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card
        tabList={[
          { key: 'all', tab: '全部' },
          { key: 'pending', tab: '待处理' },
          { key: 'processing', tab: '处理中' },
          { key: 'escalated', tab: '已升级' },
          { key: 'resolved', tab: '已解决' },
          { key: 'rejected', tab: '已驳回' }
        ]}
        activeTabKey={currentTab}
        onTabChange={setCurrentTab}
      >
        <Table
          columns={columns}
          dataSource={filteredData()}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="提交校准反馈"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="assessment" label="考核名称" rules={[{ required: true, message: '请选择考核' }]}>
            <Select placeholder="请选择考核">
              <Option value="q3">Q3绩效考核</Option>
              <Option value="q2">Q2绩效考核</Option>
            </Select>
          </Form.Item>
          <Form.Item name="item" label="异议指标">
            <Select placeholder="请选择有异议的考核指标" mode="multiple">
              <Option value="1">工作业绩（40%）</Option>
              <Option value="2">工作能力（25%）</Option>
              <Option value="3">工作态度（20%）</Option>
              <Option value="4">团队协作（15%）</Option>
            </Select>
          </Form.Item>
          <Form.Item name="currentScore" label="当前得分">
            <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="当前考核得分" />
          </Form.Item>
          <Form.Item name="expectedScore" label="期望得分">
            <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="您认为合理的得分" />
          </Form.Item>
          <Form.Item name="content" label="反馈内容" rules={[{ required: true, message: '请输入反馈内容' }]}>
            <TextArea rows={6} placeholder="请详细描述您的异议内容，包括具体数据、事实依据等..." />
          </Form.Item>
          <Form.Item name="evidence" label="证明材料">
            <Input placeholder="如有相关证明材料，请提供链接或描述" />
          </Form.Item>
          <Alert
            message="处理说明"
            description="提交后，您的直属上级将在3个工作日内处理。如对处理结果不满，可申请升级。"
            type="info"
            showIcon
          />
        </Form>
      </Modal>

      <Modal
        title={selectedRecord?.employeeName || '反馈详情'}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={850}
      >
        {selectedRecord && (
          <Tabs>
            <Tabs.TabPane tab="反馈信息" key="info">
              <div>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={8}><div style={{ marginBottom: 8 }}><Text type="secondary">考核名称：</Text><Text strong>{selectedRecord.assessmentName}</Text></div></Col>
                  <Col span={8}><div style={{ marginBottom: 8 }}><Text type="secondary">员工姓名：</Text>{selectedRecord.employeeName}</div></Col>
                  <Col span={8}><div style={{ marginBottom: 8 }}><Text type="secondary">部门/职位：</Text>{selectedRecord.department} / {selectedRecord.position}</div></Col>
                </Row>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={8}>
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary">当前状态：</Text>
                      {(() => {
                        const s = statusMap[selectedRecord.status];
                        return <Tag color={s.color} icon={s.icon}>{s.text}</Tag>;
                      })()}
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary">当前级别：</Text>
                      <Tag color={levelMap[selectedRecord.currentLevel]?.color}>{levelMap[selectedRecord.currentLevel]?.text}</Tag>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary">处理时限：</Text>
                      <span style={{ color: selectedRecord.isOverdue ? '#f5222d' : 'inherit' }}>
                        {selectedRecord.deadline}
                        {selectedRecord.isOverdue && ' (已超期)'}
                      </span>
                    </div>
                  </Col>
                </Row>

                <Divider orientation="left">反馈内容</Divider>
                <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 8, marginBottom: 16 }}>
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">当前得分：</Text>
                    <Text strong style={{ fontSize: 16 }}>{selectedRecord.score}分</Text>
                  </div>
                  <div>
                    <Text type="secondary">详细描述：</Text>
                    <p style={{ marginTop: 8, marginBottom: 0, whiteSpace: 'pre-wrap' }}>{selectedRecord.feedbackContent}</p>
                  </div>
                </div>

                {(selectedRecord.status === 'resolved' || selectedRecord.status === 'rejected') && selectedRecord.processResult && (
                  <>
                    <Divider orientation="left">处理结果</Divider>
                    <div style={{ padding: 16, background: selectedRecord.status === 'resolved' ? '#f6ffed' : '#fff1f0', borderRadius: 8 }}>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>处理人：{selectedRecord.processPerson}</Text>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Text type="secondary">处理时间：{selectedRecord.processTime}</Text>
                      </div>
                      <div>
                        <Text type="secondary">处理结果：</Text>
                        <p style={{ marginTop: 8, marginBottom: 0 }}>{selectedRecord.processResult}</p>
                      </div>
                    </div>
                  </>
                )}

                {selectedRecord.escalatedCount > 0 && (
                  <Alert
                    message={`已升级 ${selectedRecord.escalatedCount} 次`}
                    description={`当前处理级别：${levelMap[selectedRecord.currentLevel]?.text}`}
                    type="warning"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                )}
              </div>
            </Tabs.TabPane>

            <Tabs.TabPane tab={<span><HistoryOutlined /> 处理进度</span>} key="logs">
              <Timeline>
                {logs.map((log, index) => (
                  <Timeline.Item key={index} color={log.level >= 3 ? 'red' : log.level >= 2 ? 'blue' : 'green'}>
                    <div>
                      <Space>
                        <Text strong>{log.action}</Text>
                        <Tag color={levelMap[log.level]?.color}>{levelMap[log.level]?.text}</Tag>
                      </Space>
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary">{log.time}</Text>
                        <Text type="secondary" style={{ marginLeft: 12 }}>操作人: {log.operator}</Text>
                      </div>
                      <div style={{ marginTop: 4, color: '#666' }}>{log.detail}</div>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Tabs.TabPane>
          </Tabs>
        )}
      </Modal>

      <Modal
        title="处理校准申请"
        open={processVisible}
        onCancel={() => setProcessVisible(false)}
        footer={[
          <Button key="reject" danger onClick={() => handleProcess('reject')}>驳回申请</Button>,
          <Button key="escalate" onClick={() => { message.info('已转交上级处理'); setProcessVisible(false); }}>转交上级</Button>,
          <Button key="approve" type="primary" onClick={() => handleProcess('approve')}>同意校准</Button>
        ]}
        width={700}
      >
        <Form form={processForm} layout="vertical">
          <Alert
            message={selectedRecord?.feedbackContent}
            description={`员工：${selectedRecord?.employeeName} | 当前得分：${selectedRecord?.score}分`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Form.Item name="action" label="处理方式" rules={[{ required: true, message: '请选择处理方式' }]}>
            <Radio.Group>
              <Radio value="approve">同意校准，调整分数</Radio>
              <Radio value="reject">驳回申请，维持原评分</Radio>
              <Radio value="escalate">转交上级处理</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="newScore" label="调整后得分">
            <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="如同意校准，请输入调整后的得分" />
          </Form.Item>

          <Form.Item name="result" label="处理意见" rules={[{ required: true, message: '请填写处理意见' }]}>
            <TextArea rows={5} placeholder="请详细说明处理意见和依据..." />
          </Form.Item>

          <Alert
            message="处理时限提醒"
            description="请在3个工作日内完成处理，超期将自动升级至上一级管理者。"
            type="warning"
            showIcon
          />
        </Form>
      </Modal>

      <Modal
        title="申请升级处理"
        open={escalateVisible}
        onOk={handleEscalate}
        onCancel={() => setEscalateVisible(false)}
        width={600}
      >
        <Form form={escalateForm} layout="vertical">
          <Alert
            message="升级说明"
            description="如您对当前处理结果或进度不满，可申请升级至上一级管理者处理。每级最多可升级2次。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item name="targetLevel" label="升级至" rules={[{ required: true, message: '请选择升级级别' }]}>
            <Select placeholder="请选择升级到哪一级">
              <Option value="2">二级上级（部门总监）</Option>
              <Option value="3">HR部门</Option>
              <Option value="4">总管理员（最终裁决）</Option>
            </Select>
          </Form.Item>

          <Form.Item name="reason" label="升级原因" rules={[{ required: true, message: '请填写升级原因' }]}>
            <TextArea rows={5} placeholder="请详细说明申请升级的原因，例如：处理不公正、超期未处理、对结果不满等..." />
          </Form.Item>

          <div style={{ padding: 12, background: '#fffbe6', borderRadius: 4 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <WarningOutlined style={{ marginRight: 4 }} />
              升级申请提交后，当前处理人将收到通知，新的处理人将在1个工作日内接手。
            </Text>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default PerformanceCalibration;
