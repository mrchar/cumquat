import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useScrollIntoView } from '../../index';

describe('useScrollIntoView', () => {
  it('调用目标元素的 scrollIntoView', () => {
    const el = document.createElement('div');
    const spy = vi.spyOn(el, 'scrollIntoView').mockImplementation(() => {});
    const target = ref(el);
    const scrollIntoView = useScrollIntoView(target);
    scrollIntoView();
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }));
    spy.mockRestore();
  });

  it('目标为空时安全跳过', () => {
    const scrollIntoView = useScrollIntoView();
    expect(() => scrollIntoView()).not.toThrow();
  });
});
