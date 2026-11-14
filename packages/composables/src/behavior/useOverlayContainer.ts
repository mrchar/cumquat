import { onBeforeUnmount, onMounted, ref, toValue, watch } from 'vue';
import type { MaybeRefOrGetter, Ref } from 'vue';
import { isClient } from '../internal/dom';
import type { MountTarget } from '../types';

export interface OverlayContainerOptions {
  /**
   * Teleport 目标：支持响应式值或 getter，目标变化后重新解析。
   * 不传时使用 document.body。
   */
  to?: MaybeRefOrGetter<MountTarget | undefined>;
  /** 选择器 / 元素不存在时是否回退到 body，默认 true */
  fallbackToBody?: boolean;
}

/**
 * Teleport 目标容器的 SSR 安全解析。挂载后才访问 document，
 * 选择器不存在时按策略回退到 body。
 *
 * @internal 消费组件：全部 Teleport 浮层
 */
export function useOverlayContainer(options: OverlayContainerOptions = {}): {
  container: Ref<HTMLElement | null>;
} {
  const { to, fallbackToBody = true } = options;
  const container = ref<HTMLElement | null>(null);

  const resolve = () => {
    if (!isClient) return;
    const target = toValue(to);
    if (!target) {
      container.value = document.body;
      return;
    }
    if (typeof target === 'string') {
      const found = document.querySelector<HTMLElement>(target);
      container.value = found ?? (fallbackToBody ? document.body : null);
    } else {
      container.value = target;
    }
  };

  onMounted(() => {
    resolve();
    watch(() => toValue(to), resolve);
  });

  onBeforeUnmount(() => {
    container.value = null;
  });

  return { container };
}
