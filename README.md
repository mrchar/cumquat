# Cumquat

Vue 3 组件库，核心理念是**逻辑与渲染解耦**：Headless 组合函数负责状态机与行为，`.vue` 组件只做默认渲染壳。所有异步能力通过统一协议接入，组件自身不发请求。

## 特性

- **三层架构**：逻辑层（composables）→ 默认渲染层（components）→ 主题层（themes），单向依赖
- **三大异步协议**：
  - `fetch` — 组件主动查询（分页/搜索/排序），自动注入查询参数、防抖、竞态处理、四态渲染
  - `action` — 交互动作绑定 Promise，自动派生 loading/disabled，失败错误条或乐观回退
  - `subscribe` — 被动订阅外部推送数据，失败保留旧数据并支持重试
- **统一契约**：`AsyncStateLike` / `ActionResult` / `SubscribeResult` 最小类型集合通信
- **语义化主题**：`cq-` 前缀语义 token + 5 套主题包（basic / light / dark / high-contrast / glass）
- **v-model 纯同步**：异步 props 全部可选，不传即普通组件

## 安装与使用

### 统一入口（命名空间导出）

```ts
import { composables, components } from 'cumquat';

const { useFetch, useSubscribe } = composables;
const { Button, Table, Cumquat, message } = components;
```

### 全量注册

```ts
import { components } from 'cumquat';

app.use(components.Cumquat);
// 模板中以 <cq-button> 等 C 前缀标签使用
```

### 主题样式（纯 CSS，主包子路径引入）

```css
/* 宿主已有 Tailwind v4 */
@import 'tailwindcss';
@source '../node_modules/cumquat/packages/components/dist';
@import 'cumquat/themes/basic.css';
@import 'cumquat/themes/light.css'; /* 或 dark / high-contrast / glass */

/* 无 Tailwind：直接引入预编译样式 */
@import 'cumquat/style.css';
```

## 快速示例

```vue
<script setup lang="ts">
import { components } from 'cumquat';
import type { components as c } from 'cumquat';

const { Table, Dialog } = components;

const fetchUsers: c.Fetch<UserRow> = async (query) => {
  const res = await fetch(`/api/users?page=${query.pagination?.currentPage ?? 1}`);
  return res.json();
};

const confirmAction = async () => {
  await api.delete(id);
};
</script>

<template>
  <Table :columns="columns" :fetch="fetchUsers" :pagination="{ pageSize: 20 }" />
  <Dialog v-model:open="open" title="删除确认" :action="confirmAction">确定删除？</Dialog>
</template>
```

## 仓库结构

```
packages/
├── composables/   # Headless 组合函数库（状态机、行为、协议类型）
├── components/    # 默认渲染组件（Cq 前缀，Tailwind 默认渲染）
└── themes/        # 主题包（basic / light / dark / high-contrast / glass）
docs/              # VitePress 文档站点
playground/        # 片段选择式调试沙盒
skills/            # Trae 技能
```

## 开发命令

```bash
pnpm install        # 安装依赖
pnpm ready          # 检查 + 全部测试 + 全部构建
pnpm dev            # 启动 playground
pnpm docs:dev       # 启动文档站点
pnpm docs:build     # 构建文档站点
```

## 文档

- [远程数据 Fetch](docs/fetch.md) / [交互动作 Action](docs/action.md) / [数据订阅 Subscribe](docs/subscribe.md)
- [组件文档](docs/components/) — 每个组件页含可编辑实时演示
