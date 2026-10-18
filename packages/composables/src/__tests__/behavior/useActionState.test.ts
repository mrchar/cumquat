import { describe, expect, it, vi } from 'vitest';
import { actionErrorText, useActionState, useActionValue } from '../../index';
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

  it('返回值导出 status: error 时归一为失败', async () => {
    const onError = vi.fn();
    const ctx = withScope(() =>
      useActionState(async () => ({ status: 'error', error: '库存不足' }), { onError }),
    );
    await ctx.run();
    expect(ctx.error.value).toBe('库存不足');
    expect(onError).toHaveBeenCalledWith('库存不足');
  });

  it('返回值携带 error 字段时归一为失败', async () => {
    const err = new Error('boom');
    const onError = vi.fn();
    const ctx = withScope(() => useActionState(async () => ({ error: err }), { onError }));
    await ctx.run();
    expect(ctx.error.value).toBe(err);
  });

  it('返回值携带 message 时 error 存放原始对象供文案归一', async () => {
    const ctx = withScope(() =>
      useActionState(async () => ({ status: 'error', message: '请稍后重试' })),
    );
    await ctx.run();
    expect(actionErrorText(ctx.error.value)).toBe('请稍后重试');
  });
});

describe('actionErrorText', () => {
  it('优先取 message，其次字符串与 Error.message，最后回退', () => {
    expect(actionErrorText({ message: '自定义文案', error: 'x' })).toBe('自定义文案');
    expect(actionErrorText('裸字符串')).toBe('裸字符串');
    expect(actionErrorText(new Error('error message'))).toBe('error message');
    expect(actionErrorText(undefined, '回退文案')).toBe('回退文案');
  });
});

describe('useActionValue', () => {
  it('无动作时 commit 直接成功', async () => {
    const ctx = withScope(() => useActionValue());
    expect(await ctx.commit({})).toBe(true);
  });

  it('动作失败时记录 error、执行 revert 并返回 false', async () => {
    const revert = vi.fn();
    const ctx = withScope(() => useActionValue());
    const ok = await ctx.commit({
      execute: () => Promise.reject('网络错误'),
      revert,
    });
    expect(ok).toBe(false);
    expect(revert).toHaveBeenCalledTimes(1);
    expect(ctx.error.value).toBe('网络错误');
    expect(ctx.pending.value).toBe(false);
  });

  it('返回值导出错误时同样回退', async () => {
    const revert = vi.fn();
    const ctx = withScope(() => useActionValue());
    const ok = await ctx.commit({
      execute: () => Promise.resolve({ status: 'error', error: '余额不足' }),
      revert,
    });
    expect(ok).toBe(false);
    expect(revert).toHaveBeenCalledTimes(1);
    expect(ctx.error.value).toBe('余额不足');
  });

  it('动作成功时返回 true 且不回退', async () => {
    const revert = vi.fn();
    const ctx = withScope(() => useActionValue());
    const ok = await ctx.commit({ execute: () => Promise.resolve('saved'), revert });
    expect(ok).toBe(true);
    expect(revert).not.toHaveBeenCalled();
  });

  it('pending 期间重复 commit 被忽略', async () => {
    let resolve: () => void = () => {};
    const ctx = withScope(() => useActionValue());
    const first = ctx.commit({ execute: () => new Promise<void>((r) => (resolve = r)) });
    const second = await ctx.commit({ execute: () => 'again' });
    expect(second).toBe(false);
    resolve();
    expect(await first).toBe(true);
  });
});
