import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useDraggable } from '../../index';
import { withScope } from '../helpers';

function pointer(type: string, clientX: number, clientY: number): PointerEvent {
  const event = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX,
    clientY,
    button: 0,
  });
  return event;
}

describe('useDraggable', () => {
  it('沿 x 轴拖拽计算归一化位置并钳制边界', () => {
    const el = document.createElement('div');
    el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 20 }) as DOMRect;
    el.setPointerCapture = vi.fn();
    el.releasePointerCapture = vi.fn();

    const onMove = vi.fn();
    const ctx = withScope(() => useDraggable(ref(el), { axis: 'x', onMove }));
    el.dispatchEvent(pointer('pointerdown', 20, 10));
    expect(ctx.dragging.value).toBe(true);
    document.dispatchEvent(pointer('pointermove', 50, 999));
    expect(ctx.ratioX.value).toBeCloseTo(0.5, 5);
    expect(ctx.ratioY.value).toBe(0);
    document.dispatchEvent(pointer('pointerup', 50, 999));
    expect(ctx.dragging.value).toBe(false);
    expect(onMove).toHaveBeenCalled();
  });

  it('超出盒外的位置被钳制在 0~1', () => {
    const el = document.createElement('div');
    el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect;
    el.setPointerCapture = vi.fn();
    el.releasePointerCapture = vi.fn();
    const ctx = withScope(() => useDraggable(ref(el)));
    el.dispatchEvent(pointer('pointerdown', 150, -10));
    expect(ctx.ratioX.value).toBe(1);
    expect(ctx.ratioY.value).toBe(0);
  });

  it('disabled 时不响应拖拽', () => {
    const el = document.createElement('div');
    el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect;
    const ctx = withScope(() => useDraggable(ref(el), { disabled: ref(true) }));
    el.dispatchEvent(pointer('pointerdown', 50, 50));
    expect(ctx.dragging.value).toBe(false);
  });

  it('moveToRatio 命令式定位', () => {
    const el = document.createElement('div');
    el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect;
    const ctx = withScope(() => useDraggable(ref(el), { axis: 'x' }));
    ctx.moveToRatio(0.3, 0.9);
    expect(ctx.ratioX.value).toBeCloseTo(0.3);
    expect(ctx.ratioY.value).toBe(0);
  });
});
