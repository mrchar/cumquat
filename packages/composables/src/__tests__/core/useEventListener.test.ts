import { describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';
import { useEventListener } from '../../index';
import { withScope } from '../helpers';

describe('useEventListener', () => {
  it('绑定事件并可手动解绑', () => {
    const el = document.createElement('button');
    let count = 0;
    const ctx = withScope(() =>
      useEventListener(el, 'click', () => {
        count += 1;
      }),
    );
    el.click();
    expect(count).toBe(1);
    ctx.$stop();
    el.click();
    expect(count).toBe(1);
  });

  it('响应式目标变化时重新绑定', async () => {
    const a = document.createElement('button');
    const b = document.createElement('button');
    const target = ref<HTMLElement | null>(a);
    let count = 0;
    withScope(() =>
      useEventListener(target, 'click', () => {
        count += 1;
      }),
    );
    a.click();
    expect(count).toBe(1);
    target.value = b;
    await nextTick();
    a.click();
    expect(count).toBe(1);
    b.click();
    expect(count).toBe(2);
  });
});
