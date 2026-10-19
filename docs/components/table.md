---
title: Table 表格
---

# Table 表格

数据列表展示，内置排序、筛选、分页、展开、选择与远程四态。可二选一驱动远程数据：传入 `data` 状态时组件自身不发请求、状态变化通过统一 `change` 事件回发；直接绑定 `fetch` 方法时，翻页 / 排序 / 筛选由组件自动重取。列携带 `type` / `format` 元数据时，单元格显示由竞选机制自动推断，无需逐列写插槽。

`TableColumn` 结构：

```ts
interface TableColumn {
  key: string;
  title: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  type?: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'enum'; // 保存格式提示（竞选评分输入）
  format?: string; // 内容格式提示，如 email / uri / tag / status（原样透传文档声明）
  options?: Array<{ label: string; value: string | number }>; // 枚举选项：enum 单元格据此显示 label
  cell?: string; // 显式指定单元格渲染器名称（如 'tag'），指定即生效，跳过竞选
  bias?: Record<string, number>; // 竞选加成：对指定渲染器加减分，正负均可
  sortable?: boolean; // 该列可排序
  sorter?: (a: Row, b: Row) => number; // 本地排序比较器；远程时仅回发状态
  filters?: Array<{ label: string; value: string | number }>; // 表头筛选面板
  filterMethod?: (value: string | number, row: Row) => boolean; // 本地筛选谓词
}
```

| Prop        | 类型                                              | 默认值         | 说明                                                                                                |
| ----------- | ------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------- |
| columns     | `TableColumn[]`                                   | -              | 列配置（必填）                                                                                      |
| rows        | `Row[]`                                           | `[]`           | 本地数据                                                                                            |
| striped     | `boolean`                                         | `false`        | 斑马纹                                                                                              |
| loading     | `boolean`                                         | `false`        | 外部加载态                                                                                          |
| emptyText   | `string`                                          | `'暂无数据'`   | 空态文案                                                                                            |
| data        | `AsyncStateLike<Row[]>`                           | -              | 远程数据状态：传入后 rows/loading 由其派生                                                          |
| total       | `number`                                          | -              | 远程数据总条数（本地默认取 rows 长度）                                                              |
| rowKey      | `(row: Row, index: number) => string \| number`   | 取行索引       | 行唯一键                                                                                            |
| selectable  | `boolean`                                         | `false`        | 显示行选择列                                                                                        |
| expandable  | `boolean`                                         | `false`        | 显示展开列                                                                                          |
| pagination  | `boolean`                                         | `false`        | 内置分页条；绑定 `v-model:current-page` 时自动开启                                                  |
| currentPage | `number`                                          | -              | 当前页（受控，`v-model:current-page`）；不传为组件内部状态                                          |
| pageSize    | `number`                                          | `10`           | 每页条数；挂 `@update:page-size` 监听即受控（`v-model:page-size`）                                  |
| pageSizes   | `number[]`                                        | `[10, 20, 50]` | 每页条数选项                                                                                        |
| sorter      | `{ key: string; order: 'asc' \| 'desc' \| null }` | -              | 排序状态（受控，`v-model:sorter`）；不传为组件内部状态                                              |
| defaultSort | `{ key: string; order: 'asc' \| 'desc' }`         | -              | 初始排序（非受控）                                                                                  |
| fetch       | `Fetch<Row>`                                      | -              | 远程数据源：自动注入 pagination/sorter/filters；返回 `{ list, total }` 自动分页，返回数组按全量渲染 |
| cells       | `CellRenderer[]`                                  | -              | 局部单元格渲染器：与全局注册共同参与竞选，同名显式指定与同分时局部优先                              |

| 事件                | 参数                                                                                            | 说明                                     |
| ------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------- |
| update:selectedKeys | `keys: Array<string \| number>`                                                                 | 选中行 key 更新                          |
| update:currentPage  | `page: number`                                                                                  | 当前页更新（受控回发）                   |
| update:pageSize     | `size: number`                                                                                  | 每页条数更新（受控回发）                 |
| update:sorter       | `{ key, order }`                                                                                | 排序状态更新（受控回发）                 |
| change              | `{ pagination: { currentPage, pageSize }, sorter: { key, order }, filters: Record<string, …> }` | 分页/排序/筛选统一变化（外层据此发请求） |
| rowExpand           | `{ row, expanded: boolean, key }`                                                               | 行展开/收起                              |

| 插槽              | 说明                                       |
| ----------------- | ------------------------------------------ |
| `cell-${col.key}` | 自定义单元格，slot props：`{ row, value }` |
| expanded          | 展开行内容，slot props：`{ row, index }`   |

```vue
<Table :columns="columns" :fetch="fetchUsers" selectable pagination :page-size="20">
  <template #cell-status="{ value }"><Tag>{{ value }}</Tag></template>
</Table>
```

```vue
<!-- 也可继续使用 data 状态模式：请求由外层 change 事件驱动 -->
<Table
  :columns="columns"
  :data="tableState"
  :total="total"
  selectable
  pagination
  :page-size="20"
  @change="onTableChange"
>
  <template #cell-status="{ value }"><Tag>{{ value }}</Tag></template>
</Table>
```

### 受控分页 / 排序

分页与排序默认由组件内部持有；绑定 `v-model` 后即由外部接管，绑定的变量与 `fetch` 注入的 query 始终是同一份状态，可在 `fetch` 方法里直接闭包读取（用于 URL 同步、外部筛选联动等场景）。绑定 `v-model:current-page` 后无需再写 `pagination` 开关：

