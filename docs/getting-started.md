---
title: 快速上手
---

# 快速上手

## 安装与注册

:::code-group

```bash [pnpm]
pnpm add @mrchar/cumquat
```

```bash [npm]
npm install @mrchar/cumquat
```

```bash [yarn]
yarn add @mrchar/cumquat
```

```bash [bun]
bun add @mrchar/cumquat
```

:::
```ts
import { createApp } from 'vue';
import Cumquat from '@mrchar/cumquat';

createApp(App).use(Cumquat).mount('#app');
```

组件 JS 不自带样式，需引入一次主题：

```css
@import '@mrchar/cumquat/themes/basic.css';
@import '@mrchar/cumquat/themes/light.css';
```

仍保留 `components.Cumquat` 命名空间用法。无参 `app.use(Cumquat)` 不需要配置；也可以传入应用级默认浮层挂载点：

```ts
import Cumquat from '@mrchar/cumquat';

app.use(Cumquat, {
  overlay: { appendTo: '#overlays' },
});
```

局部区域使用 `ConfigProvider` 包裹。配置项通过独立属性传入，本级未传的属性继续继承父级：

```vue
<script setup lang="ts">
import { ConfigProvider } from '@mrchar/cumquat';
</script>

<template>
  <ConfigProvider append-to="#local-overlays">
    <Dialog v-model:open="show" />
    <Button :action="save" toast toast-target="#button-toasts">保存</Button>
  </ConfigProvider>
</template>
```

挂载目标 `MountTarget` 是 CSS 选择器或 `HTMLElement`；挂载到组件时传该组件的根 DOM 元素，而不是组件实例。普通浮层的优先级为：组件 `appendTo` / `target` > 最近的 `ConfigProvider` > 应用配置 > `body`。Button 的 `toastTarget` 只覆盖该按钮的消息；逐条消息的 `target` 又优先于 MessageContainer 和继承配置。

::: tip Vite 开发模式提示
请统一从主包 `@mrchar/cumquat` 导入。若确实需要混合使用子路径（`@mrchar/cumquat/composables` / `@mrchar/cumquat/components`），需在 `vite.config.ts` 中将其与主入口一并纳入依赖预构建，避免模块级单例（如 `message` 队列）被拆分：

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

<CodeCard v-model:code="actionSFC" :default-expand="true" title="action 自动 loading 与错误提示">
  <LiveDemo :code="actionTemplate" :scope="actionScope" />
</CodeCard>

## 远程数据：fetch

资源型组件传入 `fetch` 资源工厂：挂载时创建资源对象并发起首次请求，翻页、排序、搜索等交互只对同一对象调 `execute` 并注入查询参数，卸载时调 `abort`。

<CodeCard v-model:code="fetchSFC" :default-expand="true" title="fetch 自动分页、骨架与重试">
  <LiveDemo :code="fetchTemplate" :scope="fetchScope" />
</CodeCard>

## 数据展示：subscribe

展示组件传入 `subscribe`，挂载时自动调用一次。返回的数据若为响应式对象，之后它的变化会持续更新视图——适合订阅服务端推送的场景。

<CodeCard v-model:code="subscribeSFC" :default-expand="true" title="subscribe 订阅实时数据">
  <LiveDemo :code="subscribeTemplate" :scope="subscribeScope" />
</CodeCard>

加载中渲染骨架、失败保留重试入口。

不传 `action` / `fetch` / `subscribe` 就是普通本地组件。

## 竞选机制

不写渲染分支、不逐个字段指定控件：把对象 schema 通过 `schemaToColumns` 投影为列（`type` / `format` / `enum` 随之展开），展示交给竞选机制的 Cell 侧、录入交给 Field 侧自动推断。

<CodeCard v-model:code="metaSFC" :default-expand="true" title="组件使用竞选机制自动匹配最适合的展示与录入控件">
  <LiveDemo :code="metaTemplate" :scope="metaScope" />
</CodeCard>

