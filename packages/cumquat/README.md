# @mrchar/cumquat

Vue 3 组件库，核心理念是**逻辑与渲染解耦**：Headless 组合函数负责状态机与行为，`.vue` 组件只做默认渲染壳。所有异步能力通过统一协议接入，组件自身不发请求。

## 特性

- **三层架构**：逻辑层（composables）→ 默认渲染层（components）→ 主题层（themes），单向依赖
- **三大异步协议**：
  - `fetch` — 组件主动查询（分页/搜索/排序），自动注入查询参数、防抖、竞态处理、四态渲染
  - `action` — 交互动作绑定 Promise，自动派生 loading/disabled，失败错误条或乐观回退
  - `subscribe` — 被动订阅外部推送数据，失败保留旧数据并支持重试
- **统一契约**：`AsyncStateLike` / `ActionResult` / `SubscribeResult` 最小类型集合通信
- **资源池**：`useResources` 绑定服务器与 OpenAPI / Swagger 文档地址，即导出资源 list / detail / create / update / remove 方法与 `columns` / `properties` 字段元数据
- **竞选机制**：`type` / `format` 元数据自动推断渲染——Table 单元格竞选管展示，Form 字段竞选管录入；插槽 > 显式指定 > 竞选推断 > 兜底，`bias` 加成与注册表覆盖支持宿主扩展
- **语义化主题**：`cq-` 前缀语义 token + 5 套主题包（basic / light / dark / high-contrast / glass）
- **v-model 纯同步**：异步 props 全部可选，不传即普通组件

## 安装

```bash
pnpm add @mrchar/cumquat
```

## 使用

### 统一入口（命名空间导出）

```ts
import { composables, components } from '@mrchar/cumquat';

const { useFetch, useSubscribe, message } = composables;
const { Button, Table, Cumquat } = components;
```

### 子路径入口

```ts
// 仅组合函数
import { useFetch } from '@mrchar/cumquat/composables';
// 仅组件
import { Button } from '@mrchar/cumquat/components';
```

### 主题样式（纯 CSS，按需引入其一）

```css
/* 宿主已有 Tailwind v4：扫描包内 dist 类名 + 引入主题 */
@import 'tailwindcss';
@source '../node_modules/@mrchar/cumquat/dist';
@import '@mrchar/cumquat/themes/basic.css';
@import '@mrchar/cumquat/themes/light.css'; /* 或 dark / high-contrast / glass */

/* 无 Tailwind：直接引入预编译样式（内含全部主题） */
@import '@mrchar/cumquat/style.css';
```

## 快速示例

```vue
<script setup lang="ts">
import { components } from '@mrchar/cumquat';
import type { components as c } from '@mrchar/cumquat';

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

## 文档

完整组件文档（含可编辑实时演示）位于仓库 [docs](https://github.com/mrchar/cumquat/tree/main/docs) 目录：

- [远程数据 Fetch](https://github.com/mrchar/cumquat/blob/main/docs/fetch.md) / [交互动作 Action](https://github.com/mrchar/cumquat/blob/main/docs/action.md) / [数据订阅 Subscribe](https://github.com/mrchar/cumquat/blob/main/docs/subscribe.md)
- [组件文档](https://github.com/mrchar/cumquat/tree/main/docs/components) — 每个组件页含可编辑实时演示

## License

[MIT](./LICENSE)
