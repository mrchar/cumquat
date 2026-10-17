import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAsyncSuggest } from '../../index';
import { withScope } from '../helpers';

describe('useAsyncSuggest', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('防抖后请求并写入建议', async () => {
    const fetch = vi.fn().mockResolvedValue(['a1', 'a2']);
    const ctx = withScope(() => useAsyncSuggest<string>({ fetch, debounce: 300 }));
    ctx.setKeyword('a');
    expect(ctx.loading.value).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(fetch).toHaveBeenCalledWith('a');
    await vi.runAllTimersAsync();
    expect(ctx.suggestions.value).toEqual(['a1', 'a2']);
    expect(ctx.status.value).toBe('success');
  });

  it('低于最小关键词长度不请求并清空', async () => {
    const fetch = vi.fn().mockResolvedValue([]);
    const ctx = withScope(() => useAsyncSuggest<string>({ fetch, minKeywordLength: 2 }));
    ctx.setKeyword('a');
    vi.advanceTimersByTime(1000);
    expect(fetch).not.toHaveBeenCalled();
    expect(ctx.suggestions.value).toEqual([]);
    expect(ctx.status.value).toBe('idle');
  });

  it('竞态：旧请求晚到被丢弃', async () => {
    let resolveOld: (v: string[]) => void = () => {};
    const fetch = vi
      .fn()
      .mockImplementationOnce(() => new Promise<string[]>((r) => (resolveOld = r)))
      .mockResolvedValueOnce(['new']);
    const ctx = withScope(() => useAsyncSuggest<string>({ fetch, debounce: 0 }));
    ctx.setKeyword('old');
    vi.advanceTimersByTime(1);
    ctx.setKeyword('new');
    vi.advanceTimersByTime(1);
    resolveOld(['old-stale']);
    await vi.runAllTimersAsync();
    expect(ctx.suggestions.value).toEqual(['new']);
  });

  it('请求失败归一到 error 状态', async () => {
    const err = new Error('network');
    const fetch = vi.fn().mockRejectedValue(err);
    const ctx = withScope(() => useAsyncSuggest<string>({ fetch, debounce: 0 }));
    ctx.setKeyword('x');
    vi.advanceTimersByTime(1);
    await vi.runAllTimersAsync();
    expect(ctx.status.value).toBe('error');
    expect(ctx.error.value).toBe(err);
  });

  it('run 立即请求，clear 复位', async () => {
    const fetch = vi.fn().mockResolvedValue(['z']);
    const ctx = withScope(() => useAsyncSuggest<string>({ fetch, immediate: true }));
    await vi.runAllTimersAsync();
    expect(fetch).toHaveBeenCalledWith('');
    expect(ctx.suggestions.value).toEqual(['z']);
    ctx.clear();
    expect(ctx.keyword.value).toBe('');
    expect(ctx.suggestions.value).toEqual([]);
    expect(ctx.status.value).toBe('idle');
  });
});
