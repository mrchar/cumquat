import { toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { isClient, isEventInside, toElement, tryOnScopeDispose } from '../internal/dom';
import type { MaybeElement } from '../internal/dom';

export interface UseClickOutsideOptions {
  /** 额外视为"内部"的容器（如浮层本体与触发器同时参与判定） */
  ignore?: MaybeRefOrGetter<Array<MaybeElement<Element>>>;
  /** 是否启用监听，默认 true；关闭浮层时可通过它停用 */
  enabled?: MaybeRefOrGetter<boolean>;
  /** 监听事件，pointerdown 早于 click，默认 pointerdown */
  event?: 'pointerdown' | 'click' | 'mousedown';
}

/**
 * 点击目标元素外部时触发回调。SSR 安全，作用域销毁自动解绑。
 *
 * @internal 消费方：useDismiss 及各选择器组件
 */
export function useClickOutside(
  target: MaybeElement<HTMLElement>,
  handler: (event: PointerEvent | MouseEvent) => void,
  options: UseClickOutsideOptions = {},
): void {
  if (!isClient) return;
  const { enabled = true, event = 'pointerdown' } = options;

  const listener = (ev: PointerEvent | MouseEvent) => {
    if (!toValue(enabled)) return;
    const main = toElement(target);
    if (!main) return;
    const ignoreList = toValue(options.ignore ?? []) ?? [];
    const extras = ignoreList.map((item) => toElement(item)).filter((el): el is Element => !!el);
    if (isEventInside(ev.target, main, ...extras)) return;
    handler(ev);
  };

  document.addEventListener(event, listener as EventListener, true);
  tryOnScopeDispose(() => {
    document.removeEventListener(event, listener as EventListener, true);
  });
}
