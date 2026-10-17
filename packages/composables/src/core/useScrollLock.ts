import { ref } from 'vue';
import type { Ref } from 'vue';
import { isClient, tryOnScopeDispose } from '../internal/dom';

export interface ScrollLockReturn {
  isLocked: Ref<boolean>;
  lock: () => void;
  unlock: () => void;
  /** 切换锁定状态 */
  toggle: (next?: boolean) => void;
}

// 全局计数：多个浮层叠加时，只有最后一个关闭才真正恢复滚动
let lockCount = 0;
let previousOverflow = '';
let previousPaddingRight = '';

/**
 * 打开浮层时锁定背景滚动。采用引用计数，支持多浮层叠加；
 * 作用域销毁时自动释放一次锁定，SSR 安全。
 *
 * @param initial 初始是否锁定，默认 false
 * @internal 消费方：useModal 及下拉浮层
 */
export function useScrollLock(initial = false): ScrollLockReturn {
  const isLocked = ref(false);

  const lock = () => {
    if (!isClient || isLocked.value) return;
    if (lockCount === 0) {
      const body = document.body;
      previousOverflow = body.style.overflow;
      previousPaddingRight = body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - body.clientWidth;
      body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }
    lockCount += 1;
    isLocked.value = true;
  };

  const unlock = () => {
    if (!isClient || !isLocked.value) return;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    }
    isLocked.value = false;
  };

  const toggle = (next?: boolean) => {
    const shouldLock = next ?? !isLocked.value;
    if (shouldLock) lock();
    else unlock();
  };

  if (initial) lock();
  tryOnScopeDispose(unlock);

  return { isLocked, lock, unlock, toggle };
}
