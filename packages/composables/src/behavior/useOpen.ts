import type { Ref } from 'vue';
import { useControllableModel } from '../core/useControllableModel';
import { useTimeoutFn } from '../core/useTimeoutFn';
import type { ControlledProps } from '../types';

export interface UseOpenOptions extends ControlledProps<boolean> {
  /** 打开延迟（毫秒），默认 0 */
  openDelay?: number;
  /** 关闭延迟（毫秒），默认 0（悬停浮层常用） */
  closeDelay?: number;
  /** 开合状态变化回调 */
  onChange?: (open: boolean) => void;
}

export interface UseOpenReturn {
  isOpen: Ref<boolean>;
  open: () => void;
  close: () => void;
  toggle: (next?: boolean) => void;
}

/**
 * 开合状态机：支持受控（modelValue + update:modelValue）与非受控，
 * 可选的打开 / 关闭延迟（由 useHoverIntent 之类场景复用）。
 *
 * @internal 消费组件：Dialog/Drawer（经 useModal）、Popover、Dropdown、Select、Tooltip
 */
export function useOpen(options: UseOpenOptions = {}): UseOpenReturn {
  const { openDelay = 0, closeDelay = 0, onChange, ...controlled } = options;

  const { value } = useControllableModel<boolean>({
    modelValue: controlled.modelValue,
    defaultValue: controlled.defaultValue,
    fallback: false,
    onChange: (next) => {
      controlled['onUpdate:modelValue']?.(next);
      onChange?.(next);
    },
  });

  const isOpen = value as Ref<boolean>;

  const openTimer = useTimeoutFn(() => {
    isOpen.value = true;
  });
  const closeTimer = useTimeoutFn(() => {
    isOpen.value = false;
  });

  const open = () => {
    closeTimer.stop();
    if (openDelay > 0) openTimer.start(openDelay);
    else isOpen.value = true;
  };

  const close = () => {
    openTimer.stop();
    if (closeDelay > 0) closeTimer.start(closeDelay);
    else isOpen.value = false;
  };

  const toggle = (next?: boolean) => {
    const target = next ?? !isOpen.value;
    if (target) open();
    else close();
  };

  return { isOpen, open, close, toggle };
}
