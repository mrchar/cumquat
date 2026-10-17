import { ref } from 'vue';
import type { Ref } from 'vue';
import { isClient, tryOnScopeDispose } from '../internal/dom';

export interface UseTimeoutFnReturn {
  isPending: Ref<boolean>;
  /** 重新启动计时（可覆盖延迟毫秒数） */
  start: (ms?: number) => void;
  stop: () => void;
}

/**
 * 可随时停止 / 重启的一次性定时器，作用域销毁时自动清理。
 *
 * @param cb 到时回调
 * @param ms 延迟毫秒；构造时传 null/undefined 表示不自动启动，需手动 start
 * @internal 消费方：useOpen 延迟开合、useHoverIntent、useToastQueue、useTypeahead
 */
export function useTimeoutFn(cb: () => void, ms?: number): UseTimeoutFnReturn {
  const isPending = ref(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  const stop = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    isPending.value = false;
  };

  const start = (nextMs?: number) => {
    if (!isClient) return;
    stop();
    isPending.value = true;
    timer = setTimeout(
      () => {
        timer = undefined;
        isPending.value = false;
        cb();
      },
      nextMs ?? ms ?? 0,
    );
  };

  if (ms !== undefined) start(ms);

  tryOnScopeDispose(stop);
  return { isPending, start, stop };
}
