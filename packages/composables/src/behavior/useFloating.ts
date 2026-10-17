import { computed, nextTick, ref, watch } from 'vue';
import type { CSSProperties, MaybeRefOrGetter, Ref } from 'vue';
import { toValue } from 'vue';
import { useEventListener } from '../core/useEventListener';
import { useResizeObserver } from '../core/useResizeObserver';
import { isClient } from '../internal/dom';
import type { Placement, Strategy } from '../types';

type Side = 'top' | 'right' | 'bottom' | 'left';
type Align = 'start' | 'end' | 'middle';

const OPPOSITE_SIDE: Record<Side, Side> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

export interface UseFloatingOptions {
  placement?: MaybeRefOrGetter<Placement>;
  strategy?: Strategy;
  /** 浮层与锚点的主间距，默认 4 */
  gap?: number;
  /** 距视口边缘的最小留白（移位与箭头钳制共用），默认 4 */
  shiftPadding?: number;
  /** 空间不足时自动翻转，默认 true */
  flip?: boolean;
  /** 超出视口时平移回可见区，默认 true */
  shift?: boolean;
  /** 箭头元素尺寸（不传则从箭头元素测量） */
  arrowSize?: number;
  /** 打开状态来源；变为 true 后立即重新定位 */
  open?: MaybeRefOrGetter<boolean>;
  /** 定位完成回调（可读取最终方位） */
  onPositioned?: (data: { placement: Placement; x: number; y: number }) => void;
}

export interface UseFloatingReturn {
  /** 绑定到锚点元素：ref="referenceRef" */
  referenceRef: Ref<HTMLElement | null>;
  /** 绑定到浮层元素 */
  floatingRef: Ref<HTMLElement | null>;
  /** 绑定到箭头元素 */
  arrowRef: Ref<HTMLElement | null>;
  /** 翻转后的实际方位 */
  placement: Ref<Placement>;
  x: Ref<number>;
  y: Ref<number>;
  arrowX: Ref<number | undefined>;
  arrowY: Ref<number | undefined>;
  /** 直接绑定到浮层的 style */
  floatingStyles: Ref<CSSProperties>;
  /** 手动重新计算定位 */
  update: () => void;
}

function splitPlacement(placement: Placement): [Side, Align] {
  const [side, align] = placement.split('-') as [Side, Align | undefined];
  return [side, align ?? 'middle'];
}

function joinPlacement(side: Side, align: Align): Placement {
  return align === 'middle' ? side : (`${side}-${align}` as Placement);
}

interface BaseCoords {
  x: number;
  y: number;
}

/** 按方位与对齐计算未修正的基准坐标 */
function computeBaseCoords(
  side: Side,
  align: Align,
  reference: DOMRect,
  floating: { width: number; height: number },
  gap: number,
): BaseCoords {
  let x = 0;
  let y = 0;
  switch (side) {
    case 'bottom':
      y = reference.bottom + gap;
      break;
    case 'top':
      y = reference.top - floating.height - gap;
      break;
    case 'right':
      x = reference.right + gap;
      break;
    case 'left':
      x = reference.left - floating.width - gap;
      break;
  }
  if (side === 'bottom' || side === 'top') {
    if (align === 'start') x = reference.left;
    else if (align === 'end') x = reference.right - floating.width;
    else x = reference.left + (reference.width - floating.width) / 2;
  } else if (align === 'start') {
    y = reference.top;
  } else if (align === 'end') {
    y = reference.bottom - floating.height;
  } else {
    y = reference.top + (reference.height - floating.height) / 2;
  }
  return { x, y };
}

/** 判定给定方位是否有足够空间（含视口留白） */
function sideHasSpace(
  side: Side,
  reference: DOMRect,
  floating: { width: number; height: number },
  gap: number,
  padding: number,
): boolean {
  switch (side) {
    case 'top':
      return reference.top - gap - floating.height >= padding;
    case 'bottom':
      return window.innerHeight - reference.bottom - gap - floating.height >= padding;
    case 'left':
      return reference.left - gap - floating.width >= padding;
    case 'right':
      return window.innerWidth - reference.right - gap - floating.width >= padding;
  }
}

/**
 * 锚点浮层定位引擎：方位、自动翻转、视口移位、间距、箭头坐标；
 * 滚动、窗口尺寸、锚点与浮层尺寸变化时自动更新。零第三方依赖。
 *
 * @internal 消费组件：Tooltip/Popover/Dropdown/Select/Cascader/DatePicker/
 * TimePicker/ColorPicker/TreeSelect/AutoComplete/Mention/Popconfirm
 */
