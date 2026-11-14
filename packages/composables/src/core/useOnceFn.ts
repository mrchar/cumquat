import { ref } from 'vue';
import type { Ref } from 'vue';

export interface UseOnceFnReturn<A extends unknown[], R> {
  /** 是否已执行过 */
  called: Ref<boolean>;
  /** 首次调用执行并缓存返回值，后续调用直接返回缓存结果 */
  run: (...args: A) => R;
  /** 重置执行状态与缓存，下次调用重新执行 */
  reset: () => void;
}

/**
 * 一次性函数：只执行第一次调用并缓存返回值（返回值可以是 Promise），
 * 后续调用直接返回同一结果；需要重新执行时手动 reset。
 *
 * @param fn 实际执行的回调
 */
export function useOnceFn<A extends unknown[], R>(fn: (...args: A) => R): UseOnceFnReturn<A, R> {
  const called = ref(false);
  let result: R | undefined;

  const run = (...args: A): R => {
    // 先置位再执行：回调内重入 run 时不会重复触发
    if (called.value) return result as R;
    called.value = true;
    result = fn(...args);
    return result;
  };

  const reset = () => {
    called.value = false;
    result = undefined;
  };

  return { called, run, reset };
}
