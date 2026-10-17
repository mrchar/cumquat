import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { useRovingFocus } from '../../index';
import { withScope } from '../helpers';

function key(key: string) {
  return new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
}

describe('useRovingFocus', () => {
  it('方向键移动激活项并跳过禁用项', () => {
    const count = ref(4);
    const ctx = withScope(() =>
      useRovingFocus({
        count,
        initialIndex: 0,
        isItemDisabled: (index) => index === 1,
        autofocus: false,
      }),
    );
    ctx.onKeydown(key('ArrowDown'));
    expect(ctx.activeIndex.value).toBe(2);
    ctx.onKeydown(key('ArrowDown'));
    expect(ctx.activeIndex.value).toBe(3);
  });

  it('Home/End 跳到首尾可用项，循环模式回到开头', () => {
    const ctx = withScope(() =>
      useRovingFocus({
        count: 3,
        initialIndex: 1,
        autofocus: false,
      }),
    );
    ctx.onKeydown(key('End'));
    expect(ctx.activeIndex.value).toBe(2);
    ctx.onKeydown(key('ArrowDown'));
    expect(ctx.activeIndex.value).toBe(0);
    ctx.onKeydown(key('Home'));
    expect(ctx.activeIndex.value).toBe(0);
  });

  it('非循环模式到达边界不再移动', () => {
    const ctx = withScope(() =>
      useRovingFocus({
        count: 2,
        initialIndex: 1,
        loop: false,
        autofocus: false,
      }),
    );
    ctx.onKeydown(key('ArrowDown'));
    expect(ctx.activeIndex.value).toBe(1);
  });

  it('水平方向只响应左右键', () => {
    const ctx = withScope(() =>
      useRovingFocus({
        count: 3,
        orientation: 'horizontal',
        autofocus: false,
      }),
    );
    ctx.onKeydown(key('ArrowDown'));
    expect(ctx.activeIndex.value).toBe(0);
    ctx.onKeydown(key('ArrowRight'));
    expect(ctx.activeIndex.value).toBe(1);
  });

  it('getTabIndex 仅激活项为 0', () => {
    const ctx = withScope(() => useRovingFocus({ count: 2, initialIndex: 1, autofocus: false }));
    expect(ctx.getTabIndex(0)).toBe(-1);
    expect(ctx.getTabIndex(1)).toBe(0);
  });
});
