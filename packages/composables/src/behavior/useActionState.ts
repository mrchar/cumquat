import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import type { ActionLike } from '../types';

export interface UseActionStateOptions {
  /** 执行期间是否派生 disabled，默认 true */
  disableOnPending?: boolean;
  /** 外部附加禁用条件（响应式值通过 getter 传入） */
  disabled?: () => boolean;
  /** 成功回调 */
  onSuccess?: (result: unknown) => void;
  /** 失败回调（不抛出，错误归一存放在 error） */
  onError?: (error: unknown) => void;
  /** 无论成功失败的收尾回调 */
  onFinally?: () => void;
}

export interface UseActionStateReturn {
  pending: Ref<boolean>;
  disabled: Ref<boolean>;
  error: Ref<unknown>;
  /** 执行动作；同一时刻重复调用会被忽略 */
  run: (...args: unknown[]) => Promise<unknown>;
}

/**
 * 消费 ActionLike：执行期间自动派生 pending / disabled，错误归一存储。
 *
 * @internal 消费组件：Button、Switch、Popconfirm、Upload、Form 提交
 */
export function useActionState(
  action?: ActionLike,
  options: UseActionStateOptions = {},
): UseActionStateReturn {
  const { disableOnPending = true, disabled, onSuccess, onError, onFinally } = options;

  const pending = ref(false);
  const error = ref<unknown>(undefined);

  const disabledState = computed(
    () => (disableOnPending && pending.value) || disabled?.() === true,
  );

  const run = async (...args: unknown[]) => {
    if (pending.value || disabled?.()) return undefined;
    pending.value = true;
    error.value = undefined;
    try {
      const result = await action?.(...args);
      onSuccess?.(result);
      return result;
    } catch (err) {
      error.value = err;
      onError?.(err);
      return undefined;
    } finally {
      pending.value = false;
      onFinally?.();
    }
  };

  return { pending, disabled: disabledState, error, run };
}
