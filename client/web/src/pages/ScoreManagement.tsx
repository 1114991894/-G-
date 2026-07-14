import { useState } from 'react';
import {
  Card, Row, Col, Table, Button, Modal, Form, Input, Select,
  InputNumber, Typography, Tag, Space, message, Statistic, Tabs,
  Timeline, Steps, Alert, Progress, Divider, List, Tooltip,
  Radio, Switch, Checkbox
} from 'antd';
import {
  PlusOutlined, EditOutlined, EyeOutlined,
  CheckOutlined, CloseOutlined, ClockCircleOutlined,
  MessageOutlined, HistoryOutlined,
  ApiOutlined, WarningOutlined, FileTextOutlined,
  DownloadOutlined, SendOutlined, ExclamationCircleOutlined,
  DatabaseOutlined, UserOutlined, CalculatorOutlined,
  TrophyOutlined, SettingOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAuthStore } from '../stores/authStore';

const { Title, Text } = Typography;
const { Step } = Steps;
const { TextArea } = Input;
const { Option } = Select;

interface ScoreRecord {
  key: string;
  employeeName: string;
  department: string;
  position: string;
  assessmentName: string;
  selfScore: number;
  superiorScore: number;
  secondSuperiorScore: number;
  finalScore: number;
  selfStatus: 'pending' | 'completed' | 'overdue';
  superiorStatus: 'pending' | 'completed';
  secondSuperiorStatus: 'pending' | 'completed';
  dataSource: 'erp' | 'crm' | 'manual';
  dataConfirmed: boolean;
  confirmPerson: string;
  confirmTime: string;
  dataDisputed: boolean;
  disputeReason: string;
  currentStep: number;
  cycleName: string;
  startTime: string;
  endTime: string;
}

interface ScoreLog {
  time: string;
  action: string;
  operator: string;
  detail: string;
}

const statusMap: Record<string, { text: string; color: string; icon: React.ReactNode }> = {
  pending: { text: '待处理', color: 'warning', icon: <ClockCircleOutlined /> },
  completed: { text: '已完成', color: 'success', icon: <CheckOutlined /> },
  overdue: { text: '已逾期', color: 'error', icon: <ExclamationCircleOutlined /> }
};

const dataSourceMap: Record<string, { text: string; color: string }> = {
  erp: { text: 'ERP系统', color: 'blue' },
  crm: { text: 'CRM系统', color: 'green' },
  manual: { text: '手动录入', color: 'orange' }
};

const stepItems = [
  { title: '数据收集', icon: <DatabaseOutlined /> },
  { title: '数据确认', icon: <CheckOutlined /> },
  { title: '自评', icon: <UserOutlined /> },
  { title: '上级评', icon: <TrophyOutlined /> },
  { title: '得分计算', icon: <CalculatorOutlined /> },
  { title: '结果呈现', icon: <FileTextOutlined /> }
];

