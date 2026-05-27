# Shopify 后端管理后台 - 项目文档

> 项目路径: `c:\Users\SF\Desktop\shopify网站后端管理后台`  
> 文档更新时间: 2026-05-21  
> 用途: 给 Claude 下次会话快速建立项目认知, **优先阅读此文档**

---

## 1. 项目概览

**项目名称**: `shopify-admin` (package.json)  
**项目定位**: 多店铺 Shopify 预约系统统一管理后台  
**当前状态**: 已对接真实后端, 支持多店铺数据隔离, 超管/店铺管理员双角色体系

### 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Vue 3 (Composition API + `<script setup>`) | ^3.5.13 |
| 语言 | TypeScript | ^5.7.0 |
| 构建工具 | Vite | ^6.0.0 |
| UI 库 | Element Plus | ^2.9.0 |
| 图标 | @element-plus/icons-vue | ^2.3.1 |
| 路由 | Vue Router 4 (History 模式) | ^4.5.0 |
| 状态管理 | Pinia (Setup Store 风格) | ^2.3.0 |
| HTTP | Axios | ^1.7.9 |
| 日期处理 | date-fns | ^4.1.0 |

### 关键脚本

```bash
npm run dev      # 启动开发服务器, 端口 5173
npm run build    # vue-tsc 类型检查 + Vite 打包
```

---

## 2. 多店铺账号体系

### 2.1 角色定义

| 角色 | 账号示例 | 密码 | 权限范围 |
|------|----------|------|----------|
| 超管 (super) | `admin` | `admin` | 可查看/管理所有店铺数据 |
| 店铺管理员 (site) | `coollaa` | `coollaa` | 只能查看自己店铺的数据 |

### 2.2 登录接口

- **路径**: `POST /api/admin/login`
- **响应**: `{ token, username, role, site }`
- 超管 `role='super'`, `site='all'`
- 店铺账号 `role='site'`, `site='店铺名'`

### 2.3 数据隔离规则

- 店铺管理员的所有 API 请求, 后端自动注入 `?site=店铺名` 参数
- 超管默认查看全部店铺数据, 可通过 `?site=xxx` 筛选特定店铺
- 数据库所有表均有 `site` 字段实现物理隔离

### 2.4 添加新店铺

1. **后端**: `src/config/booking.ts` 的 `SITE_CONFIGS` 中添加新店铺配置
2. **后端**: `src/features/admin/service.ts` 的 `SITES` 数组中添加店铺名
3. **前端**: 各页面中的 `allSites` 数组中添加店铺名 (Dashboard.vue, BookingList.vue, AvailabilityConfig.vue, PreviewTest.vue)
4. 新店铺账号密码即为店铺名, 无需额外创建账号

---

## 3. 目录结构

```
shopify网站后端管理后台/
├── index.html              # SPA 入口
├── package.json
├── vite.config.ts          # 端口 5173, /api /health /preview 代理到 localhost:3000
├── public/
│   └── images/
│       └── logo.png        # 预约页面 Logo
└── src/
    ├── main.ts             # 入口: Pinia / Router / ElementPlus / 图标注册
    ├── App.vue
    ├── api/
    │   ├── request.ts      # Axios 实例: baseURL=/api, 自动注入 Token + site 参数
    │   └── admin.ts        # 管理后台所有 API: login, getBookings, getStats, 可用性/节假日配置
    ├── router/
    │   └── index.ts        # 路由表 + 登录守卫
    ├── stores/
    │   └── auth.ts         # 认证 Store: token, role, site, viewSite, isSuper
    └── views/
        ├── Layout.vue              # 主框架: 暗色侧边栏 + 顶部 Header + 面包屑
        ├── Login.vue               # 登录页
        ├── Dashboard.vue           # 概览: 统计卡片 + 超管店铺筛选
        ├── BookingList.vue         # 预约列表: 表格分页 + 取消操作 + 时区展示
        ├── AvailabilityConfig.vue  # 可用性配置: 工作日/午休/特殊日期
        ├── PreviewTest.vue         # 页面预览: iframe 加载 dev-test HTML
        └── ApiInfo.vue             # 接口信息: 服务状态 + 接口列表
```

---

## 4. 路由结构

| 路径 | 组件 | 菜单标题 | 图标 |
|------|------|---------|------|
| `/login` | Login.vue | (公开) | - |
| `/dashboard` | Dashboard.vue | 概览 | Odometer |
| `/bookings` | BookingList.vue | 预约列表 | List |
| `/availability` | AvailabilityConfig.vue | 可用性配置 | Calendar |
| `/preview` | PreviewTest.vue | 页面预览 | View |
| `/api-info` | ApiInfo.vue | 接口信息 | Connection |

- 未登录自动跳转 `/login`
- 菜单在 [Layout.vue](src/views/Layout.vue) 中定义

---

## 5. 认证与权限

### Auth Store (`src/stores/auth.ts`)

```ts
const token = ref('');           // localStorage.admin_token
const username = ref('');        // localStorage.admin_username
const role = ref('');            // 'super' | 'site'
const site = ref('');            // 所属店铺
const viewSite = ref('');        // 超管当前查看的店铺
const isLoggedIn = computed(() => !!token.value);
const isSuper = computed(() => role.value === 'super');
```

