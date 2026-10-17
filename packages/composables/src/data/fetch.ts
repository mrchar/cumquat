import { computed, onScopeDispose, ref, shallowRef, toValue, watch } from 'vue';
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue';
import type { AsyncStateLike } from '../types';

/* ------------------------------------------------------------------ */
/* 类型契约                                                            */
/* ------------------------------------------------------------------ */

/** 组件自动注入的分页参数，页码从 1 开始 */
export interface FetchPagination {
  currentPage: number;
  pageSize: number;
}

/** 排序状态 */
export interface FetchSorter {
  key: string;
  order: 'asc' | 'desc' | null;
}

/**
 * 统一查询参数：组件按自身交互产生其中片段，字段全部可选。
 * 宿主 fetch 方法按需消费，不使用的片段忽略即可。
 */
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

/** 分页结果：fetch 方法返回此形态时，组件自动启用分页并回填总数 */
export interface PagedResult<T> {
  list: T[];
  total: number;
}

/** fetch 方法的原始返回：数组为列表，{ list, total } 为分页，其余视为单值 */
export type FetchResult<T> = T[] | PagedResult<T> | T;

/**
 * 所有组件 fetch 属性的统一方法类型。
 * 列表组件返回 `T[]` 或 `PagedResult<T>`，单值组件返回 `T`。
 */
export type Fetch<T, TFilters = Record<string, unknown>> = (
  query: FetchQuery<TFilters>,
) => Promise<FetchResult<T>>;

/** 归一化后的结果 */
export interface NormalizedFetch<T> {
  data: T[] | T;
  total?: number;
  raw: FetchResult<T>;
}

/** 判断是否为分页结果形态 */
export function isPagedResult<T>(value: unknown): value is PagedResult<T> {
  return (
    !!value &&
    typeof value === 'object' &&
    Array.isArray((value as PagedResult<T>).list) &&
    typeof (value as PagedResult<T>).total === 'number'
  );
}

/** 归一化：数组 → 列表；{ list, total } → 分页；其他 → 单值 */
export function normalizeFetchResult<T>(raw: FetchResult<T>): NormalizedFetch<T> {
  if (Array.isArray(raw)) return { data: raw, total: raw.length, raw };
  if (isPagedResult<T>(raw)) return { data: raw.list, total: raw.total, raw };
  return { data: raw, raw };
}

/* ------------------------------------------------------------------ */
/* 请求控制器：状态机 + 竞态控制 + 取消信号                             */
/* ------------------------------------------------------------------ */

export interface FetchController<T = unknown> {
  run: (query: FetchQuery) => Promise<NormalizedFetch<T> | undefined>;
  /** 以最近一次查询重新请求 */
  refresh: () => Promise<NormalizedFetch<T> | undefined>;
  abort: () => void;
  state: Ref<AsyncStateLike<NormalizedFetch<T> | undefined>>;
  loading: Ref<boolean>;
  error: Ref<unknown>;
}

/**
 * 创建资源请求控制器。纯工厂、无生命周期副作用，可在组件、组合函数或测试中使用。
 * 不主动发起请求，首次调用由消费方（组件资源钩子或宿主）触发。
 */
export function createFetchController<T>(fetcher: Fetch<T>): FetchController<T> {
  const state = ref<AsyncStateLike<NormalizedFetch<T> | undefined>>({
    status: 'pending',
    data: undefined,
  });
  const loading = ref(false);
  const error = ref<unknown>(undefined);
  let requestId = 0;
  let lastQuery: FetchQuery = {};
  let abortController: AbortController | undefined;

  const run = async (query: FetchQuery): Promise<NormalizedFetch<T> | undefined> => {
    const currentId = ++requestId;
    lastQuery = query;
    abortController?.abort();
    abortController = typeof AbortController !== 'undefined' ? new AbortController() : undefined;

    const hadSuccess = state.value.status === 'success';
    state.value = {
      status: 'pending',
      data: hadSuccess ? state.value.data : undefined,
      isStale: hadSuccess,
    };
    loading.value = true;
    error.value = undefined;

    try {
      const raw = await fetcher({ ...query, signal: abortController?.signal });
      if (currentId !== requestId) return undefined;
      const normalized = normalizeFetchResult(raw);
      state.value = { status: 'success', data: normalized, isStale: false };
      error.value = undefined;
      return normalized;
    } catch (err) {
      if (currentId !== requestId) return undefined;
      state.value = {
        status: 'error',
        data: state.value.data,
        error: err,
        isStale: false,
      };
      error.value = err;
      return undefined;
    } finally {
      if (currentId === requestId) loading.value = false;
    }
  };

  const refresh = () => run(lastQuery);

  const abort = () => {
    requestId++;
    abortController?.abort();
  };

  return { run, refresh, abort, state, loading, error };
}

/* ------------------------------------------------------------------ */
/* useFetch：宿主侧创建 fetch 方法，并向组件外导出响应式状态           */
/* ------------------------------------------------------------------ */