优先级链路：插槽（`#cell-{key}` / `#field-{name}`）> 显式指定控件（`cell` / `component`）> 竞选推断 > 默认文本。上面只给了元数据：邮箱渲染为邮件链接、`enum` 按标签映射显示、`format: 'date-time'` 按本地时间格式化；表单侧 `number` 变数值输入、`format: 'date'` 变日期选择、`boolean` 变开关。

## 资源池

竞选所需的 `columns` / `properties` 不必手写——`useResources` 绑定 Swagger 文档（或直接提供资源表）即可把它们连同 `list` / `create` 等资源方法一起导出。页面装配只剩布局，模板代码进一步收敛：

<CodeCard v-model:code="poolSFC" :default-expand="true" title="使用文档导出元数据减少模板代码">
  <LiveDemo :code="poolTemplate" :scope="poolScope" />
</CodeCard>

示例中 `poolRegistry` 与 `serverRows` 均为服务端数据的本地模拟：前者是资源表（描述资源结构、字段 schema 与操作），后者是后端存储的成员数据。`fetchRegistry` 模拟从服务端拉取资源表的过程，`mockServer` 模拟后端接口处理。接入真实服务时，把 `registry: fetchRegistry` 换成 `doc: '/v3/api-docs'`，由 `useResources` 自动拉取并解析文档，其余写法不变。

## 下一步

- [状态自持](/state)：fetch / action / subscribe 三大协议的完整行为与工作原理。
- [资源池 useResources](/composables/resources)：绑定文档地址即得资源方法与字段元数据。
- [竞选机制](/campaign)：元数据自动推断展示（Cell）与录入（Field）的机制设计。
- [元数据导出](/metadata)：useResources 批量导出字段元数据，useMask 按视角裁剪。
- [组件总览](/components/button)：每个组件页都有可编辑的实时演示。

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { schemaToColumns, useResources } from '@cumquat/composables';
import type { Registry } from '@cumquat/core';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============ action demo ============

const actionSFC = ref(`
<script setup lang="ts">
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const onSave = async () => {
  await delay(800);
  return { status: 'success' as const, message: '保存成功' };
};
const onSubmitError = async () => {
  await delay(600);
  return { status: 'error' as const, message: '提交失败，请检查表单后重试' };
};
<\/script>

<template>
  <div class="flex items-center gap-3">
    <Button type="primary" :action="onSave" toast>正常保存</Button>
    <Button type="danger" :action="onSubmitError" toast>提交（模拟失败）</Button>
  </div>
</template>
`.trim());

const actionTemplate = `
  <div class="flex items-center gap-3">
    <Button type="primary" :action="onSave" toast>正常保存</Button>
    <Button type="danger" :action="onSubmitError" toast>提交（模拟失败）</Button>
  </div>
`;

const onSave = async () => {
  await delay(800);
  return { status: 'success' as const, message: '保存成功' };
};
const onSubmitError = async () => {
  await delay(600);
  return { status: 'error' as const, message: '提交失败，请检查表单后重试' };
};
const actionScope = { onSave, onSubmitError };

// ============ fetch demo ============

const fetchSFC = ref(`
<script setup lang="ts">
import { ref } from 'vue';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const shouldFail = ref(false);
const reloadKey = ref(0);

const columns = [
  { key: 'name', title: '姓名' },
  { key: 'email', title: '邮箱' },
  { key: 'role', title: '角色' },
];

const allUsers = Array.from({ length: 47 }, (_, i) => ({
  id: i + 1,
  name: '示例' + String(i + 1).padStart(2, '0'),
  email: 'demo-' + (i + 1) + '@mock.test',
  role: (['前端', '后端', '设计', '产品'] as const)[i % 4],
}));

const fetchUsers = () => {
  const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle');
  const data = ref<{ list: typeof allUsers; total: number }>();
  const error = ref<unknown>();
  const message = ref<string>();
  return {
    status,
    data,
    error,
    message,
    async execute(query: { page?: number; size?: number }) {
      status.value = 'pending';
      await delay(600);
      if (shouldFail.value) {
        shouldFail.value = false;
        // 失败写 error 状态，不向上抛；组件据此渲染错误态与重试入口
        error.value = new Error('网络错误，请点击重试');
        message.value = '网络错误，请点击重试';
        status.value = 'error';
        return;
      }
      const page = query.page ?? 1;
      const size = query.size ?? 10;
      data.value = { list: allUsers.slice((page - 1) * size, page * size), page, size, total: allUsers.length };
      status.value = 'success';
    },
    abort() {},
  };
};
<\/script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center gap-3">
      <Button size="sm" :action="triggerError">触发错误态</Button>
      <span class="text-sm text-cumquat-text-muted">
        点击按钮模拟网络异常，表格显示骨架后进入错误态
      </span>
    </div>
    <Table :key="reloadKey" :columns="columns" :fetch="fetchUsers" pagination :size="10" />
  </div>
</template>
`.trim());

