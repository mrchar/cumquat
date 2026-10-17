import { describe, expect, it, vi } from 'vitest';
import { useAsyncState } from '../../index';
import { withScope } from '../helpers';

describe('useAsyncState', () => {
  it('成功流转 pending → success', async () => {
    const fetcher = vi.fn().mockResolvedValue('ok');
    const ctx = withScope(() => useAsyncState(fetcher, { immediate: false }));
    expect(ctx.state.value.status).toBe('success');
    const promise = ctx.run('a');
    expect(ctx.loading.value).toBe(true);
    expect(ctx.state.value.status).toBe('pending');
    const data = await promise;
    expect(data).toBe('ok');
    expect(ctx.state.value.status).toBe('success');
    expect(ctx.state.value.data).toBe('ok');
    expect(ctx.loading.value).toBe(false);
  });

  it('失败流转 error 并归一错误', async () => {
    const err = new Error('boom');
    const fetcher = vi.fn().mockRejectedValue(err);
    const onError = vi.fn();
    const ctx = withScope(() => useAsyncState(fetcher, { immediate: false, onError }));
    const data = await ctx.run();
    expect(data).toBeUndefined();
    expect(ctx.state.value.status).toBe('error');
    expect(ctx.state.value.error).toBe(err);
    expect(ctx.error.value).toBe(err);
    expect(onError).toHaveBeenCalledWith(err);
  });

  it('刷新期间保留旧数据并标记 stale', async () => {
    let resolveFirst: (v: string) => void = () => {};
    const fetcher = vi
      .fn()
      .mockImplementationOnce(() => new Promise<string>((r) => (resolveFirst = r)))
      .mockResolvedValueOnce('next');
    const ctx = withScope(() => useAsyncState(fetcher, { immediate: false }));

    const first = ctx.run();
    resolveFirst('first');
    await first;
    const refresh = ctx.run();
    expect(ctx.state.value.isStale).toBe(true);
    expect(ctx.state.value.data).toBe('first');
    await refresh;
    expect(ctx.state.value.isStale).toBe(false);
    expect(ctx.state.value.data).toBe('next');
  });

  it('竞态：过期请求完成不覆盖新结果', async () => {
    let resolveOld: (v: string) => void = () => {};
    const fetcher = vi
      .fn()
      .mockImplementationOnce(() => new Promise<string>((r) => (resolveOld = r)))
      .mockResolvedValueOnce('new');
    const ctx = withScope(() => useAsyncState(fetcher, { immediate: false }));

    const oldReq = ctx.run('old');
    const newReq = ctx.run('new');
    resolveOld('old');
    await oldReq;
    await newReq;
    expect(ctx.state.value.data).toBe('new');
  });

  it('retry 使用最近一次参数', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue('retried');
    const ctx = withScope(() => useAsyncState(fetcher, { immediate: false }));
    await ctx.run('page-2');
    expect(fetcher).toHaveBeenLastCalledWith('page-2');
    await ctx.retry();
    expect(fetcher).toHaveBeenLastCalledWith('page-2');
    expect(ctx.state.value.status).toBe('success');
    expect(ctx.state.value.data).toBe('retried');
  });

  it('immediate 立即执行', async () => {
    const fetcher = vi.fn().mockResolvedValue('init');
    const ctx = withScope(() => useAsyncState(fetcher, { immediateArgs: ['z'] as unknown as [] }));
    expect(fetcher).toHaveBeenCalledWith('z');
    await Promise.resolve();
    await Promise.resolve();
    expect(ctx.state.value.data).toBe('init');
  });
});
