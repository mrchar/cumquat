import { isClient, tryOnScopeDispose } from '../internal/dom';

export interface FocusReturnOptions {
  /** 作用域销毁时是否自动归还，默认 true */
  autoRestore?: boolean;
}

export interface FocusReturnReturn {
  /** 记录当前焦点元素（通常在浮层打开时调用） */
  record: () => void;
  /** 主动归还焦点 */
  restore: () => void;
}

/**
 * 浮层关闭后将焦点归还至打开前的元素。
 *
 * @internal 消费方：useModal、usePopoverModel
 */
export function useFocusReturn(options: FocusReturnOptions = {}): FocusReturnReturn {
  const { autoRestore = true } = options;
  let previous: HTMLElement | null = null;

  const record = () => {
    if (!isClient) return;
    previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  };

  const restore = () => {
    if (!isClient || !previous || !previous.isConnected) {
      previous = null;
      return;
    }
    previous.focus({ preventScroll: true });
    previous = null;
  };

  if (autoRestore) tryOnScopeDispose(restore);

  return { record, restore };
}