/** useFetch 返回对象的品牌标记（内部识别用） */
export const FETCH_RESOURCE = Symbol('fetch-resource');

export interface UseFetchReturn<T> {
  /** 绑定给组件 fetch 属性的方法；也可独立调用 */
  fetch: (query?: FetchQuery) => Promise<FetchResult<T> | undefined>;
  /** 异步状态投影（AsyncStateLike 同形），初始为 pending */
  state: ComputedRef<AsyncStateLike<T[] | T | undefined>>;
  status: ComputedRef<'pending' | 'success' | 'error'>;
  /** 最近一次成功的数据（列表或单值） */
  data: ComputedRef<T[] | T | undefined>;
  error: Ref<unknown>;
  loading: ComputedRef<boolean>;
  isStale: ComputedRef<boolean>;
  /** 分页总数；非分页结果为数据条数；单值结果为 undefined */
  total: Ref<number | undefined>;
  /** 手动刷新（可携带查询片段） */
  refresh: (query?: FetchQuery) => Promise<FetchResult<T> | undefined>;
  /** 内部控制器（组件资源钩子识别复用，宿主无需关心） */
  [FETCH_RESOURCE]: FetchController<T>;
}

/**
 * 宿主侧资源封装：把一个 Fetch 方法升级为带响应式状态的对象。
 * 不绑定组件时不会自动请求；组件接收其 `fetch` 后由组件机制驱动，
 * 状态在组件内外共享同一份。
 */
export function useFetch<T>(fetcher: Fetch<T>): UseFetchReturn<T> {
  const controller = createFetchController(fetcher);
  const total = ref<number | undefined>(undefined);

  const state = computed<AsyncStateLike<T[] | T | undefined>>(() => {
    const current = controller.state.value;
    return {
      status: current.status,
      data: current.data?.data,
      error: current.error,
      isStale: current.isStale,
      retry: () => void controller.refresh(),
    };
  });

  watch(
    () => controller.state.value,
    (current) => {
      if (current.status === 'success' && current.data) {
        total.value = current.data.total;
      }
    },
  );

  const invoke = async (query: FetchQuery = {}) => {
    const result = await controller.run(query);
    return result?.raw;
  };

  return {
    fetch: invoke,
    state,
    status: computed(() => controller.state.value.status),
    data: computed(() => controller.state.value.data?.data),
    error: controller.error,
    loading: computed(() => controller.loading.value),
    isStale: computed(() => controller.state.value.isStale === true),
    total,
    refresh: (query?: FetchQuery) =>
      query ? invoke(query) : controller.refresh().then((r) => r?.raw),
    [FETCH_RESOURCE]: controller,
  };
}

/** 组件 fetch 属性可接收的形态：裸 Fetch 方法或 useFetch 返回对象 */
export type FetchLike<T, TFilters = Record<string, unknown>> =
  | Fetch<T, TFilters>
  | UseFetchReturn<T>;

/** 判断是否为 useFetch 返回对象 */
export function isUseFetchReturn<T>(value: FetchLike<T> | undefined): value is UseFetchReturn<T> {
  return !!value && typeof value === 'object' && FETCH_RESOURCE in value;
}

/* ------------------------------------------------------------------ */
/* useFetchResource：组件内部统一资源机制                              */
/* ------------------------------------------------------------------ */

export interface UseFetchResourceOptions<D> {
  /** 响应式查询来源：deep 监听，变化即按防抖策略重新请求 */
  getQuery: () => FetchQuery;
  /** 占位数据（首次 pending 时渲染） */
  initialData: D;
  /** 从归一化结果映射为组件消费数据；默认直接取 data（数组或单值） */
  mapData?: (normalized: NormalizedFetch<unknown>) => D;
  /** 关键词防抖毫秒，默认 0 */
  debounce?: number;
  /**
   * 结果合并。
   * - 累积模式（虚拟列表触底加载）：与上一页数据拼接；
   * - 懒加载模式（树/级联）：依据 query.filters.parentKey 将子级挂到已有树。
   *
   * 第三个参数为本次实际查询。分页查询回到第 1 页（筛选/搜索变化）时
   * 钩子会先把数据重置为 initialData；无分页的懒加载查询不重置。
   */
  merge?: (previous: D, next: D, query: FetchQuery) => D;
}

export interface FetchResource<D> {
  /** 是否存在可用的 fetch 源（决定远程/本地分支） */
  enabled: Ref<boolean>;
  /** 异步状态；无 fetch 源时为 undefined，组件回退本地数据 */
  state: ComputedRef<AsyncStateLike<D> | undefined>;
  loading: ComputedRef<boolean>;
  error: ComputedRef<unknown>;
  /** 分页总数（非分页为数据条数，无 fetch 源时为 0） */
  total: Ref<number>;
  /** 手动重取；override 与当前查询浅合并，用于懒加载等命令式场景 */
  refresh: (override?: Partial<FetchQuery>) => Promise<void>;
}

