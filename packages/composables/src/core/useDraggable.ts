import { ref, toValue, watch } from 'vue';
import type { MaybeRefOrGetter, Ref } from 'vue';
import { isClient, toElement, tryOnScopeDispose } from '../internal/dom';
import type { MaybeElement } from '../internal/dom';

export interface DraggablePosition {
  /** 相对元素盒左上角的像素偏移 */
  x: number;
  y: number;
  /** 0~1 之间的归一化位置（已钳制在元素盒内） */
  ratioX: number;
  ratioY: number;
}

export interface UseDraggableOptions {
  /** 拖拽手柄，默认为目标元素自身 */
  handle?: MaybeElement<HTMLElement>;
  /** 限制拖拽轴，默认 both */
  axis?: 'x' | 'y' | 'both';
  /** 拖拽边界元素，默认为目标元素自身 */
  bounds?: MaybeElement<HTMLElement>;
  /** 初始归一化位置 */
  initialRatio?: { x: number; y: number };
  /** 是否禁用 */
  disabled?: MaybeRefOrGetter<boolean>;
  onStart?: (position: DraggablePosition, event: PointerEvent) => void;
  onMove?: (position: DraggablePosition, event: PointerEvent) => void;
  onEnd?: (position: DraggablePosition, event: PointerEvent) => void;
}

export interface UseDraggableReturn {
  x: Ref<number>;
  y: Ref<number>;
  ratioX: Ref<number>;
  ratioY: Ref<number>;
  dragging: Ref<boolean>;
  /** 命令式按归一化比例写入位置（轨道点击定位时使用） */
  moveToRatio: (ratioX: number, ratioY: number) => void;
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

/**
 * 基于 Pointer Events 的拖拽原语：在目标元素盒内测量归一化位置，
 * 自动处理边界钳制、指针捕获与清理。Slider / ColorPicker 共用同一份几何计算。
 */
export function useDraggable(
  target: MaybeElement<HTMLElement>,
  options: UseDraggableOptions = {},
): UseDraggableReturn {
  const {
    handle,
    axis = 'both',
    bounds,
    initialRatio = { x: 0, y: 0 },
    disabled = false,
    onStart,
    onMove,
    onEnd,
  } = options;

  const dragging = ref(false);
  const x = ref(0);
  const y = ref(0);
  const ratioX = ref(clamp(initialRatio.x));
  const ratioY = ref(clamp(initialRatio.y));

  let rect: DOMRect | null = null;

  const currentPosition = (): DraggablePosition => ({
    x: x.value,
    y: y.value,
    ratioX: ratioX.value,
    ratioY: ratioY.value,
  });

  const readPosition = (clientX: number, clientY: number): DraggablePosition => {
    const box = rect ?? toElement(bounds ?? target)?.getBoundingClientRect() ?? null;
    if (!box || box.width === 0 || box.height === 0) {
      return currentPosition();
    }
    const nextRatioX = clamp((clientX - box.left) / box.width);
    const nextRatioY = clamp((clientY - box.top) / box.height);
    if (axis === 'x') {
      ratioX.value = nextRatioX;
    } else if (axis === 'y') {
      ratioY.value = nextRatioY;
    } else {
      ratioX.value = nextRatioX;
      ratioY.value = nextRatioY;
    }
    x.value = ratioX.value * box.width;
    y.value = ratioY.value * box.height;
    return currentPosition();
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging.value) return;
    // 独立求值：onMove 为空时可选链不会求值参数
    const position = readPosition(event.clientX, event.clientY);
    onMove?.(position, event);
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!dragging.value) return;
    dragging.value = false;
    try {
      toElement(handle ?? target)?.releasePointerCapture?.(event.pointerId);
    } catch {
      /* 忽略释放捕获异常 */
    }
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    onEnd?.(currentPosition(), event);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!isClient || toValue(disabled) || event.button !== 0) return;
    rect = toElement(bounds ?? target)?.getBoundingClientRect() ?? null;
    dragging.value = true;
    try {
      toElement(handle ?? target)?.setPointerCapture?.(event.pointerId);
    } catch {
      /* 部分环境（jsdom / 特殊指针）不支持指针捕获，忽略 */
    }
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    // 独立求值：onStart 为空时可选链不会求值参数，位置更新会被跳过
    const position = readPosition(event.clientX, event.clientY);
    onStart?.(position, event);
  };

  watch(
    () => toElement(handle ?? target),
    (el, oldEl) => {
      oldEl?.removeEventListener('pointerdown', onPointerDown);
      el?.addEventListener('pointerdown', onPointerDown);
    },
    { immediate: true },
  );

  const moveToRatio = (nextX: number, nextY: number) => {
    ratioX.value = axis === 'y' ? ratioX.value : clamp(nextX);
    ratioY.value = axis === 'x' ? ratioY.value : clamp(nextY);
    const box = toElement(bounds ?? target)?.getBoundingClientRect();
    if (box) {
      x.value = ratioX.value * box.width;
      y.value = ratioY.value * box.height;
    }
  };

  tryOnScopeDispose(() => {
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
  });

  return { x, y, ratioX, ratioY, dragging, moveToRatio };
}
