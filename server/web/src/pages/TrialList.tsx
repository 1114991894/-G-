import { useState, useEffect } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, Select, Tag,
  Typography, Space, message, Badge, InputNumber
} from 'antd';
import {
  FileTextOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined,
  SearchOutlined, FilterOutlined, UserOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  getAllTrialApplicationsAsync,
  reviewTrialApplication,
  type TrialApplication
} from '../utils/mockData';

const { Title, Text } = Typography;

const statusMap: Record<string, { text: string; color: string; badge: string }> = {
  pending: { text: '待审核', color: 'processing', badge: 'processing' },
  approved: { text: '已通过', color: 'success', badge: 'success' },
  rejected: { text: '已拒绝', color: 'error', badge: 'error' },
};

interface MergedApplication {
  companyName: string;
  applications: TrialApplication[];
  latestStatus: string;
  applicantCount: number;
}

function TrialList() {
  const [applications, setApplications] = useState<TrialApplication[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [currentMergedApp, setCurrentMergedApp] = useState<MergedApplication | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewForm] = Form.useForm();
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    const apps = await getAllTrialApplicationsAsync();
    setApplications(apps);
  };

  const mergeApplications = (apps: TrialApplication[]): MergedApplication[] => {
    const groups: Record<string, TrialApplication[]> = {};
    apps.forEach(app => {
      const key = app.companyName.trim();
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(app);
    });

    return Object.entries(groups).map(([companyName, companyApps]) => {
      companyApps.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      const latestStatus = companyApps[0].status;
      return {
        companyName,
        applications: companyApps,
        latestStatus,
        applicantCount: companyApps.length,
      };
    });
  };

  const mergedApplications = mergeApplications(applications);

  const filteredApplications = mergedApplications.filter(merged => {
    const matchSearch = !searchText ||
      merged.companyName.toLowerCase().includes(searchText.toLowerCase()) ||
      merged.applications.some(app => 
        app.contactName.toLowerCase().includes(searchText.toLowerCase()) ||
        app.phone.includes(searchText)
      );
    const matchStatus = !statusFilter || merged.latestStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleViewDetail = (merged: MergedApplication) => {
    setCurrentMergedApp(merged);
    setViewModalVisible(true);
  };

  const handleReview = (merged: MergedApplication) => {
    setCurrentMergedApp(merged);
    setReviewStatus('approved');
    reviewForm.resetFields();
    setReviewModalVisible(true);
  };

  const handleReviewSubmit = async () => {
    if (!currentMergedApp) return;
    try {
      const values = await reviewForm.validateFields();
      for (const app of currentMergedApp.applications) {
        await reviewTrialApplication(app.id, reviewStatus, values.remark);
      }
      message.success(reviewStatus === 'approved' ? '审核通过' : '已拒绝');
      setReviewModalVisible(false);
      loadApplications();
    } catch (error) {
      // 校验失败
    }
  };

  const columns: ColumnsType<MergedApplication> = [
    {
      title: '公司名称',
      dataIndex: 'companyName',
      key: 'companyName',
      render: (text: string) => <a>{text}</a>,
      sorter: (a, b) => a.companyName.localeCompare(b.companyName),
    },
    {
      title: '申请人数量',
      dataIndex: 'applicantCount',
      key: 'applicantCount',
      render: (count: number) => (
        <Badge count={count} showZero={false}>
          <span>{count}人</span>
        </Badge>
      ),
    },
    {
      title: '联系人',
      key: 'contacts',
      render: (_: any, record: MergedApplication) => (
        <div>
          {record.applications.slice(0, 3).map((app, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserOutlined style={{ fontSize: 12 }} />
              <span>{app.contactName}</span>
              <span style={{ color: '#999', fontSize: 12 }}>{app.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</span>
            </div>
          ))}
          {record.applicantCount > 3 && (
            <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
              还有 {record.applicantCount - 3} 人申请
            </div>
          )}
        </div>
      ),
    },
    {
      title: '员工数',
      key: 'employeeCounts',
      render: (_: any, record: MergedApplication) => (
        <div>
          {record.applications.slice(0, 2).map((app, idx) => (
            <div key={idx}>{app.employeeCount || '-'}</div>
          ))}
          {record.applicantCount > 2 && (
            <div style={{ color: '#999', fontSize: 12 }}>等{record.applicantCount}条</div>
          )}
        </div>
      ),
    },
    {
      title: '地区',
      key: 'regions',
      render: (_: any, record: MergedApplication) => (
        <div>
          {record.applications.slice(0, 2).map((app, idx) => (
            <div key={idx}>{app.region || '-'}</div>
          ))}
          {record.applicantCount > 2 && (
            <div style={{ color: '#999', fontSize: 12 }}>等{record.applicantCount}条</div>
          )}
        </div>
      ),
    },
    {
      title: '最新状态',
      dataIndex: 'latestStatus',
      key: 'latestStatus',
      render: (status: string) => (
        <Tag color={statusMap[status].color}>
          {statusMap[status].text}
        </Tag>
      ),
      filters: [
        { text: '待审核', value: 'pending' },
        { text: '已通过', value: 'approved' },
        { text: '已拒绝', value: 'rejected' },
      ],
      onFilter: (value, record) => record.latestStatus === value,
    },
    {
      title: '最新提交时间',
      key: 'latestSubmittedAt',
      render: (_: any, record: MergedApplication) => record.applications[0]?.submittedAt || '-',
      sorter: (a, b) => {
        const aTime = a.applications[0]?.submittedAt || '';
        const bTime = b.applications[0]?.submittedAt || '';
        return aTime.localeCompare(bTime);
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: MergedApplication) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.latestStatus === 'pending' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleReview(record)}>
              审核
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const pendingCount = mergedApplications.filter(a => a.latestStatus === 'pending').length;
  const approvedCount = mergedApplications.filter(a => a.latestStatus === 'approved').length;
  const rejectedCount = mergedApplications.filter(a => a.latestStatus === 'rejected').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>试用申请管理</Title>
        <Space>
          <Badge count={pendingCount} offset={[0, 0]}>
            <Tag color="orange">待审核 {pendingCount}</Tag>
          </Badge>
          <Tag color="green">已通过 {approvedCount}</Tag>
          <Tag color="red">已拒绝 {rejectedCount}</Tag>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SearchOutlined />
            <Input
              placeholder="搜索公司名称、联系人、手机号"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FilterOutlined />
            <Select
              placeholder="状态筛选"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
              options={[
                { value: '', label: '全部' },
                { value: 'pending', label: '待审核' },
                { value: 'approved', label: '已通过' },
                { value: 'rejected', label: '已拒绝' },
              ]}
            />
          </div>
        </Space>
      </Card>

      <Card title={
        <Space>
          <FileTextOutlined />
          试用申请列表
          <Text type="secondary" style={{ fontSize: 13 }}>共 {filteredApplications.length} 条记录</Text>
        </Space>
      }>
        <Table
          columns={columns}
          dataSource={filteredApplications}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="试用申请详情"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={null}
        width={600}
      >
        {currentMergedApp && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text strong>{currentMergedApp.companyName}</Text>
                <Tag color={statusMap[currentMergedApp.latestStatus].color} style={{ fontSize: 14, padding: '4px 12px' }}>
                  {statusMap[currentMergedApp.latestStatus].text}
                </Tag>
              </div>
              <div style={{ color: '#999', fontSize: 13 }}>
                共 {currentMergedApp.applicantCount} 人提交申请
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              {currentMergedApp.applications.map((app, idx) => (
                <div key={app.id} style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 8, borderLeft: '4px solid #1890ff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 'bold' }}>申请人 {idx + 1}</span>
                    <Badge status={statusMap[app.status].badge as 'processing' | 'success' | 'error'} text={app.ticketNo} />
                  </div>
                  <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>联系人</span>
                    <span>{app.contactName}</span>
                  </div>
                  <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>手机号</span>
                    <span>{app.phone}</span>
                  </div>
                  <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>员工数</span>
                    <span>{app.employeeCount || '-'}</span>
                  </div>
                  <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>地区</span>
                    <span>{app.region || '-'}</span>
                  </div>
                  <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>提交时间</span>
                    <span>{app.submittedAt}</span>
                  </div>
                  {app.reviewedAt && (
                    <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#666' }}>审核时间</span>
                      <span>{app.reviewedAt}</span>
                    </div>
                  )}
                  {app.remark && (
                    <div>
                      <span style={{ color: '#666', display: 'block', marginBottom: 4 }}>审核备注</span>
                      <div style={{ padding: 8, background: '#fff', borderRadius: 4, fontSize: 13 }}>
                        {app.remark}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {currentMergedApp.latestStatus === 'pending' && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  setViewModalVisible(false);
                  handleReview(currentMergedApp);
                }}
                style={{ width: '100%' }}
              >
                进行审核
              </Button>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="审核试用申请"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
        width={500}
      >
        {currentMergedApp && (
          <div>
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{currentMergedApp.companyName}</div>
              <div style={{ color: '#666', fontSize: 13 }}>
                共 {currentMergedApp.applicantCount} 人申请
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <span style={{ marginRight: 16 }}>审核结果：</span>
              <Space>
                <Button
                  type={reviewStatus === 'approved' ? 'primary' : 'default'}
                  icon={<CheckCircleOutlined />}
                  onClick={() => setReviewStatus('approved')}
                >
                  通过
                </Button>
                <Button
                  type={reviewStatus === 'rejected' ? 'primary' : 'default'}
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => setReviewStatus('rejected')}
                >
                  拒绝
                </Button>
              </Space>
            </div>

            <Form form={reviewForm} layout="vertical">
              <Form.Item
                name="remark"
                label="审核备注"
                rules={reviewStatus === 'rejected' ? [{ required: true, message: '拒绝时请填写备注' }] : []}
              >
                <Input.TextArea
                  placeholder={reviewStatus === 'approved' ? '选填审核备注' : '请填写拒绝原因'}
                  rows={4}
                />
              </Form.Item>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <Button onClick={() => setReviewModalVisible(false)} style={{ flex: 1 }}>取消</Button>
                <Button type="primary" onClick={handleReviewSubmit} style={{ flex: 1 }}>
                  {reviewStatus === 'approved' ? '确认通过' : '确认拒绝'}
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default TrialList;