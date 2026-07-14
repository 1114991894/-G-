import axios from 'axios';
import { message } from 'antd';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || '';
const baseURL = API_URL ? `${API_URL}/api/v1` : '/api/v1';

const request = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        message.error('登录已过期，请重新登录');
        useAuthStore.getState().logout();
        window.location.href = '/login';
      } else if (status === 403) {
        message.error('没有权限访问');
      } else if (status === 500) {
        message.error('服务器错误');
      } else {
        message.error(data.message || '请求失败');
      }
    } else {
      message.error('网络错误');
    }
    
    return Promise.reject(error);
  }
);

export default request;
