import axios from 'axios';
import { message } from 'antd';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || '';
const baseURL = API_URL ? `${API_URL}/api/v1` : '/api/v1';

// 创建axios实例
const request = axios.create({
  baseURL,
  timeout: 10000
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token || localStorage.getItem('token');
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
    const { data } = response;
    
    if (data.success) {
      return data;
    } else {
      message.error(data.message || '请求失败');
      return Promise.reject(new Error(data.message));
    }
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        message.error('未授权，请重新登录');
        useAuthStore.getState().logout();
        window.location.href = '/login';
      } else if (status === 403) {
        message.error('权限不足');
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