const fetchTemplate = `
  <div class="flex flex-col gap-3">
    <div class="flex items-center gap-3">
      <Button size="sm" :action="triggerError">触发错误态</Button>
      <span class="text-sm text-cumquat-text-muted">
        点击按钮模拟网络异常，表格显示骨架后进入错误态
      </span>
    </div>
    <Table :key="reloadKey" :columns="columns" :fetch="fetchUsers" pagination :size="10" />
  </div>
`;

const fetchColumns = [
  { key: 'name', title: '姓名' },
  { key: 'email', title: '邮箱' },
  { key: 'role', title: '角色' },
];
const allUsers = Array.from({ length: 47 }, (_, i) => ({
  id: i + 1,
  name: `示例${String(i + 1).padStart(2, '0')}`,
  email: `demo-${i + 1}@mock.test`,
  role: (['前端', '后端', '设计', '产品'] as const)[i % 4],
}));
const shouldFail = ref(false);
const reloadKey = ref(0);
const fetchUsers = () => {
  const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle');
  const data = ref<{ list: typeof allUsers; total: number }>();
  const error = ref<unknown>();
  const message = ref<string>();
  return {
    status,
    data,
    error,
    message,
    async execute(query: { page?: number; size?: number }) {
      status.value = 'pending';
      await delay(600);
      if (shouldFail.value) {
        shouldFail.value = false;
        // 失败写 error 状态，不向上抛；组件据此渲染错误态与重试入口
        error.value = new Error('网络错误，请点击重试');
        message.value = '网络错误，请点击重试';
        status.value = 'error';
        return;
      }
      const page = query.page ?? 1;
      const size = query.size ?? 10;
      data.value = { list: allUsers.slice((page - 1) * size, page * size), page, size, total: allUsers.length };
      status.value = 'success';
    },
    abort() {},
  };
};
const triggerError = async () => {
  shouldFail.value = true;
  reloadKey.value++; // 强制 Table 重挂载，立即触发 fetch
};
const fetchScope = { columns: fetchColumns, fetchUsers, shouldFail, reloadKey, triggerError };

// ============ subscribe demo ============

const subscribeSFC = ref(`
<script setup lang="ts">
import { reactive, ref } from 'vue';

const columns = [
  { key: 'id', title: '订单号' },
  { key: 'amount', title: '金额' },
  { key: 'status', title: '状态' },
];

const subscribeOrders = async () => {
  const list = reactive<Array<{ id: string; amount: number; status: string }>>([]);
  let count = 0;
  const timer = setInterval(() => {
    count++;
    if (count > 8) { clearInterval(timer); return; }
    list.unshift({
      id: 'ORD-' + String(Date.now()).slice(-6),
      amount: Math.floor(Math.random() * 900 + 100),
      status: (['已支付', '处理中', '已发货'] as const)[count % 3],
    });
  }, 1200);
  return { data: list };
};

// 重新挂载表格即可重新订阅，方便反复查看推送效果
const reloadKey = ref(0);
const reload = () => { reloadKey.value += 1; };
<\/script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between gap-3">
      <p class="text-sm text-cumquat-text-muted">
        每 1.2s 自动追加一条模拟订单，像服务端推送一样实时更新。
      </p>
      <Button type="ghost" size="sm" @click="reload">重新加载</Button>
    </div>
    <Table :key="reloadKey" :columns="columns" :subscribe="subscribeOrders" />
  </div>
</template>
`.trim());

