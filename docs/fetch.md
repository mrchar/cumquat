---
title: 远程数据 Fetch
---

# 远程数据 Fetch

17 个资源型组件支持统一的 `fetch` 属性。开发者只绑定请求方法，组件内部自动完成
挂载即请求、交互重取、防抖、竞态处理与四态渲染。

```ts
import type { Fetch } from '@mrchar/cumquat/components';

// 返回数组 → 普通列表；返回 { list, total } → 分页；返回其他 → 单值
const fetchUsers: Fetch<UserRow> = async (query) => {
  const res = await fetch(
    `/api/users?page=${query.pagination?.currentPage ?? 1}&q=${query.keyword ?? ''}`,
    { signal: query.signal },
  );
  if (!res.ok) throw new Error('请求失败');
  const body = await res.json();
  return { list: body.records, total: body.total };
};
```

各组件自动注入的查询片段：

| 组件                                                        | `query` 片段                                                  | 返回形态                 |
| ----------------------------------------------------------- | ------------------------------------------------------------- | ------------------------ |
| Table                                                       | `pagination` / `sorter` / `filters`                           | 数组或 `{ list, total }` |
| Select                                                      | `keyword`（300ms 防抖）+ `pagination`（触底加载下一页并累积） | 数组或 `{ list, total }` |
| AutoComplete / Mention                                      | `keyword`（300ms 防抖）                                       | 数组                     |
| Transfer                                                    | `keyword`（300ms 防抖）                                       | 数组                     |
| Tree / TreeSelect / Cascader                                | `filters.parentKey`（懒加载子级）                             | 数组                     |
| VirtualList                                                 | `pagination`（触底加载下一页并累积）                          | 数组或 `{ list, total }` |
| Calendar                                                    | `filters.range: [首日, 末日]`（切月重取）                     | 数组                     |
| Statistic                                                   | `filters`                                                     | 单值                     |
| Descriptions / Timeline / Tabs / Collapse / Carousel / Menu | `filters`                                                     | 数组                     |

分页表格：

```vue
<Table :columns="columns" :fetch="fetchUsers" pagination :page-size="20" />
```

远程搜索下拉：

```vue
<Select v-model="userId" :fetch="searchUsers" filterable placeholder="搜索用户" />
```

远程分页下拉（返回 `{ list, total }` 即自动启用触底加载，已选标签独立于当前页数据）：

```vue
<Select v-model="userIds" :fetch="fetchUsers" :page-size="10" multiple filterable />
```

懒加载树（根节点请求不带 parentKey，子节点数据标记 `leaf` 避免空展开箭头）：

```ts
const fetchOrg: Fetch<OrgNode> = async ({ filters }) => {
  const res = await fetch(`/api/org?parent=${filters?.parentKey ?? ''}`);
  return res.json();
};
```

```vue
<Tree :fetch="fetchOrg" />
```

组件外也可通过 `useFetch` 消费同一份请求状态（`data` / `total` / `status` /
`error` / `refresh`），其 `fetch` 方法或返回对象都可直接绑给组件，详见
[组合函数 API](./composables/fetch.md)。

## 机制

```text
开发者绑定 fetch 方法
        │
        ▼
组件内部统一资源机制（所有 fetch 型组件共用同一组合函数）
  · 挂载自动请求；翻页 / 排序 / 搜索 / 展开等交互自动重取
  · 自动注入统一查询参数（分页、筛选、关键词、排序）
  · 关键词防抖、竞态以后到为准、旧数据保留（stale）
        │
        ▼
四态自动渲染：加载骨架 · 错误 + 重试 · 空态 · 正常数据
```

要点：

1. **开发者只绑定方法**。不写 watch、不手动维护 loading、不组装分页参数——
   `<Table :fetch="fetchUsers" />` 即完整可用。
2. **组件不内置 HTTP**。fetch 方法由宿主实现，URL、鉴权、响应解包都在宿主侧，
   库不假设任何后端协议。
