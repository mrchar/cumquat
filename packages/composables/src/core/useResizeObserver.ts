import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import { isClient, toElement, tryOnScopeDispose } from '../internal/dom';
import type { MaybeElement } from '../internal/dom';

export interface ElementSize {
  width: number;
  height: number;
}

export interface UseResizeObserverReturn {
  width: Ref<number>;
  height: Ref<number>;
  stop: () => void;
}

/**
 * 监听元素内容盒尺寸变化。SSR 环境下尺寸恒为 0 且不报错。
 *
 * @internal 消费方：useFloating；Watermark / Typography / VirtualList 组件内联复用
 */
export function useResizeObserver(target: MaybeElement<HTMLElement>): UseResizeObserverReturn {
  const width = ref(0);
  const height = ref(0);
  let observer: ResizeObserver | undefined;

  const apply = (el: HTMLElement | null) => {
    observer?.disconnect();
    observer = undefined;
    if (!isClient || !el) return;
    if (typeof ResizeObserver === 'undefined') {
      width.value = el.offsetWidth;
      height.value = el.offsetHeight;
      return;
    }
    observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) {
        width.value = rect.width;
        height.value = rect.height;
      }
    });
    observer.observe(el);
  };

  watch(() => toElement(target), apply, { immediate: true });

  const stop = () => observer?.disconnect();
  tryOnScopeDispose(stop);

  return { width, height, stop };
}