```vue
<template>
  <Table v-model:current-page="page" v-model:sorter="sort" :columns="columns" :fetch="loadUsers" />
</template>

<script setup lang="ts">
import { ref } from 'vue';

const page = ref(1);
const sort = ref({ key: '', order: null });

const loadUsers = async (query) => {
  // query.pagination.currentPage 与 page.value 等价，任选其一
  const res = await fetch(`/api/users?page=${page.value}`);
  return res.json();
};
</script>
```

## 单元格竞选

列携带 `type` / `format` 元数据时，单元格显示由列定义自动推断：每个单元格渲染器（Cell）对**完整列定义**自我评价返回适配度分数，竞选代理按列裁决取最高分（同分先注册者优先，全部弃权回落默认文本）。`type` 描述保存格式（number / boolean / date / datetime / enum…），`format` 描述内容格式（email / uri / tag / status…），资源池投影的列会自动携带两者。

- 优先级链路：插槽 > 显式指定 `cell` > 竞选推断 > 默认文本
- 外部调整三层：列上加成 `bias`（加减分翻转竞选结果）、显式指定 `cell`（跳过竞选）、`registerCell` 同名覆盖（替换含内建在内的全局实现）
- Table 的 `cells` 属性传入局部渲染器，与全局注册共同参与竞选；宿主在列上附加的自定义字段原样进入评分输入
- 枚举列通过 `options`（或 `filters`）提供 label 映射，越界值降级显示原值

```vue
<template>
  <Table :columns="columns" :rows="rows" />
</template>

<script setup lang="ts">
const columns = [
  { key: 'name', title: '姓名' },
  { key: 'email', title: '邮箱', format: 'email' }, // 竞选推断 → 邮箱链接
  { key: 'score', title: '积分', type: 'number' }, // 竞选推断 → 数值格式化
  {
    key: 'status',
    title: '状态',
    type: 'enum',
    options: [
      { label: '活跃', value: 'active' },
      { label: '休假', value: 'leave' },
    ],
  }, // 竞选推断 → 选项 label 标签
  { key: 'level', title: '等级', type: 'enum', format: 'status', bias: { tag: 30 } }, // 加成后 tag 胜出
];
</script>
```

宿主扩展：按同一契约注册自定义 Cell，全局竞选或局部竞选均可参与，无需修改 Table 内部：

```ts
import { registerCell } from '@mrchar/cumquat/components';

registerCell({
  name: 'progress',
  fitness: (column) => (column.format === 'percent' ? 95 : 0),
  render: (value) => h(Progress, { value: Number(value) }),
});
```

机制设计、评分约定与扩展契约详见[单元格竞选](/cell)。

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

<script setup lang="ts">

import { ref } from 'vue';

import type { Fetch, FetchQuery } from '@mrchar/cumquat/components';

const page = ref(1);

const columns = [
  { key: 'name', title: '姓名' },
  { key: 'role', title: '角色', align: 'center' },
  { key: 'status', title: '状态', align: 'right' },
];

const rows = [
  { name: 'Amber', role: '前端', status: '活跃' },
  { name: 'Bolt', role: '后端', status: '休假' },
  { name: 'Cyan', role: '设计', status: '活跃' },
];

const tableCode = ref(`
  <Table :columns="columns" :rows="rows" />
`);

/** 竞选演示列：type / format 元数据驱动单元格显示，level 列以 bias 加成让 tag 胜出 */
const cellColumns = [
  { key: 'name', title: '姓名' },
  { key: 'email', title: '邮箱', format: 'email' },
  { key: 'score', title: '积分', type: 'number' },
  { key: 'active', title: '启用', type: 'boolean' },
  {
    key: 'status',
    title: '状态',
    type: 'enum' as const,
    options: [
      { label: '活跃', value: 'active' },
      { label: '休假', value: 'leave' },
    ],
  },
  { key: 'level', title: '等级', type: 'enum' as const, format: 'status', bias: { tag: 30 } },
  { key: 'createdAt', title: '创建时间', type: 'datetime' as const },
];

const cellRows = [
  {
    name: 'Amber',
    email: 'amber@cumquat.dev',
    score: 1234567,
    active: true,
    status: 'active',
    level: 'gold',
    createdAt: '2026-03-05T08:09:10',
  },
  {
    name: 'Bolt',
    email: 'bolt@cumquat.dev',
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
    filters: [
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

const fetchUsers: Fetch<RemoteUser> = async (query: FetchQuery) => {
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

  const currentPage = query.pagination?.currentPage ?? 1;
  const pageSize = query.pagination?.pageSize ?? 10;
  return {
    list: list.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    total: list.length,
  };
};

const remoteTableCode = ref(`
  <div class="flex flex-col gap-3">
    <div class="flex items-center gap-3">
      <Button size="sm" @click="failNextFetch = true">模拟下一次请求失败</Button>
      <span class="text-sm text-cumquat-text-muted">
        绑定 fetch 后，翻页、点表头排序、角色筛选都会自动重新请求
      </span>
    </div>
    <Table :columns="remoteColumns" :fetch="fetchUsers" pagination :page-size="10" />
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { page, columns, rows, tableCode, cellColumns, cellRows, cellTableCode, delay, remoteColumns, allRemoteUsers, failNextFetch, fetchUsers, remoteTableCode };
</script>
