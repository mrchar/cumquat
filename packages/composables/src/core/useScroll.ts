import { ref } from 'vue';
import type { Ref } from 'vue';
import { toValue, watch } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { isClient, rafThrottle, toElement, tryOnScopeDispose } from '../internal/dom';

export type ScrollDirection = 'up' | 'down' | 'left' | 'right' | 'none';

export interface UseScrollOptions {
  /** 滚动监听是否使用捕获阶段（读取内部元素滚动时常用），默认 true */
  capture?: boolean;
  /** 是否启用方向记录，默认 true */
  direction?: boolean;
  /** 节流：同一帧内只处理一次，默认 true */
  throttle?: boolean;
}

export interface ScrollPosition {
  x: Ref<number>;
  y: Ref<number>;
  directionX: Ref<ScrollDirection>;
  directionY: Ref<ScrollDirection>;
}

/**
 * 监听目标元素或窗口的滚动位置与方向，SSR 安全。
 *
 * @param target 滚动容器（window / document / 元素），可为响应式
 * @internal 消费组件：Affix、Anchor、BackTop 内联复用；宿主可独立使用
 */
export function useScroll(
  target: MaybeRefOrGetter<EventTarget | null | undefined> = () => (isClient ? window : undefined),
  options: UseScrollOptions = {},
): ScrollPosition {
  const { capture = true, direction: withDirection = true, throttle = true } = options;
  const x = ref(0);
  const y = ref(0);
  const directionX = ref<ScrollDirection>('none');
  const directionY = ref<ScrollDirection>('none');

  const readPosition = (el: EventTarget | null | undefined) => {
    if (!el) return;
    if (el === window) {
      x.value = window.scrollX;
      y.value = window.scrollY;
      return;
    }
    const node = el as Element;
    if (typeof node.scrollLeft === 'number') {
      x.value = node.scrollLeft;
      y.value = node.scrollTop;
    }
  };

  const handle = (() => {
    let prevX = 0;
    let prevY = 0;
    const update = () => {
      const el = toValue(target) ?? undefined;
      const nextX = x.value;
      const nextY = y.value;
      readPosition(el);
      if (withDirection) {
        if (x.value > prevX) directionX.value = 'right';
        else if (x.value < prevX) directionX.value = 'left';
        if (y.value > prevY) directionY.value = 'down';
        else if (y.value < prevY) directionY.value = 'up';
      }
      prevX = nextX;
      prevY = nextY;
    };
    return throttle ? rafThrottle(update) : update;
  })();

  watch(
    () => toValue(target),
    (raw) => {
      const el = raw === document ? (toElement(document.documentElement) ?? window) : raw;
      readPosition(el);
      el?.addEventListener('scroll', handle, { capture, passive: true });
    },
    { immediate: true },
  );

  tryOnScopeDispose(() => {
    const el = toValue(target);
    el?.removeEventListener('scroll', handle, { capture });
  });

  return { x, y, directionX, directionY };
}
