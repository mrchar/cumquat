import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useMediaQuery } from '../../index';
import { withScope } from '../helpers';

describe('useMediaQuery', () => {
  it('按 matchMedia 结果返回 matches 并订阅变化', () => {
    const listeners = new Set<(ev: MediaQueryListEvent) => void>();
    const mql = {
      matches: false,
      addEventListener: (_: string, fn: (ev: MediaQueryListEvent) => void) => listeners.add(fn),
      removeEventListener: () => {},
    } as unknown as MediaQueryList;
    vi.spyOn(window, 'matchMedia').mockImplementation(() => mql);

    const query = ref('(min-width: 768px)');
    const matches = withScope(() => useMediaQuery(query));
    expect(matches.value).toBe(false);
    listeners.forEach((fn) => fn({ matches: true } as MediaQueryListEvent));
    expect(matches.value).toBe(true);
    vi.restoreAllMocks();
  });
});
