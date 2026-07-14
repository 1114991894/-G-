import fs from 'fs';
import path from 'path';

const DATA_FILE = path.resolve(__dirname, 'shared-data.json');

export interface Client {
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
}

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

export interface ServerAdmin {
  id: string;
  username: string;
  realName: string;
  phone: string;
  password: string;
  role: string;
  permissions: string[];
  status: 'active' | 'inactive';
  createdAt: string;
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

interface SharedData {
  clients: Client[];
  trial_applications: TrialApplication[];
  server_admins: ServerAdmin[];
  server_notifications: Notification[];
  shared_employees: SharedEmployee[];
}

function readData(): SharedData {
  try {
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { clients: [], trial_applications: [], server_admins: [], server_notifications: [], shared_employees: [] };
  }
}

function writeData(data: SharedData): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function getClients(): Client[] {
  return readData().clients;
}

export function saveClients(clients: Client[]): void {
  const data = readData();
  data.clients = clients;
  writeData(data);
}

export function getTrialApplications(): TrialApplication[] {
  return readData().trial_applications;
}

export function saveTrialApplications(applications: TrialApplication[]): void {
  const data = readData();
  data.trial_applications = applications;
  writeData(data);
}

export function getServerAdmins(): ServerAdmin[] {
  return readData().server_admins;
}

export function saveServerAdmins(admins: ServerAdmin[]): void {
  const data = readData();
  data.server_admins = admins;
  writeData(data);
}

export function getNotifications(): Notification[] {
  return readData().server_notifications;
}

export function saveNotifications(notifications: Notification[]): void {
  const data = readData();
  data.server_notifications = notifications;
  writeData(data);
}

export function addClient(client: Client): void {
  const data = readData();
  data.clients.unshift(client);
  writeData(data);
}

export function updateClient(clientId: string, updates: Partial<Client>): void {
  const data = readData();
  const idx = data.clients.findIndex(c => c.id === clientId);
  if (idx >= 0) {
    data.clients[idx] = { ...data.clients[idx], ...updates };
    writeData(data);
  }
}

export function deleteClient(clientId: string): void {
  const data = readData();
  data.clients = data.clients.filter(c => c.id !== clientId);
  writeData(data);
}

export function addTrialApplication(app: TrialApplication): void {
  const data = readData();
  data.trial_applications.unshift(app);
  writeData(data);
}

export function updateTrialApplication(appId: string, updates: Partial<TrialApplication>): void {
  const data = readData();
  const idx = data.trial_applications.findIndex(a => a.id === appId);
  if (idx >= 0) {
    data.trial_applications[idx] = { ...data.trial_applications[idx], ...updates };
    writeData(data);
  }
}

export function addNotification(notification: Notification): void {
  const data = readData();
  data.server_notifications.unshift(notification);
  writeData(data);
}

export function markNotificationAsRead(notifId: string): void {
  const data = readData();
  const idx = data.server_notifications.findIndex(n => n.id === notifId);
  if (idx >= 0) {
    data.server_notifications[idx].read = true;
    writeData(data);
  }
}

export function getSharedEmployees(): SharedEmployee[] {
  return readData().shared_employees || [];
}

export function addSharedEmployee(employee: SharedEmployee): void {
  const data = readData();
  if (!data.shared_employees) data.shared_employees = [];
  data.shared_employees.unshift(employee);
  writeData(data);
}

export function updateSharedEmployee(key: string, updates: Partial<SharedEmployee>): void {
  const data = readData();
  if (!data.shared_employees) return;
  const idx = data.shared_employees.findIndex(e => e.key === key);
  if (idx >= 0) {
    data.shared_employees[idx] = { ...data.shared_employees[idx], ...updates };
    writeData(data);
  }
}

export function deleteSharedEmployee(key: string): void {
  const data = readData();
  if (!data.shared_employees) return;
  data.shared_employees = data.shared_employees.filter(e => e.key !== key);
  writeData(data);
}