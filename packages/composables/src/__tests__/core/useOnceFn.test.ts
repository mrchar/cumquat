import { describe, expect, it } from 'vitest';
import { useOnceFn } from '../../index';
import { withScope } from '../helpers';

describe('useOnceFn', () => {
  it('首次调用执行并缓存返回值，后续调用返回同一结果', () => {
    let calls = 0;
    const ctx = withScope(() =>
      useOnceFn((value: number) => {
        calls += 1;
        return value * 2;
      }),
    );

    expect(ctx.called.value).toBe(false);
    expect(ctx.run(2)).toBe(4);
    expect(ctx.called.value).toBe(true);
    expect(ctx.run(10)).toBe(4);
    expect(calls).toBe(1);
  });

  it('异步函数返回同一个 Promise', async () => {
    let calls = 0;
    const ctx = withScope(() =>
      useOnceFn(async () => {
        calls += 1;
        return 'ok';
      }),
    );

    const first = ctx.run();
    const second = ctx.run();
    expect(first).toBe(second);
    await expect(first).resolves.toBe('ok');
    expect(calls).toBe(1);
  });

  it('回调内重入不会重复执行', () => {
    let calls = 0;
    const ctx = withScope(() => {
      const once = useOnceFn((): number => {
        calls += 1;
        once.run();
        return calls;
      });
      return once;
    });

    expect(ctx.run()).toBe(1);
    expect(calls).toBe(1);
  });

  it('reset 后可以再次执行', () => {
    let calls = 0;
    const ctx = withScope(() =>
      useOnceFn(() => {
        calls += 1;
        return calls;
      }),
    );

    expect(ctx.run()).toBe(1);
    ctx.reset();
    expect(ctx.called.value).toBe(false);
    expect(ctx.run()).toBe(2);
    expect(calls).toBe(2);
  });
});
