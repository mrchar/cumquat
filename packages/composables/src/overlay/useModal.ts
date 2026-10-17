import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useDismiss } from '../behavior/useDismiss';
import { useFocusReturn } from '../core/useFocusReturn';
import { useFocusTrap } from '../core/useFocusTrap';
import { useScrollLock } from '../core/useScrollLock';
import { useTransitionVisible } from '../core/useTransitionVisible';
import { useZIndex } from '../core/useZIndex';
import { useOpen } from '../behavior/useOpen';
import type { ControlledProps } from '../types';

export interface UseModalOptions extends ControlledProps<boolean> {
  /** 点击遮罩是否关闭，默认 true */
  maskClosable?: boolean;
  /** ESC 是否关闭，默认 true */
  escClosable?: boolean;
  /** 打开时是否锁定背景滚动，默认 true */
  lockScroll?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

export interface UseModalReturn {
  isOpen: Ref<boolean>;
  open: () => void;
  close: () => void;
  toggle: (next?: boolean) => void;
  /** 绑定到模态内容容器（焦点陷阱需要） */
  contentRef: Ref<HTMLElement | null>;
  /** 进出场过渡挂载状态 */
  rendered: Ref<boolean>;
  visible: Ref<boolean>;
  onAfterLeave: () => void;
  /** 当前层级（每次打开重新分配） */
  zIndex: Ref<number>;
  /** 遮罩点击：按 maskClosable 决定是否关闭 */
  onMaskClick: () => void;
}

/**
 * 模态开合编排：useOpen + 滚动锁定 + 焦点陷阱/归还 + ESC + 层级 +
 * 进出场过渡。Dialog/Drawer 共用，差异仅在方向与尺寸（组件内联）。
 */
export function useModal(options: UseModalOptions = {}): UseModalReturn {
  const {
    maskClosable = true,
    escClosable = true,
    lockScroll: shouldLock = true,
    onOpen,
    onClose,
    onChange,
    ...controlled
  } = options;

  const { isOpen, open, close, toggle } = useOpen({
    ...controlled,
    onChange: (next) => {
      onChange?.(next);
      if (next) onOpen?.();
      else onClose?.();
    },
  });

  const { rendered, visible, onAfterLeave } = useTransitionVisible(isOpen);
  const { lock, unlock } = useScrollLock();
  const { currentZIndex, nextZIndex } = useZIndex();
  const { record: recordFocus, restore: restoreFocus } = useFocusReturn();

  const contentRef = ref<HTMLElement | null>(null);
  const { trap, release } = useFocusTrap(contentRef, { immediate: true });

  watch(isOpen, (openState) => {
    if (openState) {
      currentZIndex.value = nextZIndex();
      recordFocus();
      if (shouldLock) lock();
      trap();
    } else {
      release();
      if (shouldLock) unlock();
      restoreFocus();
    }
  });

  useDismiss({
    isOpen,
    floating: contentRef,
    onDismiss: (reason) => {
      if (reason === 'escape-key' && escClosable) close();
    },
    outsidePress: false,
    scroll: false,
  });

  const onMaskClick = () => {
    if (maskClosable) close();
  };

  return {
    isOpen,
    open,
    close,
    toggle,
    contentRef,
    rendered,
    visible,
    onAfterLeave,
    zIndex: currentZIndex,
    onMaskClick,
  };
}
