import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTypeahead } from '../../index';
import { withScope } from '../helpers';

function type(char: string) {
  return new KeyboardEvent('keydown', { key: char, bubbles: true });
}

describe('useTypeahead', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('按前缀匹配选项并回调索引', () => {
    const onMatch = vi.fn();
    const ctx = withScope(() =>
      useTypeahead({
        getLabels: () => ['Apple', 'Banana', 'Cherry'],
        onMatch,
      }),
    );
    ctx.onKeydown(type('b'));
    expect(onMatch).toHaveBeenCalledWith(1);
  });

  it('连续字符组成搜索串', () => {
    const onMatch = vi.fn();
    const ctx = withScope(() =>
      useTypeahead({
        getLabels: () => ['Apple', 'Apricot', 'Banana'],
        onMatch,
      }),
    );
    ctx.onKeydown(type('a'));
    ctx.onKeydown(type('p'));
    expect(onMatch).toHaveBeenLastCalledWith(1);
    expect(ctx.query.value).toBe('ap');
  });

  it('超过重置间隔后重新开始匹配', () => {
    const onMatch = vi.fn();
    const ctx = withScope(() =>
      useTypeahead({
        getLabels: () => ['Apple', 'Banana', 'Cherry'],
        onMatch,
        resetDelay: 300,
      }),
    );
    ctx.onKeydown(type('a'));
    vi.advanceTimersByTime(400);
    ctx.onKeydown(type('c'));
    expect(onMatch).toHaveBeenLastCalledWith(2);
    expect(ctx.query.value).toBe('c');
  });
});
