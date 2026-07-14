import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  incrementLoginFail, resetLoginFail, isLocked, getLoginFailCount,
  MAX_LOGIN_ATTEMPTS
} from '../utils/mockData';

interface User {
  id: string;
  username: string;
  realName: string;
  phone: string;
  email: string;
  role: string;
  tenantId: string;
  permissions?: string[];
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  loginFailCount: number;
  locked: boolean;
  login: (phone: string, password: string, clientType: 'client' | 'server') => Promise<void>;
  logout: () => void;
  checkLockStatus: () => void;
}

const ADMINS_KEY = 'server_admins';

const getAdmins = (): Record<string, { password: string; user: User }> => {
  const stored = localStorage.getItem(ADMINS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }
  return {};
};

const initDefaultAdmin = () => {
  const admins = getAdmins();
  if (!admins['13634169539']) {
    const defaultAdmins: Record<string, { password: string; user: User }> = {
      '13634169539': {
        password: 'liufachun888',
        user: {
          id: '1', username: '刘诠案', realName: '刘诠案', phone: '13634169539',
          email: 'liuchunan@bwg.com', role: 'super_admin', tenantId: 'server'
        }
      }
    };
    localStorage.setItem(ADMINS_KEY, JSON.stringify(defaultAdmins));
    return defaultAdmins;
  }
  return admins;
};

const mockAdmins = initDefaultAdmin();

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      loginFailCount: getLoginFailCount(),
      locked: isLocked(),

      checkLockStatus: () => {
        set({ locked: isLocked(), loginFailCount: getLoginFailCount() });
      },

      login: async (phone: string, password: string, clientType: 'client' | 'server') => {
        if (isLocked()) {
          throw new Error('账号已锁定，请稍后再试');
        }

        try {
          const response = await fetch(`/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: phone, password, clientType }),
          });

          if (!response.ok) {
            throw new Error('登录失败');
          }

          const data = await response.json();
          set({
            token: data.token,
            user: data.user,
            isAuthenticated: true,
          });
          resetLoginFail();
          set({ loginFailCount: 0, locked: false });
        } catch (error: any) {
          const admins = getAdmins();
          const mock = admins[phone];
          if (mock && mock.password === password) {
            const ADMINS_LIST_KEY = 'server_admins_list';
            const storedAdminsList = localStorage.getItem(ADMINS_LIST_KEY);
            let permissions: string[] = [];
            if (storedAdminsList) {
              try {
                const adminsList = JSON.parse(storedAdminsList);
                const adminRecord = adminsList.find((a: any) => a.phone === phone);
                if (adminRecord && adminRecord.permissions) {
                  permissions = adminRecord.permissions;
                }
              } catch {}
            }
            if (mock.user.role === 'super_admin') {
              permissions = ['dashboard', 'client_manage', 'client_assign', 'client_disable', 'client_edit', 'client_view_hidden', 'trial_review', 'system_settings'];
            }
            set({
              token: 'mock-token-' + Date.now(),
              user: { ...mock.user, permissions },
              isAuthenticated: true,
            });
            resetLoginFail();
            set({ loginFailCount: 0, locked: false });
            return;
          }
          const failCount = incrementLoginFail();
          set({ loginFailCount: failCount, locked: isLocked() });
          if (mock && mock.password !== password) {
            throw new Error(`密码错误，剩余尝试次数 ${MAX_LOGIN_ATTEMPTS - failCount} 次`);
          }
          throw new Error('请联系管理员开通权限');
        }
      },
      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'server-auth-storage',
    }
  )
);