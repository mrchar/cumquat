---
title: 协议辅助函数
---

# 协议辅助函数

以下协议判定与错误归一工具随组合函数一并从主包 `@mrchar/cumquat` 导出。组件与组合函数内部大量使用，宿主在自定义渲染层或封装新组件时也可直接复用。

## 请求结果归一

### isPagedResult

判断一个请求结果是否为分页结构（`list` 为数组且 `total` 为数字）。`page / size` 缺失时由调用方以请求分页参数兜底，因此判定保持宽松，避免宿主漏传导致整表退化为单值。

```ts
function isPagedResult<T>(value: unknown): value is PagedResult<T>;
```

### normalizeFetchResult

把资源对象 `data` 字段的载荷 [`FetchData`](/types/basics/core#fetchdata)`<T>` 归一为统一的内部结构：数组 → `{ data, total: length, raw }`；`{ list, page, size, total }` → `{ data: list, total, page, size, raw }`（`page / size` 缺失时为 `undefined`）；其他 → `{ data: raw, raw }`。

```ts
function normalizeFetchResult<T>(raw: FetchData<T>): NormalizedFetch<T>;
```

## 异步错误归一

以下函数位于核心包，供 action 与 subscribe 共用；主包 `@mrchar/cumquat` 统一导出，并保留旧的 `extractActionFailure` / `actionErrorText` / `extractSubscribeFailure` / `subscribeErrorText` 别名。

### extractAsyncFailure

从结果中提取失败信息：结果为对象且 `status === 'error'` 或 `error != null` 时返回 `{ error: error ?? result }`，否则返回 `null`。

```ts
function extractAsyncFailure(result: unknown): { error: unknown } | null;
```

### asyncErrorText

把异步错误归一为可展示文案：优先 `message`，其次 `error` 字符串 / `Error.message`，都无法取得时返回回退文案（默认 `'操作失败'`）。

```ts
function asyncErrorText(error: unknown, fallback = '操作失败'): string;
```
