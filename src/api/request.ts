import axios from 'axios';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 自动附加当前 site 到 query 参数（登录接口除外）
  if (config.url && !config.url.endsWith('/login')) {
    const site = localStorage.getItem('admin_site');
    const role = localStorage.getItem('admin_role');
    if (site && role === 'site') {
      config.params = { ...config.params, site };
    }
  }

  return config;
});

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem('admin_token');
      if (token) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_username');
        localStorage.removeItem('admin_role');
        localStorage.removeItem('admin_site');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default request;
