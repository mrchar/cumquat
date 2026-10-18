import { ref } from 'vue';
import type { Ref } from 'vue';
import type { AsyncStateLike, SubscribeHandler, SubscribeResult } from '../types';
import { actionErrorText } from '../behavior/useActionState';

/* ------------------------------------------------------------------ */
/* 结果归一                                                              */
/* ------------------------------------------------------------------ */

/** 归一 subscribe 返回值：导出错误（status 为 error 或携带 error）时返回失败信息，否则 null */
export function extractSubscribeFailure<T>(
  result: SubscribeResult<T> | undefined,
): { error: unknown } | null {
  if (result === null || typeof result !== 'object') return null;
  const { status, error } = result;
  if (status === 'error' || error != null) {
    return { error: error ?? result };
  }
  return null;
}

/** 把订阅错误归一为可展示文案：优先 message，其次 error 字符串 / Error.message，最后回退 */
export { actionErrorText as subscribeErrorText };

/* ------------------------------------------------------------------ */
/* useSubscribe：订阅型数据消费                                           */
/* ------------------------------------------------------------------ */

export interface UseSubscribeReturn<T> {
  state: Ref<AsyncStateLike<T | undefined>>;
  data: Ref<T | undefined>;
  loading: Ref<boolean>;
  error: Ref<unknown>;
  isStale: Ref<boolean>;
  /** 重新执行订阅处理方法 */
  refresh: () => Promise<void>;
}

/**
 * 订阅型数据消费：挂载时调用处理方法，resolve 出数据后渲染，
 * 失败时记录错误并保留旧数据（与 fetch 失败策略一致），支持 refresh 重试。
 *
 * @internal 消费组件：Table、Statistic、Tabs、Progress、Image 等所有数据展示类组件
 */
export function useSubscribe<T>(handler?: SubscribeHandler<T>): UseSubscribeReturn<T> {
  const state = ref<AsyncStateLike<T | undefined>>({
    status: 'pending',
    data: undefined,
  }) as Ref<AsyncStateLike<T | undefined>>;
  const data = ref<T | undefined>(undefined) as Ref<T | undefined>;
  const loading = ref(false);
  const error = ref<unknown>(undefined);
  const isStale = ref(false);

  async function run(): Promise<void> {
    if (!handler) return;
    loading.value = true;
    isStale.value = !!data.value;
    state.value = {
      status: 'pending',
      data: data.value,
      isStale: isStale.value,
      retry: run,
    };
    try {
      const result = await handler();
      const failure = extractSubscribeFailure(result);
      if (failure) {
        error.value = failure.error;
        loading.value = false;
        isStale.value = !!data.value;
        state.value = {
          status: 'error',
          data: data.value,
          error: failure.error,
          isStale: isStale.value,
          retry: run,
        };
        return;
      }
      if (result?.status === 'loading') return;
      data.value = result?.data;
      error.value = undefined;
      loading.value = false;
      isStale.value = false;
      state.value = {
        status: 'success',
        data: data.value,
        isStale: false,
        retry: run,
      };
    } catch (err) {
      error.value = err;
      loading.value = false;
      isStale.value = !!data.value;
      state.value = {
        status: 'error',
        data: data.value,
        error: err,
        isStale: isStale.value,
        retry: run,
      };
    }
  }

  // 初始调用延迟到微任务，确保 setup 后续声明的状态已初始化
  queueMicrotask(run);

  return { state, data, loading, error, isStale, refresh: run };
}
