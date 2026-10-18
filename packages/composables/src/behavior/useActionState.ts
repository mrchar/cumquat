import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import type { ActionLike, ActionResult } from '../types';

/** 归一 action 返回值：resolve 值导出错误（status 为 error 或携带 error）时返回失败信息，否则 null */
export function extractActionFailure(result: unknown): { error: unknown } | null {
  if (result !== null && typeof result === 'object') {
    const { status, error } = result as ActionResult;
    if (status === 'error' || error != null) {
      return { error: error ?? result };
    }
  }
  return null;
}

/** 把动作错误归一为可展示文案：优先 message，其次 error 字符串 / Error.message，最后回退文案 */
export function actionErrorText(error: unknown, fallback = '操作失败'): string {
  if (error && typeof error === 'object') {
    const candidate = error as ActionResult;
    if (typeof candidate.message === 'string' && candidate.message) return candidate.message;
    if (candidate.error != null) return actionErrorText(candidate.error, fallback);
  }
  if (typeof error === 'string' && error) return error;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

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
      const failure = extractActionFailure(result);
      if (failure) {
        error.value = failure.error;
        onError?.(failure.error);
        return result;
      }
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
