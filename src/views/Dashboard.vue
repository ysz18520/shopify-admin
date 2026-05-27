<template>
  <div>
    <!-- 超管站点筛选 -->
    <el-row v-if="authStore.isSuper" style="margin-bottom: 20px">
      <el-col :span="24">
        <el-card>
          <div style="display: flex; align-items: center; gap: 16px">
            <span style="font-size: 14px; color: #666">查看店铺：</span>
            <el-select
              v-model="selectedSite"
              placeholder="全部店铺"
              clearable
              style="width: 200px"
              @change="handleSiteChange"
            >
              <el-option label="全部店铺" value="" />
              <el-option v-for="s in allSites" :key="s" :label="s" :value="s" />
            </el-select>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-title">今日预约</div>
            <div class="stat-value">{{ stats.today }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-title">本周预约</div>
            <div class="stat-value">{{ stats.week }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-title">本月预约</div>
            <div class="stat-value">{{ stats.month }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-title">待处理</div>
            <div class="stat-value">{{ stats.pending }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card title="预约趋势">
          <template #header>近7天预约趋势</template>
          <div class="chart-placeholder">
            <el-empty description="数据加载中..." />
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>会议方式分布</template>
          <div class="chart-placeholder">
            <el-empty description="数据加载中..." />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getStats } from '@/api/admin';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const allSites = ['coollaa', 'longshade'];
const selectedSite = ref(authStore.viewSite || '');

const stats = reactive({
  today: 0,
  week: 0,
  month: 0,
  pending: 0,
});

async function loadStats() {
  try {
    const siteParam = selectedSite.value || undefined;
    const res = await getStats(siteParam);
    stats.today = res.today;
    stats.week = res.week;
    stats.month = res.month;
    stats.pending = res.pending;
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.error || '加载统计数据失败');
  }
}

function handleSiteChange() {
  authStore.setViewSite(selectedSite.value);
  loadStats();
}

onMounted(loadStats);
</script>

<style scoped>
.stat-item {
  text-align: center;
}
.stat-title {
  color: #999;
  font-size: 14px;
  margin-bottom: 10px;
}
.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
}
.chart-placeholder {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