3. **列表与分页结果都支持**。方法返回数组即为普通列表；返回
   `{ list, total }` 即为分页数据，组件自动提取数据与总数、自动注入分页参数。
4. **本地 / 远程等价**。不传 `fetch`、传入本地数据时就是普通组件；传入后自动
   获得骨架、错误重试、空态等渲染，本地用法零迁移成本。

## 类型定义

```ts
/** 组件自动注入的分页参数，页码从 1 开始 */
export interface FetchPagination {
  currentPage: number;
  pageSize: number;
}

/** 统一查询参数：组件按自身交互产生其中片段，字段全部可选 */
export interface FetchQuery<TFilters = Record<string, unknown>> {
  pagination?: FetchPagination;
  keyword?: string;
  sorter?: { key: string; order: 'asc' | 'desc' | null };
  filters?: TFilters;
  signal?: AbortSignal;
}

/** 分页结果：返回此形态时组件启用分页并回填总数 */
export interface PagedResult<T> {
  list: T[];
  total: number;
}

/**
 * 所有 fetch 属性的统一类型。
 * T 为数据项类型：列表组件返回 T[] 或 PagedResult<T>，单值组件返回 T。
 */
export type Fetch<T, TFilters = Record<string, unknown>> = (
  query: FetchQuery<TFilters>,
) => Promise<T[] | PagedResult<T> | T>;
```

宿主实现只负责「查询参数 → 请求 → 解包」：

```ts
const fetchUsers: Fetch<UserRow> = async (query) => {
  const params = {
    page: query.pagination?.currentPage ?? 1,
    pageSize: query.pagination?.pageSize ?? 20,
    q: query.keyword,
    sort: query.sorter?.order ? `${query.sorter.key}:${query.sorter.order}` : undefined,
  };
  const res = await fetch(`/api/users?${new URLSearchParams(clean(params))}`);
  if (!res.ok) throw new Error(`请求失败（${res.status}）`);
  const body = await res.json();
  // 返回 { list, total } 即自动分页；若接口一次性返回全部，直接 return body.records 即可
  return { list: body.records, total: body.total };
};
```

## 组件内部的统一机制

所有 fetch 型组件内部经由同一个资源组合函数 `useFetchResource` 驱动，
开发者无感；宿主侧可用 `useFetch` 创建请求并把它（或其 fetch 方法）绑定给组件：

| 环节     | 统一行为                                                                |
| -------- | ----------------------------------------------------------------------- |
| 请求时机 | 挂载即请求；组件内部分页 / 排序 / 筛选 / 关键词状态变化时自动重取       |
| 参数注入 | 按组件类型把 `pagination` / `keyword` / `sorter` / `filters` 注入 query |
| 关键词   | Select / AutoComplete / Mention 内部防抖（默认 300ms）                  |
| 竞态     | 快速连续操作时以后到为准，过期响应不覆盖数据                            |
| 刷新     | 已有数据时保留旧数据并标记 stale，不闪骨架                              |
| 失败     | 渲染错误态与「重试」按钮，调用最近一次查询重发                          |
| 结果识别 | 数组 → 列表；`{ list, total }` → 分页数据；单值 → 直接消费              |
| 空数据   | success 且为空集合时渲染 Empty 空态                                     |

当服务端已有 Swagger / OpenAPI 文档时，可以不必逐个手写 fetch 方法——资源池
[useResources](/composables/resources) 从文档一次性生成全部请求方法与
`columns` / `filters` / `properties` 字段元数据，方法签名与上表协议完全一致，
直接绑定即可。

## 完整示例

### 分页表格：翻页 / 排序 / 筛选自动重取

