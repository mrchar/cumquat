---
title: 类型参考 · 快速开始
---

# 快速开始

本页介绍组件库类型体系中最核心的两个设计特征，并辅以可运行的最小示例，帮助读者快速建立整体认识并着手开发：

1. **状态自持**：调用方将 `fetch` 资源工厂、`action` / `subscribe` 处理函数交由组件托管，组件据此自主维护 `idle → pending → success / error` 的统一状态；fetch 的加载、失败与竞态封装在资源对象内部，取消实现由调用方负责，组件只管调用；
2. **元数据导出**：调用方提供数据定义 `Schema`，或通过 `useResources` 将外部协议解析为 `Resource`；组件依据定义自动推导表格列、表单控件及校验规则，无需逐项编写视图配置。

## 导入方式

组件、组合函数与全部类型均从主包 `@mrchar/cumquat` 扁平导出，统一从该入口导入即可：

```ts
import {
  Button,
  Table,
  useResources,
  type FetchHandler,
  type ActionResult,
  type SubscribeResult,
  type Snapshot,
} from '@mrchar/cumquat';
```

如需保留命名空间分组，也可使用同一入口的 `composables` / `components` 命名空间：

```ts
import { composables, components, type FetchHandler } from '@mrchar/cumquat';

const handler: FetchHandler<UserRow> = fetchUsers;
const column: components.CellRenderer = MyCell;
```

## 状态自持

页面只提供“怎么处理数据”的函数，不维护 `loading`、`error`、分页参数等状态。组件自己决定何时调用、如何处理并发与失败。

### fetch：资源型组件

把资源工厂交给 `Table`，加载态、失败重试、空态、翻页参数都由组件处理；工厂返回的资源对象自带状态信封与 `execute / abort`：

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Table, type FetchHandler, type FetchResult, type ResolvedFetchQuery, type Status, type TableColumn } from '@mrchar/cumquat';

interface UserRow {
  name: string;
  email: string;
}

const columns: TableColumn[] = [
  { key: 'name', title: '姓名' },
  { key: 'email', title: '邮箱' },
];

// FetchHandler 是资源工厂：一次绑定创建一个 FetchResult 对象
const fetchUsers: FetchHandler<UserRow> = (): FetchResult<UserRow> => {
  const status = ref<Status>('idle');
  const data = ref();
  const error = ref();
  const message = ref();
  let controller: AbortController | undefined;

  return {
    status,
    data,
    error,
    message,
    async execute(query: ResolvedFetchQuery) {
      controller?.abort();
      controller = new AbortController();
      status.value = 'pending';
      try {
        const res = await fetch(
          `/api/users?page=${query.page ?? 1}`,
          { signal: controller.signal },
        );
        data.value = await res.json(); // 数组 → 列表；{ list, page, size, total } → 分页
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
</script>

<template>
  <Table :columns="columns" :fetch="fetchUsers" pagination />
</template>
```

`fetch` 的类型是 [`FetchHandler`](/types/basics/core#fetchhandler)：入参是组件整理好的初始查询，返回带 `execute / abort` 的资源对象；`FetchQuery` 不含 `signal`，取消由对象内部实现。

### action：交互组件

按钮点击、表单提交这类一次性动作用 `action`，返回统一的 [`AsyncResult`](/types/basics/core#asyncresult)：

```vue
<script setup lang="ts">
import { Button, type ActionHandler, type AsyncResult } from '@mrchar/cumquat';

// ActionHandler：一次性动作，返回统一的 AsyncResult
const save: ActionHandler = async (): Promise<AsyncResult> => {
  const res = await fetch('/api/users', { method: 'POST', body: JSON.stringify(form) });
  if (!res.ok) return { status: 'error', message: '保存失败' };
  return { status: 'success', message: '已保存' };
};
</script>

<template>
  <Button :action="save">保存</Button>
</template>
```

组件在执行期间自动禁用并展示加载态，根据返回的 `status` / `message` 给出反馈。

### subscribe：持续更新的数据

挂载一次、后续持续更新的数据（实时在线数、推送状态）用 `subscribe`：

```vue
<script setup lang="ts">
import { Statistic, type SubscribeHandler } from '@mrchar/cumquat';
import { online } from './realtime';

// SubscribeHandler<number>：挂载一次，data 变化时视图持续更新
const subscribeOnline: SubscribeHandler<number> = async () => ({ status: 'success', data: online });
</script>

<template>
  <Statistic title="在线人数" :subscribe="subscribeOnline" />
</template>
```

`data` 是响应式对象时，后续修改会持续更新视图。

### 组装处理方法与组件外状态

fetch 与 subscribe 的处理方法都直接手写：fetch 在工厂闭包内完成入参适配、信封归一、异常与取消，产出带 `execute / abort` 的资源对象；subscribe 直接返回统一的结果对象。二者都可以直接绑定组件属性：

```ts
import { ref } from 'vue';
import type {
  FetchHandler,
  FetchResult,
  Status,
  SubscribeHandler,
} from '@mrchar/cumquat';

// 普通请求函数：入参与返回信封都由后端决定，不感知组件协议
async function fetchUsersApi(params: { page: number; kw?: string }, signal?: AbortSignal) {
  return http.get('/api/users', params, signal); // { code, records, total }
}

// 工厂内完成入参适配与信封归一，产出标准 FetchResult<UserRow> 资源对象
const fetchUserList: FetchHandler<UserRow> = () => {
  const status = ref<Status>('idle');
  const data = ref();
  const error = ref();
  const message = ref();
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
        const raw = await fetchUsersApi(
          { page: query.page ?? 1, kw: query.keyword },
          controller.signal,
        );
        data.value = { list: raw.records, page: query.page ?? 1, size: raw.size, total: raw.total };
        status.value = 'success';
      } catch (err) {
        error.value = err;
        message.value = err instanceof Error ? err.message : String(err);
        status.value = 'error';
      }
    },
    abort: () => controller?.abort(),
  } satisfies FetchResult<UserRow>;
};

// subscribe：直接返回结果对象；裸数据放进 data，信封在方法内归一
const subscribeOnline: SubscribeHandler<number> = () => ({
  status: 'success',
  data: store.onlineCount,
});
```

不使用组件、但需要在页面里维护一份异步状态时（页头统计、面包屑等），使用通用原语 `useAsyncState`，它把任意异步函数投影为同一套 `Snapshot` 四态：

```ts
import { useAsyncState } from '@mrchar/cumquat';

const { state, loading, error, retry } = useAsyncState(fetchUserSummary);

state.value.status; // 'idle' | 'pending' | 'success' | 'error'
state.value.data;   // 最近一次成功的数据
error.value;        // 失败原因
retry();            // 以最近一次参数重试
```

`status` 的类型是 [`Status`](/types/basics/core#status)，全部异步处理都共享这套词汇。完整契约见[核心类型](/types/basics/core)。

## 元数据导出

组件根据数据定义自行推导“应该长什么样”。定义采用 JSON Schema 子集：`type` / `format` 决定控件与渲染器，`required` / `minLength` 等约束直接驱动校验。

### 用 Schema 推导表单

定义数据，交给 `Form`，不需要逐个声明控件：

```ts
import type { Schema } from '@mrchar/cumquat';

const schema: Schema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: '姓名', minLength: 2, maxLength: 20 },
    email: {
      type: 'string',
      format: 'email',
      title: '邮箱',
      description: '用于接收系统通知',
      example: 'name@example.com',
    },
    active: { type: 'boolean', title: '在职' },
  },
  required: ['name', 'email'],
};
```

```vue
<Form :schema="schema" :action="submit">
  <template #default>
    <Button native-type="submit">提交</Button>
  </template>
