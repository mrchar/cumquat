---
title: 远程数据 Fetch
---

# 远程数据 Fetch

17 个资源型组件支持统一的 `fetch` 属性。开发者只绑定请求方法，组件内部自动完成
挂载即请求、交互重取、防抖、竞态处理与四态渲染。完整机制与类型定义见
[数据请求机制](./data-fetching.md)。

```ts
import type { Fetch } from '@cumquat/vue/components';

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

| 组件 | `query` 片段 | 返回形态 |
| ---- | ------------ | -------- |
| Table | `pagination` / `sorter` / `filters` | 数组或 `{ list, total }` |
| Select / AutoComplete / Mention | `keyword`（300ms 防抖） | 数组 |
| Transfer | `keyword`（300ms 防抖） | 数组 |
| Tree / TreeSelect / Cascader | `filters.parentKey`（懒加载子级） | 数组 |
| VirtualList | `pagination`（触底加载下一页并累积） | 数组或 `{ list, total }` |
| Calendar | `filters.range: [首日, 末日]`（切月重取） | 数组 |
| Statistic | `filters` | 单值 |
| Descriptions / Timeline / Tabs / Collapse / Carousel / Menu | `filters` | 数组 |

分页表格：

```vue
<Table :columns="columns" :fetch="fetchUsers" pagination :page-size="20" />
```

远程搜索下拉：

```vue
<Select v-model="userId" :fetch="searchUsers" filterable placeholder="搜索用户" />
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
[组合函数 API](./composables.md)。

---
