import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import {
  Card, Table, Button, Space, Tag, Typography, Modal, Form, Input,
  message, Tooltip, Badge, Select, DatePicker, Row, Col, Divider,
  Timeline, Descriptions, Popconfirm, Tabs
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, EyeOutlined,
  StopOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  UserSwitchOutlined, HistoryOutlined, FilterOutlined,
  ClockCircleOutlined, CheckOutlined, CloseOutlined,
  EnvironmentOutlined, TeamOutlined, RedoOutlined,
  FileTextOutlined, SafetyOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import request from '../utils/request';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface Client {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  password: string;
  status: 'pending' | 'assigned' | 'active' | 'inactive' | 'trial';
  employeeCount: number;
  employeeEnabledCount: number;
  employeeDisabledCount: number;
  createdAt: string;
  region: string;
  province?: string;
  city?: string;
  scale: string;
  assignedTo: string;
  assignedToName: string;
  assignedAt?: string;
  disableReason?: string;
  disabledAt?: string;
  disabledBy?: string;
  expireDate: string;
  lastLogin: string;
  healthScore: number;
  role: 'super_admin' | 'main_admin';
}

interface OperationLog {
  id: string;
  time: string;
  operator: string;
  action: string;
  detail: string;
  ip: string;
}

interface EditApproval {
  id: string;
  clientId: string;
  clientName: string;
  applicant: string;
  applyTime: string;
  status: 'pending' | 'approved' | 'rejected';
  changes: { field: string; oldValue: string; newValue: string }[];
  reviewer?: string;
  reviewTime?: string;
  remark?: string;
}

const statusMap: Record<string, { text: string; color: string; badge: string }> = {
  pending: { text: '待分配', color: 'processing', badge: 'processing' },
  assigned: { text: '已分配', color: 'warning', badge: 'warning' },
  active: { text: '启用中', color: 'success', badge: 'success' },
  inactive: { text: '已禁用', color: 'error', badge: 'error' },
  trial: { text: '试用中', color: 'processing', badge: 'processing' },
};

const regionOptions = ['华东地区', '华北地区', '华南地区', '西南地区', '西北地区', '东北地区', '华中地区'];
const disableReasons = [
  { value: 'arrears', label: '欠费' },
  { value: 'expired', label: '到期' },
  { value: 'violation', label: '违规' },
  { value: 'other', label: '其他' },
];

interface AdminOption {
  value: string;
  label: string;
}

const getAdminOptions = (currentUserRole: string): AdminOption[] => {
  const ADMINS_LIST_KEY = 'server_admins_list';
  const stored = localStorage.getItem(ADMINS_LIST_KEY);
  if (!stored) return [];
  
  try {
    const admins: any[] = JSON.parse(stored);
    const isSuperAdmin = currentUserRole.includes('super_admin') || currentUserRole.includes('总管理员');
    const isMainAdmin = currentUserRole.includes('main_admin') || currentUserRole.includes('主管理员');
    const isSubAdmin = currentUserRole.includes('sub_admin') || currentUserRole.includes('分管理员');
    
    return admins
      .filter(admin => admin.status === 'active')
      .filter(admin => {
        if (isSuperAdmin) {
          return admin.role !== 'super_admin';
        }
        if (isMainAdmin) {
          return admin.role === 'sub_admin' || admin.role === 'admin';
        }
        if (isSubAdmin) {
          return admin.role === 'admin';
        }
        return false;
      })
      .map(admin => ({
        value: admin.id,
        label: `${admin.name} (${admin.role === 'main_admin' ? '主管理员' : admin.role === 'sub_admin' ? '分管理员' : '管理员'})`
      }));
  } catch {
    return [];
  }
};

const provinceOptions = [
  { value: 'beijing', label: '北京市' },
  { value: 'tianjin', label: '天津市' },
  { value: 'hebei', label: '河北省' },
  { value: 'shanxi', label: '山西省' },
  { value: 'neimenggu', label: '内蒙古自治区' },
  { value: 'liaoning', label: '辽宁省' },
  { value: 'jilin', label: '吉林省' },
  { value: 'heilongjiang', label: '黑龙江省' },
  { value: 'shanghai', label: '上海市' },
  { value: 'jiangsu', label: '江苏省' },
  { value: 'zhejiang', label: '浙江省' },
  { value: 'anhui', label: '安徽省' },
  { value: 'fujian', label: '福建省' },
  { value: 'jiangxi', label: '江西省' },
  { value: 'shandong', label: '山东省' },
  { value: 'henan', label: '河南省' },
  { value: 'hubei', label: '湖北省' },
  { value: 'hunan', label: '湖南省' },
  { value: 'guangdong', label: '广东省' },
  { value: 'guangxi', label: '广西壮族自治区' },
  { value: 'hainan', label: '海南省' },
  { value: 'chongqing', label: '重庆市' },
  { value: 'sichuan', label: '四川省' },
  { value: 'guizhou', label: '贵州省' },
  { value: 'yunnan', label: '云南省' },
  { value: 'xizang', label: '西藏自治区' },
  { value: 'shaanxi', label: '陕西省' },
  { value: 'gansu', label: '甘肃省' },
  { value: 'qinghai', label: '青海省' },
  { value: 'ningxia', label: '宁夏回族自治区' },
  { value: 'xinjiang', label: '新疆维吾尔自治区' },
  { value: 'hongkong', label: '香港特别行政区' },
  { value: 'macao', label: '澳门特别行政区' },
  { value: 'taiwan', label: '台湾省' },
];

const getAllCityOptions = (): { value: string; label: string }[] => {
  const cityOptionsRecord: Record<string, { value: string; label: string }[]> = {
  beijing: [{ value: 'beijing', label: '北京市' }],
  tianjin: [{ value: 'tianjin', label: '天津市' }],
  hebei: [
    { value: 'shijiazhuang', label: '石家庄市' },
    { value: 'tangshan', label: '唐山市' },
    { value: 'qinhuangdao', label: '秦皇岛市' },
    { value: 'handan', label: '邯郸市' },
  ],
  shanxi: [
    { value: 'taiyuan', label: '太原市' },
    { value: 'datong', label: '大同市' },
    { value: 'changzhi', label: '长治市' },
  ],
  neimenggu: [
    { value: 'hohhot', label: '呼和浩特市' },
    { value: 'baotou', label: '包头市' },
    { value: 'chifeng', label: '赤峰市' },
  ],
  liaoning: [
    { value: 'shenyang', label: '沈阳市' },
    { value: 'dalian', label: '大连市' },
    { value: 'anshan', label: '鞍山市' },
  ],
  jilin: [
    { value: 'changchun', label: '长春市' },
    { value: 'jilin', label: '吉林市' },
    { value: 'siping', label: '四平市' },
  ],
  heilongjiang: [
    { value: 'harbin', label: '哈尔滨市' },
    { value: 'qiqihaer', label: '齐齐哈尔市' },
    { value: 'mudanjiang', label: '牡丹江市' },
  ],
  shanghai: [{ value: 'shanghai', label: '上海市' }],
  jiangsu: [
    { value: 'nanjing', label: '南京市' },
    { value: 'suzhou', label: '苏州市' },
    { value: 'wuxi', label: '无锡市' },
    { value: 'changzhou', label: '常州市' },
  ],
  zhejiang: [
    { value: 'hangzhou', label: '杭州市' },
    { value: 'ningbo', label: '宁波市' },
    { value: 'wenzhou', label: '温州市' },
    { value: 'jiaxing', label: '嘉兴市' },
  ],
  anhui: [
    { value: 'hefei', label: '合肥市' },
    { value: 'wuhu', label: '芜湖市' },
    { value: 'bengbu', label: '蚌埠市' },
  ],
  fujian: [
    { value: 'fuzhou', label: '福州市' },
    { value: 'xiamen', label: '厦门市' },
    { value: 'quanzhou', label: '泉州市' },
  ],
  jiangxi: [
    { value: 'nanchang', label: '南昌市' },
    { value: 'jingdezhen', label: '景德镇市' },
    { value: 'jiujiang', label: '九江市' },
  ],
  shandong: [
    { value: 'jinan', label: '济南市' },
    { value: 'qingdao', label: '青岛市' },
    { value: 'yantai', label: '烟台市' },
    { value: 'weifang', label: '潍坊市' },
  ],
  henan: [
    { value: 'zhengzhou', label: '郑州市' },
    { value: 'kaifeng', label: '开封市' },
    { value: 'luoyang', label: '洛阳市' },
    { value: 'pingdingshan', label: '平顶山市' },
  ],
  hubei: [
    { value: 'wuhan', label: '武汉市' },
    { value: 'xiangyang', label: '襄阳市' },
    { value: 'yichang', label: '宜昌市' },
  ],
  hunan: [
    { value: 'changsha', label: '长沙市' },
    { value: 'zhuzhou', label: '株洲市' },
    { value: 'xiangtan', label: '湘潭市' },
    { value: '衡阳', label: '衡阳市' },
  ],
  guangdong: [
    { value: 'guangzhou', label: '广州市' },
    { value: 'shenzhen', label: '深圳市' },
    { value: 'dongguan', label: '东莞市' },
    { value: 'foshan', label: '佛山市' },
  ],
  guangxi: [
    { value: 'nanning', label: '南宁市' },
    { value: 'liuzhou', label: '柳州市' },
    { value: 'guilin', label: '桂林市' },
  ],
  hainan: [
    { value: 'haikou', label: '海口市' },
    { value: 'sanya', label: '三亚市' },
  ],
  chongqing: [{ value: 'chongqing', label: '重庆市' }],
  sichuan: [
    { value: 'chengdu', label: '成都市' },
    { value: 'mianyang', label: '绵阳市' },
    { value: 'deyang', label: '德阳市' },
    { value: 'zigong', label: '自贡市' },
  ],
  guizhou: [
    { value: 'guiyang', label: '贵阳市' },
    { value: 'zunyi', label: '遵义市' },
    { value: 'anshun', label: '安顺市' },
  ],
  yunnan: [
    { value: 'kunming', label: '昆明市' },
    { value: 'dali', label: '大理市' },
    { value: 'lijiang', label: '丽江市' },
  ],
  xizang: [
    { value: 'lhasa', label: '拉萨市' },
    { value: 'shigatse', label: '日喀则市' },
  ],
  shaanxi: [
    { value: 'xian', label: '西安市' },
    { value: 'baoji', label: '宝鸡市' },
    { value: 'hanzhong', label: '汉中市' },
  ],
  gansu: [
    { value: 'lanzhou', label: '兰州市' },
    { value: 'tianshui', label: '天水市' },
    { value: 'jiayuguan', label: '嘉峪关市' },
  ],
  qinghai: [
    { value: 'xining', label: '西宁市' },
    { value: 'haidong', label: '海东市' },
  ],
  ningxia: [
    { value: 'yinchuan', label: '银川市' },
    { value: 'shizuishan', label: '石嘴山市' },
    { value: 'wuzhong', label: '吴忠市' },
  ],
  xinjiang: [
    { value: 'urumqi', label: '乌鲁木齐市' },
    { value: 'kashgar', label: '喀什市' },
    { value: 'korla', label: '库尔勒市' },
  ],
  hongkong: [{ value: 'hongkong', label: '香港' }],
  macao: [{ value: 'macao', label: '澳门' }],
  taiwan: [
    { value: 'taipei', label: '台北市' },
    { value: 'kaohsiung', label: '高雄市' },
    { value: 'taichung', label: '台中市' },
  ],
};
  return Object.values(cityOptionsRecord).flat();
};

function ClientList() {
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [disableModalVisible, setDisableModalVisible] = useState(false);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [disableForm] = Form.useForm();
  const [approvalForm] = Form.useForm();
  const [enableForm] = Form.useForm();
  const [selectedProvince, setSelectedProvince] = useState('');
  const [adminOptions, setAdminOptions] = useState<AdminOption[]>([]);

  const { user } = useAuthStore();
  const role = user?.role;
  const roleCode = typeof role === 'object' && role !== null ? (role as any).code : (role || '');
  
  const isSuperAdmin = roleCode.includes('super_admin') || roleCode.includes('总管理员');
  const isMainAdmin = roleCode.includes('main_admin') || roleCode.includes('主管理员');
  const isSubAdmin = roleCode.includes('sub_admin') || roleCode.includes('分管理员');
  const isGeneralAdmin = roleCode.includes('admin') && !isSuperAdmin && !isMainAdmin && !isSubAdmin;
  
  const needsApproval = isSubAdmin;
  const hasEditPermission = isSuperAdmin || isMainAdmin || isSubAdmin;
  const hasViewHiddenPermission = isSuperAdmin || (user?.permissions || []).includes('client_view_hidden');
  const hasDisablePermission = isSuperAdmin || isMainAdmin || (user?.permissions || []).includes('client_disable');
  const hasAssignPermission = isSuperAdmin || (user?.permissions || []).includes('client_assign');

  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterRegion, setFilterRegion] = useState<string>('');
  const [filterScale, setFilterScale] = useState<string>('');
  const [filterAssignedTo, setFilterAssignedTo] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'list' | 'approval'>('list');

  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    loadClients();
    setAdminOptions(getAdminOptions(roleCode));
  }, []);

  const loadClients = async () => {
    try {
      const response = await fetch('/api/shared/clients');
      const result = await response.json();
      if (result.success) {
        setClients(result.data);
      }
    } catch {
      const clientsKey = 'server_clients';
      const storedClients = localStorage.getItem(clientsKey);
      if (storedClients) {
        try {
          setClients(JSON.parse(storedClients));
        } catch {}
      }
    }
  };

  const updateClients = (newClients: Client[] | ((prev: Client[]) => Client[])) => {
    if (typeof newClients === 'function') {
      setClients(prev => {
        const result = newClients(prev);
        localStorage.setItem('server_clients', JSON.stringify(result));
        fetch('/api/shared/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result)
        });
        return result;
      });
    } else {
      setClients(newClients);
      localStorage.setItem('server_clients', JSON.stringify(newClients));
      fetch('/api/shared/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClients)
      });
    }
  };

  const [editApprovals, setEditApprovals] = useState<EditApproval[]>([]);

  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([]);

  const filteredClients = clients.filter(c => {
    if (searchText && !c.name.includes(searchText) && !c.contactName.includes(searchText)) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterRegion && c.region !== filterRegion) return false;
    if (filterScale && c.scale !== filterScale) return false;
    if (filterAssignedTo && c.assignedTo !== filterAssignedTo) return false;
    if ((isMainAdmin || isSubAdmin || isGeneralAdmin) && c.assignedTo !== user?.id && c.status !== 'pending') return false;
    if ((isMainAdmin || isSubAdmin || isGeneralAdmin) && !hasAssignPermission && c.status === 'pending') return false;
    return true;
  });

  const handleCreate = () => {
    setEditMode(false);
    setSelectedClient(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleView = (record: Client) => {
    setSelectedClient(record);
    loadOperationLogs(record.id);
    setViewModalVisible(true);
  };

  const handleEdit = (record: Client) => {
    if (!hasEditPermission) {
      message.warning('您没有编辑客户信息的权限');
      return;
    }
    
    if (needsApproval) {
      Modal.confirm({
        title: '编辑客户信息',
        content: '您的角色需要审批，编辑信息将提交审批，审批通过后生效。是否继续？',
        okText: '继续',
        cancelText: '取消',
        onOk: () => {
          setSelectedClient(record);
          setEditMode(true);
          let expireDateValue: any = undefined;
          if (record.expireDate && record.expireDate !== '-' && record.expireDate.includes('-')) {
            const parts = record.expireDate.split('-');
            if (parts.length === 2) {
              expireDateValue = [new Date(parts[0]), new Date(parts[1])];
            }
          }
          form.setFieldsValue({
            name: record.name,
            contactName: record.contactName,
            phone: record.phone,
            password: record.password,
            province: record.province,
            city: record.city,
            scale: record.scale,
            role: record.role,
            expireDate: expireDateValue,
          });
          setSelectedProvince(record.province || '');
          setModalVisible(true);
        }
      });
    } else {
      setSelectedClient(record);
      setEditMode(true);
      let expireDateValue: any = undefined;
      if (record.expireDate && record.expireDate !== '-' && record.expireDate.includes('-')) {
        const parts = record.expireDate.split('-');
        if (parts.length === 2) {
          expireDateValue = [new Date(parts[0]), new Date(parts[1])];
        }
      }
      form.setFieldsValue({
        name: record.name,
        contactName: record.contactName,
        phone: record.phone,
        password: record.password,
        province: record.province,
        city: record.city,
        scale: record.scale,
        role: record.role,
        expireDate: expireDateValue,
      });
      setSelectedProvince(record.province || '');
      setModalVisible(true);
    }
  };

  const handleAssign = (record: Client) => {
    setSelectedClient(record);
    assignForm.resetFields();
    setAssignModalVisible(true);
  };

  const handleDisable = (record: Client) => {
    setSelectedClient(record);
    disableForm.resetFields();
    setDisableModalVisible(true);
  };

  const handleEnable = (record: Client) => {
    Modal.info({
      title: '启用客户',
      content: (
        <div>
          <p style={{ marginBottom: 16 }}>确定要启用客户"{record.name}"吗？启用后客户可正常登录使用。</p>
          <Form layout="vertical" form={enableForm}>
            <Form.Item
              name="role"
              label="联系人角色"
              rules={[{ required: true, message: '请选择联系人角色' }]}
            >
              <Select placeholder="请选择联系人角色">
                <Option value="super_admin">总管理员</Option>
                <Option value="main_admin">主管理员</Option>
              </Select>
            </Form.Item>
          </Form>
        </div>
      ),
      okText: '确认启用',
      cancelText: '取消',
      width: 450,
      onOk: async () => {
        try {
          const values = await enableForm.validateFields();
          updateClients(prev => prev.map(c =>
            c.id === record.id ? { 
              ...c, 
              status: 'active', 
              disableReason: undefined, 
              disabledAt: undefined, 
              disabledBy: undefined,
              role: values.role as 'super_admin' | 'main_admin'
            } : c
          ));
          message.success(`${record.name} 已启用`);
        } catch {}
      }
    });
  };

  const handleViewLogs = (record: Client) => {
    setSelectedClient(record);
    loadOperationLogs(record.id);
    setLogModalVisible(true);
  };

  const loadOperationLogs = (clientId: string) => {
    const logs: OperationLog[] = [
      { id: '1', time: '2026-07-06 09:30:00', operator: '客户登录', action: '登录', detail: '客户管理员登录系统', ip: '192.168.1.100' },
      { id: '2', time: '2026-07-05 14:20:00', operator: '主管理员A', action: '编辑信息', detail: '修改联系电话', ip: '10.0.0.1' },
      { id: '3', time: '2026-01-16 09:00:00', operator: '总管理员', action: '分配客户', detail: '分配给主管理员A', ip: '10.0.0.1' },
      { id: '4', time: '2026-01-15 11:00:00', operator: '总管理员', action: '创建客户', detail: '创建客户账号', ip: '10.0.0.1' },
    ];
    setOperationLogs(logs);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editMode && selectedClient) {
        if (needsApproval) {
          const changes: { field: string; oldValue: string; newValue: string }[] = [];
          if (values.name !== selectedClient.name) changes.push({ field: '公司名称', oldValue: selectedClient.name, newValue: values.name });
          if (values.contactName !== selectedClient.contactName) changes.push({ field: '联系人姓名', oldValue: selectedClient.contactName, newValue: values.contactName });
          if (values.phone !== selectedClient.phone) changes.push({ field: '手机号', oldValue: selectedClient.phone, newValue: values.phone });
          if (values.password !== selectedClient.password) changes.push({ field: '登录密码', oldValue: '******', newValue: '******' });
          if (values.scale !== selectedClient.scale) changes.push({ field: '企业规模', oldValue: selectedClient.scale, newValue: values.scale });
          if (values.role !== selectedClient.role) changes.push({ field: '联系人角色', oldValue: selectedClient.role === 'super_admin' ? '总管理员' : '主管理员', newValue: values.role === 'super_admin' ? '总管理员' : '主管理员' });
          
          const newApproval: EditApproval = {
            id: Date.now().toString(),
            clientId: selectedClient.id,
            clientName: selectedClient.name,
            applicant: user?.username || user?.realName || '管理员',
            applyTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
            status: 'pending',
            changes,
          };
          setEditApprovals(prev => [newApproval, ...prev]);
          message.success('已提交审批，请等待审批通过后生效');
        } else {
          updateClients(prev => prev.map(c =>
              c.id === selectedClient.id ? {
                ...c,
                name: values.name,
                contactName: values.contactName,
                phone: values.phone,
                password: values.password,
                province: values.province,
                city: values.city,
                region: c.region,
                scale: values.scale,
                expireDate: values.expireDate && Array.isArray(values.expireDate) && values.expireDate.length === 2 
                  ? `${(values.expireDate[0] as any).toLocaleDateString ? (values.expireDate[0] as Date).toLocaleDateString('zh-CN') : (values.expireDate[0] as any).format('YYYY/M/D')}-${(values.expireDate[1] as any).toLocaleDateString ? (values.expireDate[1] as Date).toLocaleDateString('zh-CN') : (values.expireDate[1] as any).format('YYYY/M/D')}` 
                  : c.expireDate,
                role: values.role || c.role,
              } : c
            ));
          message.success('客户信息修改成功，已同步到客户端登录、客户端组织架构');
        }
      } else {
        const newClient: Client = {
          id: Date.now().toString(),
          name: values.name,
          contactName: values.contactName,
          phone: values.phone,
          password: values.password,
          status: isSuperAdmin ? 'pending' : 'assigned',
          employeeCount: 0,
          employeeEnabledCount: 0,
          employeeDisabledCount: 0,
          createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
          province: values.province,
          city: values.city,
          region: values.region || '华东地区',
          scale: values.scale || '',
          assignedTo: isSuperAdmin ? '' : user?.id || '',
          assignedToName: isSuperAdmin ? '' : user?.username || user?.realName || '',
          expireDate: values.expireDate && Array.isArray(values.expireDate) && values.expireDate.length === 2 
            ? `${(values.expireDate[0] as any).toLocaleDateString ? (values.expireDate[0] as Date).toLocaleDateString('zh-CN') : (values.expireDate[0] as any).format('YYYY/M/D')}-${(values.expireDate[1] as any).toLocaleDateString ? (values.expireDate[1] as Date).toLocaleDateString('zh-CN') : (values.expireDate[1] as any).format('YYYY/M/D')}` 
            : '-',
          lastLogin: '-',
          healthScore: 0,
          role: values.role || 'super_admin',
        };
        updateClients(prev => [newClient, ...prev]);
        
        request.post('/auth/oauth/register-tenant', {
          id: newClient.id,
          name: newClient.name,
          status: newClient.status,
          settings: {}
        }).catch(() => {});
        
        message.success(isSuperAdmin ? '客户创建成功，请及时分配管理员' : '客户创建成功，已自动分配给您');
      }
      setModalVisible(false);
      form.resetFields();
      setSelectedProvince('');
    } catch (error) {
      console.error('表单验证失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignOk = async () => {
    try {
      const values = await assignForm.validateFields();
      if (selectedClient) {
        const admin = adminOptions.find(a => a.value === values.assignedTo);
        updateClients(prev => prev.map(c =>
          c.id === selectedClient.id ? {
            ...c,
            assignedTo: values.assignedTo,
            assignedToName: admin?.label || '',
            assignedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
            status: c.status === 'pending' ? 'assigned' : c.status,
          } : c
        ));
        message.success('客户分配成功');
      }
      setAssignModalVisible(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleDisableOk = async () => {
    try {
      const values = await disableForm.validateFields();
      if (selectedClient) {
        const reasonLabel = disableReasons.find(r => r.value === values.reason)?.label || '其他';
        updateClients(prev => prev.map(c =>
          c.id === selectedClient.id ? {
            ...c,
            status: 'inactive',
            disableReason: reasonLabel,
            disabledAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
            disabledBy: '总管理员',
          } : c
        ));
        message.success('客户已禁用');
      }
      setDisableModalVisible(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleApproval = (approval: EditApproval, action: 'approve' | 'reject') => {
    approvalForm.resetFields();
    Modal.confirm({
      title: action === 'approve' ? '通过审批' : '驳回审批',
      content: `确定要${action === 'approve' ? '通过' : '驳回'}客户"${approval.clientName}"的编辑申请吗？`,
      okText: action === 'approve' ? '通过' : '驳回',
      okButtonProps: { danger: action === 'reject' },
      cancelText: '取消',
      onOk: () => {
        setEditApprovals(prev => prev.map(a =>
          a.id === approval.id ? {
            ...a,
            status: action === 'approve' ? 'approved' : 'rejected',
            reviewer: '总管理员',
            reviewTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
          } : a
        ));
        
        if (action === 'approve') {
          updateClients(prev => prev.map(c => {
            if (c.id !== approval.clientId) return c;
            const updatedClient = { ...c };
            approval.changes.forEach(change => {
              switch (change.field) {
                case '公司名称':
                  updatedClient.name = change.newValue;
                  break;
                case '联系人姓名':
                  updatedClient.contactName = change.newValue;
                  break;
                case '手机号':
                  updatedClient.phone = change.newValue;
                  break;
                case '登录密码':
                  updatedClient.password = change.newValue;
                  break;
                case '区域':
                  updatedClient.region = change.newValue;
                  break;
                case '企业规模':
                  updatedClient.scale = change.newValue;
                  break;
                case '联系人角色':
                  updatedClient.role = change.newValue === '总管理员' ? 'super_admin' : 'main_admin';
                  break;
              }
            });
            return updatedClient;
          }));
        }
        
        message.success(`已${action === 'approve' ? '通过' : '驳回'}审批`);
      }
    });
  };

  const clientColumns: ColumnsType<Client> = [
    {
      title: '公司名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <a>{text}</a>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Badge status={statusMap[status]?.badge as any} text={statusMap[status]?.text} />
      ),
    },
    {
      title: '联系人',
      dataIndex: 'contactName',
      key: 'contactName',
      render: (text: string, record: Client) => {
        if (!hasViewHiddenPermission) return '******';
        const roleTag = record.role === 'super_admin' 
          ? <span style={{ marginLeft: 4, fontSize: 10, color: '#f5222d', fontWeight: 'bold' }}>总</span>
          : record.role === 'main_admin'
          ? <span style={{ marginLeft: 4, fontSize: 10, color: '#faad14', fontWeight: 'bold' }}>主</span>
          : null;
        return <span>{text}{roleTag}</span>;
      },
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      render: (text: string) => hasViewHiddenPermission ? text : '******',
    },
    {
      title: '区域',
      dataIndex: 'region',
      key: 'region',
      render: (text: string) => (
        <span><EnvironmentOutlined style={{ marginRight: 4, color: '#1890ff' }} />{text}</span>
      ),
    },
    {
      title: '规模',
      dataIndex: 'scale',
      key: 'scale',
      render: (text: string) => <Tag>{text}</Tag>,
    },
    ...(isSuperAdmin ? [{
      title: '分配给',
      dataIndex: 'assignedToName',
      key: 'assignedToName',
      render: (text: string) => text || <Text type="secondary">未分配</Text>,
    }] : []),
    {
      title: '到期日期',
      dataIndex: 'expireDate',
      key: 'expireDate',
      render: (text: string) => {
        if (text === '-' || !text) return <Text type="secondary">-</Text>;
        const dateParts = text.split('-');
        const endDateStr = dateParts.length > 1 ? dateParts[1].trim() : text;
        const expireDate = new Date(endDateStr);
        const now = new Date();
        const diffDays = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) {
          return <span style={{ color: '#f5222d', fontWeight: 'bold' }}>已过期</span>;
        } else if (diffDays <= 30) {
          return <span style={{ color: '#faad14', fontWeight: 'bold' }}>{text} (剩余{diffDays}天)</span>;
        }
        return text;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record: Client) => (
        <Space size="small">
          <Tooltip title="查看">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)} />
          </Tooltip>
          {hasEditPermission && (
            <Tooltip title="编辑">
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
            </Tooltip>
          )}
          {hasAssignPermission && record.status === 'pending' && (
            <Tooltip title="分配">
              <Button type="link" size="small" icon={<UserSwitchOutlined />} onClick={() => handleAssign(record)} />
            </Tooltip>
          )}
          {hasDisablePermission && record.status !== 'inactive' && (
            <Tooltip title="禁用">
              <Button type="link" size="small" danger icon={<StopOutlined />} onClick={() => handleDisable(record)} />
            </Tooltip>
          )}
          {hasDisablePermission && record.status === 'inactive' && (
            <Tooltip title="启用">
              <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleEnable(record)} />
            </Tooltip>
          )}
          {isSuperAdmin && (
            <Tooltip title="操作日志">
              <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => handleViewLogs(record)} />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  const approvalColumns: ColumnsType<EditApproval> = [
    { title: '客户名称', dataIndex: 'clientName', key: 'clientName', render: (t: string) => <a>{t}</a> },
    { title: '申请人', dataIndex: 'applicant', key: 'applicant' },
    { title: '申请时间', dataIndex: 'applyTime', key: 'applyTime' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (status: string) => {
        if (status === 'pending') return <Badge status="processing" text="待审批" />;
        if (status === 'approved') return <Badge status="success" text="已通过" />;
        return <Badge status="error" text="已驳回" />;
      }
    },
    {
      title: '修改内容', key: 'changes',
      render: (_, record: EditApproval) => (
        <Text type="secondary">{record.changes.length}项</Text>
      )
    },
    { title: '审批人', dataIndex: 'reviewer', key: 'reviewer', render: (t: string) => t || '-' },
    { title: '审批时间', dataIndex: 'reviewTime', key: 'reviewTime', render: (t: string) => t || '-' },
    {
      title: '操作', key: 'action',
      render: (_, record: EditApproval) => (
        record.status === 'pending' ? (
          <Space>
            <Button type="link" size="small" icon={<CheckOutlined />} style={{ color: '#52c41a' }}
              onClick={() => handleApproval(record, 'approve')}>通过</Button>
            <Button type="link" size="small" danger icon={<CloseOutlined />}
              onClick={() => handleApproval(record, 'reject')}>驳回</Button>
          </Space>
        ) : (
          <Button type="link" size="small" icon={<EyeOutlined />}>查看</Button>
        )
      )
    }
  ];

  const getStatusCount = (status: string) => clients.filter(c => c.status === status).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>客户管理</Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>创建客户</Button>
        </Space>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 8]} align="middle">
          <Col span={6}>
            <Search
              placeholder="搜索公司名称或联系人"
              allowClear
              onSearch={setSearchText}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col span={3}>
            <Select
              placeholder="状态筛选"
              allowClear
              style={{ width: '100%' }}
              value={filterStatus || undefined}
              onChange={setFilterStatus}
            >
              {hasAssignPermission && <Option value="pending">待分配</Option>}
              <Option value="assigned">已分配</Option>
              <Option value="active">启用中</Option>
              <Option value="inactive">已禁用</Option>
              <Option value="trial">试用中</Option>
            </Select>
          </Col>
          <Col span={3}>
            <Select
              placeholder="区域筛选"
              allowClear
              style={{ width: '100%' }}
              value={filterRegion || undefined}
              onChange={setFilterRegion}
            >
              {regionOptions.map(r => <Option key={r} value={r}>{r}</Option>)}
            </Select>
          </Col>
          <Col span={3}>
            <Select
              placeholder="规模筛选"
              allowClear
              style={{ width: '100%' }}
              value={filterScale || undefined}
              onChange={setFilterScale}
            >
              {['1-50人', '51-200人', '201-1000人', '1000人以上'].map(s => <Option key={s} value={s}>{s}</Option>)}
            </Select>
          </Col>
          <Col span={3}>
            <Select
              placeholder="分配人"
              allowClear
              style={{ width: '100%' }}
              value={filterAssignedTo || undefined}
              onChange={setFilterAssignedTo}
            >
              {adminOptions.map(a => <Option key={a.value} value={a.value}>{a.label}</Option>)}
            </Select>
          </Col>
          <Col span={6}>
            <Space>
              <Tag color="blue" onClick={() => { setFilterStatus(''); setFilterRegion(''); setFilterScale(''); setFilterAssignedTo(''); setSearchText(''); }} style={{ cursor: 'pointer' }}>
                重置筛选
              </Tag>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card bodyStyle={{ padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as 'list' | 'approval')}
          items={[
            {
              key: 'list',
              label: <span><TeamOutlined /> 客户列表 ({filteredClients.length})</span>,
              children: (
                <Table
                  columns={clientColumns}
                  dataSource={filteredClients}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                />
              )
            },
            {
              key: 'approval',
              label: <span><SafetyOutlined /> 编辑审批 ({editApprovals.filter(a => a.status === 'pending').length})</span>,
              children: (
                <Table
                  columns={approvalColumns}
                  dataSource={editApprovals}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  style={{ padding: '0 16px 16px' }}
                />
              )
            }
          ]}
        />
      </Card>

      <Modal
        title={editMode ? '编辑客户' : '创建客户'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setSelectedProvince('');
        }}
        confirmLoading={loading}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="公司名称"
                rules={[{ required: true, message: '请输入公司名称' }]}
              >
                <Input placeholder="请输入公司名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contactName"
                label="联系人姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
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
            </Col>
            <Col span={12}>
              <Form.Item
                name="password"
                label="登录密码"
                rules={[
                  { required: true, message: '请输入登录密码' },
                  { min: 6, max: 20, message: '密码长度6-20位' }
                ]}
              >
                <Input.Password placeholder="请输入登录密码" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="province" label="所属省份">
                <Select
                  showSearch
                  placeholder="请选择省份"
                  optionFilterProp="children"
                  onChange={(value) => {
                    setSelectedProvince(value);
                    form.setFieldsValue({ city: undefined });
                  }}
                >
                  {provinceOptions.map(p => <Option key={p.value} value={p.value}>{p.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="city" label="所属城市">
                <Select 
                  showSearch 
                  placeholder="请选择城市（可手动输入）" 
                  optionFilterProp="children"
                  allowClear
                  filterOption={(input, option) => 
                    (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                  notFoundContent="未找到匹配城市，可直接输入"
                >
                  {getAllCityOptions().map(c => <Option key={c.value} value={c.value}>{c.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="scale" label="企业规模">
                <Input placeholder="请输入企业规模，如：100人、200-500人" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="expireDate" 
                label="使用有效期"
                rules={[{ required: true, message: '请选择使用有效期' }]}
              >
                <RangePicker 
                  style={{ width: '100%' }} 
                  placeholder={['开始日期', '结束日期']} 
                  format="YYYY年M月D日"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="联系人角色"
                rules={[{ required: true, message: '请选择联系人角色' }]}
              >
                <Select placeholder="请选择联系人角色">
                  <Option value="super_admin">总管理员</Option>
                  <Option value="main_admin">主管理员</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

        </Form>
      </Modal>

      <Modal
        title="客户详情"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedClient && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 8, background: '#1890ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginRight: 16, color: '#fff', fontSize: 22, fontWeight: 'bold'
              }}>
                {selectedClient.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 'bold' }}>{selectedClient.name}</div>
                <Space style={{ marginTop: 4 }}>
                  <Badge status={statusMap[selectedClient.status]?.badge as any} text={statusMap[selectedClient.status]?.text} />
                  <Tag color="blue">{selectedClient.scale}</Tag>
                </Space>
              </div>
            </div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="联系人">
                {hasViewHiddenPermission ? (
                  <span>
                    {selectedClient.contactName}
                    {selectedClient.role === 'super_admin' && <span style={{ marginLeft: 4, fontSize: 10, color: '#f5222d', fontWeight: 'bold' }}>总</span>}
                    {selectedClient.role === 'main_admin' && <span style={{ marginLeft: 4, fontSize: 10, color: '#faad14', fontWeight: 'bold' }}>主</span>}
                  </span>
                ) : '******'}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">{hasViewHiddenPermission ? selectedClient.phone : '******'}</Descriptions.Item>
              <Descriptions.Item label="所属区域">{selectedClient.region}</Descriptions.Item>
              <Descriptions.Item label="所属省份">{provinceOptions.find(p => p.value === selectedClient.province)?.label || '-'}</Descriptions.Item>
              <Descriptions.Item label="所属城市">{getAllCityOptions().find(c => c.value === selectedClient.city)?.label || '-'}</Descriptions.Item>
              <Descriptions.Item label="企业规模">{selectedClient.scale || '-'}</Descriptions.Item>
              <Descriptions.Item label="员工数">{selectedClient.employeeCount}人</Descriptions.Item>
              <Descriptions.Item label="启用人数">{selectedClient.employeeEnabledCount}人</Descriptions.Item>
              <Descriptions.Item label="禁用人数">{selectedClient.employeeDisabledCount}人</Descriptions.Item>
              <Descriptions.Item label="分配给">{selectedClient.assignedToName || '未分配'}</Descriptions.Item>
              <Descriptions.Item label="健康分">
                <span style={{ color: selectedClient.healthScore >= 60 ? '#52c41a' : '#f5222d', fontWeight: 'bold' }}>
                  {selectedClient.healthScore}分
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{selectedClient.createdAt}</Descriptions.Item>
              <Descriptions.Item label="到期日期">{selectedClient.expireDate}</Descriptions.Item>
              <Descriptions.Item label="最近登录">{selectedClient.lastLogin}</Descriptions.Item>
              <Descriptions.Item label="分配时间">{selectedClient.assignedAt || '-'}</Descriptions.Item>
            </Descriptions>
            {selectedClient.status === 'inactive' && (
              <>
                <Divider orientation="left" style={{ margin: '16px 0' }}>禁用信息</Divider>
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="禁用原因">{selectedClient.disableReason}</Descriptions.Item>
                  <Descriptions.Item label="禁用时间">{selectedClient.disabledAt}</Descriptions.Item>
                  <Descriptions.Item label="操作人" span={2}>{selectedClient.disabledBy}</Descriptions.Item>
                </Descriptions>
              </>
            )}
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
        title="分配客户"
        open={assignModalVisible}
        onOk={handleAssignOk}
        onCancel={() => setAssignModalVisible(false)}
        okText="确认分配"
        width={450}
      >
        {selectedClient && (
          <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 4 }}>
            <Text strong>{selectedClient.name}</Text>
            <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
              联系人：{selectedClient.contactName} | 状态：{statusMap[selectedClient.status]?.text}
            </div>
          </div>
        )}
        <Form form={assignForm} layout="vertical">
          <Form.Item
            name="assignedTo"
            label="分配给"
            rules={[{ required: true, message: '请选择分配的管理员' }]}
          >
            <Select placeholder="请选择管理员">
              {adminOptions.map(a => (
                <Option key={a.value} value={a.value}>{a.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <div style={{ fontSize: 12, color: '#999' }}>
            分配后，该管理员将负责此客户的日常服务工作
          </div>
        </Form>
      </Modal>

      <Modal
        title="禁用客户"
        open={disableModalVisible}
        onOk={handleDisableOk}
        onCancel={() => setDisableModalVisible(false)}
        okText="确认禁用"
        okButtonProps={{ danger: true }}
        width={450}
      >
        {selectedClient && (
          <div style={{ marginBottom: 16, padding: 12, background: '#fff2f0', borderRadius: 4, border: '1px solid #ffccc7' }}>
            <Text strong style={{ color: '#f5222d' }}>
              <ExclamationCircleOutlined style={{ marginRight: 8 }} />
              确定要禁用客户"{selectedClient.name}"吗？
            </Text>
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              禁用后客户将无法登录系统，所有服务将暂停
            </div>
          </div>
        )}
        <Form form={disableForm} layout="vertical">
          <Form.Item
            name="reason"
            label="禁用原因"
            rules={[{ required: true, message: '请选择禁用原因' }]}
          >
            <Select placeholder="请选择禁用原因">
              {disableReasons.map(r => (
                <Option key={r.value} value={r.value}>{r.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="补充说明">
            <Input.TextArea rows={3} placeholder="请输入补充说明（可选）" />
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
        {selectedClient && (
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">客户：</Text><Text strong>{selectedClient.name}</Text>
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
    </div>
  );
}

export default ClientList;
