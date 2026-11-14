/* ------------------------------------------------------------------ */
/* fetch 协议：资源对象 + 信封状态 + 执行/取消方法                      */
/* ------------------------------------------------------------------ */

import { toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';

import type { Status } from './status';

/**
 * 组件自动注入的分页参数，页码从 1 开始。
 * 字段接受裸值、Ref 或 getter，便于以 reactive / ref 组织查询并自动触发重取。
 */
export interface FetchQueryPagination {
  /** 页码，从 1 开始 */
  page: MaybeRefOrGetter<number>;
  /** 每页条数 */
  size: MaybeRefOrGetter<number>;
}

/** 排序状态；字段接受裸值、Ref 或 getter */
export interface FetchSorter {
  key: MaybeRefOrGetter<string>;
  order: MaybeRefOrGetter<'asc' | 'desc' | null>;
}

/**
 * 统一查询参数：组件按自身交互产生其中片段，字段全部可选。
 * 直接继承分页参数，页码 / 页大小与关键词、排序、筛选平铺在同一层；
 * 每个字段都接受裸值、Ref 或 getter，因此可以直接传 reactive 对象，
 * 更新其中的响应式值即可驱动自动重取。取消信号不属于查询——
 * 取消是资源对象自身的能力，由 abort 方法承载。
 */
export interface FetchQuery<TFilters = Record<string, unknown>> extends Partial<FetchQueryPagination> {
  /** 关键词（远程搜索、输入建议） */
  keyword?: MaybeRefOrGetter<string | undefined>;
  /** 排序 */
  sorter?: MaybeRefOrGetter<FetchSorter | undefined>;
  /** 业务筛选：列筛选、父节点 key、日期范围等，形状由宿主与组件约定 */
  filters?: MaybeRefOrGetter<TFilters | undefined>;
}

/** 解包后的分页参数：执行时使用的纯值快照 */
export interface ResolvedFetchQueryPagination {
  page: number;
  size: number;
}

/** 解包后的排序状态 */
export interface ResolvedFetchSorter {
  key: string;
  order: 'asc' | 'desc' | null;
}

/** 解包后的查询参数：execute 与资源实现消费的纯值快照 */
export interface ResolvedFetchQuery<TFilters = Record<string, unknown>>
  extends Partial<ResolvedFetchQueryPagination> {
  keyword?: string;
  sorter?: ResolvedFetchSorter;
  filters?: TFilters;
}

/** 把响应式查询片段解包为纯值快照；缺失字段不写入结果 */
export function resolveFetchQuery<TFilters = Record<string, unknown>>(
  source?: MaybeRefOrGetter<FetchQuery<TFilters> | undefined> | null,
): ResolvedFetchQuery<TFilters> {
  const query = toValue(source);
  if (!query) return {};

  const page = toValue(query.page);
  const size = toValue(query.size);
  const keyword = toValue(query.keyword);
  const sorter = toValue(query.sorter);
  const filters = toValue(query.filters);

  const resolved: ResolvedFetchQuery<TFilters> = {};
  if (page !== undefined) resolved.page = page;
  if (size !== undefined) resolved.size = size;
  if (keyword !== undefined) resolved.keyword = keyword;
  if (sorter) {
    resolved.sorter = {
      key: toValue(sorter.key),
      order: toValue(sorter.order),
    };
  }
  if (filters !== undefined) resolved.filters = filters;
  return resolved;
}

/**
 * 分页展示信息：响应归一后的页码 / 页大小 / 总数。
 * 响应缺失分页值时，由消费方以本次请求参数兜底。
 */
export interface FetchResponsePagination {
  /** 响应回传的页码；缺失时取本次请求的页码 */
  page: number;
  /** 响应回传的页大小；缺失时取本次请求的页大小 */
  size: number;
  total: number;
}

/**
 * 分页数据形态：data 写入此结构时组件启用分页。
 * 请求分页参数（FetchQueryPagination）与响应分页值共用 page / size 词汇；
 * 组件展示的页码与页大小以响应中的 page / size 为准。
 */
export interface PagedResult<T> extends FetchResponsePagination {
  list: T[];
}

/**
 * fetch 承载的数据载荷：数组为列表，{ list, page, size, total } 为分页信封，其余为单值。
 * 放在资源对象的 data 字段中，由实现方写入。
 */
export type FetchData<T> = T[] | PagedResult<T> | T;

/**
 * fetch 资源对象（与 VueUse useFetch 返回形态同构）：
 * 一次绑定一个长命实例，自带响应式信封与执行 / 取消方法。
 *
 * 状态机、竞态保护、取消手段全部由实现方负责——组件库只在挂载与查询
 * 变化时调用 execute，在源切换与卸载时调用 abort，不感知内部实现。
 * 失败不得 reject：统一写入 status='error' 与 error/message。
 */
export interface FetchResult<T> {
  /** 异步生命周期状态 */
  status: MaybeRefOrGetter<Status>;
  /** 最近一次成功的数据载荷；pending/error 时可保留旧值 */
  data: MaybeRefOrGetter<FetchData<T> | undefined>;
  /** 失败对象；status 为 error 时存在 */
  error: MaybeRefOrGetter<unknown>;
  /** 可展示的失败文案，覆盖组件默认错误文案 */
  message: MaybeRefOrGetter<string | undefined>;
  /** 执行（或重跑）请求；入参为解包后的纯值查询快照，缺省沿用资源自身的初始查询 */
  execute: (query?: ResolvedFetchQuery) => void | Promise<void>;
  /** 取消在途请求；组件在源切换、卸载时调用，空转应安全无副作用 */
  abort: () => void;
}

/**
 * fetch 工厂：以初始查询创建资源对象，允许异步构建
 * （如资源池需要先加载接口文档）。组件绑定期间只创建一次，
 * 后续查询变化通过返回对象的 execute 驱动。
 */
export type FetchHandler<T, TFilters = Record<string, unknown>> = (
  query: FetchQuery<TFilters>,
) => FetchResult<T> | Promise<FetchResult<T>>;

/** 归一化后的结果：供组件层从 data 载荷中推导列表、分页总数与响应页码 */
export interface NormalizedFetch<T> {
  data: T[] | T;
  total?: number;
  /** 响应回传的页码；缺失时组件以请求参数兜底 */
  page?: number;
  /** 响应回传的页大小；缺失时组件以请求参数兜底 */
  size?: number;
  raw: FetchData<T>;
}

/** 判断是否为分页数据形态（以 list + total 判定，page / size 缺省由组件兜底） */
export function isPagedResult<T>(value: unknown): value is PagedResult<T> {
  return (
    !!value &&
    typeof value === 'object' &&
    Array.isArray((value as PagedResult<T>).list) &&
    typeof (value as PagedResult<T>).total === 'number'
  );
}

/** 归一化：数组 → 列表；{ list, page, size, total } → 分页；其他 → 单值 */
export function normalizeFetchResult<T>(raw: FetchData<T>): NormalizedFetch<T> {
  if (Array.isArray(raw)) return { data: raw, total: raw.length, raw };
  if (isPagedResult<T>(raw)) {
    const paged = raw as PagedResult<T>;
    return {
      data: paged.list,
      total: paged.total,
      page: typeof paged.page === 'number' ? paged.page : undefined,
      size: typeof paged.size === 'number' ? paged.size : undefined,
      raw,
    };
  }
  return { data: raw, raw };
}
