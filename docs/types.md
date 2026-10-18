---
title: 类型参考
---

# 类型参考

三大协议（fetch / action / subscribe）与跨组件共享的公共类型。组合函数各自的 Options / Return 类型见[组合函数](/composables/)；组件专属类型（如 `TableColumn`）见各组件文档页。

所有类型均可从主包或 composables 子包导入：

```ts
import type { composables } from 'cumquat';
type MyFetch = composables.Fetch<UserRow>;

// 或直接从子包
import type { Fetch, ActionResult, SubscribeResult } from '@cumquat/composables';
```

## 异步状态

### AsyncStateLike\<T\>

数据型组件唯一依赖的数据契约。传入该形态的对象即获得四态渲染（加载 / 成功 / 失败 / stale）。

```ts
export interface AsyncStateLike<T> {
  status: 'pending' | 'success' | 'error';
  data: T;
  error?: unknown;
  /** 旧数据刷新中标记：已有数据重取时为 true，视图保留旧数据不闪骨架 */
  isStale?: boolean;
  /** 失败重试入口 */
  retry?: () => void;
}
```

## 远程数据 Fetch

### Fetch\<T, TFilters\>

所有资源型组件 `fetch` 属性的统一方法类型。`T` 为数据项类型：列表组件返回 `T[]` 或 `PagedResult<T>`，单值组件返回 `T`。

```ts
export type Fetch<T, TFilters = Record<string, unknown>> = (
  query: FetchQuery<TFilters>,
) => Promise<FetchResult<T>>;
```

### FetchQuery\<TFilters\>

组件按自身交互产生的统一查询参数，字段全部可选——宿主按需消费，不用的忽略即可。

```ts
export interface FetchQuery<TFilters = Record<string, unknown>> {
  /** 分页（表格、虚拟列表等） */
  pagination?: FetchPagination;
  /** 关键词（远程搜索、输入建议） */
  keyword?: string;
  /** 排序 */
  sorter?: FetchSorter;
  /** 业务筛选：列筛选、父节点 key、日期范围等，形状由宿主与组件约定 */
  filters?: TFilters;
  /** 取消信号：新请求发起时上一次请求会被 abort */
  signal?: AbortSignal;
}

export interface FetchPagination {
  currentPage: number; // 页码从 1 开始
  pageSize: number;
}

export interface FetchSorter {
  key: string;
  order: 'asc' | 'desc' | null;
}
```

### FetchResult\<T\> / PagedResult\<T\>

fetch 方法的返回形态决定组件行为：数组按普通列表渲染；`{ list, total }` 自动识别为分页并回填总数；其余视为单值。

```ts
export type FetchResult<T> = T[] | PagedResult<T> | T;

export interface PagedResult<T> {
  list: T[];
  total: number;
}
```

### FetchLike\<T\> / UseFetchReturn\<T\>

组件 `fetch` 属性可接受裸 `Fetch` 方法，也可接受 `useFetch` 返回的对象（行为一致，后者额外导出响应式状态）。

```ts
export type FetchLike<T, TFilters = Record<string, unknown>> =
  | Fetch<T, TFilters>
  | UseFetchReturn<T>;

export interface UseFetchReturn<T> {
  /** 绑定给组件 fetch 属性的方法；也可独立调用 */
  fetch: (query?: FetchQuery) => Promise<FetchResult<T> | undefined>;
  /** 异步状态投影（AsyncStateLike 同形） */
  state: ComputedRef<AsyncStateLike<T[] | T | undefined>>;
  status: ComputedRef<'pending' | 'success' | 'error'>;
  /** 最近一次成功的数据 */
  data: ComputedRef<T[] | T | undefined>;
  error: Ref<unknown>;
  loading: ComputedRef<boolean>;
  isStale: ComputedRef<boolean>;
  /** 分页总数；非分页结果为数据条数；单值结果为 undefined */
  total: Ref<number | undefined>;
  /** 手动刷新（可携带查询片段） */
  refresh: (query?: FetchQuery) => Promise<FetchResult<T> | undefined>;
}
```

## 交互动作 Action

### ActionLike / ActionResult

交互组件 `action` 属性的统一类型。执行期间组件自动 loading / 禁用；失败按 `message` → `error` 字符串 → `Error.message` 归一错误文案。

```ts
export type ActionLike = (...args: any[]) => Promise<ActionResult | void> | ActionResult | void;

export interface ActionResult {
  /** 动作结果状态，缺省视为 success */
  status?: 'success' | 'error';
  /** 失败信息；status 为 error 或携带 error 时组件进入失败分支 */
  error?: unknown;
  /** 提示文案，覆盖组件默认错误文案 */
  message?: string;
}
```

## 数据订阅 Subscribe

### SubscribeHandler\<T\> / SubscribeResult\<T\>

数据展示组件 `subscribe` 属性的统一类型。处理方法在挂载时调用一次；返回的 `data` 为响应式对象时，后续修改持续更新视图（见[数据订阅](/subscribe)）。

```ts
export type SubscribeHandler<T> = () => Promise<SubscribeResult<T>> | SubscribeResult<T>;

export interface SubscribeResult<T> {
  /** 订阅状态，缺省视为 success；loading 保持加载态 */
  status?: 'loading' | 'success' | 'error';
  /** 订阅到的数据；status 为 success 时由组件渲染 */
  data?: T;
  /** 失败信息；status 为 error 或携带 error 时组件进入失败分支 */
  error?: unknown;
  /** 提示文案，覆盖组件默认错误文案 */
  message?: string;
}
```

### UseSubscribeReturn\<T\>

`useSubscribe(handler)` 的返回形态，供组件外消费同一份订阅状态。

```ts
export interface UseSubscribeReturn<T> {
  state: Ref<AsyncStateLike<T | undefined>>;
  data: Ref<T | undefined>;
  loading: Ref<boolean>;
  error: Ref<unknown>;
  isStale: Ref<boolean>;
  /** 重新执行订阅处理方法 */
  refresh: () => Promise<void>;
}
```

## 通用

### ControlledProps\<T\>

受控值的标准入参形态，`useControllableModel` / `createControllableModel` 直接消费。

```ts
export interface ControlledProps<T> {
  modelValue?: T;
  defaultValue?: T;
  'onUpdate:modelValue'?: (value: T) => void;
}
```

### AsyncFn\<T, A\>

```ts
export type AsyncFn<T, A extends unknown[]> = (...args: A) => Promise<T>;
```

### Placement / Strategy

浮层组件（Popover、Tooltip、Select 下拉等）共用的方位与定位策略。

```ts
export type Placement =
  | 'top' | 'top-start' | 'top-end'
  | 'bottom' | 'bottom-start' | 'bottom-end'
  | 'left' | 'left-start' | 'left-end'
  | 'right' | 'right-start' | 'right-end';

/** fixed 相对视口，absolute 相对最近定位祖先 */
export type Strategy = 'fixed' | 'absolute';
```
