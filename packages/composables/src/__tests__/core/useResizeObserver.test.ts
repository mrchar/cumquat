import { describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';
import { useResizeObserver } from '../../index';
import { withScope } from '../helpers';

describe('useResizeObserver', () => {
  it('目标为 null 时尺寸为 0', () => {
    const target = ref<HTMLElement | null>(null);
    const { width, height } = withScope(() => useResizeObserver(target));
    expect(width.value).toBe(0);
    expect(height.value).toBe(0);
  });

  it('元素挂载后通过观察者回调得到尺寸', async () => {
    const el = document.createElement('div');
    Object.defineProperty(el, 'offsetWidth', { value: 120, configurable: true });
    Object.defineProperty(el, 'offsetHeight', { value: 40, configurable: true });
    const target = ref<HTMLElement | null>(null);
    const { width } = withScope(() => useResizeObserver(target));
    target.value = el;
    await nextTick();
    expect(width.value).toBe(120);
  });
});
