import { describe, expect, it, vi } from 'vitest';
import { useFocusReturn } from '../../index';
import { withScope } from '../helpers';

describe('useFocusReturn', () => {
  it('record 后 restore 将焦点归还', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const ctx = withScope(() => useFocusReturn({ autoRestore: false }));
    ctx.record();
    const other = document.createElement('input');
    document.body.appendChild(other);
    other.focus();
    expect(document.activeElement).toBe(other);
    ctx.restore();
    expect(document.activeElement).toBe(trigger);
  });

  it('元素脱离文档后 restore 安全跳过', () => {
    const trigger = document.createElement('button');
    const ctx = withScope(() => useFocusReturn({ autoRestore: false }));
    vi.spyOn(document, 'activeElement', 'get').mockReturnValue(trigger);
    ctx.record();
    expect(() => ctx.restore()).not.toThrow();
    vi.restoreAllMocks();
  });
});
