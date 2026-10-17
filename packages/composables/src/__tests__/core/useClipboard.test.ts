import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useClipboard } from '../../index';
import { withScope } from '../helpers';

describe('useClipboard', () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    // jsdom 未实现 navigator.clipboard，注入可替换的桩对象
    writeText = vi.fn();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    // @ts-expect-error 清理 jsdom 中注入的 execCommand 桩
    delete document.execCommand;
  });

  it('复制成功后短暂置为 copied', async () => {
    writeText.mockResolvedValue(undefined);
    const ctx = withScope(() => useClipboard({ copiedDuration: 100 }));
    const ok = await ctx.copy('hello');
    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
    expect(ctx.copied.value).toBe(true);
    vi.advanceTimersByTime(120);
    expect(ctx.copied.value).toBe(false);
  });

  it('Clipboard API 失败时降级 execCommand', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    const exec = vi.fn().mockReturnValue(true);
    document.execCommand = exec;
    const ctx = withScope(() => useClipboard());
    const ok = await ctx.copy('fallback');
    expect(ok).toBe(true);
    expect(exec).toHaveBeenCalledWith('copy');
  });

  it('全部手段失败时返回 false 并记录错误', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    document.execCommand = vi.fn().mockReturnValue(false);
    const ctx = withScope(() => useClipboard());
    const ok = await ctx.copy('x');
    expect(ok).toBe(false);
    expect(ctx.error.value).toBeInstanceOf(Error);
    expect(ctx.copied.value).toBe(false);
  });
});
