// Mock数据工具 - 登录体系相关
import { getApiUrl } from './api';

export function isDemoCompany(companyName: string): boolean {
  return false;
}

// ============ 1. Mock企业列表（公司名称模糊搜索）============
export interface MockCompany {
  value: string;        // 公司名称
  phone: string;        // 默认管理员手机号
  contactName: string;  // 联系人
  employeeCount: number;
  status: 'active' | 'inactive' | 'trial';
}

export async function fetchClients(): Promise<any[]> {
  try {
    const response = await fetch(getApiUrl('/api/shared/clients'));
    const result = await response.json();
    return result.success ? result.data : [];
  } catch {
    const serverClientsKey = 'server_clients';
    const storedClients = localStorage.getItem(serverClientsKey);
    if (storedClients) {
      try {
        return JSON.parse(storedClients);
      } catch {}
    }
    return [];
  }
}

export interface SharedEmployee {
  key: string;
  name: string;
  phone: string;
  password: string;
  department: string;
  departmentId: string;
  role: string;
  roleCode: string;
  status: string;
  position: string;
  tenantName: string;
  joinDate?: string;
}

export async function fetchSharedEmployees(): Promise<SharedEmployee[]> {
  try {
    const response = await fetch(getApiUrl('/api/shared/employees'));
    const result = await response.json();
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

export async function addSharedEmployee(employee: SharedEmployee): Promise<void> {
  try {
    await fetch(getApiUrl('/api/shared/employees'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employee)
    });
  } catch {}
}

export async function getMockCompaniesAsync(): Promise<MockCompany[]> {
  const clients = await fetchClients();
  return clients.map((c: any) => ({
    value: c.name,
    contactName: c.contactName,
    phone: c.phone,
    employeeCount: c.employeeCount || 0,
    status: c.status || 'active',
  }));
}

export function getMockCompanies(): MockCompany[] {
  const serverClientsKey = 'server_clients';
  const storedClients = localStorage.getItem(serverClientsKey);
  if (storedClients) {
    try {
      const clients = JSON.parse(storedClients);
      return clients.map((c: any) => ({
        value: c.name,
        contactName: c.contactName,
        phone: c.phone,
        employeeCount: c.employeeCount || 0,
        status: c.status || 'active',
      }));
    } catch {}
  }
  return [];
}

export const mockCompanies = getMockCompanies();

// 模糊搜索企业
export function searchCompanies(keyword: string): MockCompany[] {
  if (!keyword) return mockCompanies.slice(0, 5);
  const lower = keyword.toLowerCase();
  return mockCompanies.filter(c =>
    c.value.toLowerCase().includes(lower) ||
    c.contactName.toLowerCase().includes(lower)
  );
}

// ============ 2. 短信验证码生成 ============
const SMS_CODE_KEY = 'pending_sms_code';
const SMS_PHONE_KEY = 'pending_sms_phone';
const SMS_EXPIRE_KEY = 'pending_sms_expire';

// 生成6位验证码并存入localStorage（模拟短信发送）
export function generateSmsCode(phone: string): string {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  localStorage.setItem(SMS_CODE_KEY, code);
  localStorage.setItem(SMS_PHONE_KEY, phone);
  // 验证码5分钟有效
  localStorage.setItem(SMS_EXPIRE_KEY, String(Date.now() + 5 * 60 * 1000));
  return code;
}

// 校验验证码
export function verifySmsCode(code: string): boolean {
  const stored = localStorage.getItem(SMS_CODE_KEY);
  const expire = Number(localStorage.getItem(SMS_EXPIRE_KEY) || 0);
  if (Date.now() > expire) return false;
  return code === stored;
}

// 获取待验证手机号
export function getPendingPhone(): string {
  return localStorage.getItem(SMS_PHONE_KEY) || '';
}

// 清除验证码
export function clearSmsCode(): void {
  localStorage.removeItem(SMS_CODE_KEY);
  localStorage.removeItem(SMS_PHONE_KEY);
  localStorage.removeItem(SMS_EXPIRE_KEY);
}

// 手机号脱敏
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

// ============ 3. 设备指纹管理（新设备检测）============
const DEVICE_FINGERPRINT_KEY = 'client_device_fingerprint';

// 生成设备指纹（浏览器特征 + 随机串）
export function getDeviceFingerprint(): string {
  let fp = localStorage.getItem(DEVICE_FINGERPRINT_KEY);
  if (!fp) {
    const ua = navigator.userAgent;
    const screen = `${window.screen.width}x${window.screen.height}`;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    fp = btoa(`${ua}|${screen}|${tz}|${Math.random()}`).slice(0, 32);
    localStorage.setItem(DEVICE_FINGERPRINT_KEY, fp);
  }
  return fp;
}

// 判断是否为新设备（指纹不在已信任列表中）
const TRUSTED_DEVICES_KEY = 'client_trusted_devices';

export function isNewDevice(phone: string): boolean {
  const fp = getDeviceFingerprint();
  const trusted: string[] = JSON.parse(localStorage.getItem(TRUSTED_DEVICES_KEY) || '[]');
  return !trusted.includes(`${phone}:${fp}`);
}

// 标记设备为已信任
export function trustDevice(phone: string): void {
  const fp = getDeviceFingerprint();
  const trusted: string[] = JSON.parse(localStorage.getItem(TRUSTED_DEVICES_KEY) || '[]');
  const key = `${phone}:${fp}`;
  if (!trusted.includes(key)) {
    trusted.push(key);
    localStorage.setItem(TRUSTED_DEVICES_KEY, JSON.stringify(trusted));
  }
}

export const PROVINCE_OPTIONS = [
  { value: '北京市', label: '北京市' },
  { value: '天津市', label: '天津市' },
  { value: '河北省', label: '河北省' },
  { value: '山西省', label: '山西省' },
  { value: '内蒙古自治区', label: '内蒙古自治区' },
  { value: '辽宁省', label: '辽宁省' },
  { value: '吉林省', label: '吉林省' },
  { value: '黑龙江省', label: '黑龙江省' },
  { value: '上海市', label: '上海市' },
  { value: '江苏省', label: '江苏省' },
  { value: '浙江省', label: '浙江省' },
  { value: '安徽省', label: '安徽省' },
  { value: '福建省', label: '福建省' },
  { value: '江西省', label: '江西省' },
  { value: '山东省', label: '山东省' },
  { value: '河南省', label: '河南省' },
  { value: '湖北省', label: '湖北省' },
  { value: '湖南省', label: '湖南省' },
  { value: '广东省', label: '广东省' },
  { value: '广西壮族自治区', label: '广西壮族自治区' },
  { value: '海南省', label: '海南省' },
  { value: '重庆市', label: '重庆市' },
  { value: '四川省', label: '四川省' },
  { value: '贵州省', label: '贵州省' },
  { value: '云南省', label: '云南省' },
  { value: '西藏自治区', label: '西藏自治区' },
  { value: '陕西省', label: '陕西省' },
  { value: '甘肃省', label: '甘肃省' },
  { value: '青海省', label: '青海省' },
  { value: '宁夏回族自治区', label: '宁夏回族自治区' },
  { value: '新疆维吾尔自治区', label: '新疆维吾尔自治区' },
  { value: '香港特别行政区', label: '香港特别行政区' },
  { value: '澳门特别行政区', label: '澳门特别行政区' },
  { value: '台湾省', label: '台湾省' },
];

export async function checkCompanyExists(companyName: string): Promise<{ exists: boolean; message: string }> {
  const allApplications = await getAllTrialApplicationsAsync();
  const existingApp = allApplications.find(app => 
    app.companyName.trim() === companyName.trim()
  );
  
  if (existingApp) {
    if (existingApp.status === 'pending') {
      return { exists: true, message: '该公司已提交过申请，正在审核中，无需重复提交' };
    } else if (existingApp.status === 'approved') {
      return { exists: true, message: '该公司已开通启用，无需重复提交' };
    }
  }

  const clients = await fetchClients();
  const existingClient = clients.find((c: any) => 
    c.name && c.name.trim() === companyName.trim()
  );
  if (existingClient) {
    return { exists: true, message: '该公司已开通启用，无需重复提交' };
  }

  return { exists: false, message: '' };
}

// ============ 4. 申请试用审批流程 ============
export interface TrialApplication {
  id: string;
  ticketNo: string;         // 工单号
  companyName: string;
  contactName: string;
  phone: string;
  contactPhone?: string;
  contactEmail?: string;
  companySize?: string;
  industry?: string;
  employeeCount: string;
  region: string;
  status: 'pending' | 'approved' | 'rejected';
  remark?: string;          // 审批备注
  submittedAt: string;      // 提交时间
  reviewedAt?: string;      // 审批时间
}

const TRIAL_APPLICATIONS_KEY = 'trial_applications';
const CLIENT_TRIAL_KEY = 'client_trial_status'; // 当前客户端的申请状态缓存

export async function getAllTrialApplicationsAsync(): Promise<TrialApplication[]> {
  try {
    const response = await fetch(getApiUrl('/api/shared/trial-applications'));
    const result = await response.json();
    return result.success ? result.data : [];
  } catch {
    return JSON.parse(localStorage.getItem(TRIAL_APPLICATIONS_KEY) || '[]');
  }
}

// 读取所有申请（服务端审批用）
export function getAllTrialApplications(): TrialApplication[] {
  return JSON.parse(localStorage.getItem(TRIAL_APPLICATIONS_KEY) || '[]');
}

// 提交新申请
export async function submitTrialApplication(app: Omit<TrialApplication, 'id' | 'ticketNo' | 'status' | 'submittedAt'>): Promise<TrialApplication> {
  const all = getAllTrialApplications();
  const newApp: TrialApplication = {
    ...app,
    id: 'trial_' + Date.now(),
    ticketNo: generateTicketNo('TRIAL'),
    status: 'pending',
    submittedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
  };
  all.unshift(newApp);
  localStorage.setItem(TRIAL_APPLICATIONS_KEY, JSON.stringify(all));
  localStorage.setItem(CLIENT_TRIAL_KEY, JSON.stringify(newApp));

  try {
    await fetch(getApiUrl('/api/shared/trial-applications'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newApp)
    });
  } catch {}

  const notifications = getNotifications();
  const newNotification = {
    id: 'notif_' + Date.now(),
    type: 'trial' as const,
    title: '新的试用申请',
    content: `${app.companyName} 提交了试用申请`,
    read: false,
    createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    data: { trialId: newApp.id }
  };
  notifications.unshift(newNotification);
  localStorage.setItem('server_notifications', JSON.stringify(notifications));

  try {
    await fetch(getApiUrl('/api/shared/notifications'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNotification)
    });
  } catch {}

  return newApp;
}

