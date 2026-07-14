// 服务端 Mock数据工具 - 登录安全与审批
import { getApiUrl } from './api';

// ============ 1. 短信验证码 ============
const SMS_CODE_KEY = 'server_pending_sms_code';
const SMS_PHONE_KEY = 'server_pending_sms_phone';
const SMS_EXPIRE_KEY = 'server_pending_sms_expire';

export function generateSmsCode(phone: string): string {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  localStorage.setItem(SMS_CODE_KEY, code);
  localStorage.setItem(SMS_PHONE_KEY, phone);
  localStorage.setItem(SMS_EXPIRE_KEY, String(Date.now() + 5 * 60 * 1000));
  return code;
}

export function verifySmsCode(code: string): boolean {
  const stored = localStorage.getItem(SMS_CODE_KEY);
  const expire = Number(localStorage.getItem(SMS_EXPIRE_KEY) || 0);
  if (Date.now() > expire) return false;
  return code === stored;
}

export function getPendingPhone(): string {
  return localStorage.getItem(SMS_PHONE_KEY) || '';
}

export function clearSmsCode(): void {
  localStorage.removeItem(SMS_CODE_KEY);
  localStorage.removeItem(SMS_PHONE_KEY);
  localStorage.removeItem(SMS_EXPIRE_KEY);
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

// ============ 2. 设备指纹 ============
const DEVICE_FINGERPRINT_KEY = 'server_device_fingerprint';
const TRUSTED_DEVICES_KEY = 'server_trusted_devices';

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

export function isNewDevice(phone: string): boolean {
  const fp = getDeviceFingerprint();
  const trusted: string[] = JSON.parse(localStorage.getItem(TRUSTED_DEVICES_KEY) || '[]');
  return !trusted.includes(`${phone}:${fp}`);
}

export function trustDevice(phone: string): void {
  const fp = getDeviceFingerprint();
  const trusted: string[] = JSON.parse(localStorage.getItem(TRUSTED_DEVICES_KEY) || '[]');
  const key = `${phone}:${fp}`;
  if (!trusted.includes(key)) {
    trusted.push(key);
    localStorage.setItem(TRUSTED_DEVICES_KEY, JSON.stringify(trusted));
  }
}

// ============ 3. 登录失败锁定 ============
const LOGIN_FAIL_KEY = 'server_login_fail_count';
const LOGIN_LOCK_UNTIL_KEY = 'server_login_lock_until';

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCK_DURATION_MS = 30 * 60 * 1000; // 30分钟

// ============ 3.1 登录模式记忆 ============
const LOGIN_MODE_KEY = 'login_mode_preference';

export function getLoginMode(): 'client' | 'server' {
  return (localStorage.getItem(LOGIN_MODE_KEY) as 'client' | 'server') || 'server';
}

export function setLoginMode(mode: 'client' | 'server'): void {
  localStorage.setItem(LOGIN_MODE_KEY, mode);
}

// ============ 3.2 SSO单点登录配置 ============
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

// ============ 3.3 密码规则 ============
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

// ============ 4. 申请试用审批（服务端审批端）============
export interface TrialApplication {
  id: string;
  ticketNo: string;
  companyName: string;
  contactName: string;
  phone: string;
  employeeCount: string;
  region: string;
  status: 'pending' | 'approved' | 'rejected';
  remark?: string;
  submittedAt: string;
  reviewedAt?: string;
}

// 工单号生成
function generateTicketNo(prefix: string = 'TRIAL'): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${dateStr}${random}`;
}

const TRIAL_APPLICATIONS_KEY = 'trial_applications';

const seedApplications: TrialApplication[] = [];

export async function getAllTrialApplicationsAsync(): Promise<TrialApplication[]> {
  try {
    const response = await fetch(getApiUrl('/api/shared/trial-applications'));
    const result = await response.json();
    return result.success ? result.data : [];
  } catch {
    const data = localStorage.getItem(TRIAL_APPLICATIONS_KEY);
    if (!data) {
      localStorage.setItem(TRIAL_APPLICATIONS_KEY, JSON.stringify(seedApplications));
      return seedApplications;
    }
    return JSON.parse(data);
  }
}

export function getAllTrialApplications(): TrialApplication[] {
  const data = localStorage.getItem(TRIAL_APPLICATIONS_KEY);
  if (!data) {
    localStorage.setItem(TRIAL_APPLICATIONS_KEY, JSON.stringify(seedApplications));
    return seedApplications;
  }
  return JSON.parse(data);
}

export async function reviewTrialApplication(id: string, status: 'approved' | 'rejected', remark: string): Promise<void> {
  const all = await getAllTrialApplicationsAsync();
  const idx = all.findIndex(a => a.id === id);
  if (idx >= 0) {
    all[idx].status = status;
    all[idx].remark = remark;
    all[idx].reviewedAt = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
    localStorage.setItem(TRIAL_APPLICATIONS_KEY, JSON.stringify(all));
    try {
      await fetch(getApiUrl('/api/shared/trial-applications'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, remark, reviewedAt: all[idx].reviewedAt })
      });
    } catch {}

    if (status === 'approved') {
      const app = all[idx];
      await createClientFromTrial(app);
    }
  }
}

async function createClientFromTrial(app: TrialApplication): Promise<void> {
  const newClient = {
    id: 'client_' + Date.now(),
    name: app.companyName,
    contactName: app.contactName,
    phone: app.phone,
    password: '123456',
    status: 'pending' as const,
    employeeCount: parseInt(app.employeeCount) || 0,
    employeeEnabledCount: 0,
    employeeDisabledCount: parseInt(app.employeeCount) || 0,
    createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    region: app.region,
    province: '',
    city: '',
    scale: '',
    assignedTo: '',
    assignedToName: '',
    expireDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN'),
    lastLogin: '-',
    healthScore: 100,
    role: 'super_admin'
  };

  try {
    await fetch(getApiUrl('/api/shared/clients'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClient)
    });
  } catch {}

  const clientsKey = 'server_clients';
  const storedClients = localStorage.getItem(clientsKey);
  const clients = storedClients ? JSON.parse(storedClients) : [];
  clients.unshift(newClient);
  localStorage.setItem(clientsKey, JSON.stringify(clients));
}

// ============ 5. 通知系统 ============
export interface Notification {
  id: string;
  type: 'trial' | 'system' | 'approval' | 'alert';
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

export async function getNotificationsAsync(adminId?: string): Promise<Notification[]> {
  try {
    const response = await fetch(getApiUrl('/api/shared/notifications'));
    const result = await response.json();
    return result.success ? result.data : [];
  } catch {
    return JSON.parse(localStorage.getItem('server_notifications') || '[]');
  }
}

export function getNotifications(adminId?: string): Notification[] {
  const stored = localStorage.getItem('server_notifications');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {}
  }
  return [];
}

export async function markNotificationAsRead(id: string, adminId?: string): Promise<void> {
  const key = 'server_notifications';
  let notifications = await getNotificationsAsync();
  
  const idx = notifications.findIndex(n => n.id === id);
  if (idx >= 0) {
    notifications[idx].read = true;
    localStorage.setItem(key, JSON.stringify(notifications));
    try {
      await fetch(getApiUrl('/api/shared/notifications'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
    } catch {}
  
  if (adminId) {
    const adminKey = `admin_notifications_${adminId}`;
    const adminNotifications = JSON.parse(localStorage.getItem(adminKey) || '[]');
    const adminIdx = adminNotifications.findIndex(n => n.id === id);
    if (adminIdx >= 0) {
      adminNotifications[adminIdx].read = true;
      localStorage.setItem(adminKey, JSON.stringify(adminNotifications));
    }
  }
}

export async function getUnreadNotificationCountAsync(adminId?: string): Promise<number> {
  const notifications = await getNotificationsAsync(adminId);
  return notifications.filter(n => !n.read).length;
}

export function getUnreadNotificationCount(adminId?: string): number {
  const notifications = getNotifications(adminId);
  if (Array.isArray(notifications)) {
    return notifications.filter(n => !n.read).length;
  }
  return 0;
}
