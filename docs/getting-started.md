---
title: 快速上手
---

# 快速上手

## 安装与注册

```bash
pnpm add @mrchar/cumquat
```

```ts
import { createApp } from 'vue';
import { components } from '@mrchar/cumquat';

createApp(App).use(components.Cumquat).mount('#app');
```

组件 JS 不自带样式，需引入一次主题：

```css
@import '@mrchar/cumquat/themes/basic.css';
@import '@mrchar/cumquat/themes/light.css';
```

::: tip Vite 开发模式提示
若同时使用主入口与子路径导入（如 `@mrchar/cumquat` 与 `@mrchar/cumquat/composables`），需在 `vite.config.ts` 中将其纳入同一次依赖预构建，否则模块级单例（如 `message` 队列）可能被拆分导致状态不通：

```ts
export default defineConfig({
  optimizeDeps: {
    include: ['@mrchar/cumquat', '@mrchar/cumquat/composables', '@mrchar/cumquat/components'],
  },
});
```

生产构建无此问题。
:::

## 交互动作：action

交互组件传入返回 Promise 的 `action`，执行期间自动 loading、失败自动提示。

```vue
<template>
  <c-button :action="save">保存</c-button>
</template>

<script setup lang="ts">
const save = async () => {
  const res = await fetch('/api/save', { method: 'POST' });
  if (!res.ok) return { status: 'error', error: '保存失败，请重试' };
};
</script>
```

## 远程数据：fetch

资源型组件传入 `fetch` 方法，挂载自动请求，翻页、排序、搜索等交互自动重取并注入查询参数。

```vue
<template>
  <c-table :columns="columns" :fetch="loadUsers" pagination />
</template>

<script setup lang="ts">
const columns = [
  { key: 'name', title: '姓名' },
  { key: 'email', title: '邮箱' },
];

const loadUsers = async (query) => {
  const res = await fetch(`/api/users?page=${query.pagination?.currentPage ?? 1}`);
  const body = await res.json();
  return { list: body.records, total: body.total }; // 返回 { list, total } 自动识别为分页
};
</script>
```

## 数据展示：subscribe

展示组件传入 `subscribe`，挂载时自动调用一次。返回的数据若为响应式对象，之后它的变化会持续更新视图——适合订阅服务端推送的场景：

```vue
<template>
  <c-table :columns="columns" :subscribe="subscribeOrders" />
</template>

<script setup lang="ts">
import { reactive } from 'vue';

const columns = [
  { key: 'id', title: '订单号' },
  { key: 'amount', title: '金额' },
];

const subscribeOrders = async () => {
  const list = reactive<Array<{ id: string; amount: number }>>([]);
  const ws = new WebSocket('wss://example.com/orders');
  ws.onmessage = (e) => list.push(JSON.parse(e.data)); // 收到消息即更新表格
  return { data: list };
  // 真实场景请在组件卸载时关闭连接
};
</script>
```

加载中渲染骨架、失败保留重试入口。

不传 `action` / `fetch` / `subscribe` 就是普通本地组件。

## 元数据直通：资源池 + 竞选

不想手写每一列、每一项？`useResources` 绑定服务器与 Swagger 文档地址即可导出资源方法与字段元数据，展示交给单元格竞选、录入交给字段竞选自动推断：

```vue
<script setup lang="ts">
import { components, composables } from '@mrchar/cumquat';

const { Table, Form, Button } = components;
const { useResources } = composables;

const userApi = useResources({
  server: 'https://api.example.com',
  doc: '/v3/api-docs',
}).client('users');
</script>

<template>
  <!-- 列展示与表单控件均由 type / format 元数据自动推断 -->
  <Table :columns="userApi.columns" :fetch="userApi.list" :page-size="20" />
  <Form :properties="userApi.properties" :action="userApi.create">
    <Button type="primary" native-type="submit">保存</Button>
  </Form>
</template>
```

## 下一步

- [远程数据 Fetch](/fetch) / [交互动作 Action](/action) / [数据订阅 Subscribe](/subscribe)：三大协议的完整行为。
- [资源池 useResources](/composables/resources)：绑定文档地址即得资源方法与字段元数据。
- [单元格竞选](/cell) / [字段竞选](/field)：元数据自动推断展示与录入的机制设计。
- [组件总览](/components/button)：每个组件页都有可编辑的实时演示。
