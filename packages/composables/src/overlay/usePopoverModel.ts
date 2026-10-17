import { computed, watch } from 'vue';
import type { Ref } from 'vue';
import { useHoverIntent } from '../behavior/useHoverIntent';
import { useOpen } from '../behavior/useOpen';
import { useTransitionVisible } from '../core/useTransitionVisible';
import type { ControlledProps } from '../types';

export type PopoverTrigger = 'click' | 'hover' | 'focus' | 'manual';

export interface UsePopoverModelOptions extends ControlledProps<boolean> {
  trigger?: PopoverTrigger;
  openDelay?: number;
  closeDelay?: number;
}

export interface PopoverTriggerProps {
  onClick?: () => void;
  onMouseenter?: () => void;
  onMouseleave?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export interface UsePopoverModelReturn {
  isOpen: Ref<boolean>;
  open: () => void;
  close: () => void;
  toggle: (next?: boolean) => void;
  rendered: Ref<boolean>;
  visible: Ref<boolean>;
  onAfterLeave: () => void;
  /** 直接绑定到触发元素的事件集合 */
  triggerProps: Ref<PopoverTriggerProps>;
  /** hover 模式下需同时绑定到浮层本体，防止触发器与浮层间移动时关闭 */
  floatingHoverProps: Ref<PopoverTriggerProps>;
}

/**
 * 浮层触发模型：click / hover / focus / manual 四种触发方式与
 * 延迟开合、进出场过渡的组合编排。定位由 useFloating 独立承担。
 *
 * @internal 消费组件：Popover、Dropdown、Tooltip
 */
export function usePopoverModel(options: UsePopoverModelOptions = {}): UsePopoverModelReturn {
  const { trigger = 'click', openDelay = 100, closeDelay = 100, ...controlled } = options;

  const hover = useHoverIntent({
    showDelay: openDelay,
    hideDelay: closeDelay,
    disabled: trigger !== 'hover',
  });

  const { isOpen, open, close, toggle } = useOpen({
    ...controlled,
    // 开合延迟只用于 hover（由 useHoverIntent 承担），click/focus/manual 即时响应
    openDelay: 0,
    closeDelay: 0,
  });

  // hover 模式由悬停意图驱动开合
  if (trigger === 'hover') {
    watch(hover.isHovered, (hovered) => toggle(hovered));
  }

  const { rendered, visible, onAfterLeave } = useTransitionVisible(isOpen);

  const triggerProps = computed<PopoverTriggerProps>(() => {
    const props: PopoverTriggerProps = {};
    if (trigger === 'click') {
      props.onClick = () => toggle();
    } else if (trigger === 'hover') {
      props.onMouseenter = hover.onMouseEnter;
      props.onMouseleave = hover.onMouseLeave;
    } else if (trigger === 'focus') {
      props.onFocus = open;
      props.onBlur = close;
    }
    return props;
  });

  const floatingHoverProps = computed<PopoverTriggerProps>(() =>
    trigger === 'hover'
      ? {
          onMouseenter: hover.onMouseEnter,
          onMouseleave: hover.onMouseLeave,
        }
      : {},
  );

  return {
    isOpen,
    open,
    close,
    toggle,
    rendered,
    visible,
    onAfterLeave,
    triggerProps,
    floatingHoverProps,
  };
}
