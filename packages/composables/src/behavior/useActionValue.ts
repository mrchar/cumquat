import { ref } from 'vue';
import type { Ref } from 'vue';
import { extractActionFailure } from './useActionState';

export interface UseActionValueReturn {
  /** 动作执行中，期间组件应禁用新的交互 */
  pending: Ref<boolean>;
  /** 最近一次失败的错误信息 */
  error: Ref<unknown>;
  /**
   * 乐观提交：组件先应用新值，再调用 commit 执行动作。
   * 失败（reject 或返回值导出错误）时记录 error、执行 revert 回退并返回 false；
   * 无 execute 时视为无动作，直接成功。同一时刻重复调用会被忽略。
   */
  commit: (options: { execute?: () => unknown; revert?: () => void }) => Promise<boolean>;
}

/**
 * 切换型组件的 action 消费：值变更先乐观应用，动作失败自动回退并记录错误。
 *
 * @internal 消费组件：Select、DatePicker、ColorPicker、Transfer、Rate、Segmented、Tabs 等即时变更组件
 */
export function useActionValue(): UseActionValueReturn {
  const pending = ref(false);
  const error = ref<unknown>(undefined);

  const commit = async ({ execute, revert }: { execute?: () => unknown; revert?: () => void }) => {
    if (pending.value) return false;
    error.value = undefined;
    if (!execute) return true;
    pending.value = true;
    try {
      const result = await execute();
      const failure = extractActionFailure(result);
      if (failure) {
        error.value = failure.error;
        revert?.();
        return false;
      }
      return true;
    } catch (err) {
      error.value = err;
      revert?.();
      return false;
    } finally {
      pending.value = false;
    }
  };

  return { pending, error, commit };
}
