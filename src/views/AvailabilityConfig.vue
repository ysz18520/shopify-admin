<template>
  <div>
    <!-- 超管站点选择 -->
    <el-card v-if="authStore.isSuper" style="margin-bottom: 20px">
      <div style="display: flex; align-items: center; gap: 16px">
        <span style="font-size: 14px; color: #666">配置店铺：</span>
        <el-select
          v-model="selectedSite"
          placeholder="请选择店铺"
          style="width: 200px"
          @change="handleSiteChange"
        >
          <el-option v-for="s in allSites" :key="s" :label="s" :value="s" />
        </el-select>
      </div>
    </el-card>

    <div v-if="!authStore.isSuper || selectedSite">
      <el-row :gutter="20">
        <!-- 工作日配置 -->
        <el-col :span="12">
          <el-card>
            <template #header>工作日设置</template>
            <el-form label-width="100px">
              <el-form-item v-for="day in weekDays" :key="day.value" :label="day.label">
                <el-time-select
                  v-model="workConfig[day.value].start"
                  start="06:00"
                  step="00:15"
                  end="22:00"
                  placeholder="开始"
                  style="width: 120px"
                />
                <span style="margin: 0 10px">至</span>
                <el-time-select
                  v-model="workConfig[day.value].end"
                  start="06:00"
                  step="00:15"
                  end="22:00"
                  placeholder="结束"
                  style="width: 120px"
                />
                <el-switch
                  v-model="workConfig[day.value].active"
                  active-text="可约"
                  inactive-text="不可约"
                  style="margin-left: 20px"
                />
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>

        <!-- 午休 & 特殊日期 -->
        <el-col :span="12">
          <el-card style="margin-bottom: 20px">
            <template #header>午休时间</template>
            <el-form label-width="80px">
              <el-form-item label="午休时段">
                <el-time-select
                  v-model="breakConfig.start"
                  start="10:00"
                  step="00:15"
                  end="18:00"
                  placeholder="开始"
                  style="width: 120px"
                />
                <span style="margin: 0 10px">至</span>
                <el-time-select
                  v-model="breakConfig.end"
                  start="10:00"
                  step="00:15"
                  end="18:00"
                  placeholder="结束"
                  style="width: 120px"
                />
              </el-form-item>
            </el-form>
          </el-card>

          <el-card>
            <template #header>
              <div class="card-header">
                <span>特殊日期（不可预约）</span>
                <el-button type="primary" size="small" @click="handleAddHoliday">添加</el-button>
              </div>
            </template>
            <el-table :data="holidayList" size="small" v-loading="holidayLoading">
              <el-table-column prop="date" label="日期" width="150" />
              <el-table-column prop="reason" label="原因" />
              <el-table-column label="操作" width="80">
                <template #default="{ row }">
                  <el-button size="small" type="danger" text @click="handleRemoveHoliday(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <el-row style="margin-top: 20px">
        <el-col :span="24" style="text-align: center">
          <el-button type="primary" size="large" :loading="saving" @click="handleSave">保存配置</el-button>
        </el-col>
      </el-row>
    </div>

    <el-empty v-else description="请选择要配置的店铺" />

    <!-- 添加特殊日期弹窗 -->
    <el-dialog v-model="dialogVisible" title="添加特殊日期" width="400px">
      <el-form :model="holidayForm" label-width="80px">
        <el-form-item label="日期">
          <el-date-picker v-model="holidayForm.date" type="date" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="holidayForm.reason" placeholder="如：公司团建、节假日等" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddHoliday">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { format } from 'date-fns';
import {
  getAvailability,
  saveAvailability,
  getHolidays,
  addHoliday,
  removeHoliday,
} from '@/api/admin';
import { useAuthStore } from '@/stores/auth';
import type { AvailabilityConfigItem, BreakConfigItem, HolidayRecord } from '@/api/admin';

const authStore = useAuthStore();
const allSites = ['coollaa', 'longshade'];
const selectedSite = ref(authStore.viewSite || '');

