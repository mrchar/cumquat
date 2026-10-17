import { toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { useEventListener } from '../core/useEventListener';
import { isClient, isEventInside, toElement } from '../internal/dom';
import type { MaybeElement } from '../internal/dom';

export type DismissReason = 'escape-key' | 'outside-press' | 'scroll';

export interface UseDismissOptions {
  /** 是否处于打开态（仅打开时响应关闭策略） */
  isOpen: MaybeRefOrGetter<boolean>;
  /** 触发元素：点击它不判定为外部点击 */
  reference?: MaybeElement<HTMLElement>;
  /** 浮层本体 */
  floating?: MaybeElement<HTMLElement>;
  /** 触发关闭回调 */
  onDismiss: (reason: DismissReason) => void;
  /** ESC 关闭，默认 true */
  escapeKey?: boolean;
  /** 外部点击关闭，默认 true */
  outsidePress?: boolean;
  /** 外部点击是否使用鼠标按下（pointerdown），默认 true */
  outsidePressEvent?: 'pointerdown' | 'click' | 'mousedown';
  /** 滚动关闭，默认 false（下拉选择类浮层可开启） */
  scroll?: boolean;
  /** 是否启用，默认 true */
  enabled?: MaybeRefOrGetter<boolean>;
}

/**
 * ESC、外部点击、滚动失焦的统一关闭编排。仅在浮层打开时生效，
 * 监听器随作用域自动清理。
 *
 * @internal 消费组件：全部浮层（经 useModal / usePopoverModel 或直接使用）
 */
export function useDismiss(options: UseDismissOptions): void {
  const {
    isOpen,
    reference,
    floating,
    onDismiss,
    escapeKey = true,
    outsidePress = true,
    outsidePressEvent = 'pointerdown',
    scroll = false,
    enabled = true,
  } = options;

  const active = () => isClient && toValue(isOpen) && toValue(enabled);

  useEventListener(
    isClient ? document : null,
    'keydown',
    (event) => {
      if (!active() || !escapeKey || event.key !== 'Escape') return;
      event.stopPropagation();
      onDismiss('escape-key');
    },
    true,
  );

  useEventListener(
    isClient ? document : null,
    outsidePressEvent,
    (event) => {
      if (!active() || !outsidePress) return;
      if (isEventInside(event.target, toElement(reference ?? null), toElement(floating ?? null))) {
        return;
      }
      onDismiss('outside-press');
    },
    true,
  );

  useEventListener(
    isClient ? window : null,
    'scroll',
    () => {
      if (!active() || !scroll) return;
      onDismiss('scroll');
    },
    true,
  );
}
