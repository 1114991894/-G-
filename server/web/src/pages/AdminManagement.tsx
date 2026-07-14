import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import {
  Card, Table, Button, Space, Tag, Typography, Modal, Form, Input,
  Select, message, Tabs, Switch, Checkbox, Divider, Badge,
  Descriptions, Timeline, Popconfirm, Tooltip, Row, Col, Statistic
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  UserOutlined, SafetyOutlined, SettingOutlined,
  CheckOutlined, EyeOutlined, EyeInvisibleOutlined,
  CheckCircleOutlined, CloseCircleOutlined, FileSearchOutlined,
  StopOutlined, PlayCircleOutlined, HistoryOutlined,
  TeamOutlined, UserSwitchOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  getAllTrialApplications, reviewTrialApplication,
  type TrialApplication
} from '../utils/mockData';

const { Title, Text } = Typography;

interface Admin {
  id: string;
  name: string;
  phone: string;
  password: string;
  role: 'super_admin' | 'main_admin' | 'sub_admin' | 'admin';
  status: 'active' | 'inactive';
  permissions: string[];
  lastLogin: string;
  createdAt: string;
  clientCount: number;
}

interface RoleRecord {
  key: string;
  name: string;
  code: string;
  description: string;
  userCount: number;
  permissions: string[];
}

interface OperationLog {
  id: string;
  time: string;
  operator: string;
  action: string;
  detail: string;
  ip: string;
}

