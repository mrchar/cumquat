---
title: Table 表格
---

# Table 表格

数据列表展示，内置排序、筛选、分页、展开、选择与远程四态。可二选一驱动远程数据：传入 `data` 状态时组件自身不发请求、状态变化通过统一 `change` 事件回发；直接绑定 `fetch` 方法时，翻页 / 排序 / 筛选由组件自动重取。

`TableColumn` 结构：

```ts
interface TableColumn {
  key: string;
  title: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean; // 该列可排序
  sorter?: (a: Row, b: Row) => number; // 本地排序比较器；远程时仅回发状态
  filters?: Array<{ label: string; value: string | number }>; // 表头筛选面板
  filterMethod?: (value: string | number, row: Row) => boolean; // 本地筛选谓词
}
```

| Prop        | 类型                                            | 默认值         | 说明                                       |
| ----------- | ----------------------------------------------- | -------------- | ------------------------------------------ |
| columns     | `TableColumn[]`                                 | -              | 列配置（必填）                             |
| rows        | `Row[]`                                         | `[]`           | 本地数据                                   |
| striped     | `boolean`                                       | `false`        | 斑马纹                                     |
| loading     | `boolean`                                       | `false`        | 外部加载态                                 |
| emptyText   | `string`                                        | `'暂无数据'`   | 空态文案                                   |
| data        | `AsyncStateLike<Row[]>`                         | -              | 远程数据状态：传入后 rows/loading 由其派生 |
| total       | `number`                                        | -              | 远程数据总条数（本地默认取 rows 长度）     |
| rowKey      | `(row: Row, index: number) => string \| number` | 取行索引       | 行唯一键                                   |
| selectable  | `boolean`                                       | `false`        | 显示行选择列                               |
| expandable  | `boolean`                                       | `false`        | 显示展开列                                 |
| pagination  | `boolean`                                       | `false`        | 内置分页条                                 |
| pageSize    | `number`                                        | `10`           | 每页条数                                   |
| pageSizes   | `number[]`                                      | `[10, 20, 50]` | 每页条数选项                               |
| defaultSort | `{ key: string; order: 'asc' \| 'desc' }`       | -              | 初始排序                                   |
| fetch       | `Fetch<Row>`                                     | -              | 远程数据源：自动注入 pagination/sorter/filters；返回 `{ list, total }` 自动分页，返回数组按全量渲染 |

| 事件                | 参数                                                                                            | 说明                                     |
| ------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------- |
| update:selectedKeys | `keys: Array<string \| number>`                                                                 | 选中行 key 更新                          |
| change              | `{ pagination: { currentPage, pageSize }, sorter: { key, order }, filters: Record<string, …> }` | 分页/排序/筛选统一变化（外层据此发请求） |
| rowExpand           | `{ row, expanded: boolean, key }`                                                               | 行展开/收起                              |

| 插槽              | 说明                                       |
| ----------------- | ------------------------------------------ |
| `cell-${col.key}` | 自定义单元格，slot props：`{ row, value }` |
| expanded          | 展开行内容，slot props：`{ row, index }`   |

```vue
<Table
  :columns="columns"
  :fetch="fetchUsers"
  selectable
  pagination
  :page-size="20"
>
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

## 交互演示

### 基础表格

<CodeCard v-model:code="tableCode" editable title="基础表格">
  <LiveDemo :code="tableCode" :scope="demoScope" />
</CodeCard>

### 分页 / 排序 / 筛选自动重取（fetch）

<CodeCard v-model:code="remoteTableCode" editable title="分页 / 排序 / 筛选自动重取（fetch）">
  <LiveDemo :code="remoteTableCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

import type { Fetch, FetchQuery } from '@cumquat/components';

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
const demoScope = { page, columns, rows, tableCode, delay, remoteColumns, allRemoteUsers, failNextFetch, fetchUsers, remoteTableCode };
</script>

