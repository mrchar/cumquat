import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { usePopoverModel } from '../../index';
import { withScope } from '../helpers';

describe('usePopoverModel', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('click 触发：点击切换开合', () => {
    const ctx = withScope(() => usePopoverModel({ trigger: 'click' }));
    expect(ctx.triggerProps.value.onMouseenter).toBeUndefined();
    ctx.triggerProps.value.onClick!();
    expect(ctx.isOpen.value).toBe(true);
    ctx.triggerProps.value.onClick!();
    expect(ctx.isOpen.value).toBe(false);
  });

  it('focus 触发：聚焦打开、失焦关闭', async () => {
    const ctx = withScope(() => usePopoverModel({ trigger: 'focus' }));
    const props = ctx.triggerProps.value;
    props.onFocus!();
    expect(ctx.isOpen.value).toBe(true);
    await nextTick();
    expect(ctx.rendered.value).toBe(true);
    props.onBlur!();
    expect(ctx.isOpen.value).toBe(false);
  });

  it('hover 触发：按延迟开合，浮层本体共享悬停事件', async () => {
    const ctx = withScope(() =>
      usePopoverModel({ trigger: 'hover', openDelay: 100, closeDelay: 100 }),
    );
    expect(typeof ctx.floatingHoverProps.value.onMouseenter).toBe('function');
    ctx.triggerProps.value.onMouseenter!();
    await vi.advanceTimersByTimeAsync(100);
    expect(ctx.isOpen.value).toBe(true);

    // 离开触发器进入浮层：hide 计时被进入浮层取消
    ctx.triggerProps.value.onMouseleave!();
    await vi.advanceTimersByTimeAsync(50);
    ctx.floatingHoverProps.value.onMouseenter!();
    await vi.advanceTimersByTimeAsync(200);
    expect(ctx.isOpen.value).toBe(true);

    ctx.floatingHoverProps.value.onMouseleave!();
    await vi.advanceTimersByTimeAsync(100);
    expect(ctx.isOpen.value).toBe(false);
  });

  it('manual 触发不绑定事件，只接受命令式开合', () => {
    const ctx = withScope(() => usePopoverModel({ trigger: 'manual' }));
    expect(ctx.triggerProps.value.onClick).toBeUndefined();
    ctx.open();
    expect(ctx.isOpen.value).toBe(true);
    ctx.close();
    expect(ctx.isOpen.value).toBe(false);
  });
});
