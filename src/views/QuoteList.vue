<template>
  <div class="quote-management">
    <div class="page-header">
      <h2>报价管理</h2>
      <div class="filters">
        <el-select v-model="selectedSite" placeholder="选择店铺" style="width: 160px" @change="handleSiteChange">
          <el-option v-for="s in allSites" :key="s" :label="s" :value="s" />
        </el-select>
      </div>
    </div>

    <el-tabs v-model="activeTab">
      <!-- ==================== Tab 1: 报价记录 ==================== -->
      <el-tab-pane label="报价记录" name="records">
        <el-table :data="quotes" style="width: 100%" v-loading="loading" size="default">
          <!-- 店铺列（超管时显示在最前面） -->
          <el-table-column v-if="authStore.isSuper" prop="site" label="店铺" width="110" />

          <el-table-column label="Card Type" width="130">
            <template #default="{ row }">{{ row.formData?.cardType || '-' }}</template>
          </el-table-column>
          <el-table-column label="Quantity" width="100" align="center">
            <template #default="{ row }">{{ row.formData?.quantity || '-' }}</template>
          </el-table-column>
          <el-table-column label="Budget Range" width="140">
            <template #default="{ row }">{{ row.formData?.budgetRange || '-' }}</template>
          </el-table-column>
          <el-table-column label="Email" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">{{ row.formData?.email || '-' }}</template>
          </el-table-column>
          <el-table-column label="文件" min-width="130" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.fileName" :title="row.fileName" class="file-name">{{ row.fileName }}</span>
              <span v-else style="color: #c0c4cc">-</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="提交时间" width="150" align="center">
            <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="240" fixed="right" align="center">
            <template #default="{ row }">
              <div class="action-btns">
                <el-button
                  v-if="row.fileId && row.fileName"
                  size="small"
                  type="primary"
                  :loading="downloading === row.id"
                  :disabled="!!downloading || !!deleting"
                  @click="handleDownload(row)"
                >
                  <el-icon><Download /></el-icon>下载
                </el-button>
                <span v-else class="btn-placeholder">-</span>

                <el-popconfirm title="确定删除此报价记录吗？" @confirm="handleDelete(row.id)">
                  <template #reference>
                    <el-button
                      size="small"
                      type="danger"
                      :loading="deleting === row.id"
                      :disabled="!!downloading || !!deleting"
                    >删除</el-button>
                  </template>
                </el-popconfirm>

                <el-dropdown trigger="click" @command="(cmd: string) => handleStatus(row.id, cmd)">
                  <el-button size="small" :disabled="!!downloading || !!deleting">
                    状态 <el-icon><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-item command="viewed">标记已查看</el-dropdown-item>
                    <el-dropdown-item command="quoted">标记已报价</el-dropdown-item>
                    <el-dropdown-item command="closed">标记已关闭</el-dropdown-item>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination" v-if="total > pageSize">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="total"
            layout="prev, pager, total"
            @current-change="loadQuotes"
          />
        </div>
      </el-tab-pane>

      <!-- ==================== Tab 2: 选项配置 ==================== -->
      <el-tab-pane label="选项配置" name="options">
        <div v-for="field in optionFields" :key="field.key" class="option-group">
          <div class="option-group-header">
            <h3>{{ field.label }}</h3>
            <el-button type="primary" size="small" @click="showAddDialog(field.key, field.label)">
              <el-icon><Plus /></el-icon> 新增
            </el-button>
          </div>

          <el-table :data="getOptionsByField(field.key)" size="small" style="width: 100%">
            <el-table-column prop="label" label="显示名称" min-width="160" />
            <el-table-column prop="value" label="存储值" min-width="160" />
            <el-table-column label="排序" width="70" align="center">
              <template #default="{ row }">{{ row.sortOrder }}</template>
            </el-table-column>
            <el-table-column label="状态" width="70" align="center">
              <template #default="{ row }">
                <el-tag :type="row.isActive ? 'success' : 'info'" size="small">{{ row.isActive ? '启用' : '禁用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="130" align="center">
              <template #default="{ row }">
                <el-button size="small" link @click="showEditDialog(row)">编辑</el-button>
                <el-popconfirm title="确定删除此选项吗？" @confirm="handleDeleteOption(row.id)">
                  <template #reference>
                    <el-button size="small" type="danger" link>删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 选项编辑对话框 -->
    <el-dialog v-model="optionDialog.visible" :title="optionDialog.title" width="420px">
      <el-form :model="optionDialog.form" label-width="80px">
        <el-form-item label="所属字段">
          <el-input :model-value="optionDialog.fieldLabel" disabled />
        </el-form-item>
        <el-form-item label="显示名称" required>
          <el-input v-model="optionDialog.form.label" placeholder="如：Standard Card" />
        </el-form-item>
        <el-form-item label="存储值" required>
          <el-input v-model="optionDialog.form.value" placeholder="如：standard" />
          <div class="form-tip">提交报价时传的值，建议英文小写</div>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="optionDialog.form.sortOrder" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="optionDialog.form.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="optionDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveOption" :loading="optionDialog.saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { ArrowDown, Plus, Download } from '@element-plus/icons-vue';
import {
  getQuoteList, updateQuoteStatus, deleteQuote, downloadQuoteFile,
  getFormOptions, createFormOption, updateFormOption, deleteFormOption,
} from '@/api/admin';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

// ========== 通用 ==========
const activeTab = ref('records');
const selectedSite = ref('apopresent');

const allSites = computed(() => {
  if (authStore.isSuper) return ['apopresent', 'coollaa', 'longshade'];
  return [authStore.site];
});

function handleSiteChange() {
  loadQuotes();
  loadOptions();
}

onMounted(() => {
  if (!authStore.isSuper) selectedSite.value = authStore.site;
  loadQuotes();
  loadOptions();
});

// ========== 报价记录 ==========
const loading = ref(false);
const quotes = ref<any[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = 20;
const downloading = ref<string | null>(null);
const deleting = ref<string | null>(null);

async function loadQuotes() {
  loading.value = true;
  try {
    const site = authStore.isSuper ? selectedSite.value : authStore.site;
    const res = await getQuoteList(currentPage.value, pageSize, site || undefined);
    quotes.value = res.quotes;
    total.value = res.total;
  } catch {
    ElMessage.error('加载报价列表失败');
  } finally {
    loading.value = false;
  }
}

async function handleStatus(id: string, status: string) {
  try {
    const site = authStore.isSuper ? selectedSite.value : authStore.site;
    await updateQuoteStatus(id, status, site || undefined);
    ElMessage.success('状态已更新');
    loadQuotes();
  } catch {
    ElMessage.error('操作失败');
  }
}

async function handleDelete(id: string) {
  deleting.value = id;
  try {
    const site = authStore.isSuper ? selectedSite.value : authStore.site;
    await deleteQuote(id, site || undefined);
    ElMessage.success('已删除');
    loadQuotes();
  } catch {
    ElMessage.error('删除失败');
  } finally {
    deleting.value = null;
  }
}

async function handleDownload(row: any) {
  downloading.value = row.id;
  try {
    const site = authStore.isSuper ? selectedSite.value : authStore.site;
    const { downloadUrl } = await downloadQuoteFile(row.id, site || undefined);
    window.open(downloadUrl, '_blank');
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || '下载失败');
  } finally {
    downloading.value = null;
  }
}

function statusType(status: string) {
  const map: Record<string, string> = { pending: 'warning', viewed: 'info', quoted: 'success', closed: '' };
  return map[status] || 'info';
}
function statusLabel(status: string) {
  const map: Record<string, string> = { pending: '待处理', viewed: '已查看', quoted: '已报价', closed: '已关闭' };
  return map[status] || status;
}
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

// ========== 选项配置 ==========
const options = ref<any[]>([]);

const optionFields = [
  { key: 'cardType', label: 'Card Type（卡片类型）' },
  { key: 'budgetRange', label: 'Budget Range（预算范围）' },
];

function getOptionsByField(fieldKey: string) {
  return options.value.filter(o => o.fieldKey === fieldKey);
}

async function loadOptions() {
  try {
    options.value = await getFormOptions(selectedSite.value);
  } catch {
    ElMessage.error('加载选项失败');
  }
}

const optionDialog = reactive({
  visible: false,
  title: '',
  fieldKey: '',
  fieldLabel: '',
  editingId: null as string | null,
  saving: false,
  form: { label: '', value: '', sortOrder: 0, isActive: true },
});

function showAddDialog(fieldKey: string, fieldLabel: string) {
  optionDialog.editingId = null;
  optionDialog.fieldKey = fieldKey;
  optionDialog.fieldLabel = fieldLabel;
  optionDialog.title = `新增选项 - ${fieldLabel}`;
  optionDialog.form = { label: '', value: '', sortOrder: getOptionsByField(fieldKey).length, isActive: true };
  optionDialog.visible = true;
}

function showEditDialog(row: any) {
  optionDialog.editingId = row.id;
  optionDialog.fieldKey = row.fieldKey;
  optionDialog.fieldLabel = row.fieldKey === 'cardType' ? 'Card Type' : 'Budget Range';
  optionDialog.title = '编辑选项';
  optionDialog.form = { label: row.label, value: row.value, sortOrder: row.sortOrder, isActive: row.isActive };
  optionDialog.visible = true;
}

async function handleSaveOption() {
  if (!optionDialog.form.label || !optionDialog.form.value) {
    ElMessage.warning('请填写显示名称和存储值');
    return;
  }
  optionDialog.saving = true;
  try {
    if (optionDialog.editingId) {
      await updateFormOption(optionDialog.editingId, optionDialog.form);
      ElMessage.success('选项已更新');
    } else {
      await createFormOption({
        site: selectedSite.value,
        fieldKey: optionDialog.fieldKey,
        label: optionDialog.form.label,
        value: optionDialog.form.value,
      });
      ElMessage.success('选项已添加');
    }
    optionDialog.visible = false;
    loadOptions();
  } catch {
    ElMessage.error('操作失败');
  } finally {
    optionDialog.saving = false;
  }
}

async function handleDeleteOption(id: string) {
  try {
    await deleteFormOption(id);
    ElMessage.success('选项已删除');
    loadOptions();
  } catch {
    ElMessage.error('删除失败');
  }
}
</script>

<style scoped>
.quote-management {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.page-header h2 {
  margin: 0;
  font-size: 18px;
}
.file-name {
  display: inline-block;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #409eff;
  vertical-align: middle;
}
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
.option-group {
  margin-bottom: 28px;
}
.option-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.option-group-header h3 {
  margin: 0;
  font-size: 15px;
  color: #333;
}
.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
.action-btns {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.btn-placeholder {
  color: #c0c4cc;
  font-size: 12px;
  width: 56px;
  text-align: center;
}
</style>
