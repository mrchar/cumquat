import { isClient, toElement } from '../internal/dom';
import type { MaybeElement } from '../internal/dom';

export interface ScrollIntoViewOptions {
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
  inline?: ScrollLogicalPosition;
}

/**
 * 将目标元素平滑滚动至可视区。返回命令式方法，供 Tour/Anchor/Tabs 复用。
 *
 * @param defaultTarget 默认滚动目标（调用时可覆盖）
 */
export function useScrollIntoView(
  defaultTarget?: MaybeElement<HTMLElement>,
): (target?: MaybeElement<HTMLElement>, options?: ScrollIntoViewOptions) => void {
  return (target = defaultTarget, options: ScrollIntoViewOptions = {}) => {
    if (!isClient) return;
    const el = toElement(target ?? null);
    el?.scrollIntoView({
      behavior: options.behavior ?? 'smooth',
      block: options.block ?? 'start',
      inline: options.inline ?? 'nearest',
    });
  };
}
