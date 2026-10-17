import { describe, expect, it } from 'vitest';
import { useToggle } from '../../index';

describe('useToggle', () => {
  it('初始值与取反', () => {
    const t = useToggle(true);
    expect(t.value.value).toBe(true);
    t.toggle();
    expect(t.value.value).toBe(false);
    t.setTrue();
    expect(t.value.value).toBe(true);
    t.setFalse();
    expect(t.value.value).toBe(false);
  });

  it('toggle 支持显式目标值', () => {
    const t = useToggle(false);
    t.toggle(true);
    expect(t.value.value).toBe(true);
    t.toggle(true);
    expect(t.value.value).toBe(true);
  });
});