/**
 * 组件内部统一资源机制：
 * 挂载即请求；getQuery 的 deep 变化自动重取；防抖、竞态后到为准、stale 保留旧数据。
 * 所有 fetch 型组件共用此钩子，开发者只绑定 fetch 方法即可。
 */
export function useFetchResource<D>(
  source: MaybeRefOrGetter<FetchLike<unknown> | undefined>,
  options: UseFetchResourceOptions<D>,
): FetchResource<D> {
  const { getQuery, initialData, mapData, debounce = 0, merge } = options;

  const hasSource = ref(false);
  const total = ref(0);
  const lastData = ref(initialData) as Ref<D>;

  const controllerRef = shallowRef<FetchController | undefined>(undefined);
  let internalController: FetchController | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const map = (normalized: NormalizedFetch<unknown> | undefined): D => {
    if (!normalized) return initialData;
    return mapData ? mapData(normalized) : (normalized.data as D);
  };

  /** 最近一次命令式查询覆盖（懒加载等），retry 时保留 */
  let lastOverride: Partial<FetchQuery> | undefined;

  const execute = async (override?: Partial<FetchQuery>) => {
    const controller = controllerRef.value;
    if (!controller) return;
    if (override !== undefined) lastOverride = override;
    const query: FetchQuery = { ...getQuery(), ...lastOverride };
    // 累积模式下分页回到第 1 页（筛选/搜索/页大小变化）时丢弃累积数据；
    // 无分页片段的懒加载查询不重置，交由 merge 把子级挂回已有数据
    if (merge && query.pagination && query.pagination.currentPage <= 1) {
      lastData.value = initialData;
    }
    const result = await controller.run(query);
    if (!result || !hasSource.value) return;
    const next = map(result);
    lastData.value = merge ? merge(lastData.value, next, query) : next;
    if (result.total !== undefined) total.value = result.total;
  };

  const state = computed<AsyncStateLike<D> | undefined>(() => {
    const current = controllerRef.value?.state.value;
    if (!current || !controllerRef.value) return undefined;
    return {
      status: current.status,
      data: current.status === 'success' ? lastData.value : map(current.data),
      error: current.error,
      isStale: current.isStale,
      retry: () => void execute(),
    };
  });

  const schedule = (immediateRun: boolean, override?: Partial<FetchQuery>) => {
    if (!controllerRef.value) return;
    if (timer) clearTimeout(timer);
    if (!immediateRun && debounce > 0) {
      timer = setTimeout(() => void execute(override), debounce);
    } else {
      void execute(override);
    }
  };

  // 查询监听器在 setup 同步阶段注册（归属组件作用域，随卸载自动停止），
  // 但用 queryReady 门控：首次同步求值不触碰 getQuery——它可能引用钩子之后
  // 才初始化的状态（如选择器内部 keyword），同步求值会触发 TDZ。
  // 初始绑定（微任务，setup 已完成）后置 ready，watcher 重新求值完成依赖收集，
  // 并跳过这一次回调（初始请求由绑定流程自行发起）。
  const queryReady = ref(false);
  let queryWatcherPrimed = false;
  watch(
    () => (queryReady.value ? getQuery() : null),
    () => {
      if (!queryWatcherPrimed) {
        queryWatcherPrimed = true;
        return;
      }
      lastOverride = undefined;
      schedule(false);
    },
    { deep: true, flush: 'post' },
  );

  let disposed = false;

  function bind(raw: unknown) {
    if (disposed) return;
    internalController?.abort();
    internalController = undefined;
    if (!raw) {
      controllerRef.value = undefined;
      hasSource.value = false;
      total.value = 0;
      lastData.value = initialData;
      lastOverride = undefined;
      return;
    }
    if (isUseFetchReturn(raw)) {
      controllerRef.value = raw[FETCH_RESOURCE];
    } else {
      internalController = createFetchController(raw as Fetch<unknown>);
      controllerRef.value = internalController;
    }
    hasSource.value = true;
    total.value = 0;
    lastData.value = initialData;
    lastOverride = undefined;
    queryReady.value = true;
    schedule(true);
  }

  // 源绑定：useFetch 返回对象复用其控制器；裸函数则创建内部控制器。
  // 非 immediate——初始绑定延迟到微任务，确保 setup 后续声明的状态已初始化。
  watch(() => toValue(source), bind, { flush: 'post' });
  queueMicrotask(() => bind(toValue(source)));

  onScopeDispose(() => {
    disposed = true;
    if (timer) clearTimeout(timer);
    internalController?.abort();
  });

  return {
    enabled: hasSource,
    state,
    loading: computed(() => controllerRef.value?.loading.value ?? false),
    error: computed(() => controllerRef.value?.error.value),
    total,
    refresh: async (override?: Partial<FetchQuery>) => {
      await execute(override);
    },
  };
}
