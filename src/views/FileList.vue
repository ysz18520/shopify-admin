<template>
  <div class="file-list">
    <div class="page-header">
      <h2>文件管理</h2>
      <div class="filters">
        <el-select v-if="authStore.isSuper" v-model="selectedSite" placeholder="选择店铺" clearable style="width: 160px" @change="loadFiles">
          <el-option v-for="s in allSites" :key="s" :label="s" :value="s" />
        </el-select>
      </div>
    </div>

    <el-table :data="files" style="width: 100%" v-loading="loading">
      <el-table-column prop="fileName" label="文件名" min-width="200" show-overflow-tooltip />
      <el-table-column label="大小" width="110" align="center">
        <template #default="{ row }">{{ formatSize(row.fileSize) }}</template>
      </el-table-column>
      <el-table-column prop="mimeType" label="类型" width="150" show-overflow-tooltip />
      <el-table-column v-if="authStore.isSuper" prop="site" label="店铺" width="120" />
      <el-table-column label="上传时间" width="170" align="center">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right" align="center">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="copyUrl(row.fileUrl)">复制链接</el-button>
          <el-popconfirm title="确定删除此文件吗？" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button size="small" type="danger" link>删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination" v-if="total > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, total"
        @current-change="loadFiles"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { getFileList, deleteFile } from '@/api/admin';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const loading = ref(false);
const files = ref<any[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = 20;
const selectedSite = ref('');

const allSites = computed(() => {
  if (authStore.isSuper) return ['apopresent', 'coollaa', 'longshade'];
  return [authStore.site];
});

onMounted(() => {
  if (!authStore.isSuper) {
    selectedSite.value = authStore.site;
  }
  loadFiles();
});

async function loadFiles() {
  loading.value = true;
  try {
    const site = authStore.isSuper ? selectedSite.value : authStore.site;
    const res = await getFileList(currentPage.value, pageSize, site || undefined);
    files.value = res.files;
    total.value = res.total;
  } catch {
    ElMessage.error('加载文件列表失败');
  } finally {
    loading.value = false;
  }
}

async function handleDelete(id: string) {
  try {
    const site = authStore.isSuper ? selectedSite.value : authStore.site;
    await deleteFile(id, site || undefined);
    ElMessage.success('文件已删除');
    loadFiles();
  } catch {
    ElMessage.error('删除失败');
  }
}

function copyUrl(url: string) {
  navigator.clipboard.writeText(url).then(() => {
    ElMessage.success('链接已复制');
  }).catch(() => {
    ElMessage.error('复制失败');
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}
</script>

<style scoped>
.file-list {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-header h2 {
  margin: 0;
  font-size: 18px;
}
.filters {
  display: flex;
  gap: 12px;
}
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
