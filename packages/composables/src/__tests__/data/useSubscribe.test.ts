import { describe, expect, it, vi } from 'vitest';
import { extractSubscribeFailure, subscribeErrorText, useSubscribe } from '../../index';
import { flushTimers, withScope } from '../helpers';

const tick = () => flushTimers(0);

describe('extractSubscribeFailure', () => {
  it('status 为 error 时返回失败信息', () => {
    expect(extractSubscribeFailure({ status: 'error', error: 'x' })).toEqual({ error: 'x' });
  });

  it('携带 error 字段时返回失败信息', () => {
    const err = new Error('boom');
    expect(extractSubscribeFailure({ error: err })).toEqual({ error: err });
  });

  it('仅有 message 时 error 回退为整个结果对象', () => {
    const result = { status: 'error', message: '稍后重试' };
    expect(extractSubscribeFailure(result)).toEqual({ error: result });
  });

  it('非对象或成功态返回 null', () => {
    expect(extractSubscribeFailure(undefined)).toBeNull();
    expect(extractSubscribeFailure({ status: 'success', data: 1 })).toBeNull();
    expect(extractSubscribeFailure({})).toBeNull();
  });
});

describe('subscribeErrorText', () => {
  it('优先 message，其次字符串与 Error.message，最后回退', () => {
    expect(subscribeErrorText({ message: '自定义', error: 'x' })).toBe('自定义');
    expect(subscribeErrorText('裸字符串')).toBe('裸字符串');
    expect(subscribeErrorText(new Error('err msg'))).toBe('err msg');
    expect(subscribeErrorText(undefined, '回退')).toBe('回退');
  });
});

describe('useSubscribe', () => {
  it('挂载时调用处理方法并在成功后渲染数据', async () => {
    const handler = vi.fn(async () => ({ status: 'success', data: 42 }));
    const ctx = withScope(() => useSubscribe<number>(handler));
    expect(handler).toHaveBeenCalledTimes(0);
    await tick();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(ctx.state.value.status).toBe('success');
    expect(ctx.data.value).toBe(42);
    expect(ctx.loading.value).toBe(false);
  });

  it('返回值导出错误时进入 error 态并保留旧数据', async () => {
    let callCount = 0;
    const handler = vi.fn(async () => {
      callCount += 1;
      return callCount === 1 ? { status: 'success', data: 10 } : { status: 'error', error: '失败' };
    });
    const ctx = withScope(() => useSubscribe<number>(handler));
    await tick();
    expect(ctx.data.value).toBe(10);

    await ctx.refresh();
    expect(ctx.state.value.status).toBe('error');
    expect(ctx.error.value).toBe('失败');
    expect(ctx.data.value).toBe(10); // 保留旧数据
    expect(ctx.isStale.value).toBe(true);
  });

  it('reject 时进入 error 态', async () => {
    const err = new Error('network');
    const ctx = withScope(() => useSubscribe<number>(async () => Promise.reject(err)));
    await tick();
    expect(ctx.state.value.status).toBe('error');
    expect(ctx.error.value).toBe(err);
  });

  it('无处理方法时保持 pending 不报错', async () => {
    const ctx = withScope(() => useSubscribe<number>());
    await tick();
    expect(ctx.state.value.status).toBe('pending');
    expect(ctx.loading.value).toBe(false);
  });

  it('refresh 重新调用处理方法', async () => {
    const handler = vi.fn(async () => ({ status: 'success', data: 1 }));
    const ctx = withScope(() => useSubscribe<number>(handler));
    await tick();
    expect(handler).toHaveBeenCalledTimes(1);
    await ctx.refresh();
    expect(handler).toHaveBeenCalledTimes(2);
  });
});