// 读取当前客户端申请状态
export function getClientTrialStatus(): TrialApplication | null {
  const data = localStorage.getItem(CLIENT_TRIAL_KEY);
  return data ? JSON.parse(data) : null;
}

// 审批申请（服务端调用）
export function reviewTrialApplication(id: string, status: 'approved' | 'rejected', remark: string): void {
  const all = getAllTrialApplications();
  const idx = all.findIndex(a => a.id === id);
  if (idx >= 0) {
    all[idx].status = status;
    all[idx].remark = remark;
    all[idx].reviewedAt = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
    localStorage.setItem(TRIAL_APPLICATIONS_KEY, JSON.stringify(all));
    // 同步更新客户端缓存（通过同一localStorage实现双端联动）
    const current = getClientTrialStatus();
    if (current && current.id === id) {
      localStorage.setItem(CLIENT_TRIAL_KEY, JSON.stringify(all[idx]));
    }
  }
}

// 重试申请（客户端被拒后重新提交）
export async function retryTrialApplication(app: Omit<TrialApplication, 'id' | 'ticketNo' | 'status' | 'submittedAt'>): Promise<TrialApplication> {
  return submitTrialApplication(app);
}

// ============ 5. 登录失败锁定策略 ============
const LOGIN_FAIL_KEY = 'client_login_fail_count';
const LOGIN_LOCK_UNTIL_KEY = 'client_login_lock_until';

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCK_DURATION_MS = 30 * 60 * 1000; // 30分钟

