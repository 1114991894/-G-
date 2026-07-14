import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import {
  incrementLoginFail, resetLoginFail, isLocked, getLoginFailCount,
  MAX_LOGIN_ATTEMPTS,
  mockCompanies, fetchClients, fetchSharedEmployees,
  type MockCompany
} from '../utils/mockData';

interface User {
  id: string;
  username: string;
  realName: string;
  phone: string;
  email: string;
  role: { code: string; name: string };
  tenantId: string;
  tenantName?: string;
  tenant?: { name: string };
  employee?: { position: string; department?: { name: string } };
  permissions?: Record<string, string>;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loginFailCount: number;
  locked: boolean;
  login: (credentials: { phone: string; password: string; tenantName?: string }) => Promise<void>;
  oauthLogin: (platform: string, code: string, state?: string) => Promise<void>;
  logout: () => void;
  getCurrentUser: () => Promise<void>;
  searchCompanies: (keyword: string) => MockCompany[];
  checkLockStatus: () => void;
}

const mockUsers: Record<string, { password: string; user: User }> = {};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loginFailCount: getLoginFailCount(),
      locked: isLocked(),

      searchCompanies: (keyword: string) => {
        if (!keyword) return mockCompanies.slice(0, 5);
        const lower = keyword.toLowerCase();
        return mockCompanies.filter(c =>
          c.value.toLowerCase().includes(lower) ||
          c.contactName.toLowerCase().includes(lower)
        );
      },

      checkLockStatus: () => {
        set({ locked: isLocked(), loginFailCount: getLoginFailCount() });
      },

      login: async (credentials) => {
        const { phone, password, tenantName } = credentials;

        if (isLocked()) {
          throw new Error('账号已锁定，请稍后再试');
        }

        try {
          const response = await axios.post('/api/v1/auth/login', {
            username: phone, password, clientType: 'client', tenantName
          });
          const { token, user } = response.data.data;
          set({ user, token, isAuthenticated: true });
          resetLoginFail();
          set({ loginFailCount: 0, locked: false });
          localStorage.setItem('token', token);
        } catch (error: any) {
          const hasResponse = error.response !== undefined && error.response !== null;
          
          const clients = await fetchClients();
          let foundClient = null;
          
          foundClient = clients.find((c: any) => 
            c.phone === phone && c.password === password && c.name === tenantName
          );
          
          if (foundClient) {
            const isExpired = foundClient.expireDate && foundClient.expireDate !== '-' && foundClient.expireDate !== '';
            
            if (foundClient.status === 'inactive') {
              throw new Error('您的账户已被禁用，请联系管理员');
            }
            
            if (isExpired) {
              let expireDate: Date | null = null;
              const expireDateStr = foundClient.expireDate;
              
              if (expireDateStr.includes('-')) {
                const parts = expireDateStr.split('-');
                if (parts.length === 2) {
                  expireDate = new Date(parts[1]);
                }
              }
              
              if (!expireDate) {
                expireDate = new Date(expireDateStr);
              }
              
              const now = new Date();
              expireDate.setHours(23, 59, 59, 999);
              
              if (isNaN(expireDate.getTime())) {
                throw new Error('您的账户有效期设置有误，请联系管理员');
              }
              
              if (now > expireDate) {
                throw new Error('您的账户已到期，请联系管理员');
              }
            }
            
            const roleCode = foundClient.role || 'super_admin';
            const roleName = roleCode === 'super_admin' ? '总管理员' : roleCode === 'main_admin' ? '主管理员' : '管理员';
            const user: User = {
              id: foundClient.id,
              username: foundClient.contactName,
              realName: foundClient.contactName,
              phone: foundClient.phone,
              email: '',
              role: { code: roleCode, name: roleName },
              tenantId: foundClient.id,
              tenantName: foundClient.name,
              tenant: { name: foundClient.name },
            };
            set({ user, token: 'mock-token-' + Date.now(), isAuthenticated: true });
            resetLoginFail();
            set({ loginFailCount: 0, locked: false });
            return;
          }

          // 从共享数据中查询员工（由管理员在系统设置中添加的员工）
          const sharedEmployees = await fetchSharedEmployees();
          const foundEmployee = sharedEmployees.find(e =>
            e.phone === phone && e.password === password && e.status === 'active'
          );

          if (foundEmployee) {
            const roleCode = foundEmployee.roleCode || 'employee';
            const roleName = roleCode === 'super_admin' ? '总管理员'
              : roleCode === 'main_admin' ? '主管理员'
              : roleCode === 'sub_admin' ? '分管理员'
              : roleCode === 'manager' ? '负责人'
              : '员工';
            const empUser: User = {
              id: foundEmployee.key,
              username: foundEmployee.phone,
              realName: foundEmployee.name,
              phone: foundEmployee.phone,
              email: '',
              role: { code: roleCode, name: roleName },
              tenantId: '',
              tenantName: foundEmployee.tenantName || tenantName,
              tenant: { name: foundEmployee.tenantName || tenantName },
            };
            set({ user: empUser, token: 'mock-token-' + Date.now(), isAuthenticated: true });
            resetLoginFail();
            set({ loginFailCount: 0, locked: false });
            return;
          }

          const failCount = incrementLoginFail();
          set({ loginFailCount: failCount, locked: isLocked() });
          const remaining = MAX_LOGIN_ATTEMPTS - failCount;
          if (remaining <= 0) {
            throw new Error('账号已锁定，请30分钟后再试');
          }
          throw new Error(`账号或密码错误，已失败 ${failCount} 次，连续5次将锁定30分钟`);
        }
      },

      oauthLogin: async (platform: string, code: string, state?: string) => {
        try {
          const response = await axios.post('/api/v1/auth/oauth/login', {
            platform,
            code,
            state,
            clientType: 'client'
          });
          const { token, user } = response.data.data;
          set({ user, token, isAuthenticated: true });
          resetLoginFail();
          set({ loginFailCount: 0, locked: false });
          localStorage.setItem('token', token);
        } catch (error: any) {
          const errMsg = error.response?.data?.message || error.message || '第三方登录失败';
          throw new Error(errMsg);
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('token');
      },

      getCurrentUser: async () => {
        try {
          const token = get().token || localStorage.getItem('token');
          if (!token) throw new Error('未登录');
          const response = await axios.get('/api/v1/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          set({ user: response.data.data, isAuthenticated: true });
        } catch (error) {
          set({ user: null, token: null, isAuthenticated: false });
          localStorage.removeItem('token');
          throw error;
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated })
    }
  )
);