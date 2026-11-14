---
title: Table 表格
---

# Table 表格

数据列表展示，内置排序、筛选、分页、展开、选择与远程四态。可二选一驱动远程数据：传入 `data` 状态时组件自身不发请求、状态变化通过统一 `change` 事件回发；直接绑定 `fetch` 方法时，翻页 / 排序 / 筛选由组件自动重取。列由对象 schema 投影并携带 `type` / `format` 等元数据时，单元格显示由竞选机制自动推断，无需逐列写插槽。

列配置项 [`TableColumn`](/types/view/data-display#tablecolumn) 的结构见类型参考。手写列只声明传统表格属性，另有 `enum`（值 → 文案映射，值可为布尔）与 `formatter`（自定义格式化）两个展示入口；对象 schema 通过 `schemaToColumns` 投影为列，`type` / `format` / `enum` 在投影时展开，资源池的 `columns` 已完成这一步。

| Prop           | 类型                                              | 默认值         | 说明                                                                                                |
| -------------- | ------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------- |
| columns        | [`TableColumn`](/types/view/data-display#tablecolumn)`[]`                                   | -              | 列配置；对象 schema 可用 `schemaToColumns` 投影后传入，资源池直接绑定 `columns`                     |
| rows           | `Row[]`                                           | `[]`           | 本地数据                                                                                            |
| striped        | `boolean`                                         | `false`        | 斑马纹                                                                                              |
| loading        | `boolean`                                         | `false`        | 外部加载态                                                                                          |
| emptyText      | `string`                                          | `'暂无数据'`   | 空态文案                                                                                            |
| data           | `{ status, data?, error?, retry? }`（`Row[]`）                   | -              | 远程数据状态：传入后 rows/loading 由其派生                                                          |
| total          | `number`                                          | -              | 远程数据总条数（本地默认取 rows 长度）                                                              |
| rowKey         | `(row: Row, index: number) => string \| number`   | 取行索引       | 行唯一键                                                                                            |
| selectable     | `boolean`                                         | `false`        | 显示行选择列                                                                                        |
| expandable     | `boolean`                                         | `false`        | 显示展开列（仅表格形态；卡片形态不提供展开，额外内容直接并入卡片）                                  |
| pagination     | `boolean`                                         | `false`        | 内置分页条；绑定 `v-model:page` 时自动开启                                                  |
| page           | `number`                                          | -              | 当前页（受控，`v-model:page`）；不传为组件内部状态                                          |
| size           | `number`                                          | `10`           | 每页条数；挂 `@update:size` 监听即受控（`v-model:size`）                                  |
| sizes          | `number[]`                                        | `[10, 20, 50]` | 每页条数选项                                                                                        |
| sorter         | `{ key: string; order: 'asc' \| 'desc' \| null }` | -              | 排序状态（受控，`v-model:sorter`）；不传为组件内部状态                                              |
| filters        | `Record<string, Array<string \| number \| boolean \| null>>` | -   | 筛选状态（受控，`v-model:filters`）；不传为组件内部状态                                             |
| defaultSort    | `{ key: string; order: 'asc' \| 'desc' }`         | -              | 初始排序（非受控）                                                                                  |
| fetch          | [`FetchHandler`](/types/basics/core#fetchhandler)`<Row>`                                      | -              | 远程数据资源工厂：自动注入 pagination/sorter/filters 调 `execute`；`data` 写 `{ list, page, size, total }` 自动分页，写数组按全量渲染 |
| cells          | [`CellRenderer`](/types/model/rendering#cellrenderer)`[]`                                  | -              | 局部单元格渲染器：与全局注册共同参与竞选，同名显式指定与同分时局部优先                              |
| responsive     | `boolean`                                         | `false`        | 小屏卡片模式：视口宽度小于 `cardBreakpoint` 时以卡片列表代替表格                                    |
| cardBreakpoint | `string`                                          | `'768px'`      | 卡片模式触发的视口断点（max-width）                                                                 |
| actions        | [`TableAction`](/types/view/data-display#tableaction)`[]`                                   | `[]`           | 行操作：约定渲染在最后一列（表格）/ 卡片操作区（卡片），溢出合并进「更多」                          |
| visibleActions | `number`                                          | `2`            | 内联操作数上限，超出部分收进「更多」下拉                                                            |

行操作项 [`TableAction`](/types/view/data-display#tableaction) 的结构见类型参考。

行操作约定：表格形态在末尾追加「操作」列（右对齐），卡片形态在卡片底部 footer（分隔线之上的按钮集合，右对齐）展示；超过 `visibleActions` 的操作自动合并进「更多」下拉菜单。

```ts
const actions: TableAction[] = [
  { key: 'edit', label: '编辑', onClick: (row) => openEditor(row) },
  { key: 'delete', label: '删除', danger: true, onClick: (row) => remove(row) },
];
```

| 事件                | 参数                                                                                            | 说明                                     |
| ------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------- |
| update:selectedKeys | `keys: Array<string \| number>`                                                                 | 选中行 key 更新                          |
| update:page         | `page: number`                                                                                  | 当前页更新（受控回发）                   |
| update:size         | `size: number`                                                                                  | 每页条数更新（受控回发）                 |
| update:sorter       | `{ key, order }`                                                                                | 排序状态更新（受控回发）                 |
| update:filters      | `Record<string, Array<string \| number \| boolean \| null>>`                                    | 筛选状态更新（受控回发）                 |
| change              | `{ pagination: { page, size }, sorter: { key, order }, filters: Record<string, …> }`            | 分页/排序/筛选统一变化（外层据此发请求） |
| rowExpand           | `{ row, expanded: boolean, key }`                                                               | 行展开/收起                              |

| 插槽              | 说明                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------- |
| `cell-${col.key}` | 自定义单元格，slot props：`{ row, value }`                                                |
| expanded          | 展开行内容（仅表格形态），slot props：`{ row, index }`                                    |
| card              | 小屏卡片模式下整卡自定义渲染，slot props：`{ row, index }`；不传渲染「列名 + 值」字段列表 |

```vue
<Table :columns="columns" :fetch="fetchUsers" selectable pagination :size="20">
  <template #cell-status="{ value }"><Tag>{{ value }}</Tag></template>
</Table>

<!-- 资源池：columns 已完成 schema 投影 -->
<Table :columns="userApi.columns" :fetch="userApi.list" pagination :size="20" />
```

```vue
<!-- 也可继续使用 data 状态模式：请求由外层 change 事件驱动 -->
<Table
  :columns="columns"
  :data="tableState"
  :total="total"
  selectable
  pagination
  :size="20"
  @change="onTableChange"
>
  <template #cell-status="{ value }"><Tag>{{ value }}</Tag></template>
</Table>
```

### 受控分页 / 排序

分页与排序默认由组件内部持有；绑定 `v-model` 后即由外部接管，绑定的变量与 `fetch` 注入的 query 始终是同一份状态，可在资源对象的 `execute` 里直接闭包读取（用于 URL 同步、外部筛选联动等场景）。绑定 `v-model:page` 后无需再写 `pagination` 开关：

```vue
<template>
  <Table v-model:page="page" v-model:sorter="sort" :columns="columns" :fetch="loadUsers" />
</template>

<script setup lang="ts">
import { ref } from 'vue';

const page = ref(1);
const sort = ref({ key: '', order: null });

// 资源工厂：组件挂载时创建一次，翻页 / 排序只调 execute
const loadUsers = () => {
  const status = ref('idle');
  const data = ref();
  const error = ref();
  const message = ref();
  return {
    status,
    data,
    error,
    message,
    async execute(query) {
      // query.page 与 page.value 等价，任选其一
      status.value = 'pending';
      try {
        const res = await fetch(`/api/users?page=${page.value}`);
        data.value = await res.json();
        status.value = 'success';
      } catch (err) {
        error.value = err;
        message.value = err instanceof Error ? err.message : String(err);
        status.value = 'error';
      }
    },
    abort() {},
  };
};
</script>
```

## 筛选

筛选入口由**列定义**的 `options` 开启：表头出现筛选按钮，面板内多选，命中任一即保留。`options` 可以是静态数组，也可以是 `FetchHandler`；缺省时 enum 列自动以 `enum` 作为候选值。

```ts
const columns: TableColumn[] = [
  {
    key: 'role',
    title: '角色',
    // 静态候选值：直接给数组
    options: [
      { label: '前端', value: 'front' },
      { label: '后端', value: 'back' },
    ],
    // 可选：默认按 String(row[key]) === String(value) 比较
    filterMethod: (value, row) => row.role === value,
  },
];

// 或交给 enum：映射同时作为默认筛选项
const enumColumns: TableColumn[] = [
  {
    key: 'role',
    title: '角色',
    enum: [
      { label: '前端', value: 'front' },
      { label: '后端', value: 'back' },
    ],
  },
];
```

远程候选值用函数形式绑定 `FetchHandler`，展开面板时才发起请求；返回 `Option[]`（或 `{ list, total }`）即可，加载与失败重试由面板自行处理：

```ts
const remoteColumns: TableColumn[] = [
  { key: 'role', title: '角色', options: fetchRoles },
];
```

- **本地数据**（`rows`）：组件内部过滤，无需额外处理。
- **远程数据**（`fetch`）：筛选值写入查询的 `filters`，自动重取；资源对象里直接读 `query.filters`。
- **`data` 状态模式**：筛选变化通过 `change` 事件的 `filters` 字段回发，由外层发请求。

筛选变化会自动回到第 1 页。受控用法：

```vue
<Table v-model:filters="filters" :columns="columns" :fetch="loadUsers" />
```

`filters` 形状为 `Record<string, Array<string | number | boolean | null>>`；面板内的「清空」只清除当前列的筛选。

## 单元格竞选

列携带 `type` / `format` / `enum` 投影元数据时，单元格显示由列定义自动推断：每个单元格渲染器（Cell）对**完整列定义**自我评价返回适配度分数，竞选代理按列裁决取最高分（同分先注册者优先，全部弃权回落默认文本）。`type` 是 JSON Schema 类型（string / number / integer / boolean…），`format` 描述内容格式（email / uri / date / date-time / tag / status…），`enum` 是值 → 文案的映射；这些元数据由 `schemaToColumns` 或资源池投影展开。

- 优先级链路：插槽 > `formatter` > 显式指定 `cell` > 竞选推断 > 默认文本
- 外部调整三层：列上加成 `bias`（加减分翻转竞选结果）、显式指定 `cell`（跳过竞选）、`registerCell` 同名覆盖（替换含内建在内的全局实现）
- Table 的 `cells` 属性传入局部渲染器，与全局注册共同参与竞选；宿主在列上附加的自定义字段原样进入评分输入
- 枚举列通过 `enum` 提供取值与 label 映射，越界值降级显示原值；`enum` 同时作为默认筛选项

```vue
<template>
  <Table :columns="columns" :rows="rows" />
</template>

<script setup lang="ts">
import type { TableColumn } from '@mrchar/cumquat';
import { schemaToColumns } from '@mrchar/cumquat';

// schema 投影：type / format / enum 展开为列元数据，竞选据此推断
const columns: TableColumn[] = schemaToColumns({
  type: 'object',
  properties: {
    name: { type: 'string', title: '姓名' },
    email: { type: 'string', format: 'email', title: '邮箱' },
    score: { type: 'number', title: '积分' },
    status: { type: 'string', enum: ['active', 'leave'], title: '状态' },
    level: { type: 'string', enum: ['bronze', 'silver', 'gold'], format: 'status', title: '等级' },
  },
});

// 投影结果上继续做展示调整：status 自定义文案，level 加成后 tag 胜出
columns.find((column) => column.key === 'status')!.enum = [
  { label: '活跃', value: 'active' },
  { label: '休假', value: 'leave' },
];
columns.find((column) => column.key === 'level')!.bias = { tag: 30 };
</script>
```

不依赖 schema 时，手写列同样可以表达展示：`enum` 负责值 → 文案，`formatter` 返回任意展示内容（文本或 VNode）：

```ts
const columns: TableColumn[] = [
  {
    key: 'active',
    title: '启用',
    enum: [
      { label: '是', value: true },
      { label: '否', value: false },
    ],
  },
  {
    key: 'amount',
    title: '金额',
    formatter: (value) => `¥${Number(value).toFixed(2)}`,
  },
];
```

宿主扩展：按同一契约注册自定义 Cell，全局竞选或局部竞选均可参与，无需修改 Table 内部：

```ts
import { registerCell } from '@mrchar/cumquat';

registerCell({
  name: 'progress',
  fitness: (column) => (column.format === 'percent' ? 95 : 0),
  render: (value) => h(Progress, { value: Number(value) }),
});
```

机制设计、评分约定与扩展契约详见[竞选机制](/campaign)。

## 小屏卡片模式

开启 `responsive` 后，视口宽度小于 `cardBreakpoint`（默认 768px）时表格自动切换为卡片列表：每行渲染为一张卡片，字段按「列名 + 值」纵向排列，值仍走竞选机制（单元格侧）与 `cell-${col.key}` 插槽；选择列与展开列变为卡片顶部的复选框与展开按钮，分页、加载中、空态与错误重试行为与表格形态一致。

排序与筛选入口依附列头，卡片形态下不展示；远程排序/筛选仍可通过 `v-model:sorter` 与 `change` 事件在外层驱动。服务端渲染时视口断点首帧不可知，水合前以表格形态渲染、小屏设备水合后切换为卡片；对跳变敏感的场景可用 `cardBreakpoint` 固定形态（如 `'0px'` 恒为表格、`'9999px'` 恒为卡片）。整卡自定义渲染使用 `card` 插槽：

```vue
<Table :columns="columns" :rows="rows" responsive />
<Table :columns="columns" :rows="rows" responsive card-breakpoint="480px" />

<Table :columns="columns" :rows="rows" responsive>
  <template #card="{ row }">
    <div class="flex items-center justify-between">
      <span class="font-medium">{{ row.name }}</span>
      <span class="text-cumquat-text-muted">{{ row.role }}</span>
    </div>
  </template>
</Table>
```

## 补充：订阅数据

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| subscribe | [`SubscribeHandler`](/types/basics/core#subscribehandler)`<Row[]>` | `undefined` | 订阅行数据；挂载时调用，返回结果优先于 `fetch` / `data` / `rows` 渲染 |

远程数据优先级：`subscribe > fetch > data > rows`。`subscribe` 与 `fetch` 同时存在时不会重复请求。

## 交互演示

### 基础表格

<CodeCard v-model:code="tableCode" editable title="基础表格">
  <LiveDemo :code="tableCode" :scope="demoScope" />
</CodeCard>

### 单元格竞选

<CodeCard v-model:code="cellTableCode" editable title="单元格竞选">
  <LiveDemo :code="cellTableCode" :scope="demoScope" />
</CodeCard>

### 分页 / 排序 / 筛选自动重取（fetch）

<CodeCard v-model:code="remoteTableCode" editable title="分页 / 排序 / 筛选自动重取（fetch）">
  <LiveDemo :code="remoteTableCode" :scope="demoScope" />
</CodeCard>

### 小屏卡片模式

<CodeCard v-model:code="responsiveTableCode" editable title="小屏卡片模式">
  <LiveDemo :code="responsiveTableCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

import { schemaToColumns } from '@cumquat/composables';
import type { FetchHandler, ResolvedFetchQuery, Status, TableColumn } from '@mrchar/cumquat';

/** 演示用：把 execute 函数体包装为符合协议的 FetchHandler 资源工厂 */
function makeFetch<T>(run: (query: ResolvedFetchQuery) => T | Promise<T>): FetchHandler<T> {
  return () => {
    const status = ref<Status>('idle');
    const data = ref<T>();
    const error = ref<unknown>();
    const message = ref<string>();
    return {
      status,
      data,
      error,
      message,
      async execute(query: ResolvedFetchQuery) {
        status.value = 'pending';
        try {
          data.value = await run(query);
          status.value = 'success';
        } catch (err) {
          error.value = err;
          message.value = err instanceof Error ? err.message : String(err);
          status.value = 'error';
        }
      },
      abort() {},
    };
  };
}

const page = ref(1);

const columns = [
  { key: 'name', title: '姓名' },
  { key: 'role', title: '角色', align: 'center' },
  { key: 'status', title: '状态', align: 'right' },
];

const rows = [
  { name: '甲', role: '前端', status: '活跃' },
  { name: '乙', role: '后端', status: '休假' },
  { name: '丙', role: '设计', status: '活跃' },
];

const tableCode = ref(`
  <Table :columns="columns" :rows="rows" />
`);

/** 竞选演示列：schema 投影展开 type / format / enum，level 列以 bias 加成让 tag 胜出 */
const cellColumns: TableColumn[] = schemaToColumns({
  type: 'object',
  properties: {
    name: { type: 'string', title: '姓名' },
    email: { type: 'string', format: 'email', title: '邮箱' },
    score: { type: 'number', title: '积分' },
    active: { type: 'boolean', title: '启用' },
    status: { type: 'string', enum: ['active', 'leave'], title: '状态' },
    level: { type: 'string', enum: ['bronze', 'silver', 'gold'], format: 'status', title: '等级' },
    createdAt: { type: 'string', format: 'date-time', title: '创建时间' },
  },
});
cellColumns.find((column) => column.key === 'status')!.enum = [
  { label: '活跃', value: 'active' },
  { label: '休假', value: 'leave' },
];
cellColumns.find((column) => column.key === 'level')!.bias = { tag: 30 };

const cellRows = [
  {
    name: '甲',
    email: 'a@mock.test',
    score: 1234567,
    active: true,
    status: 'active',
    level: 'gold',
    createdAt: '2026-03-05T08:09:10',
  },
  {
    name: '乙',
    email: 'b@mock.test',
    score: 842,
    active: false,
    status: 'leave',
    level: 'silver',
    createdAt: '2026-04-12T21:30:00',
  },
];

const cellTableCode = ref(`
  <Table :columns="cellColumns" :rows="cellRows" />
`);

interface RemoteUser {
  id: number;
  name: string;
  role: string;
  status: string;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const remoteColumns = [
  { key: 'name', title: '姓名', sortable: true },
  {
    key: 'role',
    title: '角色',
    align: 'center' as const,
    options: [
      { label: '前端', value: '前端' },
      { label: '后端', value: '后端' },
      { label: '设计', value: '设计' },
    ],
  },
  { key: 'status', title: '状态', align: 'right' as const },
];

const allRemoteUsers: RemoteUser[] = Array.from({ length: 57 }, (_, index) => ({
  id: index + 1,
  name: `用户 ${String(index + 1).padStart(2, '0')}`,
  role: (['前端', '后端', '设计'] as const)[index % 3],
  status: index % 5 === 0 ? '休假' : '活跃',
}));

/** 置为 true 后下一次请求失败，用于演示错误态与重试 */
const failNextFetch = ref(false);

const fetchUsers = makeFetch<RemoteUser>(async (query) => {
  await delay(500);
  if (failNextFetch.value) {
    failNextFetch.value = false;
    throw new Error('模拟网络错误，请点击重试');
  }

  let list = [...allRemoteUsers];
  if (query.sorter?.order) {
    const factor = query.sorter.order === 'asc' ? 1 : -1;
    list.sort((a, b) => a.name.localeCompare(b.name, 'zh') * factor);
  }
  const roleFilter = (query.filters as { role?: Array<string | number> } | undefined)?.role;
  if (roleFilter?.length) {
    list = list.filter((user) => roleFilter.includes(user.role));
  }

  const page = query.page ?? 1;
  const size = query.size ?? 10;
  return {
    list: list.slice((page - 1) * size, page * size),
    page,
    size,
    total: list.length,
  };
});

const remoteTableCode = ref(`
  <div class="flex flex-col gap-3">
    <div class="flex items-center gap-3">
      <Button size="sm" @click="failNextFetch = true">模拟下一次请求失败</Button>
      <span class="text-sm text-cumquat-text-muted">
        绑定 fetch 后，翻页、点表头排序、角色筛选都会自动重新请求
      </span>
    </div>
    <Table :columns="remoteColumns" :fetch="fetchUsers" pagination :size="10" />
  </div>
`);

/** 小屏卡片模式演示：断点设为 9999px 以便在桌面视口预览卡片形态 */
const responsiveTableCode = ref(`
  <Table
    :columns="columns"
    :rows="rows"
    responsive
    card-breakpoint="9999px"
    selectable
    pagination
    :size="2"
    :actions="actions"
  />
`);

/** 行操作演示 */
const actions = [
  { key: 'edit', label: '编辑', onClick: () => {} },
  { key: 'delete', label: '删除', danger: true, onClick: () => {} },
];

/** LiveDemo 渲染作用域 */
const demoScope = { page, columns, rows, tableCode, cellColumns, cellRows, cellTableCode, delay, remoteColumns, allRemoteUsers, failNextFetch, fetchUsers, remoteTableCode, responsiveTableCode, actions };
</script>
