import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/views/Layout.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/Dashboard.vue'),
          meta: { title: '概览', icon: 'Odometer' },
        },
        {
          path: 'bookings',
          name: 'BookingList',
          component: () => import('@/views/BookingList.vue'),
          meta: { title: '预约列表', icon: 'List' },
        },
        {
          path: 'availability',
          name: 'AvailabilityConfig',
          component: () => import('@/views/AvailabilityConfig.vue'),
          meta: { title: '可用性配置', icon: 'Calendar' },
        },
        {
          path: 'api-info',
          name: 'ApiInfo',
          component: () => import('@/views/ApiInfo.vue'),
          meta: { title: '接口信息', icon: 'Connection' },
        },
        {
          path: 'preview',
          name: 'PreviewTest',
          component: () => import('@/views/PreviewTest.vue'),
          meta: { title: '页面预览', icon: 'View' },
        },
      ],
    },
  ],
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  if (!to.meta.public && !authStore.isLoggedIn) {
    next('/login');
  } else {
    next();
  }
});

export default router;
