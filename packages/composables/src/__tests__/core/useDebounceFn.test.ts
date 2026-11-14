import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebounceFn } from '../../index';
import { withScope } from '../helpers';

describe('useDebounceFn', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('连续调用只执行最后一次', () => {
    const fn = vi.fn();
    const ctx = withScope(() => useDebounceFn(fn, 100));
    ctx.run('a');
    vi.advanceTimersByTime(50);
    ctx.run('b');
    expect(ctx.isPending.value).toBe(true);
    vi.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('b');
    expect(ctx.isPending.value).toBe(false);
  });

  it('cancel 取消等待中的调用', () => {
    const fn = vi.fn();
    const ctx = withScope(() => useDebounceFn(fn, 100));
    ctx.run('a');
    ctx.cancel();
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
    expect(ctx.isPending.value).toBe(false);
  });

  it('flush 立即执行等待中的调用', () => {
    const fn = vi.fn();
    const ctx = withScope(() => useDebounceFn(fn, 100));
    ctx.run('a');
    ctx.flush();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('作用域销毁自动清理', () => {
    const fn = vi.fn();
    const ctx = withScope(() => useDebounceFn(fn, 100));
    ctx.run('a');
    ctx.$stop();
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
  });
});
