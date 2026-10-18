---
title: 数据请求 useFetch
---

# 数据请求

宿主侧与组件内部的统一请求工具。协议与组件接入方式见[远程数据 Fetch](/fetch)；本页是组合函数 API。

## useFetch

宿主侧创建一次请求资源，返回的 `fetch` 可直接绑给组件的 `fetch` 属性，状态也可在组件外消费（页头统计、面包屑等）。

```ts
function useFetch<T>(fetcher: Fetch<T>): UseFetchReturn<T>;
```

```ts
import { useFetch } from '@cumquat/composables';

const { fetch: fetchUsers, data, total, status, loading, error, isStale, refresh } =
  useFetch<UserRow>((query) => fetchUsersApi(query));
```

| 返回成员 | 说明 |
| --- | --- |
| `fetch` | `(query?) => Promise<FetchResult<T>>`，可直接绑给组件的 `fetch` 属性 |
| `state` | `ComputedRef<AsyncStateLike>`，四态 + retry |
| `data` | 归一化后的负载：数组 / 分页 list / 单值 |
| `total` | 分页总数；普通数组为数据条数；单值为 undefined |
| `status` / `loading` / `error` / `isStale` | 状态便捷访问 |
| `refresh` | 以最近查询重发；传入 query 时浅合并覆盖 |

行为：请求序号保证后到为准，旧请求经 `AbortController` 取消；重取期间保留旧数据并标 `isStale`。

## useFetchResource

组件内部的资源机制：挂载即请求、查询片段变化自动重取、防抖、累积合并。供组件作者使用。

```ts
const { enabled, state, total, loading, error, refresh } = useFetchResource<Row[]>(
  () => props.fetch, // 必须传 ref/getter，裸函数会被 toValue 当 getter 调用
  {
    getQuery: () => ({ pagination: { currentPage, pageSize }, sorter }),
    initialData: [],
    debounce: 300,                        // 关键词类组件使用
    merge: (previous, next, query) => …,  // 累积分页 / 树懒加载挂载子级
  },
);
```

- 首次绑定在微任务执行，查询监听器在首次绑定时完成依赖收集
- `merge` 模式下仅当 `pagination.currentPage <= 1` 时重置数据；无分页片段的懒加载查询不重置，由 `merge` 依据 `filters.parentKey` 挂回子树

## createFetchController

纯工厂：请求序号竞态控制 + AbortController + 四态状态机。是上述两个钩子的底层，可单独用于测试或自定义编排。

```ts
const controller = createFetchController<Row[]>();
const result = await controller.run(query, fetcher);
controller.state; // AsyncStateLike
```
