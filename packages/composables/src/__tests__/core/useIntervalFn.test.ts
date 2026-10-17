import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useIntervalFn } from '../../index';
import { withScope } from '../helpers';

describe('useIntervalFn', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('按间隔重复执行', () => {
    const cb = vi.fn();
    const ctx = withScope(() => useIntervalFn(cb, 100));
    expect(ctx.isActive.value).toBe(true);
    vi.advanceTimersByTime(350);
    expect(cb).toHaveBeenCalledTimes(3);
  });

  it('pause / resume 控制', () => {
    const cb = vi.fn();
    const ctx = withScope(() => useIntervalFn(cb, 100, { immediate: false }));
    expect(ctx.isActive.value).toBe(false);
    ctx.resume();
    vi.advanceTimersByTime(150);
    expect(cb).toHaveBeenCalledTimes(1);
    ctx.pause();
    vi.advanceTimersByTime(300);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('immediateCallback 立即执行一次', () => {
    const cb = vi.fn();
    withScope(() => useIntervalFn(cb, 100, { immediate: true, immediateCallback: true }));
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
