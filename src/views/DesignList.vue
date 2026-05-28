<template>
  <div class="design-list">
    <div class="page-header">
      <h2>设计管理</h2>
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon> 添加设计
      </el-button>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-bar">
      <el-input
        v-model="filters.keyword"
        placeholder="搜索标题/作者"
        clearable
        style="width: 200px"
        @keyup.enter="loadDesigns"
      />
      <el-input
        v-model="filters.series"
        placeholder="系列筛选"
        clearable
        style="width: 150px"
        @keyup.enter="loadDesigns"
      />
      <el-input
        v-model="filters.project"
        placeholder="项目筛选"
        clearable
        style="width: 150px"
        @keyup.enter="loadDesigns"
      />
      <el-button type="primary" @click="loadDesigns">搜索</el-button>
      <el-button @click="resetFilters">重置</el-button>
    </div>

    <el-table :data="designs" style="width: 100%" v-loading="loading">
      <el-table-column prop="design_id" label="设计ID" width="120" />
      <el-table-column prop="design_title" label="标题" min-width="200" />
      <el-table-column prop="design_author" label="作者" width="120" />
      <el-table-column prop="series" label="系列" width="100" />
      <el-table-column prop="project" label="项目" width="100" />
      <el-table-column prop="voting_count" label="票数" width="80" align="center" />
      <el-table-column prop="created_at" label="创建时间" width="160">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="showEditDialog(row)">编辑</el-button>
          <el-popconfirm title="确定删除此设计吗？" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination" v-if="total > 0">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next"
        @size-change="loadDesigns"
        @current-change="loadDesigns"
      />
    </div>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑设计' : '添加设计'"
      width="600px"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="设计标题" :required="true">
          <el-input v-model="form.design_title" placeholder="请输入设计标题" />
        </el-form-item>
        <el-form-item label="设计描述">
          <el-input v-model="form.design_description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="设计作者">
          <el-input v-model="form.design_author" />
        </el-form-item>
        <el-form-item label="图片URL">
          <el-input v-model="form.design_img" placeholder="七牛云 key 或图片URL" />
        </el-form-item>
        <el-form-item label="系列">
          <el-input v-model="form.series" />
        </el-form-item>
        <el-form-item label="项目">
          <el-input v-model="form.project" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '保存' : '添加' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import request from '@/api/request';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

interface Design {
  id: number;
  design_id: string;
  design_title: string;
  design_description: string;
  design_author: string;
  design_img: string;
  design_img_url: string;
  voting_count: number;
  series: string;
  project: string;
  added_by: string;
  created_at: string;
}

const designs = ref<Design[]>([]);
const loading = ref(false);
const total = ref(0);
const dialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const editingDesign = ref<Design | null>(null);

const filters = ref({
  keyword: '',
  series: '',
  project: '',
});

const pagination = ref({
  page: 1,
  pageSize: 10,
});

const form = ref({
  design_title: '',
  design_description: '',
  design_author: '',
  design_img: '',
  series: '',
  project: '',
});

onMounted(() => {
  loadDesigns();
});

async function loadDesigns() {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.value.page,
      page_size: pagination.value.pageSize,
    };

    // 店铺用户使用自己的 site
    if (!authStore.isSuper && authStore.site) {
      params.site = authStore.site;
    }

    if (filters.value.keyword) params.keyword = filters.value.keyword;
    if (filters.value.series) params.series = filters.value.series;
    if (filters.value.project) params.project = filters.value.project;

    const res: any = await request.get('/designs', { params });
    designs.value = res.data || res;
    total.value = res.count || 0;
  } catch (error) {
    ElMessage.error('加载设计列表失败');
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  filters.value = { keyword: '', series: '', project: '' };
  pagination.value.page = 1;
  loadDesigns();
}

function showAddDialog() {
  isEdit.value = false;
  form.value = {
    design_title: '',
    design_description: '',
    design_author: '',
    design_img: '',
    series: '',
    project: '',
  };
  dialogVisible.value = true;
}

function showEditDialog(design: Design) {
  isEdit.value = true;
  editingDesign.value = design;
  form.value = {
    design_title: design.design_title,
    design_description: design.design_description,
    design_author: design.design_author,
    design_img: design.design_img,
    series: design.series,
    project: design.project,
  };
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!form.value.design_title) {
    ElMessage.warning('请填写设计标题');
    return;
  }

  submitting.value = true;
  try {
    if (isEdit.value && editingDesign.value) {
      await request.patch(`/designs/${editingDesign.value.id}`, form.value);
      ElMessage.success('设计已更新');
    } else {
      await request.post('/designs', form.value);
      ElMessage.success('设计已添加');
    }

    dialogVisible.value = false;
    loadDesigns();
  } catch (error: any) {
    const msg = error.response?.data?.message || '操作失败';
    ElMessage.error(msg);
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(id: number) {
  try {
    await request.delete(`/designs/${id}`);
    ElMessage.success('设计已删除');
    loadDesigns();
  } catch (error: any) {
    const msg = error.response?.data?.message || '删除失败';
    ElMessage.error(msg);
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN');
}
</script>

<style scoped>
.design-list {
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
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
