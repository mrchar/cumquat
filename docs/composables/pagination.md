---
title: 分页 usePagination
---

# 分页 usePagination

分页模型：当前页 / 页大小、总页数、含省略号的页码序列、跳页与边界约束。自身不发请求，`go` / `setPageSize` 只负责状态与 `onChange` 通知。

```ts
function usePagination(options?: UsePaginationOptions): UsePaginationReturn;
```

```ts
const { currentPage, pageSize, totalPages, pages, canPrev, canNext, go, next } =
  usePagination({
    total: 128,
    defaultPageSize: 10,
    onChange: ({ currentPage, pageSize }) => load(currentPage, pageSize),
  });
```

## 参数

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `currentPage` | `MaybeRefOrGetter<number>` | 当前页（受控；传 getter 保持响应性） |
| `defaultCurrentPage` | `number` | 非受控初始页，默认 1 |
| `pageSize` | `MaybeRefOrGetter<number>` | 页大小（受控） |
| `defaultPageSize` | `number` | 默认 10 |
| `total` | `number` | 总条数，默认 0 |
| `pageSizes` | `number[]` | 每页条数候选 |
| `siblingCount` | `number` | 当前页两侧兄弟页数，默认 1 |
| `boundaryCount` | `number` | 首尾始终展示页数，默认 1 |
| `onPageChange` / `onPageSizeChange` | 函数 | 单项变化回调 |
| `onChange` | `(payload: { currentPage, pageSize }) => void` | 统一变化回调（组件据此组装 change 事件） |

## 返回

| 成员 | 说明 |
| --- | --- |
| `currentPage` / `pageSize` / `total` / `totalPages` | 响应式状态 |
| `pages` | 含省略号占位的页码序列（`PaginationPageItem[]`） |
| `isFirst` / `isLast` / `canPrev` / `canNext` | 边界状态 |
| `rangeStart` / `rangeEnd` | 当前页条目序号区间（用于「第 x-y 条」展示） |
| `go(page)` / `prev()` / `next()` / `setPageSize(size)` | 跳页与页大小变更 |

消费方：Pagination 组件；Table 内联复用；宿主自研列表可直接使用。
