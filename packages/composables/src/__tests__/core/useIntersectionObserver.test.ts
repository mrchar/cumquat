import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useIntersectionObserver } from '../../index';
import { withScope } from '../helpers';

/** setup 中注册的 IntersectionObserver 桩实例类型 */
interface MockIntersectionObserver extends IntersectionObserver {
  trigger: (target: Element, isIntersecting?: boolean) => void;
}

describe('useIntersectionObserver', () => {
  it('初始不可见', () => {
    const el = document.createElement('div');
    const target = ref(el);
    const { isIntersecting } = withScope(() => useIntersectionObserver(target));
    expect(isIntersecting.value).toBe(false);
  });

  it('回调触发后更新可见状态', () => {
    const el = document.createElement('div');
    const target = ref(el);
    const instances: MockIntersectionObserver[] = [];
    const Ctor = globalThis.IntersectionObserver;
    vi.spyOn(globalThis, 'IntersectionObserver').mockImplementation(function (callback, options) {
      const instance = new Ctor(callback, options) as MockIntersectionObserver;
      instances.push(instance);
      return instance as unknown as IntersectionObserver;
    });

    const { isIntersecting, ratio } = withScope(() => useIntersectionObserver(target));
    expect(instances).toHaveLength(1);
    instances[0].trigger(el, true);
    expect(isIntersecting.value).toBe(true);
    expect(ratio.value).toBe(1);
    instances[0].trigger(el, false);
    expect(isIntersecting.value).toBe(false);
    vi.restoreAllMocks();
  });

  it('once: 首次进入后停止监听', () => {
    const el = document.createElement('div');
    const target = ref(el);
    const instances: MockIntersectionObserver[] = [];
    const Ctor = globalThis.IntersectionObserver;
    const disconnect = vi.fn();
    vi.spyOn(globalThis, 'IntersectionObserver').mockImplementation(function (callback, options) {
      const instance = new Ctor(callback, options) as MockIntersectionObserver;
      vi.spyOn(instance, 'disconnect').mockImplementation(disconnect);
      instances.push(instance);
      return instance as unknown as IntersectionObserver;
    });
    const { isIntersecting } = withScope(() => useIntersectionObserver(target, { once: true }));
    instances[0].trigger(el, true);
    expect(isIntersecting.value).toBe(true);
    expect(disconnect).toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});
