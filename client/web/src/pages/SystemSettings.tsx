import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import {
  Card, Row, Col, Table, Button, Modal, Form, Input, Select,
  Tabs, Typography, Tag, Space, message, Switch, Divider, Tree,
  Upload, Checkbox, Tooltip, Badge, Alert, Popconfirm, Empty
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  UserOutlined, TeamOutlined, SafetyOutlined, SettingOutlined,
  UploadOutlined, DownloadOutlined, UserDeleteOutlined,
  UserAddOutlined, SwapOutlined, SearchOutlined,
  EyeOutlined, EyeInvisibleOutlined, HistoryOutlined,
  StopOutlined, PlayCircleOutlined,
  ApiOutlined, ExclamationCircleOutlined, FileTextOutlined,
  CheckCircleOutlined, ClockCircleOutlined, LogoutOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd/es/upload';
import type { DataNode } from 'antd/es/tree';
import { useAuthStore } from '../stores/authStore';
import { useOrgStore } from '../stores/orgStore';
import { isDemoCompany, addSharedEmployee as addSharedEmployeeApi } from '../utils/mockData';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { DirectoryTree } = Tree;

interface Employee {
  key: string;
  name: string;
  phone: string;
  email: string;
  department: string;
  departmentId: string;
  role: string;
  roleCode: string;
  status: 'active' | 'disabled' | 'resigned';
  position: string;
  joinDate: string;
  resignDate?: string;
}

interface Department {
  key: string;
  title: string;
  children?: Department[];
  isLeaf?: boolean;
}

interface PermissionItem {
  key: string;
  label: string;
  category: string;
  super_admin: boolean | 'config';
  main_admin: boolean | 'config';
  sub_admin: boolean | 'config';
  manager: boolean | 'config';
  employee: boolean;
}

const permissionItems: PermissionItem[] = [
  { key: 'dashboard_all', label: '绩效看板-全公司查看', category: '绩效看板', super_admin: true, main_admin: 'config', sub_admin: 'config', manager: false, employee: false },
  { key: 'dashboard_team', label: '绩效看板-本团队查看', category: '绩效看板', super_admin: true, main_admin: true, sub_admin: true, manager: true, employee: false },
  { key: 'dashboard_self', label: '绩效看板-仅个人', category: '绩效看板', super_admin: true, main_admin: true, sub_admin: true, manager: true, employee: true },
  { key: 'goal_company', label: '目标管理-设定公司目标', category: '目标管理', super_admin: true, main_admin: 'config', sub_admin: 'config', manager: false, employee: false },
  { key: 'goal_dept', label: '目标管理-设定部门目标', category: '目标管理', super_admin: true, main_admin: true, sub_admin: 'config', manager: false, employee: false },
  { key: 'goal_subordinate', label: '目标管理-设定下属目标', category: '目标管理', super_admin: true, main_admin: true, sub_admin: true, manager: true, employee: false },
  { key: 'goal_self', label: '目标管理-查看个人目标', category: '目标管理', super_admin: true, main_admin: true, sub_admin: true, manager: true, employee: true },
  { key: 'goal_approve', label: '目标管理-审批目标', category: '目标管理', super_admin: true, main_admin: true, sub_admin: 'config', manager: 'config', employee: false },
  { key: 'perf_create', label: '绩效考核-创建考核', category: '绩效考核', super_admin: true, main_admin: 'config', sub_admin: 'config', manager: false, employee: false },
  { key: 'perf_indicator', label: '绩效考核-设定指标', category: '绩效考核', super_admin: true, main_admin: true, sub_admin: true, manager: true, employee: false },
  { key: 'perf_confirm', label: '绩效考核-确认指标', category: '绩效考核', super_admin: true, main_admin: true, sub_admin: 'config', manager: 'config', employee: false },
  { key: 'score_confirm', label: '评分管理-数据确认', category: '评分管理', super_admin: true, main_admin: true, sub_admin: true, manager: true, employee: false },
  { key: 'score_self', label: '评分管理-自评', category: '评分管理', super_admin: true, main_admin: true, sub_admin: true, manager: true, employee: true },
  { key: 'score_superior', label: '评分管理-上级评分', category: '评分管理', super_admin: true, main_admin: true, sub_admin: true, manager: true, employee: false },
  { key: 'calibration_submit', label: '绩效校准-提交异议', category: '绩效校准', super_admin: true, main_admin: true, sub_admin: true, manager: true, employee: true },
  { key: 'calibration_handle', label: '绩效校准-处理异议', category: '绩效校准', super_admin: true, main_admin: true, sub_admin: true, manager: true, employee: false },
  { key: 'improvement_interview', label: '绩效提升-发起面谈', category: '绩效提升', super_admin: true, main_admin: true, sub_admin: true, manager: true, employee: false },
  { key: 'talent_view', label: '人才看板-查看', category: '人才发展', super_admin: true, main_admin: 'config', sub_admin: 'config', manager: 'config', employee: false },
  { key: 'evaluation_360', label: '360评价-发起/查看', category: '人才发展', super_admin: true, main_admin: 'config', sub_admin: 'config', manager: 'config', employee: false },
  { key: 'competency_manage', label: '岗位胜任力-管理', category: '人才发展', super_admin: true, main_admin: 'config', sub_admin: 'config', manager: 'config', employee: false },
];

const roleLabels: Record<string, { label: string; color: string; badge: string }> = {
  super_admin: { label: '总管理员', color: 'red', badge: '总' },
  main_admin: { label: '主管理员', color: 'orange', badge: '主' },
  sub_admin: { label: '分管理员', color: 'blue', badge: '分' },
  manager: { label: '负责人', color: 'purple', badge: '负' },
  employee: { label: '员工', color: 'default', badge: '' },
};

function SystemSettings() {
  const { user } = useAuthStore();
  const { deptTreeData, setDeptTreeData, employees, setEmployees, addDepartment, updateDepartment, addEmployee, updateEmployee, deleteEmployee, toggleEmployeeDisable, dataScope, updateDataScope, cleanUpStaleDeptKeys } = useOrgStore();
  const showDemoData = isDemoCompany(user?.tenantName || '');

  const token = localStorage.getItem('token');
  const isRealToken = token && !token.startsWith('mock-token-');

  const isAdmin = (user?.role?.code || '') === 'super_admin' || (user?.role?.code || '') === 'main_admin';

  const [activeTab, setActiveTab] = useState('org');
  const [selectedDeptKey, setSelectedDeptKey] = useState<string>('all');
  const [employeeTab, setEmployeeTab] = useState<'active' | 'disabled'>('active');
  const [modalVisible, setModalVisible] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [modalType, setModalType] = useState<'addEmployee' | 'addDept' | 'editDept' | 'batchDept' | 'import' | 'permission'>('addEmployee');
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('main_admin');
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({
    super_admin: permissionItems.map(p => p.key),
    main_admin: permissionItems.filter(p => p.main_admin === true || p.key === 'dashboard_team' || p.key === 'dashboard_self' || p.key === 'goal_subordinate' || p.key === 'goal_self' || p.key === 'perf_indicator' || p.key === 'perf_confirm' || p.key === 'score_confirm' || p.key === 'score_self' || p.key === 'score_superior' || p.key === 'calibration_submit' || p.key === 'calibration_handle' || p.key === 'improvement_interview').map(p => p.key),
    sub_admin: permissionItems.filter(p => p.key === 'dashboard_team' || p.key === 'dashboard_self' || p.key === 'goal_subordinate' || p.key === 'goal_self' || p.key === 'perf_indicator' || p.key === 'score_confirm' || p.key === 'score_self' || p.key === 'score_superior' || p.key === 'calibration_submit' || p.key === 'calibration_handle' || p.key === 'improvement_interview').map(p => p.key),
    manager: permissionItems.filter(p => p.key === 'dashboard_team' || p.key === 'dashboard_self' || p.key === 'goal_subordinate' || p.key === 'goal_self' || p.key === 'perf_indicator' || p.key === 'score_confirm' || p.key === 'score_self' || p.key === 'score_superior' || p.key === 'calibration_submit' || p.key === 'calibration_handle' || p.key === 'improvement_interview').map(p => p.key),
    employee: permissionItems.filter(p => p.employee === true).map(p => p.key),
  });
  

  useEffect(() => {
    const validDeptKeys = getAllDeptKeys(deptTreeData);
    cleanUpStaleDeptKeys(validDeptKeys);
  }, [deptTreeData, cleanUpStaleDeptKeys]);

  useEffect(() => {
    if (showDemoData && deptTreeData.length === 0) {
      setDeptTreeData([
        {
          key: '1',
          title: '总经办',
          children: [
            { key: '1-1', title: '总裁办', isLeaf: true },
            { key: '1-2', title: '战略部', isLeaf: true },
          ]
        },
        {
          key: '2',
          title: '销售部',
          children: [
            { key: '2-1', title: '销售一组', isLeaf: true },
            { key: '2-2', title: '销售二组', isLeaf: true },
            { key: '2-3', title: '客户成功组', isLeaf: true },
          ]
        },
        {
          key: '3',
          title: '研发部',
          children: [
            { key: '3-1', title: '前端组', isLeaf: true },
            { key: '3-2', title: '后端组', isLeaf: true },
            { key: '3-3', title: '测试组', isLeaf: true },
          ]
        },
        {
          key: '4',
          title: '人力资源部',
          children: [
            { key: '4-1', title: '招聘组', isLeaf: true },
            { key: '4-2', title: '薪酬绩效组', isLeaf: true },
          ]
        },
        {
          key: '5',
          title: '财务部',
          isLeaf: true,
        },
      ]);
    }
    if (showDemoData && employees.length === 0) {
      setEmployees([
        { key: '1', name: '张总', phone: '13800138001', email: 'ceo@company.com', department: '总裁办', departmentId: '1-1', role: '总管理员', roleCode: 'super_admin', status: 'active', position: 'CEO', joinDate: '2020-01-15' },
        { key: '2', name: '李总监', phone: '13800138002', email: 'sales@company.com', department: '销售部', departmentId: '2', role: '主管理员', roleCode: 'main_admin', status: 'active', position: '销售总监', joinDate: '2020-03-20' },
        { key: '3', name: '王经理', phone: '13800138003', email: 'wang@company.com', department: '销售一组', departmentId: '2-1', role: '负责人', roleCode: 'manager', status: 'active', position: '销售经理', joinDate: '2021-01-10' },
        { key: '4', name: '赵经理', phone: '13800138004', email: 'zhao@company.com', department: '研发部', departmentId: '3', role: '分管理员', roleCode: 'sub_admin', status: 'active', position: '技术总监', joinDate: '2020-05-08' },
        { key: '5', name: '陈工程师', phone: '13800138005', email: 'chen@company.com', department: '前端组', departmentId: '3-1', role: '员工', roleCode: 'employee', status: 'active', position: '高级前端工程师', joinDate: '2021-06-15' },
        { key: '6', name: '刘工程师', phone: '13800138006', email: 'liu@company.com', department: '后端组', departmentId: '3-2', role: '员工', roleCode: 'employee', status: 'active', position: '后端工程师', joinDate: '2022-01-20' },
        { key: '7', name: '周HR', phone: '13800138007', email: 'hr@company.com', department: '薪酬绩效组', departmentId: '4-2', role: '分管理员', roleCode: 'sub_admin', status: 'active', position: 'HRBP', joinDate: '2020-08-12' },
        { key: '8', name: '吴销售', phone: '13800138008', email: 'wu@company.com', department: '销售一组', departmentId: '2-1', role: '员工', roleCode: 'employee', status: 'active', position: '销售代表', joinDate: '2022-03-01' },
        { key: '9', name: '郑销售', phone: '13800138009', email: 'zheng@company.com', department: '销售二组', departmentId: '2-2', role: '员工', roleCode: 'employee', status: 'active', position: '销售代表', joinDate: '2022-05-10' },
        { key: '10', name: '孙测试', phone: '13800138010', email: 'sun@company.com', department: '测试组', departmentId: '3-3', role: '员工', roleCode: 'employee', status: 'active', position: '测试工程师', joinDate: '2021-11-20' },
        { key: '11', name: '前员工A', phone: '13800138011', email: 'olda@company.com', department: '销售一组', departmentId: '2-1', role: '员工', roleCode: 'employee', status: 'resigned', position: '销售代表', joinDate: '2021-01-01', resignDate: '2023-06-30' },
        { key: '12', name: '前员工B', phone: '13800138012', email: 'oldb@company.com', department: '前端组', departmentId: '3-1', role: '员工', roleCode: 'employee', status: 'resigned', position: '前端工程师', joinDate: '2020-06-15', resignDate: '2024-01-15' },
      ]);
    }
  }, []);

  const getDeptOptions = (depts: Department[], prefix: string = ''): { value: string; label: string }[] => {
    let options: { value: string; label: string }[] = [];
    depts.forEach(dept => {
      const label = prefix ? `${prefix}/${dept.title}` : dept.title;
      options.push({ value: dept.key, label });
      if (dept.children && dept.children.length > 0) {
        options = options.concat(getDeptOptions(dept.children, label));
      }
    });
    return options;
  };

  const getAllDeptKeys = (depts: Department[]): string[] => {
    let keys: string[] = [];
    depts.forEach(dept => {
      keys.push(dept.key);
      if (dept.children && dept.children.length > 0) {
        keys = keys.concat(getAllDeptKeys(dept.children));
      }
    });
    return keys;
  };

  useEffect(() => {
    setExpandedKeys(getAllDeptKeys(deptTreeData));
  }, [deptTreeData]);

  // 从后端 API 同步员工数据
  useEffect(() => {
    const syncEmployeesFromBackend = async () => {
      try {
        const response = await axios.get('/api/v1/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const backendUsers = response.data.data.list || [];
        const roleMap: Record<string, { label: string; color: string }> = {
          super_admin: { label: '总管理员', color: 'gold' },
          main_admin: { label: '主管理员', color: 'geekblue' },
          sub_admin: { label: '分管理员', color: 'cyan' },
          manager: { label: '负责人', color: 'purple' },
          employee: { label: '员工', color: 'default' },
          admin: { label: '管理员', color: 'gold' },
          hr: { label: 'HR经理', color: 'geekblue' },
        };
        const mappedEmployees: Employee[] = backendUsers.map((u: any) => ({
          key: u.id,
          name: u.realName || u.username,
          phone: u.phone || '',
          email: u.email || '',
          department: u.department?.name || '',
          departmentId: u.departmentId || '',
          role: u.role ? (roleMap[u.role.code]?.label || u.role.name) : '员工',
          roleCode: u.role?.code || 'employee',
          status: u.status === 'active' ? 'active' : 'disabled',
          position: u.employee?.position || '',
          joinDate: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '',
        }));
        if (mappedEmployees.length > 0) {
          setEmployees(mappedEmployees);
        }
      } catch (error) {
        // API 调用失败时保留 localStorage 数据
      }
    };
    if (isRealToken) {
      syncEmployeesFromBackend();
    }
  }, [isRealToken]);

  const filteredEmployees = useMemo(() => {
    let result = employees.filter(e => {
      if (employeeTab === 'active') {
        return e.status === 'active';
      }
      return e.status === 'disabled';
    });

    const userDeptId = employees.find(e => e.phone === user?.phone)?.departmentId;
    if (!isAdmin && userDeptId) {
      if (selectedDeptKey === 'all') {
        result = result.filter(e => e.departmentId === userDeptId || e.departmentId.startsWith(userDeptId + '-'));
      } else {
        result = result.filter(e => (e.departmentId === selectedDeptKey || e.departmentId.startsWith(selectedDeptKey + '-')) && (e.departmentId === userDeptId || e.departmentId.startsWith(userDeptId + '-')));
      }
    } else if (selectedDeptKey !== 'all') {
      result = result.filter(e => e.departmentId === selectedDeptKey || e.departmentId.startsWith(selectedDeptKey + '-'));
    }

    if (searchText) {
      result = result.filter(e =>
        e.name.includes(searchText) ||
        e.phone.includes(searchText)
      );
    }
    return result;
  }, [employees, selectedDeptKey, searchText, employeeTab, user?.phone, isAdmin]);

  const deptEmployeeCount = useMemo(() => {
    const userDeptId = employees.find(e => e.phone === user?.phone)?.departmentId;
    const counts: Record<string, number> = {};
    
    const filterForUser = (e: Employee) => {
      if (isAdmin) return true;
      if (!userDeptId) return false;
      return e.departmentId === userDeptId || e.departmentId.startsWith(userDeptId + '-');
    };

    counts.all = employees.filter(e => (e.status === 'active' || e.status === 'disabled') && filterForUser(e)).length;

    const countDept = (depts: Department[]): number => {
      let total = 0;
      depts.forEach(dept => {
        let count = employees.filter(e => (e.status === 'active' || e.status === 'disabled') && (e.departmentId === dept.key || e.departmentId.startsWith(dept.key + '-')) && filterForUser(e)).length;
        if (dept.children) {
          count = countDept(dept.children);
        }
        counts[dept.key] = count;
        total += count;
      });
      return total;
    };
    countDept(deptTreeData);
    return counts;
  }, [employees, user?.phone, isAdmin]);

  const handleAddEmployee = () => {
    setModalType('addEmployee');
    form.resetFields();
    setModalVisible(true);
  };

  const handleAddDept = () => {
    setModalType('addDept');
    form.resetFields();
    setModalVisible(true);
  };

  const findParentKey = (tree: Department[], targetKey: string): string | null => {
    for (const dept of tree) {
      if (dept.children?.some(c => c.key === targetKey)) {
        return dept.key;
      }
      if (dept.children) {
        const found = findParentKey(dept.children, targetKey);
        if (found) return found;
      }
    }
    return null;
  };

  const handleEditDept = (dept: Department) => {
    setEditingDept(dept);
    setModalType('editDept');
    const parentKey = findParentKey(deptTreeData, dept.key);
    form.setFieldsValue({ name: dept.title, parent: parentKey });
    setModalVisible(true);
  };

  const canEditDept = (userRoleCode: string) => {
    return userRoleCode === 'super_admin' || userRoleCode === 'main_admin';
  };

  const handleBatchDept = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要调整的员工');
      return;
    }
    setModalType('batchDept');
    form.resetFields();
    setModalVisible(true);
  };

  const handleImport = () => {
    setModalType('import');
    setModalVisible(true);
  };

  const handleResign = (record: Employee) => {
    const updated = employees.map(e =>
      e.key === record.key ? { ...e, status: 'resigned' as const, resignDate: new Date().toISOString().split('T')[0] } : e
    );
    setEmployees(updated);
    message.success(`${record.name} 已移入已离职列表`);
  };

  const handleReinstate = (record: Employee) => {
    const updated = employees.map(e =>
      e.key === record.key ? { ...e, status: 'active' as const, resignDate: undefined } : e
    );
    setEmployees(updated);
    message.success(`${record.name} 已恢复在职状态`);
  };

  const handleEditEmployee = (record: Employee) => {
    setEditingDept(null);
    setEditingEmployee(record);
    setModalType('addEmployee');
    form.setFieldsValue({
      name: record.name,
      phone: record.phone,
      position: record.position,
      role: record.roleCode,
      department: record.departmentId,
    });
    setModalVisible(true);
  };

  const handleDeleteEmployee = (record: Employee) => {
    deleteEmployee(record.key);
    message.success(`${record.name} 已删除`);
  };

  const handleToggleDisable = (record: Employee) => {
    toggleEmployeeDisable(record.key);
    const newStatus = record.status === 'active' ? 'disabled' : 'active';
    message.success(`${record.name} 已${newStatus === 'disabled' ? '禁用' : '启用'}`);
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的员工');
      return;
    }
    Modal.confirm({
      title: '批量删除确认',
      content: `确定要删除选中的 ${selectedRowKeys.length} 名员工吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setEmployees(employees.filter(e => !selectedRowKeys.includes(e.key)));
        setSelectedRowKeys([]);
        message.success('批量删除成功');
      }
    });
  };

  const updateDeptName = (tree: Department[], deptKey: string, newName: string): Department[] => {
    return tree.map(dept => {
      if (dept.key === deptKey) {
        return { ...dept, title: newName };
      }
      if (dept.children) {
        return { ...dept, children: updateDeptName(dept.children, deptKey, newName) };
      }
      return dept;
    });
  };

  const removeDeptFromTree = (tree: Department[], deptKey: string): Department[] => {
    return tree
      .map(dept => {
        if (dept.key === deptKey) {
          return null;
        }
        if (dept.children) {
          const newChildren = removeDeptFromTree(dept.children, deptKey).filter(Boolean);
          return {
            ...dept,
            children: newChildren.length > 0 ? newChildren : undefined,
            isLeaf: newChildren.length === 0,
          };
        }
        return dept;
      })
      .filter(Boolean) as Department[];
  };

  const moveDept = (tree: Department[], deptKey: string, newParentKey: string | null): Department[] => {
    const removedTree = removeDeptFromTree(tree, deptKey);
    const movedDept = findDept(tree, deptKey);
    if (!movedDept) return removedTree;
    if (!newParentKey) {
      return [...removedTree, movedDept];
    }
    return addDeptToTree(removedTree, newParentKey, movedDept);
  };

  const findDept = (tree: Department[], deptKey: string): Department | undefined => {
    for (const dept of tree) {
      if (dept.key === deptKey) return dept;
      if (dept.children) {
        const found = findDept(dept.children, deptKey);
        if (found) return found;
      }
    }
    return undefined;
  };

  const addDeptToTree = (tree: Department[], parentKey: string, newDept: Department): Department[] => {
    return tree.map(dept => {
      if (dept.key === parentKey) {
        return {
          ...dept,
          children: [...(dept.children || []), newDept],
          isLeaf: false,
        };
      }
      if (dept.children) {
        return {
          ...dept,
          children: addDeptToTree(dept.children, parentKey, newDept),
        };
      }
      return dept;
    });
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      if (modalType === 'addEmployee') {
        const values = form.getFieldsValue();
        const deptOptions = getDeptOptions(deptTreeData);
        const selectedDept = deptOptions.find(d => d.value === values.department);
        if (editingEmployee) {
          updateEmployee(editingEmployee.key, {
            name: values.name,
            phone: values.phone,
            department: selectedDept?.label || '',
            departmentId: values.department,
            role: roleLabels[values.role]?.label || '员工',
            roleCode: values.role,
            position: values.position,
          });
          message.success('员工信息修改成功');
        } else {
          if (isRealToken) {
            try {
              const response = await axios.post('/api/v1/users', {
                username: values.phone,
                password: values.password,
                phone: values.phone,
                realName: values.name,
                roleId: values.role,
                departmentId: values.department,
                email: ''
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });

              const backendUser = response.data.data;
              const newEmp: Employee = {
                key: backendUser.id || Date.now().toString(),
                name: values.name,
                phone: values.phone,
                email: '',
                department: selectedDept?.label || '',
                departmentId: values.department,
                role: roleLabels[values.role]?.label || '员工',
                roleCode: values.role,
                status: 'active',
                position: values.position,
                joinDate: new Date().toISOString().split('T')[0],
              };
              addEmployee(newEmp);
              setSelectedDeptKey('all');
              setSearchText('');
              message.success('员工添加成功');
            } catch (error: any) {
              message.error(error.response?.data?.message || '添加员工失败');
              return;
            }
          } else {
            const newEmp: Employee = {
              key: Date.now().toString(),
              name: values.name,
              phone: values.phone,
              email: '',
              password: values.password,
              department: selectedDept?.label || '',
              departmentId: values.department,
              role: roleLabels[values.role]?.label || '员工',
              roleCode: values.role,
              status: 'active',
              position: values.position,
              joinDate: new Date().toISOString().split('T')[0],
            };
            addEmployee(newEmp);

            // 同步到共享数据，供跨浏览器/跨会话登录使用
            addSharedEmployeeApi({
              key: newEmp.key,
              name: newEmp.name,
              phone: newEmp.phone,
              password: values.password,
              department: newEmp.department,
              departmentId: newEmp.departmentId,
              role: newEmp.role,
              roleCode: newEmp.roleCode,
              status: 'active',
              position: newEmp.position,
              tenantName: user?.tenantName || '',
              joinDate: newEmp.joinDate,
            });

            setSelectedDeptKey('all');
            setSearchText('');
            message.success('员工添加成功');
          }
        }
      } else if (modalType === 'batchDept') {
        message.success(`已将 ${selectedRowKeys.length} 名员工调整部门`);
        setSelectedRowKeys([]);
      } else if (modalType === 'addDept') {
        const values = form.getFieldsValue();
        const newDept: Department = {
          key: Date.now().toString(),
          title: values.name,
          isLeaf: true,
        };
        addDepartment(values.parent || null, newDept);
        message.success('部门添加成功');
      } else if (modalType === 'editDept') {
        const values = form.getFieldsValue();
        if (editingDept) {
          updateDepartment(editingDept.key, {
            title: values.name,
            parentKey: values.parent || null,
          });
          message.success('部门编辑成功');
        }
      }
      setEditingEmployee(null);
      setModalVisible(false);
    } catch (error) {
      //
    }
  };

  const handlePermissionChange = (category: string, perms: string[]) => {
    const currentPerms = rolePermissions[selectedRole] || [];
    const catPermKeys = permissionItems.filter(p => p.category === category).map(p => p.key);
    const otherPerms = currentPerms.filter(p => !catPermKeys.includes(p));
    setRolePermissions(prev => ({ ...prev, [selectedRole]: [...otherPerms, ...perms] }));
  };

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      message.info(`正在解析 ${file.name}...`);
      setTimeout(() => {
        message.success('文件解析完成，成功导入5人，失败2人');
      }, 1500);
      return false;
    },
    showUploadList: false,
  };

  const employeeColumns: ColumnsType<Employee> = [
    { title: '姓名', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: '手机号', dataIndex: 'phone', key: 'phone', ellipsis: true },
    
    { title: '部门', dataIndex: 'department', key: 'department', ellipsis: true },
    { title: '岗位', dataIndex: 'position', key: 'position', ellipsis: true },
    { title: '角色', dataIndex: 'role', key: 'role', render: (r: string, record: Employee) => (
      <Tag color={roleLabels[record.roleCode]?.color || 'default'}>{r}</Tag>
    )},
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => (
      s === 'active' ? <Tag color="green">正常</Tag> : s === 'disabled' ? <Tag color="red">禁用</Tag> : <Tag color="default">已离职</Tag>
    )},
    
    {
      title: '操作', key: 'action',
      render: (_, record: Employee) => (
        <Space size="small">
          {isAdmin && <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditEmployee(record)}>编辑</Button>}
          {record.status === 'active' && (
            <Popconfirm title="确认禁用该员工？" onConfirm={() => handleToggleDisable(record)} okText="确认" cancelText="取消">
              <Button type="link" size="small" danger icon={<StopOutlined />}>禁用</Button>
            </Popconfirm>
          )}
          {record.status === 'disabled' && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => handleToggleDisable(record)}>启用</Button>
          )}
          {isAdmin && employeeTab === 'active' && (
            <Popconfirm title="确认删除该员工？" onConfirm={() => handleDeleteEmployee(record)} okText="确认" cancelText="取消">
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ].filter(Boolean) as ColumnsType<Employee>;

  const permissionCategories = [...new Set(permissionItems.map(p => p.category))];

  const getModalTitle = () => {
    switch (modalType) {
      case 'addEmployee': return '新增员工';
      case 'addDept': return '新增部门';
      case 'editDept': return '编辑部门';
      case 'batchDept': return '批量调整部门';
      case 'import': return '批量导入员工';
      case 'permission': return '权限配置';
      default: return '操作';
    }
  };

  const orgTabItems = [
    { key: 'active', label: <span><UserOutlined /> 在职员工 ({employees.filter(e => e.status === 'active').length})</span> },
    { key: 'disabled', label: <span><StopOutlined /> 禁用员工 ({employees.filter(e => e.status === 'disabled').length})</span> },
  ];

  const renderTreeTitle = (dept: Department) => (
    <span>
      {dept.title}
      <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
        ({deptEmployeeCount[dept.key] || 0})
      </Text>
      {isAdmin && (
        <EditOutlined 
          style={{ marginLeft: 8, fontSize: 12, color: '#1890ff', cursor: 'pointer' }} 
          onClick={(e) => {
            e.stopPropagation();
            handleEditDept(dept);
          }}
        />
      )}
    </span>
  );

  const tabItems = [
    {
      key: 'org',
      label: <span><TeamOutlined /> 组织架构</span>,
      children: (
        <Row gutter={16} style={{ minHeight: 600 }}>
          <Col span={6}>
            <Card
              title="部门结构"
              size="small"
              extra={isAdmin ? <Button type="link" size="small" icon={<PlusOutlined />} onClick={handleAddDept}>新增</Button> : null}
              style={{ height: '100%' }}
              bodyStyle={{ padding: 0 }}
            >
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                <a onClick={() => setSelectedDeptKey('all')} style={{ fontWeight: selectedDeptKey === 'all' ? 600 : 'normal' }}>
                  全部员工 ({deptEmployeeCount.all})
                </a>
              </div>
              <div style={{ padding: 8 }}>
                <DirectoryTree
                  expandedKeys={expandedKeys}
                  onExpand={(keys) => setExpandedKeys(keys as string[])}
                  selectedKeys={[selectedDeptKey]}
                  onSelect={(keys) => setSelectedDeptKey(keys[0] as string)}
                  treeData={deptTreeData.map(d => ({
                    ...d,
                    title: renderTreeTitle(d),
                    children: d.children?.map(c => ({
                      ...c,
                      title: renderTreeTitle(c),
                    }))
                  }))}
                />
              </div>
            </Card>
          </Col>
          <Col span={18}>
            <Card size="small">
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tabs
                  activeKey={employeeTab}
                  onChange={(k) => setEmployeeTab(k as 'active' | 'disabled')}
                  items={orgTabItems}
                  size="small"
                />
                <Space>
                  <Search
                    placeholder="搜索姓名/手机号/邮箱"
                    allowClear
                    style={{ width: 220 }}
                    onSearch={setSearchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    size="small"
                    prefix={<SearchOutlined />}
                  />
                </Space>
              </div>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  {isAdmin && (
                    <>
                      <Button size="small" icon={<PlusOutlined />} onClick={handleAddEmployee}>新增员工</Button>
                      <Button size="small" icon={<UploadOutlined />} onClick={handleImport}>批量导入</Button>
                      <Button size="small" icon={<DownloadOutlined />}>下载模板</Button>
                      <Button size="small" danger icon={<DeleteOutlined />} onClick={handleBatchDelete} disabled={selectedRowKeys.length === 0}>批量删除</Button>
                    </>
                  )}
                </Space>
                {isAdmin && <Text type="secondary" style={{ fontSize: 12 }}>已选择 {selectedRowKeys.length} 人</Text>}
              </div>
              <Table
                columns={employeeColumns}
                dataSource={filteredEmployees}
                rowKey="key"
                size="small"
                scroll={{ x: 'max-content' }}
                rowSelection={isAdmin ? {
                  selectedRowKeys,
                  onChange: setSelectedRowKeys,
                } : undefined}
                pagination={{ pageSize: 10, showSizeChanger: true }}
                locale={{
                  emptyText: employeeTab === 'disabled' ? <Empty description="暂无禁用员工" /> : <Empty description="暂无员工数据" />
                }}
              />
            </Card>
          </Col>
        </Row>
      )
    },
    ...(isAdmin ? [{
      key: 'permission',
      label: <span><SafetyOutlined /> 权限管理</span>,
      children: (
        <Row gutter={16}>
          <Col span={6}>
            <Card title="角色列表" size="small" bodyStyle={{ padding: 0 }}>
              {Object.entries(roleLabels).map(([code, info]) => (
                <div
                  key={code}
                  onClick={() => setSelectedRole(code)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderLeft: selectedRole === code ? '3px solid #1890ff' : '3px solid transparent',
                    background: selectedRole === code ? '#e6f7ff' : 'transparent',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <Space>
                    <Tag color={info.color}>
                      {info.label}
                    </Tag>
                  </Space>
                  <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                    {rolePermissions[code]?.length || 0} 项权限
                  </div>
                </div>
              ))}
            </Card>
          </Col>
          <Col span={18}>
            <Card
              title={`权限配置 - ${roleLabels[selectedRole]?.label}`}
              size="small"
              extra={selectedRole !== 'super_admin' ? (
                <Space>
                  <Button size="small" onClick={() => message.success('权限配置已保存，即时生效')} type="primary">保存配置</Button>
                </Space>
              ) : null}
            >
              {selectedRole === 'super_admin' && (
                <Alert
                  message="总管理员拥有全部权限，不可修改"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              <Divider orientation="left" style={{ marginBottom: 12 }}>
                <Text strong>数据范围设置</Text>
              </Divider>
              {selectedRole !== 'super_admin' && selectedRole !== 'employee' ? (
                <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 4 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong style={{ marginRight: 16 }}>数据范围：</Text>
                      <Select
                        size="small"
                        value={dataScope[selectedRole]?.type || 'all'}
                        onChange={(v) => updateDataScope(selectedRole, { type: v })}
                        style={{ width: 200 }}
                      >
                        {selectedRole === 'main_admin' && <Option value="all">全部部门</Option>}
                        {selectedRole === 'main_admin' && <Option value="specified">指定部门</Option>}
                        {selectedRole === 'sub_admin' && <Option value="specified">指定部门</Option>}
                        {selectedRole === 'manager' && <Option value="only_dept">仅本部门</Option>}
                        {selectedRole === 'manager' && <Option value="dept_and_sub">本部门及下属团队</Option>}
                      </Select>
                    </div>
                    {dataScope[selectedRole]?.type === 'specified' && (
                      <div>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>可选部门：</Text>
                        <Checkbox.Group
                          options={getDeptOptions(deptTreeData).map(opt => ({ label: opt.label, value: opt.value }))}
                          value={dataScope[selectedRole]?.depts || []}
                          onChange={(vals) => updateDataScope(selectedRole, { depts: vals as string[] })}
                        />
                      </div>
                    )}
                  </Space>
                </div>
              ) : null}

              <Divider orientation="left" style={{ marginBottom: 12 }}>
                <Text strong>功能权限</Text>
              </Divider>
              <div style={{ padding: '0 8px' }}>
                {permissionCategories.map(cat => {
                  const catItems = permissionItems.filter(p => p.category === cat);
                  const catValues = catItems.filter(p => (rolePermissions[selectedRole] || []).includes(p.key)).map(p => p.key);
                  return (
                    <div key={cat} style={{ marginBottom: 16 }}>
                      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                        <Tag color="blue">{cat}</Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {catItems.length} 项
                        </Text>
                      </div>
                      <Checkbox.Group
                        style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 8 }}
                        value={catValues}
                        onChange={(vals) => handlePermissionChange(cat, vals as string[])}
                        disabled={selectedRole === 'super_admin'}
                      >
                        {catItems.map(item => (
                          <Checkbox key={item.key} value={item.key}>
                            {item.label}
                            {typeof item[selectedRole as keyof PermissionItem] === 'boolean' && item[selectedRole as keyof PermissionItem] === false && selectedRole !== 'super_admin' && (
                              <Tooltip title="此角色默认无该权限，可按需开启">
                                <ExclamationCircleOutlined style={{ marginLeft: 4, color: '#faad14' }} />
                              </Tooltip>
                            )}
                          </Checkbox>
                        ))}
                      </Checkbox.Group>
                    </div>
                  );
                })}
              </div>
            </Card>
          </Col>
        </Row>
      )
    }] : []),
    ...(isAdmin ? [{
      key: 'system',
      label: <span><SettingOutlined /> 系统配置</span>,
      children: (
        <div style={{ maxWidth: 700 }}>
          <Form layout="vertical">
            <Divider>功能开关</Divider>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="启用目标管理">
                  <Switch defaultChecked />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="启用绩效考核">
                  <Switch defaultChecked />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="启用人才发展">
                  <Switch defaultChecked />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="启用消息通知">
                  <Switch defaultChecked />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="启用AI功能">
                  <Switch defaultChecked />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="启用360评价">
                  <Switch defaultChecked />
                </Form.Item>
              </Col>
            </Row>
            <Divider>安全设置</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="密码错误锁定次数">
                  <Input type="number" defaultValue={5} suffix="次" style={{ width: 200 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="锁定时长">
                  <Input type="number" defaultValue={30} suffix="分钟" style={{ width: 200 }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Button type="primary">保存配置</Button>
            </Form.Item>
          </Form>
        </div>
      )
    }] : [])
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>系统设置</Title>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>

      <Modal
        title={getModalTitle()}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={modalType === 'import' ? 600 : 500}
      >
        {modalType === 'addEmployee' && (
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                  <Input placeholder="请输入姓名" style={{ width: 200 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="phone" label="手机号" rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '手机号格式错误' },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      const exists = employees.some(e => 
                        e.phone === value && 
                        (editingEmployee ? e.key !== editingEmployee.key : true)
                      );
                      if (exists) {
                        return Promise.reject(new Error('手机号已存在，请更换手机号'));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}>
                  <Input placeholder="请输入手机号" style={{ width: 200 }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
                  <Select placeholder="请选择角色" style={{ width: 200 }}>
                    {Object.entries(roleLabels).map(([code, info]) => (
                      <Option key={code} value={code}>
                        {info.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="department" label="部门" rules={[{ required: true, message: '请选择部门' }]}>
                  <Select placeholder="请选择部门" style={{ width: 200 }}>
                    {getDeptOptions(deptTreeData).map(opt => (
                      <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="position" label="岗位">
                  <Input placeholder="请输入岗位名称" style={{ width: 200 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="password" label="初始密码" rules={[
                  { required: true, message: '请输入初始密码' },
                  { min: 6, max: 20, message: '密码长度6-20位' }
                ]}>
                  <Input.Password placeholder="请输入初始密码" style={{ width: 200 }} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}

        {modalType === 'addDept' && (
          <Form form={form} layout="vertical">
            <Form.Item name="name" label="部门名称" rules={[{ required: true, message: '请输入部门名称' }]}>
              <Input placeholder="请输入部门名称" />
            </Form.Item>
            <Form.Item name="parent" label="上级部门">
              <Select placeholder="请选择上级部门（不选为顶级部门）" allowClear>
                {getDeptOptions(deptTreeData).map(opt => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="manager" label="部门负责人">
              <Input placeholder="请输入负责人姓名" />
            </Form.Item>
          </Form>
        )}

        {modalType === 'editDept' && (
          <Form form={form} layout="vertical">
            <Form.Item name="name" label="部门名称" rules={[{ required: true, message: '请输入部门名称' }]}>
              <Input placeholder="请输入部门名称" />
            </Form.Item>
            <Form.Item name="parent" label="上级部门">
              <Select placeholder="请选择上级部门（不选为顶级部门）" allowClear>
                {getDeptOptions(deptTreeData).filter(opt => opt.value !== editingDept?.key).map(opt => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        )}

        {modalType === 'batchDept' && (
          <Form form={form} layout="vertical">
            <Alert
              message={`将调整 ${selectedRowKeys.length} 名员工的所属部门`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Form.Item name="targetDept" label="目标部门" rules={[{ required: true, message: '请选择目标部门' }]}>
              <Select placeholder="请选择目标部门">
                <Option value="1">总经办</Option>
                <Option value="2-1">销售部/销售一组</Option>
                <Option value="2-2">销售部/销售二组</Option>
                <Option value="3-1">研发部/前端组</Option>
                <Option value="3-2">研发部/后端组</Option>
                <Option value="3-3">研发部/测试组</Option>
                <Option value="4">人力资源部</Option>
                <Option value="5">财务部</Option>
              </Select>
            </Form.Item>
          </Form>
        )}

        {modalType === 'import' && (
          <div>
            <Alert
              message="导入说明"
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>支持Excel格式文件导入，需使用系统模板</li>
                  <li>重复手机号/邮箱将自动标红并跳过</li>
                  <li>手机号格式错误、邮箱格式错误等将在错误报告中显示原因</li>
                </ul>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
              <Button icon={<DownloadOutlined />}>下载导入模板</Button>
            </div>
            <Upload.Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
              <p className="ant-upload-hint">支持 .xlsx, .xls 格式文件</p>
            </Upload.Dragger>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default SystemSettings;
