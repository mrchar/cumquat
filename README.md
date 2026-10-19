# Cumquat

Vue 3 组件库，核心理念是**逻辑与渲染解耦**：Headless 组合函数负责状态机与行为，`.vue` 组件只做默认渲染壳。所有异步能力通过统一协议接入，组件自身不发请求。

## 特性

- **三层架构**：逻辑层（composables）→ 默认渲染层（components）→ 主题层（themes），单向依赖
- **三大异步协议**：
  - `fetch` — 组件主动查询（分页/搜索/排序），自动注入查询参数、防抖、竞态处理、四态渲染
  - `action` — 交互动作绑定 Promise，自动派生 loading/disabled，失败错误条或乐观回退
  - `subscribe` — 被动订阅外部推送数据，失败保留旧数据并支持重试
- **统一契约**：`AsyncStateLike` / `ActionResult` / `SubscribeResult` 最小类型集合通信
- **资源池**：`useResources` 绑定服务器与 OpenAPI / Swagger 文档地址，即导出资源 list / detail / create / update / remove 方法与 `columns` / `properties` 字段元数据
- **竞选机制**：`type` / `format` 元数据自动推断渲染——Table 单元格竞选管展示（枚举标签、邮箱链接、日期格式化…），Form 字段竞选管录入（下拉、开关、数值、日期…，`required` 自动派生校验）；优先级为插槽 > 显式指定 > 竞选推断 > 兜底，`bias` 加成、`registerCell` / `registerField` 覆盖与局部渲染器支持宿主扩展
- **语义化主题**：`cq-` 前缀语义 token + 5 套主题包（basic / light / dark / high-contrast / glass）
- **v-model 纯同步**：异步 props 全部可选，不传即普通组件

## 安装与使用

### 统一入口（命名空间导出）

```ts
import { composables, components } from '@mrchar/cumquat';

const { useFetch, useSubscribe, message } = composables;
const { Button, Table, Cumquat } = components;
```

### 全量注册

```ts
import { components } from '@mrchar/cumquat';

app.use(components.Cumquat);
// 模板中以 <cq-button> 等 C 前缀标签使用
```

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

### 元数据驱动（资源池 + 竞选机制）

```vue
<script setup lang="ts">
import { components, composables } from '@mrchar/cumquat';

const { Table, Form, Button } = components;
const { useResources } = composables;

// 模块级创建一次，全站复用：绑定服务器与 Swagger 文档地址即可
const userApi = useResources({
  server: 'https://api.example.com',
  doc: '/v3/api-docs',
}).client('users');
</script>

<template>
  <!-- 列表：columns 元数据经单元格竞选自动推断展示（枚举→标签、email→链接、datetime→格式化） -->
  <Table :columns="userApi.columns" :fetch="userApi.list" :page-size="20" />

  <!-- 创建：properties 元数据经字段竞选自动推断控件，required 自动派生校验 -->
  <Form :properties="userApi.properties" :action="userApi.create">
    <Button type="primary" native-type="submit">保存</Button>
  </Form>
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

- [远程数据 Fetch](docs/fetch.md) / [交互动作 Action](docs/action.md) / [数据订阅 Subscribe](docs/subscribe.md) / [资源池 useResources](docs/composables/resources.md)
- [单元格竞选](docs/cell.md) / [字段竞选](docs/field.md) — 元数据驱动展示与录入的机制设计
- [组件文档](docs/components/) — 每个组件页含可编辑实时演示
