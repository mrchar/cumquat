import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter, Ref } from 'vue';
import type { SubscribeHandler } from '@cumquat/core';
import { extractAsyncFailure } from '@cumquat/core';
import type { Snapshot } from '../state';

/* ------------------------------------------------------------------ */
/* useSubscribeResource：组件内部统一订阅机制                          */
/* ------------------------------------------------------------------ */

/**
 * 订阅型数据消费：挂载时调用处理方法，resolve 出数据后渲染，
 * 失败时记录错误并保留旧数据（与 fetch 失败策略一致），支持 refresh 重试。
 *
 * @internal 消费组件：Table、Statistic、Tabs、Progress、Image 等所有数据展示类组件
 *
 * 处理方法可直接传入，也可传 getter（如组件里的 `() => props.subscribe`），
 * 后者在每次执行时读取最新处理方法。
 */
export function useSubscribeResource<T>(
  handler?: MaybeRefOrGetter<SubscribeHandler<T> | undefined>,
) {
  const state = ref<Snapshot<T | undefined>>({
    status: 'idle',
    data: undefined,
  }) as Ref<Snapshot<T | undefined>>;
  const data = ref<T | undefined>(undefined) as Ref<T | undefined>;
  const loading = ref(false);
  const error = ref<unknown>(undefined);

  async function run(): Promise<void> {
    // toValue 对 getter 返回处理方法本身，对直接传入的处理方法则已执行得到结果
    const resolved = toValue(handler);
    if (!resolved) return;
    const fn = typeof resolved === 'function' ? resolved : undefined;
    loading.value = true;
    state.value = {
      status: 'pending',
      data: data.value,
      retry: run,
    };
    try {
      const result = fn ? await fn() : await resolved;
      const failure = extractAsyncFailure(result);
      if (failure) {
        error.value = failure.error;
        loading.value = false;
        state.value = {
          status: 'error',
          data: data.value,
          error: failure.error,
          retry: run,
        };
        return;
      }
      if (toValue(result?.status) === 'pending') return;
      data.value = toValue(result?.data);
      error.value = undefined;
      loading.value = false;
      state.value = {
        status: 'success',
        data: data.value,
        retry: run,
      };
    } catch (err) {
      error.value = err;
      loading.value = false;
      state.value = {
        status: 'error',
        data: data.value,
        error: err,
        retry: run,
      };
    }
  }

  // 初始调用延迟到微任务，确保 setup 后续声明的状态已初始化
  queueMicrotask(run);

  const isStale = computed(() => {
    const current = state.value;
    return current.status !== 'success' && current.data !== undefined;
  });

  return { state, data, loading, error, isStale, refresh: run };
}
