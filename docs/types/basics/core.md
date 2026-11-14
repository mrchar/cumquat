---
title: 类型参考 · 核心类型
---

# 核心类型

状态自持的运行时契约，全部由 `@cumquat/core` 提供：纯类型与纯逻辑，不依赖任何组合函数或组件，仅以 Vue 的 `MaybeRefOrGetter` 表达响应式契约。它们是整个类型体系的地基，后续页面中的类型都建立在这一层之上。

## 三种处理函数

| 协议 | 页面提供 | 组件触发时机 | 返回 |
| --- | --- | --- | --- |
| `fetch` | `(query: FetchQuery) => FetchResult<T> \| Promise<FetchResult<T>>`（资源工厂） | 挂载时建对象；翻页、搜索、排序、展开调 `execute`；卸载 / 源切换调 `abort` | 自带状态信封与执行 / 取消方法的资源对象 |
| `action` | `(...args) => Promise<ActionResult \| void>` | 点击、提交、切换 | 成功 / 失败 |
| `subscribe` | `() => Promise<SubscribeResult<T>>` | 挂载时调用一次 | 承载数据的 `AsyncResult` |

`action` / `subscribe` 以 `Promise` 作为统一异步边界，类型也接受同步返回值，组件会统一 `await`。`fetch` 不同：工厂只创建一次长命资源对象，后续交互由对象上的 `execute` 驱动；`execute` 失败不 reject，统一写入资源对象的 `error` 状态。`action` 与 `subscribe` 的 Promise 解析为 `AsyncResult`，处理器可以用 `status` / `error` / `message` 表达结果。

## 统一观察面

无论使用哪种协议，页面与组件观察到的是同一组语义：

| 观察面 | 含义 | 来源 |
| --- | --- | --- |
| `status` | `idle` / `pending` / `success` / `error` | 处理方法返回的 `AsyncResult`（action / subscribe）；fetch 由组件内部投影为同形 `Snapshot` |
| `data` | 最近一次成功的数据；失败时可保留旧数据 | 处理方法返回值中的 `data` |
| `error` | 失败原因，`unknown`；由组件归一成可展示文案 | 处理方法返回值中的 `error` 或 Promise reject |
| `message` | 处理器返回的提示文案，优先于默认错误文案 | `AsyncResult.message`；组件错误条消费 |
| `execute` | 重新执行本次处理 | fetch 资源对象的方法；组件内部重试入口；宿主侧通过 `useAsyncState` 的 `retry` |
| `cancel` | 中止进行中的处理 | fetch 由资源对象的零参 `abort()` 承载，实现完全在宿主侧；订阅通过重新执行覆盖；短动作默认不提供 |

关键点是**状态的归属**：处理方法的返回值本身就是完整状态对象，组件拿到后自行投影渲染，页面不需要维护第二份 `loading` / `error` / `page`。fetch 协议把这一原则推到资源对象——`status / data / error / message` 作为 `MaybeRefOrGetter` 字段封装在对象内部，组件只读不写。需要在组件之外观察状态时，用 `useAsyncState` 把一次性请求包装成 `Snapshot`，而不是向组合函数索取额外的响应式导出。

```ts
import { useAsyncState, type FetchHandler } from '@mrchar/cumquat';

// 手写资源工厂，绑定组件（本身就是 FetchHandler）
const fetchUserList: FetchHandler<UserRow> = () => createUserResource();

// 组件外的一次性请求需要观察异步状态时
const { state, retry } = useAsyncState(() => fetchUsers({}));
state.value.status; // 统一状态词汇
state.value.data;   // 最近一次成功的数据
retry();             // 重新执行
```

组合函数输出的 `Snapshot` 等响应式形态见[公共组合类型](/types/basics/common)；数据类组合函数不产生独立返回类型——fetch 资源工厂与 subscribe 处理方法均由宿主手写为本页的 `FetchHandler` / `SubscribeHandler`。

