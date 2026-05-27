<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span>预约列表</span>
          <div style="display: flex; align-items: center; gap: 12px">
            <!-- 超管站点筛选 -->
            <el-select
              v-if="authStore.isSuper"
              v-model="selectedSite"
              placeholder="全部店铺"
              clearable
              size="small"
              style="width: 150px"
              @change="handleSiteChange"
            >
              <el-option label="全部店铺" value="" />
              <el-option v-for="s in allSites" :key="s" :label="s" :value="s" />
            </el-select>
            <el-button type="primary" @click="handleRefresh">刷新</el-button>
          </div>
        </div>
      </template>

      <el-table :data="bookingList" v-loading="loading" stripe>
        <el-table-column v-if="authStore.isSuper" prop="site" label="店铺" width="100" />
        <el-table-column prop="lastName" label="姓氏" width="100" />
        <el-table-column prop="firstName" label="名字" width="100" />
        <el-table-column prop="company" label="公司" width="180" />
        <el-table-column prop="phone" label="电话" width="140" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column label="预约时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="时长" width="80">
          <template #default="{ row }">
            {{ row.duration }} 分钟
          </template>
        </el-table-column>
        <el-table-column prop="meetingType" label="会议方式" width="120" />
        <el-table-column prop="userTimezone" label="用户时区" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'confirmed' ? 'success' : 'info'">
              {{ row.status === 'confirmed' ? '已确认' : row.status === 'cancelled' ? '已取消' : row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'confirmed'"
              size="small"
              type="danger"
              @click="handleCancel(row)"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        style="margin-top: 20px; justify-content: flex-end"
        @current-change="handlePageChange"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getBookings, cancelBooking } from '@/api/admin';
import { useAuthStore } from '@/stores/auth';
import type { BookingRecord } from '@/api/admin';

const authStore = useAuthStore();
const allSites = ['coollaa', 'longshade'];
const selectedSite = ref(authStore.viewSite || '');

const loading = ref(false);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const bookingList = ref<BookingRecord[]>([]);

async function loadData() {
  loading.value = true;
  try {
    const siteParam = selectedSite.value || undefined;
    const res = await getBookings(page.value, pageSize.value, undefined, siteParam);
    bookingList.value = res.items;
    total.value = res.total;
    page.value = res.page;
    pageSize.value = res.pageSize;
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.error || '加载数据失败');
  } finally {
    loading.value = false;
  }
}

function handlePageChange(newPage: number) {
  page.value = newPage;
  loadData();
}

function handleSiteChange() {
  authStore.setViewSite(selectedSite.value);
  page.value = 1;
  loadData();
}

function handleRefresh() {
  loadData();
}

function formatDateTime(iso: string) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function handleCancel(row: BookingRecord) {
  try {
    await ElMessageBox.confirm('确定要取消这条预约吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await cancelBooking(row.id);
    ElMessage.success('预约已取消');
    loadData();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.response?.data?.error || '取消失败');
    }
  }
}

onMounted(loadData);
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
