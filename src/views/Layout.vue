<template>
  <el-container class="layout">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon size="24"><setting /></el-icon>
        <span>{{ logoTitle }}</span>
      </div>
      <el-menu
        :default-active="$route.path"
        router
        class="menu"
        background-color="#001529"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="breadcrumb">
          <el-breadcrumb>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="user-info">
          <el-tag v-if="authStore.isSuper" type="danger" size="small" style="margin-right: 12px">超管</el-tag>
          <el-tag v-else type="info" size="small" style="margin-right: 12px">{{ authStore.site }}</el-tag>
          <el-dropdown @command="handleCommand">
            <span class="user-name">
              {{ authStore.username || 'admin' }} <el-icon><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const logoTitle = computed(() => {
  if (authStore.isSuper) {
    return '管理后台 (超管)';
  }
  return `管理后台 - ${authStore.site}`;
});

const menuItems = [
  { path: '/dashboard', title: '概览', icon: 'Odometer' },
  { path: '/bookings', title: '预约列表', icon: 'List' },
  { path: '/availability', title: '可用性配置', icon: 'Calendar' },
  { path: '/preview', title: '页面预览', icon: 'View' },
  { path: '/api-info', title: '接口信息', icon: 'Connection' },
];

const currentTitle = computed(() => {
  const item = menuItems.find((m) => m.path === route.path);
  return item?.title || '管理后台';
});

function handleCommand(cmd: string) {
  if (cmd === 'logout') {
    authStore.logout();
    ElMessage.success('已退出');
    router.push('/login');
  }
}
</script>

<style scoped>
.layout {
  height: 100vh;
}
.sidebar {
  background: #001529;
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #002140;
}
.menu {
  border-right: none;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
.user-info {
  display: flex;
  align-items: center;
}
.user-name {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}
.main {
  background: #f0f2f5;
  padding: 20px;
}
</style>