// ============ 6. 公司搜索历史记录 ============
const COMPANY_SEARCH_HISTORY_KEY = 'company_search_history';
const MAX_HISTORY_COUNT = 5;

export function getCompanySearchHistory(): string[] {
  return JSON.parse(localStorage.getItem(COMPANY_SEARCH_HISTORY_KEY) || '[]');
}

export function addCompanySearchHistory(companyName: string): void {
  const history = getCompanySearchHistory();
  const filtered = history.filter(h => h !== companyName);
  filtered.unshift(companyName);
  if (filtered.length > MAX_HISTORY_COUNT) {
    filtered.splice(MAX_HISTORY_COUNT);
  }
  localStorage.setItem(COMPANY_SEARCH_HISTORY_KEY, JSON.stringify(filtered));
}

export function clearCompanySearchHistory(): void {
  localStorage.removeItem(COMPANY_SEARCH_HISTORY_KEY);
}

// ============ 7. 登录模式记忆 ============
const LOGIN_MODE_KEY = 'login_mode_preference';

export function getLoginMode(): 'client' | 'server' {
  return (localStorage.getItem(LOGIN_MODE_KEY) as 'client' | 'server') || 'client';
}

export function setLoginMode(mode: 'client' | 'server'): void {
  localStorage.setItem(LOGIN_MODE_KEY, mode);
}