const subscribeTemplate = `
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between gap-3">
      <p class="text-sm text-cumquat-text-muted">
        每 1.2s 自动追加一条模拟订单，像服务端推送一样实时更新。
      </p>
      <Button type="ghost" size="sm" @click="reload">重新加载</Button>
    </div>
    <Table :key="reloadKey" :columns="columns" :subscribe="subscribeOrders" />
  </div>
`;

const subscribeColumns = [
  { key: 'id', title: '订单号' },
  { key: 'amount', title: '金额' },
  { key: 'status', title: '状态' },
];
const subscribeOrders = async () => {
  const list = reactive<Array<{ id: string; amount: number; status: string }>>([]);
  let count = 0;
  const timer = setInterval(() => {
    count++;
    if (count > 8) { clearInterval(timer); return; }
    list.unshift({
      id: `ORD-${String(Date.now()).slice(-6)}`,
      amount: Math.floor(Math.random() * 900 + 100),
      status: (['已支付', '处理中', '已发货'] as const)[count % 3],
    });
  }, 1200);
  return { data: list };
};
const reloadSubscribeKey = ref(0);
const reloadSubscribe = () => { reloadSubscribeKey.value += 1; };
const subscribeScope = {
  columns: subscribeColumns,
  subscribeOrders,
  reloadKey: reloadSubscribeKey,
  reload: reloadSubscribe,
};

// ============ metadata demo（单元格 / 字段竞选） ============

const levelOptions = [
  { label: '高级', value: 'P7' },
  { label: '中级', value: 'P6' },
];

const metaSFC = ref(`
<script setup lang="ts">
import { ref } from 'vue';
import { schemaToColumns, components } from '@mrchar/cumquat';

const { Table, Form, Button } = components;

// schema 投影展开 type / format / enum；列本身仍是传统表格定义
const columns = schemaToColumns({
  type: 'object',
  properties: {
    name: { type: 'string', title: '姓名' },
    email: { type: 'string', format: 'email', title: '邮箱' },
    level: { type: 'string', enum: ['P7', 'P6'], title: '级别' },
    joinedAt: { type: 'string', format: 'date-time', title: '入职时间' },
    active: { type: 'boolean', title: '在职' },
  },
});
const levelColumn = columns.find((column) => column.key === 'level');
if (levelColumn) {
  levelColumn.enum = [
    { label: '高级', value: 'P7' },
    { label: '中级', value: 'P6' },
  ];
}

// 字段同样只给视图元数据：数字变数值框、日期变日期选择、布尔变开关、枚举变下拉
const properties = [
  { name: 'name', label: '姓名', component: 'input', validation: { required: true, rules: [] } },
  { name: 'email', label: '邮箱', component: 'input', props: { format: 'email' }, validation: { required: false, rules: [] } },
  {
    name: 'level',
    label: '级别',
    component: 'select',
    props: {
      options: [
        { label: '高级', value: 'P7' },
        { label: '中级', value: 'P6' },
      ],
    },
    validation: { required: false, rules: [] },
  },
  { name: 'age', label: '年龄', component: 'number', validation: { required: false, rules: [] } },
  { name: 'joinedAt', label: '入职时间', component: 'date', validation: { required: false, rules: [] } },
  { name: 'active', label: '在职', component: 'switch', validation: { required: false, rules: [] } },
];

const rows = ref([
  {
    name: '甲',
    email: 'a@mock.test',
    level: 'P7',
    joinedAt: '2023-04-18T09:30:00',
    active: true,
  },
  {
    name: '乙',
    email: 'b@mock.test',
    level: 'P6',
    joinedAt: '2024-11-02T14:05:00',
    active: false,
  },
]);

const submit = (values: Record<string, unknown>) => {
  rows.value = [{ ...values }, ...rows.value];
};
<\/script>

<template>
  <div class="flex flex-col gap-5">
    <Table :columns="columns" :rows="rows" />
    <Form :properties="properties" @submit="submit">
      <Button type="primary">添加成员</Button>
    </Form>
  </div>
</template>
`.trim());