```vue
<script setup lang="ts">
import { Table } from '@mrchar/cumquat/components';
import type { TableColumn } from '@mrchar/cumquat/components';

const columns: TableColumn[] = [
  { key: 'name', title: '姓名', sortable: true },
  { key: 'role', title: '角色' },
  {
    key: 'status',
    title: '状态',
    filters: [
      { label: '活跃', value: 'active' },
      { label: '休假', value: 'leave' },
    ],
  },
];

const fetchUsers: Fetch<UserRow> = async ({ pagination, sorter, filters }) => {
  const body = await api.get('/users', {
    params: { page: pagination?.currentPage, pageSize: pagination?.pageSize, sorter, filters },
  });
  return { list: body.records, total: body.total };
};
</script>

<template>
  <Table :columns="columns" :fetch="fetchUsers" pagination :page-size="20" />
</template>
```

### 受控分页 / 排序

分页与排序默认是组件内部状态；Table 支持 `v-model:current-page` /
`v-model:page-size` / `v-model:sorter` 绑定到外部响应式变量，绑定后 query 注入
照常工作，外部变量与 query 是同一份状态——适合做 URL 同步、外部筛选联动或
编程式重置页码。绑定 `v-model:current-page` 时分页器自动出现，无需 `pagination`
开关：

```vue
<Table v-model:current-page="page" v-model:sorter="sort" :columns="columns" :fetch="fetchUsers" />
```

```ts
const page = ref(1);
const sort = ref({ key: '', order: null });

// query.pagination.currentPage 与 page.value 等价，按习惯任选
```

### 远程搜索与输入建议

组件内部管理关键词与防抖，宿主只实现取数：

```vue
<!-- Select：输入搜索词时自动带 keyword 重取 -->
<Select :fetch="fetchUserOptions" placeholder="搜索成员" />

<!-- AutoComplete / Mention：同为 fetch 签名 -->
<AutoComplete :fetch="fetchUserOptions" placeholder="输入成员名" />
```

```ts
const fetchUserOptions: Fetch<{ label: string; value: string }> = async ({ keyword }) => {
  const body = await api.get('/users/suggest', { params: { q: keyword } });
  return body.records; // 返回数组，不分页
};
```

### 组件外导出状态

需要在组件之外使用数据、错误或手动刷新时，用 `useFetch` 包装：

```ts
import { useFetch } from '@mrchar/cumquat/composables';

const {
  fetch, // 绑定给组件的方法
  status, // 'pending' | 'success' | 'error'
  data, // 响应式数据（分页结果时为当前页列表）
  error, // 响应式错误
  total, // 分页总数（非分页时为数据条数）
  refresh, // 手动刷新
} = useFetch(fetchUsers);
```

```vue
<Table :columns="columns" :fetch="fetch" pagination />
<span v-if="status === 'error'" class="text-cumquat-danger">{{ error.message }}</span>
<Button size="sm" @click="refresh()">外部刷新</Button>
```

`useFetch` 与组件内部使用的是同一套资源机制；直接绑定裸 async 函数与绑定
`useFetch(...).fetch` 行为完全一致，区别仅在于后者额外导出响应式状态。

### 单值资源

```vue
<Statistic title="完成率" suffix="%" :fetch="fetchCompletionRate" />
```

```ts
const fetchCompletionRate: Fetch<number> = async ({ filters }) =>
  (await api.get('/metrics/completion-rate', { params: filters })).value;
```

## 边界

- 不提供 HTTP 客户端、不规定响应包格式；不做缓存池、轮询等策略，后续以独立分层叠加。
- 查询参数是组件 → 宿主的单向注入；组件的 `v-model`（选中值、展开节点等）仍保持
  纯同步，不触发请求语义之外的副作用。
- 错误对象类型为 `unknown`，建议宿主归一出 `message` 供错误态展示，文案走既有
  messages 配置，资源层不内置 i18n。
- AutoComplete / Mention 的 `(keyword) => Promise` 签名升级为统一 `Fetch` 时
  保持兼容；Table / Select 的 `data` / `state` 入参与 `fetch` 二选一，同时传入
  以 `fetch` 为准（`subscribe` 存在时优先级更高）。
