import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { useScroll } from '../../index';
import { withScope } from '../helpers';

describe('useScroll', () => {
  it('读取容器滚动位置与方向', () => {
    const el = document.createElement('div');
    const target = ref<HTMLElement>(el);
    const ctx = withScope(() => useScroll(target, { throttle: false }));
    Object.defineProperty(el, 'scrollTop', { value: 20, configurable: true });
    el.dispatchEvent(new Event('scroll'));
    expect(ctx.y.value).toBe(20);
    expect(ctx.directionY.value).toBe('down');
  });
});
