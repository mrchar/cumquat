# Cumquat

一个**状态自持**的Vue3组件库，只需要绑定异步处理方法，就可以快速实现功能。

## 特性

- **状态自持**：组件自主管理状态和行为，只需要绑定异步处理方法
- **三大异步协议**：
  - `fetch` — 组件主动查询（分页/搜索/排序），自动注入查询参数、防抖、竞态处理、四态渲染
  - `action` — 交互动作绑定 Promise，自动派生 loading/disabled，失败错误条或乐观回退
  - `subscribe` — 被动订阅外部推送数据，失败保留旧数据并支持重试
- **统一契约**：`Status` / `ActionResult` / `SubscribeResult` 最小类型集合通信
- **资源池**：`useResources` 绑定服务器与 OpenAPI / Swagger 文档地址，即导出资源 list / detail / create / update / remove 方法与 `columns` / `properties` 字段元数据
- **竞选机制**：`type` / `format` 元数据自动推断渲染——Table 单元格竞选管展示（枚举标签、邮箱链接、日期格式化…），Form 字段竞选管录入（下拉、开关、数值、日期…，`required` 自动派生校验）；优先级为插槽 > 显式指定 > 竞选推断 > 兜底，`bias` 加成、`registerCell` / `registerField` 覆盖与局部渲染器支持宿主扩展
- **语义化主题**：`cumquat-` 前缀语义 token + 5 套主题包（basic / light / dark / high-contrast / glass）
- **v-model 纯同步**：异步 props 全部可选，不传即普通组件

## 安装与使用

### 统一入口

主包 `@mrchar/cumquat` 把 core 协议、组合函数与组件全部透传到同一入口，组合函数、组件与类型统一具名导入：

```ts
// 组合函数与命令式服务
import { useResources, message } from '@mrchar/cumquat';
// 组件
import { Button, Table, Dialog, Form } from '@mrchar/cumquat';
// 类型随同一入口导出
import type { FetchHandler, SubscribeHandler, TableColumn } from '@mrchar/cumquat';
```

### 全量注册

```ts
import Cumquat from '@mrchar/cumquat';

app.use(Cumquat);
// 全局组件以 C 前缀注册：模板中使用 <CButton> 或 <c-button>、<CTable> / <c-table>
```

> 兼容层仍保留 `composables` / `components` 两个命名空间导出（`import { components } from '@mrchar/cumquat'`）。

### 主题样式（纯 CSS，主包子路径引入）

```css
/* 宿主已有 Tailwind v4 */
@import 'tailwindcss';
@source '../node_modules/@mrchar/cumquat/dist';
@import '@mrchar/cumquat/themes/basic.css';
@import '@mrchar/cumquat/themes/light.css'; /* 或 dark / high-contrast / glass */

/* 无 Tailwind：直接引入预编译样式 */
@import '@mrchar/cumquat/style.css';
```

## 快速示例

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Table, Dialog } from '@mrchar/cumquat';
import type { FetchHandler } from '@mrchar/cumquat';

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: string;
}

// 列定义：key 对应数据字段，title 为表头
const columns = [
  { key: 'name', title: '姓名' },
  { key: 'email', title: '邮箱' },
  { key: 'role', title: '角色' },
];

// fetch 协议：工厂返回状态自持的资源对象，组件调 execute 重取、调 abort 取消
const fetchUsers: FetchHandler<UserRow> = () => {
  const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle');
  const data = ref<{ list: UserRow[]; page: number; size: number; total: number }>();
  const error = ref<unknown>();
  const message = ref<string>();
  let controller: AbortController | undefined;
  return {
    status,
    data,
    error,
    message,
    async execute(query) {
      controller?.abort();
      controller = new AbortController();
      status.value = 'pending';
      try {
        const page = query.page ?? 1;
        const size = query.size ?? 20;
        const res = await fetch(`/api/users?page=${page}&size=${size}`, {
          signal: controller.signal,
        });
        const body = await res.json();
        // data 写数组 → 普通列表；写 { list, page, size, total } → 分页
        data.value = { list: body.records, page, size, total: body.total };
        status.value = 'success';
      } catch (err) {
        error.value = err;
        message.value = err instanceof Error ? err.message : String(err);
        status.value = 'error'; // 失败写状态，不 reject
      }
    },
    abort: () => controller?.abort(),
  };
};

// Table 行操作：组件自动渲染操作列，溢出项收进「更多」下拉
const open = ref(false);
const currentId = ref<number | null>(null);
const actions = [
  { key: 'edit', label: '编辑', onClick: (row: UserRow) => alert('编辑 ' + row.name) },
  {
    key: 'delete',
    label: '删除',
    danger: true,
    onClick: (row: UserRow) => {
      currentId.value = row.id;
      open.value = true;
    },
  },
];
const confirmDelete = async () => {
  await fetch(`/api/users/${currentId.value}`, { method: 'DELETE' });
};
</script>

<template>
  <Table
    :columns="columns"
    :fetch="fetchUsers"
    :actions="actions"
    pagination
    :size="20"
  />

  <!-- action 协议：自动派生 loading/disabled，失败自动展示错误 -->
  <Dialog v-model:open="open" title="删除确认" :action="confirmDelete">
    确定删除该用户？
  </Dialog>
