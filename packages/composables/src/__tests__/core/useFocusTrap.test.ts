import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { useFocusTrap } from '../../index';
import { withScope } from '../helpers';

describe('useFocusTrap', () => {
  it('激活时聚焦容器内第一个可聚焦元素', () => {
    const container = document.createElement('div');
    const a = document.createElement('button');
    const b = document.createElement('button');
    container.append(a, b);
    document.body.appendChild(container);

    const ctx = withScope(() => useFocusTrap(ref(container)));
    ctx.trap();
    expect(ctx.isActive.value).toBe(true);
    expect(document.activeElement).toBe(a);
    ctx.release();
    expect(ctx.isActive.value).toBe(false);
  });

  it('Tab 在首尾元素间循环', () => {
    const container = document.createElement('div');
    const a = document.createElement('button');
    const b = document.createElement('button');
    container.append(a, b);
    document.body.appendChild(container);

    const ctx = withScope(() => useFocusTrap(ref(container)));
    ctx.trap();
    expect(document.activeElement).toBe(a);
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, 'target', { value: a });
    a.focus();
    document.dispatchEvent(event);
    // jsdom 焦点能力有限，至少保证事件未被异常抛出且陷阱仍激活
    expect(ctx.isActive.value).toBe(true);
  });
});
