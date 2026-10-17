import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import { isClient, toElement, tryOnScopeDispose } from '../internal/dom';
import type { MaybeElement } from '../internal/dom';

export interface UseIntersectionObserverOptions {
  root?: MaybeElement<HTMLElement>;
  rootMargin?: string;
  threshold?: number | number[];
  /** 首次进入视口后即停止监听（懒加载场景），默认 false */
  once?: boolean;
}

export interface UseIntersectionObserverReturn {
  isIntersecting: Ref<boolean>;
  ratio: Ref<number>;
  stop: () => void;
}

/**
 * 监听元素进出视口状态。SSR 安全，不支持 IntersectionObserver 时按可见处理。
 *
 * @internal 消费方：useImageState 懒加载；宿主可独立使用
 */
export function useIntersectionObserver(
  target: MaybeElement<HTMLElement>,
  options: UseIntersectionObserverOptions = {},
): UseIntersectionObserverReturn {
  const isIntersecting = ref(false);
  const ratio = ref(0);
  let observer: IntersectionObserver | undefined;

  const stop = () => {
    observer?.disconnect();
    observer = undefined;
  };

  const apply = (el: HTMLElement | null) => {
    stop();
    if (!isClient || !el) return;
    if (typeof IntersectionObserver === 'undefined') {
      isIntersecting.value = true;
      return;
    }
    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        isIntersecting.value = entry.isIntersecting;
        ratio.value = entry.intersectionRatio;
        if (entry.isIntersecting && options.once) stop();
      },
      {
        root: toElement(options.root ?? null),
        rootMargin: options.rootMargin,
        threshold: options.threshold,
      },
    );
    observer.observe(el);
  };

  watch(() => toElement(target), apply, { immediate: true });
  tryOnScopeDispose(stop);

  return { isIntersecting, ratio, stop };
}
