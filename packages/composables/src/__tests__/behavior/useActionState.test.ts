import { describe, expect, it, vi } from 'vitest';
import { useActionState } from '../../index';
import { withScope } from '../helpers';

describe('useActionState', () => {
  it('执行期间 pending 并派生 disabled', async () => {
    let resolve: (v: string) => void = () => {};
    const action = vi.fn(() => new Promise<string>((r) => (resolve = r)));
    const ctx = withScope(() => useActionState(action));
    const promise = ctx.run();
    expect(ctx.pending.value).toBe(true);
    expect(ctx.disabled.value).toBe(true);
    resolve('done');
    const result = await promise;
    expect(result).toBe('done');
    expect(ctx.pending.value).toBe(false);
    expect(ctx.disabled.value).toBe(false);
  });

  it('pending 中重复调用被忽略', async () => {
    let resolve: () => void = () => {};
    const action = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    const ctx = withScope(() => useActionState(action));
    ctx.run();
    await ctx.run();
    expect(action).toHaveBeenCalledTimes(1);
    resolve();
    await Promise.resolve();
  });

  it('外部 disabled 条件阻止执行并体现在状态上', () => {
    const action = vi.fn();
    const ctx = withScope(() => useActionState(action, { disabled: () => true }));
    expect(ctx.disabled.value).toBe(true);
    void ctx.run();
    expect(action).not.toHaveBeenCalled();
  });

  it('异常归一到 error，不抛出', async () => {
    const err = new Error('fail');
    const onError = vi.fn();
    const ctx = withScope(() => useActionState(() => Promise.reject(err), { onError }));
    const result = await ctx.run();
    expect(result).toBeUndefined();
    expect(ctx.error.value).toBe(err);
    expect(onError).toHaveBeenCalledWith(err);
  });

  it('onSuccess / onFinally 被调用', async () => {
    const onSuccess = vi.fn();
    const onFinally = vi.fn();
    const ctx = withScope(() =>
      useActionState(async (n: number) => n + 1, { onSuccess, onFinally }),
    );
    await ctx.run(1);
    expect(onSuccess).toHaveBeenCalledWith(2);
    expect(onFinally).toHaveBeenCalled();
  });

  it('无动作时 run 安全返回 undefined', async () => {
    const ctx = withScope(() => useActionState());
    expect(await ctx.run()).toBeUndefined();
    expect(ctx.pending.value).toBe(false);
  });
});
