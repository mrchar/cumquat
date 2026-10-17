import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useClickOutside } from '../../index';
import { withScope } from '../helpers';

describe('useClickOutside', () => {
  it('点击外部触发回调', () => {
    const inside = document.createElement('div');
    document.body.appendChild(inside);
    const handler = vi.fn();
    withScope(() => useClickOutside(ref(inside), handler));

    const outside = document.createElement('div');
    document.body.appendChild(outside);
    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);

    inside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('enabled=false 时不触发', () => {
    const inside = document.createElement('div');
    const handler = vi.fn();
    withScope(() => useClickOutside(ref(inside), handler, { enabled: ref(false) }));
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(handler).not.toHaveBeenCalled();
  });
});
