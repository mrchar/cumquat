import { ref } from 'vue';
import type { Ref } from 'vue';
import type { Snapshot } from '../state';

export interface UseAsyncStateOptions<T, A extends unknown[]> {
  /** 初始 data，默认 undefined */
  initialData?: T;
  /** 是否立即以初始参数执行一次，默认 true */
  immediate?: boolean;
  /** 立即执行时的参数 */
  immediateArgs?: A;
  /** 重新拉取时保留旧数据，默认 true */
  preserveDataOnRefresh?: boolean;
  /** 成功回调 */
  onSuccess?: (data: T, ...args: A) => void;
  /** 失败回调 */
  onError?: (error: unknown, ...args: A) => void;
}

export interface UseAsyncStateReturn<T, A extends unknown[]> {
  state: Ref<Snapshot<T>>;
  /** 手动执行请求；再次执行时保留已有成功数据 */
  run: (...args: A) => Promise<T | undefined>;
  /** 以最近一次参数重试 */
  retry: () => Promise<T | undefined>;
  loading: Ref<boolean>;
  error: Ref<unknown>;
}

/**
 * 将外部异步函数包装为组合函数自有的 Snapshot：
 * 管理 idle/pending/success/error 四态与重试。
 * 函数自身不发起任何业务请求——请求函数由宿主提供。
 *
 * @param fetcher 返回 Promise 的数据获取函数
 * @internal 消费方：远程 Select/AutoComplete/Mention；Table 内联编排；宿主可独立使用
 */
export function useAsyncState<T, A extends unknown[] = []>(
  fetcher: (...args: A) => Promise<T>,
  options: UseAsyncStateOptions<T, A> = {},
): UseAsyncStateReturn<T, A> {
  const {
    initialData,
    immediate = true,
    immediateArgs,
    preserveDataOnRefresh = true,
    onSuccess,
    onError,
  } = options;

  const state = ref<Snapshot<T>>({
    status: 'idle',
    data: initialData,
  }) as Ref<Snapshot<T>>;

  const loading = ref(immediate);
  const error = ref<unknown>(undefined);
  let lastArgs: A | undefined = immediateArgs;
  let requestId = 0;

  const run = async (...args: A): Promise<T | undefined> => {
    const currentId = ++requestId;
    lastArgs = args;
    const previous = state.value;
    const hadSuccess = previous.status === 'success';
    const previousData = previous.status === 'success' ? previous.data : initialData;
    state.value = {
      status: 'pending',
      data: hadSuccess && preserveDataOnRefresh ? previousData : initialData,
      retry: () => retry(),
    };
    loading.value = true;
    error.value = undefined;

    try {
      const data = await fetcher(...args);
      if (currentId !== requestId) return undefined;
      state.value = {
        status: 'success',
        data,
        retry: () => retry(),
      };
      error.value = undefined;
      onSuccess?.(data, ...args);
      return data;
    } catch (err) {
      if (currentId !== requestId) return undefined;
      state.value = {
        status: 'error',
        data: state.value.data,
        error: err,
        retry: () => retry(),
      };
      error.value = err;
      onError?.(err, ...args);
      return undefined;
    } finally {
      if (currentId === requestId) loading.value = false;
    }
  };

  const retry = () => run(...((lastArgs ?? []) as A));

  if (!immediate) {
    state.value = {
      status: 'idle',
      data: initialData,
      retry: () => retry(),
    };
  } else {
    run(...((immediateArgs ?? []) as A));
  }

  return { state, run, retry, loading, error };
}
