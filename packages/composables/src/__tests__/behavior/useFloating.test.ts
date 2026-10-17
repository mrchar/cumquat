import { afterEach, describe, expect, it, vi } from 'vitest';
import { useFloating } from '../../index';
import { withScope } from '../helpers';

function mockRect(
  el: HTMLElement,
  rect: { left: number; top: number; width: number; height: number },
) {
  const { left, top, width, height } = rect;
  el.getBoundingClientRect = () =>
    ({
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;
}

describe('useFloating', () => {
  afterEach(() => vi.restoreAllMocks());

  function setup(
    refRect: { left: number; top: number; width: number; height: number },
    floatSize: { width: number; height: number },
    options: Parameters<typeof useFloating>[0] = {},
  ) {
    const reference = document.createElement('button');
    const floating = document.createElement('div');
    mockRect(reference, refRect);
    mockRect(floating, { left: 0, top: 0, ...floatSize });
    const ctx = withScope(() => useFloating(options));
    ctx.referenceRef.value = reference;
    ctx.floatingRef.value = floating;
    return { ctx, reference, floating };
  }

  it('bottom 居中定位并输出 transform 样式', () => {
    const { ctx } = setup(
      { left: 100, top: 100, width: 50, height: 20 },
      { width: 200, height: 100 },
    );
    ctx.update();
    expect(ctx.placement.value).toBe('bottom');
    expect(ctx.y.value).toBe(124);
    expect(ctx.x.value).toBe(25);
    expect(String(ctx.floatingStyles.value.transform)).toContain('translate(25px, 124px)');
  });

  it('底部空间不足时翻转到 top', () => {
    const { ctx } = setup(
      { left: 100, top: 700, width: 50, height: 20 },
      { width: 200, height: 100 },
    );
    ctx.update();
    expect(ctx.placement.value).toBe('top');
    expect(ctx.y.value).toBe(596);
  });

  it('左侧溢出视口时平移回弹', () => {
    const { ctx } = setup(
      { left: 0, top: 100, width: 50, height: 20 },
      { width: 200, height: 100 },
    );
    ctx.update();
    expect(ctx.x.value).toBe(4);
  });

  it('计算箭头水平坐标并钳制', () => {
    const { ctx, floating } = setup(
      { left: 100, top: 100, width: 50, height: 20 },
      { width: 200, height: 100 },
    );
    const arrow = document.createElement('span');
    Object.defineProperty(arrow, 'offsetWidth', { value: 10, configurable: true });
    floating.appendChild(arrow);
    ctx.arrowRef.value = arrow;
    ctx.update();
    expect(ctx.arrowX.value).toBe(95);
    expect(ctx.arrowY.value).toBeUndefined();
  });

  it('right-start 对齐与自定义 gap', () => {
    const { ctx } = setup(
      { left: 100, top: 100, width: 50, height: 60 },
      { width: 120, height: 80 },
      { placement: 'right-start', gap: 8, shift: false },
    );
    ctx.update();
    expect(ctx.placement.value).toBe('right-start');
    expect(ctx.x.value).toBe(158);
    expect(ctx.y.value).toBe(100);
  });

  it('定位完成回调拿到最终方位', () => {
    const onPositioned = vi.fn();
    const { ctx } = setup(
      { left: 100, top: 700, width: 50, height: 20 },
      { width: 200, height: 100 },
      { onPositioned },
    );
    ctx.update();
    expect(onPositioned).toHaveBeenCalledWith(expect.objectContaining({ placement: 'top' }));
  });
});
