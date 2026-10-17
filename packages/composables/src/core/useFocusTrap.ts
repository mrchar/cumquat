import { ref } from 'vue';
import type { Ref } from 'vue';
import { getFocusableList, isClient, tryOnScopeDispose } from '../internal/dom';
import type { MaybeElement } from '../internal/dom';
import { toValue } from 'vue';

export interface UseFocusTrapOptions {
  /** 初始焦点元素选择器；不传则聚焦容器内第一个可聚焦元素 */
  initialFocus?: string;
  /** 是否在激活时立即聚焦，默认 true */
  immediate?: boolean;
}

export interface UseFocusTrapReturn {
  isActive: Ref<boolean>;
  trap: () => void;
  release: () => void;
  /** 焦点移动到容器内第一个 / 最后一个可聚焦元素 */
  focusFirst: () => void;
  focusLast: () => void;
}

/**
 * 焦点陷阱：激活期间 Tab 在容器内循环，Esc 不做处理（由 useDismiss 编排）。
 *
 * @param container 陷阱容器，可为响应式引用
 * @internal 消费方：useModal
 */
export function useFocusTrap(
  container: MaybeElement<HTMLElement>,
  options: UseFocusTrapOptions = {},
): UseFocusTrapReturn {
  const { initialFocus, immediate = true } = options;
  const isActive = ref(false);

  const focusFirst = () => {
    const el = toValue(container);
    getFocusableList(el)[0]?.focus();
  };

  const focusLast = () => {
    const el = toValue(container);
    const list = getFocusableList(el);
    list[list.length - 1]?.focus();
  };

  const onKeydown = (ev: KeyboardEvent) => {
    if (ev.key !== 'Tab' || !isActive.value) return;
    const el = toValue(container);
    if (!el) return;
    const list = getFocusableList(el);
    if (list.length === 0) {
      ev.preventDefault();
      return;
    }
    const first = list[0];
    const last = list[list.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (ev.shiftKey && (active === first || !el.contains(active))) {
      ev.preventDefault();
      last.focus();
    } else if (!ev.shiftKey && active === last) {
      ev.preventDefault();
      first.focus();
    }
  };

  const trap = () => {
    if (!isClient || isActive.value) return;
    isActive.value = true;
    document.addEventListener('keydown', onKeydown, true);
    if (immediate) {
      const el = toValue(container);
      const target = initialFocus ? el?.querySelector<HTMLElement>(initialFocus) : null;
      (target ?? getFocusableList(el)[0] ?? el)?.focus();
    }
  };

  const release = () => {
    if (!isActive.value) return;
    isActive.value = false;
    document.removeEventListener('keydown', onKeydown, true);
  };

  tryOnScopeDispose(release);

  return { isActive, trap, release, focusFirst, focusLast };
}