const metaTemplate = `
  <div class="flex flex-col gap-5">
    <Table :columns="columns" :rows="rows" />
    <Form :properties="properties" @submit="submit">
      <Button type="primary">添加成员</Button>
    </Form>
  </div>
`;

const metaColumns = schemaToColumns({
  type: 'object',
  properties: {
    name: { type: 'string', title: '姓名' },
    email: { type: 'string', format: 'email', title: '邮箱' },
    level: { type: 'string', enum: ['P7', 'P6'], title: '级别' },
    joinedAt: { type: 'string', format: 'date-time', title: '入职时间' },
    active: { type: 'boolean', title: '在职' },
  },
});
metaColumns[2].enum = levelOptions;

const metaProperties = [
  { name: 'name', label: '姓名', component: 'input', validation: { required: true, rules: [] } },
  { name: 'email', label: '邮箱', component: 'input', props: { format: 'email' }, validation: { required: false, rules: [] } },
  { name: 'level', label: '级别', component: 'select', props: { options: levelOptions }, validation: { required: false, rules: [] } },
  { name: 'age', label: '年龄', component: 'number', validation: { required: false, rules: [] } },
  { name: 'joinedAt', label: '入职时间', component: 'date', validation: { required: false, rules: [] } },
  { name: 'active', label: '在职', component: 'switch', validation: { required: false, rules: [] } },
];

const metaRows = ref<Array<Record<string, unknown>>>([
  {
    name: '甲',
    email: 'a@mock.test',
    level: 'P7',
    joinedAt: '2023-04-18T09:30:00',
    active: true,
  },
  {
    name: '乙',
    email: 'b@mock.test',
    level: 'P6',
    joinedAt: '2024-11-02T14:05:00',
    active: false,
  },
]);

const metaSubmit = (values: Record<string, unknown>) => {
  metaRows.value = [{ ...values }, ...metaRows.value];
};

const metaScope = {
  columns: metaColumns,
  properties: metaProperties,
  rows: metaRows,
  submit: metaSubmit,
};

// ============ pool demo（资源池 + 竞选） ============

// ===== 以下数据均来自服务端，此处用本地对象模拟 =====

// 资源表：描述资源的路径、方法与字段 schema，实际项目中由文档解析产出或直接提供
const poolRegistry: Registry = {
  resources: {
    users: {
      list: { method: 'GET', path: '/users' },
      create: { method: 'POST', path: '/users' },
      response: { list: 'records', total: 'total' },
      schema: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            title: '姓名',
          },
          email: {
            type: 'string',
            format: 'email',
            title: '邮箱',
          },
          level: {
            type: 'string',
            enum: ['P7', 'P6'],
            title: '级别',
          },
          joinedAt: {
            type: 'string',
            format: 'date',
            title: '入职时间',
          },
          active: {
            type: 'boolean',
            title: '在职',
          },
        },
      },
      hints: {
        name: { scope: { list: true, create: true } },
        email: { scope: { list: true, create: true } },
        level: { scope: { list: true, create: true }, enumLabels: ['高级', '中级'] },
        joinedAt: { scope: { list: true, create: true } },
        active: { scope: { list: true, create: true } },
      },
    },
  },
};

// 服务端存储的成员数据：实际项目中由后端接口返回
const poolServerRows = reactive<Array<Record<string, unknown>>>([
  { name: '甲', email: 'a@mock.test', level: 'P7', joinedAt: '2023-04-18', active: true },
  {
    name: '乙',
    email: 'b@mock.test',
    level: 'P6',
    joinedAt: '2024-11-02',
    active: false,
  },
]);

// ===== 模拟服务端交互 =====

// 模拟从服务端拉取资源表
const fetchRegistry = async (): Promise<Registry> => {
  await delay(200);
  return poolRegistry;
};

// 模拟后端请求处理：GET 返回列表，POST 追加数据
const mockServer = async (request: { method: string; body?: unknown }) => {
  if (request.method === 'GET') {
    return { records: poolServerRows.map((row) => ({ ...row })), total: poolServerRows.length };
  }
  poolServerRows.unshift({ ...(request.body as Record<string, unknown>) });
  return { status: 'success', message: '已创建' };
};