interface AssignedClient {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

const roleMap: Record<string, { text: string; color: string; badge: string }> = {
  super_admin: { text: '总管理员', color: 'red', badge: '总' },
  main_admin: { text: '主管理员', color: 'orange', badge: '主' },
  sub_admin: { text: '分管理员', color: 'blue', badge: '分' },
  admin: { text: '管理员', color: 'purple', badge: '管' }
};

const permissionOptions = [
  { label: '分配客户', value: 'client_assign' },
  { label: '禁用/开启客户', value: 'client_enable_disable' },
  { label: '试用申请审批', value: 'trial_review' },
  { label: '编辑客户', value: 'client_edit' },
  { label: '查看客户列表隐藏信息', value: 'client_view_hidden' },
  { label: '客户看板', value: 'dashboard' },
  { label: '客户管理', value: 'client_manage' },
  { label: '系统设置', value: 'system_settings' }
];

const allPermissions = permissionOptions.map(p => p.value);

function AdminManagement() {
  const { user } = useAuthStore();
  const isSuperAdmin = (user?.role || '').includes('super_admin') || (user?.role || '').includes('总管理员');
  
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [form] = Form.useForm();
  const [permissionForm] = Form.useForm();
  const [transferForm] = Form.useForm();

  const [roleEditModalVisible, setRoleEditModalVisible] = useState(false);
  const [rolePermissionModalVisible, setRolePermissionModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleRecord | null>(null);
  const [roleEditForm] = Form.useForm();
  const [rolePermissionForm] = Form.useForm();

  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([]);
  const [assignedClients, setAssignedClients] = useState<AssignedClient[]>([]);
  const [deleteTransferTarget, setDeleteTransferTarget] = useState<string>('');

  // 申请试用审批状态
  const [trialApplications, setTrialApplications] = useState<TrialApplication[]>(getAllTrialApplications());
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<TrialApplication | null>(null);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved');
  const [reviewForm] = Form.useForm();

  const ADMINS_LIST_KEY = 'server_admins_list';
  
  const getStoredAdmins = (): Admin[] => {
    const stored = localStorage.getItem(ADMINS_LIST_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  };

  const saveAdminsToStorage = (admins: Admin[]) => {
    localStorage.setItem(ADMINS_LIST_KEY, JSON.stringify(admins));
  };

  const initAdmins = (): Admin[] => {
    const stored = getStoredAdmins();
    if (stored.length > 0) {
      return stored;
    }
    const defaultAdmins: Admin[] = [
      {
        id: '1',
        name: '刘诠案',
        phone: '13634169539',
        password: 'liufachun888',
        role: 'super_admin',
        status: 'active',
        permissions: allPermissions,
        lastLogin: '2026-07-06 09:30:00',
        createdAt: '2026-01-01 10:00:00',
        clientCount: 0
      }
    ];
    saveAdminsToStorage(defaultAdmins);
    return defaultAdmins;
  };

  const [admins, setAdmins] = useState<Admin[]>(initAdmins());

  const updateAdmins = (updater: (prev: Admin[]) => Admin[]) => {
    setAdmins(prev => {
      const newAdmins = updater(prev);
      saveAdminsToStorage(newAdmins);
      return newAdmins;
    });
  };

  const [roleData, setRoleData] = useState<RoleRecord[]>([
    {
      key: '1',
      name: '总管理员',
      code: 'super_admin',
      description: '拥有系统所有权限，可管理主管理员和分管理员',
      userCount: 1,
      permissions: allPermissions
    },
    {
      key: '2',
      name: '主管理员',
      code: 'main_admin',
      description: '由总管理员分配权限，可管理分管理员',
      userCount: 1,
      permissions: ['dashboard', 'client_manage']
    },
    {
      key: '3',
      name: '分管理员',
      code: 'sub_admin',
      description: '由总管理员分配权限，负责客户分配等具体工作',
      userCount: 1,
      permissions: ['dashboard', 'client_assign']
    }
  ]);

  const handleCreate = () => {
    setEditMode(false);
    setSelectedAdmin(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Admin) => {
    setSelectedAdmin(record);
    setEditMode(true);
    form.setFieldsValue({
      name: record.name,
      phone: record.phone,
      password: record.password,
      role: record.role
    });
    setModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      if (editMode && selectedAdmin) {
        updateAdmins(prev => prev.map(a =>
          a.id === selectedAdmin.id ? {
            ...a,
            name: values.name,
            phone: values.phone,
            password: values.password,
            role: values.role
          } : a
        ));
        message.success('管理员信息修改成功，已同步到服务端登录');
      } else {
        const newAdmin: Admin = {
          id: Date.now().toString(),
          name: values.name,
          phone: values.phone,
          password: values.password,
          role: values.role,
          status: 'active',
          permissions: values.role === 'super_admin' ? allPermissions : ['dashboard', 'client_manage'],
          lastLogin: '-',
          createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
          clientCount: 0
        };
        updateAdmins(prev => [...prev, newAdmin]);
        
        const ADMINS_KEY = 'server_admins';
        const storedAdmins = localStorage.getItem(ADMINS_KEY);
        const admins = storedAdmins ? JSON.parse(storedAdmins) : {};
        admins[values.phone] = {
          password: values.password,
          user: {
            id: newAdmin.id,
            username: values.name,
            realName: values.name,
            phone: values.phone,
            email: `${values.phone}@bwg.com`,
            role: values.role,
            tenantId: 'server'
          }
        };
        localStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
        
        message.success('管理员添加成功');
      }
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermission = (record: Admin) => {
    setSelectedAdmin(record);
    permissionForm.setFieldsValue({
      permissions: record.permissions
    });
    setPermissionModalVisible(true);
  };

  const handlePermissionOk = async () => {
    try {
      const values = await permissionForm.validateFields();
      if (selectedAdmin) {
        updateAdmins(prev => prev.map(a =>
          a.id === selectedAdmin.id ? { ...a, permissions: values.permissions } : a
        ));
        message.success('权限修改成功');
      }
      setPermissionModalVisible(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const togglePasswordVisible = (id: string) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleViewDetail = (record: Admin) => {
    setSelectedAdmin(record);
    loadAssignedClients(record.id);
    loadOperationLogs(record.id);
    setDetailModalVisible(true);
  };

  const handleToggleStatus = (record: Admin) => {
    const action = record.status === 'active' ? '禁用' : '启用';
    Modal.confirm({
      title: `${action}管理员`,
      content: `确定要${action}管理员"${record.name}"吗？${action === '禁用' ? '禁用后该管理员将无法登录系统' : '启用后该管理员可正常登录'}。`,
      okText: `确认${action}`,
      okButtonProps: { danger: record.status === 'active' },
      cancelText: '取消',
      onOk: () => {
        updateAdmins(prev => prev.map(a =>
          a.id === record.id ? { ...a, status: a.status === 'active' ? 'inactive' : 'active' } : a
        ));
        message.success(`管理员已${action}`);
      }
    });
  };

  const handleDelete = (record: Admin) => {
    if (record.role === 'super_admin') {
      message.error('总管理员不可删除');
      return;
    }
    if (record.clientCount > 0) {
      setSelectedAdmin(record);
      setDeleteTransferTarget('');
      transferForm.resetFields();
      setTransferModalVisible(true);
      return;
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除管理员"${record.name}"吗？删除后不可恢复。`,
      okText: '确定删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        updateAdmins(prev => prev.filter(a => a.id !== record.id));
        message.success('删除成功');
      }
    });
  };

  const handleTransferOk = async () => {
    try {
      const values = await transferForm.validateFields();
      if (selectedAdmin && values.targetAdmin) {
        const targetAdmin = admins.find(a => a.id === values.targetAdmin);
        updateAdmins(prev => prev.map(a => {
          if (a.id === selectedAdmin.id) {
            return { ...a, clientCount: 0 };
          }
          if (a.id === values.targetAdmin) {
            return { ...a, clientCount: a.clientCount + selectedAdmin.clientCount };
          }
          return a;
        }));
        if (values.deleteAfterTransfer) {
          updateAdmins(prev => prev.filter(a => a.id !== selectedAdmin.id));
          message.success(`客户已转移给${targetAdmin?.name}，原管理员已删除`);
        } else {
          message.success(`客户已转移给${targetAdmin?.name}`);
        }
        setTransferModalVisible(false);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const loadAssignedClients = (adminId: string) => {
    const clients: AssignedClient[] = [
      { id: 'c1', name: '示例企业A', status: '启用中', createdAt: '2026-01-15' },
      { id: 'c2', name: '示例企业D', status: '已禁用', createdAt: '2026-06-20' },
      { id: 'c3', name: '示例企业E', status: '已分配', createdAt: '2026-07-03' },
    ];
    setAssignedClients(clients);
  };

  const loadOperationLogs = (adminId: string) => {
    const logs: OperationLog[] = [
      { id: '1', time: '2026-07-06 09:30:00', operator: '系统', action: '登录', detail: '管理员登录系统', ip: '10.0.0.1' },
      { id: '2', time: '2026-07-05 14:20:00', operator: '总管理员', action: '修改权限', detail: '修改客户管理权限', ip: '10.0.0.1' },
      { id: '3', time: '2026-07-04 10:00:00', operator: '系统', action: '分配客户', detail: '分配示例企业E', ip: '10.0.0.1' },
      { id: '4', time: '2026-03-20 09:30:00', operator: '总管理员', action: '创建账号', detail: '创建管理员账号', ip: '10.0.0.1' },
    ];
    setOperationLogs(logs);
  };

  const handleViewLogs = (record: Admin) => {
    setSelectedAdmin(record);
    loadOperationLogs(record.id);
    setLogModalVisible(true);
  };

  // ============ 申请试用审批 ============
  const handleReview = (record: TrialApplication, action: 'approved' | 'rejected') => {
    setReviewTarget(record);
    setReviewAction(action);
    reviewForm.resetFields();
    setReviewModalVisible(true);
  };

  const handleReviewOk = async () => {
    try {
      const values = await reviewForm.validateFields();
      if (reviewTarget) {
        reviewTrialApplication(reviewTarget.id, reviewAction, values.remark || '');
        setTrialApplications(getAllTrialApplications());
        message.success(`已${reviewAction === 'approved' ? '通过' : '拒绝'}申请，通知已发送至客户端`);
      }
      setReviewModalVisible(false);
      reviewForm.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleRoleEdit = (record: RoleRecord) => {
    setSelectedRole(record);
    roleEditForm.setFieldsValue({
      name: record.name,
    });
    setRoleEditModalVisible(true);
  };

  const handleRoleEditOk = async () => {
    try {
      const values = await roleEditForm.validateFields();
      setRoleData(prev => prev.map(r =>
        r.code === selectedRole?.code ? { ...r, name: values.name } : r
      ));
      message.success('角色名称修改成功');
      setRoleEditModalVisible(false);
      roleEditForm.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleRolePermission = (record: RoleRecord) => {
    setSelectedRole(record);
    rolePermissionForm.setFieldsValue({
      permissions: record.permissions,
    });
    setRolePermissionModalVisible(true);
  };

  const handleRolePermissionOk = async () => {
    try {
      const values = await rolePermissionForm.validateFields();
      setRoleData(prev => prev.map(r =>
        r.code === selectedRole?.code ? { ...r, permissions: values.permissions } : r
      ));
      message.success('角色权限配置成功');
      setRolePermissionModalVisible(false);
      rolePermissionForm.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const trialColumns: ColumnsType<TrialApplication> = [
    {
      title: '工单号',
      dataIndex: 'ticketNo',
      key: 'ticketNo',
      width: 160,
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '公司名称',
      dataIndex: 'companyName',
      key: 'companyName',
      render: (text: string) => <a>{text}</a>
    },
    {
      title: '联系人',
      dataIndex: 'contactName',
      key: 'contactName'
    },
    {
      title: '联系电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone'
    },
    {
      title: '公司规模',
      dataIndex: 'companySize',
      key: 'companySize'
    },
    {
      title: '行业',
      dataIndex: 'industry',
      key: 'industry'
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: TrialApplication) => {
        if (status === 'pending') return <Badge status="processing" text="待审批" />;
        if (status === 'approved') return <Badge status="success" text={`已通过${record.reviewedAt ? ' ' + record.reviewedAt : ''}`} />;
        return <Badge status="error" text={`已拒绝${record.reviewedAt ? ' ' + record.reviewedAt : ''}`} />;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: TrialApplication) => (
        record.status === 'pending' ? (
          <Space>
            <Button type="link" size="small" icon={<CheckCircleOutlined />} style={{ color: '#52c41a' }}
              onClick={() => handleReview(record, 'approved')}>通过</Button>
            <Button type="link" size="small" danger icon={<CloseCircleOutlined />}
              onClick={() => handleReview(record, 'rejected')}>拒绝</Button>
          </Space>
        ) : (
          <Text type="secondary">{record.remark || '-'}</Text>
        )
      )
    }
  ];

  const adminColumns: ColumnsType<Admin> = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Admin) => (
        <a onClick={() => handleViewDetail(record)}>{text}</a>
      )
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: '登录密码',
      dataIndex: 'password',
      key: 'password',
      render: (password: string, record: Admin) => {
        const canViewPassword = (() => {
          if (isSuperAdmin) return true;
          const isMainAdmin = (user?.role || '').includes('main_admin') || (user?.role || '').includes('主管理员');
          const isSubAdmin = (user?.role || '').includes('sub_admin') || (user?.role || '').includes('分管理员');
          if (isMainAdmin) {
            return record.role !== 'super_admin';
          }
          if (isSubAdmin) {
            return record.role === 'admin';
          }
          return false;
        })();
        
        if (!canViewPassword) {
          return <span>••••••</span>;
        }
        
        return (
          <Space>
            <span>{showPassword[record.id] ? password : '••••••'}</span>
            <Button
              type="link"
              size="small"
              icon={showPassword[record.id] ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={() => togglePasswordVisible(record.id)}
            />
          </Space>
        );
      }
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Tag color={roleMap[role].color}>{roleMap[role].text}</Tag>
    },
    {
      title: '负责客户数',
      dataIndex: 'clientCount',
      key: 'clientCount',
      render: (count: number) => (
        <Tag color={count > 0 ? 'blue' : 'default'}>{count}家</Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Badge status={status === 'active' ? 'success' : 'default'} text={status === 'active' ? '启用' : '禁用'} />
      )
    },
    {
      title: '最后登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin'
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_: any, record: Admin) => {
        const isMainAdmin = (user?.role || '').includes('main_admin') || (user?.role || '').includes('主管理员');
        const isSubAdmin = (user?.role || '').includes('sub_admin') || (user?.role || '').includes('分管理员');
        const isGeneralAdmin = (user?.role || '').includes('admin') && !isSuperAdmin && !isMainAdmin && !isSubAdmin;
        
        const canToggleStatus = (() => {
          if (record.id === user?.id) return false;
          if (isSuperAdmin) {
            return record.role !== 'super_admin';
          }
          if (isMainAdmin) {
            return record.role === 'sub_admin' || record.role === 'admin';
          }
          if (isSubAdmin) {
            return record.role === 'admin';
          }
          return false;
        })();
        
        const canEdit = isSuperAdmin;
        const canViewDetail = isSuperAdmin;
        const canPermission = isSuperAdmin && record.role !== 'super_admin';
        const canViewLogs = isSuperAdmin;
        const canDelete = isSuperAdmin && record.role !== 'super_admin';
        
        return (
          <Space size="small">
            {canViewDetail && (
              <Tooltip title="查看详情">
                <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
              </Tooltip>
            )}
            {canEdit && (
              <Tooltip title="编辑">
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
              </Tooltip>
            )}
            {canPermission && (
              <Tooltip title="权限配置">
                <Button type="link" size="small" icon={<SafetyOutlined />} onClick={() => handlePermission(record)} />
              </Tooltip>
            )}
            {canToggleStatus && (
              <Tooltip title={record.status === 'active' ? '禁用' : '启用'}>
                <Button
                  type="link"
                  size="small"
                  danger={record.status === 'active'}
                  icon={record.status === 'active' ? <StopOutlined /> : <PlayCircleOutlined />}
                  onClick={() => handleToggleStatus(record)}
                />
              </Tooltip>
            )}
            {canViewLogs && (
              <Tooltip title="操作日志">
                <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => handleViewLogs(record)} />
              </Tooltip>
            )}
            {canDelete && (
              <Popconfirm
                title="确认删除"
                description={record.clientCount > 0 ? `该管理员负责${record.clientCount}家客户，删除前需转移客户` : '确定要删除该管理员吗？'}
                onConfirm={() => handleDelete(record)}
                okText="确定"
                cancelText="取消"
                okButtonProps={{ danger: true }}
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
          </Space>
        );
      }
    }
  ];

  const roleColumns: ColumnsType<RoleRecord> = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: RoleRecord) => (
        <Space>
          <Tag color={record.code === 'super_admin' ? 'red' : record.code === 'main_admin' ? 'orange' : record.code === 'sub_admin' ? 'blue' : 'purple'}>
            {text}
          </Tag>
        </Space>
      )
    },
    {
      title: '用户数',
      dataIndex: 'userCount',
      key: 'userCount'
    },
    {
      title: '权限数',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: string[]) => {
        if (permissions.length === allPermissions.length) {
          return <Tag color="green">全部权限</Tag>;
        }
        return <Tag color="blue">{permissions.length}项</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: RoleRecord) => (
        <Space>
          {record.code !== 'super_admin' ? (
            <>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleRoleEdit(record)}>编辑</Button>
              <Button type="link" size="small" icon={<SafetyOutlined />} onClick={() => handleRolePermission(record)}>权限配置</Button>
            </>
          ) : (
            <Text type="secondary">系统默认</Text>
          )}
        </Space>
      )
    }
  ];

  const tabItems = [
    {
      key: 'admins',
      label: <span><UserOutlined /> 管理员管理</span>,
      children: (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="管理员总数"
                  value={admins.length}
                  suffix="人"
                  prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="启用中"
                  value={admins.filter(a => a.status === 'active').length}
                  suffix="人"
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="已禁用"
                  value={admins.filter(a => a.status === 'inactive').length}
                  suffix="人"
                  prefix={<StopOutlined style={{ color: '#f5222d' }} />}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="负责客户总数"
                  value={admins.reduce((sum, a) => sum + a.clientCount, 0)}
                  suffix="家"
                  prefix={<UserSwitchOutlined style={{ color: '#722ed1' }} />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>添加管理员</Button>
          </div>
          <Card bodyStyle={{ padding: 0 }}>
            <Table
              columns={adminColumns}
              dataSource={admins}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              tableLayout="auto"
            />
          </Card>
        </>
      )
    },
    {
      key: 'roles',
      label: <span><SafetyOutlined /> 角色权限</span>,
      children: (
        <Card>
          <Table
            columns={roleColumns}
            dataSource={roleData}
            rowKey="key"
            pagination={false}
          />
        </Card>
      )
    },
    {
      key: 'system',
      label: <span><SettingOutlined /> 系统配置</span>,
      children: (
        <div style={{ maxWidth: 600 }}>
          <Form layout="vertical">
            <Form.Item label="系统名称" name="systemName">
              <Input defaultValue="百鲸G系统（服务端）" disabled />
            </Form.Item>
            <Divider>功能开关</Divider>
            <Form.Item label="启用客户看板" name="enableDashboard">
              <Switch defaultChecked />
            </Form.Item>
            <Form.Item label="启用客户管理" name="enableClients">
              <Switch defaultChecked />
            </Form.Item>
            <Form.Item label="启用AI分析" name="enableAi">
              <Switch defaultChecked />
            </Form.Item>
            <Form.Item label="启用消息通知" name="enableNotification">
              <Switch defaultChecked />
            </Form.Item>
            <Form.Item>
              <Button type="primary" icon={<CheckOutlined />}>保存配置</Button>
            </Form.Item>
          </Form>
        </div>
      )
    },
    {
      key: 'trial',
      label: <span><FileSearchOutlined /> 申请试用审批</span>,
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="secondary">客户端提交的试用申请将在此处审批</Text>
            <Space>
              <Tag color="processing">待审批 {trialApplications.filter(a => a.status === 'pending').length}</Tag>
              <Tag color="success">已通过 {trialApplications.filter(a => a.status === 'approved').length}</Tag>
              <Tag color="error">已拒绝 {trialApplications.filter(a => a.status === 'rejected').length}</Tag>
            </Space>
          </div>
          <Card>
            <Table
              columns={trialColumns}
              dataSource={trialApplications}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </div>
      )
    }
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>系统设置</Title>
      <Card>
        <Tabs items={tabItems} />
      </Card>

      <Modal
        title={editMode ? '编辑管理员' : '添加管理员'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={loading}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item
            name="password"
            label="登录密码"
            rules={[
              { required: true, message: '请输入登录密码' },
              { min: 6, message: '密码长度至少6位' }
            ]}
          >
            <Input.Password placeholder="请输入登录密码" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色" disabled={editMode}>
              <Select.Option value="main_admin">主管理员</Select.Option>
              <Select.Option value="sub_admin">分管理员</Select.Option>
              <Select.Option value="admin">管理员</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`权限配置 - ${selectedAdmin?.name}`}
        open={permissionModalVisible}
        onOk={handlePermissionOk}
        onCancel={() => setPermissionModalVisible(false)}
        width={500}
      >
        <Form form={permissionForm} layout="vertical">
          <Form.Item name="permissions" label="可访问的功能模块">
            <Checkbox.Group options={permissionOptions} />
          </Form.Item>
          <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
            <Text type="secondary">
              <SafetyOutlined style={{ marginRight: 8 }} />
              总管理员拥有所有权限，主管理员和分管理员的权限由总管理员分配
            </Text>
          </div>
        </Form>
      </Modal>

      <Modal
        title={`${reviewAction === 'approved' ? '通过' : '拒绝'}申请 - ${reviewTarget?.companyName}`}
        open={reviewModalVisible}
        onOk={handleReviewOk}
        onCancel={() => {
          setReviewModalVisible(false);
          reviewForm.resetFields();
        }}
        okText="确认"
        cancelText="取消"
        okButtonProps={{ danger: reviewAction === 'rejected' }}
        width={500}
      >
        {reviewTarget && (
          <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 4 }}>
            <div style={{ marginBottom: 8 }}>
              <Text strong>{reviewTarget.companyName}</Text>
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              <div>联系人：{reviewTarget.contactName}（{reviewTarget.phone}）</div>
              <div>员工数：{reviewTarget.employeeCount}人 | 区域：{reviewTarget.region}</div>
              <div>提交时间：{reviewTarget.submittedAt}</div>
            </div>
          </div>
        )}
        <Form form={reviewForm} layout="vertical">
          <Form.Item
            name="remark"
            label={reviewAction === 'approved' ? '通过备注' : '拒绝原因'}
            rules={reviewAction === 'rejected' ? [{ required: true, message: '请填写拒绝原因' }] : []}
          >
            <Input.TextArea
              rows={3}
              placeholder={reviewAction === 'approved' ? '可填写通过备注（选填）' : '请填写拒绝原因'}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="管理员详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedAdmin && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 8,
                background: roleMap[selectedAdmin.role].color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginRight: 16, color: '#fff', fontSize: 22, fontWeight: 'bold'
              }}>
                {roleMap[selectedAdmin.role].badge}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 'bold' }}>{selectedAdmin.name}</div>
                <Space style={{ marginTop: 4 }}>
                  <Tag color={roleMap[selectedAdmin.role].color}>{roleMap[selectedAdmin.role].text}</Tag>
                  <Badge status={selectedAdmin.status === 'active' ? 'success' : 'default'} text={selectedAdmin.status === 'active' ? '启用' : '禁用'} />
                </Space>
              </div>
            </div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="手机号">{selectedAdmin.phone}</Descriptions.Item>
              <Descriptions.Item label="登录密码">
                <Space>
                  <span>{showPassword[selectedAdmin.id] ? selectedAdmin.password : '••••••'}</span>
                  <Button
                    type="link"
                    size="small"
                    icon={showPassword[selectedAdmin.id] ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    onClick={() => togglePasswordVisible(selectedAdmin.id)}
                  />
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="负责客户数">{selectedAdmin.clientCount}家</Descriptions.Item>
              <Descriptions.Item label="权限数">{selectedAdmin.permissions.length}项</Descriptions.Item>
              <Descriptions.Item label="创建时间">{selectedAdmin.createdAt}</Descriptions.Item>
              <Descriptions.Item label="最后登录">{selectedAdmin.lastLogin}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" style={{ margin: '16px 0' }}>负责客户列表</Divider>
            <Table
              size="small"
              dataSource={assignedClients}
              rowKey="id"
              pagination={false}
              columns={[
                { title: '公司名称', dataIndex: 'name', key: 'name' },
                { title: '状态', dataIndex: 'status', key: 'status', render: (t: string) => <Tag color="blue">{t}</Tag> },
                { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
              ]}
            />

            <Divider orientation="left" style={{ margin: '16px 0' }}>操作日志</Divider>
            <Timeline items={operationLogs.map(log => ({
              color: 'blue',
              children: (
                <div>
                  <div>
                    <Text strong>{log.action}</Text>
                    <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>{log.time}</Text>
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    操作人：{log.operator} | {log.detail} | IP：{log.ip}
                  </div>
                </div>
              )
            }))} />
          </div>
        )}
      </Modal>

      <Modal
        title="转移客户"
        open={transferModalVisible}
        onOk={handleTransferOk}
        onCancel={() => setTransferModalVisible(false)}
        okText="确认转移"
        width={500}
      >
        {selectedAdmin && (
          <div style={{ marginBottom: 16, padding: 12, background: '#fffbe6', borderRadius: 4 }}>
            <Text type="secondary">
              <ExclamationCircleOutlined style={{ marginRight: 8, color: '#faad14' }} />
              管理员"{selectedAdmin.name}"当前负责 <Text strong>{selectedAdmin.clientCount}</Text> 家客户，
              删除前必须先转移客户
            </Text>
          </div>
        )}
        <Form form={transferForm} layout="vertical">
          <Form.Item
            name="targetAdmin"
            label="转移给"
            rules={[{ required: true, message: '请选择目标管理员' }]}
          >
            <Select placeholder="请选择目标管理员">
              {admins.filter(a => a.id !== selectedAdmin?.id && a.status === 'active').map(a => (
                <Select.Option key={a.id} value={a.id}>
                  {roleMap[a.role].text} - {a.name}（当前负责{a.clientCount}家）
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="deleteAfterTransfer" valuePropName="checked">
            <Checkbox>转移后删除原管理员</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="操作日志"
        open={logModalVisible}
        onCancel={() => setLogModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedAdmin && (
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">管理员：</Text><Text strong>{selectedAdmin.name}</Text>
          </div>
        )}
        <Timeline
          items={operationLogs.map(log => ({
            color: 'blue',
            children: (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>{log.action}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{log.time}</Text>
                </div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  操作人：{log.operator}
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  {log.detail}
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>
                  IP：{log.ip}
                </div>
              </div>
            )
          }))}
        />
      </Modal>

      <Modal
        title="编辑角色"
        open={roleEditModalVisible}
        onOk={handleRoleEditOk}
        onCancel={() => {
          setRoleEditModalVisible(false);
          roleEditForm.resetFields();
        }}
        width={500}
      >
        {selectedRole && (
          <Form form={roleEditForm} layout="vertical">
            <Form.Item
              name="name"
              label="角色名称"
              rules={[{ required: true, message: '请输入角色名称' }]}
            >
              <Input placeholder="请输入角色名称" />
            </Form.Item>
            <div style={{ padding: 12, background: '#fafafa', borderRadius: 4, marginTop: 8 }}>
              <Text type="secondary">
                <ExclamationCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                角色编码：{selectedRole.code}（系统默认，不可修改）
              </Text>
            </div>
          </Form>
        )}
      </Modal>

      <Modal
        title={`权限配置 - ${selectedRole?.name}`}
        open={rolePermissionModalVisible}
        onOk={handleRolePermissionOk}
        onCancel={() => {
          setRolePermissionModalVisible(false);
          rolePermissionForm.resetFields();
        }}
        width={500}
      >
        <Form form={rolePermissionForm} layout="vertical">
          <Form.Item name="permissions" label="功能权限">
            <Checkbox.Group style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {permissionOptions.map(p => (
                <Checkbox key={p.value} value={p.value}>
                  {p.label}
                </Checkbox>
              ))}
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default AdminManagement;