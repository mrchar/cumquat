import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHoverIntent } from '../../index';
import { withScope } from '../helpers';

describe('useHoverIntent', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('进入后按 showDelay 悬停，离开按 hideDelay 取消', () => {
    const ctx = withScope(() => useHoverIntent({ showDelay: 100, hideDelay: 200 }));
    ctx.onMouseEnter();
    vi.advanceTimersByTime(99);
    expect(ctx.isHovered.value).toBe(false);
    vi.advanceTimersByTime(1);
    expect(ctx.isHovered.value).toBe(true);

    ctx.onMouseLeave();
    vi.advanceTimersByTime(199);
    expect(ctx.isHovered.value).toBe(true);
    vi.advanceTimersByTime(1);
    expect(ctx.isHovered.value).toBe(false);
  });

  it('离开计时未到时重新进入，保持打开', () => {
    const ctx = withScope(() => useHoverIntent({ showDelay: 0, hideDelay: 200 }));
    ctx.setOpen(true);
    ctx.onMouseLeave();
    vi.advanceTimersByTime(100);
    ctx.onMouseEnter();
    vi.advanceTimersByTime(300);
    expect(ctx.isHovered.value).toBe(true);
  });

  it('进入后快速离开不触发打开', () => {
    const ctx = withScope(() => useHoverIntent({ showDelay: 100, hideDelay: 100 }));
    ctx.onMouseEnter();
    vi.advanceTimersByTime(50);
    ctx.onMouseLeave();
    vi.advanceTimersByTime(300);
    expect(ctx.isHovered.value).toBe(false);
  });

  it('disabled 时事件无效，setOpen 可立即开合', () => {
    const ctx = withScope(() => useHoverIntent({ disabled: true }));
    ctx.onMouseEnter();
    vi.advanceTimersByTime(500);
    expect(ctx.isHovered.value).toBe(false);
    ctx.setOpen(true);
    expect(ctx.isHovered.value).toBe(true);
  });
});
