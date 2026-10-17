import { describe, expect, it } from 'vitest';
import { createLoadingService, useLoadingService } from '../../index';

describe('useLoadingService', () => {
  it('计数式开始/结束，多次加载合并为一个 loading', () => {
    const service = createLoadingService();
    const stop1 = service.start();
    const stop2 = service.start();
    expect(service.count.value).toBe(2);
    expect(service.loading.value).toBe(true);
    stop1();
    expect(service.loading.value).toBe(true);
    stop2();
    expect(service.loading.value).toBe(false);
  });

  it('finish 不会低于 0', () => {
    const service = createLoadingService();
    service.finish();
    expect(service.count.value).toBe(0);
  });

  it('wrap 包裹异步任务，失败也会结束计数', async () => {
    const service = createLoadingService();
    const success = service.wrap(Promise.resolve(1));
    await expect(success).resolves.toBe(1);
    expect(service.loading.value).toBe(false);

    const failure = service.wrap(Promise.reject(new Error('x')));
    await expect(failure).rejects.toThrow('x');
    expect(service.loading.value).toBe(false);
  });

  it('clear 归零', () => {
    const service = createLoadingService();
    service.start();
    service.start();
    service.clear();
    expect(service.count.value).toBe(0);
    expect(service.loading.value).toBe(false);
  });

  it('全局单例稳定可用', () => {
    const a = useLoadingService();
    const b = useLoadingService();
    expect(a).toBe(b);
  });
});
