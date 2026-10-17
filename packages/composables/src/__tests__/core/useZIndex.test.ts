import { describe, expect, it } from 'vitest';
import { resetGlobalZIndex, useZIndex } from '../../index';

describe('useZIndex', () => {
  it('nextZIndex 全局单调递增', () => {
    resetGlobalZIndex(2000);
    const a = useZIndex();
    const b = useZIndex();
    const first = a.nextZIndex();
    const second = b.nextZIndex();
    expect(second).toBe(first + 1);
    expect(a.currentZIndex.value).toBe(first);
    expect(b.currentZIndex.value).toBe(second);
  });
});
