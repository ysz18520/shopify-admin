<template>
  <div class="preview-container">
    <!-- 顶部提示 -->
    <el-alert
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
    >
      <template #title>
        <span>Shopify 页面预览测试环境</span>
      </template>
      此模块用于在 Shopify 上线前预览和测试前端页面。页面源码为纯 HTML+CSS+JS 单文件，测试确认功能无误后，可直接将代码复制到 Shopify 主题中制作 Liquid 文件。
    </el-alert>

    <!-- 超管站点筛选 -->
    <el-card v-if="authStore.isSuper" style="margin-bottom: 16px">
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

    <el-row :gutter="16">
      <!-- 左侧页面列表 -->
      <el-col :span="6">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>测试页面</span>
              <el-tag size="small" type="success">{{ filteredPageList.length }}</el-tag>
            </div>
          </template>

          <div
            v-for="page in filteredPageList"
            :key="page.path"
            class="page-item"
            :class="{ active: currentPage === page.path }"
            @click="switchPage(page)"
          >
            <div class="page-name">{{ page.name }}</div>
            <div class="page-meta">
              <el-tag size="small" :type="page.statusType">{{ page.status }}</el-tag>
              <span class="page-site">{{ page.site }}</span>
            </div>
            <div class="page-desc">{{ page.desc }}</div>
          </div>

          <el-empty v-if="filteredPageList.length === 0" description="暂无页面" />
        </el-card>

        <el-card style="margin-top: 16px">
          <template #header>源码位置</template>
          <div class="source-path">
            <div v-for="page in filteredPageList" :key="page.path" class="source-item">
              <div class="source-name">{{ page.name }}</div>
              <code class="source-file">{{ page.sourcePath }}</code>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧预览区 -->
      <el-col :span="18">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>{{ currentPageName }}</span>
              <el-button-group>
                <el-button size="small" @click="refreshPreview">
                  <el-icon><refresh /></el-icon> 刷新
                </el-button>
                <el-button size="small" @click="openInNewTab">
                  <el-icon><full-screen /></el-icon> 新窗口打开
                </el-button>
              </el-button-group>
            </div>
          </template>

          <div class="iframe-wrapper">
            <iframe
              v-if="currentPage"
              ref="iframeRef"
              :src="currentPage"
              class="preview-iframe"
              sandbox="allow-scripts allow-same-origin allow-forms"
            ></iframe>
            <div v-else class="empty-state">
              <el-empty description="请从左侧选择一个测试页面" />
            </div>
          </div>

          <!-- 上线提示 -->
          <el-alert
            v-if="currentPage"
            type="warning"
            :closable="false"
            style="margin-top: 12px"
          >
            <template #title>上线迁移提示</template>
            测试完成后，将上方页面源码中的
            <code>API_BASE = 'http://107.172.230.133:8080/api'</code>
            改为你的生产域名（如
            <code>'https://your-domain.com/api'</code>
            ），然后将整个 HTML 文件内容复制到 Shopify 主题中作为 Liquid 模板即可。
          </el-alert>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

interface PreviewPage {
  name: string;
  path: string;
  site: string;
  desc: string;
  status: string;
  statusType: 'success' | 'warning' | 'info';
  sourcePath: string;
}

const authStore = useAuthStore();
const allSites = ['coollaa', 'longshade'];
const selectedSite = ref(authStore.viewSite || '');

const pageList: PreviewPage[] = [
  {
    name: '预约咨询 - Coollaa',
    path: '/preview/coollaa/booking.html',
    site: 'Coollaa',
    desc: '完整的预约流程：选择日期时段 → 填写信息 → 提交预约。原生 HTML+CSS+JS，零依赖。',
    status: '已完成',
    statusType: 'success',
    sourcePath: 'shopify网站后端/dev-test/coollaa/booking.html',
  },
  {
    name: '预约测试入口',
    path: '/preview/',
    site: '通用',
    desc: '开发测试入口页，列出所有站点和模块。',
    status: '已完成',
    statusType: 'success',
    sourcePath: 'shopify网站后端/dev-test/index.html',
  },
];

const filteredPageList = computed(() => {
  if (!selectedSite.value) return pageList;
  const filter = selectedSite.value.toLowerCase();
  return pageList.filter(
    (p) => p.site.toLowerCase() === filter || p.site === '通用'
  );
});

const currentPage = ref(pageList[0].path);
const iframeRef = ref<HTMLIFrameElement | null>(null);

const currentPageName = computed(() => {
  const page = pageList.find((p) => p.path === currentPage.value);
  return page?.name || '页面预览';
});

function switchPage(page: PreviewPage) {
  currentPage.value = page.path;
}

function refreshPreview() {
  if (iframeRef.value) {
    iframeRef.value.src = iframeRef.value.src;
  }
}

function openInNewTab() {
  window.open(currentPage.value, '_blank');
}

function handleSiteChange() {
  authStore.setViewSite(selectedSite.value);
}
</script>

<style scoped>
.preview-container {
  height: 100%;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.page-item {
  padding: 14px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  margin-bottom: 8px;
}
.page-item:hover {
  background: #f5f7fa;
}
.page-item.active {
  background: #e8f4fd;
  border-color: #409eff;
}
.page-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
}
.page-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.page-site {
  font-size: 12px;
  color: #999;
}
.page-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}
.iframe-wrapper {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}
.preview-iframe {
  width: 100%;
  height: 700px;
  border: none;
  display: block;
}
.empty-state {
  height: 700px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.source-path {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.source-item {
  padding: 10px 12px;
  background: #f5f7fa;
  border-radius: 6px;
}
.source-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}
.source-file {
  font-size: 12px;
  color: #409eff;
  background: none;
  padding: 0;
  word-break: break-all;
}
</style>