const weekDays = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 0 },
];

const workConfig = reactive<Record<number, { start: string; end: string; active: boolean }>>({
  0: { start: '', end: '', active: false },
  1: { start: '09:00', end: '18:00', active: true },
  2: { start: '09:00', end: '18:00', active: true },
  3: { start: '09:00', end: '18:00', active: true },
  4: { start: '09:00', end: '18:00', active: true },
  5: { start: '09:00', end: '18:00', active: true },
  6: { start: '', end: '', active: false },
});

const breakConfig = reactive({
  start: '12:00',
  end: '14:00',
});

const holidayList = ref<HolidayRecord[]>([]);
const holidayLoading = ref(false);
const saving = ref(false);

const dialogVisible = ref(false);
const holidayForm = reactive({
  date: '',
  reason: '',
});

function getSiteParam(): string | undefined {
  if (authStore.isSuper) {
    return selectedSite.value || undefined;
  }
  return undefined;
}

function applyAvailability(configs: AvailabilityConfigItem[]) {
  for (const c of configs) {
    workConfig[c.dayOfWeek] = {
      start: c.startTime,
      end: c.endTime,
      active: c.isActive,
    };
  }
}

function applyBreaks(breaks: BreakConfigItem[]) {
  if (breaks.length > 0) {
    breakConfig.start = breaks[0].startTime;
    breakConfig.end = breaks[0].endTime;
  }
}

function buildAvailabilityPayload(): AvailabilityConfigItem[] {
  return weekDays.map(({ value }) => ({
    dayOfWeek: value,
    startTime: workConfig[value].start,
    endTime: workConfig[value].end,
    isActive: workConfig[value].active,
  }));
}

function buildBreaksPayload(): BreakConfigItem[] {
  return [
    {
      startTime: breakConfig.start,
      endTime: breakConfig.end,
    },
  ];
}

async function loadAvailability() {
  const site = getSiteParam();
  if (authStore.isSuper && !site) return;
  try {
    const res = await getAvailability(site);
    applyAvailability(res.availability);
    applyBreaks(res.breaks);
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.error || '加载配置失败');
  }
}

async function loadHolidays() {
  const site = getSiteParam();
  if (authStore.isSuper && !site) return;
  holidayLoading.value = true;
  try {
    const res = await getHolidays(site);
    holidayList.value = res;
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.error || '加载节假日失败');
  } finally {
    holidayLoading.value = false;
  }
}

function handleAddHoliday() {
  holidayForm.date = '';
  holidayForm.reason = '';
  dialogVisible.value = true;
}

async function confirmAddHoliday() {
  if (!holidayForm.date) {
    ElMessage.warning('请选择日期');
    return;
  }
  const site = getSiteParam();
  if (authStore.isSuper && !site) {
    ElMessage.warning('请先选择店铺');
    return;
  }
  try {
    const dateStr = format(new Date(holidayForm.date), 'yyyy-MM-dd');
    await addHoliday(dateStr, holidayForm.reason || '特殊日期', site);
    dialogVisible.value = false;
    ElMessage.success('添加成功');
    loadHolidays();
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.error || '添加失败');
  }
}

async function handleRemoveHoliday(row: HolidayRecord) {
  const site = getSiteParam();
  try {
    await removeHoliday(row.id, site);
    ElMessage.success('删除成功');
    loadHolidays();
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.error || '删除失败');
  }
}

async function handleSave() {
  const site = getSiteParam();
  if (authStore.isSuper && !site) {
    ElMessage.warning('请先选择店铺');
    return;
  }
  saving.value = true;
  try {
    await saveAvailability(buildAvailabilityPayload(), buildBreaksPayload(), site);
    ElMessage.success('配置已保存');
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.error || '保存失败');
  } finally {
    saving.value = false;
  }
}

function handleSiteChange() {
  authStore.setViewSite(selectedSite.value);
  loadAvailability();
  loadHolidays();
}

onMounted(() => {
  loadAvailability();
  loadHolidays();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
