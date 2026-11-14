import { ref } from 'vue';
import type { Ref } from 'vue';
import { isClient, tryOnScopeDispose } from '../internal/dom';

export interface UseDebounceFnReturn<A extends unknown[]> {
  /** 是否存在等待中的调用 */
  isPending: Ref<boolean>;
  /** 延迟调用；连续调用只执行最后一次 */
  run: (...args: A) => void;
  /** 取消等待中的调用 */
  cancel: () => void;
  /** 立即执行等待中的调用，不再等待剩余延迟 */
  flush: () => void;
}

/**
 * 防抖函数：连续调用只执行最后一次，作用域销毁时自动清理。
 *
 * @param fn 实际执行的回调
 * @param delay 延迟毫秒
 * @internal 消费方：useFetchResource；宿主可独立使用
 */
export function useDebounceFn<A extends unknown[]>(
  fn: (...args: A) => void,
  delay = 200,
): UseDebounceFnReturn<A> {
  const isPending = ref(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: A | undefined;

  const cancel = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    lastArgs = undefined;
    isPending.value = false;
  };

  const flush = () => {
    if (timer === undefined) return;
    clearTimeout(timer);
    timer = undefined;
    const args = lastArgs;
    lastArgs = undefined;
    isPending.value = false;
    if (args) fn(...args);
  };

  const run = (...args: A) => {
    if (!isClient) return;
    lastArgs = args;
    if (timer !== undefined) clearTimeout(timer);
    isPending.value = true;
    timer = setTimeout(() => {
      timer = undefined;
      const current = lastArgs;
      lastArgs = undefined;
      isPending.value = false;
      if (current) fn(...current);
    }, delay);
  };

  tryOnScopeDispose(cancel);

  return { isPending, run, cancel, flush };
}
