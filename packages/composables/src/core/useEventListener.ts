import { toValue, watch } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { isClient, tryOnScopeDispose } from '../internal/dom';

type EventMap = WindowEventMap & DocumentEventMap & HTMLElementEventMap & Record<string, Event>;

/**
 * 绑定 DOM 事件并在作用域销毁时自动卸载；目标支持响应式引用，
 * 目标变化（如 Teleport 后重挂载）时自动重新绑定。
 *
 * @param target 事件目标（元素 / window / document，可为 ref 或 getter）
 * @param event 事件名
 * @param listener 处理函数
 * @param options addEventListener 选项
 * @returns 手动解绑函数
 */
export function useEventListener<K extends keyof EventMap>(
  target: MaybeRefOrGetter<EventTarget | null | undefined>,
  event: K,
  listener: (ev: EventMap[K]) => void,
  options?: AddEventListenerOptions | boolean,
): () => void {
  let cleanup: (() => void) | undefined;

  const bind = (el: EventTarget | null | undefined) => {
    cleanup?.();
    cleanup = undefined;
    if (!isClient || !el) return;
    el.addEventListener(event, listener as EventListener, options);
    cleanup = () => el.removeEventListener(event, listener as EventListener, options);
  };

  watch(() => toValue(target), bind, { immediate: true });

  const stop = () => cleanup?.();
  tryOnScopeDispose(stop);
  return stop;
}