function ScoreManagement() {
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [dataConfirmVisible, setDataConfirmVisible] = useState(false);
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [weightConfigVisible, setWeightConfigVisible] = useState(false);
  const [form] = Form.useForm();
  const [scoreForm] = Form.useForm();
  const [disputeForm] = Form.useForm();
  const [selectedRecord, setSelectedRecord] = useState<ScoreRecord | null>(null);
  const [currentDetailTab, setCurrentDetailTab] = useState('info');
  const [selfWeight, setSelfWeight] = useState(20);
  const [superiorWeight, setSuperiorWeight] = useState(60);
  const [secondSuperiorWeight, setSecondSuperiorWeight] = useState(20);
  const [enableSecondSuperior, setEnableSecondSuperior] = useState(true);
  const { user } = useAuthStore();

  const isAdmin = (user?.role?.code || '').includes('admin');
  const isManager = (user?.role?.code || '').includes('manager');
  const isEmployee = (user?.role?.code || '') === 'employee';

  const data: ScoreRecord[] = [];

  const logs: ScoreLog[] = [];

  const columns: ColumnsType<ScoreRecord> = [
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
      title: '当前阶段',
      dataIndex: 'currentStep',
      key: 'currentStep',
      render: (step: number) => (
        <Tag color={step >= 5 ? 'success' : step >= 3 ? 'processing' : 'warning'}>
          {stepItems[step]?.title || '待开始'}
        </Tag>
      )
    },
    {
      title: '数据来源',
      dataIndex: 'dataSource',
      key: 'dataSource',
      render: (t: string) => <Tag color={dataSourceMap[t].color}>{dataSourceMap[t].text}</Tag>
    },
    {
      title: '数据确认',
      dataIndex: 'dataConfirmed',
      key: 'dataConfirmed',
      render: (t: boolean, record: ScoreRecord) => (
        record.dataDisputed ? (
          <Tooltip title={record.disputeReason}>
            <Tag color="error">有争议</Tag>
          </Tooltip>
        ) : t ? (
          <Tag color="success">已确认</Tag>
        ) : (
          <Tag color="warning">待确认</Tag>
        )
      )
    },
    {
      title: '自评状态',
      dataIndex: 'selfStatus',
      key: 'selfStatus',
      render: (t: string) => {
        const s = statusMap[t];
        return <Tag color={s.color} icon={s.icon}>{s.text}</Tag>;
      }
    },
    {
      title: '最终得分',
      dataIndex: 'finalScore',
      key: 'finalScore',
      render: (t: number) => t > 0 ? (
        <span style={{ fontWeight: 'bold', color: t >= 90 ? '#52c41a' : t >= 70 ? '#1890ff' : '#faad14' }}>{t}分</span>
      ) : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ScoreRecord) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedRecord(record); setCurrentDetailTab('info'); setDetailVisible(true); }}>详情</Button>
          {!record.dataConfirmed && !record.dataDisputed && (isAdmin || isManager) && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => { setSelectedRecord(record); setDataConfirmVisible(true); }}>确认数据</Button>
          )}
          {record.selfStatus === 'pending' && (
            <Button type="link" size="small" icon={<EditOutlined />}>自评</Button>
          )}
          {record.selfStatus === 'completed' && record.superiorStatus === 'pending' && (isAdmin || isManager) && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setSelectedRecord(record); setScoreModalVisible(true); }}>评分</Button>
          )}
          {record.finalScore > 0 && (
            <Button type="link" size="small" icon={<DownloadOutlined />}>导出报告</Button>
          )}
        </Space>
      )
    }
  ];

  const handleScore = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('评分数据:', values);
      message.success('评分提交成功');
      setModalVisible(false);
    } catch (error) {
      // 校验失败
    }
  };

  const handleDataConfirm = (confirm: boolean) => {
    if (confirm) {
      message.success('数据已确认');
    } else {
      message.success('已驳回，已通知数据录入人');
    }
    setDataConfirmVisible(false);
  };

  const handleScoreSubmit = async () => {
    try {
      const values = await scoreForm.validateFields();
      console.log('上级评分:', values);
      message.success('评分提交成功');
      setScoreModalVisible(false);
    } catch (error) {
      // 校验失败
    }
  };

  const filteredData = isEmployee ? data.filter(d => d.employeeName === user?.realName) : data;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4}>评分管理</Title>
        <Space>
          {isAdmin && (
            <Button icon={<SettingOutlined />} onClick={() => setWeightConfigVisible(true)}>权重配置</Button>
          )}
          {(isAdmin || isManager) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleScore}>发起评分</Button>
          )}
        </Space>
      </div>

      <Alert
        message="六步评分链路"
        description="数据收集 → 数据确认 → 自评 → 上级评 → 得分计算 → 结果呈现，全程留痕可追溯"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic title="待数据确认" value={data.filter(d => !d.dataConfirmed && !d.dataDisputed).length} valueStyle={{ color: '#faad14' }} prefix={<DatabaseOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="待自评" value={data.filter(d => d.selfStatus === 'pending').length} valueStyle={{ color: '#1890ff' }} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="待上级评分" value={data.filter(d => d.selfStatus === 'completed' && d.superiorStatus === 'pending').length} valueStyle={{ color: '#722ed1' }} prefix={<TrophyOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="已逾期" value={data.filter(d => d.selfStatus === 'overdue').length} valueStyle={{ color: '#f5222d' }} prefix={<WarningOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="计算中" value={data.filter(d => d.currentStep === 4).length} valueStyle={{ color: '#13c2c2' }} prefix={<CalculatorOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="已完成" value={data.filter(d => d.finalScore > 0).length} valueStyle={{ color: '#52c41a' }} prefix={<CheckOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="发起评分"
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
          <Form.Item name="cycle" label="考核周期">
            <Select placeholder="请选择周期">
              <Option value="2026q3">2026年Q3</Option>
              <Option value="2026q2">2026年Q2</Option>
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="自评开始时间" rules={[{ required: true, message: '请选择开始时间' }]}>
                <Input type="date" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label="自评结束时间" rules={[{ required: true, message: '请选择结束时间' }]}>
                <Input type="date" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remindType" label="提醒机制">
            <Checkbox.Group>
              <Checkbox value="start">开始前1天提醒</Checkbox>
              <Checkbox value="end">结束前1天提醒</Checkbox>
              <Checkbox value="overdue">逾期后每天提醒</Checkbox>
            </Checkbox.Group>
          </Form.Item>
          <Form.Item name="overdueHandle" label="逾期处理">
            <Radio.Group>
              <Radio value="auto_mark">自动标记逾期自评</Radio>
              <Radio value="allow_makeup">允许上级决定是否补评</Radio>
              <Radio value="auto_score">系统自动按0分计算</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={selectedRecord?.employeeName || '评分详情'}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={900}
      >
        {selectedRecord && (
          <div>
            <Steps current={selectedRecord.currentStep} items={stepItems} style={{ marginBottom: 24 }} />
            
            <Tabs activeKey={currentDetailTab} onChange={setCurrentDetailTab}>
              <Tabs.TabPane tab="评分信息" key="info">
                <div>
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={8}><div style={{ marginBottom: 8 }}><Text type="secondary">考核名称：</Text><Text strong>{selectedRecord.assessmentName}</Text></div></Col>
                    <Col span={8}><div style={{ marginBottom: 8 }}><Text type="secondary">考核周期：</Text>{selectedRecord.cycleName}</div></Col>
                    <Col span={8}><div style={{ marginBottom: 8 }}><Text type="secondary">员工姓名：</Text>{selectedRecord.employeeName}</div></Col>
                  </Row>
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={8}><div style={{ marginBottom: 8 }}><Text type="secondary">部门：</Text>{selectedRecord.department}</div></Col>
                    <Col span={8}><div style={{ marginBottom: 8 }}><Text type="secondary">职位：</Text>{selectedRecord.position}</div></Col>
                    <Col span={8}><div style={{ marginBottom: 8 }}><Text type="secondary">数据来源：</Text><Tag color={dataSourceMap[selectedRecord.dataSource].color}>{dataSourceMap[selectedRecord.dataSource].text}</Tag></div></Col>
                  </Row>
                </div>

                <Divider orientation="left">数据收集与确认</Divider>
                <Card size="small" style={{ marginBottom: 16 }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <div style={{ marginBottom: 8 }}>
                        <Text type="secondary">数据确认状态：</Text>
                        {selectedRecord.dataConfirmed ? (
                          <Tag color="success">已确认 ({selectedRecord.confirmPerson})</Tag>
                        ) : selectedRecord.dataDisputed ? (
                          <Tag color="error">有争议</Tag>
                        ) : (
                          <Tag color="warning">待确认</Tag>
                        )}
                      </div>
                      <div>
                        <Text type="secondary">确认时间：</Text>
                        {selectedRecord.confirmTime || '-'}
                      </div>
                    </Col>
                    <Col span={12}>
                      {selectedRecord.dataDisputed && (
                        <Alert message="争议原因" description={selectedRecord.disputeReason} type="warning" showIcon />
                      )}
                    </Col>
                  </Row>
                </Card>

                <Divider orientation="left">评分明细</Divider>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={8}>
                    <Card>
                      <Statistic title="自评分" value={selectedRecord.selfScore || '-'} suffix={selectedRecord.selfScore ? '分' : ''} valueStyle={{ color: '#1890ff' }} />
                      <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                        权重 {selfWeight}% · {statusMap[selectedRecord.selfStatus].text}
                      </div>
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card>
                      <Statistic title="直接上级评分" value={selectedRecord.superiorScore || '-'} suffix={selectedRecord.superiorScore ? '分' : ''} valueStyle={{ color: '#52c41a' }} />
                      <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                        权重 {superiorWeight}% · {statusMap[selectedRecord.superiorStatus].text}
                      </div>
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card>
                      <Statistic title="二级上级评分" value={selectedRecord.secondSuperiorScore || '-'} suffix={selectedRecord.secondSuperiorScore ? '分' : ''} valueStyle={{ color: '#722ed1' }} />
                      <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                        权重 {secondSuperiorWeight}% · {statusMap[selectedRecord.secondSuperiorStatus].text}
                      </div>
                    </Card>
                  </Col>
                </Row>

                {selectedRecord.finalScore > 0 && (
                  <div style={{ padding: 16, background: 'linear-gradient(135deg, #f6ffed 0%, #e6f7ff 100%)', borderRadius: 8, textAlign: 'center' }}>
                    <Text type="secondary">最终得分</Text>
                    <div style={{ fontSize: 48, fontWeight: 'bold', color: selectedRecord.finalScore >= 90 ? '#52c41a' : selectedRecord.finalScore >= 70 ? '#1890ff' : '#faad14' }}>
                      {selectedRecord.finalScore}分
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      计算公式：自评×{selfWeight}% + 直接上级×{superiorWeight}% + 二级上级×{secondSuperiorWeight}%
                    </Text>
                    <div style={{ marginTop: 12 }}>
                      <Button icon={<DownloadOutlined />}>导出PDF绩效报告</Button>
                    </div>
                  </div>
                )}
              </Tabs.TabPane>

              <Tabs.TabPane tab={<span><TrophyOutlined /> 评分参考</span>} key="reference">
                <Row gutter={16}>
                  <Col span={12}>
                    <Card size="small" title="历史评分趋势" style={{ marginBottom: 16 }}>
                      <List
                        size="small"
                        dataSource={[
                          { cycle: '2026 Q2', score: 85 },
                          { cycle: '2026 Q1', score: 82 },
                          { cycle: '2025 Q4', score: 78 },
                          { cycle: '2025 Q3', score: 75 }
                        ]}
                        renderItem={(item) => (
                          <List.Item>
                            <span>{item.cycle}</span>
                            <span style={{ fontWeight: 'bold', color: item.score >= 80 ? '#52c41a' : '#faad14' }}>{item.score}分</span>
                          </List.Item>
                        )}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" title="目标完成数据" style={{ marginBottom: 16 }}>
                      <List
                        size="small"
                        dataSource={[
                          { name: '销售目标', target: '100万', actual: '125万', rate: '125%' },
                          { name: '客户开发', target: '20个', actual: '18个', rate: '90%' },
                          { name: '回款率', target: '95%', actual: '98%', rate: '103%' }
                        ]}
                        renderItem={(item) => (
                          <List.Item>
                            <span>{item.name}</span>
                            <Space>
                              <Text type="secondary">{item.actual}/{item.target}</Text>
                              <Tag color={parseInt(item.rate) >= 100 ? 'green' : 'orange'}>{item.rate}</Tag>
                            </Space>
                          </List.Item>
                        )}
                      />
                    </Card>
                  </Col>
                </Row>
                <Card size="small" title="同岗位对比">
                  <Row gutter={16}>
                    <Col span={8}>
                      <Statistic title="员工排名" value={3} suffix="/15" valueStyle={{ color: '#1890ff' }} />
                    </Col>
                    <Col span={8}>
                      <Statistic title="同岗位平均分" value={82} suffix="分" />
                    </Col>
                    <Col span={8}>
                      <Statistic title="最高/最低分" value={95} suffix="/68分" />
                    </Col>
                  </Row>
                </Card>
              </Tabs.TabPane>

              <Tabs.TabPane tab={<span><HistoryOutlined /> 操作记录</span>} key="logs">
                <Timeline>
                  {logs.map((log, index) => (
                    <Timeline.Item key={index}>
                      <div>
                        <Text strong>{log.action}</Text>
                        <Text type="secondary" style={{ marginLeft: 8 }}>{log.time}</Text>
                        <Text type="secondary" style={{ marginLeft: 8 }}>操作人: {log.operator}</Text>
                        <div style={{ marginTop: 4, color: '#666' }}>{log.detail}</div>
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Tabs.TabPane>
            </Tabs>
          </div>
        )}
      </Modal>

      <Modal
        title="数据确认"
        open={dataConfirmVisible}
        onCancel={() => setDataConfirmVisible(false)}
        footer={[
          <Button key="reject" danger onClick={() => handleDataConfirm(false)}>驳回</Button>,
          <Button key="confirm" type="primary" onClick={() => handleDataConfirm(true)}>确认无误</Button>
        ]}
      >
        <Alert
          message="请确认以下数据是否准确"
          description="确认后数据将锁定，不可随意更改。如有问题请驳回并注明原因。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <List
          size="small"
          bordered
          dataSource={[
            { name: '销售额', value: '¥1,250,000', source: 'CRM系统' },
            { name: '新增客户数', value: '18个', source: 'CRM系统' },
            { name: '回款金额', value: '¥980,000', source: 'ERP系统' },
            { name: '客户满意度', value: '95%', source: '手动录入' }
          ]}
          renderItem={(item) => (
            <List.Item>
              <span>{item.name}</span>
              <Space>
                <Text strong>{item.value}</Text>
                <Tag color="blue">{item.source}</Tag>
              </Space>
            </List.Item>
          )}
        />
        <div style={{ marginTop: 16, padding: 12, background: '#fffbe6', borderRadius: 4 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <WarningOutlined style={{ marginRight: 4 }} />
            数据确认后将锁定，如有争议可发起申诉流程
          </Text>
        </div>
      </Modal>

      <Modal
        title={`上级评分 - ${selectedRecord?.employeeName || ''}`}
        open={scoreModalVisible}
        onOk={handleScoreSubmit}
        onCancel={() => setScoreModalVisible(false)}
        width={750}
      >
        <Form form={scoreForm} layout="vertical">
          <Alert
            message="评分参考"
            description="请结合员工自评、历史绩效、目标完成情况综合评分"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Card size="small">
                <Statistic title="自评得分" value={selectedRecord?.selfScore || 0} suffix="分" valueStyle={{ fontSize: 18, color: '#1890ff' }} />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic title="上周期得分" value={85} suffix="分" valueStyle={{ fontSize: 18 }} />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic title="目标完成率" value={'125%'} valueStyle={{ fontSize: 18, color: '#52c41a' }} />
              </Card>
            </Col>
          </Row>

          <Divider>评分项</Divider>
          
          <List
            dataSource={[
              { name: '工作业绩', weight: 40, score: null },
              { name: '工作能力', weight: 25, score: null },
              { name: '工作态度', weight: 20, score: null },
              { name: '团队协作', weight: 15, score: null }
            ]}
            renderItem={(item, index) => (
              <List.Item>
                <Space style={{ flex: 1 }}>
                  <span style={{ width: 100 }}>{item.name}</span>
                  <Tag color="blue">权重 {item.weight}%</Tag>
                  <InputNumber min={0} max={100} style={{ width: 120 }} placeholder="请输入分数" />
                </Space>
              </List.Item>
            )}
          />

          <Form.Item name="totalScore" label="综合得分" rules={[{ required: true, message: '请输入综合得分' }]} style={{ marginTop: 16 }}>
            <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="请输入0-100分的综合得分" />
          </Form.Item>

          <Form.Item name="comment" label="评分说明" rules={[{ required: true, message: '请填写评分说明' }]}>
            <TextArea rows={4} placeholder="请详细说明评分依据、员工优点和待改进之处..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="评分权重配置"
        open={weightConfigVisible}
        onCancel={() => setWeightConfigVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setWeightConfigVisible(false)}>取消</Button>,
          <Button key="save" type="primary" onClick={() => { message.success('权重配置已保存'); setWeightConfigVisible(false); }}>保存配置</Button>
        ]}
        width={600}
      >
        <Form layout="vertical">
          <Alert
            message="权重配置说明"
            description="权重总和应为100%，二级上级评分为可选项"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Form.Item label="启用二级上级评分">
            <Switch checked={enableSecondSuperior} onChange={setEnableSecondSuperior} />
            <Text type="secondary" style={{ marginLeft: 12 }}>开启后，评分需经两级上级审批</Text>
          </Form.Item>

          <Divider />

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="自评权重">
                <InputNumber
                  min={0}
                  max={100}
                  value={selfWeight}
                  onChange={(v) => setSelfWeight(v || 0)}
                  style={{ width: '100%' }}
                  addonAfter="%"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="直接上级权重">
                <InputNumber
                  min={0}
                  max={100}
                  value={superiorWeight}
                  onChange={(v) => setSuperiorWeight(v || 0)}
                  style={{ width: '100%' }}
                  addonAfter="%"
                />
              </Form.Item>
            </Col>
            {enableSecondSuperior && (
              <Col span={8}>
                <Form.Item label="二级上级权重">
                  <InputNumber
                    min={0}
                    max={100}
                    value={secondSuperiorWeight}
                    onChange={(v) => setSecondSuperiorWeight(v || 0)}
                    style={{ width: '100%' }}
                    addonAfter="%"
                  />
                </Form.Item>
              </Col>
            )}
          </Row>

          <div style={{ padding: 12, background: selfWeight + superiorWeight + secondSuperiorWeight === 100 ? '#f6ffed' : '#fff2f0', borderRadius: 4 }}>
            <Text>
              当前权重合计：<Text strong>{selfWeight + superiorWeight + (enableSecondSuperior ? secondSuperiorWeight : 0)}%</Text>
              {selfWeight + superiorWeight + (enableSecondSuperior ? secondSuperiorWeight : 0) !== 100 && (
                <Text type="danger" style={{ marginLeft: 8 }}>（不等于100%，请调整）</Text>
              )}
            </Text>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default ScoreManagement;