## 统一状态

### Status {#status}

所有异步协议共用的唯一状态词汇。`idle` 表示尚未开始，`pending` 表示进行中。

```ts
export type Status = 'idle' | 'pending' | 'success' | 'error';
```

### AsyncResult {#asyncresult}

处理器结果协议：`action` 与 `subscribe` 的共同形状。它只描述“处理器返回了什么”，与组合函数输出的 `Snapshot` 区分开。`message` 是统一观察面里的“消息”，组件优先展示它，其次才是从 `error` 归一的文案。四个字段都接受裸值、`Ref` 或 getter，消费方统一以 `toValue` 解包。

```ts
export interface AsyncResult<T = unknown, S extends Status = Status> {
  /** 结果状态，缺省视为 success */
  status?: MaybeRefOrGetter<S>;
  /** 结果携带的数据 */
  data?: MaybeRefOrGetter<T>;
  /** 失败信息；status 为 error 或携带 error 时进入失败分支 */
  error?: MaybeRefOrGetter<unknown>;
  /** 提示文案，覆盖默认错误文案 */
  message?: MaybeRefOrGetter<string>;
}
```

## 远程数据

### FetchHandler {#fetchhandler}

所有资源型组件 `fetch` 属性的统一工厂类型。`T` 为数据项类型：列表组件的资源 `data` 取 `T[]` 或 `PagedResult<T>`，单值组件取 `T`。工厂以初始查询创建一个资源对象，组件绑定期间只创建一次。

```ts
export type FetchHandler<T, TFilters = Record<string, unknown>> = (
  query: FetchQuery<TFilters>,
) => FetchResult<T> | Promise<FetchResult<T>>;
```

### FetchQuery {#fetchquery}

组件按自身交互产生的统一查询参数，直接继承分页参数：`page / size` 与关键词、排序、筛选平铺在同一层。每个字段都接受裸值、`Ref` 或 getter，因此可以直接传 `reactive` 对象，更新其中的响应式值即可驱动自动重取。**不含 `signal`**：取消是资源对象自身的能力（`abort` 方法），不属于查询参数。

```ts
export interface FetchQuery<TFilters = Record<string, unknown>> extends Partial<FetchQueryPagination> {
  /** 关键词（远程搜索、输入建议） */
  keyword?: MaybeRefOrGetter<string | undefined>;
  /** 排序 */
  sorter?: MaybeRefOrGetter<FetchSorter | undefined>;
  /** 业务筛选：列筛选、父节点 key、日期范围等，形状由宿主与组件约定 */
  filters?: MaybeRefOrGetter<TFilters | undefined>;
}
```

### FetchQueryPagination {#fetchquerypagination}

```ts
export interface FetchQueryPagination {
  page: MaybeRefOrGetter<number>; // 页码从 1 开始
  size: MaybeRefOrGetter<number>; // 每页条数
}
```

### FetchSorter {#fetchsorter}

```ts
export interface FetchSorter {
  key: MaybeRefOrGetter<string>;
  order: MaybeRefOrGetter<'asc' | 'desc' | null>;
}
```

### ResolvedFetchQuery {#resolvedfetchquery}

`FetchResult.execute` 收到的是解包后的纯值快照，由 `resolveFetchQuery(query)` 从响应式查询中读取当前值生成；组件内部的 `useFetchResource` 已自动完成这一步。

```ts
export interface ResolvedFetchQuery<TFilters = Record<string, unknown>>
  extends Partial<ResolvedFetchQueryPagination> {
  keyword?: string;
  sorter?: { key: string; order: 'asc' | 'desc' | null };
  filters?: TFilters;
}

export function resolveFetchQuery<TFilters = Record<string, unknown>>(
  source?: MaybeRefOrGetter<FetchQuery<TFilters> | undefined> | null,
): ResolvedFetchQuery<TFilters>;
```

### FetchData {#fetchdata}