export function useFloating(options: UseFloatingOptions = {}): UseFloatingReturn {
  const {
    placement = 'bottom',
    strategy = 'fixed',
    gap = 4,
    shiftPadding = 4,
    flip = true,
    shift = true,
    arrowSize,
    open,
    onPositioned,
  } = options;

  const referenceRef = ref<HTMLElement | null>(null);
  const floatingRef = ref<HTMLElement | null>(null);
  const arrowRef = ref<HTMLElement | null>(null);

  const currentPlacement = ref<Placement>(toValue(placement));
  const x = ref(0);
  const y = ref(0);
  const arrowX = ref<number | undefined>(undefined);
  const arrowY = ref<number | undefined>(undefined);

  const applyOffset = (coords: BaseCoords): BaseCoords => {
    if (strategy !== 'absolute') return coords;
    const offsetParent = floatingRef.value?.offsetParent;
    if (!offsetParent || offsetParent === document.body) return coords;
    const parent = offsetParent.getBoundingClientRect();
    return { x: coords.x - parent.left, y: coords.y - parent.top };
  };

  const update = () => {
    if (!isClient) return;
    const referenceEl = referenceRef.value;
    const floatingEl = floatingRef.value;
    if (!referenceEl || !floatingEl) return;

    const referenceRect = referenceEl.getBoundingClientRect();
    const floatingRect = floatingEl.getBoundingClientRect();
    const size = { width: floatingRect.width, height: floatingRect.height };
    const requested = toValue(placement);
    let [side, align] = splitPlacement(requested);

    // 1. 自动翻转：当前方位空间不足、对侧可容纳时翻转到对侧
    if (flip && !sideHasSpace(side, referenceRect, size, gap, shiftPadding)) {
      const opposite = OPPOSITE_SIDE[side];
      if (sideHasSpace(opposite, referenceRect, size, gap, shiftPadding)) {
        side = opposite;
      }
    }

    // 2. 基准坐标
    let coords = computeBaseCoords(side, align, referenceRect, size, gap);

    // 3. 视口移位：保持在可见区域内
    if (shift) {
      const minX = shiftPadding;
      const maxX = window.innerWidth - size.width - shiftPadding;
      const minY = shiftPadding;
      const maxY = window.innerHeight - size.height - shiftPadding;
      coords = {
        x: Math.min(Math.max(coords.x, minX), Math.max(minX, maxX)),
        y: Math.min(Math.max(coords.y, minY), Math.max(minY, maxY)),
      };
    }

    coords = applyOffset(coords);
    x.value = coords.x;
    y.value = coords.y;
    currentPlacement.value = joinPlacement(side, align);

    // 4. 箭头坐标：相对浮层的中心对齐位置，并钳制在浮层内
    const arrowEl = arrowRef.value;
    if (arrowEl) {
      const arrow = arrowSize ?? arrowEl.offsetWidth ?? 0;
      const referenceCenterX = (referenceRect.left + referenceRect.right) / 2 - coords.x;
      const referenceCenterY = (referenceRect.top + referenceRect.bottom) / 2 - coords.y;
      const min = shiftPadding;
      const maxX = Math.max(min, size.width - arrow - shiftPadding);
      const maxY = Math.max(min, size.height - arrow - shiftPadding);
      if (side === 'top' || side === 'bottom') {
        arrowX.value = Math.min(Math.max(referenceCenterX - arrow / 2, min), maxX);
        arrowY.value = undefined;
      } else {
        arrowY.value = Math.min(Math.max(referenceCenterY - arrow / 2, min), maxY);
        arrowX.value = undefined;
      }
    }

    onPositioned?.({ placement: currentPlacement.value, x: coords.x, y: coords.y });
  };

  const floatingStyles = computed<CSSProperties>(() => ({
    position: strategy,
    left: 0,
    top: 0,
    transform: `translate(${Math.round(x.value)}px, ${Math.round(y.value)}px)`,
  }));

  // 尺寸变化与窗口变化
  useResizeObserver(referenceRef);
  useResizeObserver(floatingRef);
  useEventListener(isClient ? window : null, 'resize', update);
  useEventListener(isClient ? window : null, 'scroll', update, {
    capture: true,
    passive: true,
  });

  watch(
    () => [referenceRef.value, floatingRef.value, toValue(placement)],
    () => nextTick(update),
    { immediate: true, flush: 'post' },
  );

  if (open !== undefined) {
    watch(
      () => toValue(open),
      (isOpen) => {
        if (isOpen) nextTick(update);
      },
    );
  }

  // 内容尺寸变化后自动重定位
  watch(
    () => [floatingRef.value?.offsetWidth, floatingRef.value?.offsetHeight],
    () => update(),
  );

  return {
    referenceRef,
    floatingRef,
    arrowRef,
    placement: currentPlacement,
    x,
    y,
    arrowX,
    arrowY,
    floatingStyles,
    update,
  };
}