// ============ 8. 工单号生成 ============
export function generateTicketNo(prefix: string = 'TK'): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${dateStr}${random}`;
}

// ============ 9. SSO单点登录配置 ============
export interface SSOProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
  enabled: boolean;
}

export const ssoProviders: SSOProvider[] = [
  { id: 'wework', name: '企业微信', icon: 'W', color: '#07C160', enabled: true },
  { id: 'dingtalk', name: '钉钉', icon: 'D', color: '#1677FF', enabled: true },
  { id: 'feishu', name: '飞书', icon: 'F', color: '#3370FF', enabled: true }
];

// ============ 10. 密码规则验证 ============
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 20;

export function validatePassword(password: string): { valid: boolean; message: string } {
  if (!password) {
    return { valid: false, message: '请输入密码' };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, message: `密码长度不能少于${PASSWORD_MIN_LENGTH}位` };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return { valid: false, message: `密码长度不能超过${PASSWORD_MAX_LENGTH}位` };
  }
  return { valid: true, message: '' };
}

export function getLoginFailCount(): number {
  return Number(localStorage.getItem(LOGIN_FAIL_KEY) || 0);
}

export function incrementLoginFail(): number {
  const count = getLoginFailCount() + 1;
  localStorage.setItem(LOGIN_FAIL_KEY, String(count));
  if (count >= MAX_LOGIN_ATTEMPTS) {
    localStorage.setItem(LOGIN_LOCK_UNTIL_KEY, String(Date.now() + LOCK_DURATION_MS));
  }
  return count;
}

export function resetLoginFail(): void {
  localStorage.removeItem(LOGIN_FAIL_KEY);
  localStorage.removeItem(LOGIN_LOCK_UNTIL_KEY);
}

export function getLockUntil(): number {
  return Number(localStorage.getItem(LOGIN_LOCK_UNTIL_KEY) || 0);
}

export function isLocked(): boolean {
  return Date.now() < getLockUntil();
}

export function getRemainingLockSeconds(): number {
  const remain = Math.ceil((getLockUntil() - Date.now()) / 1000);
  return remain > 0 ? remain : 0;
}

export interface Notification {
  id: string;
  type: 'trial' | 'system' | 'approval' | 'alert';
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

export function getNotifications(): Notification[] {
  return JSON.parse(localStorage.getItem('server_notifications') || '[]');
}

export function markNotificationAsRead(id: string): void {
  const notifications = getNotifications();
  const idx = notifications.findIndex(n => n.id === id);
  if (idx >= 0) {
    notifications[idx].read = true;
    localStorage.setItem('server_notifications', JSON.stringify(notifications));
  }
}

export function getUnreadNotificationCount(): number {
  return getNotifications().filter(n => !n.read).length;
}