const poolSFC = ref(`
<script setup lang="ts">
import { reactive, ref } from 'vue';
import { components, composables } from '@mrchar/cumquat';

const { Table, Form, Button } = components;
const { useResources } = composables;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const levelOptions = [
  { label: '高级', value: 'P7' },
  { label: '中级', value: 'P6' },
];

// ===== 以下数据均来自服务端，此处用本地对象模拟 =====

// 资源表：描述资源的路径、方法与字段 schema
// 接入真实服务时通过 doc: '/v3/api-docs' 让 useResources 自动拉取，无需手写
const registry = {
  resources: {
    users: {
      list: { method: 'GET', path: '/users' },
      create: { method: 'POST', path: '/users' },
      response: { list: 'records', total: 'total' },
      schema: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', title: '姓名' },
          email: { type: 'string', format: 'email', title: '邮箱' },
          level: {
            type: 'string',
            enum: ['P7', 'P6'],
            title: '级别',
          },
          joinedAt: { type: 'string', format: 'date', title: '入职时间' },
          active: { type: 'boolean', title: '在职' },
        },
      },
      hints: {
        name: { scope: { list: true, create: true } },
        email: { scope: { list: true, create: true } },
        level: { scope: { list: true, create: true }, enumLabels: ['高级', '中级'] },
        joinedAt: { scope: { list: true, create: true } },
        active: { scope: { list: true, create: true } },
      },
    },
  },
};

// 服务端存储的成员数据：实际项目中由后端接口返回
const serverRows = reactive<Array<Record<string, unknown>>>([
  { name: '甲', email: 'a@mock.test', level: 'P7', joinedAt: '2023-04-18', active: true },
  {
    name: '乙',
    email: 'b@mock.test',
    level: 'P6',
    joinedAt: '2024-11-02',
    active: false,
  },
]);

// ===== 模拟服务端交互 =====

// 模拟从服务端拉取资源表
const fetchRegistry = async () => {
  await delay(200);
  return registry;
};

// 模拟后端请求处理：GET 返回列表，POST 追加数据
const mockServer = async (request: { method: string; body?: unknown }) => {
  if (request.method === 'GET') {
    return { records: serverRows.map((row) => ({ ...row })), total: serverRows.length };
  }
  serverRows.unshift({ ...(request.body as Record<string, unknown>) });
  return { status: 'success', message: '已创建' };
};

// ===== 资源池装配 =====

const pool = useResources({
  server: 'https://api.mock.test',
  registry: fetchRegistry, // 传入函数：useResources 内部异步获取资源表；真实服务改用 doc: '/v3/api-docs'
  request: mockServer,
});

const userApi = pool.client('users');
const reloadKey = ref(0);

const submit = async (values: Record<string, unknown>) => {
  await userApi.create(values);
  reloadKey.value += 1;
};
<\/script>

<template>
  <div class="flex flex-col gap-5">
    <Table :key="reloadKey" :columns="userApi.columns" :fetch="userApi.list" :size="20" />
    <Form :properties="userApi.properties" @submit="submit">
      <Button type="primary">创建成员</Button>
    </Form>
  </div>
</template>
`.trim());

const poolTemplate = `
  <div class="flex flex-col gap-5">
    <Table :key="reloadKey" :columns="userApi.columns" :fetch="userApi.list" :size="20" />
    <Form :properties="userApi.properties" @submit="submit">
      <Button type="primary">创建成员</Button>
    </Form>
  </div>
`;

const pool = useResources({
  server: 'https://api.mock.test',
  registry: fetchRegistry, // 传入函数：useResources 内部异步获取资源表；真实服务改用 doc: '/v3/api-docs'
  request: mockServer,
});

const poolUserApi = pool.client('users');
const poolReloadKey = ref(0);

const poolSubmit = async (values: Record<string, unknown>) => {
  await poolUserApi.create(values);
  poolReloadKey.value += 1;
};

const poolScope = {
  userApi: poolUserApi,
  reloadKey: poolReloadKey,
  submit: poolSubmit,
};
</script>
