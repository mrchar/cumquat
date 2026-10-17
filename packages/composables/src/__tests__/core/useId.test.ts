import { describe, expect, it } from 'vitest';
import { useId } from '../../index';

describe('useId', () => {
  it('生成带前缀的稳定唯一标识', () => {
    const a = useId('input');
    const b = useId('input');
    expect(a.value).toMatch(/^input-/);
    expect(a.value).not.toBe(b.value);
  });

  it('多次读取保持不变', () => {
    const id = useId();
    expect(id.value).toBe(id.value);
  });
});
