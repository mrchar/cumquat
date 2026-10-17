import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTimeoutFn } from '../../index';
import { withScope } from '../helpers';

describe('useTimeoutFn', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('到时执行一次', () => {
    const cb = vi.fn();
    const ctx = withScope(() => useTimeoutFn(cb, 100));
    expect(ctx.isPending.value).toBe(true);
    vi.advanceTimersByTime(99);
    expect(cb).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(ctx.isPending.value).toBe(false);
  });

  it('stop 取消执行，start 可重启', () => {
    const cb = vi.fn();
    const ctx = withScope(() => useTimeoutFn(cb, 100));
    ctx.stop();
    vi.advanceTimersByTime(200);
    expect(cb).not.toHaveBeenCalled();
    ctx.start(50);
    vi.advanceTimersByTime(50);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('作用域销毁自动清理', () => {
    const cb = vi.fn();
    const ctx = withScope(() => useTimeoutFn(cb, 100));
    ctx.$stop();
    vi.advanceTimersByTime(200);
    expect(cb).not.toHaveBeenCalled();
  });
});
