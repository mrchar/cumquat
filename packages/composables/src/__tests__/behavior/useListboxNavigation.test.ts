import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useListboxNavigation } from '../../index';
import { withScope } from '../helpers';

function key(name: string) {
  return new KeyboardEvent('keydown', {
    key: name,
    bubbles: true,
    cancelable: true,
  });
}

describe('useListboxNavigation', () => {
  it('初始 -1，首次下键落到首项', () => {
    const ctx = withScope(() => useListboxNavigation({ count: 3 }));
    expect(ctx.activeIndex.value).toBe(-1);
    ctx.onKeydown(key('ArrowDown'));
    expect(ctx.activeIndex.value).toBe(0);
  });

  it('跳过禁用项并循环', () => {
    const ctx = withScope(() =>
      useListboxNavigation({
        count: 4,
        initialIndex: 0,
        isItemDisabled: (i) => i === 1 || i === 3,
      }),
    );
    ctx.moveNext();
    expect(ctx.activeIndex.value).toBe(2);
    ctx.moveNext();
    expect(ctx.activeIndex.value).toBe(0);
    ctx.movePrev();
    expect(ctx.activeIndex.value).toBe(2);
  });

  it('非循环模式到边界停止', () => {
    const ctx = withScope(() => useListboxNavigation({ count: 2, initialIndex: 1, loop: false }));
    ctx.moveNext();
    expect(ctx.activeIndex.value).toBe(1);
  });

  it('Home/End 跳到首个/末个可用项', () => {
    const ctx = withScope(() =>
      useListboxNavigation({
        count: 5,
        isItemDisabled: (i) => i === 0 || i === 4,
      }),
    );
    ctx.onKeydown(key('End'));
    expect(ctx.activeIndex.value).toBe(3);
    ctx.onKeydown(key('Home'));
    expect(ctx.activeIndex.value).toBe(1);
  });

  it('Enter 触发 onSelect，禁用项不触发', () => {
    const onSelect = vi.fn();
    const ctx = withScope(() =>
      useListboxNavigation({
        count: 3,
        initialIndex: 1,
        isItemDisabled: (i) => i === 1,
        onSelect,
      }),
    );
    ctx.onKeydown(key('Enter'));
    expect(onSelect).not.toHaveBeenCalled();
    ctx.setActiveIndex(0);
    ctx.onKeydown(key(' '));
    expect(onSelect).toHaveBeenCalledWith(0);
  });

  it('horizontal 方向只响应左右键', () => {
    const ctx = withScope(() => useListboxNavigation({ count: 3, orientation: 'horizontal' }));
    ctx.onKeydown(key('ArrowDown'));
    expect(ctx.activeIndex.value).toBe(-1);
    ctx.onKeydown(key('ArrowRight'));
    expect(ctx.activeIndex.value).toBe(0);
  });

  it('count 响应式变化与 reset', () => {
    const count = ref(2);
    const ctx = withScope(() => useListboxNavigation({ count, initialIndex: 1 }));
    ctx.setActiveIndex(5);
    expect(ctx.activeIndex.value).toBe(1);
    count.value = 5;
    ctx.reset();
    expect(ctx.activeIndex.value).toBe(1);
  });
});
