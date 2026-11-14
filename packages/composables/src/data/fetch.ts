import { computed, onScopeDispose, ref, shallowRef, toValue, watch } from 'vue';
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue';
import type {
  FetchData,
  FetchHandler,
  FetchResponsePagination,
  FetchQuery,
  FetchResult,
  ResolvedFetchQuery,
} from '@cumquat/core';
import { normalizeFetchResult, resolveFetchQuery } from '@cumquat/core';
import type { Snapshot } from '../state';
import { useDebounceFn } from '../core/useDebounceFn';

/* ------------------------------------------------------------------ */
/* useFetchResource：组件内部统一资源机制                              */
/* ------------------------------------------------------------------ */

export interface UseFetchResourceOptions<D> {
  /** 响应式查询来源：deep 监听，变化即按防抖策略重新执行 */
  getQuery: () => FetchQuery;
  /** 占位数据（首次 pending 时渲染） */
  initialData: D;
  /**
   * 结果合并。
   * - 累积模式（虚拟列表触底加载）：与上一页数据拼接；
   * - 懒加载模式（树/级联）：依据 query.filters.parentKey 将子级挂到已有树。
   *
   * 第三个参数为本次实际查询。分页查询回到第 1 页（筛选/搜索变化）时
   * 钩子会先把数据重置为 initialData；无分页的懒加载查询不重置。
   */
  merge?: (previous: D, next: D, query: ResolvedFetchQuery) => D;
  /** 查询变化防抖（毫秒），默认 0 立即执行；挂载首次请求始终立即发起 */
  debounce?: number;
}

export interface FetchResource<D> {
  /** 是否存在可用的 fetch 源（决定远程/本地分支） */
  enabled: Ref<boolean>;
  /** 异步状态；无 fetch 源时为 undefined，组件回退本地数据 */
  state: ComputedRef<Snapshot<D> | undefined>;
  loading: ComputedRef<boolean>;
  error: ComputedRef<unknown>;
  /** 分页总数（非分页为数据条数，无 fetch 源时为 0）；从 data 的分页形态中推导 */
  total: Ref<number>;
  /** 最近一次成功响应的分页值（页码 / 页大小 / 总数）；非分页查询为 undefined */
  pageInfo: Ref<FetchResponsePagination | undefined>;
  /** 手动重取；override 与当前查询浅合并，用于懒加载等命令式场景 */
  refresh: (override?: Partial<FetchQuery>) => Promise<void>;
}

/**
 * 组件内部统一资源机制：
 * 挂载即绑定资源对象并执行；getQuery 的 deep 变化自动重取；防抖、累积合并。
 * 钩子只负责编排——何时调用 execute、何时调用 abort；状态机、竞态与取消
 * 的具体实现完全由 FetchResult 资源对象承担，组件库不创建 AbortController。
 * 所有 fetch 型组件共用此钩子，开发者只提供符合协议的 fetch 工厂。
 */
