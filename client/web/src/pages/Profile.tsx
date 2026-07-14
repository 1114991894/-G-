import { useState, useEffect } from 'react';
import {
  Card, Row, Col, Avatar, Form, Input, Button, Tag, Descriptions, Typography, message
} from 'antd';
import {
  UserOutlined, MailOutlined, PhoneOutlined, EditOutlined, SaveOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';

const { Title, Text } = Typography;

function Profile() {
  const { user } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        realName: user.realName,
        email: user.email,
        phone: user.phone
      });
    }
  }, [user, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      console.log('保存的信息:', values);
      message.success('个人信息保存成功');
      setEditing(false);
    } catch (error) {
      // 校验失败
    }
  };

  return (
    <div>
      <Title level={4}>个人中心</Title>

      <Row gutter={24}>
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Avatar size={100} icon={<UserOutlined />} style={{ background: '#1890ff' }} />
              <div style={{ marginTop: 16 }}>
                <Title level={4}>{user?.realName || '未设置'}</Title>
                <Tag color="blue">{user?.role?.name || '普通用户'}</Tag>
              </div>
              <div style={{ marginTop: 16, textAlign: 'left' }}>
                <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MailOutlined />
                  <Text>{user?.email || '未设置'}</Text>
                </div>
                <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PhoneOutlined />
                  <Text>{user?.phone || '未设置'}</Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col span={16}>
          <Card
            title="基本信息"
            extra={
              editing ? (
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>保存</Button>
              ) : (
                <Button icon={<EditOutlined />} onClick={() => setEditing(true)}>编辑</Button>
              )
            }
          >
            {!editing ? (
              <Descriptions column={2}>
                <Descriptions.Item label="用户名">{user?.username}</Descriptions.Item>
                <Descriptions.Item label="姓名">{user?.realName}</Descriptions.Item>
                <Descriptions.Item label="邮箱">{user?.email || '未设置'}</Descriptions.Item>
                <Descriptions.Item label="手机">{user?.phone || '未设置'}</Descriptions.Item>
                <Descriptions.Item label="部门">{user?.employee?.department?.name || '未分配'}</Descriptions.Item>
                <Descriptions.Item label="角色">{user?.role?.name || '普通用户'}</Descriptions.Item>
                <Descriptions.Item label="所属企业">{user?.tenant?.name || '未分配'}</Descriptions.Item>
              </Descriptions>
            ) : (
              <Form form={form} layout="vertical">
                <Form.Item name="username" label="用户名">
                  <Input disabled />
                </Form.Item>
                <Form.Item name="realName" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                  <Input placeholder="请输入姓名" />
                </Form.Item>
                <Form.Item name="email" label="邮箱">
                  <Input placeholder="请输入邮箱" />
                </Form.Item>
                <Form.Item name="phone" label="手机号">
                  <Input placeholder="请输入手机号" />
                </Form.Item>
              </Form>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Profile;