### Request 拦截器 (`src/api/request.ts`)

- 自动附加 `Authorization: Bearer {token}`
- 店铺角色自动在 query 参数中附加 `site`
- `401` 响应自动清除登录态并跳转登录页

---

## 6. API 层 (`src/api/admin.ts`)

| 函数 | 方法 | 路径 | 说明 |
|------|------|------|------|
| `login()` | POST | `/admin/login` | 管理员登录 |
| `getBookings(page, pageSize, status?, site?)` | GET | `/admin/bookings` | 预约列表(分页) |
| `cancelBooking(id, site?)` | PUT | `/admin/bookings/:id/cancel` | 取消预约 |
| `getStats(site?)` | GET | `/admin/stats` | 统计数据 |
| `getAvailability(site?)` | GET | `/admin/availability` | 获取可用性配置 |
| `saveAvailability(..., site?)` | PUT | `/admin/availability` | 保存可用性配置 |
| `getHolidays(site?)` | GET | `/admin/holidays` | 获取特殊日期 |
| `addHoliday(date, reason?, site?)` | POST | `/admin/holidays` | 添加特殊日期 |
| `removeHoliday(id, site?)` | DELETE | `/admin/holidays/:id` | 删除特殊日期 |

**注意**: `site` 参数仅超管需要显式传入, 店铺角色由请求拦截器自动附加。

---

## 7. 各页面功能

### Layout.vue
- 左侧暗色菜单 220px, 顶部白色 Header
- 店铺管理员显示 `管理后台 - {site}`
- 超管显示 `管理后台 (超管)`, 右上角标签显示 `超管`
- 右上角用户下拉: 退出登录

### Dashboard.vue
- 4 个统计卡片: 今日/本周/本月/待处理
- 超管顶部显示店铺筛选器, 可切换查看全部或单个店铺
- 调用 `getStats(site?)`

### BookingList.vue
- 表格展示: 店铺(超管可见)/姓氏/名字/公司/电话/邮箱/预约时间/时长/会议方式/用户时区/状态/操作
- 支持分页、刷新
- 超管顶部显示店铺筛选器
- 已确认预约可点击取消

### AvailabilityConfig.vue
- 工作日设置: 每天 start/end 时间 + 可约开关
- 午休时间设置
- 特殊日期管理: 表格展示 + 弹窗添加 + 删除
- 超管需先选择店铺才能查看/编辑配置

### PreviewTest.vue
- 左侧页面列表 + 右侧 iframe 预览
- 超管可按店铺筛选测试页面
- 支持刷新、新窗口打开
- 上线迁移提示

### ApiInfo.vue
- 服务状态: 后端地址、健康状态、数据库、时区
- 当前账号信息: 用户名、角色、所属店铺/查看范围
- 管理后台接口列表

---

## 8. 后端关联

- **后端路径**: `c:\Users\SF\Desktop\shopify网站后端`
- **启动命令**: `cd shopify网站后端 && npx tsx watch src/index.ts`
- **开发地址**: `http://localhost:3000`
- **数据库**: MySQL (通过 prisma 连接)
- **C端 API**: `/api/{site}/booking/*` (不受管理后台 auth 影响)
- **B端 API**: `/api/admin/*` (需 JWT 鉴权)

### 后端关键文件

| 文件 | 说明 |
|------|------|
| `src/middleware/auth.ts` | JWT 生成/校验 + `siteFilterMiddleware` 数据隔离 |
| `src/features/admin/service.ts` | 多账号登录逻辑、数据库查询 |
| `src/features/admin/controller.ts` | Admin API 控制器 |
| `src/routes/admin.ts` | Admin 路由: `/admin/login` 公开, 其余需鉴权 + siteFilter |
| `src/config/booking.ts` | 多店铺配置映射 `SITE_CONFIGS` |

---

## 9. 已知问题

1. **前端 IDE 类型检查**: VSCode 可能报 `Cannot find module 'vue'` 等错误, 不影响实际编译运行 (vite 能正确解析)
2. **店铺列表硬编码**: 前后端各自维护店铺列表, 添加新店铺需同步修改多处
3. **Dashboard 图表占位**: 近7天趋势图和会议方式分布图仍为 `el-empty` 占位, 待接入图表库

---

## 10. Claude 速查清单

- **添加新店铺?** → 改后端 `booking.ts` 的 `SITE_CONFIGS` + `service.ts` 的 `SITES`, 改前端各页面的 `allSites` 数组
- **添加新页面?** → 同步改 `src/router/index.ts` 和 `src/views/Layout.vue` 的 `menuItems`
- **添加新接口?** → 在 `src/api/admin.ts` 中添加, 超管可选传 `site` 参数
- **超管筛选逻辑?** → 页面用 `authStore.isSuper` 控制筛选器显示, `selectedSite` 传给 API
- **店铺角色自动隔离?** → 由 `request.ts` 拦截器自动处理, 页面无需额外代码
