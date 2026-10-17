import { ref } from 'vue';
import type { Ref } from 'vue';
import { useTimeoutFn } from '../core/useTimeoutFn';

export interface HoverIntentOptions {
  /** 打开延迟，默认 100ms（防止快速划过敏触发） */
  showDelay?: number;
  /** 关闭延迟，默认 100ms（鼠标在触发器与浮层间移动时不闪烁） */
  hideDelay?: number;
  /** 是否禁用（触屏设备可关闭） */
  disabled?: boolean;
}

export interface HoverIntentReturn {
  isHovered: Ref<boolean>;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  /** 立即开合，跳过延迟 */
  setOpen: (open: boolean) => void;
}

/**
 * 悬停触发的开合延迟控制，防止抖动与误触。
 * 触发器与浮层应同时绑定返回的 enter/leave 处理器。
 *
 * @internal 消费组件：Tooltip、Dropdown(hover)、Menu
 */
export function useHoverIntent(options: HoverIntentOptions = {}): HoverIntentReturn {
  const { showDelay = 100, hideDelay = 100, disabled = false } = options;
  const isHovered = ref(false);

  const showTimer = useTimeoutFn(() => {
    isHovered.value = true;
  });
  const hideTimer = useTimeoutFn(() => {
    isHovered.value = false;
  });

  const onMouseEnter = () => {
    if (disabled) return;
    hideTimer.stop();
    if (showDelay <= 0) {
      isHovered.value = true;
    } else {
      showTimer.start(showDelay);
    }
  };

  const onMouseLeave = () => {
    if (disabled) return;
    showTimer.stop();
    if (hideDelay <= 0) {
      isHovered.value = false;
    } else {
      hideTimer.start(hideDelay);
    }
  };

  const setOpen = (open: boolean) => {
    showTimer.stop();
    hideTimer.stop();
    isHovered.value = open;
  };

  return { isHovered, onMouseEnter, onMouseLeave, setOpen };
}
