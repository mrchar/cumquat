import { ref } from 'vue';
import type { Ref } from 'vue';
import { isClient, tryOnScopeDispose } from '../internal/dom';

export interface UseIntervalFnOptions {
  /** 是否立即启动，默认 true */
  immediate?: boolean;
  /** 立即执行一次回调后再开始计时，默认 false */
  immediateCallback?: boolean;
}

export interface UseIntervalFnReturn {
  isActive: Ref<boolean>;
  pause: () => void;
  resume: () => void;
  /** 暂停后立即执行一次回调并恢复计时 */
  restart: () => void;
}

/**
 * 可暂停 / 恢复的周期定时器，作用域销毁时自动清理。
 *
 * @param cb 周期回调
 * @param interval 间隔毫秒，可随 resume 动态变更
 * @internal 消费方：Carousel 自动播放；宿主可独立使用
 */
export function useIntervalFn(
  cb: () => void,
  interval = 1000,
  options: UseIntervalFnOptions = {},
): UseIntervalFnReturn {
  const { immediate = true, immediateCallback = false } = options;
  const isActive = ref(false);
  let timer: ReturnType<typeof setInterval> | undefined;

  const pause = () => {
    if (timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
    isActive.value = false;
  };

  const resume = (nextInterval = interval) => {
    if (!isClient || timer !== undefined || nextInterval <= 0) return;
    isActive.value = true;
    if (immediateCallback) cb();
    timer = setInterval(cb, nextInterval);
  };

  const restart = () => {
    pause();
    resume();
  };

  if (immediate) resume();

  tryOnScopeDispose(pause);
  return { isActive, pause, resume, restart };
}
