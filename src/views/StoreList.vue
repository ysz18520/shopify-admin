<template>
  <div class="store-list">
    <div class="page-header">
      <h2>店铺管理</h2>
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon> 添加店铺
      </el-button>
    </div>

    <el-table :data="stores" style="width: 100%" v-loading="loading">
      <el-table-column prop="name" label="店铺名称" width="140" />
      <el-table-column label="登录账号" width="120">
        <template #default="{ row }">
          <span v-if="row.users && row.users.length > 0">{{ row.users[0].username }}</span>
          <span v-else style="color: #999">未创建</span>
        </template>
      </el-table-column>
      <el-table-column label="登录密码" width="120">
        <template #default="{ row }">
          <span v-if="row.users && row.users.length > 0">{{ row.name }}</span>
          <span v-else style="color: #999">-</span>
        </template>
      </el-table-column>
      <el-table-column label="预约功能" width="100" align="center">
        <template #default="{ row }">
          <el-switch
            v-model="row.isBookingEnabled"
            @change="handleToggleFeature(row.name, 'isBookingEnabled', row.isBookingEnabled)"
          />
        </template>
      </el-table-column>
      <el-table-column label="上传限制" width="120" align="center">
        <template #default="{ row }">
          {{ formatMaxSize(row.maxFileSize) }}
        </template>
      </el-table-column>
      <el-table-column label="允许类型" min-width="120">
        <template #default="{ row }">
          <span v-if="row.allowedFileTypes === '*'">全部</span>
          <span v-else>{{ row.allowedFileTypes }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="showUploadConfigDialog(row)">上传配置</el-button>
          <el-button size="small" @click="showEditDialog(row)">编辑</el-button>
          <el-popconfirm title="确定删除此店铺吗？相关功能数据也会被清除。" @confirm="handleDelete(row.name)">
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加对话框 -->
    <el-dialog v-model="addDialogVisible" title="添加店铺" width="400px">
      <el-form :model="addForm" label-width="80px">
        <el-form-item label="店铺名称" :required="true">
          <el-input v-model="addForm.name" placeholder="例如：coollaa, longshade" />
          <div class="form-tip">小写字母、数字和连字符，也是 API 中使用的 site 标识</div>
        </el-form-item>
      </el-form>
      <div class="dialog-tip">
        <el-icon><InfoFilled /></el-icon>
        添加后会自动创建登录账号（账号密码均为店铺名称）
      </div>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAdd" :loading="submitting">添加</el-button>
      </template>
    </el-dialog>

    <!-- 编辑对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑店铺" width="400px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="店铺名称" :required="true">
          <el-input v-model="editForm.name" placeholder="例如：coollaa, longshade" />
          <div class="form-tip">修改后会同步更新所有相关功能中的标识</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEdit" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>

    <!-- 上传配置对话框 -->
    <el-dialog v-model="uploadConfigVisible" title="上传配置" width="450px">
      <el-form :model="uploadConfigForm" label-width="100px">
        <el-form-item label="店铺">
          <el-input :model-value="uploadConfigForm.storeName" disabled />
        </el-form-item>
        <el-form-item label="最大文件大小">
          <el-input-number
            v-model="uploadConfigForm.maxFileSizeMB"
            :min="1"
            :max="200"
            :step="1"
          />
          <span style="margin-left: 8px">MB</span>
        </el-form-item>
        <el-form-item label="允许文件类型">
          <el-input
            v-model="uploadConfigForm.allowedFileTypes"
            placeholder="* 表示允许全部"
          />
          <div class="form-tip">用逗号分隔，如 .jpg,.png,.pdf,.docx；输入 * 表示允许所有类型</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadConfigVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveUploadConfig" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, InfoFilled } from '@element-plus/icons-vue';
import request from '@/api/request';

interface Store {
  id: string;
  name: string;
  isBookingEnabled: boolean;
  maxFileSize: number;
  allowedFileTypes: string;
  users?: Array<{ id: string; username: string; role: string }>;
}

const stores = ref<Store[]>([]);
const loading = ref(false);
const addDialogVisible = ref(false);
const editDialogVisible = ref(false);
const uploadConfigVisible = ref(false);
const submitting = ref(false);
const editingStore = ref<Store | null>(null);

const addForm = ref({ name: '' });
const editForm = ref({ name: '' });
const uploadConfigForm = ref({
  storeName: '',
  maxFileSizeMB: 50,
  allowedFileTypes: '*',
});

onMounted(() => {
  loadStores();
});

async function loadStores() {
  loading.value = true;
  try {
    const res: any = await request.get('/admin/stores');
    stores.value = res;
  } catch {
    ElMessage.error('加载店铺列表失败');
  } finally {
    loading.value = false;
  }
}

function showAddDialog() {
  addForm.value = { name: '' };
  addDialogVisible.value = true;
}

function showEditDialog(store: Store) {
  editingStore.value = store;
  editForm.value = { name: store.name };
  editDialogVisible.value = true;
}

function showUploadConfigDialog(store: Store) {
  uploadConfigForm.value = {
    storeName: store.name,
    maxFileSizeMB: Math.round(store.maxFileSize / 1024 / 1024),
    allowedFileTypes: store.allowedFileTypes,
  };
  uploadConfigVisible.value = true;
}

async function handleSaveUploadConfig() {
  submitting.value = true;
  try {
    await request.put(`/admin/stores/${uploadConfigForm.value.storeName}`, {
      maxFileSize: uploadConfigForm.value.maxFileSizeMB * 1024 * 1024,
      allowedFileTypes: uploadConfigForm.value.allowedFileTypes,
    });
    ElMessage.success('上传配置已更新');
    uploadConfigVisible.value = false;
    loadStores();
  } catch (error: any) {
    const msg = error.response?.data?.error || '操作失败';
    ElMessage.error(msg);
  } finally {
    submitting.value = false;
  }
}

async function handleAdd() {
  if (!addForm.value.name) {
    ElMessage.warning('请填写店铺名称');
    return;
  }
  submitting.value = true;
  try {
    const res: any = await request.post('/admin/stores', addForm.value);
    ElMessage.success(`店铺已添加，登录账号：${res.name}，密码：${res.name}`);
    addDialogVisible.value = false;
    loadStores();
  } catch (error: any) {
    const msg = error.response?.data?.error || '操作失败';
    ElMessage.error(msg);
  } finally {
    submitting.value = false;
  }
}

async function handleEdit() {
  if (!editForm.value.name || !editingStore.value) {
    ElMessage.warning('请填写店铺名称');
    return;
  }
  if (editForm.value.name === editingStore.value.name) {
    editDialogVisible.value = false;
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定将店铺标识从 "${editingStore.value.name}" 修改为 "${editForm.value.name}" 吗？\n\n这会同步更新预约等功能中的相关数据。`,
      '确认修改',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    );
  } catch {
    return;
  }
  submitting.value = true;
  try {
    await request.put(`/admin/stores/${editingStore.value.name}/rename`, editForm.value);
    ElMessage.success('店铺已更新');
    editDialogVisible.value = false;
    loadStores();
  } catch (error: any) {
    const msg = error.response?.data?.error || '操作失败';
    ElMessage.error(msg);
  } finally {
    submitting.value = false;
  }
}

async function handleToggleFeature(storeName: string, field: string, value: boolean) {
  try {
    await request.put(`/admin/stores/${storeName}`, { [field]: value });
    ElMessage.success('功能已更新');
  } catch (error: any) {
    const msg = error.response?.data?.error || '操作失败';
    ElMessage.error(msg);
    loadStores();
  }
}

async function handleDelete(name: string) {
  try {
    await ElMessageBox.confirm(
      `确定删除店铺 "${name}" 吗？\n\n这会删除该店铺的所有相关数据（预约记录、文件、配置等），此操作不可恢复。`,
      '确认删除',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
    );
  } catch {
    return;
  }
  try {
    await request.delete(`/admin/stores/${name}`);
    ElMessage.success('店铺已删除');
    loadStores();
  } catch (error: any) {
    const msg = error.response?.data?.error || '删除失败';
    ElMessage.error(msg);
  }
}

function formatMaxSize(bytes: number): string {
  if (!bytes) return '50MB';
  return Math.round(bytes / 1024 / 1024) + 'MB';
}
</script>

<style scoped>
.store-list {
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
.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
.dialog-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 13px;
  color: #666;
}
</style>
