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

## 资源池

完整契约见[资源池 useResources](/composables/resources)；此处收录跨模块共享的核心类型。

### ResourceField

字段元数据：视图中性的字段描述，`columns` / `filters` / `properties` 均按 `scope` 投影。

```ts
export type ResourceFieldType = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'enum';

export interface ResourceFieldOption {
  label: string;
  value: string | number;
}

export interface ResourceField {
  /** 字段名：数据对象键 */
  name: string;
  /** 展示名，解析自文档描述，缺失回落字段名 */
  label: string;
  type: ResourceFieldType;
  /** 内容格式：原样透传文档声明的 format（如 email / uri / int64），与 type 的保存格式互补 */
  format?: string;
  /** 枚举选项：type 为 enum 时提供 */
  options?: ResourceFieldOption[];
  /** 表单场景是否必填 */
  required?: boolean;
  /** 出现场景标记：未标记的字段不进入任何投影 */
  scope?: { list?: boolean; filter?: boolean; create?: boolean; update?: boolean };
}
```

### ResourceColumn

列表列投影：与 Table 的 columns 属性形状对齐，`type` / `format` 供单元格竞选消费。

```ts
export interface ResourceColumn {
  key: string;
  title: string;
  /** 保存格式提示：字段 type 原样投影 */
  type?: ResourceFieldType;
  /** 内容格式提示：字段 format 原样透传 */
  format?: string;
  sortable?: boolean;
  /** 枚举字段的筛选项（表头勾选面板） */
  filters?: ResourceFieldOption[];
}
```

### ResourceSchema / ResourceDefinition / MetadataParser / RequestAdapter

协议无关性的两条注入边界：解析器把任意协议文档转为资源表，适配器消费池生成的请求描述。

```ts
/** 资源表：元数据解析的唯一产物，也是池运行的唯一依据 */
export interface ResourceSchema {
  resources: Record<string, ResourceDefinition>;
}

/** 单个资源的操作集合与元数据：未声明的操作不可用 */
export interface ResourceDefinition {
  list?: ResourceOperation;
  detail?: ResourceOperation;
  create?: ResourceOperation;
  update?: ResourceOperation;
  remove?: ResourceOperation;
  queryNames?: QueryNames;
  /** 列表响应形状（list / total 的点分路径），由解析器识别 */
  response?: ListResponseMapping;
  /** 字段元数据：columns / filters / properties 的唯一来源 */
  fields?: ResourceField[];
}

/** 元数据解析器：输入任意协议文档，输出资源表（默认提供 OpenAPI 3 / Swagger 2.0 解析器） */
export type MetadataParser = (
  doc: unknown,
  context: { server: string },
) => ResourceSchema | Promise<ResourceSchema>;
```

## 竞选

机制设计见[单元格竞选](/cell)（展示）与[字段竞选](/field)（录入）；两套契约同构：自我评价 + 代理裁决 + 三层外部调整。

### CellRenderer / CellColumn

单元格渲染器：Table 列定义驱动的展示推断。

```ts
export interface CellColumn {
  key: string;
  title: string;
  /** 保存格式提示 */
  type?: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'enum';
  /** 内容格式提示：email / uri / tag / status…（原样透传文档声明） */
  format?: string;
  options?: Array<{ label: string; value: string | number }>;
  filters?: Array<{ label: string; value: string | number }>;
  /** 显式指定单元格渲染器名称，跳过竞选 */
  cell?: string;
  /** 竞选加成：对指定渲染器加减分，正负均可 */
  bias?: Record<string, number>;
}

export interface CellRenderer {
  /** 注册名：显式指定的目标；同名重注册替换既有实现（含内建） */
  name: string;
  /** 自我评价：完整列定义 → 适配度分数，0 弃权；纯函数、不读单元格值 */
  fitness: (column: CellColumn) => number;
  /** 渲染：值 → 展示内容；需自行处理空值与越界值 */
  render: (value: unknown, column: CellColumn) => VNodeChild;
}
```

### FieldRenderer / FormFieldMeta / FieldContext

控件渲染器：Form 字段定义驱动的录入推断，值与错误经上下文接入表单。

```ts
export interface FormFieldMeta {
  name: string;
  label: string;
  /** 保存格式提示 */
  type: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'enum';
  /** 内容格式提示：email / uri / textarea / password…（原样透传文档声明） */
  format?: string;
  /** 枚举选项：select Field 据此装配选项 */
  options?: Array<{ label: string; value: string | number }>;
  /** 必填：自动派生必填校验规则 */
  required?: boolean;
  /** 占位提示，缺省回落 label */
  placeholder?: string;
  /** 显式指定控件渲染器名称，跳过竞选 */
  control?: string;
  /** 竞选加成：对指定渲染器加减分，正负均可 */
  bias?: Record<string, number>;
}

export interface FieldContext {
  name: string;
  disabled: boolean;
  /** 当前校验错误信息（无错误为 undefined） */
  error: string | undefined;
  /** 写回整表值；已存在错误的字段写回后自动重新校验 */
  setValue: (value: unknown) => void;
}

export interface FieldRenderer {
  name: string;
  /** 自我评价：完整字段定义 → 适配度分数，0 弃权；纯函数、不读字段值 */
  fitness: (field: FormFieldMeta) => number;
  /** 装配：值 + 字段定义 + 上下文 → 控件节点 */
  render: (value: unknown, field: FormFieldMeta, ctx: FieldContext) => VNodeChild;
}
```