</template>
```

### 元数据驱动

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Table, Form, Dialog, useResources } from '@mrchar/cumquat';

// 模块级创建一次，全站复用：绑定服务器与 Swagger 文档地址即可
const userApi = useResources({
  server: 'https://api.example.com',
  doc: '/v3/api-docs',
}).client('users');

// --- 编辑弹框状态 ---
const editOpen = ref(false);
const editingId = ref<number | null>(null);
const editingUser = ref<Record<string, unknown>>({});
const formRef = ref<InstanceType<typeof Form>>();

// Table 行操作：点编辑先拉详情再打开弹框（Dialog 打开时数据已就绪）
const rowActions = [
  {
    key: 'edit',
    label: '编辑',
    onClick: async (row: Record<string, unknown>) => {
      editingId.value = row.id as number;
      const detail = await userApi.detail(row.id as number);
      editingUser.value = detail as Record<string, unknown>;
      editOpen.value = true;
    },
  },
  {
    key: 'remove',
    label: '删除',
    danger: true,
    onClick: async (row: Record<string, unknown>) => {
      // userApi.remove / userApi.create 都是 ActionHandler 形态，可直接绑给 Dialog/Popconfirm
      await userApi.remove(row.id as number);
    },
  },
];

// Dialog action：校验 → 提交（失败自动展示错误条并保持打开）
const handleUpdate = async () => {
  await formRef.value?.validate();
  await userApi.update(editingId.value!, editingUser.value);
};
</script>

<template>
  <!-- 列表：columns 元数据经单元格竞选自动推断展示（枚举→标签、email→链接、datetime→格式化） -->
  <Table
    :columns="userApi.columns"
    :fetch="userApi.list"
    :actions="rowActions"
    :size="20"
  />

  <!-- 编辑：properties 元数据经字段竞选自动推断控件，required 自动派生校验 -->
  <Dialog v-model:open="editOpen" title="编辑用户" :action="handleUpdate">
    <Form
      ref="formRef"
      v-model="editingUser"
      :properties="userApi.properties"
      label-position="left"
    />
  </Dialog>
</template>
```

## 仓库结构

```
packages/
├── core/          # 纯协议包（Status / AsyncResult / Handler 类型与运行时 helper，仅依赖 Vue 的 Ref 类型）
├── composables/   # Headless 组合函数库（状态机、行为、数据协议、资源池）
├── components/    # 默认渲染组件（全局 C 前缀注册，Tailwind 默认渲染）
├── themes/        # 主题包源码（basic / light / dark / high-contrast / glass）
└── cumquat/       # 发布主包 @mrchar/cumquat（扁平透传上述各包 + 主题与样式产物）
docs/              # VitePress 文档站点
example/           # 示例项目
playground/        # 片段选择式调试沙盒
skills/            # Trae 技能
.github/           # CI / 发布工作流
```

## 开发命令

本项目使用 **[Vite+](https://www.viteplus.dev/)** 作为统一工具链（`vite-plus` catalog 固定版本）——整合 Vite / Vitest / Oxlint / Oxfmt / tsdown，`defineConfig` 直接从 `vite-plus` 导入，一个 `vite.config.ts` 同时覆盖开发、检查、测试、打包。

### 环境准备

```bash
# 可选：安装全局 vp CLI（推荐，管理 Node + pnpm 并提供便捷命令）
curl -fsSL https://vite.plus | bash

# 安装依赖（vite-plus 已在 catalog 中，无需额外安装）
pnpm install   # 或 vp install
```

### 常用命令

```bash
# 一键流水线：格式 + Lint + 类型 → 全部测试 → 全部构建
pnpm ready                    # 等价于 vp check && vp run -r test && vp run -r build

# 检查（format + lint + type-check，一次跑三件事）
vp check                       # 仅 Lint 或仅格式化：vp lint / vp fmt

# 测试（Vitest，共享 vite.config.ts 配置）
vp test                        # 运行全部包的测试
vp -C packages/components test # 只跑某个包的测试

# 开发 / 构建 / 打包
vp -C playground dev           # 启动 playground 沙盒（组件联调）
pnpm docs:dev                  # 启动文档站点（VitePress，不走 vite-plus pack）
pnpm docs:build                # 构建文档站点
vp -C packages/components pack # 用 tsdown 打包组件库（ESM + .d.ts）
vp -C packages/composables pack

# 递归跑跨包脚本（pnpm-workspace.yaml 内所有包）
vp run -r build                # 等价于 pnpm run -r build
vp run -r test --parallel      # 并行执行，加速 CI
```

### 配置要点

- 根 `vite.config.ts` 定义 lint / fmt / test 的**默认值**，并通过 `lint.overrides` 为测试文件放宽 `no-explicit-any` 规则
- 各包内 `vite.config.ts` 只声明自己的 `pack` / `test` / `plugins`，不重复 lint/fmt
- `pack.platform` 统一为 `neutral`（同时产出 Node 与浏览器兼容的产物）
- 所有 `pnpm run <script>` 的调用也可换成 `vp run <script>`（vite-plus 会走同样的缓存）

## 文档

- [状态自持](docs/state.md) — fetch / action / subscribe 三大协议的完整行为与工作原理
- [远程数据 Fetch](docs/composables/fetch.md) / [数据订阅 Subscribe](docs/composables/subscribe.md) / [资源池 useResources](docs/composables/resources.md)
- [竞选机制](docs/campaign.md) — 元数据驱动展示（Cell）与录入（Field）的机制设计；[元数据导出](docs/metadata.md) 介绍 useResources 字段元数据与 useMask 视角裁剪
- [类型参考](docs/types/overview.md) — 按基础层 / 模型层 / 视图层组织的全量类型索引
- [组件文档](docs/components/) — 每个组件页含可编辑实时演示
