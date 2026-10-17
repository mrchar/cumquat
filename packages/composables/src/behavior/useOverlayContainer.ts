import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { Ref } from 'vue';
import { isClient } from '../internal/dom';

export interface OverlayContainerOptions {
  /**
   * Teleport 目标：
   * - 选择器字符串（'#app' / '.xxx'）
   * - 元素引用
   * - 不传时使用 document.body
   */
  to?: string | HTMLElement;
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

  onMounted(() => {
    if (!isClient) return;
    if (!to) {
      container.value = document.body;
      return;
    }
    if (typeof to === 'string') {
      const found = document.querySelector<HTMLElement>(to);
      container.value = found ?? (fallbackToBody ? document.body : null);
    } else {
      container.value = to;
    }
  });

  onBeforeUnmount(() => {
    container.value = null;
  });

  return { container };
}
