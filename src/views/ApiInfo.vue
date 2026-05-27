<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span>接口信息</span>
          <el-button type="primary" @click="handleRefresh">刷新状态</el-button>
        </div>
      </template>

      <el-descriptions title="服务状态" :column="2" border>
        <el-descriptions-item label="后端地址">{{ apiBase }}</el-descriptions-item>
        <el-descriptions-item label="健康状态">
          <el-tag :type="healthStatus === 'ok' ? 'success' : 'danger'">
            {{ healthStatus === 'ok' ? '正常' : '异常' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="数据库">MySQL</el-descriptions-item>
        <el-descriptions-item label="时区">Asia/Shanghai (UTC+8)</el-descriptions-item>
        <el-descriptions-item label="当前账号">{{ authStore.username }}</el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag :type="authStore.isSuper ? 'danger' : 'info'">
            {{ authStore.isSuper ? '超管' : '店铺管理员' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="!authStore.isSuper" label="所属店铺">{{ authStore.site }}</el-descriptions-item>
        <el-descriptions-item v-else label="查看范围">全部店铺</el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <h3>管理后台接口列表</h3>
      <el-table :data="apiList" stripe style="margin-top: 16px">
        <el-table-column prop="method" label="方法" width="80">
          <template #default="{ row }">
            <el-tag :type="methodType(row.method)" size="small">{{ row.method }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路径" width="280" />
        <el-table-column prop="desc" label="说明" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === '正常' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const apiBase = ref(window.location.origin);
const healthStatus = ref('unknown');

const apiList = ref([
  { method: 'POST', path: '/api/admin/login', desc: '管理员登录', status: '正常' },
  { method: 'GET', path: '/api/admin/bookings', desc: '预约列表（支持分页、店铺筛选）', status: '正常' },
  { method: 'PUT', path: '/api/admin/bookings/:id/cancel', desc: '取消预约', status: '正常' },
  { method: 'GET', path: '/api/admin/stats', desc: '统计数据（支持店铺筛选）', status: '正常' },
  { method: 'GET', path: '/api/admin/availability', desc: '获取可用性配置', status: '正常' },
  { method: 'PUT', path: '/api/admin/availability', desc: '保存可用性配置', status: '正常' },
  { method: 'GET', path: '/api/admin/holidays', desc: '获取特殊日期', status: '正常' },
  { method: 'POST', path: '/api/admin/holidays', desc: '添加特殊日期', status: '正常' },
  { method: 'DELETE', path: '/api/admin/holidays/:id', desc: '删除特殊日期', status: '正常' },
  { method: 'GET', path: '/health', desc: '服务健康检查', status: '正常' },
]);

function methodType(method: string) {
  const map: Record<string, string> = {
    GET: 'success',
    POST: 'primary',
    PUT: 'warning',
    DELETE: 'danger',
  };
  return map[method] || 'info';
}

async function handleRefresh() {
  try {
    const res = await fetch('/health');
    const data = await res.json();
    healthStatus.value = data.status || 'ok';
    ElMessage.success('状态刷新成功');
  } catch {
    healthStatus.value = 'error';
    ElMessage.error('后端服务异常');
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}
</style>