资源对象 `data` 字段承载的数据载荷：数组按普通列表渲染；`{ list, page, size, total }` 自动识别为分页并回填总数；其余视为单值。分页是 data 内部的抽象，与 fetch 协议本身无关。

```ts
export type FetchData<T> = T[] | PagedResult<T> | T;
```

### FetchResponsePagination {#fetchresponsepagination}

分页展示信息：响应归一后的页码、页大小与总数；响应缺失分页值时由消费方以本次请求参数兜底。

```ts
export interface FetchResponsePagination {
  /** 响应回传的页码；缺失时取本次请求的页码 */
  page: number;
  /** 响应回传的页大小；缺失时取本次请求的页大小 */
  size: number;
  total: number;
}
```

### PagedResult {#pagedresult}

分页响应信封，继承 [`FetchResponsePagination`](#fetchresponsepagination)。request 的 [`FetchQueryPagination`](#fetchquerypagination) 与响应的 `page / size` 共用同一套词汇；**组件展示的页码与页大小以响应为准**，后端可回传真实页码或被裁剪后的页大小。

```ts
export interface PagedResult<T> extends FetchResponsePagination {
  list: T[];
}
```

### FetchResult {#fetchresult}

fetch 资源对象（与 VueUse `useFetch` 返回形态同构）：一次绑定一个长命实例，自带响应式信封与执行 / 取消方法。状态机、竞态保护、取消手段全部由实现方负责——组件库只在挂载与查询变化时调用 `execute`，在源切换与卸载时调用 `abort`。失败不得 reject：统一写入 `status = 'error'` 与 `error / message`。

四个状态字段的类型是 [`MaybeRefOrGetter`](https://cn.vuejs.org/api/reactivity-utilities.html#tovalue)：可以返回 `ref()` 创建的响应式字段，也可以返回裸值或 getter；消费方统一以 `toValue` 读取：

```ts
export interface FetchResult<T> {
  /** 异步生命周期状态 */
  status: MaybeRefOrGetter<Status>;
  /** 最近一次成功的数据载荷；pending/error 时可保留旧值 */
  data: MaybeRefOrGetter<FetchData<T> | undefined>;
  /** 失败对象；status 为 error 时存在 */
  error: MaybeRefOrGetter<unknown>;
  /** 可展示的失败文案，覆盖组件默认错误文案 */
  message: MaybeRefOrGetter<string | undefined>;
  /** 执行（或重跑）请求；组件在挂载、查询变化、重试时调用 */
  execute: (query?: ResolvedFetchQuery) => void | Promise<void>;
  /** 取消在途请求；组件在源切换、卸载时调用，空转应安全无副作用 */
  abort: () => void;
}
```

手写示例与竞态 / AbortController 的组织方式见[数据请求](/composables/fetch)。

## 交互动作

### ActionHandler {#actionhandler}

交互组件 `action` 属性的统一类型。执行期间组件自动 loading / 禁用；失败按 `message` → `error` 字符串 → `Error.message` 归一错误文案。

```ts
export type ActionHandler = (...args: any[]) => Promise<ActionResult | void> | ActionResult | void;
```

### ActionResult {#actionresult}

动作结果：`AsyncResult` 的窄化形态，只表达成功 / 失败，不承载渲染数据。

```ts
export type ActionResult = AsyncResult<never, 'success' | 'error'>;
```

## 数据订阅

### SubscribeHandler {#subscribehandler}

数据展示组件 `subscribe` 属性的统一类型。处理方法在挂载时调用一次；返回的 `data` 为响应式对象时，后续修改持续更新视图（见[状态自持](/state)）。

```ts
export type SubscribeHandler<T> = () => Promise<SubscribeResult<T>> | SubscribeResult<T>;
```

### SubscribeResult {#subscriberesult}

订阅结果：`AsyncResult` 承载数据后的形态；`status` 为 `pending` 时保持加载态。

```ts
export type SubscribeResult<T> = AsyncResult<T>;
```
