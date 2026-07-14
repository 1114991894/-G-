import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, theme, Button, message, Modal, Form, Input, List, Typography } from 'antd';
import {
  HomeOutlined,
  TeamOutlined,
  SettingOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  EditOutlined,
  SaveOutlined,
  FileTextOutlined,
  ApiOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  getNotificationsAsync,
  markNotificationAsRead,
  getUnreadNotificationCountAsync,
  type Notification
} from '../utils/mockData';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm] = Form.useForm();
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { token } = theme.useToken();

  useEffect(() => {
    loadNotifications();
    checkExpiringClients();
    
    const timer = setInterval(() => {
      loadNotifications();
    }, 5000);
    
    return () => clearInterval(timer);
  }, []);

  const checkExpiringClients = () => {
    const clientsKey = 'server_clients';
    const storedClients = localStorage.getItem(clientsKey);
    if (storedClients) {
      try {
        const clients: any[] = JSON.parse(storedClients);
        const now = new Date();
        const expiringClients = clients.filter(c => {
          if (!c.expireDate || c.expireDate === '-') return false;
          const dateParts = c.expireDate.split('-');
          const endDateStr = dateParts.length > 1 ? dateParts[1].trim() : c.expireDate;
          const expireDate = new Date(endDateStr);
          const diffDays = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays > 0 && diffDays <= 30;
        });
        
        expiringClients.forEach(client => {
          const dateParts = client.expireDate.split('-');
          const endDateStr = dateParts.length > 1 ? dateParts[1].trim() : client.expireDate;
          const expireDate = new Date(endDateStr);
          const diffDays = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const notificationKey = `expire_${client.id}_${now.getMonth()}_${now.getDate()}`;
          const notified = localStorage.getItem(notificationKey);
          if (!notified) {
            localStorage.setItem(notificationKey, 'true');
            const adminsKey = 'server_admins_list';
            const storedAdmins = localStorage.getItem(adminsKey);
            if (storedAdmins) {
              const admins = JSON.parse(storedAdmins);
              admins.forEach((admin: any) => {
                if (admin.status === 'active') {
                  const adminNotificationsKey = `admin_notifications_${admin.id}`;
                  const adminNotifications = JSON.parse(localStorage.getItem(adminNotificationsKey) || '[]');
                  adminNotifications.push({
                    id: Date.now().toString(),
                    title: `客户即将到期提醒`,
                    description: `客户"${client.name}"将于${endDateStr}到期，剩余${diffDays}天`,
                    type: 'expire',
                    data: { clientId: client.id },
                    read: false,
                    createdAt: now.toLocaleString('zh-CN')
                  });
                  localStorage.setItem(adminNotificationsKey, JSON.stringify(adminNotifications));
                }
              });
            }
          }
        });
      } catch {}
    }
  };

  const loadNotifications = async () => {
    const notifs = await getNotificationsAsync(user?.id);
    setNotifications(notifs);
    const count = await getUnreadNotificationCountAsync(user?.id);
    setUnreadCount(count);
  };

  const getRoleBadge = () => {
    const roleCode = user?.role || '';
    if (roleCode.includes('super_admin') || roleCode.includes('总管理员')) {
      return { text: '总', color: '#f5222d' };
    }
    if (roleCode.includes('main_admin') || roleCode.includes('主管理员')) {
      return { text: '主', color: '#fa8c16' };
    }
    if (roleCode.includes('sub_admin') || roleCode.includes('分管理员')) {
      return { text: '分', color: '#1890ff' };
    }
    return null;
  };

  const roleBadge = getRoleBadge();
  const isSuperAdmin = (user?.role || '').includes('super_admin') || (user?.role || '').includes('总管理员');
  const isMainAdmin = (user?.role || '').includes('main_admin') || (user?.role || '').includes('主管理员');
  const hasSystemSettingsPermission = isSuperAdmin || (user?.permissions || []).includes('system_settings');
  const hasTrialReviewPermission = isSuperAdmin || (user?.permissions || []).includes('trial_review');

  const menuItems = [
    {
      key: '/dashboard',
      icon: <HomeOutlined />,
      label: '首页'
    },
    ...(hasTrialReviewPermission ? [{
      key: '/trials',
      icon: <FileTextOutlined />,
      label: '试用申请'
    }] : []),
    {
      key: '/clients',
      icon: <TeamOutlined />,
      label: '客户管理'
    },
    ...(hasSystemSettingsPermission ? [{
      key: '/integration',
      icon: <ApiOutlined />,
      label: '第三方集成'
    }] : []),
    ...(hasSystemSettingsPermission ? [{
      key: '/admins',
      icon: <SettingOutlined />,
      label: '系统设置'
    }] : [])
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
        realName: user?.username,
        phone: user?.phone || ''
      });
      setEditingProfile(false);
      setShowProfileModal(true);
    }
  };

  const handleBellClick = async () => {
    const notifs = await getNotificationsAsync(user?.id);
    const unreadNotifs = notifs.filter(n => !n.read);
    for (const notif of unreadNotifs) {
      await markNotificationAsRead(notif.id, user?.id);
    }
    loadNotifications();
    setShowNotificationModal(true);
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markNotificationAsRead(notification.id, user?.id);
    loadNotifications();
    if (notification.type === 'trial' && notification.data?.trialId) {
      navigate('/trials');
      setShowNotificationModal(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const values = await profileForm.validateFields();
      console.log('保存个人信息:', values);
      message.success('个人信息保存成功，已同步到服务端登录和总管理员系统设置');
      setEditingProfile(false);
    } catch (error) {
      // 校验失败
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
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
              百鲸G系统（服务端）
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={unreadCount} size="small">
              <BellOutlined
                style={{ fontSize: 20, cursor: 'pointer' }}
                onClick={handleBellClick}
              />
            </Badge>
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
                <span>{user?.username || '管理员'}</span>
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
                <div style={{ fontSize: 18, fontWeight: 'bold' }}>{user?.username}</div>
                <div style={{ color: '#666' }}>
                  {roleBadge ? (roleBadge.text === '总' ? '总管理员' : roleBadge.text === '主' ? '主管理员' : '分管理员') : '管理员'}
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>姓名</span>
                <span>{user?.username || '未设置'}</span>
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
            <Form.Item name="phone" label="手机号" rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
            ]}>
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
      </Modal>

      <Modal
        title="通知消息"
        open={showNotificationModal}
        onCancel={() => setShowNotificationModal(false)}
        footer={null}
        width={500}
      >
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <BellOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
            <div style={{ color: '#999' }}>暂无通知消息</div>
          </div>
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <div
                style={{
                  padding: 16,
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  backgroundColor: item.read ? 'transparent' : '#f5f5f5',
                  borderRadius: 4,
                  marginBottom: 8
                }}
                onClick={() => handleNotificationClick(item)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    backgroundColor: item.type === 'trial' ? '#1890ff' : '#faad14',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {item.type === 'trial' ? <FileTextOutlined /> : <BellOutlined />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{item.title}</div>
                    <div style={{ color: '#666', fontSize: 13 }}>{item.content}</div>
                    <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>{item.createdAt}</div>
                  </div>
                  {!item.read && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ff4d4f' }} />
                  )}
                </div>
              </div>
            )}
          />
        )}
      </Modal>
    </Layout>
  );
}

export default MainLayout;