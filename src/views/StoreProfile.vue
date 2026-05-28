<template>
  <div class="store-profile">
    <h2>店铺信息</h2>

    <el-card class="profile-card">
      <el-form :model="form" label-width="100px" v-loading="loading">
        <el-form-item label="店铺名称">
          <el-input v-model="form.name" disabled />
          <div class="form-tip">店铺标识，由超管创建</div>
        </el-form-item>

        <el-form-item label="登录账号">
          <el-input v-model="form.username" disabled />
        </el-form-item>

        <el-form-item label="已开启功能">
          <div class="features">
            <el-tag v-if="form.isBookingEnabled" type="success">预约功能</el-tag>
            <el-tag v-if="form.isVotingEnabled" type="success">投票功能</el-tag>
            <el-tag v-if="!form.isBookingEnabled && !form.isVotingEnabled" type="info">暂无功能</el-tag>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/api/request';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const loading = ref(false);

const form = ref({
  name: '',
  username: '',
  isBookingEnabled: false,
  isVotingEnabled: false,
});

onMounted(() => {
  loadStoreInfo();
});

async function loadStoreInfo() {
  loading.value = true;
  try {
    const store: any = await request.get(`/admin/stores/${authStore.site}`);
    form.value = {
      name: store.name,
      username: store.users?.[0]?.username || store.name,
      isBookingEnabled: store.isBookingEnabled,
      isVotingEnabled: store.isVotingEnabled,
    };
  } catch (error) {
    ElMessage.error('加载店铺信息失败');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.store-profile {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}
.profile-card {
  max-width: 500px;
}
.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
.features {
  display: flex;
  gap: 8px;
}
</style>
