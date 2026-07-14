import { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Steps, Result, message, Typography, Tag } from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  ReloadOutlined, FileTextOutlined
} from '@ant-design/icons';
import {
  submitTrialApplication, getClientTrialStatus, retryTrialApplication,
  type TrialApplication
} from '../utils/mockData';

const { Text } = Typography;
const { TextArea } = Input;

interface TrialApprovalFlowProps {
  open: boolean;
  onClose: () => void;
  onApproved?: () => void;
}

// 申请试用审批流程组件
function TrialApprovalFlow({ open, onClose, onApproved }: TrialApprovalFlowProps) {
  const [form] = Form.useForm();
  const [currentStatus, setCurrentStatus] = useState<TrialApplication | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0); // 0:填写 1:待审批 2:已通过 3:已拒绝

  // 加载当前申请状态
  useEffect(() => {
    if (open) {
      const status = getClientTrialStatus();
      if (status) {
        setCurrentStatus(status);
        if (status.status === 'pending') setStep(1);
        else if (status.status === 'approved') setStep(2);
        else if (status.status === 'rejected') setStep(3);
        else setStep(0);
      } else {
        setStep(0);
        form.resetFields();
      }
    }
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await new Promise(r => setTimeout(r, 800));
      const app = await submitTrialApplication({
        companyName: values.companyName,
        contactName: values.contactName,
        phone: values.contactPhone,
        employeeCount: values.companySize || '',
        region: values.industry || ''
      });
      setCurrentStatus(app);
      setStep(1);
      message.success('申请已提交，请等待服务端管理员审批');
    } catch (error) {
      // 校验失败
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 500));
    if (currentStatus) {
      const app = await retryTrialApplication({
        companyName: currentStatus.companyName,
        contactName: currentStatus.contactName,
        phone: currentStatus.phone || currentStatus.contactPhone || '',
        employeeCount: currentStatus.companySize || currentStatus.employeeCount || '',
        region: currentStatus.industry || currentStatus.region || ''
      });
      setCurrentStatus(app);
      setStep(1);
      message.success('已重新提交申请，请等待审批');
    }
    setSubmitting(false);
  };

  // 轮询申请状态（模拟接收审批通知）
  useEffect(() => {
    if (open && step === 1) {
      const timer = setInterval(() => {
        const latest = getClientTrialStatus();
        if (latest && latest.status !== 'pending') {
          setCurrentStatus(latest);
          if (latest.status === 'approved') {
            setStep(2);
            message.success('您的申请试用已通过审批！');
          } else if (latest.status === 'rejected') {
            setStep(3);
            message.warning('您的申请试用未通过审批');
          }
          clearInterval(timer);
        }
      }, 2000);
      return () => clearInterval(timer);
    }
  }, [open, step]);

  const stepsItems = [
    { title: '填写申请', icon: <FileTextOutlined /> },
    { title: '待审批', icon: <ClockCircleOutlined /> },
    { title: '审批结果', icon: <CheckCircleOutlined /> }
  ];

  return (
    <Modal
      title="申请试用"
      open={open}
      onCancel={onClose}
      width={560}
      footer={null}
      maskClosable={false}
    >
      <Steps current={step > 2 ? 2 : step} items={stepsItems} style={{ marginBottom: 24 }} />

      {/* 步骤0：填写申请表单 */}
      {step === 0 && (
        <Form form={form} layout="vertical">
          <Form.Item name="companyName" label="公司名称" rules={[{ required: true, message: '请输入公司名称' }]}>
            <Input placeholder="请输入公司名称" />
          </Form.Item>
          <Form.Item name="contactName" label="联系人姓名" rules={[{ required: true, message: '请输入联系人姓名' }]}>
            <Input placeholder="请输入联系人姓名" />
          </Form.Item>
          <Form.Item name="contactPhone" label="联系电话" rules={[
            { required: true, message: '请输入联系电话' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
          ]}>
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="contactEmail" label="电子邮箱">
            <Input placeholder="请输入电子邮箱" />
          </Form.Item>
          <Form.Item name="companySize" label="公司规模">
            <Input placeholder="如：50-100人" />
          </Form.Item>
          <Form.Item name="industry" label="所属行业">
            <Input placeholder="如：互联网/制造/金融" />
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Button onClick={onClose} style={{ marginRight: 8 }}>取消</Button>
            <Button type="primary" loading={submitting} onClick={handleSubmit}>提交申请</Button>
          </div>
        </Form>
      )}

      {/* 步骤1：待审批 */}
      {step === 1 && currentStatus && (
        <Result
          icon={<ClockCircleOutlined style={{ color: '#faad14' }} />}
          title="申请已提交，等待审批"
          subTitle={
            <div>
              <p style={{ marginBottom: 8 }}>
                <Tag color="blue" style={{ fontSize: 14 }}>工单号：{currentStatus.ticketNo}</Tag>
              </p>
              <p>公司名称：{currentStatus.companyName}</p>
              <p>联系人：{currentStatus.contactName}（{currentStatus.phone}）</p>
              <p>提交时间：{currentStatus.submittedAt}</p>
              <Tag color="processing">审批中</Tag>
              <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
                服务端管理员审批通过后，您将收到通知并可使用该账号登录系统。
              </Text>
              <div style={{ marginTop: 12, padding: 8, background: '#f6ffed', borderRadius: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  💡 请记录工单号，可用于查询申请进度
                </Text>
              </div>
            </div>
          }
          extra={<Button onClick={onClose}>关闭</Button>}
        />
      )}

      {/* 步骤2：已通过 */}
      {step === 2 && currentStatus && (
        <Result
          status="success"
          icon={<CheckCircleOutlined />}
          title="申请已通过审批"
          subTitle={
            <div>
              <p style={{ marginBottom: 8 }}>
                <Tag color="green" style={{ fontSize: 14 }}>工单号：{currentStatus.ticketNo}</Tag>
              </p>
              <p>公司名称：{currentStatus.companyName}</p>
              <p>审批时间：{currentStatus.reviewedAt}</p>
              {currentStatus.remark && <p>审批备注：{currentStatus.remark}</p>}
              <Tag color="success">已通过</Tag>
              <div style={{ marginTop: 12, padding: 8, background: '#f6ffed', borderRadius: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ✅ 审批结果通知已发送至您的手机
                </Text>
              </div>
            </div>
          }
          extra={[
            <Button type="primary" key="login" onClick={() => { onApproved?.(); onClose(); }}>
              前往登录
            </Button>,
            <Button key="close" onClick={onClose}>关闭</Button>
          ]}
        />
      )}

      {/* 步骤3：已拒绝 */}
      {step === 3 && currentStatus && (
        <Result
          status="error"
          icon={<CloseCircleOutlined />}
          title="申请未通过审批"
          subTitle={
            <div>
              <p style={{ marginBottom: 8 }}>
                <Tag color="red" style={{ fontSize: 14 }}>工单号：{currentStatus.ticketNo}</Tag>
              </p>
              <p>公司名称：{currentStatus.companyName}</p>
              <p>审批时间：{currentStatus.reviewedAt}</p>
              {currentStatus.remark && <p>拒绝原因：{currentStatus.remark}</p>}
              <Tag color="error">已拒绝</Tag>
              <div style={{ marginTop: 12, padding: 8, background: '#fff2f0', borderRadius: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ❌ 审批结果通知已发送至您的手机
                </Text>
              </div>
            </div>
          }
          extra={[
            <Button type="primary" key="retry" icon={<ReloadOutlined />} loading={submitting} onClick={handleRetry}>
              重新申请
            </Button>,
            <Button key="close" onClick={onClose}>关闭</Button>
          ]}
        />
      )}
    </Modal>
  );
}

export default TrialApprovalFlow;