</Form>
```

`name` 渲染为带长度校验的输入框、`email` 渲染为邮箱格式输入框、`active` 渲染为开关，必填与约束规则全部来自 schema。schema 无法表达的自定义校验通过独立的 `validation` 配置传入，不污染数据定义。

同样的投影在组件外由 `Converter` 完成：

```ts
import { createView, type Schema, type View } from '@mrchar/cumquat';

const emailView: View = createView().toField('email', schema.properties!.email, {
  name: 'email',
  required: true,
  schema,
});

emailView.label;        // '邮箱'
emailView.component;    // 'input'
emailView.help;         // '用于接收系统通知；示例：name@example.com'
emailView.props!.format; // 'email'
```

相关类型：[`Schema`](/types/model/form#schema) · [`View`](/types/model/rendering#view) · [`Converter`](/types/model/rendering#converter) · [`Validation` / `Rule`](/types/model/form#rule)。

### 渲染器竞选

展示侧同样根据定义自选渲染器：`format: 'email'` 的列自动渲染为邮件链接，`type: 'boolean'` 渲染为是/否。宿主还可以注册自定义渲染器，任何带相同标记的列或字段自动命中，无需修改组件：

```ts
import { h } from 'vue';
import { Badge, registerCell, type CellRenderer } from '@mrchar/cumquat';

const statusCell: CellRenderer = {
  name: 'status-badge',
  fitness: (column) => (column.format === 'status' ? 10 : 0),
  render: (value) => h(Badge, { type: value }),
};

registerCell(statusCell);
```

机制说明见[视图投影与竞选](/types/model/rendering)。

### 从协议直接导出资源

后端提供 OpenAPI / Swagger 文档时，[`useResources`](/types/model/resources) 负责解析协议，导出的资源同时包含**请求方法**和**视图元数据**：

```ts
import {
  useResources,
  type ActionHandler,
  type FetchHandler,
  type ResourceClient,
  type ResourcePool,
} from '@mrchar/cumquat';

const pool: ResourcePool = useResources({
  server: 'https://api.example.com',
  doc: '/v3/api-docs',
});

const users: ResourceClient<UserRow> = pool.client('users');

// 资源方法与组件协议同形，可直接绑定
const listUsers: FetchHandler<UserRow> = users.list;   // 资源工厂 → Table 的 :fetch
const createUser: ActionHandler = users.create;       // → Form 的 :action
```

```vue
<Table :columns="users.columns" :fetch="users.list" pagination />
<Form :properties="users.properties" :action="users.create" />
```

`users.list` 是现成的 `FetchHandler` 工厂（内部私有 `AbortController` 实现竞态取消），`users.columns` / `users.properties` 是现成的视图投影——状态自持消费前者，竞选机制消费后者，页面不再编写胶水代码。相关类型：[`Resource`](/types/model/resources#resource) · [`Registry`](/types/model/resources#registry) · [`ResourcePool`](/types/model/resources#resourcepool)。

## 接下来去哪

- 机制与设计取舍 → [设计理念](/types/philosophy)
- 全部类型索引 → [类型总览](/types/overview)
- 专题页 → [核心类型](/types/basics/core) · [数据模型与表单](/types/model/form) · [资源池](/types/model/resources) · [视图投影与竞选](/types/model/rendering) · [导航组件类型](/types/view/navigation)
