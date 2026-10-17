import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useOpen } from '../../index';
import { withScope } from '../helpers';

describe('useOpen', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('非受控：open/close/toggle 直接更新状态', () => {
    const ctx = withScope(() => useOpen());
    expect(ctx.isOpen.value).toBe(false);
    ctx.open();
    expect(ctx.isOpen.value).toBe(true);
    ctx.close();
    expect(ctx.isOpen.value).toBe(false);
    ctx.toggle();
    expect(ctx.isOpen.value).toBe(true);
    ctx.toggle(false);
    expect(ctx.isOpen.value).toBe(false);
  });

  it('受控：写入只发事件，内部状态跟随外部值', () => {
    const onUpdate = vi.fn();
    const ctx = withScope(() => useOpen({ modelValue: false, 'onUpdate:modelValue': onUpdate }));
    ctx.open();
    expect(onUpdate).toHaveBeenCalledWith(true);
    expect(ctx.isOpen.value).toBe(false);
  });

  it('打开 / 关闭延迟生效且可互相取消', () => {
    const ctx = withScope(() => useOpen({ openDelay: 100, closeDelay: 200 }));
    ctx.open();
    vi.advanceTimersByTime(50);
    ctx.close();
    vi.advanceTimersByTime(60);
    expect(ctx.isOpen.value).toBe(false);
    vi.advanceTimersByTime(200);
    expect(ctx.isOpen.value).toBe(false);

    ctx.open();
    vi.advanceTimersByTime(100);
    expect(ctx.isOpen.value).toBe(true);
    ctx.close();
    vi.advanceTimersByTime(100);
    expect(ctx.isOpen.value).toBe(true);
    vi.advanceTimersByTime(100);
    expect(ctx.isOpen.value).toBe(false);
  });

  it('onChange 在状态变化时触发', () => {
    const onChange = vi.fn();
    const ctx = withScope(() => useOpen({ onChange }));
    ctx.open();
    expect(onChange).toHaveBeenLastCalledWith(true);
    ctx.close();
    expect(onChange).toHaveBeenLastCalledWith(false);
  });
});
