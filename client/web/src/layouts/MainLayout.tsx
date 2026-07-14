import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, theme, Button, message, Modal, Form, Input, List, Tag, Spin } from 'antd';
import {
  HomeOutlined,
  DashboardOutlined,
  TeamOutlined,
  SettingOutlined,
  BarChartOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  EditOutlined,
  SaveOutlined,
  StarOutlined,
  MessageOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloudSyncOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';

const { Header, Sider, Content } = Layout;

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { notifications, markAsRead } = useNotificationStore();
  const { token } = theme.useToken();

  // 个人中心同步状态
  const [syncing, setSyncing] = useState(false);
  const [syncSteps, setSyncSteps] = useState<{name: string; status: 'pending' | 'syncing' | 'done'}[]>([]);

  const syncTargets = [
    { name: '客户端登录账号', key: 'client_login' },
    { name: '客户端组织架构', key: 'client_org' },
    { name: '服务端系统设置', key: 'server_settings' }
  ];

  const getRoleBadge = () => {
    const role = user?.role;
    const roleCode = typeof role === 'object' ? role.code : role || '';
    if (roleCode.includes('super_admin') || roleCode.includes('总管理员')) {
      return { text: '总', color: '#f5222d' };
    }
    if (roleCode.includes('main_admin') || roleCode.includes('主管理员')) {
      return { text: '主', color: '#fa8c16' };
    }
    if (roleCode.includes('sub_admin') || roleCode.includes('分管理员')) {
      return { text: '分', color: '#1890ff' };
    }
    if (roleCode.includes('department_head') || roleCode.includes('部门领导')) {
      return { text: '部', color: '#722ed1' };
    }
    if (roleCode.includes('manager') || roleCode.includes('部门经理')) {
      return { text: '经', color: '#13c2c2' };
    }
    return null;
  };

  const roleBadge = getRoleBadge();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页'
    },
    {
      key: 'performance',
      icon: <BarChartOutlined />,
      label: '绩效管理',
      children: [
        {
          key: '/dashboard',
          icon: <DashboardOutlined />,
          label: '绩效看板'
        },
        {
          key: '/goals',
          icon: <StarOutlined />,
          label: '目标管理'
        },
        {
          key: '/performance',
          icon: <TeamOutlined />,
          label: '绩效考核'
        },
        {
          key: '/score',
          icon: <BarChartOutlined />,
          label: '评分管理'
        },
        {
          key: '/calibration',
          icon: <MessageOutlined />,
          label: '绩效校准'
        },
        {
          key: '/improvement',
          icon: <CalendarOutlined />,
          label: '绩效提升'
        }
      ]
    },
    {
      key: '/talent',
      icon: <UserOutlined />,
      label: '人才发展'
    },
    {
      key: '/system',
      icon: <SettingOutlined />,
      label: '系统设置'
    }
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出账号'
    }
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    } else if (key === 'profile') {
      profileForm.setFieldsValue({
        realName: user?.realName,
        phone: user?.phone
      });
      setEditingProfile(false);
      setShowProfileModal(true);
    }
  };

  const handleNotificationClick = (notification: { id: string; type: string }) => {
    markAsRead(notification.id);
    switch (notification.type) {
      case 'goal_approval':
      case 'goal':
        navigate('/goals');
        break;
      case 'performance':
        navigate('/score');
        break;
      case 'interview':
        navigate('/improvement');
        break;
      case 'talent':
        navigate('/talent');
        break;
      case 'system':
        navigate('/system');
        break;
    }
  };

  const notificationMenuItems = notifications.map(n => ({
    key: n.id,
    label: (
      <div style={{ padding: '8px 0', cursor: 'pointer' }} onClick={() => handleNotificationClick(n)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontWeight: n.read ? 'normal' : 'bold' }}>{n.title}</span>
          <span style={{ fontSize: 12, color: '#999' }}>{new Date(n.createdAt).toLocaleString()}</span>
        </div>
        <div style={{ fontSize: 12, color: '#666' }}>{n.content}</div>
      </div>
    ),
  }));

  const handleSaveProfile = async () => {
    try {
      const values = await profileForm.validateFields();
      console.log('保存个人信息:', values);
      message.success('个人信息保存成功');
      setEditingProfile(false);

      // 启动同步链路动画
      setSyncing(true);
      setSyncSteps(syncTargets.map(t => ({ name: t.name, status: 'pending' })));

      // 逐项同步（模拟）
      for (let i = 0; i < syncTargets.length; i++) {
        // 标记当前项为同步中
        setSyncSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'syncing' } : s));
        // 模拟同步耗时
        await new Promise(r => setTimeout(r, 1000));
        // 标记为已完成
        setSyncSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'done' } : s));
      }

      message.success('个人信息已同步至客户端登录、客户端组织架构、服务端系统设置');
      setTimeout(() => {
        setSyncing(false);
        setSyncSteps([]);
      }, 3000);
    } catch (error) {
      // 校验失败
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={180} collapsedWidth={64}>
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 20,
          fontWeight: 'bold'
        }}>
          {collapsed ? '百鲸' : '百鲸G系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          defaultOpenKeys={['performance']}
        />
      </Sider>
      <Layout>
        <Header style={{
          padding: '0 16px',
          background: token.colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
            <span style={{ fontSize: 16, fontWeight: 'bold', color: token.colorText }}>
              {user?.tenant?.name || '未设置'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'title',
                    label: <div style={{ fontWeight: 'bold', padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>消息通知</div>,
                    disabled: true,
                  },
                  ...notificationMenuItems,
                  {
                    key: 'more',
                    label: <div style={{ textAlign: 'center', padding: '8px 0', color: '#1890ff', cursor: 'pointer' }}>查看全部</div>,
                  },
                ],
              }}
              trigger={['click']}
            >
              <Badge count={notifications.filter(n => !n.read).length} size="small">
                <BellOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
              </Badge>
            </Dropdown>
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick
              }}
            >
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar
                  icon={roleBadge ? <span style={{ color: 'white', fontWeight: 'bold' }}>{roleBadge.text}</span> : <UserOutlined />}
                  style={roleBadge ? { background: roleBadge.color } : {}}
                />
                <span>{user?.realName}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{
          margin: 16,
          padding: 24,
          background: token.colorBgContainer,
          borderRadius: 8,
          minHeight: 280
        }}>
          <Outlet />
        </Content>
      </Layout>

      <Modal
        title="个人中心"
        open={showProfileModal}
        onCancel={() => setShowProfileModal(false)}
        footer={null}
        width={500}
      >
        {!editingProfile ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
              <Avatar
                size={64}
                icon={roleBadge ? <span style={{ color: 'white', fontWeight: 'bold', fontSize: 24 }}>{roleBadge.text}</span> : <UserOutlined />}
                style={roleBadge ? { background: roleBadge.color, marginRight: 16 } : { marginRight: 16 }}
              />
              <div>
                <div style={{ fontSize: 18, fontWeight: 'bold' }}>{user?.realName}</div>
                <div style={{ color: '#666' }}>{typeof user?.role === 'object' ? user?.role.name : '普通用户'}</div>
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>姓名</span>
                <span>{user?.realName}</span>
              </div>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>手机号</span>
                <span>{user?.phone || '未设置'}</span>
              </div>
            </div>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setEditingProfile(true)}
              style={{ width: '100%' }}
            >
              修改
            </Button>
          </div>
        ) : (
          <Form form={profileForm} layout="vertical">
            <Form.Item name="realName" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input placeholder="请输入姓名" />
            </Form.Item>
            <Form.Item name="phone" label="手机号" rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }]}>
              <Input placeholder="请输入手机号" />
            </Form.Item>
            <Form.Item name="password" label="登录密码">
              <Input.Password placeholder="请输入新密码（不修改请留空）" />
            </Form.Item>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <Button onClick={() => setEditingProfile(false)} style={{ flex: 1 }}>取消</Button>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveProfile} style={{ flex: 1 }}>保存</Button>
            </div>
          </Form>
        )}

        {/* 同步状态展示 */}
        {syncing && (
          <div style={{ marginTop: 16, padding: 16, background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <CloudSyncOutlined style={{ color: '#52c41a', marginRight: 8, fontSize: 16 }} />
              <span style={{ fontWeight: 'bold', color: '#52c41a' }}>数据同步中...</span>
            </div>
            <List
              size="small"
              dataSource={syncSteps}
              renderItem={(item) => (
                <List.Item style={{ border: 'none', padding: '6px 0' }}>
                  {item.status === 'pending' && <Tag icon={<SyncOutlined spin={false} />} color="default">{item.name}</Tag>}
                  {item.status === 'syncing' && <Tag icon={<SyncOutlined spin />} color="processing">{item.name} 同步中...</Tag>}
                  {item.status === 'done' && <Tag icon={<CheckCircleOutlined />} color="success">{item.name} 已同步</Tag>}
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>
    </Layout>
  );
}

export default MainLayout;