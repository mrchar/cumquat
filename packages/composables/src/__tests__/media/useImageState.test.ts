import { describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { useImageState } from '../../index';
import { withScope } from '../helpers';

describe('useImageState', () => {
  it('有 src 初始进入 loading，load 事件后置为 loaded', () => {
    const src = ref('https://example.com/a.png');
    const ctx = withScope(() => useImageState(src));
    expect(ctx.status.value).toBe('loading');
    expect(ctx.isLoading.value).toBe(true);
    expect(ctx.shouldLoad.value).toBe(true);

    const onLoad = vi.fn();
    const withCb = withScope(() => useImageState(src, { onLoad }));
    const event = new Event('load');
    withCb.onLoad(event);
    expect(withCb.status.value).toBe('loaded');
    expect(withCb.isLoaded.value).toBe(true);
    expect(onLoad).toHaveBeenCalledWith(event);
  });

  it('无 src 时为 idle', () => {
    const ctx = withScope(() => useImageState(ref(undefined)));
    expect(ctx.status.value).toBe('idle');
  });

  it('error 事件置为错误态', () => {
    const ctx = withScope(() => useImageState('https://example.com/x.png'));
    ctx.onError(new Event('error'));
    expect(ctx.isError.value).toBe(true);
    expect(ctx.status.value).toBe('error');
  });

  it('reload 重新进入 loading', () => {
    const ctx = withScope(() => useImageState('https://example.com/x.png'));
    ctx.onError(new Event('error'));
    ctx.reload();
    expect(ctx.status.value).toBe('loading');
  });

  it('懒加载：进入视口前 shouldLoad=false，触发后放行', async () => {
    const el = document.createElement('div');
    let observer: { trigger: (el: Element, visible?: boolean) => void };
    const Ctor = globalThis.IntersectionObserver;
    vi.spyOn(globalThis, 'IntersectionObserver').mockImplementation(function (callback, options) {
      const instance = new Ctor(callback, options) as unknown as {
        trigger: (el: Element, visible?: boolean) => void;
      };
      observer = instance;
      return instance as unknown as IntersectionObserver;
    });
    const ctx = withScope(() =>
      useImageState('https://example.com/lazy.png', {
        lazy: true,
        target: ref(el),
      }),
    );
    expect(ctx.shouldLoad.value).toBe(false);
    observer!.trigger(el, true);
    await nextTick();
    expect(ctx.shouldLoad.value).toBe(true);
    expect(ctx.status.value).toBe('loading');
    vi.restoreAllMocks();
  });

  it('懒加载但未提供 target 时不阻塞', () => {
    const ctx = withScope(() => useImageState('https://example.com/x.png', { lazy: true }));
    expect(ctx.shouldLoad.value).toBe(true);
  });
});