export function useFetchResource<D>(
  source: MaybeRefOrGetter<FetchHandler<unknown> | undefined>,
  options: UseFetchResourceOptions<D>,
): FetchResource<D> {
  const { getQuery, initialData, debounce = 0, merge } = options;

  const hasSource = ref(false);
  const total = ref(0);
  const pageInfo = ref<FetchResponsePagination | undefined>(undefined);
  const lastData = ref(initialData) as Ref<D>;

  const handleRef = shallowRef<FetchResult<unknown> | undefined>(undefined);
  let bindVersion = 0;

  /** 最近一次命令式查询覆盖（懒加载等），retry 时保留 */
  let lastOverride: Partial<FetchQuery> | undefined;

  /** 查询指纹：固定键序序列化，用于识别「响应回写分页值」引起的同参重放 */
  const queryKey = (query: ResolvedFetchQuery): string =>
    JSON.stringify([
      query.page,
      query.size,
      query.keyword,
      query.sorter?.key,
      query.sorter?.order,
      query.filters,
    ]);

  let lastExecutedKey: string | undefined;

  const execute = async (override?: Partial<FetchQuery>) => {
    const handle = handleRef.value;
    if (!handle || !hasSource.value) return;
    if (override !== undefined) lastOverride = override;
    // 查询源与命令式覆盖都可能含 Ref / reactive 片段：先解包为纯值快照再执行
    const query: ResolvedFetchQuery = {
      ...resolveFetchQuery(getQuery()),
      ...(lastOverride ? resolveFetchQuery(lastOverride) : {}),
    };
    lastExecutedKey = queryKey(query);
    // 累积模式下分页回到第 1 页（筛选/搜索/页大小变化）时丢弃累积数据；
    // 无分页参数的懒加载查询不重置，交由 merge 把子级挂回已有数据
    if (merge && query.page !== undefined && query.page <= 1) {
      lastData.value = initialData;
    }
    await handle.execute(query);
    // await 期间源可能已切换：只接受当前绑定对象的产出
    if (handleRef.value !== handle || !hasSource.value) return;
    // 失败时保留旧数据与旧分页信息，状态由 state 的 error 分支反映
    if (toValue(handle.status) === 'error') return;
    const normalized = normalizeFetchResult(
      (toValue(handle.data) ?? initialData) as FetchData<unknown>,
    );
    const next = normalized.data as D;
    lastData.value = merge ? merge(lastData.value, next, query) : next;
    if (normalized.total !== undefined) total.value = normalized.total;
    // 响应分页值优先于请求参数：组件据此展示真实页码与页大小
    if (query.page !== undefined && query.size !== undefined) {
      pageInfo.value = {
        page: normalized.page ?? query.page,
        size: normalized.size ?? query.size,
        total: normalized.total ?? total.value,
      };
    } else {
      pageInfo.value = undefined;
    }
  };

  const state = computed<Snapshot<D> | undefined>(() => {
    const handle = handleRef.value;
    if (!handle) return undefined;
    const retry = () => void execute();
    switch (toValue(handle.status)) {
      case 'idle':
        return { status: 'idle', retry };
      case 'pending':
        return { status: 'pending', data: lastData.value, retry };
      case 'success':
        return { status: 'success', data: lastData.value, retry };
      case 'error':
        return {
          status: 'error',
          data: lastData.value,
          error: toValue(handle.error),
          retry,
        };
      default:
        return undefined;
    }
  });

  /** 查询变化防抖：只在 debounce > 0 时使用 */
  const debouncedExecute = useDebounceFn((override?: Partial<FetchQuery>) => {
    void execute(override);
  }, debounce);

  const schedule = (immediateRun: boolean, override?: Partial<FetchQuery>) => {
    if (!handleRef.value) return;
    if (!immediateRun && debounce > 0) {
      debouncedExecute.run(override);
    } else {
      void execute(override);
    }
  };

  // 查询监听器在 setup 同步阶段注册（归属组件作用域，随卸载自动停止），
  // 但用 queryReady 门控：首次同步求值不触碰 getQuery——它可能引用钩子之后
  // 才初始化的状态（如选择器内部 keyword），同步求值会触发 TDZ。
  // 初始绑定（微任务，setup 已完成）后置 ready，watcher 重新求值完成依赖收集，
  // 并跳过这一次回调（初始执行由绑定流程自行发起）。
  const queryReady = ref(false);
  let queryWatcherPrimed = false;
  watch(
    () => (queryReady.value ? getQuery() : null),
    (next) => {
      if (!queryWatcherPrimed) {
        queryWatcherPrimed = true;
        return;
      }
      // 组件把响应分页值回写进查询源时会再次触发监听；
      // 与上次执行完全同参则跳过，避免自激重取。
      if (next && lastExecutedKey !== undefined) {
        if (queryKey(resolveFetchQuery(next)) === lastExecutedKey) return;
      }
      lastOverride = undefined;
      schedule(false);
    },
    { deep: true, flush: 'post' },
  );

  let disposed = false;

  async function bind(raw: FetchHandler<unknown> | undefined) {
    if (disposed) return;
    const version = ++bindVersion;
    handleRef.value?.abort();
    handleRef.value = undefined;
    debouncedExecute.cancel();
    if (!raw) {
      hasSource.value = false;
      total.value = 0;
      pageInfo.value = undefined;
      lastData.value = initialData;
      lastOverride = undefined;
      lastExecutedKey = undefined;
      return;
    }
    // 工厂允许异步构建（如资源池先加载文档）；过期绑定在落库前作废
    const handle = await raw(getQuery());
    if (disposed || version !== bindVersion) {
      handle.abort();
      return;
    }
    handleRef.value = handle;
    hasSource.value = true;
    total.value = 0;
    pageInfo.value = undefined;
    lastData.value = initialData;
    lastOverride = undefined;
    lastExecutedKey = undefined;
    queryReady.value = true;
    schedule(true);
  }

  // 源绑定：每个 FetchHandler 工厂在组件内部创建独立资源对象。
  // 非 immediate——初始绑定延迟到微任务，确保 setup 后续声明的状态已初始化。
  watch(() => toValue(source), bind, { flush: 'post' });
  queueMicrotask(() => void bind(toValue(source)));

  onScopeDispose(() => {
    disposed = true;
    debouncedExecute.cancel();
    handleRef.value?.abort();
  });

  return {
    enabled: hasSource,
    state,
    loading: computed(() => toValue(handleRef.value?.status) === 'pending'),
    error: computed(() => toValue(handleRef.value?.error)),
    total,
    pageInfo,
    refresh: async (override?: Partial<FetchQuery>) => {
      await execute(override);
    },
  };
}
